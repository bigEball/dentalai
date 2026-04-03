import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// ─── Multer config for file uploads ──────────────────────────────────────────

const uploadsDir = path.resolve(__dirname, '../../../data/uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are accepted'));
    }
  },
});

// ─── Mock AI findings pool ───────────────────────────────────────────────────

const FINDINGS_POOL = [
  { description: 'Possible interproximal decay on mesial surface', tooth: '3', severity: 'medium', confidence: 0.82, category: 'decay' },
  { description: 'Watch area — early demineralization noted', tooth: '14', severity: 'low', confidence: 0.71, category: 'watch' },
  { description: 'Calculus deposit detected on lingual surface', tooth: '24', severity: 'low', confidence: 0.88, category: 'calculus' },
  { description: 'Marginal bone level within normal limits', severity: 'low', confidence: 0.95, category: 'normal' },
  { description: 'Moderate horizontal bone loss in posterior region', severity: 'high', confidence: 0.91, category: 'bone_loss' },
  { description: 'Periapical radiolucency suggesting infection', tooth: '19', severity: 'high', confidence: 0.86, category: 'decay' },
  { description: 'Existing restoration appears intact, no recurrent caries', tooth: '30', severity: 'low', confidence: 0.93, category: 'normal' },
];

function pickRandomFindings(min = 2, max = 4) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...FINDINGS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((f) => ({ id: uuidv4(), ...f }));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /radiographs - list all studies with patient data
router.get('/', async (_req: Request, res: Response) => {
  try {
    const studies = await prisma.radiographStudy.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });

    // Parse JSON findings for each study
    const parsed = studies.map((s) => ({
      ...s,
      findings: (() => {
        try {
          return JSON.parse(s.findings);
        } catch {
          return s.findings;
        }
      })(),
    }));

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch radiograph studies' });
  }
});

// GET /radiographs/:id - single study with full parsed findings
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const study = await prisma.radiographStudy.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });

    if (!study) {
      res.status(404).json({ error: 'Radiograph study not found' });
      return;
    }

    let parsedFindings: unknown = study.findings;
    try {
      parsedFindings = JSON.parse(study.findings);
    } catch {
      // leave as string
    }

    res.json({ ...study, findings: parsedFindings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch radiograph study' });
  }
});

// POST /radiographs/upload - upload an X-ray image with metadata
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { patientId, type } = req.body as { patientId: string; type: string };

    if (!patientId) {
      res.status(400).json({ error: 'patientId is required' });
      return;
    }

    const validTypes = ['bitewing', 'periapical', 'panoramic', 'cephalometric'];
    const studyType = validTypes.includes(type) ? type : 'bitewing';

    // Generate mock AI findings
    const findings = pickRandomFindings();
    const today = new Date().toISOString().split('T')[0];

    const study = await prisma.radiographStudy.create({
      data: {
        patientId,
        date: today,
        type: studyType,
        findings: JSON.stringify(findings),
        imageUrl: `/uploads/${file.filename}`,
        providerNotes: '',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'upload_radiograph',
      'RadiographStudy',
      study.id,
      `${studyType} X-ray uploaded for ${study.patient.firstName} ${study.patient.lastName}`,
      { filename: file.filename, findingsCount: findings.length }
    );

    // Return with parsed findings
    res.status(201).json({
      ...study,
      findings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload radiograph' });
  }
});

// PATCH /radiographs/:id/notes - update provider notes
router.patch('/:id/notes', async (req: Request, res: Response) => {
  try {
    const { providerNotes } = req.body as { providerNotes: string };

    const study = await prisma.radiographStudy.update({
      where: { id: req.params.id },
      data: { providerNotes },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'update_radiograph_notes',
      'RadiographStudy',
      study.id,
      `Provider notes updated on ${study.type} for ${study.patient.firstName} ${study.patient.lastName}`
    );

    res.json(study);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update radiograph notes' });
  }
});

// POST /radiographs/:id/reviewed - mark as reviewed
router.post('/:id/reviewed', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { reviewedBy } = req.body as { reviewedBy?: string };

    const study = await prisma.radiographStudy.update({
      where: { id: req.params.id },
      data: {
        reviewedBy: reviewedBy ?? 'demo-user',
        reviewedDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'review_radiograph',
      'RadiographStudy',
      study.id,
      `${study.type} reviewed for ${study.patient.firstName} ${study.patient.lastName}`,
      { reviewedBy: study.reviewedBy, reviewedDate: today }
    );

    res.json(study);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark radiograph as reviewed' });
  }
});

export default router;
