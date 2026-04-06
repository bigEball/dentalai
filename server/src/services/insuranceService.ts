/**
 * Insurance service layer.
 *
 * Abstracts data access behind demo/live mode:
 *   - Live mode: reads from Open Dental API, writes to local Prisma (hybrid)
 *   - Demo mode: reads and writes to Prisma
 *
 * All insurance routes call this service instead of Prisma directly.
 */

import { prisma } from '../db/client';
import { isLiveMode, getConfig } from '../config';
import { OpenDentalClient } from '../integrations/openDental/client';

// ----------------------------------------------------------------
// OD client factory
// ----------------------------------------------------------------

function getODClient(): OpenDentalClient {
  const config = getConfig();
  return new OpenDentalClient(config.openDental);
}

// ----------------------------------------------------------------
// CDT procedure code helpers
// ----------------------------------------------------------------

const PROCEDURE_MAP: Record<string, string> = {
  cleaning: 'D1110',
  prophylaxis: 'D1110',
  prophy: 'D1110',
  exam: 'D0120',
  'comprehensive exam': 'D0150',
  'periodic exam': 'D0120',
  'new patient exam': 'D0150',
  'x-ray': 'D0274',
  bitewing: 'D0274',
  bitewings: 'D0274',
  panoramic: 'D0330',
  pano: 'D0330',
  filling: 'D2150',
  composite: 'D2391',
  amalgam: 'D2150',
  crown: 'D2740',
  'root canal': 'D3310',
  rct: 'D3310',
  extraction: 'D7140',
  'deep cleaning': 'D4341',
  srp: 'D4341',
  'scaling and root planing': 'D4341',
  sealant: 'D1351',
  fluoride: 'D1208',
  whitening: 'D9972',
  veneer: 'D2962',
  implant: 'D6010',
  denture: 'D5110',
  bridge: 'D6240',
  'night guard': 'D9944',
};

/** National average fee estimates by CDT code */
const FEE_SCHEDULE: Record<string, number> = {
  D0120: 65,
  D0150: 99,
  D0210: 130,
  D0274: 72,
  D0330: 130,
  D1110: 115,
  D1120: 75,
  D1208: 38,
  D1351: 55,
  D2140: 185,
  D2150: 225,
  D2160: 275,
  D2391: 230,
  D2392: 300,
  D2740: 1200,
  D2750: 1100,
  D2962: 1100,
  D3310: 850,
  D3320: 950,
  D4341: 275,
  D4342: 200,
  D5110: 1800,
  D5120: 1900,
  D6010: 2200,
  D6240: 1150,
  D7140: 250,
  D7210: 350,
  D9944: 500,
  D9972: 400,
};

function extractProcedureCodes(appointmentType: string, notes?: string | null): string {
  const text = `${appointmentType} ${notes ?? ''}`.toLowerCase();
  const codes: string[] = [];

  for (const [keyword, code] of Object.entries(PROCEDURE_MAP)) {
    if (text.includes(keyword) && !codes.includes(code)) {
      codes.push(code);
    }
  }

  if (codes.length === 0) codes.push('D0120', 'D1110');
  return codes.join(', ');
}

function estimateFee(procedureCodes: string): number {
  return procedureCodes
    .split(',')
    .map(c => c.trim())
    .reduce((total, code) => total + (FEE_SCHEDULE[code] ?? 150), 0);
}

// ----------------------------------------------------------------
// Plans
// ----------------------------------------------------------------

export async function getPlans(params?: { patientId?: string }) {
  if (isLiveMode()) {
    try {
      const client = getODClient();
      const odParams = params?.patientId ? { Subscriber: params.patientId } : undefined;
      return await client.getInsurancePlans(odParams);
    } catch (err) {
      console.error('[insurance] OD getInsurancePlans failed, falling back to Prisma:', err);
    }
  }

  return prisma.insurancePlan.findMany({
    where: params?.patientId ? { patientId: params.patientId } : undefined,
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPlan(id: string) {
  if (isLiveMode()) {
    try {
      const client = getODClient();
      const plans = await client.getInsurancePlans({ PlanNum: id });
      if (plans.length > 0) return plans[0];
    } catch (err) {
      console.error('[insurance] OD getPlan failed, falling back to Prisma:', err);
    }
  }

  return prisma.insurancePlan.findUnique({
    where: { id },
    include: {
      patient: true,
      claims: { orderBy: { claimDate: 'desc' } },
    },
  });
}

export async function createPlan(data: {
  patientId: string;
  provider: string;
  memberId: string;
  groupNumber: string;
  deductible: number;
  annualMax: number;
  coPayPreventive?: number;
  coPayBasic?: number;
  coPayMajor?: number;
}) {
  return prisma.insurancePlan.create({
    data: {
      patientId: data.patientId,
      provider: data.provider,
      memberId: data.memberId,
      groupNumber: data.groupNumber,
      deductible: data.deductible,
      annualMax: data.annualMax,
      deductibleMet: 0,
      annualUsed: 0,
      verificationStatus: 'pending',
      coPayPreventive: data.coPayPreventive ?? 0,
      coPayBasic: data.coPayBasic ?? 20,
      coPayMajor: data.coPayMajor ?? 50,
    },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
    },
  });
}

const PLAN_UPDATE_FIELDS = new Set([
  'provider',
  'memberId',
  'groupNumber',
  'deductible',
  'deductibleMet',
  'annualMax',
  'annualUsed',
  'coPayPreventive',
  'coPayBasic',
  'coPayMajor',
  'verificationStatus',
  'verifiedDate',
]);

export async function updatePlan(id: string, data: Record<string, unknown>) {
  const filtered: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (PLAN_UPDATE_FIELDS.has(key)) filtered[key] = val;
  }

  return prisma.insurancePlan.update({
    where: { id },
    data: filtered,
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, phone: true, email: true },
      },
    },
  });
}

export async function verifyPlan(id: string) {
  const today = new Date().toISOString().split('T')[0]!;
  return prisma.insurancePlan.update({
    where: { id },
    data: { verificationStatus: 'verified', verifiedDate: today },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

// ----------------------------------------------------------------
// Claims
// ----------------------------------------------------------------

export async function getClaims(params?: { status?: string; patientId?: string }) {
  if (isLiveMode()) {
    try {
      const client = getODClient();
      const odParams: Record<string, string> = {};
      if (params?.patientId) odParams.PatNum = params.patientId;
      let claims = await client.getClaims(odParams);
      if (params?.status) {
        claims = claims.filter(c => c.status === params.status);
      }
      return claims;
    } catch (err) {
      console.error('[insurance] OD getClaims failed, falling back to Prisma:', err);
    }
  }

  const where: Record<string, unknown> = {};
  if (params?.status) where.status = params.status;
  if (params?.patientId) where.patientId = params.patientId;

  return prisma.insuranceClaim.findMany({
    where,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      insurancePlan: { select: { id: true, provider: true, memberId: true } },
      appointment: { select: { id: true, date: true, type: true } },
    },
    orderBy: { claimDate: 'desc' },
  });
}

export async function getClaim(id: string) {
  return prisma.insuranceClaim.findUnique({
    where: { id },
    include: {
      patient: true,
      insurancePlan: true,
      appointment: { include: { clinicalNotes: true } },
    },
  });
}

export async function createClaim(data: {
  patientId: string;
  insurancePlanId: string;
  appointmentId?: string;
  procedureCodes: string;
  totalAmount: number;
  narrative: string;
}) {
  const today = new Date().toISOString().split('T')[0]!;

  // If no appointmentId provided, try to find the most recent completed appointment
  let appointmentId = data.appointmentId;
  if (!appointmentId) {
    const recentApt = await prisma.appointment.findFirst({
      where: { patientId: data.patientId, status: 'completed' },
      orderBy: { date: 'desc' },
    });
    appointmentId = recentApt?.id;
  }

  if (!appointmentId) {
    throw new Error('No appointment found for this patient. A claim must be linked to an appointment.');
  }

  return prisma.insuranceClaim.create({
    data: {
      patientId: data.patientId,
      insurancePlanId: data.insurancePlanId,
      appointmentId,
      claimDate: today,
      procedureCodes: data.procedureCodes,
      totalAmount: data.totalAmount,
      narrative: data.narrative,
      status: 'draft',
    },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      insurancePlan: { select: { id: true, provider: true, memberId: true } },
    },
  });
}

export async function submitClaim(id: string) {
  const today = new Date().toISOString().split('T')[0]!;
  return prisma.insuranceClaim.update({
    where: { id },
    data: { status: 'submitted', submittedDate: today },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      insurancePlan: { select: { id: true, provider: true } },
    },
  });
}

export async function updateClaim(id: string, data: Record<string, unknown>) {
  const allowed = new Set([
    'procedureCodes',
    'totalAmount',
    'narrative',
    'status',
    'approvedAmount',
    'denialReason',
  ]);
  const filtered: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (allowed.has(key)) filtered[key] = val;
  }

  return prisma.insuranceClaim.update({
    where: { id },
    data: filtered,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
      insurancePlan: { select: { id: true, provider: true, memberId: true } },
    },
  });
}

// ----------------------------------------------------------------
// Claim auto-generation
// ----------------------------------------------------------------

export async function generateClaimsFromAppointments() {
  // In live mode, fetch completed appointments from OD and cross-reference
  if (isLiveMode()) {
    try {
      const client = getODClient();
      const odAppointments = await client.getAppointments({ AptStatus: 2 }); // completed
      const odClaims = await client.getClaims();
      const claimedAptIds = new Set(odClaims.map(c => c.appointmentId));

      const unclaimed = odAppointments.filter(apt => !claimedAptIds.has(apt.id));
      const drafts = [];

      for (const apt of unclaimed) {
        const procedureCodes = extractProcedureCodes(apt.type, apt.notes);
        const totalAmount = estimateFee(procedureCodes);

        // Get patient's insurance plan from local DB
        const plan = await prisma.insurancePlan.findFirst({
          where: { patientId: apt.patientId, verificationStatus: 'verified' },
        });
        if (!plan) continue;

        // Ensure appointment exists locally for FK constraint
        const localApt = await prisma.appointment.upsert({
          where: { id: apt.id },
          update: {},
          create: {
            id: apt.id,
            patientId: apt.patientId,
            providerId: apt.providerId || 'unknown',
            date: apt.date,
            time: apt.time,
            duration: apt.duration,
            type: apt.type,
            status: 'completed',
          },
        });

        const claim = await prisma.insuranceClaim.create({
          data: {
            patientId: apt.patientId,
            insurancePlanId: plan.id,
            appointmentId: localApt.id,
            claimDate: new Date().toISOString().split('T')[0]!,
            procedureCodes,
            totalAmount,
            narrative: `${apt.type} — ${apt.date}`,
            status: 'draft',
          },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            insurancePlan: { select: { id: true, provider: true, memberId: true } },
          },
        });
        drafts.push(claim);
      }
      return drafts;
    } catch (err) {
      console.error('[insurance] OD claim generation failed, falling back to Prisma:', err);
    }
  }

  // Demo mode: find completed appointments without claims
  const unclaimed = await prisma.appointment.findMany({
    where: {
      status: 'completed',
      claims: { none: {} },
    },
    include: {
      patient: {
        include: {
          insurancePlans: { where: { verificationStatus: 'verified' }, take: 1 },
        },
      },
      clinicalNotes: true,
    },
  });

  const drafts = [];
  for (const apt of unclaimed) {
    const plan = apt.patient.insurancePlans[0];
    if (!plan) continue;

    const narrative = apt.clinicalNotes.map(n => [n.subjective, n.objective, n.assessment, n.plan].filter(Boolean).join('; ')).join(' | ') || `${apt.type} — ${apt.date}`;
    const procedureCodes = extractProcedureCodes(apt.type, narrative);
    const totalAmount = estimateFee(procedureCodes);

    const claim = await prisma.insuranceClaim.create({
      data: {
        patientId: apt.patientId,
        insurancePlanId: plan.id,
        appointmentId: apt.id,
        claimDate: new Date().toISOString().split('T')[0]!,
        procedureCodes,
        totalAmount,
        narrative,
        status: 'draft',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: { select: { id: true, provider: true, memberId: true } },
      },
    });
    drafts.push(claim);
  }

  return drafts;
}
