/**
 * Maps Open Dental PascalCase API responses to our internal camelCase types.
 *
 * OD field names come directly from the Open Dental REST API.
 * Our internal types mirror the Prisma schema models.
 */

// ---------- Patient ----------

export interface MappedPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
  outstandingBalance: number;
  providerId: string | null;
}

export function mapODPatient(od: Record<string, unknown>): MappedPatient {
  const contactMethodMap: Record<number, string> = {
    0: 'none',
    1: 'phone',
    2: 'email',
    3: 'mail',
    4: 'text',
  };

  const preferredMethod =
    typeof od.PreferredContactMethod === 'number'
      ? contactMethodMap[od.PreferredContactMethod] ?? 'email'
      : 'email';

  return {
    id: String(od.PatNum ?? ''),
    firstName: String(od.FName ?? ''),
    lastName: String(od.LName ?? ''),
    dateOfBirth: normalizeDate(od.Birthdate),
    phone: String(od.WirelessPhone || od.HmPhone || ''),
    email: String(od.Email ?? ''),
    preferredContactMethod: preferredMethod,
    outstandingBalance: Number(od.EstBalance ?? 0),
    providerId: od.PriProv ? String(od.PriProv) : null,
  };
}

// ---------- Appointment ----------

export interface MappedAppointment {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: string;
  notes: string | null;
}

/**
 * OD appointment Pattern field: each character (X or /) represents a 5-minute block.
 * Total duration = pattern length * 5 minutes.
 */
function patternToDuration(pattern: unknown): number {
  if (typeof pattern !== 'string' || pattern.length === 0) return 30; // default 30 min
  return pattern.length * 5;
}

/**
 * OD AptStatus enum:
 *   1 = Scheduled, 2 = Complete, 3 = UnschedList, 5 = Broken, 6 = Planned
 */
function mapAptStatus(status: unknown): string {
  const statusMap: Record<number, string> = {
    1: 'scheduled',
    2: 'completed',
    3: 'unscheduled',
    5: 'broken',
    6: 'planned',
  };

  const num = Number(status);
  return statusMap[num] ?? 'scheduled';
}

/**
 * Parse OD's AptDateTime (ISO or "YYYY-MM-DD HH:MM:SS") into separate date and time strings.
 */
function splitDateTime(aptDateTime: unknown): { date: string; time: string } {
  if (typeof aptDateTime !== 'string' || !aptDateTime) {
    return { date: '', time: '' };
  }

  // Handle ISO format or "YYYY-MM-DD HH:MM:SS" format
  const dt = new Date(aptDateTime);
  if (isNaN(dt.getTime())) {
    // Fallback: try splitting on space
    const parts = aptDateTime.split(' ');
    return { date: parts[0] ?? '', time: parts[1] ?? '' };
  }

  const date = dt.toISOString().split('T')[0]!;
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  return { date, time: `${hours}:${minutes}` };
}

export function mapODAppointment(od: Record<string, unknown>): MappedAppointment {
  const { date, time } = splitDateTime(od.AptDateTime);

  return {
    id: String(od.AptNum ?? ''),
    patientId: String(od.PatNum ?? ''),
    providerId: String(od.ProvNum ?? ''),
    date,
    time,
    duration: patternToDuration(od.Pattern),
    type: String(od.ProcDescript ?? 'General'),
    status: mapAptStatus(od.AptStatus),
    notes: od.Note ? String(od.Note) : null,
  };
}

// ---------- Provider ----------

export interface MappedProvider {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string;
}

export function mapODProvider(od: Record<string, unknown>): MappedProvider {
  // OD Specialty is an enum number; map common ones
  const specialtyMap: Record<number, string> = {
    0: 'General',
    1: 'Hygienist',
    2: 'Endodontics',
    3: 'Pediatric Dentistry',
    4: 'Periodontics',
    5: 'Prosthodontics',
    6: 'Orthodontics',
    7: 'Oral Surgery',
    8: 'Dental Public Health',
    9: 'Pathology',
    10: 'Radiology',
  };

  const specialtyNum = Number(od.Specialty ?? 0);
  const specialty = specialtyMap[specialtyNum] ?? String(od.Specialty ?? 'General');

  return {
    id: String(od.ProvNum ?? ''),
    firstName: String(od.FName ?? ''),
    lastName: String(od.LName ?? ''),
    title: String(od.Abbr ?? ''),
    specialty,
  };
}

// ---------- InsurancePlan ----------

export interface MappedInsurancePlan {
  id: string;
  patientId: string;
  provider: string;
  memberId: string;
  groupNumber: string;
  deductible: number;
  deductibleMet: number;
  annualMax: number;
  annualUsed: number;
  verificationStatus: string;
  verifiedDate: string | null;
  coPayPreventive: number;
  coPayBasic: number;
  coPayMajor: number;
}

/**
 * Maps Open Dental InsPlan data to our internal format.
 *
 * OD splits insurance across InsPlan, InsSub, Benefit, and Carrier tables.
 * We expect the caller to merge relevant fields before passing here.
 * Financial tracking (deductibleMet, annualUsed) is maintained locally
 * since OD doesn't expose a convenient summary endpoint for these.
 */
export function mapODInsurancePlan(od: Record<string, unknown>): MappedInsurancePlan {
  // Coverage percentages from OD are "insurance pays X%"
  // Our UI shows "patient pays X%", so invert: copay = 100 - coverage
  const percentPreventive = Number(od.PercentPreventive ?? 100);
  const percentBasic = Number(od.PercentBasic ?? 80);
  const percentMajor = Number(od.PercentMajor ?? 50);

  return {
    id: String(od.PlanNum ?? od.InsSubNum ?? ''),
    patientId: String(od.Subscriber ?? od.PatNum ?? ''),
    provider: String(od.CarrierName ?? od.GroupName ?? 'Unknown'),
    memberId: String(od.SubscriberID ?? ''),
    groupNumber: String(od.GroupNum ?? ''),
    deductible: Number(od.DedAmt ?? 0),
    deductibleMet: 0,   // tracked locally
    annualMax: Number(od.AnnualMax ?? 0),
    annualUsed: 0,       // tracked locally
    verificationStatus: od.DateEffective ? 'verified' : 'pending',
    verifiedDate: od.DateEffective ? normalizeDate(od.DateEffective) : null,
    coPayPreventive: Math.max(0, 100 - percentPreventive),
    coPayBasic: Math.max(0, 100 - percentBasic),
    coPayMajor: Math.max(0, 100 - percentMajor),
  };
}

// ---------- InsuranceClaim ----------

export interface MappedInsuranceClaim {
  id: string;
  patientId: string;
  insurancePlanId: string;
  appointmentId: string;
  claimDate: string;
  procedureCodes: string;
  totalAmount: number;
  narrative: string;
  status: string;
  submittedDate: string | null;
  approvedAmount: number | null;
  denialReason: string | null;
}

function mapClaimStatus(status: unknown): string {
  const statusStr = String(status ?? '').toLowerCase();
  // OD statuses → our UI statuses
  const statusMap: Record<string, string> = {
    u: 'draft',       // unsent → draft
    w: 'pending',     // waiting → pending
    r: 'approved',    // received → approved
    s: 'submitted',   // sent → submitted
    h: 'pending',     // hold → pending
  };
  return statusMap[statusStr] ?? (statusStr || 'draft');
}

export function mapODClaim(od: Record<string, unknown>): MappedInsuranceClaim {
  return {
    id: String(od.ClaimNum ?? ''),
    patientId: String(od.PatNum ?? ''),
    insurancePlanId: String(od.PlanNum ?? ''),
    appointmentId: String(od.ClinicNum ?? ''), // best-effort: OD claims don't always map directly
    claimDate: normalizeDate(od.DateService),
    procedureCodes: String(od.ClaimNote ?? ''),
    totalAmount: Number(od.ClaimFee ?? 0),
    narrative: String(od.ClaimNote ?? ''),
    status: mapClaimStatus(od.ClaimStatus),
    submittedDate: od.DateSent ? normalizeDate(od.DateSent) : null,
    approvedAmount: od.InsPayAmt != null ? Number(od.InsPayAmt) : null,
    denialReason: null, // OD doesn't return a single denial reason field
  };
}

// ---------- RecallTask ----------

export interface MappedRecallTask {
  id: string;
  patientId: string;
  lastHygieneDate: string;
  recallDueDate: string;
  daysOverdue: number;
  contactAttempts: number;
  lastContactDate: string | null;
  status: string;
  suggestedMessage: string;
}

export function mapODRecall(od: Record<string, unknown>): MappedRecallTask {
  const dueDate = normalizeDate(od.DateDue);
  const daysOverdue = calculateDaysOverdue(dueDate);

  const recallStatus =
    typeof od.RecallStatus === 'number'
      ? od.RecallStatus === 0
        ? 'pending'
        : 'contacted'
      : 'pending';

  return {
    id: String(od.RecallNum ?? ''),
    patientId: String(od.PatNum ?? ''),
    lastHygieneDate: normalizeDate(od.DatePrevious),
    recallDueDate: dueDate,
    daysOverdue: Math.max(0, daysOverdue),
    contactAttempts: Number(od.NumRemind ?? 0),
    lastContactDate: od.DateDue ? normalizeDate(od.DateDue) : null,
    status: recallStatus,
    suggestedMessage: `Recall due for patient. Last hygiene: ${normalizeDate(od.DatePrevious) || 'unknown'}.`,
  };
}

// ---------- Helpers ----------

/**
 * Normalize an OD date value to "YYYY-MM-DD" string.
 * OD can return "2024-03-15", "2024-03-15 00:00:00", or Date objects.
 */
function normalizeDate(value: unknown): string {
  if (!value) return '';
  const str = String(value);
  if (str === '0001-01-01' || str.startsWith('0001-01-01')) return '';

  const dt = new Date(str);
  if (isNaN(dt.getTime())) return str.split(' ')[0] ?? '';

  return dt.toISOString().split('T')[0]!;
}

function calculateDaysOverdue(dueDateStr: string): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return 0;
  const now = new Date();
  const diffMs = now.getTime() - due.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
