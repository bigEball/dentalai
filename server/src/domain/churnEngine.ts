import { prisma } from '../db/client';
import { scorePatient } from './patientScoring';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ChurnRiskTier = 'low' | 'moderate' | 'high' | 'critical';
export type LtvTier = 'platinum' | 'gold' | 'silver' | 'bronze';
export type RecoveryTier = 'warm' | 'cooling' | 'cold' | 'frozen';
export type RetentionActionStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed';

export interface ChurnFactors {
  recency: number;       // 0.0-1.0
  frequency: number;     // 0.0-1.0
  monetary: number;      // 0.0-1.0
  engagement: number;    // 0.0-1.0
  negativeSignals: number; // 0.0-1.0
}

export interface ChurnProfile {
  patientId: string;
  patientName: string;
  churnProbability: number;
  churnRiskTier: ChurnRiskTier;
  factors: ChurnFactors;
  annualValue: number;
  lifetimeValue: number;
  ltvTier: LtvTier;
  retentionPriority: number; // 0-100
  daysSinceLastVisit: number;
  recoveryTier: RecoveryTier | null;
  yearsAsPatient: number;
  totalAppointments: number;
  calculatedAt: string;
}

export interface RetentionAction {
  id: string;
  patientId: string;
  patientName: string;
  actionType: string;
  description: string;
  priority: number;
  status: RetentionActionStatus;
  outcome: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurnDashboard {
  totalPatients: number;
  atRiskCount: number;
  criticalCount: number;
  totalLtvAtRisk: number;
  avgChurnProbability: number;
  tierDistribution: Record<ChurnRiskTier, number>;
  ltvTierDistribution: Record<LtvTier, number>;
  recoveryPipeline: Record<RecoveryTier, number>;
  recoveredCount: number;
  pendingActionsCount: number;
}

// ─── In-Memory Storage ──────────────────────────────────────────────────────

const profilesMap = new Map<string, ChurnProfile>();
const actionsMap = new Map<string, RetentionAction>();
let actionIdCounter = 1;
let recoveredCount = 0;

// ─── Weight Constants ───────────────────────────────────────────────────────

const CHURN_WEIGHTS = {
  recency: 0.30,
  frequency: 0.25,
  monetary: 0.15,
  engagement: 0.20,
  negativeSignals: 0.10,
};

// ─── Helper: Clamp ──────────────────────────────────────────────────────────

function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

// ─── Factor Calculators ─────────────────────────────────────────────────────

function calcRecencyFactor(daysSinceLastVisit: number): number {
  if (daysSinceLastVisit <= 90) return 0.1;
  if (daysSinceLastVisit <= 180) return 0.3;
  if (daysSinceLastVisit <= 365) return 0.6;
  return 0.9;
}

function calcFrequencyFactor(appointmentCount: number, yearsAsPatient: number): number {
  const years = Math.max(1, yearsAsPatient);
  const annualFreq = appointmentCount / years;
  // Expected: 2-4 visits per year. 3 is ideal midpoint.
  const expectedMin = 2;
  if (annualFreq >= expectedMin) return 0.1;
  if (annualFreq >= 1.5) return 0.3;
  if (annualFreq >= 1.0) return 0.5;
  if (annualFreq >= 0.5) return 0.7;
  return 0.9;
}

function calcMonetaryFactor(totalClaimAmount: number, yearsAsPatient: number): number {
  const years = Math.max(1, yearsAsPatient);
  const annualSpend = totalClaimAmount / years;
  // Dental average $500-2000/yr
  if (annualSpend >= 2000) return 0.05;
  if (annualSpend >= 1000) return 0.2;
  if (annualSpend >= 500) return 0.4;
  if (annualSpend >= 200) return 0.6;
  return 0.85;
}

function calcEngagementFactor(engagementScore: number, commResponseRate: number, formCompletionRate: number, followUpResponseRate: number): number {
  // engagement score is 0-100 from patientScoring
  const normalized = engagementScore / 100;
  // Weight: 50% existing score, 20% comm, 15% forms, 15% follow-ups
  const combined = normalized * 0.50 + (1 - commResponseRate) * 0.20 + (1 - formCompletionRate) * 0.15 + (1 - followUpResponseRate) * 0.15;
  return clamp01(combined);
}

function calcNegativeSignalsFactor(
  declinedPlans: number,
  noShows: number,
  overdueBalances: number,
  unresponsiveRecalls: number,
): number {
  const total = declinedPlans + noShows + overdueBalances + unresponsiveRecalls;
  if (total === 0) return 0.0;
  if (total <= 1) return 0.2;
  if (total <= 3) return 0.4;
  if (total <= 5) return 0.6;
  if (total <= 8) return 0.8;
  return 1.0;
}

// ─── Churn Risk Tier ────────────────────────────────────────────────────────

function getChurnRiskTier(probability: number): ChurnRiskTier {
  if (probability < 0.25) return 'low';
  if (probability < 0.50) return 'moderate';
  if (probability < 0.75) return 'high';
  return 'critical';
}

// ─── LTV Tier ───────────────────────────────────────────────────────────────

function getLtvTier(annualValue: number): LtvTier {
  if (annualValue > 5000) return 'platinum';
  if (annualValue >= 3000) return 'gold';
  if (annualValue >= 1500) return 'silver';
  return 'bronze';
}

// ─── Recovery Tier ──────────────────────────────────────────────────────────

function getRecoveryTier(daysSinceLastVisit: number): RecoveryTier | null {
  if (daysSinceLastVisit < 180) return null; // not lapsed
  if (daysSinceLastVisit <= 270) return 'warm';
  if (daysSinceLastVisit <= 365) return 'cooling';
  if (daysSinceLastVisit <= 545) return 'cold';
  return 'frozen';
}

// ─── Main: Calculate Churn Profile ──────────────────────────────────────────

export async function calculateChurnProfile(patientId: string): Promise<ChurnProfile> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, firstName: true, lastName: true, createdAt: true },
  });

  if (!patient) throw new Error(`Patient ${patientId} not found`);

  // Gather all data in parallel
  const [
    appointments,
    claims,
    balances,
    treatmentPlans,
    communications,
    followUps,
    recallTasks,
    forms,
    patientScores,
  ] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId },
      select: { id: true, date: true, status: true },
      orderBy: { date: 'desc' },
    }),
    prisma.insuranceClaim.findMany({
      where: { patientId },
      select: { totalAmount: true },
    }),
    prisma.balance.findMany({
      where: { patientId },
      select: { amount: true, collectionStatus: true },
    }),
    prisma.treatmentPlan.findMany({
      where: { patientId },
      select: { status: true },
    }),
    prisma.communication.findMany({
      where: { patientId },
      select: { direction: true, status: true, readAt: true },
    }),
    prisma.followUp.findMany({
      where: { patientId },
      select: { status: true },
    }),
    prisma.recallTask.findMany({
      where: { patientId },
      select: { status: true },
    }),
    prisma.patientForm.findMany({
      where: { patientId },
      select: { status: true },
    }),
    scorePatient(patientId),
  ]);

  const now = new Date();
  const createdAt = new Date(patient.createdAt);
  const yearsAsPatient = Math.max(0.25, (now.getTime() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  // Recency: days since last appointment
  let daysSinceLastVisit = 999;
  const completedAppts = appointments.filter((a) => a.status === 'completed');
  if (completedAppts.length > 0) {
    const lastDate = new Date(completedAppts[0].date);
    daysSinceLastVisit = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Frequency: appointments in last 2 years
  const twoYearsAgo = new Date(now.getTime() - 2 * 365.25 * 24 * 60 * 60 * 1000);
  const recentAppointments = appointments.filter(
    (a) => a.status === 'completed' && new Date(a.date) >= twoYearsAgo,
  );

  // Monetary: total claim amounts
  const totalClaimAmount = claims.reduce((sum, c) => sum + c.totalAmount, 0);

  // Engagement sub-factors
  const outboundComms = communications.filter((c) => c.direction === 'outbound');
  const readComms = outboundComms.filter((c) => c.readAt !== null);
  const commResponseRate = outboundComms.length > 0 ? readComms.length / outboundComms.length : 0.5;

  const submittedForms = forms.filter((f) => f.status === 'submitted' || f.status === 'reviewed');
  const formCompletionRate = forms.length > 0 ? submittedForms.length / forms.length : 0.5;

  const respondedFollowUps = followUps.filter((f) => f.status === 'responded' || f.status === 'completed');
  const sentFollowUps = followUps.filter((f) => f.status !== 'pending');
  const followUpResponseRate = sentFollowUps.length > 0 ? respondedFollowUps.length / sentFollowUps.length : 0.5;

  // Negative signals
  const declinedPlans = treatmentPlans.filter((p) => p.status === 'declined').length;
  const noShows = appointments.filter((a) => a.status === 'no-show').length;
  const overdueBalances = balances.filter(
    (b) => b.collectionStatus !== 'current' && b.amount > 0,
  ).length;
  const unresponsiveRecalls = recallTasks.filter(
    (r) => r.status === 'pending' || r.status === 'contacted',
  ).length;

  // Calculate factors
  const factors: ChurnFactors = {
    recency: calcRecencyFactor(daysSinceLastVisit),
    frequency: calcFrequencyFactor(recentAppointments.length, Math.min(yearsAsPatient, 2)),
    monetary: calcMonetaryFactor(totalClaimAmount, yearsAsPatient),
    engagement: calcEngagementFactor(
      patientScores.engagement,
      commResponseRate,
      formCompletionRate,
      followUpResponseRate,
    ),
    negativeSignals: calcNegativeSignalsFactor(
      declinedPlans,
      noShows,
      overdueBalances,
      unresponsiveRecalls,
    ),
  };

  // Weighted sum
  const churnProbability = clamp01(
    factors.recency * CHURN_WEIGHTS.recency +
    factors.frequency * CHURN_WEIGHTS.frequency +
    factors.monetary * CHURN_WEIGHTS.monetary +
    factors.engagement * CHURN_WEIGHTS.engagement +
    factors.negativeSignals * CHURN_WEIGHTS.negativeSignals,
  );

  // LTV calculation
  const annualValue = totalClaimAmount / Math.max(1, yearsAsPatient);
  const expectedRemainingYears = 10; // average patient retention horizon
  const lifetimeValue = annualValue * expectedRemainingYears * (1 - churnProbability);

  // Retention priority: higher = more urgent
  const maxAnnualValue = 8000; // normalization cap
  const normalizedLTV = Math.min(1, annualValue / maxAnnualValue);
  const retentionPriority = Math.round(
    churnProbability * 50 + (1 - normalizedLTV) * 50,
  );

  const profile: ChurnProfile = {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    churnProbability: Math.round(churnProbability * 1000) / 1000,
    churnRiskTier: getChurnRiskTier(churnProbability),
    factors,
    annualValue: Math.round(annualValue * 100) / 100,
    lifetimeValue: Math.round(lifetimeValue * 100) / 100,
    ltvTier: getLtvTier(annualValue),
    retentionPriority: Math.min(100, Math.max(0, retentionPriority)),
    daysSinceLastVisit,
    recoveryTier: getRecoveryTier(daysSinceLastVisit),
    yearsAsPatient: Math.round(yearsAsPatient * 10) / 10,
    totalAppointments: appointments.length,
    calculatedAt: now.toISOString(),
  };

  profilesMap.set(patientId, profile);
  return profile;
}

// ─── Calculate All Profiles ─────────────────────────────────────────────────

export async function calculateAllProfiles(): Promise<ChurnProfile[]> {
  const patients = await prisma.patient.findMany({
    select: { id: true },
  });

  const profiles: ChurnProfile[] = [];
  // Process in batches of 5 to avoid overwhelming the DB
  for (let i = 0; i < patients.length; i += 5) {
    const batch = patients.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map((p) => calculateChurnProfile(p.id)),
    );
    profiles.push(...batchResults);
  }

  return profiles.sort((a, b) => b.retentionPriority - a.retentionPriority);
}

// ─── Dashboard Aggregation ──────────────────────────────────────────────────

export async function getChurnDashboard(): Promise<ChurnDashboard> {
  // Ensure profiles are calculated
  if (profilesMap.size === 0) {
    await calculateAllProfiles();
  }

  const profiles = Array.from(profilesMap.values());
  const totalPatients = profiles.length;

  const tierDistribution: Record<ChurnRiskTier, number> = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };

  const ltvTierDistribution: Record<LtvTier, number> = {
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  };

  const recoveryPipeline: Record<RecoveryTier, number> = {
    warm: 0,
    cooling: 0,
    cold: 0,
    frozen: 0,
  };

  let totalLtvAtRisk = 0;
  let totalChurn = 0;
  let atRiskCount = 0;
  let criticalCount = 0;

  for (const p of profiles) {
    tierDistribution[p.churnRiskTier]++;
    ltvTierDistribution[p.ltvTier]++;

    if (p.recoveryTier) {
      recoveryPipeline[p.recoveryTier]++;
    }

    totalChurn += p.churnProbability;

    if (p.churnRiskTier === 'high' || p.churnRiskTier === 'critical') {
      atRiskCount++;
      totalLtvAtRisk += p.lifetimeValue;
    }

    if (p.churnRiskTier === 'critical') {
      criticalCount++;
    }
  }

  return {
    totalPatients,
    atRiskCount,
    criticalCount,
    totalLtvAtRisk: Math.round(totalLtvAtRisk * 100) / 100,
    avgChurnProbability: totalPatients > 0
      ? Math.round((totalChurn / totalPatients) * 1000) / 1000
      : 0,
    tierDistribution,
    ltvTierDistribution,
    recoveryPipeline,
    recoveredCount,
    pendingActionsCount: Array.from(actionsMap.values()).filter(
      (a) => a.status === 'pending',
    ).length,
  };
}

// ─── Retention Action Generation ────────────────────────────────────────────

export async function generateRetentionActions(patientId: string): Promise<RetentionAction[]> {
  let profile = profilesMap.get(patientId);
  if (!profile) {
    profile = await calculateChurnProfile(patientId);
  }

  const actions: RetentionAction[] = [];
  const now = new Date().toISOString();

  const isHighChurn = profile.churnRiskTier === 'high' || profile.churnRiskTier === 'critical';
  const isHighLTV = profile.ltvTier === 'platinum' || profile.ltvTier === 'gold';

  if (isHighChurn && isHighLTV) {
    // High churn + high LTV: VIP outreach
    actions.push(
      createAction(patientId, profile.patientName, 'vip_outreach_call', 'Schedule a personal outreach call from the provider to discuss care continuity', profile.retentionPriority, now),
      createAction(patientId, profile.patientName, 'personal_provider_message', 'Send a personalized message from their provider expressing concern and offering a convenient appointment', profile.retentionPriority - 5, now),
    );
  } else if (isHighChurn && !isHighLTV) {
    // High churn + low LTV: reactivation
    actions.push(
      createAction(patientId, profile.patientName, 'reactivation_email', 'Send a reactivation email campaign with a special return offer', profile.retentionPriority, now),
      createAction(patientId, profile.patientName, 'special_offer', 'Extend a special offer for a complimentary cleaning or exam to encourage return', profile.retentionPriority - 5, now),
    );
  } else if (profile.churnRiskTier === 'moderate') {
    // Moderate churn
    actions.push(
      createAction(patientId, profile.patientName, 'personalized_checkin', 'Send a personalized check-in message asking about their dental health', profile.retentionPriority, now),
      createAction(patientId, profile.patientName, 'treatment_reminder', 'Send a reminder about any pending or recommended treatments', profile.retentionPriority - 5, now),
    );
  }

  // Recovery-tier-specific actions
  if (profile.recoveryTier === 'cold' || profile.recoveryTier === 'frozen') {
    actions.push(
      createAction(patientId, profile.patientName, 'win_back_campaign', `Patient has been inactive for ${profile.daysSinceLastVisit} days. Launch a win-back campaign with a compelling offer`, profile.retentionPriority + 10, now),
    );
  }

  // Store actions
  for (const action of actions) {
    actionsMap.set(action.id, action);
  }

  return actions;
}

function createAction(
  patientId: string,
  patientName: string,
  actionType: string,
  description: string,
  priority: number,
  timestamp: string,
): RetentionAction {
  const id = `ra_${actionIdCounter++}`;
  return {
    id,
    patientId,
    patientName,
    actionType,
    description,
    priority: Math.min(100, Math.max(0, priority)),
    status: 'pending',
    outcome: null,
    notes: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

// ─── Get Retention Actions ──────────────────────────────────────────────────

export function getRetentionActions(status?: RetentionActionStatus): RetentionAction[] {
  const actions = Array.from(actionsMap.values());
  if (status) {
    return actions
      .filter((a) => a.status === status)
      .sort((a, b) => b.priority - a.priority);
  }
  return actions.sort((a, b) => b.priority - a.priority);
}

// ─── Update Retention Action ────────────────────────────────────────────────

export function updateRetentionAction(
  id: string,
  updates: { status?: RetentionActionStatus; outcome?: string; notes?: string },
): RetentionAction | null {
  const action = actionsMap.get(id);
  if (!action) return null;

  const updated: RetentionAction = {
    ...action,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Track recovered patients
  if (updates.status === 'completed' && action.status !== 'completed') {
    recoveredCount++;
  }

  actionsMap.set(id, updated);
  return updated;
}

// ─── Get All Profiles (from cache) ──────────────────────────────────────────

export function getCachedProfiles(): ChurnProfile[] {
  return Array.from(profilesMap.values());
}

// ─── Get Single Profile (from cache) ────────────────────────────────────────

export function getCachedProfile(patientId: string): ChurnProfile | undefined {
  return profilesMap.get(patientId);
}
