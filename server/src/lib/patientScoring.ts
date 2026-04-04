import { prisma } from '../db/client';

// ─── Score Interfaces ────────────────────────────────────────────────────────

export interface PatientScores {
  patientId: string;
  patientName: string;
  attendance: number;       // 0-100
  financial: number;        // 0-100
  engagement: number;       // 0-100
  treatmentCommitment: number; // 0-100
  composite: number;        // weighted average
  alerts: ScoreAlert[];
  calculatedAt: string;
}

export interface ScoreAlert {
  type: 'deposit_required' | 'double_book' | 'priority_outreach' | 'front_desk_warning' | 'high_value';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  score: string; // which score triggered it
}

// ─── Scoring Weights (for composite) ─────────────────────────────────────────

const WEIGHTS = {
  attendance: 0.35,
  financial: 0.30,
  engagement: 0.20,
  treatmentCommitment: 0.15,
};

// ─── Score Thresholds for Alerts ─────────────────────────────────────────────

const THRESHOLDS = {
  depositRequired: 40,        // financial score below this → require deposit
  doubleBook: 35,             // attendance score below this → suggest double-booking
  priorityOutreach: 75,       // engagement above this → prioritize outreach (they respond)
  frontDeskWarning: 30,       // composite below this → warn front desk
  highValue: 80,              // composite above this → high-value patient
};

// ─── Clamp helper ────────────────────────────────────────────────────────────

function clamp(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val)));
}

// ─── Attendance Score (0-100) ────────────────────────────────────────────────
// Factors: no-show rate, cancellation rate, recall overdue days

async function calcAttendance(patientId: string): Promise<number> {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    select: { status: true },
  });

  const recallTasks = await prisma.recallTask.findMany({
    where: { patientId },
    select: { daysOverdue: true, status: true },
  });

  if (appointments.length === 0 && recallTasks.length === 0) return 70; // neutral for new patients

  let score = 100;

  // Appointment attendance (60% of attendance score)
  if (appointments.length > 0) {
    const total = appointments.length;
    const noShows = appointments.filter((a) => a.status === 'no-show').length;
    const cancellations = appointments.filter((a) => a.status === 'cancelled').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;

    const noShowRate = noShows / total;
    const cancelRate = cancellations / total;
    const completionRate = completed / total;

    // No-shows are heavily penalized
    const appointmentScore = 100 - (noShowRate * 150) - (cancelRate * 50) + (completionRate * 20);
    score = appointmentScore * 0.6;
  } else {
    score = 70 * 0.6;
  }

  // Recall compliance (40% of attendance score)
  if (recallTasks.length > 0) {
    const avgOverdue = recallTasks.reduce((s, r) => s + r.daysOverdue, 0) / recallTasks.length;
    const scheduled = recallTasks.filter((r) => r.status === 'scheduled').length;
    const scheduledRate = scheduled / recallTasks.length;

    // Overdue days penalize: 0 days = 100, 30 days = 80, 90 days = 50, 180+ = 20
    let recallScore = 100 - (avgOverdue / 2);
    recallScore += scheduledRate * 20;
    score += clamp(recallScore) * 0.4;
  } else {
    score += 80 * 0.4;
  }

  return clamp(score);
}

// ─── Financial Score (0-100) ──────────────────────────────────────────────────
// Factors: outstanding balance, collection status, payment plan behavior, payment timeliness

async function calcFinancial(patientId: string): Promise<number> {
  const [patient, balances, paymentPlans] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId }, select: { outstandingBalance: true } }),
    prisma.balance.findMany({ where: { patientId }, select: { amount: true, collectionStatus: true, dueDate: true, lastPaymentDate: true } }),
    prisma.paymentPlan.findMany({
      where: { patientId },
      include: { installments: { select: { status: true } } },
    }),
  ]);

  if (!patient) return 50;

  let score = 100;

  // Outstanding balance penalty (up to -30 points)
  const balance = patient.outstandingBalance;
  if (balance > 0) {
    if (balance > 2000) score -= 30;
    else if (balance > 1000) score -= 20;
    else if (balance > 500) score -= 12;
    else if (balance > 100) score -= 5;
  }

  // Collection status penalty (up to -40 points)
  if (balances.length > 0) {
    const worstStatus = balances.reduce((worst, b) => {
      const rank: Record<string, number> = { current: 0, overdue_30: 1, overdue_60: 2, overdue_90: 3, collections: 4 };
      return (rank[b.collectionStatus] ?? 0) > (rank[worst] ?? 0) ? b.collectionStatus : worst;
    }, 'current');

    const statusPenalty: Record<string, number> = {
      current: 0, overdue_30: -10, overdue_60: -20, overdue_90: -30, collections: -40,
    };
    score += statusPenalty[worstStatus] ?? 0;
  }

  // Payment plan behavior (up to -20 or +10 points)
  if (paymentPlans.length > 0) {
    const defaulted = paymentPlans.filter((p) => p.status === 'defaulted').length;
    const completed = paymentPlans.filter((p) => p.status === 'completed').length;
    const totalPlans = paymentPlans.length;

    if (defaulted > 0) score -= (defaulted / totalPlans) * 20;
    if (completed > 0) score += (completed / totalPlans) * 10;

    // Missed installments
    const allInstallments = paymentPlans.flatMap((p) => p.installments);
    const missed = allInstallments.filter((i) => i.status === 'missed' || i.status === 'overdue').length;
    if (allInstallments.length > 0) {
      score -= (missed / allInstallments.length) * 15;
    }
  }

  return clamp(score);
}

// ─── Engagement Score (0-100) ─────────────────────────────────────────────────
// Factors: follow-up response rate, communication engagement, form completion, referral compliance

async function calcEngagement(patientId: string): Promise<number> {
  const [followUps, communications, forms, referrals] = await Promise.all([
    prisma.followUp.findMany({ where: { patientId }, select: { status: true } }),
    prisma.communication.findMany({ where: { patientId }, select: { status: true, direction: true, readAt: true } }),
    prisma.patientForm.findMany({ where: { patientId }, select: { status: true } }),
    prisma.referral.findMany({ where: { patientId }, select: { status: true } }),
  ]);

  let totalWeight = 0;
  let totalScore = 0;

  // Follow-up response (weight: 35%)
  if (followUps.length > 0) {
    const responded = followUps.filter((f) => f.status === 'responded' || f.status === 'completed').length;
    const sent = followUps.filter((f) => f.status !== 'pending').length;
    const responseRate = sent > 0 ? responded / sent : 0;
    totalScore += responseRate * 100 * 0.35;
    totalWeight += 0.35;
  }

  // Communication engagement (weight: 25%)
  if (communications.length > 0) {
    const outbound = communications.filter((c) => c.direction === 'outbound');
    const read = outbound.filter((c) => c.readAt !== null).length;
    const delivered = outbound.filter((c) => c.status === 'delivered' || c.status === 'read').length;
    const inbound = communications.filter((c) => c.direction === 'inbound').length;

    let commScore = 50; // baseline
    if (outbound.length > 0) commScore += (read / outbound.length) * 30;
    if (delivered > 0) commScore += 10;
    if (inbound > 0) commScore += 10; // patient initiates contact = good sign
    totalScore += clamp(commScore) * 0.25;
    totalWeight += 0.25;
  }

  // Form completion (weight: 20%)
  if (forms.length > 0) {
    const submitted = forms.filter((f) => f.status === 'submitted' || f.status === 'reviewed').length;
    const completionRate = submitted / forms.length;
    totalScore += completionRate * 100 * 0.20;
    totalWeight += 0.20;
  }

  // Referral compliance (weight: 20%)
  if (referrals.length > 0) {
    const followed = referrals.filter((r) => r.status === 'scheduled' || r.status === 'completed').length;
    const declined = referrals.filter((r) => r.status === 'declined').length;
    const complianceRate = (followed - declined * 0.5) / referrals.length;
    totalScore += Math.max(0, complianceRate) * 100 * 0.20;
    totalWeight += 0.20;
  }

  // If we have no data, return neutral
  if (totalWeight === 0) return 65;

  // Normalize to account for missing data categories
  return clamp(totalScore / totalWeight);
}

// ─── Treatment Commitment Score (0-100) ───────────────────────────────────────
// Factors: plan acceptance rate, plan completion rate, elective acceptance

async function calcTreatmentCommitment(patientId: string): Promise<number> {
  const plans = await prisma.treatmentPlan.findMany({
    where: { patientId },
    select: { status: true, priority: true },
    // include items for completion tracking
  });

  if (plans.length === 0) return 70; // neutral for patients with no treatment history

  let score = 100;

  const total = plans.length;
  const accepted = plans.filter((p) => ['accepted', 'in_progress', 'completed'].includes(p.status)).length;
  const declined = plans.filter((p) => p.status === 'declined').length;
  const completed = plans.filter((p) => p.status === 'completed').length;

  // Acceptance rate (50% weight)
  const acceptanceRate = accepted / total;
  const declineRate = declined / total;
  score = (acceptanceRate * 100) * 0.5;

  // Decline penalty
  score -= declineRate * 30;

  // Completion rate of accepted plans (30% weight)
  if (accepted > 0) {
    const completionRate = completed / accepted;
    score += completionRate * 100 * 0.3;
  } else {
    score += 20 * 0.3; // baseline
  }

  // Elective treatment acceptance bonus (20% weight)
  const elective = plans.filter((p) => p.priority === 'elective');
  if (elective.length > 0) {
    const electiveAccepted = elective.filter((p) => ['accepted', 'in_progress', 'completed'].includes(p.status)).length;
    score += (electiveAccepted / elective.length) * 100 * 0.2;
  } else {
    score += 70 * 0.2; // neutral if no elective plans
  }

  return clamp(score);
}

// ─── Generate Alerts ──────────────────────────────────────────────────────────

function generateAlerts(scores: Omit<PatientScores, 'alerts' | 'calculatedAt'>): ScoreAlert[] {
  const alerts: ScoreAlert[] = [];

  // Financial alerts
  if (scores.financial < THRESHOLDS.depositRequired) {
    alerts.push({
      type: 'deposit_required',
      severity: 'warning',
      message: `Financial score is ${scores.financial}/100. Recommend requiring deposit before scheduling.`,
      score: 'financial',
    });
  }

  // Attendance alerts
  if (scores.attendance < THRESHOLDS.doubleBook) {
    alerts.push({
      type: 'double_book',
      severity: 'warning',
      message: `Attendance score is ${scores.attendance}/100. Consider double-booking this time slot.`,
      score: 'attendance',
    });
  }

  // Engagement — high engagement = priority outreach
  if (scores.engagement >= THRESHOLDS.priorityOutreach) {
    alerts.push({
      type: 'priority_outreach',
      severity: 'info',
      message: `High engagement (${scores.engagement}/100). Prioritize for recall and campaign outreach.`,
      score: 'engagement',
    });
  }

  // Front desk warning — low composite
  if (scores.composite < THRESHOLDS.frontDeskWarning) {
    alerts.push({
      type: 'front_desk_warning',
      severity: 'critical',
      message: `Overall reliability is ${scores.composite}/100. Alert front desk when this patient checks in.`,
      score: 'composite',
    });
  }

  // High-value patient
  if (scores.composite >= THRESHOLDS.highValue) {
    alerts.push({
      type: 'high_value',
      severity: 'info',
      message: `Excellent reliability (${scores.composite}/100). High-value patient — prioritize experience.`,
      score: 'composite',
    });
  }

  return alerts;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Calculate all scores for a single patient.
 */
export async function scorePatient(patientId: string): Promise<PatientScores> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!patient) throw new Error(`Patient ${patientId} not found`);

  const [attendance, financial, engagement, treatmentCommitment] = await Promise.all([
    calcAttendance(patientId),
    calcFinancial(patientId),
    calcEngagement(patientId),
    calcTreatmentCommitment(patientId),
  ]);

  const composite = clamp(
    attendance * WEIGHTS.attendance +
    financial * WEIGHTS.financial +
    engagement * WEIGHTS.engagement +
    treatmentCommitment * WEIGHTS.treatmentCommitment
  );

  const partial = {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    attendance,
    financial,
    engagement,
    treatmentCommitment,
    composite,
  };

  return {
    ...partial,
    alerts: generateAlerts(partial),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Score all patients and return ranked by composite (descending).
 */
export async function scoreAllPatients(): Promise<PatientScores[]> {
  const patients = await prisma.patient.findMany({
    select: { id: true },
  });

  const scores = await Promise.all(patients.map((p) => scorePatient(p.id)));
  return scores.sort((a, b) => b.composite - a.composite);
}

/**
 * Get all patients with actionable alerts (sorted by severity).
 */
export async function getPatientAlerts(): Promise<PatientScores[]> {
  const allScores = await scoreAllPatients();
  return allScores
    .filter((s) => s.alerts.length > 0)
    .sort((a, b) => {
      // Sort critical first, then warning, then info
      const severityRank = (alerts: ScoreAlert[]) => {
        if (alerts.some((a) => a.severity === 'critical')) return 0;
        if (alerts.some((a) => a.severity === 'warning')) return 1;
        return 2;
      };
      return severityRank(a.alerts) - severityRank(b.alerts);
    });
}
