import { prisma } from '../db/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ScrubIssue {
  id: string;
  category: 'frequency' | 'narrative' | 'documentation' | 'annual_max' | 'deductible' | 'payer_pattern' | 'bundling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  title: string;
  description: string;
  suggestedFix: string;
  procedureCode?: string;
  autoFixable: boolean;
}

export interface ScrubResult {
  id: string;
  claimId: string;
  patientId: string;
  patientName: string;
  claimDate: string;
  procedureCodes: string;
  totalAmount: number;
  payerName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: ScrubIssue[];
  suggestedNarrative: string | null;
  originalNarrative: string;
  status: 'pending' | 'reviewed' | 'applied' | 'dismissed';
  scrubbedAt: string;
}

export interface PayerDenialPattern {
  id: string;
  payer: string;
  procedureCode: string;
  denialReason: string;
  frequency: number; // percentage of claims denied for this reason
  preventionTip: string;
  category: string;
}

export interface ScrubStats {
  totalScrubbed: number;
  totalIssuesFound: number;
  highRiskCount: number;
  criticalCount: number;
  preventionRate: number;
  issuesByCategory: Record<string, number>;
  topRisks: Array<{ code: string; description: string; count: number }>;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

const scrubResults = new Map<string, ScrubResult>();
let scrubCounter = 0;

function generateId(): string {
  scrubCounter++;
  return `scrub_${Date.now()}_${scrubCounter}`;
}

// ─── Procedure Frequency Limits ─────────────────────────────────────────────
// CDT code -> { description, intervalMonths, notes }

const FREQUENCY_LIMITS: Record<string, { description: string; intervalMonths: number; notes: string }> = {
  'D0120': { description: 'Periodic Oral Evaluation', intervalMonths: 6, notes: 'Most payers limit to 2 per calendar year' },
  'D0150': { description: 'Comprehensive Oral Evaluation', intervalMonths: 36, notes: 'Once per provider, per patient, in 3 years' },
  'D0210': { description: 'Full Mouth Radiographs', intervalMonths: 36, notes: 'Once every 3 years for adults' },
  'D0274': { description: 'Bitewing Radiographs — Four Films', intervalMonths: 12, notes: 'Once per 12 months; some payers allow 6 months for children' },
  'D0272': { description: 'Bitewing Radiographs — Two Films', intervalMonths: 12, notes: 'Once per 12 months' },
  'D0330': { description: 'Panoramic Radiograph', intervalMonths: 36, notes: 'Once every 3 years' },
  'D1110': { description: 'Adult Prophylaxis', intervalMonths: 6, notes: 'Two per calendar year; cannot combine with D4910' },
  'D1120': { description: 'Child Prophylaxis', intervalMonths: 6, notes: 'Two per calendar year' },
  'D1208': { description: 'Fluoride Application', intervalMonths: 6, notes: 'Twice per year; age limits vary by payer (usually under 19)' },
  'D1351': { description: 'Dental Sealant', intervalMonths: 36, notes: 'Once per tooth per 3 years; permanent molars only; age limits apply' },
  'D1206': { description: 'Fluoride Varnish', intervalMonths: 6, notes: 'Twice per year' },
  'D4341': { description: 'Scaling and Root Planing — Per Quadrant', intervalMonths: 24, notes: 'Once per quadrant every 2 years' },
  'D4342': { description: 'Scaling and Root Planing — 1-3 Teeth', intervalMonths: 24, notes: 'Once per quadrant every 2 years' },
  'D4910': { description: 'Periodontal Maintenance', intervalMonths: 3, notes: 'Four per year after active perio treatment; cannot combine with D1110' },
  'D2750': { description: 'Crown — Porcelain Fused to High Noble Metal', intervalMonths: 60, notes: 'Once per tooth every 5 years' },
  'D2740': { description: 'Crown — Porcelain/Ceramic', intervalMonths: 60, notes: 'Once per tooth every 5 years' },
  'D2950': { description: 'Core Buildup', intervalMonths: 60, notes: 'Once per tooth every 5 years; must be with crown' },
  'D7140': { description: 'Extraction — Erupted Tooth', intervalMonths: 0, notes: 'Once per tooth (lifetime)' },
  'D7210': { description: 'Surgical Extraction', intervalMonths: 0, notes: 'Once per tooth (lifetime)' },
  'D7240': { description: 'Removal of Impacted Tooth — Complete Bony', intervalMonths: 0, notes: 'Once per tooth (lifetime)' },
};

// ─── Narrative Keywords by Procedure Category ───────────────────────────────

const PROCEDURE_KEYWORDS: Record<string, string[]> = {
  'D0': ['evaluation', 'examination', 'exam', 'diagnosis', 'radiograph', 'x-ray', 'imaging', 'assessment', 'screening'],
  'D1': ['prophylaxis', 'cleaning', 'fluoride', 'sealant', 'preventive', 'hygiene', 'varnish', 'polish'],
  'D2': ['restoration', 'filling', 'crown', 'composite', 'amalgam', 'buildup', 'core', 'inlay', 'onlay', 'veneer', 'caries', 'decay', 'restorative'],
  'D3': ['endodontic', 'root canal', 'pulp', 'pulpotomy', 'apicoectomy', 'retreatment'],
  'D4': ['periodontal', 'scaling', 'root planing', 'perio', 'gingival', 'osseous', 'graft', 'pocket', 'debridement', 'periodontitis'],
  'D5': ['prosthetic', 'denture', 'partial', 'removable', 'reline', 'adjustment'],
  'D6': ['implant', 'abutment', 'pontic', 'bridge', 'fixed', 'prosthodontic'],
  'D7': ['extraction', 'surgical', 'removal', 'impacted', 'biopsy', 'incision', 'drainage', 'alveoloplasty'],
  'D8': ['orthodontic', 'braces', 'alignment', 'retainer', 'appliance'],
  'D9': ['sedation', 'anesthesia', 'emergency', 'palliative', 'consultation'],
};

// ─── Major Procedure Codes Requiring Documentation ──────────────────────────

const MAJOR_PROCEDURES = new Set([
  // Crowns
  'D2710', 'D2712', 'D2720', 'D2721', 'D2722', 'D2740', 'D2750', 'D2751', 'D2752',
  // Endodontics
  'D3310', 'D3320', 'D3330', 'D3346', 'D3347', 'D3348',
  // Periodontal surgery
  'D4210', 'D4211', 'D4240', 'D4241', 'D4249', 'D4260', 'D4261', 'D4263', 'D4341', 'D4342',
  // Oral surgery
  'D7140', 'D7210', 'D7220', 'D7230', 'D7240', 'D7241', 'D7250',
  // Implants
  'D6010', 'D6012', 'D6040', 'D6050', 'D6055', 'D6056', 'D6057', 'D6058', 'D6059', 'D6060', 'D6061', 'D6062', 'D6063', 'D6064', 'D6065',
  // Prosthetics
  'D5110', 'D5120', 'D5130', 'D5140', 'D5211', 'D5212', 'D5213', 'D5214',
]);

// ─── High-Cost Codes Requiring Pre-Authorization ────────────────────────────

const PREAUTH_REQUIRED_CODES = new Set([
  'D2740', 'D2750', 'D2751', 'D2752', 'D2950',
  'D3310', 'D3320', 'D3330',
  'D4210', 'D4211', 'D4240', 'D4249', 'D4260', 'D4263',
  'D6010', 'D6012', 'D6040', 'D6050', 'D6055', 'D6056', 'D6057', 'D6058', 'D6065',
  'D5110', 'D5120', 'D5130', 'D5140',
  'D7210', 'D7220', 'D7230', 'D7240', 'D7241',
  'D8070', 'D8080', 'D8090',
]);

// ─── Payer Denial Patterns (20 realistic entries) ───────────────────────────

const PAYER_DENIAL_PATTERNS: PayerDenialPattern[] = [
  {
    id: 'pdp1', payer: 'Delta Dental', procedureCode: 'D0274',
    denialReason: 'Bitewing frequency exceeded — less than 12 months since last set',
    frequency: 18, preventionTip: 'Verify last bitewing date before scheduling. Delta requires 12-month gap.',
    category: 'frequency',
  },
  {
    id: 'pdp2', payer: 'Delta Dental', procedureCode: 'D2750',
    denialReason: 'Crown downgraded to large amalgam restoration — missing narrative justification',
    frequency: 22, preventionTip: 'Include specific clinical findings: fracture lines, cusp involvement percentage, and pre-op radiograph date.',
    category: 'downcoding',
  },
  {
    id: 'pdp3', payer: 'Delta Dental', procedureCode: 'D4341',
    denialReason: 'SRP denied — missing periodontal charting with pocket depths >= 4mm',
    frequency: 15, preventionTip: 'Attach full perio chart showing pocket depths. Include bleeding on probing data.',
    category: 'documentation',
  },
  {
    id: 'pdp4', payer: 'Aetna', procedureCode: 'D2950',
    denialReason: 'Core buildup bundled with crown — billed on same date',
    frequency: 32, preventionTip: 'Aetna bundles D2950 with crowns. Submit narrative explaining why buildup was separate procedure. Note remaining tooth structure < 50%.',
    category: 'bundling',
  },
  {
    id: 'pdp5', payer: 'Aetna', procedureCode: 'D1110',
    denialReason: 'Prophylaxis denied — patient had D4910 within 6 months',
    frequency: 12, preventionTip: 'D1110 and D4910 are mutually exclusive within the same benefit period. Bill D4910 for perio maintenance patients.',
    category: 'frequency',
  },
  {
    id: 'pdp6', payer: 'Aetna', procedureCode: 'D0220',
    denialReason: 'Periapical X-ray bundled with evaluation — same date of service',
    frequency: 10, preventionTip: 'Aetna often bundles single PAs with comprehensive exams. Submit only when diagnostically necessary with documentation.',
    category: 'bundling',
  },
  {
    id: 'pdp7', payer: 'BlueCross BlueShield', procedureCode: 'D7140',
    denialReason: 'Extraction denied — missing pre-operative radiograph',
    frequency: 25, preventionTip: 'Always include pre-op PA or panoramic image reference in narrative. BCBS requires radiographic evidence of pathology.',
    category: 'documentation',
  },
  {
    id: 'pdp8', payer: 'BlueCross BlueShield', procedureCode: 'D2740',
    denialReason: 'Crown denied — tooth not documented as non-restorable with filling',
    frequency: 20, preventionTip: 'Narrative must state why a direct restoration cannot restore proper form and function. Include cusp fracture details.',
    category: 'documentation',
  },
  {
    id: 'pdp9', payer: 'BlueCross BlueShield', procedureCode: 'D0150',
    denialReason: 'Comprehensive eval denied — patient had D0150 within 3 years with same provider',
    frequency: 14, preventionTip: 'BCBS limits D0150 to once every 3 years per provider. Use D0120 periodic eval for recall visits.',
    category: 'frequency',
  },
  {
    id: 'pdp10', payer: 'Cigna', procedureCode: 'D3330',
    denialReason: 'Molar root canal denied — pre-authorization not obtained',
    frequency: 28, preventionTip: 'Cigna requires pre-authorization for all root canals on molars. Submit pre-auth with PA radiograph and pulp vitality test results.',
    category: 'preauth',
  },
  {
    id: 'pdp11', payer: 'Cigna', procedureCode: 'D4910',
    denialReason: 'Perio maintenance frequency exceeded — more than 4 per year',
    frequency: 11, preventionTip: 'Cigna allows max 4 D4910 per calendar year. Space visits at least 3 months apart.',
    category: 'frequency',
  },
  {
    id: 'pdp12', payer: 'Cigna', procedureCode: 'D2391',
    denialReason: 'Posterior composite downgraded to amalgam — posterior tooth',
    frequency: 16, preventionTip: 'Cigna may downcode posterior composites to amalgam fees. Include patient allergy to amalgam or aesthetic zone justification in narrative.',
    category: 'downcoding',
  },
  {
    id: 'pdp13', payer: 'MetLife', procedureCode: 'D1351',
    denialReason: 'Sealant denied — patient age exceeds benefit limit (usually 14-16)',
    frequency: 19, preventionTip: 'MetLife typically limits sealants to patients under age 16 on permanent molars only. Verify age eligibility before treatment.',
    category: 'age_limit',
  },
  {
    id: 'pdp14', payer: 'MetLife', procedureCode: 'D0210',
    denialReason: 'Full mouth X-rays denied — less than 36 months since last FMX',
    frequency: 13, preventionTip: 'MetLife requires 36-month interval for FMX. Check patient history before ordering.',
    category: 'frequency',
  },
  {
    id: 'pdp15', payer: 'MetLife', procedureCode: 'D6010',
    denialReason: 'Implant denied — not a covered benefit under standard plan',
    frequency: 35, preventionTip: 'Many MetLife plans exclude implants entirely. Verify implant coverage before treatment planning. Offer alternative with bridge (D6240/D6750).',
    category: 'coverage',
  },
  {
    id: 'pdp16', payer: 'Delta Dental', procedureCode: 'D1110',
    denialReason: 'Prophy denied — patient had cleaning within 5 months',
    frequency: 9, preventionTip: 'Delta requires minimum 6-month interval between prophylaxis. Verify last cleaning date in patient history.',
    category: 'frequency',
  },
  {
    id: 'pdp17', payer: 'Aetna', procedureCode: 'D7210',
    denialReason: 'Surgical extraction downgraded to simple extraction D7140',
    frequency: 21, preventionTip: 'Document surgical necessity: bone removal, sectioning, flap elevation. Attach radiograph showing root morphology.',
    category: 'downcoding',
  },
  {
    id: 'pdp18', payer: 'BlueCross BlueShield', procedureCode: 'D2950',
    denialReason: 'Core buildup denied — insufficient documentation of remaining tooth structure',
    frequency: 17, preventionTip: 'Document exact percentage of remaining coronal tooth structure. BCBS requires < 50% remaining for separate buildup reimbursement.',
    category: 'documentation',
  },
  {
    id: 'pdp19', payer: 'Cigna', procedureCode: 'D0274',
    denialReason: 'Bitewings denied — included in comprehensive evaluation on same date',
    frequency: 8, preventionTip: 'Some Cigna plans bundle BWX with comprehensive exams. Bill radiographs on a separate date or document diagnostic necessity.',
    category: 'bundling',
  },
  {
    id: 'pdp20', payer: 'MetLife', procedureCode: 'D2750',
    denialReason: 'Crown denied — less than 5 years since last crown on same tooth',
    frequency: 14, preventionTip: 'MetLife enforces strict 5-year replacement rule. Document catastrophic failure, fracture, or recurrent decay with radiograph.',
    category: 'frequency',
  },
];

// ─── Severity Weights ───────────────────────────────────────────────────────

const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 5,
  medium: 15,
  high: 30,
  critical: 50,
};

// ─── Narrative Templates ────────────────────────────────────────────────────

function generateNarrativeForProcedure(code: string, patientName: string, toothInfo?: string): string {
  const category = code.substring(0, 2);
  const toothRef = toothInfo ? ` on tooth ${toothInfo}` : '';

  const templates: Record<string, string> = {
    'D0': `Patient ${patientName} presented for ${FREQUENCY_LIMITS[code]?.description || 'diagnostic evaluation'}${toothRef}. Clinical and radiographic examination was performed. Findings documented in clinical notes. Treatment plan discussed with patient.`,

    'D1': `Patient ${patientName} received ${FREQUENCY_LIMITS[code]?.description || 'preventive treatment'}${toothRef}. Oral hygiene instructions provided. No complications noted during procedure. Patient tolerated treatment well.`,

    'D2': `Patient ${patientName} presented with clinical and radiographic evidence of ${code.startsWith('D274') || code.startsWith('D275') ? 'structural compromise requiring full-coverage restoration' : 'carious lesion requiring restoration'}${toothRef}. The existing tooth structure was insufficient to support a direct restoration due to extent of decay/fracture involving multiple surfaces and cusps. ${code.startsWith('D274') || code.startsWith('D275') ? 'A full-coverage crown was determined to be the appropriate restoration to restore proper form, function, and structural integrity.' : 'Caries were removed, tooth was restored to proper anatomical form and function.'} Patient tolerated the procedure well with no complications.`,

    'D3': `Patient ${patientName} presented with symptoms consistent with irreversible pulpitis${toothRef}. Pulp vitality testing confirmed non-vital or irreversibly inflamed pulp. Radiographic examination revealed periapical pathology. Endodontic treatment was initiated to preserve the tooth. Canals were instrumented, irrigated with sodium hypochlorite, and obturated with gutta percha. Post-operative radiograph confirmed adequate fill. Patient will return for permanent restoration.`,

    'D4': `Patient ${patientName} presented with generalized/localized moderate to severe periodontitis${toothRef}. Periodontal examination revealed pocket depths of 4-7mm with bleeding on probing and clinical attachment loss. Scaling and root planing was performed under local anesthesia to remove subgingular calculus and diseased root cementum. Oral hygiene instructions reinforced. Patient scheduled for periodontal re-evaluation in 4-6 weeks.`,

    'D5': `Patient ${patientName} presented for prosthetic treatment${toothRef}. Clinical evaluation confirmed the need for removable prosthesis to restore function, aesthetics, and phonetics. Impressions were taken, bite registration recorded, and shade selection completed. Patient counseled on care and maintenance.`,

    'D6': `Patient ${patientName} presented for implant-related procedure${toothRef}. Radiographic and clinical evaluation confirmed adequate bone volume and quality for implant placement. Surgical site was prepared following standard protocol. Implant placed with adequate primary stability. Post-operative instructions provided. Patient to return for follow-up evaluation.`,

    'D7': `Patient ${patientName} presented requiring extraction${toothRef}. Pre-operative radiograph confirmed root morphology and proximity to vital structures. ${code === 'D7210' || code >= 'D7220' ? 'Surgical extraction was necessary due to root curvature, ankylosis, or need for bone removal. Mucoperiosteal flap was elevated, bone was removed as needed, and tooth was delivered. Surgical site was debrided and sutured.' : 'Tooth was extracted atraumatically using forceps and elevators.'} Hemostasis was achieved. Post-operative instructions provided including pain management and activity restrictions.`,

    'D8': `Patient ${patientName} presented for orthodontic treatment${toothRef}. Clinical and radiographic evaluation, including cephalometric analysis, confirmed malocclusion requiring orthodontic intervention. Treatment plan and expected duration discussed with patient/guardian. Informed consent obtained.`,

    'D9': `Patient ${patientName} presented requiring adjunctive services${toothRef}. Clinical assessment performed. Appropriate treatment rendered per standard of care. Patient tolerated procedure well. Follow-up care instructions provided.`,
  };

  return templates[category] || `Patient ${patientName} received dental treatment (${code})${toothRef}. Clinical examination performed, treatment rendered per standard of care. Patient tolerated treatment well with no complications noted. Follow-up instructions provided.`;
}

// ─── Core Scrubbing Logic ───────────────────────────────────────────────────

export async function scrubClaim(claimId: string): Promise<ScrubResult> {
  // Check if we already have a result for this claim
  const existing = Array.from(scrubResults.values()).find(r => r.claimId === claimId && r.status === 'pending');
  if (existing) return existing;

  // Fetch the claim with relations
  const claim = await prisma.insuranceClaim.findUnique({
    where: { id: claimId },
    include: {
      patient: true,
      insurancePlan: true,
      appointment: {
        include: {
          clinicalNotes: true,
        },
      },
    },
  });

  if (!claim) {
    throw new Error(`Claim ${claimId} not found`);
  }

  const issues: ScrubIssue[] = [];
  const codes = claim.procedureCodes.split(',').map(c => c.trim());
  const patientName = `${claim.patient.firstName} ${claim.patient.lastName}`;
  const payerName = claim.insurancePlan.provider;
  let issueCounter = 0;

  // ── Check 1: Procedure Frequency Limits ──────────────────────────────────

  for (const code of codes) {
    const limit = FREQUENCY_LIMITS[code];
    if (!limit || limit.intervalMonths === 0) continue;

    // Look for prior claims with the same code for this patient
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - limit.intervalMonths);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const priorClaims = await prisma.insuranceClaim.findMany({
      where: {
        patientId: claim.patientId,
        id: { not: claim.id },
        procedureCodes: { contains: code },
        claimDate: { gte: cutoffStr },
        status: { notIn: ['denied', 'draft'] },
      },
    });

    if (priorClaims.length > 0) {
      const lastDate = priorClaims[0].claimDate;
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'frequency',
        severity: 'high',
        weight: SEVERITY_WEIGHTS.high,
        title: `Frequency Limit Violation: ${code}`,
        description: `${limit.description} (${code}) was billed on ${lastDate}, which is within the ${limit.intervalMonths}-month frequency limit. ${limit.notes}`,
        suggestedFix: `Remove ${code} from this claim or reschedule beyond the ${limit.intervalMonths}-month window. Last billed: ${lastDate}.`,
        procedureCode: code,
        autoFixable: false,
      });
    }
  }

  // ── Check 2: Narrative-Procedure Mismatch ────────────────────────────────

  const narrativeLower = claim.narrative.toLowerCase();
  for (const code of codes) {
    const category = code.substring(0, 2);
    const keywords = PROCEDURE_KEYWORDS[category];
    if (!keywords) continue;

    const hasMatchingKeyword = keywords.some(kw => narrativeLower.includes(kw));
    if (!hasMatchingKeyword) {
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'narrative',
        severity: 'medium',
        weight: SEVERITY_WEIGHTS.medium,
        title: `Narrative Missing Key Terms for ${code}`,
        description: `The claim narrative does not contain expected terminology for ${category}xxx procedures. Expected keywords: ${keywords.slice(0, 5).join(', ')}. This may trigger payer review or denial.`,
        suggestedFix: `Update narrative to include clinical terminology appropriate for ${FREQUENCY_LIMITS[code]?.description || `procedure ${code}`}. Use the AI-generated narrative below as a template.`,
        procedureCode: code,
        autoFixable: true,
      });
    }
  }

  // ── Check 3: Missing Documentation ───────────────────────────────────────

  const hasMajorProcedure = codes.some(c => MAJOR_PROCEDURES.has(c));
  if (hasMajorProcedure) {
    // Check for clinical note
    const clinicalNotes = claim.appointment?.clinicalNotes || [];
    const hasApprovedNote = clinicalNotes.some(n => n.status === 'approved');
    const hasDraftNote = clinicalNotes.some(n => n.status === 'draft');

    if (clinicalNotes.length === 0) {
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'documentation',
        severity: 'critical',
        weight: SEVERITY_WEIGHTS.critical,
        title: 'No Clinical Note Found',
        description: 'This claim includes major procedures but has no associated clinical note. Payers require clinical documentation to support medical necessity for major services.',
        suggestedFix: 'Create and approve a clinical note for this appointment before submitting the claim. Include findings, diagnosis, and treatment rationale.',
        autoFixable: false,
      });
    } else if (!hasApprovedNote && hasDraftNote) {
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'documentation',
        severity: 'medium',
        weight: SEVERITY_WEIGHTS.medium,
        title: 'Clinical Note Not Approved',
        description: 'A draft clinical note exists but has not been approved. Submitting claims with unapproved notes may delay processing if documentation is requested.',
        suggestedFix: 'Have the treating provider review and approve the clinical note before claim submission.',
        autoFixable: false,
      });
    }

    // Check for pre-authorization on high-cost procedures
    const needsPreAuth = codes.filter(c => PREAUTH_REQUIRED_CODES.has(c));
    if (needsPreAuth.length > 0) {
      const preAuths = await prisma.preAuthorization.findMany({
        where: {
          patientId: claim.patientId,
          insurancePlanId: claim.insurancePlanId,
          status: 'approved',
        },
      });

      // Check if any pre-auth covers the needed codes
      const coveredCodes = new Set<string>();
      for (const pa of preAuths) {
        const paCodes = pa.procedureCodes.split(',').map(c => c.trim());
        for (const pc of paCodes) {
          coveredCodes.add(pc);
        }
      }

      const uncoveredCodes = needsPreAuth.filter(c => !coveredCodes.has(c));
      if (uncoveredCodes.length > 0) {
        issueCounter++;
        issues.push({
          id: `issue_${issueCounter}`,
          category: 'documentation',
          severity: 'high',
          weight: SEVERITY_WEIGHTS.high,
          title: 'Pre-Authorization Missing',
          description: `Procedures ${uncoveredCodes.join(', ')} typically require pre-authorization from ${payerName}. No approved pre-auth was found for these codes. Submitting without pre-auth risks immediate denial.`,
          suggestedFix: `Submit pre-authorization request to ${payerName} for ${uncoveredCodes.join(', ')} before filing this claim. Include radiographs and clinical notes.`,
          autoFixable: false,
        });
      }
    }
  }

  // ── Check 4: Annual Maximum Check ────────────────────────────────────────

  const plan = claim.insurancePlan;
  if (plan) {
    const remainingBenefit = plan.annualMax - plan.annualUsed;
    if (claim.totalAmount > remainingBenefit) {
      const overage = claim.totalAmount - remainingBenefit;
      const severity = overage > 500 ? 'high' : 'medium';
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'annual_max',
        severity,
        weight: SEVERITY_WEIGHTS[severity],
        title: 'Annual Maximum Will Be Exceeded',
        description: `This claim for ${formatUSD(claim.totalAmount)} plus annual used (${formatUSD(plan.annualUsed)}) exceeds the annual maximum of ${formatUSD(plan.annualMax)}. Patient will owe an additional ${formatUSD(overage)} out of pocket. Remaining benefit: ${formatUSD(remainingBenefit)}.`,
        suggestedFix: `Inform the patient of estimated out-of-pocket cost of ${formatUSD(overage)}. Consider splitting treatment across benefit years or prioritizing most urgent procedures within remaining benefits.`,
        autoFixable: false,
      });
    } else if (claim.totalAmount > remainingBenefit * 0.8) {
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'annual_max',
        severity: 'low',
        weight: SEVERITY_WEIGHTS.low,
        title: 'Approaching Annual Maximum',
        description: `After this claim, the patient will have used ${formatUSD(plan.annualUsed + claim.totalAmount)} of their ${formatUSD(plan.annualMax)} annual maximum. Only ${formatUSD(remainingBenefit - claim.totalAmount)} will remain for the rest of the benefit year.`,
        suggestedFix: 'Alert the patient that their remaining insurance benefits are limited. Consider scheduling additional treatment for the next benefit year.',
        autoFixable: false,
      });
    }
  }

  // ── Check 5: Deductible Check ────────────────────────────────────────────

  if (plan && plan.deductibleMet < plan.deductible) {
    const deductibleRemaining = plan.deductible - plan.deductibleMet;
    issueCounter++;
    issues.push({
      id: `issue_${issueCounter}`,
      category: 'deductible',
      severity: 'low',
      weight: SEVERITY_WEIGHTS.low,
      title: 'Deductible Not Yet Met',
      description: `Patient's annual deductible is ${formatUSD(plan.deductible)} with ${formatUSD(plan.deductibleMet)} met so far. The remaining ${formatUSD(deductibleRemaining)} will be applied to this claim before insurance pays its portion.`,
      suggestedFix: `Collect ${formatUSD(Math.min(deductibleRemaining, claim.totalAmount))} deductible from patient at time of service. Ensure the front desk is aware of the outstanding deductible balance.`,
      autoFixable: false,
    });
  }

  // ── Check 6: Payer-Specific Patterns ─────────────────────────────────────

  const payerPatterns = PAYER_DENIAL_PATTERNS.filter(p =>
    payerName.toLowerCase().includes(p.payer.toLowerCase().split(' ')[0].toLowerCase())
  );

  for (const pattern of payerPatterns) {
    if (codes.includes(pattern.procedureCode)) {
      issueCounter++;
      issues.push({
        id: `issue_${issueCounter}`,
        category: 'payer_pattern',
        severity: pattern.frequency > 25 ? 'high' : pattern.frequency > 15 ? 'medium' : 'low',
        weight: pattern.frequency > 25 ? SEVERITY_WEIGHTS.high : pattern.frequency > 15 ? SEVERITY_WEIGHTS.medium : SEVERITY_WEIGHTS.low,
        title: `${pattern.payer} Denial Risk: ${pattern.procedureCode}`,
        description: `${pattern.denialReason}. This issue accounts for approximately ${pattern.frequency}% of ${pattern.payer} denials for ${pattern.procedureCode}.`,
        suggestedFix: pattern.preventionTip,
        procedureCode: pattern.procedureCode,
        autoFixable: false,
      });
    }
  }

  // ── Check 7: Bundling Issues ─────────────────────────────────────────────

  // D2950 + Crown on same date
  const hasBuildUp = codes.includes('D2950');
  const hasCrown = codes.some(c => c >= 'D2710' && c <= 'D2799');
  if (hasBuildUp && hasCrown) {
    issueCounter++;
    issues.push({
      id: `issue_${issueCounter}`,
      category: 'bundling',
      severity: 'high',
      weight: SEVERITY_WEIGHTS.high,
      title: 'Bundling Risk: Core Buildup + Crown',
      description: 'D2950 (Core Buildup) and crown procedure are billed on the same claim. Many payers bundle these procedures and will deny the buildup as inclusive with the crown.',
      suggestedFix: 'Add narrative justifying the buildup as a separate procedure. Document that remaining tooth structure is less than 50%. Some payers require separate dates of service.',
      procedureCode: 'D2950',
      autoFixable: true,
    });
  }

  // D1110 + D4910 on same claim
  const hasProphy = codes.includes('D1110') || codes.includes('D1120');
  const hasPerioMaint = codes.includes('D4910');
  if (hasProphy && hasPerioMaint) {
    issueCounter++;
    issues.push({
      id: `issue_${issueCounter}`,
      category: 'bundling',
      severity: 'critical',
      weight: SEVERITY_WEIGHTS.critical,
      title: 'Mutually Exclusive Procedures: Prophy + Perio Maintenance',
      description: 'D1110/D1120 (Prophylaxis) and D4910 (Periodontal Maintenance) are mutually exclusive and cannot be billed on the same date. This claim will be denied.',
      suggestedFix: 'Remove either D1110/D1120 or D4910. For patients with a history of periodontal disease, bill D4910. For healthy patients, bill D1110.',
      autoFixable: false,
    });
  }

  // ── Calculate Risk Score ─────────────────────────────────────────────────

  const rawScore = issues.reduce((sum, issue) => sum + (issue.weight * (SEVERITY_WEIGHTS[issue.severity] / 10)), 0);
  const riskScore = Math.min(100, Math.round(rawScore));

  const riskLevel: ScrubResult['riskLevel'] =
    riskScore <= 25 ? 'low' :
    riskScore <= 50 ? 'medium' :
    riskScore <= 75 ? 'high' : 'critical';

  // ── Generate Suggested Narrative ─────────────────────────────────────────

  let suggestedNarrative: string | null = null;
  if (issues.some(i => i.category === 'narrative' || i.autoFixable)) {
    // Build composite narrative for all codes
    const toothInfo = claim.appointment?.clinicalNotes?.[0]?.toothNumbers || undefined;
    const narrativeParts = codes.map(code => generateNarrativeForProcedure(code, patientName, toothInfo || undefined));
    suggestedNarrative = narrativeParts.join('\n\n');
  }

  // ── Build Result ─────────────────────────────────────────────────────────

  const result: ScrubResult = {
    id: generateId(),
    claimId: claim.id,
    patientId: claim.patientId,
    patientName,
    claimDate: claim.claimDate,
    procedureCodes: claim.procedureCodes,
    totalAmount: claim.totalAmount,
    payerName,
    riskScore,
    riskLevel,
    issues,
    suggestedNarrative,
    originalNarrative: claim.narrative,
    status: 'pending',
    scrubbedAt: new Date().toISOString(),
  };

  scrubResults.set(result.id, result);
  return result;
}

// ─── Scrub All Pending Claims ───────────────────────────────────────────────

export async function scrubAllPending(): Promise<ScrubResult[]> {
  const pendingClaims = await prisma.insuranceClaim.findMany({
    where: {
      status: { in: ['draft', 'pending'] },
    },
    select: { id: true },
  });

  const results: ScrubResult[] = [];
  for (const claim of pendingClaims) {
    try {
      const result = await scrubClaim(claim.id);
      results.push(result);
    } catch (err) {
      console.error(`[claim-scrubber] Failed to scrub claim ${claim.id}:`, err);
    }
  }

  return results;
}

// ─── Get Payer Patterns ─────────────────────────────────────────────────────

export function getPayerPatterns(): PayerDenialPattern[] {
  return PAYER_DENIAL_PATTERNS;
}

// ─── Get Scrub Stats ────────────────────────────────────────────────────────

export function getScrubStats(): ScrubStats {
  const allResults = Array.from(scrubResults.values());
  const totalScrubbed = allResults.length;
  const totalIssuesFound = allResults.reduce((sum, r) => sum + r.issues.length, 0);
  const highRiskCount = allResults.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
  const criticalCount = allResults.filter(r => r.riskLevel === 'critical').length;

  // Prevention rate: claims where issues were found and addressed (applied or dismissed)
  const addressedClaims = allResults.filter(r => r.status === 'applied' || r.status === 'reviewed');
  const claimsWithIssues = allResults.filter(r => r.issues.length > 0);
  const preventionRate = claimsWithIssues.length > 0
    ? Math.round((addressedClaims.length / claimsWithIssues.length) * 100)
    : 0;

  // Issues by category
  const issuesByCategory: Record<string, number> = {};
  for (const result of allResults) {
    for (const issue of result.issues) {
      issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
    }
  }

  // Top risks by procedure code
  const codeRiskCounts: Record<string, { description: string; count: number }> = {};
  for (const result of allResults) {
    for (const issue of result.issues) {
      if (issue.procedureCode) {
        if (!codeRiskCounts[issue.procedureCode]) {
          codeRiskCounts[issue.procedureCode] = {
            description: FREQUENCY_LIMITS[issue.procedureCode]?.description || issue.procedureCode,
            count: 0,
          };
        }
        codeRiskCounts[issue.procedureCode].count++;
      }
    }
  }

  const topRisks = Object.entries(codeRiskCounts)
    .map(([code, data]) => ({ code, description: data.description, count: data.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalScrubbed,
    totalIssuesFound,
    highRiskCount,
    criticalCount,
    preventionRate,
    issuesByCategory,
    topRisks,
  };
}

// ─── Get All Results ────────────────────────────────────────────────────────

export function getAllResults(filters?: { risk?: string; status?: string }): ScrubResult[] {
  let results = Array.from(scrubResults.values());

  if (filters?.risk) {
    results = results.filter(r => r.riskLevel === filters.risk);
  }
  if (filters?.status) {
    results = results.filter(r => r.status === filters.status);
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

// ─── Get Result by Claim ID ─────────────────────────────────────────────────

export function getResultByClaimId(claimId: string): ScrubResult | undefined {
  return Array.from(scrubResults.values()).find(r => r.claimId === claimId);
}

// ─── Get Result by ID ───────────────────────────────────────────────────────

export function getResultById(id: string): ScrubResult | undefined {
  return scrubResults.get(id);
}

// ─── Update Result Status ───────────────────────────────────────────────────

export function updateResultStatus(id: string, status: ScrubResult['status']): ScrubResult | undefined {
  const result = scrubResults.get(id);
  if (result) {
    result.status = status;
    scrubResults.set(id, result);
  }
  return result;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
