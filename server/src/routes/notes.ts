import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';
import { getConfig } from '../config';
import {
  generateSOAPNote as ollamaGenerateSOAP,
  isAvailable as isOllamaAvailable,
} from '../integrations/ollama/client';

const router = Router();

// Mock AI SOAP note generator based on transcript keywords
function generateSoapNote(transcript: string, patientName?: string): {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  procedureCode: string;
} {
  const lower = transcript.toLowerCase();

  if (lower.includes('pain') || lower.includes('ache') || lower.includes('hurt')) {
    return {
      subjective: `Patient ${patientName ?? ''} presents with chief complaint of dental pain. Patient reports intermittent discomfort in the lower right quadrant, rated 5/10 on pain scale. Pain is described as sharp and provoked by cold stimuli. No spontaneous pain at rest. Patient reports pain has been present for approximately 2 weeks.`,
      objective: `Vital signs stable. Extra-oral exam: No lymphadenopathy, no facial asymmetry. Intra-oral exam: Moderate plaque accumulation noted. Tooth #30 exhibits deep carious lesion on the occlusal-distal surface. Cold test: prolonged response on #30 (>15 seconds), normal on adjacent teeth. Percussion: slightly tender on #30. Probing depths within normal limits. Periapical radiograph reveals caries approaching pulp on #30 with no periapical pathology.`,
      assessment: `Deep carious lesion #30 (D2 — occlusal-distal) with possible pulpal involvement. Rule out irreversible pulpitis.`,
      plan: `1. Indirect pulp cap and composite restoration #30. 2. Monitor pulpal response at 6-week follow-up. 3. If symptoms persist or worsen, refer for endodontic evaluation. 4. Reinforce oral hygiene instructions. 5. Rx: ibuprofen 400mg PRN for discomfort. Patient verbalized understanding and consents to treatment plan.`,
      procedureCode: 'D2391',
    };
  }

  if (lower.includes('cleaning') || lower.includes('hygiene') || lower.includes('prophy')) {
    return {
      subjective: `Patient ${patientName ?? ''} presents for routine hygiene appointment. No chief complaints. Patient reports good home care with twice daily brushing and occasional flossing. Last professional cleaning approximately 6 months ago.`,
      objective: `Extra-oral exam: WNL. Intra-oral exam: Mild supragingival calculus noted on mandibular anteriors. Slight bleeding on probing at #3, #14, #19 interproximals. Probing depths 2-3mm throughout. No furcation involvement. Plaque index: 15%. Full-mouth radiographs reviewed — crestal bone levels stable, no new carious lesions identified.`,
      assessment: `Mild gingivitis secondary to plaque accumulation. Dentition otherwise healthy with no new pathology identified.`,
      plan: `1. Adult prophylaxis (D1110) completed — supragingival scaling, polishing, and fluoride application. 2. Oral hygiene instructions reinforced — emphasis on interdental cleaning technique. 3. Recommended power toothbrush. 4. Recall in 6 months. Patient tolerated procedure well and left without complaints.`,
      procedureCode: 'D1110',
    };
  }

  if (lower.includes('extraction') || lower.includes('pull') || lower.includes('remove')) {
    return {
      subjective: `Patient ${patientName ?? ''} presents for extraction of non-restorable tooth. Patient reports no acute pain at this time. Medical history reviewed — no contraindications to dental treatment. Patient takes no blood thinners. No known drug allergies.`,
      objective: `Extra-oral: WNL. Intra-oral: Tooth #17 is non-restorable due to extensive carious destruction with < 2mm sound tooth structure coronal to alveolar crest. Soft tissue: WNL. Periapical radiograph confirms extensive caries with widened PDL space at apex.`,
      assessment: `Non-restorable tooth #17 — extraction indicated. No acute periapical pathology.`,
      plan: `1. Local anesthesia achieved with 2 carpules 2% lidocaine 1:100k epi. 2. Uncomplicated extraction #17 performed with elevators and forceps — intact socket, no complications. 3. Hemostasis achieved with gauze pressure. 4. Post-op instructions given verbally and in writing. 5. Rx: Amoxicillin 500mg TID x 7 days, ibuprofen 600mg q6h PRN. 6. Follow-up in 1 week. Patient tolerated procedure well.`,
      procedureCode: 'D7140',
    };
  }

  if (lower.includes('perio') || lower.includes('deep clean') || lower.includes('scaling')) {
    return {
      subjective: `Patient ${patientName ?? ''} presents for periodontal scaling and root planing. Patient reports bleeding gums when brushing and occasional bad breath. Smokes half a pack per day — counseled on cessation.`,
      objective: `Full-mouth periodontal charting: generalized probing depths 4-6mm with localized 7mm pockets at #3MB and #14DB. Bleeding on probing: 65%. CAL loss evident in posterior segments. Radiographic bone loss: horizontal pattern in posterior segments, up to 30% crestal bone loss. Furcation involvement Class I on #3, #14.`,
      assessment: `Generalized moderate chronic periodontitis. Exacerbated by smoking and suboptimal home care.`,
      plan: `1. Full-mouth SRP in two quadrants today (LR, LL) under local anesthesia. 2. Remaining two quadrants scheduled in 2 weeks. 3. Chlorhexidine 0.12% rinse BID x 2 weeks. 4. Smoking cessation counseling provided — referral to cessation program offered. 5. Re-evaluation 4-6 weeks post-SRP. 6. Maintenance intervals reduced to every 3 months. Patient accepts treatment plan.`,
      procedureCode: 'D4341',
    };
  }

  // Default: comprehensive exam
  return {
    subjective: `Patient ${patientName ?? ''} presents for comprehensive dental examination. No chief complaints today. Patient reports mild sensitivity to cold beverages. Last dental visit was over a year ago. Medical history: no significant systemic conditions. No known drug allergies. Current medications: none.`,
    objective: `Extra-oral exam: No lymphadenopathy, TMJ asymptomatic with full range of motion bilaterally, no clicking or crepitus. Intra-oral soft tissue exam: WNL — no suspicious lesions. Hard tissue exam: Moderate plaque accumulation. Multiple existing restorations in good condition. Tooth #3 has cracked cusp visible on transillumination. Cold test: positive response all teeth, WNL. Full-mouth series and panoramic radiograph taken and reviewed.`,
    assessment: `1. Cracked cusp syndrome #3. 2. Mild generalized gingivitis. 3. Two incipient carious lesions — #18 MO, #31 DO. 4. Existing restorations stable.`,
    plan: `1. Crown #3 to prevent further crack propagation — scheduled for next visit. 2. Composite restorations #18 MO and #31 DO scheduled. 3. Adult prophylaxis today. 4. Oral hygiene instruction with emphasis on flossing technique. 5. Fluoride varnish applied. 6. Recall in 6 months. Patient consents to proposed treatment plan, questions answered.`,
    procedureCode: 'D0150',
  };
}

// GET /notes - list notes, optionally filter by status
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query as { status?: string };

    const notes = await prisma.clinicalNote.findMany({
      where: status ? { status } : undefined,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        appointment: { select: { id: true, date: true, time: true, type: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET /notes/:id - single note with patient and appointment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const note = await prisma.clinicalNote.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        provider: true,
        appointment: true,
      },
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST /notes/generate - AI SOAP generation (Ollama with mock fallback)
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { transcript, patientId, appointmentId, procedureType } = req.body as {
      transcript?: string;
      patientId?: string;
      appointmentId?: string;
      procedureType?: string;
    };

    if (!transcript) {
      res.status(400).json({ error: 'transcript is required' });
      return;
    }

    let patientName = '';
    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true },
      });
      if (patient) patientName = `${patient.firstName} ${patient.lastName}`;
    }

    // Try Ollama first, fall back to mock generation
    let generated: {
      subjective: string;
      objective: string;
      assessment: string;
      plan: string;
      procedureCode?: string;
    };
    let aiGenerated = false;
    let model: string = 'mock';

    const config = getConfig();
    const ollamaEnabled = config.ollama.enabled;

    if (ollamaEnabled) {
      try {
        const available = await isOllamaAvailable();
        if (available) {
          const soapNote = await ollamaGenerateSOAP(transcript, patientName, procedureType);
          generated = { ...soapNote };
          aiGenerated = true;
          model = config.ollama.model;
        } else {
          // Ollama not running — use mock
          generated = generateSoapNote(transcript, patientName);
        }
      } catch (ollamaErr) {
        console.error('[notes] Ollama generation failed, falling back to mock:', ollamaErr);
        generated = generateSoapNote(transcript, patientName);
      }
    } else {
      generated = generateSoapNote(transcript, patientName);
    }

    await logActivity(
      'generate_note',
      'ClinicalNote',
      patientId ?? 'unknown',
      `${aiGenerated ? 'AI' : 'Mock'} SOAP note generated for patient${patientName ? ` ${patientName}` : ''}`,
      { appointmentId, procedureCode: generated.procedureCode, aiGenerated, model }
    );

    res.json({
      ...generated,
      transcript,
      patientId,
      appointmentId,
      status: 'draft',
      aiGenerated,
      model,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate note' });
  }
});

// POST /notes - create a new note
router.post('/', async (req: Request, res: Response) => {
  try {
    const note = await prisma.clinicalNote.create({
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
    });

    await logActivity(
      'create_note',
      'ClinicalNote',
      note.id,
      `Clinical note created for ${note.patient.firstName} ${note.patient.lastName}`
    );

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PATCH /notes/:id - update note fields
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.clinicalNote.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await logActivity(
      'update_note',
      'ClinicalNote',
      updated.id,
      `Clinical note updated`
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// PATCH /notes/:id/approve - approve a note
router.patch('/:id/approve', async (req: Request, res: Response) => {
  try {
    const note = await prisma.clinicalNote.update({
      where: { id: req.params.id },
      data: { status: 'approved' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'approve_note',
      'ClinicalNote',
      note.id,
      `Clinical note approved for ${note.patient.firstName} ${note.patient.lastName} by Dr. ${note.provider.lastName}`
    );

    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve note' });
  }
});

export default router;
