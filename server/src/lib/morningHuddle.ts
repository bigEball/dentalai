import { prisma } from '../db/client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PatientFlag {
  type: 'financial' | 'insurance' | 'treatment' | 'attendance' | 'recall' | 'clinical' | 'payment';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action?: string;
}

interface PatientBrief {
  patientId: string;
  firstName: string;
  lastName: string;
  appointmentTime: string;
  appointmentType: string;
  provider: string;
  duration: number;
  isNewPatient: boolean;
  flags: PatientFlag[];
  outstandingBalance: number;
  insuranceStatus: string | null;
  noShowRate: number;
  pendingTreatmentValue: number;
}

interface HuddleAlert {
  id: string;
  type: 'financial' | 'insurance' | 'attendance' | 'treatment' | 'recall' | 'payment';
  severity: 'critical' | 'warning' | 'info';
  patientName: string;
  patientId: string;
  message: string;
  action: string;
}

interface HuddleOpportunity {
  id: string;
  type: 'unaccepted_plan' | 'annual_max' | 'additional_service';
  patientName: string;
  patientId: string;
  title: string;
  value: number;
  description: string;
}

interface HuddleSummary {
  totalPatients: number;
  expectedProduction: number;
  newPatients: number;
  patientsWithBalances: number;
  totalCollectible: number;
  highRiskNoShows: number;
}

interface Huddle {
  id: string;
  date: string;
  generatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  summary: HuddleSummary;
  patients: PatientBrief[];
  alerts: HuddleAlert[];
  opportunities: HuddleOpportunity[];
}

// ─── In-memory store ────────────────────────────────────────────────────────

const huddleStore = new Map<string, Huddle>();

// ─── Procedure-based production estimates ───────────────────────────────────

const PROCEDURE_VALUES: Record<string, number> = {
  'cleaning': 175,
  'hygiene': 175,
  'prophy': 175,
  'exam': 85,
  'new patient exam': 150,
  'filling': 250,
  'composite': 275,
  'crown': 1200,
  'root canal': 950,
  'extraction': 300,
  'implant': 3500,
  'veneer': 1100,
  'whitening': 450,
  'bridge': 3200,
  'denture': 2800,
  'scaling': 350,
  'deep cleaning': 350,
  'sealant': 55,
  'fluoride': 35,
  'x-ray': 45,
  'consultation': 100,
  'emergency': 200,
  'orthodontic': 500,
};

function estimateProductionValue(appointmentType: string): number {
  const typeLower = appointmentType.toLowerCase();
  for (const [key, value] of Object.entries(PROCEDURE_VALUES)) {
    if (typeLower.includes(key)) return value;
  }
  return 200; // default estimate
}

// ─── Core functions ─────────────────────────────────────────────────────────

export async function generateHuddle(date: string): Promise<Huddle> {
  const huddleId = `huddle-${date}`;

  // Try to fetch real appointments for the date
  let appointments: any[] = [];
  try {
    appointments = await prisma.appointment.findMany({
      where: { date, status: { not: 'cancelled' } },
      include: {
        patient: true,
        provider: true,
      },
      orderBy: { time: 'asc' },
    });
  } catch {
    appointments = [];
  }

  // If no real appointments, generate a realistic mock huddle
  if (!appointments || appointments.length === 0) {
    const mockHuddle = generateMockHuddle(date, huddleId);
    huddleStore.set(date, mockHuddle);
    return mockHuddle;
  }

  // Build patient briefs from real data
  const patients: PatientBrief[] = [];
  const alerts: HuddleAlert[] = [];
  const opportunities: HuddleOpportunity[] = [];
  let alertCounter = 0;
  let opCounter = 0;

  for (const appt of appointments) {
    const patient = appt.patient;
    const flags: PatientFlag[] = [];
    let outstandingBalance = 0;
    let insuranceStatus: string | null = null;
    let noShowRate = 0;
    let pendingTreatmentValue = 0;

    // 1. Financial flags
    try {
      const balances = await prisma.balance.findMany({
        where: { patientId: patient.id },
      });
      outstandingBalance = balances.reduce((sum, b) => sum + b.amount, 0);
      const inCollections = balances.some(b => b.collectionStatus === 'collections');

      if (inCollections) {
        flags.push({
          type: 'financial',
          severity: 'critical',
          message: `Account in collections — balance $${outstandingBalance.toFixed(2)}`,
          action: 'Review with office manager before seating',
        });
        alerts.push({
          id: `alert-${++alertCounter}`,
          type: 'financial',
          severity: 'critical',
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.id,
          message: `Account in collections — balance $${outstandingBalance.toFixed(2)}`,
          action: 'Review with office manager before seating',
        });
      } else if (outstandingBalance > 200) {
        flags.push({
          type: 'financial',
          severity: 'warning',
          message: `Collect $${outstandingBalance.toFixed(2)} before seating`,
          action: 'Discuss payment at check-in',
        });
        alerts.push({
          id: `alert-${++alertCounter}`,
          type: 'financial',
          severity: 'warning',
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.id,
          message: `Outstanding balance of $${outstandingBalance.toFixed(2)}`,
          action: 'Collect Balance',
        });
      }
    } catch { /* balance query failed — skip */ }

    // 2. Insurance flags
    try {
      const plans = await prisma.insurancePlan.findMany({
        where: { patientId: patient.id },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      });
      if (plans.length > 0) {
        const plan = plans[0];
        insuranceStatus = plan.verificationStatus;

        if (['expired', 'failed', 'pending'].includes(plan.verificationStatus)) {
          const sev = plan.verificationStatus === 'pending' ? 'warning' as const : 'critical' as const;
          flags.push({
            type: 'insurance',
            severity: sev,
            message: `Insurance verification ${plan.verificationStatus} — verify before appointment`,
            action: 'Verify insurance',
          });
          alerts.push({
            id: `alert-${++alertCounter}`,
            type: 'insurance',
            severity: sev,
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientId: patient.id,
            message: `Insurance verification ${plan.verificationStatus}`,
            action: 'Verify Insurance',
          });
        }

        const remaining = plan.annualMax - plan.annualUsed;
        if (remaining < 500 && remaining > 0) {
          flags.push({
            type: 'insurance',
            severity: 'info',
            message: `Only $${remaining.toFixed(2)} of benefits remaining — inform patient`,
          });
          opportunities.push({
            id: `op-${++opCounter}`,
            type: 'annual_max',
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientId: patient.id,
            title: 'Near Annual Max',
            value: remaining,
            description: `Only $${remaining.toFixed(2)} of annual benefits remaining. Encourage patient to use remaining benefits before year-end.`,
          });
        }
      }
    } catch { /* insurance query failed — skip */ }

    // 3. Treatment plan flags
    try {
      const proposedPlans = await prisma.treatmentPlan.findMany({
        where: { patientId: patient.id, status: 'proposed' },
        include: { items: true },
      });
      if (proposedPlans.length > 0) {
        pendingTreatmentValue = proposedPlans.reduce((sum, p) => sum + p.totalEstimate, 0);
        flags.push({
          type: 'treatment',
          severity: 'info',
          message: `Discuss $${pendingTreatmentValue.toFixed(2)} in unaccepted treatment plans`,
          action: 'Present treatment plan',
        });
        for (const plan of proposedPlans) {
          opportunities.push({
            id: `op-${++opCounter}`,
            type: 'unaccepted_plan',
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientId: patient.id,
            title: plan.title,
            value: plan.totalEstimate,
            description: `Proposed on ${plan.presentedDate} — ${plan.items.length} procedures, patient estimate $${plan.patientEst.toFixed(2)}`,
          });
        }
      }
    } catch { /* treatment plan query failed — skip */ }

    // 4. Attendance risk
    try {
      const allAppts = await prisma.appointment.findMany({
        where: { patientId: patient.id },
      });
      const total = allAppts.length;
      const noShows = allAppts.filter(a => a.status === 'no-show' || a.status === 'no_show').length;
      noShowRate = total > 0 ? noShows / total : 0;

      if (noShowRate > 0.3) {
        flags.push({
          type: 'attendance',
          severity: 'warning',
          message: `High no-show risk (${Math.round(noShowRate * 100)}%) — confirm appointment`,
          action: 'Call to confirm',
        });
        alerts.push({
          id: `alert-${++alertCounter}`,
          type: 'attendance',
          severity: 'warning',
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientId: patient.id,
          message: `High no-show risk — ${Math.round(noShowRate * 100)}% no-show rate`,
          action: 'Call to Confirm',
        });
      }

      // Check recent cancellations
      const recentCancelled = allAppts
        .filter(a => a.status === 'cancelled')
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);
      if (recentCancelled.length >= 2) {
        flags.push({
          type: 'attendance',
          severity: 'warning',
          message: `Multiple recent cancellations (${recentCancelled.length}) — confirm attendance`,
        });
      }
    } catch { /* appointment history query failed — skip */ }

    // 5. Recall status
    try {
      const recallTasks = await prisma.recallTask.findMany({
        where: { patientId: patient.id, status: { not: 'scheduled' } },
        orderBy: { recallDueDate: 'desc' },
        take: 1,
      });
      if (recallTasks.length > 0 && recallTasks[0].daysOverdue > 0) {
        flags.push({
          type: 'recall',
          severity: recallTasks[0].daysOverdue > 90 ? 'warning' : 'info',
          message: `Overdue for hygiene by ${recallTasks[0].daysOverdue} days`,
        });
      }
    } catch { /* recall query failed — skip */ }

    // 6. Clinical context
    try {
      const lastNote = await prisma.clinicalNote.findFirst({
        where: { patientId: patient.id },
        orderBy: { date: 'desc' },
      });
      if (lastNote) {
        const followUp = lastNote.plan ? lastNote.plan.substring(0, 120) : null;
        if (followUp) {
          flags.push({
            type: 'clinical',
            severity: 'info',
            message: `Last visit: ${lastNote.procedureCode || 'General'} — ${followUp}`,
          });
        }
      }
    } catch { /* clinical note query failed — skip */ }

    // 7. Payment plan status
    try {
      const activePlans = await prisma.paymentPlan.findMany({
        where: { patientId: patient.id, status: 'active' },
        include: { installments: true },
      });
      for (const pp of activePlans) {
        const overdueInstallments = pp.installments.filter(i => i.status === 'overdue' || i.status === 'missed');
        if (overdueInstallments.length > 0) {
          const overdueTotal = overdueInstallments.reduce((sum, i) => sum + i.amount, 0);
          flags.push({
            type: 'payment',
            severity: 'warning',
            message: `Payment plan has ${overdueInstallments.length} overdue installment(s) — $${overdueTotal.toFixed(2)}`,
            action: 'Discuss payment plan at check-in',
          });
          alerts.push({
            id: `alert-${++alertCounter}`,
            type: 'payment',
            severity: 'warning',
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientId: patient.id,
            message: `${overdueInstallments.length} overdue payment plan installment(s) — $${overdueTotal.toFixed(2)}`,
            action: 'Collect Balance',
          });
        }
      }
    } catch { /* payment plan query failed — skip */ }

    // Determine if new patient (created within last 30 days with no prior appointments)
    const createdRecently = (Date.now() - new Date(patient.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000;
    const isNewPatient = createdRecently || appt.type.toLowerCase().includes('new patient');

    if (isNewPatient) {
      flags.push({
        type: 'clinical',
        severity: 'info',
        message: 'New patient — ensure all forms are completed',
      });
    }

    patients.push({
      patientId: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      appointmentTime: appt.time,
      appointmentType: appt.type,
      provider: appt.provider ? `${appt.provider.title} ${appt.provider.lastName}` : 'Unassigned',
      duration: appt.duration,
      isNewPatient,
      flags,
      outstandingBalance,
      insuranceStatus,
      noShowRate,
      pendingTreatmentValue,
    });
  }

  // Build summary
  const summary: HuddleSummary = {
    totalPatients: patients.length,
    expectedProduction: patients.reduce((sum, p) => sum + estimateProductionValue(p.appointmentType), 0),
    newPatients: patients.filter(p => p.isNewPatient).length,
    patientsWithBalances: patients.filter(p => p.outstandingBalance > 0).length,
    totalCollectible: patients.reduce((sum, p) => sum + p.outstandingBalance, 0),
    highRiskNoShows: patients.filter(p => p.noShowRate > 0.3).length,
  };

  // Sort alerts by severity
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3));

  const huddle: Huddle = {
    id: huddleId,
    date,
    generatedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    summary,
    patients,
    alerts,
    opportunities,
  };

  huddleStore.set(date, huddle);
  return huddle;
}

export function getHuddleHistory(): Omit<Huddle, 'patients'>[] {
  const all = Array.from(huddleStore.values());
  return all
    .map(({ patients: _patients, ...rest }) => rest)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getHuddleByDate(date: string): Huddle | undefined {
  return huddleStore.get(date);
}

export function markHuddleReviewed(id: string, reviewedBy: string = 'demo-user'): Huddle | null {
  for (const [, huddle] of huddleStore) {
    if (huddle.id === id) {
      huddle.reviewedAt = new Date().toISOString();
      huddle.reviewedBy = reviewedBy;
      return huddle;
    }
  }
  return null;
}

// ─── Mock data generator ────────────────────────────────────────────────────

function generateMockHuddle(date: string, huddleId: string): Huddle {
  const mockPatients: PatientBrief[] = [
    {
      patientId: 'mp1',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      appointmentTime: '08:00',
      appointmentType: 'Crown Prep',
      provider: 'Dr. Anderson',
      duration: 60,
      isNewPatient: false,
      flags: [
        { type: 'financial', severity: 'warning', message: 'Collect $485.00 before seating', action: 'Discuss payment at check-in' },
        { type: 'insurance', severity: 'info', message: 'Only $380.00 of benefits remaining — inform patient' },
      ],
      outstandingBalance: 485,
      insuranceStatus: 'verified',
      noShowRate: 0.05,
      pendingTreatmentValue: 0,
    },
    {
      patientId: 'mp2',
      firstName: 'James',
      lastName: 'Rodriguez',
      appointmentTime: '08:30',
      appointmentType: 'New Patient Exam',
      provider: 'Dr. Anderson',
      duration: 90,
      isNewPatient: true,
      flags: [
        { type: 'clinical', severity: 'info', message: 'New patient — ensure all forms are completed' },
        { type: 'insurance', severity: 'warning', message: 'Insurance verification pending — verify before appointment', action: 'Verify insurance' },
      ],
      outstandingBalance: 0,
      insuranceStatus: 'pending',
      noShowRate: 0,
      pendingTreatmentValue: 0,
    },
    {
      patientId: 'mp3',
      firstName: 'Linda',
      lastName: 'Thompson',
      appointmentTime: '09:00',
      appointmentType: 'Hygiene / Cleaning',
      provider: 'RDH Williams',
      duration: 60,
      isNewPatient: false,
      flags: [
        { type: 'treatment', severity: 'info', message: 'Discuss $2,450.00 in unaccepted treatment plans', action: 'Present treatment plan' },
        { type: 'recall', severity: 'info', message: 'Overdue for hygiene by 45 days' },
      ],
      outstandingBalance: 0,
      insuranceStatus: 'verified',
      noShowRate: 0.1,
      pendingTreatmentValue: 2450,
    },
    {
      patientId: 'mp4',
      firstName: 'Marcus',
      lastName: 'Davis',
      appointmentTime: '09:30',
      appointmentType: 'Root Canal',
      provider: 'Dr. Anderson',
      duration: 90,
      isNewPatient: false,
      flags: [
        { type: 'financial', severity: 'critical', message: 'Account in collections — balance $1,240.00', action: 'Review with office manager before seating' },
        { type: 'attendance', severity: 'warning', message: 'High no-show risk (40%) — confirm appointment', action: 'Call to confirm' },
      ],
      outstandingBalance: 1240,
      insuranceStatus: 'verified',
      noShowRate: 0.4,
      pendingTreatmentValue: 950,
    },
    {
      patientId: 'mp5',
      firstName: 'Emily',
      lastName: 'Chen',
      appointmentTime: '10:00',
      appointmentType: 'Hygiene / Cleaning',
      provider: 'RDH Williams',
      duration: 60,
      isNewPatient: false,
      flags: [
        { type: 'clinical', severity: 'info', message: 'Last visit: D2391 — Monitor sensitivity on #14, recheck in 3 months' },
      ],
      outstandingBalance: 0,
      insuranceStatus: 'verified',
      noShowRate: 0,
      pendingTreatmentValue: 0,
    },
    {
      patientId: 'mp6',
      firstName: 'Robert',
      lastName: 'Kim',
      appointmentTime: '10:30',
      appointmentType: 'Composite Filling',
      provider: 'Dr. Anderson',
      duration: 45,
      isNewPatient: false,
      flags: [
        { type: 'insurance', severity: 'critical', message: 'Insurance verification expired — verify before appointment', action: 'Verify insurance' },
        { type: 'treatment', severity: 'info', message: 'Discuss $3,800.00 in unaccepted treatment plans', action: 'Present treatment plan' },
      ],
      outstandingBalance: 125,
      insuranceStatus: 'expired',
      noShowRate: 0.15,
      pendingTreatmentValue: 3800,
    },
    {
      patientId: 'mp7',
      firstName: 'Angela',
      lastName: 'Patel',
      appointmentTime: '11:00',
      appointmentType: 'Hygiene / Cleaning',
      provider: 'RDH Williams',
      duration: 60,
      isNewPatient: false,
      flags: [
        { type: 'payment', severity: 'warning', message: 'Payment plan has 2 overdue installment(s) — $350.00', action: 'Discuss payment plan at check-in' },
      ],
      outstandingBalance: 350,
      insuranceStatus: 'verified',
      noShowRate: 0.08,
      pendingTreatmentValue: 0,
    },
    {
      patientId: 'mp8',
      firstName: 'David',
      lastName: 'Nguyen',
      appointmentTime: '13:00',
      appointmentType: 'Implant Consultation',
      provider: 'Dr. Anderson',
      duration: 60,
      isNewPatient: false,
      flags: [
        { type: 'insurance', severity: 'info', message: 'Only $225.00 of benefits remaining — inform patient' },
        { type: 'clinical', severity: 'info', message: 'Last visit: Extraction #19 — Healing check, discuss implant timeline' },
      ],
      outstandingBalance: 0,
      insuranceStatus: 'verified',
      noShowRate: 0,
      pendingTreatmentValue: 3500,
    },
    {
      patientId: 'mp9',
      firstName: 'Tanya',
      lastName: 'Brooks',
      appointmentTime: '13:30',
      appointmentType: 'New Patient Exam',
      provider: 'Dr. Anderson',
      duration: 90,
      isNewPatient: true,
      flags: [
        { type: 'clinical', severity: 'info', message: 'New patient — ensure all forms are completed' },
      ],
      outstandingBalance: 0,
      insuranceStatus: null,
      noShowRate: 0,
      pendingTreatmentValue: 0,
    },
    {
      patientId: 'mp10',
      firstName: 'William',
      lastName: 'Foster',
      appointmentTime: '14:00',
      appointmentType: 'Hygiene / Cleaning',
      provider: 'RDH Williams',
      duration: 60,
      isNewPatient: false,
      flags: [
        { type: 'attendance', severity: 'warning', message: 'Multiple recent cancellations (3) — confirm attendance' },
        { type: 'recall', severity: 'warning', message: 'Overdue for hygiene by 120 days' },
      ],
      outstandingBalance: 75,
      insuranceStatus: 'verified',
      noShowRate: 0.35,
      pendingTreatmentValue: 0,
    },
    {
      patientId: 'mp11',
      firstName: 'Patricia',
      lastName: 'Owens',
      appointmentTime: '14:30',
      appointmentType: 'Scaling & Root Planing',
      provider: 'RDH Williams',
      duration: 90,
      isNewPatient: false,
      flags: [
        { type: 'financial', severity: 'warning', message: 'Collect $620.00 before seating', action: 'Discuss payment at check-in' },
        { type: 'treatment', severity: 'info', message: 'Discuss $1,800.00 in unaccepted treatment plans', action: 'Present treatment plan' },
      ],
      outstandingBalance: 620,
      insuranceStatus: 'verified',
      noShowRate: 0.05,
      pendingTreatmentValue: 1800,
    },
    {
      patientId: 'mp12',
      firstName: 'Kevin',
      lastName: 'Walsh',
      appointmentTime: '15:30',
      appointmentType: 'Extraction',
      provider: 'Dr. Anderson',
      duration: 45,
      isNewPatient: false,
      flags: [
        { type: 'clinical', severity: 'info', message: 'Last visit: Periapical abscess #30 — Antibiotics prescribed, verify completion' },
      ],
      outstandingBalance: 0,
      insuranceStatus: 'verified',
      noShowRate: 0.1,
      pendingTreatmentValue: 0,
    },
  ];

  const mockAlerts: HuddleAlert[] = [
    {
      id: 'alert-1',
      type: 'financial',
      severity: 'critical',
      patientName: 'Marcus Davis',
      patientId: 'mp4',
      message: 'Account in collections — balance $1,240.00',
      action: 'Review with office manager before seating',
    },
    {
      id: 'alert-2',
      type: 'insurance',
      severity: 'critical',
      patientName: 'Robert Kim',
      patientId: 'mp6',
      message: 'Insurance verification expired',
      action: 'Verify Insurance',
    },
    {
      id: 'alert-3',
      type: 'attendance',
      severity: 'warning',
      patientName: 'Marcus Davis',
      patientId: 'mp4',
      message: 'High no-show risk — 40% no-show rate',
      action: 'Call to Confirm',
    },
    {
      id: 'alert-4',
      type: 'attendance',
      severity: 'warning',
      patientName: 'William Foster',
      patientId: 'mp10',
      message: 'High no-show risk — 35% rate, 3 recent cancellations',
      action: 'Call to Confirm',
    },
    {
      id: 'alert-5',
      type: 'insurance',
      severity: 'warning',
      patientName: 'James Rodriguez',
      patientId: 'mp2',
      message: 'Insurance verification pending — new patient',
      action: 'Verify Insurance',
    },
    {
      id: 'alert-6',
      type: 'financial',
      severity: 'warning',
      patientName: 'Sarah Mitchell',
      patientId: 'mp1',
      message: 'Outstanding balance of $485.00',
      action: 'Collect Balance',
    },
    {
      id: 'alert-7',
      type: 'financial',
      severity: 'warning',
      patientName: 'Patricia Owens',
      patientId: 'mp11',
      message: 'Outstanding balance of $620.00',
      action: 'Collect Balance',
    },
    {
      id: 'alert-8',
      type: 'payment',
      severity: 'warning',
      patientName: 'Angela Patel',
      patientId: 'mp7',
      message: '2 overdue payment plan installments — $350.00',
      action: 'Collect Balance',
    },
  ];

  const mockOpportunities: HuddleOpportunity[] = [
    {
      id: 'op-1',
      type: 'unaccepted_plan',
      patientName: 'Robert Kim',
      patientId: 'mp6',
      title: 'Crown & Bridge — Upper Arch',
      value: 3800,
      description: 'Proposed 3 weeks ago — 3 procedures, patient estimate $1,520.00',
    },
    {
      id: 'op-2',
      type: 'unaccepted_plan',
      patientName: 'David Nguyen',
      patientId: 'mp8',
      title: 'Implant — Lower Left #19',
      value: 3500,
      description: 'Extraction complete, ready for implant placement discussion',
    },
    {
      id: 'op-3',
      type: 'unaccepted_plan',
      patientName: 'Linda Thompson',
      patientId: 'mp3',
      title: 'Cosmetic Veneers — Anterior',
      value: 2450,
      description: 'Proposed 2 months ago — 4 porcelain veneers, patient expressed interest',
    },
    {
      id: 'op-4',
      type: 'unaccepted_plan',
      patientName: 'Patricia Owens',
      patientId: 'mp11',
      title: 'Perio Maintenance Program',
      value: 1800,
      description: 'Deep cleaning today — discuss ongoing perio maintenance plan',
    },
    {
      id: 'op-5',
      type: 'annual_max',
      patientName: 'Sarah Mitchell',
      patientId: 'mp1',
      title: 'Near Annual Max',
      value: 380,
      description: 'Only $380.00 of annual benefits remaining. Encourage patient to use remaining benefits before year-end.',
    },
    {
      id: 'op-6',
      type: 'annual_max',
      patientName: 'David Nguyen',
      patientId: 'mp8',
      title: 'Near Annual Max',
      value: 225,
      description: 'Only $225.00 of annual benefits remaining. Schedule remaining work soon.',
    },
  ];

  const summary: HuddleSummary = {
    totalPatients: mockPatients.length,
    expectedProduction: mockPatients.reduce((sum, p) => sum + estimateProductionValue(p.appointmentType), 0),
    newPatients: mockPatients.filter(p => p.isNewPatient).length,
    patientsWithBalances: mockPatients.filter(p => p.outstandingBalance > 0).length,
    totalCollectible: mockPatients.reduce((sum, p) => sum + p.outstandingBalance, 0),
    highRiskNoShows: mockPatients.filter(p => p.noShowRate > 0.3).length,
  };

  return {
    id: huddleId,
    date,
    generatedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    summary,
    patients: mockPatients,
    alerts: mockAlerts,
    opportunities: mockOpportunities,
  };
}
