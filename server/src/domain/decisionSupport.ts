import { prisma } from '../db/client';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendationCategory = 'perio' | 'restorative' | 'preventive' | 'referral';
export type RecommendationPriority = 'urgent' | 'high' | 'standard' | 'low';
export type RecommendationStatus = 'new' | 'reviewed' | 'accepted' | 'dismissed';

export interface Recommendation {
  id: string;
  patientId: string;
  patientName: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
  guidelineReference: string;
  suggestedProcedureCodes: string[];
  estimatedRevenue: number;
  status: RecommendationStatus;
  createdAt: string;
  dismissReason?: string;
}

export interface DashboardStats {
  totalRecommendations: number;
  byCategory: Record<RecommendationCategory, number>;
  byPriority: Record<RecommendationPriority, number>;
  estimatedRevenue: number;
  acceptanceRate: number;
  totalAccepted: number;
  totalDismissed: number;
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

const recommendations: Map<string, Recommendation> = new Map();

// ---------------------------------------------------------------------------
// Procedure code cost estimates (ADA CDT typical fees)
// ---------------------------------------------------------------------------

const PROCEDURE_COSTS: Record<string, number> = {
  D0120: 65,    // Periodic exam
  D0274: 75,    // Bitewings — four films
  D1110: 135,   // Prophylaxis — adult
  D1208: 45,    // Fluoride varnish
  D2740: 1200,  // Crown — porcelain/ceramic
  D2750: 1100,  // Crown — porcelain fused to high noble metal
  D2950: 350,   // Core buildup
  D3310: 800,   // Root canal — anterior
  D3320: 950,   // Root canal — premolar
  D3330: 1200,  // Root canal — molar
  D4341: 350,   // SRP — per quadrant
  D4910: 200,   // Periodontal maintenance
  D2391: 250,   // Resin composite — 1 surface posterior
  D2392: 320,   // Resin composite — 2 surfaces posterior
  D2393: 380,   // Resin composite — 3 surfaces posterior
};

function costForCodes(codes: string[]): number {
  return codes.reduce((sum, c) => sum + (PROCEDURE_COSTS[c] ?? 200), 0);
}

// ---------------------------------------------------------------------------
// Helpers — safe JSON parsing
// ---------------------------------------------------------------------------

function safeParseJSON(val: string | null | undefined): Record<string, unknown> | null {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers — date math
// ---------------------------------------------------------------------------

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

function isOlderThan(dateStr: string, referenceDate: Date): boolean {
  const d = new Date(dateStr);
  return d < referenceDate;
}

// ---------------------------------------------------------------------------
// Helpers — perio analysis
// ---------------------------------------------------------------------------

interface PerioAnalysisResult {
  deepPocketTeeth: string[];
  maxDepth: number;
  bleedingPercentage: number;
  hasFurcation: boolean;
  hasMobility: boolean;
  totalSites: number;
  bleedingSites: number;
}

function analyzePerioExam(exam: {
  pocketDepths: string;
  bleeding?: string | null;
  furcation?: string | null;
  mobility?: string | null;
}): PerioAnalysisResult {
  const depths = safeParseJSON(exam.pocketDepths) as Record<string, Record<string, number[]>> | null;
  const bleeding = safeParseJSON(exam.bleeding) as Record<string, Record<string, number[]>> | null;
  const furcation = safeParseJSON(exam.furcation) as Record<string, unknown> | null;
  const mobility = safeParseJSON(exam.mobility) as Record<string, number> | null;

  const deepPocketTeeth: Set<string> = new Set();
  let maxDepth = 0;
  let totalSites = 0;
  let bleedingSites = 0;

  if (depths) {
    for (const [tooth, surfaces] of Object.entries(depths)) {
      for (const [, readings] of Object.entries(surfaces as Record<string, number[]>)) {
        if (!Array.isArray(readings)) continue;
        for (const depth of readings) {
          totalSites++;
          if (typeof depth === 'number' && depth >= 5) {
            deepPocketTeeth.add(tooth);
          }
          if (typeof depth === 'number' && depth > maxDepth) {
            maxDepth = depth;
          }
        }
      }
    }
  }

  if (bleeding) {
    for (const [, surfaces] of Object.entries(bleeding)) {
      for (const [, readings] of Object.entries(surfaces as Record<string, number[]>)) {
        if (!Array.isArray(readings)) continue;
        for (const val of readings) {
          if (val === 1) bleedingSites++;
        }
      }
    }
  }

  const bleedingPercentage = totalSites > 0 ? (bleedingSites / totalSites) * 100 : 0;

  let hasFurcation = false;
  if (furcation) {
    hasFurcation = Object.keys(furcation).length > 0;
  }

  let hasMobility = false;
  if (mobility) {
    hasMobility = Object.values(mobility).some((v) => typeof v === 'number' && v >= 1);
  }

  return {
    deepPocketTeeth: Array.from(deepPocketTeeth),
    maxDepth,
    bleedingPercentage,
    hasFurcation,
    hasMobility,
    totalSites,
    bleedingSites,
  };
}

// ---------------------------------------------------------------------------
// Helpers — clinical note text scanning
// ---------------------------------------------------------------------------

function notesContain(notes: Array<{ subjective: string; objective: string; assessment: string; plan: string }>, pattern: RegExp): boolean {
  return notes.some(
    (n) =>
      pattern.test(n.subjective) ||
      pattern.test(n.objective) ||
      pattern.test(n.assessment) ||
      pattern.test(n.plan)
  );
}

function extractProcedureCodes(notes: Array<{ procedureCode?: string | null }>): string[] {
  const codes: Set<string> = new Set();
  for (const n of notes) {
    if (n.procedureCode) {
      for (const code of n.procedureCode.split(/[,;\s]+/)) {
        const trimmed = code.trim().toUpperCase();
        if (/^D\d{4}$/.test(trimmed)) codes.add(trimmed);
      }
    }
  }
  return Array.from(codes);
}

function treatmentPlanHasCode(
  items: Array<{ procedureCode: string; toothNumber?: string | null }>,
  codePattern: RegExp
): boolean {
  return items.some((i) => codePattern.test(i.procedureCode));
}

// ---------------------------------------------------------------------------
// Core analysis for a single patient
// ---------------------------------------------------------------------------

export async function analyzePatient(patientId: string): Promise<Recommendation[]> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      clinicalNotes: { orderBy: { date: 'desc' } },
      perioExams: { orderBy: { examDate: 'desc' }, take: 2 },
      treatmentPlans: { include: { items: true } },
      appointments: { orderBy: { date: 'desc' } },
    },
  });

  if (!patient) return [];

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const newRecs: Recommendation[] = [];

  // Collect all treatment plan items across all plans
  const allTpItems = patient.treatmentPlans.flatMap((tp) => tp.items ?? []);
  const allCodes = extractProcedureCodes(patient.clinicalNotes);

  // Helpers
  const addRec = (
    category: RecommendationCategory,
    priority: RecommendationPriority,
    title: string,
    description: string,
    rationale: string,
    guidelineReference: string,
    suggestedProcedureCodes: string[],
  ) => {
    const rec: Recommendation = {
      id: uuidv4(),
      patientId,
      patientName,
      category,
      priority,
      title,
      description,
      rationale,
      guidelineReference,
      suggestedProcedureCodes,
      estimatedRevenue: costForCodes(suggestedProcedureCodes),
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    newRecs.push(rec);
  };

  // ─── 1. Perio Analysis ────────────────────────────────────────────────────
  const latestPerio = patient.perioExams[0];
  if (latestPerio) {
    const perio = analyzePerioExam(latestPerio);

    // Deep pockets without SRP planned
    if (perio.deepPocketTeeth.length > 0) {
      const hasSRP = treatmentPlanHasCode(allTpItems, /^D4341$/);
      if (!hasSRP) {
        const teeth = perio.deepPocketTeeth.map((t) => `#${t}`).join(', ');
        addRec(
          'perio',
          perio.maxDepth >= 7 ? 'urgent' : 'high',
          `SRP Recommended — Teeth ${teeth}`,
          `Pocket depths of ${perio.maxDepth}mm detected. Scaling and root planing is indicated for teeth with pockets >= 5mm.`,
          `${perio.deepPocketTeeth.length} teeth with pocket depths >= 5mm found on most recent perio exam (${latestPerio.examDate}). Maximum depth: ${perio.maxDepth}mm.`,
          'ADA CDT D4341: Periodontal scaling and root planing indicated for pocket depths >= 5mm (AAP Clinical Practice Guidelines)',
          ['D4341', 'D4341', 'D4341', 'D4341'], // 4 quadrants
        );
      }
    }

    // Bleeding > 30% of sites
    if (perio.bleedingPercentage > 30) {
      addRec(
        'perio',
        'high',
        'Elevated Bleeding on Probing',
        `Bleeding detected at ${perio.bleedingPercentage.toFixed(0)}% of sites (${perio.bleedingSites}/${perio.totalSites}). This exceeds the 30% threshold indicating active periodontal disease.`,
        'Bleeding on probing > 30% is a strong indicator of active periodontal inflammation requiring intervention.',
        'AAP Classification System: Bleeding on probing is the primary clinical indicator of gingival inflammation (AAP/EFP 2017)',
        ['D4341'],
      );
    }

    // Furcation involvement
    if (perio.hasFurcation) {
      addRec(
        'perio',
        'high',
        'Furcation Involvement Detected',
        'Furcation involvement has been identified, which may require specialized periodontal treatment or referral.',
        'Furcation defects significantly complicate periodontal prognosis and treatment planning.',
        'AAP Best Evidence Consensus: Furcation involvement requires comprehensive periodontal treatment assessment (J Periodontol 2018)',
        ['D4341'],
      );
    }

    // No perio maintenance scheduled after perio treatment history
    const hadPerioTreatment = allTpItems.some((i) => /^D434[01]$/.test(i.procedureCode) && i.status === 'completed');
    const hasPerioMaint = treatmentPlanHasCode(allTpItems, /^D4910$/);
    if (hadPerioTreatment && !hasPerioMaint) {
      addRec(
        'perio',
        'standard',
        'Periodontal Maintenance Recommended',
        'Patient has a history of periodontal treatment but no periodontal maintenance (D4910) is currently scheduled.',
        'After active periodontal therapy, patients should be placed on a periodontal maintenance schedule, typically every 3-4 months.',
        'ADA recommends periodontal maintenance following active therapy (ADA Clinical Practice Guidelines; AAP Position Paper on Periodontal Maintenance)',
        ['D4910'],
      );
    }

    // Severe perio without periodontist referral
    if (perio.maxDepth >= 6 || (perio.hasFurcation && perio.hasMobility)) {
      addRec(
        'referral',
        'high',
        'Periodontist Referral Recommended',
        `Patient presents with ${perio.maxDepth >= 6 ? `pockets up to ${perio.maxDepth}mm` : 'furcation involvement and mobility'}, suggesting moderate-to-severe periodontal disease requiring specialist evaluation.`,
        'Moderate to severe periodontitis often exceeds the scope of general practice and benefits from specialist management.',
        'ADA Standards: Referral to a periodontist is recommended for patients with moderate-to-severe periodontitis (AAP/ADA Referral Guidelines)',
        [],
      );
    }
  }

  // ─── 2. Treatment Gap Analysis ────────────────────────────────────────────

  // RCT without crown
  const rctItems = allTpItems.filter(
    (i) => /^D33[12][0-9]$/.test(i.procedureCode) && i.status === 'completed'
  );
  for (const rctItem of rctItems) {
    if (rctItem.toothNumber) {
      const hasCrown = allTpItems.some(
        (i) => /^D27[45]0$/.test(i.procedureCode) && i.toothNumber === rctItem.toothNumber
      );
      if (!hasCrown) {
        addRec(
          'restorative',
          'high',
          `Crown Needed After RCT — Tooth ${rctItem.toothNumber}`,
          `Tooth ${rctItem.toothNumber} has received root canal therapy (${rctItem.procedureCode}) but has no full-coverage restoration planned. Unrestored endodontically treated teeth are at high risk of fracture.`,
          'Root canal treated teeth lose significant structural integrity and require full-coverage crowns to prevent catastrophic fracture.',
          'Standard of care: Endodontically treated posterior teeth should receive full-coverage restoration (AAE Position Statement; J Endod 2019)',
          ['D2750', 'D2950'],
        );
      }
    }
  }

  // Deep caries in assessment but no restoration planned
  const hasCariesNotes = notesContain(
    patient.clinicalNotes,
    /deep\s*caries|large\s*caries|extensive\s*decay|significant\s*caries|cavit(y|ies)/i
  );
  const hasRestorationPlanned = treatmentPlanHasCode(allTpItems, /^D2[3-7]\d{2}$/);
  if (hasCariesNotes && !hasRestorationPlanned) {
    addRec(
      'restorative',
      'urgent',
      'Missed Treatment — Caries Without Restoration',
      'Clinical notes mention deep caries or significant decay, but no restorative procedure is currently planned.',
      'Untreated caries will progress and may lead to pulpal involvement, pain, and potential tooth loss.',
      'ADA Caries Classification System: Deep caries lesions require prompt restorative intervention (ADA Clinical Practice Guidelines)',
      ['D2392'],
    );
  }

  // Crown evaluation (check notes for old crowns)
  const hasOldCrownNotes = notesContain(
    patient.clinicalNotes,
    /crown.*(old|aging|worn|failing|defective|marginal\s*(defect|gap|leak))|old\s*crown|recurrent\s*caries.*crown/i
  );
  if (hasOldCrownNotes) {
    addRec(
      'restorative',
      'standard',
      'Crown Evaluation Recommended',
      'Clinical notes indicate aging or potentially failing crowns that should be evaluated for replacement.',
      'Crowns older than 10-15 years may exhibit marginal breakdown, recurrent caries, or material degradation.',
      'ADA recommends periodic evaluation of existing restorations for integrity and fit (ADA Clinical Practice Guidelines)',
      ['D0120', 'D2750'],
    );
  }

  // ─── 3. Preventive Care Gaps ──────────────────────────────────────────────

  const sixMonthsAgo = monthsAgo(6);
  const twelveMonthsAgo = monthsAgo(12);

  // No prophylaxis in last 6 months
  const lastProphy = patient.appointments.find(
    (a) => a.type?.toLowerCase().includes('hygiene') || a.type?.toLowerCase().includes('cleaning') || a.type?.toLowerCase().includes('prophy')
  );
  const hasRecentProphy = lastProphy && !isOlderThan(lastProphy.date, sixMonthsAgo);
  const prophyInNotes = patient.clinicalNotes.some(
    (n) => /D1110/i.test(n.procedureCode ?? '') && !isOlderThan(n.date, sixMonthsAgo)
  );

  if (!hasRecentProphy && !prophyInNotes) {
    // Also check lastCleaningDate on patient
    const lastCleaning = patient.lastCleaningDate;
    const cleaningRecent = lastCleaning && !isOlderThan(lastCleaning, sixMonthsAgo);

    if (!cleaningRecent) {
      addRec(
        'preventive',
        'standard',
        'Prophylaxis Overdue',
        'No hygiene/prophylaxis appointment found in the last 6 months. Patient should be scheduled for routine cleaning.',
        'Regular prophylaxis is fundamental to maintaining oral health and preventing periodontal disease progression.',
        'ADA recommends prophylaxis every 6 months for low-risk patients (ADA Clinical Practice Guidelines)',
        ['D1110'],
      );
    }
  }

  // No periodic exam in last 6 months
  const hasRecentExam = patient.clinicalNotes.some(
    (n) => /D0120/i.test(n.procedureCode ?? '') && !isOlderThan(n.date, sixMonthsAgo)
  );
  const recentExamAppt = patient.appointments.find(
    (a) => (a.type?.toLowerCase().includes('exam') || a.type?.toLowerCase().includes('recall')) && !isOlderThan(a.date, sixMonthsAgo)
  );
  if (!hasRecentExam && !recentExamAppt) {
    addRec(
      'preventive',
      'standard',
      'Periodic Exam Overdue',
      'No periodic oral evaluation (D0120) found in the last 6 months.',
      'Regular examinations allow early detection of caries, periodontal disease, oral cancer, and other pathology.',
      'ADA recommends periodic oral evaluation at intervals determined by the patient\'s risk factors, typically every 6 months (ADA Clinical Practice Guidelines)',
      ['D0120'],
    );
  }

  // No bitewings in last 12 months
  const hasRecentBWX = patient.clinicalNotes.some(
    (n) => /D027[24]/i.test(n.procedureCode ?? '') && !isOlderThan(n.date, twelveMonthsAgo)
  );
  if (!hasRecentBWX) {
    addRec(
      'preventive',
      'low',
      'Bitewing Radiographs Due',
      'No bitewing radiographs found in the last 12 months. Radiographic evaluation is recommended for caries and bone level assessment.',
      'Bitewing radiographs detect interproximal caries and early bone loss not visible clinically.',
      'ADA/FDA Guidelines for Prescribing Dental Radiographs: Posterior bitewing exam recommended at 6-18 month intervals depending on risk',
      ['D0274'],
    );
  }

  // High caries risk without fluoride
  const multipleRestorations = patient.clinicalNotes.filter(
    (n) => /D2[3-7]\d{2}/i.test(n.procedureCode ?? '')
  ).length >= 3;
  const cariesKeywords = notesContain(patient.clinicalNotes, /caries|decay|cavit(y|ies)|lesion/i);
  const hasFluoride = patient.clinicalNotes.some(
    (n) => /D1208/i.test(n.procedureCode ?? '')
  );

  if ((multipleRestorations || cariesKeywords) && !hasFluoride) {
    addRec(
      'preventive',
      'standard',
      'Fluoride Treatment Recommended',
      'Patient shows indicators of elevated caries risk (multiple restorations and/or caries noted in records) but no fluoride varnish application (D1208) on file.',
      'Patients with high caries risk benefit significantly from professional fluoride application.',
      'ADA Council on Scientific Affairs: Professionally applied topical fluoride recommended for patients at elevated caries risk (ADA Clinical Recommendations 2013)',
      ['D1208'],
    );
  }

  // ─── 4. Risk Assessment (composite flags) ────────────────────────────────

  if (latestPerio) {
    const perio = analyzePerioExam(latestPerio);
    const smokingHistory = notesContain(patient.clinicalNotes, /smok(e|er|ing)|tobacco|nicotine/i);

    if (perio.deepPocketTeeth.length >= 4 && (smokingHistory || perio.hasMobility)) {
      addRec(
        'perio',
        'urgent',
        'High Periodontal Risk Profile',
        `Patient presents with ${perio.deepPocketTeeth.length} teeth with deep pockets${smokingHistory ? ', smoking/tobacco history' : ''}${perio.hasMobility ? ', and tooth mobility' : ''}. This combination places the patient at high risk for progressive bone loss and tooth loss.`,
        'Multiple concurrent periodontal risk factors dramatically increase the likelihood of disease progression.',
        'AAP Risk Assessment Guidelines: Combined risk factors (smoking, deep pockets, mobility) indicate high perio risk requiring aggressive management (J Periodontol 2015)',
        ['D4341', 'D4341', 'D4341', 'D4341'],
      );
    }
  }

  if (multipleRestorations && cariesKeywords) {
    addRec(
      'preventive',
      'high',
      'High Caries Risk Profile',
      'Patient has multiple existing restorations and active caries indicators in clinical notes, suggesting elevated caries risk requiring enhanced preventive measures.',
      'Patients with history of multiple restorations and ongoing caries activity are at highest risk for future caries.',
      'ADA Caries Risk Assessment: Patients with recent caries experience and multiple restorations should receive enhanced preventive protocols (CAMBRA Guidelines)',
      ['D1208', 'D1110'],
    );
  }

  // Store recommendations (remove old ones for this patient first)
  const idsToRemove: string[] = [];
  recommendations.forEach((rec, id) => {
    if (rec.patientId === patientId && rec.status === 'new') {
      idsToRemove.push(id);
    }
  });
  idsToRemove.forEach((id) => recommendations.delete(id));
  for (const rec of newRecs) {
    recommendations.set(rec.id, rec);
  }

  return newRecs;
}

// ---------------------------------------------------------------------------
// Analyze all patients
// ---------------------------------------------------------------------------

export async function analyzeAllPatients(): Promise<Recommendation[]> {
  const patients = await prisma.patient.findMany({ select: { id: true } });
  const allRecs: Recommendation[] = [];

  for (const p of patients) {
    const recs = await analyzePatient(p.id);
    allRecs.push(...recs);
  }

  return allRecs.filter((r) => r.status === 'new');
}

// ---------------------------------------------------------------------------
// Get single recommendation
// ---------------------------------------------------------------------------

export function getRecommendation(id: string): Recommendation | undefined {
  return recommendations.get(id);
}

// ---------------------------------------------------------------------------
// Get all recommendations (with filters)
// ---------------------------------------------------------------------------

export function getAllRecommendations(filters?: {
  patientId?: string;
  category?: RecommendationCategory;
  priority?: RecommendationPriority;
  status?: RecommendationStatus;
}): Recommendation[] {
  let recs = Array.from(recommendations.values());

  if (filters?.patientId) {
    recs = recs.filter((r) => r.patientId === filters.patientId);
  }
  if (filters?.category) {
    recs = recs.filter((r) => r.category === filters.category);
  }
  if (filters?.priority) {
    recs = recs.filter((r) => r.priority === filters.priority);
  }
  if (filters?.status) {
    recs = recs.filter((r) => r.status === filters.status);
  }

  // Sort: urgent first, then high, standard, low
  const priorityOrder: Record<RecommendationPriority, number> = { urgent: 0, high: 1, standard: 2, low: 3 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

// ---------------------------------------------------------------------------
// Update recommendation status
// ---------------------------------------------------------------------------

export function updateRecommendationStatus(
  id: string,
  status: RecommendationStatus,
  dismissReason?: string
): Recommendation | undefined {
  const rec = recommendations.get(id);
  if (!rec) return undefined;

  const updated: Recommendation = {
    ...rec,
    status,
    ...(dismissReason ? { dismissReason } : {}),
  };
  recommendations.set(id, updated);
  return updated;
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export function getDashboardStats(): DashboardStats {
  const recs = Array.from(recommendations.values());

  const byCategory: Record<RecommendationCategory, number> = { perio: 0, restorative: 0, preventive: 0, referral: 0 };
  const byPriority: Record<RecommendationPriority, number> = { urgent: 0, high: 0, standard: 0, low: 0 };
  let estimatedRevenue = 0;
  let totalAccepted = 0;
  let totalDismissed = 0;
  let activeCount = 0;

  for (const rec of recs) {
    byCategory[rec.category]++;
    byPriority[rec.priority]++;
    if (rec.status === 'new' || rec.status === 'reviewed') {
      estimatedRevenue += rec.estimatedRevenue;
      activeCount++;
    }
    if (rec.status === 'accepted') totalAccepted++;
    if (rec.status === 'dismissed') totalDismissed++;
  }

  const totalDecided = totalAccepted + totalDismissed;
  const acceptanceRate = totalDecided > 0 ? (totalAccepted / totalDecided) * 100 : 0;

  return {
    totalRecommendations: activeCount,
    byCategory,
    byPriority,
    estimatedRevenue,
    acceptanceRate,
    totalAccepted,
    totalDismissed,
  };
}
