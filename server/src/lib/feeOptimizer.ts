import { v4 as uuidv4 } from 'uuid';
import { logActivity } from './activity';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UcrData {
  code: string;
  description: string;
  category: string;
  p50: number;
  p75: number;
  p90: number;
}

export interface FeeEntry {
  id: string;
  scheduleId: string;
  code: string;
  description: string;
  category: string;
  feeAmount: number;
  ppoAllowedFee: number | null;
  annualVolume: number;
  ucrPercentile: number | null;
  writeOff: number | null;
  annualRevenue: number | null;
  annualWriteOff: number | null;
}

export interface FeeSchedule {
  id: string;
  name: string;
  type: 'standard' | 'ppo' | 'medicaid' | 'custom';
  payerName: string | null;
  effectiveDate: string;
  entries: FeeEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface OptimizationReport {
  id: string;
  scheduleId: string;
  scheduleName: string;
  generatedAt: string;
  totalAnnualRevenue: number;
  totalAnnualWriteOff: number;
  proceduresBelowP50: number;
  revenueOpportunity: number;
  modeledRevenue: { percentile: number; revenue: number; uplift: number }[];
  entryAnalysis: {
    code: string;
    description: string;
    currentFee: number;
    ucrPercentile: number;
    feeAtP50: number;
    feeAtP75: number;
    feeAtP90: number;
    annualVolume: number;
    upliftAtP75: number;
    writeOff: number;
    flag: 'undercharging' | 'below_average' | 'competitive' | 'premium';
  }[];
}

export interface WriteOffRow {
  code: string;
  description: string;
  category: string;
  standardFee: number;
  ppoAllowedFee: number;
  writeOffPerUnit: number;
  annualVolume: number;
  annualWriteOff: number;
  payerName: string;
}

export interface RenegotiationBrief {
  id: string;
  scheduleId: string;
  scheduleName: string;
  generatedAt: string;
  payerName: string;
  text: string;
  procedureCount: number;
  totalAnnualImpact: number;
}

// ─── UCR Database (Top 50 CDT codes) ───────────────────────────────────────

const UCR_DATABASE: UcrData[] = [
  // Diagnostic
  { code: 'D0120', description: 'Periodic Oral Evaluation', category: 'Diagnostic', p50: 52, p75: 65, p90: 82 },
  { code: 'D0140', description: 'Limited Oral Evaluation — Problem Focused', category: 'Diagnostic', p50: 75, p75: 94, p90: 115 },
  { code: 'D0150', description: 'Comprehensive Oral Evaluation — New Patient', category: 'Diagnostic', p50: 89, p75: 112, p90: 138 },
  { code: 'D0180', description: 'Comprehensive Periodontal Evaluation', category: 'Diagnostic', p50: 95, p75: 119, p90: 146 },
  { code: 'D0210', description: 'Full Mouth X-rays', category: 'Diagnostic', p50: 135, p75: 168, p90: 205 },
  { code: 'D0220', description: 'Periapical X-ray — First Film', category: 'Diagnostic', p50: 32, p75: 40, p90: 49 },
  { code: 'D0230', description: 'Periapical X-ray — Each Additional', category: 'Diagnostic', p50: 27, p75: 34, p90: 41 },
  { code: 'D0272', description: 'Bitewings — Two Films', category: 'Diagnostic', p50: 48, p75: 60, p90: 73 },
  { code: 'D0274', description: 'Bitewings — Four Films', category: 'Diagnostic', p50: 68, p75: 85, p90: 104 },
  { code: 'D0330', description: 'Panoramic X-ray', category: 'Diagnostic', p50: 115, p75: 145, p90: 177 },

  // Preventive
  { code: 'D1110', description: 'Adult Prophylaxis', category: 'Preventive', p50: 105, p75: 132, p90: 162 },
  { code: 'D1120', description: 'Child Prophylaxis', category: 'Preventive', p50: 72, p75: 90, p90: 110 },
  { code: 'D1206', description: 'Topical Fluoride Varnish', category: 'Preventive', p50: 38, p75: 48, p90: 58 },
  { code: 'D1351', description: 'Sealant — Per Tooth', category: 'Preventive', p50: 52, p75: 65, p90: 80 },
  { code: 'D1354', description: 'Interim Caries Arresting Agent', category: 'Preventive', p50: 25, p75: 31, p90: 38 },

  // Restorative
  { code: 'D2140', description: 'Amalgam — One Surface, Primary', category: 'Restorative', p50: 155, p75: 195, p90: 238 },
  { code: 'D2150', description: 'Amalgam — Two Surfaces, Primary', category: 'Restorative', p50: 195, p75: 245, p90: 300 },
  { code: 'D2160', description: 'Amalgam — Three Surfaces, Primary', category: 'Restorative', p50: 235, p75: 295, p90: 360 },
  { code: 'D2330', description: 'Composite — One Surface, Anterior', category: 'Restorative', p50: 175, p75: 220, p90: 268 },
  { code: 'D2331', description: 'Composite — Two Surfaces, Anterior', category: 'Restorative', p50: 215, p75: 270, p90: 330 },
  { code: 'D2332', description: 'Composite — Three Surfaces, Anterior', category: 'Restorative', p50: 260, p75: 327, p90: 399 },
  { code: 'D2391', description: 'Composite — One Surface, Posterior', category: 'Restorative', p50: 185, p75: 232, p90: 283 },
  { code: 'D2392', description: 'Composite — Two Surfaces, Posterior', category: 'Restorative', p50: 230, p75: 289, p90: 352 },
  { code: 'D2393', description: 'Composite — Three Surfaces, Posterior', category: 'Restorative', p50: 285, p75: 358, p90: 437 },
  { code: 'D2740', description: 'Crown — Porcelain/Ceramic', category: 'Restorative', p50: 1050, p75: 1320, p90: 1610 },
  { code: 'D2750', description: 'Crown — Porcelain Fused to Metal', category: 'Restorative', p50: 985, p75: 1238, p90: 1510 },
  { code: 'D2751', description: 'Crown — Porcelain Fused to Base Metal', category: 'Restorative', p50: 960, p75: 1207, p90: 1473 },
  { code: 'D2950', description: 'Core Buildup Including Pins', category: 'Restorative', p50: 275, p75: 345, p90: 421 },

  // Endodontics
  { code: 'D3310', description: 'Root Canal — Anterior', category: 'Endodontics', p50: 720, p75: 905, p90: 1104 },
  { code: 'D3320', description: 'Root Canal — Premolar', category: 'Endodontics', p50: 850, p75: 1068, p90: 1303 },
  { code: 'D3330', description: 'Root Canal — Molar', category: 'Endodontics', p50: 1050, p75: 1320, p90: 1610 },
  { code: 'D3346', description: 'Retreatment — Anterior', category: 'Endodontics', p50: 850, p75: 1068, p90: 1303 },
  { code: 'D3348', description: 'Retreatment — Molar', category: 'Endodontics', p50: 1180, p75: 1483, p90: 1810 },

  // Periodontics
  { code: 'D4341', description: 'Scaling & Root Planing — Per Quadrant (4+ teeth)', category: 'Periodontics', p50: 255, p75: 320, p90: 390 },
  { code: 'D4342', description: 'Scaling & Root Planing — Per Quadrant (1-3 teeth)', category: 'Periodontics', p50: 185, p75: 232, p90: 283 },
  { code: 'D4355', description: 'Full Mouth Debridement', category: 'Periodontics', p50: 185, p75: 232, p90: 283 },
  { code: 'D4910', description: 'Periodontal Maintenance', category: 'Periodontics', p50: 155, p75: 195, p90: 238 },

  // Prosthodontics
  { code: 'D5110', description: 'Complete Denture — Upper', category: 'Prosthodontics', p50: 1650, p75: 2074, p90: 2530 },
  { code: 'D5120', description: 'Complete Denture — Lower', category: 'Prosthodontics', p50: 1650, p75: 2074, p90: 2530 },
  { code: 'D5213', description: 'Upper Partial Denture — Cast Metal', category: 'Prosthodontics', p50: 1600, p75: 2011, p90: 2454 },
  { code: 'D5214', description: 'Lower Partial Denture — Cast Metal', category: 'Prosthodontics', p50: 1600, p75: 2011, p90: 2454 },
  { code: 'D6010', description: 'Implant Body — Endosteal', category: 'Prosthodontics', p50: 1950, p75: 2451, p90: 2992 },
  { code: 'D6058', description: 'Abutment — Porcelain/Ceramic', category: 'Prosthodontics', p50: 850, p75: 1068, p90: 1303 },
  { code: 'D6065', description: 'Implant Crown — Porcelain/Ceramic', category: 'Prosthodontics', p50: 1350, p75: 1697, p90: 2071 },

  // Oral Surgery
  { code: 'D7140', description: 'Extraction — Erupted Tooth', category: 'Oral Surgery', p50: 195, p75: 245, p90: 299 },
  { code: 'D7210', description: 'Surgical Extraction — Erupted Tooth', category: 'Oral Surgery', p50: 335, p75: 421, p90: 514 },
  { code: 'D7220', description: 'Extraction — Soft Tissue Impaction', category: 'Oral Surgery', p50: 350, p75: 440, p90: 537 },
  { code: 'D7230', description: 'Extraction — Partial Bony Impaction', category: 'Oral Surgery', p50: 410, p75: 515, p90: 629 },
  { code: 'D7240', description: 'Extraction — Complete Bony Impaction', category: 'Oral Surgery', p50: 425, p75: 534, p90: 651 },
  { code: 'D7250', description: 'Surgical Removal of Residual Roots', category: 'Oral Surgery', p50: 310, p75: 390, p90: 476 },

  // Adjunctive
  { code: 'D9110', description: 'Palliative Treatment of Dental Pain', category: 'Adjunctive', p50: 120, p75: 151, p90: 184 },
  { code: 'D9215', description: 'Local Anesthesia — Not with Procedure', category: 'Adjunctive', p50: 55, p75: 69, p90: 84 },
  { code: 'D9310', description: 'Consultation — Specialist', category: 'Adjunctive', p50: 95, p75: 119, p90: 146 },
];

// ─── In-Memory Store ────────────────────────────────────────────────────────

const feeSchedules: FeeSchedule[] = [];
const optimizationReports: OptimizationReport[] = [];
const renegotiationBriefs: RenegotiationBrief[] = [];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUcrForCode(code: string): UcrData | undefined {
  return UCR_DATABASE.find((u) => u.code === code);
}

/**
 * Interpolate where a fee sits relative to UCR percentile benchmarks.
 * Returns a value between 0 and 100.
 */
function calculateUcrPercentile(fee: number, ucr: UcrData): number {
  if (fee <= 0) return 0;
  if (fee >= ucr.p90) {
    // Extrapolate above 90th
    const extra = ((fee - ucr.p90) / (ucr.p90 - ucr.p75)) * 15;
    return Math.min(100, 90 + extra);
  }
  if (fee >= ucr.p75) {
    // Between 75th and 90th
    return 75 + ((fee - ucr.p75) / (ucr.p90 - ucr.p75)) * 15;
  }
  if (fee >= ucr.p50) {
    // Between 50th and 75th
    return 50 + ((fee - ucr.p50) / (ucr.p75 - ucr.p50)) * 25;
  }
  // Below 50th — interpolate down to 0
  const ratio = fee / ucr.p50;
  return ratio * 50;
}

function interpolateFeeAtPercentile(percentile: number, ucr: UcrData): number {
  if (percentile <= 50) return ucr.p50 * (percentile / 50);
  if (percentile <= 75) return ucr.p50 + ((ucr.p75 - ucr.p50) * (percentile - 50)) / 25;
  if (percentile <= 90) return ucr.p75 + ((ucr.p90 - ucr.p75) * (percentile - 75)) / 15;
  return ucr.p90 + ((ucr.p90 - ucr.p75) * (percentile - 90)) / 15;
}

function flagForPercentile(pct: number): 'undercharging' | 'below_average' | 'competitive' | 'premium' {
  if (pct < 25) return 'undercharging';
  if (pct < 50) return 'below_average';
  if (pct < 75) return 'competitive';
  return 'premium';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Pre-populate Schedules ─────────────────────────────────────────────────

function buildEntries(
  scheduleId: string,
  feeMultiplier: number,
  ppoMultiplier: number | null,
  volumeVariance: number
): FeeEntry[] {
  return UCR_DATABASE.map((ucr) => {
    // Vary the standard fee around a target percentile
    const baseVariance = 0.85 + Math.random() * 0.4; // 0.85 to 1.25
    const feeAmount = round2(ucr.p75 * feeMultiplier * baseVariance);
    const ppoAllowedFee = ppoMultiplier !== null ? round2(ucr.p50 * ppoMultiplier * (0.7 + Math.random() * 0.35)) : null;
    const annualVolume = Math.max(1, Math.floor((30 + Math.random() * 200) * volumeVariance));

    return {
      id: uuidv4(),
      scheduleId,
      code: ucr.code,
      description: ucr.description,
      category: ucr.category,
      feeAmount,
      ppoAllowedFee,
      annualVolume,
      ucrPercentile: null,
      writeOff: null,
      annualRevenue: null,
      annualWriteOff: null,
    };
  });
}

function seedSchedules(): void {
  if (feeSchedules.length > 0) return;

  const standardId = uuidv4();
  const ppoId = uuidv4();

  // Seed with deterministic-ish data by resetting random seed approximation
  const standardEntries = UCR_DATABASE.map((ucr, i) => {
    // Alternate between above and below market
    const multipliers = [0.92, 1.08, 0.85, 1.15, 0.95, 1.05, 0.88, 1.12, 0.90, 1.10];
    const mult = multipliers[i % multipliers.length];
    const feeAmount = round2(ucr.p75 * mult);
    const annualVolume = [180, 45, 35, 120, 250, 30, 20, 85, 140, 28, 200, 150, 180, 95, 15, 80, 55, 40, 65, 50, 38, 110, 75, 60, 22, 18, 12, 35, 20, 15, 8, 5, 160, 40, 25, 130, 10, 10, 8, 6, 28, 12, 16, 120, 45, 20, 30, 18, 5, 10, 20, 15][i] || 30;

    return {
      id: uuidv4(),
      scheduleId: standardId,
      code: ucr.code,
      description: ucr.description,
      category: ucr.category,
      feeAmount,
      ppoAllowedFee: null,
      annualVolume,
      ucrPercentile: null,
      writeOff: null,
      annualRevenue: null,
      annualWriteOff: null,
    };
  });

  const ppoEntries = UCR_DATABASE.map((ucr, i) => {
    // Standard fees (same as above for consistency)
    const multipliers = [0.92, 1.08, 0.85, 1.15, 0.95, 1.05, 0.88, 1.12, 0.90, 1.10];
    const mult = multipliers[i % multipliers.length];
    const standardFee = round2(ucr.p75 * mult);

    // PPO allowed fees are typically 10-35% below standard
    const ppoDiscounts = [0.72, 0.68, 0.75, 0.65, 0.70, 0.78, 0.66, 0.73, 0.71, 0.69];
    const ppoMult = ppoDiscounts[i % ppoDiscounts.length];
    const ppoAllowedFee = round2(standardFee * ppoMult);
    const annualVolume = [180, 45, 35, 120, 250, 30, 20, 85, 140, 28, 200, 150, 180, 95, 15, 80, 55, 40, 65, 50, 38, 110, 75, 60, 22, 18, 12, 35, 20, 15, 8, 5, 160, 40, 25, 130, 10, 10, 8, 6, 28, 12, 16, 120, 45, 20, 30, 18, 5, 10, 20, 15][i] || 30;

    return {
      id: uuidv4(),
      scheduleId: ppoId,
      code: ucr.code,
      description: ucr.description,
      category: ucr.category,
      feeAmount: standardFee,
      ppoAllowedFee,
      annualVolume,
      ucrPercentile: null,
      writeOff: null,
      annualRevenue: null,
      annualWriteOff: null,
    };
  });

  feeSchedules.push(
    {
      id: standardId,
      name: 'Office Standard',
      type: 'standard',
      payerName: null,
      effectiveDate: '2025-01-01',
      entries: standardEntries,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: ppoId,
      name: 'Delta Dental PPO',
      type: 'ppo',
      payerName: 'Delta Dental',
      effectiveDate: '2025-01-01',
      entries: ppoEntries,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  );
}

// Run seed on module load
seedSchedules();

// ─── Exported Functions ─────────────────────────────────────────────────────

export function getFeeSchedules(): Omit<FeeSchedule, 'entries'>[] {
  return feeSchedules.map(({ entries, ...rest }) => ({
    ...rest,
    entryCount: entries.length,
  }));
}

export function createFeeSchedule(data: {
  name: string;
  type: FeeSchedule['type'];
  payerName?: string;
  effectiveDate?: string;
  entries?: {
    code: string;
    description?: string;
    feeAmount: number;
    ppoAllowedFee?: number;
    annualVolume?: number;
  }[];
}): FeeSchedule {
  const id = uuidv4();
  const now = new Date().toISOString();

  const entries: FeeEntry[] = (data.entries || []).map((e) => {
    const ucr = getUcrForCode(e.code);
    return {
      id: uuidv4(),
      scheduleId: id,
      code: e.code,
      description: e.description || ucr?.description || e.code,
      category: ucr?.category || 'Other',
      feeAmount: e.feeAmount,
      ppoAllowedFee: e.ppoAllowedFee ?? null,
      annualVolume: e.annualVolume ?? 0,
      ucrPercentile: null,
      writeOff: null,
      annualRevenue: null,
      annualWriteOff: null,
    };
  });

  const schedule: FeeSchedule = {
    id,
    name: data.name,
    type: data.type,
    payerName: data.payerName ?? null,
    effectiveDate: data.effectiveDate ?? new Date().toISOString().split('T')[0],
    entries,
    createdAt: now,
    updatedAt: now,
  };

  feeSchedules.push(schedule);

  logActivity(
    'create_fee_schedule',
    'FeeSchedule',
    id,
    `Fee schedule "${data.name}" created with ${entries.length} entries`,
    { type: data.type, payerName: data.payerName, entryCount: entries.length },
  );

  return schedule;
}

export function getFeeSchedule(id: string): FeeSchedule | undefined {
  return feeSchedules.find((s) => s.id === id);
}

export function updateFeeEntry(
  scheduleId: string,
  entryId: string,
  updates: Partial<Pick<FeeEntry, 'feeAmount' | 'ppoAllowedFee' | 'annualVolume'>>
): FeeEntry | undefined {
  const schedule = feeSchedules.find((s) => s.id === scheduleId);
  if (!schedule) return undefined;

  const entry = schedule.entries.find((e) => e.id === entryId);
  if (!entry) return undefined;

  if (updates.feeAmount !== undefined) entry.feeAmount = updates.feeAmount;
  if (updates.ppoAllowedFee !== undefined) entry.ppoAllowedFee = updates.ppoAllowedFee;
  if (updates.annualVolume !== undefined) entry.annualVolume = updates.annualVolume;

  // Recompute derived fields
  const ucr = getUcrForCode(entry.code);
  if (ucr) {
    const feeToAnalyze = entry.ppoAllowedFee ?? entry.feeAmount;
    entry.ucrPercentile = round2(calculateUcrPercentile(feeToAnalyze, ucr));
  }
  if (entry.ppoAllowedFee !== null) {
    entry.writeOff = round2(entry.feeAmount - entry.ppoAllowedFee);
  }
  entry.annualRevenue = round2((entry.ppoAllowedFee ?? entry.feeAmount) * entry.annualVolume);
  entry.annualWriteOff = entry.writeOff !== null ? round2(entry.writeOff * entry.annualVolume) : null;

  schedule.updatedAt = new Date().toISOString();

  return entry;
}

export function analyzeFees(scheduleId: string): FeeSchedule | undefined {
  const schedule = feeSchedules.find((s) => s.id === scheduleId);
  if (!schedule) return undefined;

  for (const entry of schedule.entries) {
    const ucr = getUcrForCode(entry.code);
    if (!ucr) continue;

    // For PPO schedules, percentile is based on the PPO allowed fee
    const feeToAnalyze = schedule.type === 'ppo' && entry.ppoAllowedFee !== null
      ? entry.ppoAllowedFee
      : entry.feeAmount;

    entry.ucrPercentile = round2(calculateUcrPercentile(feeToAnalyze, ucr));

    if (entry.ppoAllowedFee !== null) {
      entry.writeOff = round2(entry.feeAmount - entry.ppoAllowedFee);
    } else {
      entry.writeOff = null;
    }

    const effectiveFee = entry.ppoAllowedFee ?? entry.feeAmount;
    entry.annualRevenue = round2(effectiveFee * entry.annualVolume);
    entry.annualWriteOff = entry.writeOff !== null ? round2(entry.writeOff * entry.annualVolume) : null;
  }

  schedule.updatedAt = new Date().toISOString();

  logActivity(
    'analyze_fees',
    'FeeSchedule',
    scheduleId,
    `UCR analysis completed for "${schedule.name}" — ${schedule.entries.length} procedures analyzed`,
    { entryCount: schedule.entries.length },
  );

  return schedule;
}

export function generateOptimizationReport(scheduleId: string): OptimizationReport | undefined {
  // Make sure analysis has been run
  const schedule = analyzeFees(scheduleId);
  if (!schedule) return undefined;

  const entryAnalysis = schedule.entries
    .filter((e) => getUcrForCode(e.code))
    .map((e) => {
      const ucr = getUcrForCode(e.code)!;
      const currentFee = e.ppoAllowedFee ?? e.feeAmount;
      const percentile = e.ucrPercentile ?? 0;
      const upliftAtP75 = round2(Math.max(0, ucr.p75 - currentFee) * e.annualVolume);

      return {
        code: e.code,
        description: e.description,
        currentFee,
        ucrPercentile: percentile,
        feeAtP50: ucr.p50,
        feeAtP75: ucr.p75,
        feeAtP90: ucr.p90,
        annualVolume: e.annualVolume,
        upliftAtP75,
        writeOff: e.annualWriteOff ?? 0,
        flag: flagForPercentile(percentile),
      };
    });

  const totalAnnualRevenue = round2(
    schedule.entries.reduce((sum, e) => sum + (e.annualRevenue ?? 0), 0),
  );
  const totalAnnualWriteOff = round2(
    schedule.entries.reduce((sum, e) => sum + (e.annualWriteOff ?? 0), 0),
  );
  const proceduresBelowP50 = entryAnalysis.filter((e) => e.ucrPercentile < 50).length;
  const revenueOpportunity = round2(
    entryAnalysis.reduce((sum, e) => sum + e.upliftAtP75, 0),
  );

  // Model revenue at different percentile targets
  const modeledRevenue = [50, 60, 75, 85, 90].map((targetPct) => {
    let revenue = 0;
    let uplift = 0;
    for (const e of schedule.entries) {
      const ucr = getUcrForCode(e.code);
      if (!ucr) continue;
      const currentFee = e.ppoAllowedFee ?? e.feeAmount;
      const targetFee = interpolateFeeAtPercentile(targetPct, ucr);
      const newFee = Math.max(currentFee, targetFee);
      revenue += newFee * e.annualVolume;
      uplift += Math.max(0, newFee - currentFee) * e.annualVolume;
    }
    return {
      percentile: targetPct,
      revenue: round2(revenue),
      uplift: round2(uplift),
    };
  });

  const report: OptimizationReport = {
    id: uuidv4(),
    scheduleId,
    scheduleName: schedule.name,
    generatedAt: new Date().toISOString(),
    totalAnnualRevenue,
    totalAnnualWriteOff,
    proceduresBelowP50,
    revenueOpportunity,
    modeledRevenue,
    entryAnalysis,
  };

  optimizationReports.push(report);

  logActivity(
    'generate_optimization_report',
    'FeeSchedule',
    scheduleId,
    `Optimization report generated for "${schedule.name}" — $${revenueOpportunity.toLocaleString()} revenue opportunity identified`,
    { totalAnnualRevenue, totalAnnualWriteOff, proceduresBelowP50, revenueOpportunity },
  );

  return report;
}

export function getWriteOffAnalysis(): {
  byPayer: { payerName: string; totalWriteOff: number; procedureCount: number }[];
  details: WriteOffRow[];
} {
  const details: WriteOffRow[] = [];
  const payerMap: Record<string, { totalWriteOff: number; procedureCount: number }> = {};

  for (const schedule of feeSchedules) {
    if (schedule.type !== 'ppo' || !schedule.payerName) continue;

    for (const entry of schedule.entries) {
      if (entry.ppoAllowedFee === null) continue;

      const writeOffPerUnit = round2(entry.feeAmount - entry.ppoAllowedFee);
      if (writeOffPerUnit <= 0) continue;

      const annualWriteOff = round2(writeOffPerUnit * entry.annualVolume);

      details.push({
        code: entry.code,
        description: entry.description,
        category: entry.category,
        standardFee: entry.feeAmount,
        ppoAllowedFee: entry.ppoAllowedFee,
        writeOffPerUnit,
        annualVolume: entry.annualVolume,
        annualWriteOff,
        payerName: schedule.payerName,
      });

      if (!payerMap[schedule.payerName]) {
        payerMap[schedule.payerName] = { totalWriteOff: 0, procedureCount: 0 };
      }
      payerMap[schedule.payerName].totalWriteOff += annualWriteOff;
      payerMap[schedule.payerName].procedureCount += 1;
    }
  }

  const byPayer = Object.entries(payerMap).map(([payerName, data]) => ({
    payerName,
    totalWriteOff: round2(data.totalWriteOff),
    procedureCount: data.procedureCount,
  }));

  return { byPayer, details: details.sort((a, b) => b.annualWriteOff - a.annualWriteOff) };
}

export function generateRenegotiationBrief(scheduleId: string): RenegotiationBrief | undefined {
  const schedule = analyzeFees(scheduleId);
  if (!schedule) return undefined;

  const payerName = schedule.payerName || schedule.name;
  const belowP50 = schedule.entries
    .filter((e) => {
      if (e.ucrPercentile === null) return false;
      return e.ucrPercentile < 50;
    })
    .sort((a, b) => (a.ucrPercentile ?? 0) - (b.ucrPercentile ?? 0));

  let totalAnnualImpact = 0;
  const lines: string[] = [];

  lines.push(`PPO FEE RENEGOTIATION BRIEF`);
  lines.push(`==========================`);
  lines.push(``);
  lines.push(`Payer: ${payerName}`);
  lines.push(`Schedule: ${schedule.name}`);
  lines.push(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push(`Analysis: ${schedule.entries.length} procedures reviewed against UCR benchmarks`);
  lines.push(``);
  lines.push(`EXECUTIVE SUMMARY`);
  lines.push(`-----------------`);
  lines.push(`${belowP50.length} of ${schedule.entries.length} procedures are reimbursed below the 50th percentile UCR.`);
  lines.push(`This represents a significant departure from prevailing market rates and creates`);
  lines.push(`an unsustainable financial burden on the practice.`);
  lines.push(``);
  lines.push(`PROCEDURES REQUIRING ADJUSTMENT`);
  lines.push(`-------------------------------`);
  lines.push(``);

  for (const entry of belowP50) {
    const ucr = getUcrForCode(entry.code);
    if (!ucr) continue;

    const currentFee = entry.ppoAllowedFee ?? entry.feeAmount;
    const targetFee = ucr.p50;
    const perProcedureGap = round2(targetFee - currentFee);
    const annualImpact = round2(perProcedureGap * entry.annualVolume);
    totalAnnualImpact += annualImpact;

    lines.push(`${entry.code} — ${entry.description}`);
    lines.push(`  Current Allowed:   $${currentFee.toFixed(2)}`);
    lines.push(`  UCR 50th Pctl:     $${ucr.p50.toFixed(2)}`);
    lines.push(`  UCR 75th Pctl:     $${ucr.p75.toFixed(2)}`);
    lines.push(`  Your Percentile:   ${(entry.ucrPercentile ?? 0).toFixed(1)}th`);
    lines.push(`  Gap per Procedure: $${perProcedureGap.toFixed(2)}`);
    lines.push(`  Annual Volume:     ${entry.annualVolume}`);
    lines.push(`  Annual Impact:     $${annualImpact.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    lines.push(``);
  }

  lines.push(`TOTAL ANNUAL IMPACT`);
  lines.push(`-------------------`);
  lines.push(`Bringing the ${belowP50.length} undervalued procedures to the 50th percentile UCR`);
  lines.push(`would increase annual collections by approximately $${totalAnnualImpact.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`);
  lines.push(``);
  lines.push(`REQUESTED ACTIONS`);
  lines.push(`-----------------`);
  lines.push(`1. Review the listed procedures and adjust allowable fees to at minimum the 50th percentile UCR.`);
  lines.push(`2. Provide an updated fee schedule within 30 days.`);
  lines.push(`3. Apply adjusted rates retroactively to claims filed within the last 90 days where applicable.`);
  lines.push(``);
  lines.push(`This analysis is based on current UCR data for our geographic region. We value our`);
  lines.push(`relationship with ${payerName} and look forward to a mutually beneficial resolution.`);

  const brief: RenegotiationBrief = {
    id: uuidv4(),
    scheduleId,
    scheduleName: schedule.name,
    generatedAt: new Date().toISOString(),
    payerName,
    text: lines.join('\n'),
    procedureCount: belowP50.length,
    totalAnnualImpact: round2(totalAnnualImpact),
  };

  renegotiationBriefs.push(brief);

  logActivity(
    'generate_renegotiation_brief',
    'FeeSchedule',
    scheduleId,
    `Renegotiation brief generated for "${payerName}" — ${belowP50.length} procedures, $${round2(totalAnnualImpact).toLocaleString()} annual impact`,
    { payerName, procedureCount: belowP50.length, totalAnnualImpact: round2(totalAnnualImpact) },
  );

  return brief;
}

export function getReports(): OptimizationReport[] {
  return optimizationReports.sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}

export function getUcrDatabase(): UcrData[] {
  return UCR_DATABASE;
}
