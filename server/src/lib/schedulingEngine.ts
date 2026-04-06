import { prisma } from '../db/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NoShowPrediction {
  appointmentId: string;
  patientId: string;
  patientName: string;
  procedureType: string;
  date: string;
  time: string;
  duration: number;
  probability: number;
  suggestedAction: 'double_book' | 'confirm' | null;
  riskFactors: string[];
}

interface ChairSlot {
  chair: number;
  startTime: string;
  endTime: string;
  appointmentId: string | null;
  patientName: string | null;
  procedureType: string | null;
  duration: number;
  noShowRisk: number;
  isGap: boolean;
}

interface ChairUtilization {
  date: string;
  totalChairs: number;
  operatingHours: { start: string; end: string };
  totalAvailableMinutes: number;
  totalBookedMinutes: number;
  utilization: number;
  chairs: {
    chair: number;
    bookedMinutes: number;
    availableMinutes: number;
    utilization: number;
    revenueEstimate: number;
    slots: ChairSlot[];
    gaps: { start: string; end: string; duration: number }[];
  }[];
  revenuePerChairHour: number;
  totalRevenueEstimate: number;
}

interface WeeklyUtilization {
  startDate: string;
  endDate: string;
  days: {
    date: string;
    dayOfWeek: string;
    utilization: number;
    bookedMinutes: number;
    appointmentCount: number;
    revenueEstimate: number;
  }[];
  averageUtilization: number;
  totalRevenue: number;
  peakDay: string;
  lowestDay: string;
}

interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  procedureType: string;
  estimatedDuration: number;
  preferredDays: string[];
  preferredTimes: string;
  urgency: 'routine' | 'soon' | 'urgent';
  treatmentPlanId?: string;
  status: 'waiting' | 'offered' | 'scheduled' | 'expired';
  createdAt: string;
}

interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  procedures: { type: string; count: number; avgDuration: number; avgRevenue: number }[];
  estimatedRevenue: number;
  estimatedUtilization: number;
  recommendedProviders: string[];
}

interface SchedulingDashboard {
  date: string;
  chairUtilization: number;
  avgNoShowRisk: number;
  revenuePerChairHour: number;
  waitlistSize: number;
  highRiskCount: number;
  totalAppointments: number;
  totalRevenueEstimate: number;
  topRiskAppointments: NoShowPrediction[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NUM_CHAIRS = 4;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 17;
const MINUTES_PER_CHAIR = (DAY_END_HOUR - DAY_START_HOUR) * 60; // 540
const TOTAL_CHAIR_MINUTES = NUM_CHAIRS * MINUTES_PER_CHAIR; // 2160

const BASE_NO_SHOW_RATES: Record<string, number> = {
  hygiene: 0.12,
  cleaning: 0.12,
  restorative: 0.08,
  filling: 0.08,
  crown: 0.08,
  surgery: 0.05,
  extraction: 0.05,
  root_canal: 0.05,
  consultation: 0.15,
  exam: 0.15,
  emergency: 0.02,
  whitening: 0.15,
  denture: 0.10,
  implant: 0.06,
  orthodontic: 0.07,
};

const DAY_MULTIPLIERS: Record<number, number> = {
  0: 1.0,  // Sunday
  1: 1.3,  // Monday
  2: 0.9,  // Tuesday
  3: 0.85, // Wednesday
  4: 0.95, // Thursday
  5: 1.25, // Friday
  6: 0.7,  // Saturday
};

const PROCEDURE_REVENUE: Record<string, number> = {
  hygiene: 180,
  cleaning: 180,
  restorative: 350,
  filling: 280,
  crown: 1200,
  surgery: 800,
  extraction: 300,
  root_canal: 950,
  consultation: 100,
  exam: 120,
  emergency: 250,
  whitening: 500,
  denture: 1800,
  implant: 3500,
  orthodontic: 250,
};

// ---------------------------------------------------------------------------
// In-memory stores
// ---------------------------------------------------------------------------

const predictionsCache = new Map<string, NoShowPrediction[]>();
const waitlist = new Map<string, WaitlistEntry>();

let waitlistIdCounter = 1;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getTimeMultiplier(time: string): number {
  const mins = timeToMinutes(time);
  const hour = mins / 60;
  if (hour >= 7 && hour < 8) return 1.3;
  if (hour >= 8 && hour < 11) return 0.8;
  if (hour >= 11 && hour < 13) return 1.0;
  if (hour >= 13 && hour < 15) return 0.9;
  if (hour >= 15 && hour < 17) return 1.2;
  if (hour >= 17 && hour < 19) return 1.4;
  return 1.0;
}

function getBaseRate(type: string): number {
  const normalized = type.toLowerCase().replace(/[\s-]+/g, '_');
  return BASE_NO_SHOW_RATES[normalized] ?? 0.10;
}

function getRevenueEstimate(type: string): number {
  const normalized = type.toLowerCase().replace(/[\s-]+/g, '_');
  return PROCEDURE_REVENUE[normalized] ?? 200;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

export async function predictNoShows(date: string): Promise<NoShowPrediction[]> {
  const appointments = await prisma.appointment.findMany({
    where: { date, status: { in: ['scheduled', 'confirmed'] } },
    include: {
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { time: 'asc' },
  });

  if (appointments.length === 0) {
    // Return cached predictions or empty
    return predictionsCache.get(date) ?? [];
  }

  // Batch-fetch all patient histories to avoid N+1
  const patientIds = Array.from(new Set(appointments.map((a) => a.patientId)));
  const allHistory = await prisma.appointment.findMany({
    where: {
      patientId: { in: patientIds },
      date: { lt: date },
      status: { in: ['completed', 'no-show', 'cancelled'] },
    },
    select: { patientId: true, status: true },
  });

  // Build per-patient stats
  const patientStats = new Map<string, { total: number; noShows: number }>();
  for (const h of allHistory) {
    const stats = patientStats.get(h.patientId) ?? { total: 0, noShows: 0 };
    stats.total += 1;
    if (h.status === 'no-show') stats.noShows += 1;
    patientStats.set(h.patientId, stats);
  }

  const dateObj = new Date(date + 'T12:00:00');
  const dayOfWeek = dateObj.getDay();
  const dayMultiplier = DAY_MULTIPLIERS[dayOfWeek] ?? 1.0;

  const predictions: NoShowPrediction[] = appointments.map((appt) => {
    const baseRate = getBaseRate(appt.type);
    const timeMultiplier = getTimeMultiplier(appt.time);
    const stats = patientStats.get(appt.patientId);
    const patientNoShowRate = stats && stats.total > 0 ? stats.noShows / stats.total : 0.1;

    const rawProbability = baseRate * dayMultiplier * timeMultiplier * (0.5 + patientNoShowRate);
    const probability = clamp(rawProbability, 0, 1);

    const riskFactors: string[] = [];
    if (baseRate >= 0.12) riskFactors.push(`${appt.type} procedures have higher no-show rates`);
    if (dayMultiplier >= 1.2) riskFactors.push('Monday/Friday appointments see more no-shows');
    if (timeMultiplier >= 1.2) riskFactors.push('Early morning or late afternoon slots have higher risk');
    if (patientNoShowRate > 0.2) riskFactors.push(`Patient has ${Math.round(patientNoShowRate * 100)}% historical no-show rate`);
    if (!stats || stats.total === 0) riskFactors.push('No prior appointment history (using default rate)');

    let suggestedAction: 'double_book' | 'confirm' | null = null;
    if (probability > 0.5) suggestedAction = 'double_book';
    else if (probability >= 0.3) suggestedAction = 'confirm';

    return {
      appointmentId: appt.id,
      patientId: appt.patientId,
      patientName: appt.patient
        ? `${appt.patient.firstName} ${appt.patient.lastName}`
        : 'Unknown Patient',
      procedureType: appt.type,
      date: appt.date,
      time: appt.time,
      duration: appt.duration,
      probability: Math.round(probability * 1000) / 1000,
      suggestedAction,
      riskFactors,
    };
  });

  // Cache predictions
  predictionsCache.set(date, predictions);

  return predictions;
}

export async function getChairUtilization(date: string): Promise<ChairUtilization> {
  const appointments = await prisma.appointment.findMany({
    where: { date, status: { not: 'cancelled' } },
    include: {
      patient: { select: { firstName: true, lastName: true } },
    },
    orderBy: { time: 'asc' },
  });

  // Get predictions for no-show risk overlay
  const predictions = predictionsCache.get(date) ?? [];
  const predictionMap = new Map(predictions.map((p) => [p.appointmentId, p]));

  // Assign appointments to chairs greedily by earliest available
  const chairEnds = Array(NUM_CHAIRS).fill(DAY_START_HOUR * 60);
  const chairAssignments: { chair: number; appointment: typeof appointments[0] }[] = [];

  // Sort by time then assign to first available chair
  const sorted = [...appointments].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  for (const appt of sorted) {
    const startMin = timeToMinutes(appt.time);
    let bestChair = 0;
    let bestEnd = Infinity;

    for (let c = 0; c < NUM_CHAIRS; c++) {
      if (chairEnds[c] <= startMin && chairEnds[c] < bestEnd) {
        bestChair = c;
        bestEnd = chairEnds[c];
      }
    }

    // If no chair is free, pick the one ending soonest
    if (bestEnd === Infinity) {
      for (let c = 0; c < NUM_CHAIRS; c++) {
        if (chairEnds[c] < bestEnd) {
          bestChair = c;
          bestEnd = chairEnds[c];
        }
      }
    }

    chairAssignments.push({ chair: bestChair, appointment: appt });
    chairEnds[bestChair] = startMin + appt.duration;
  }

  // Build chair data
  const chairData = Array.from({ length: NUM_CHAIRS }, (_, i) => {
    const chairAppts = chairAssignments
      .filter((ca) => ca.chair === i)
      .sort((a, b) => timeToMinutes(a.appointment.time) - timeToMinutes(b.appointment.time));

    const slots: ChairSlot[] = [];
    const gaps: { start: string; end: string; duration: number }[] = [];
    let bookedMinutes = 0;
    let revenueEstimate = 0;
    let cursor = DAY_START_HOUR * 60;

    for (const ca of chairAppts) {
      const appt = ca.appointment;
      const startMin = timeToMinutes(appt.time);
      const endMin = startMin + appt.duration;
      const pred = predictionMap.get(appt.id);

      // Gap before this appointment
      if (startMin > cursor) {
        const gapDuration = startMin - cursor;
        gaps.push({
          start: minutesToTime(cursor),
          end: minutesToTime(startMin),
          duration: gapDuration,
        });
        slots.push({
          chair: i + 1,
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(startMin),
          appointmentId: null,
          patientName: null,
          procedureType: null,
          duration: gapDuration,
          noShowRisk: 0,
          isGap: true,
        });
      }

      const patientName = appt.patient
        ? `${appt.patient.firstName} ${appt.patient.lastName}`
        : 'Unknown';

      slots.push({
        chair: i + 1,
        startTime: appt.time,
        endTime: minutesToTime(endMin),
        appointmentId: appt.id,
        patientName,
        procedureType: appt.type,
        duration: appt.duration,
        noShowRisk: pred?.probability ?? 0,
        isGap: false,
      });

      bookedMinutes += appt.duration;
      revenueEstimate += getRevenueEstimate(appt.type);
      cursor = endMin;
    }

    // Trailing gap
    const dayEnd = DAY_END_HOUR * 60;
    if (cursor < dayEnd) {
      const gapDuration = dayEnd - cursor;
      gaps.push({
        start: minutesToTime(cursor),
        end: minutesToTime(dayEnd),
        duration: gapDuration,
      });
      slots.push({
        chair: i + 1,
        startTime: minutesToTime(cursor),
        endTime: minutesToTime(dayEnd),
        appointmentId: null,
        patientName: null,
        procedureType: null,
        duration: gapDuration,
        noShowRisk: 0,
        isGap: true,
      });
    }

    return {
      chair: i + 1,
      bookedMinutes,
      availableMinutes: MINUTES_PER_CHAIR,
      utilization: Math.round((bookedMinutes / MINUTES_PER_CHAIR) * 1000) / 10,
      revenueEstimate,
      slots,
      gaps,
    };
  });

  const totalBookedMinutes = chairData.reduce((s, c) => s + c.bookedMinutes, 0);
  const totalRevenueEstimate = chairData.reduce((s, c) => s + c.revenueEstimate, 0);
  const totalHoursBooked = totalBookedMinutes / 60;
  const revenuePerChairHour = totalHoursBooked > 0 ? Math.round(totalRevenueEstimate / totalHoursBooked) : 0;

  return {
    date,
    totalChairs: NUM_CHAIRS,
    operatingHours: { start: '08:00', end: '17:00' },
    totalAvailableMinutes: TOTAL_CHAIR_MINUTES,
    totalBookedMinutes,
    utilization: Math.round((totalBookedMinutes / TOTAL_CHAIR_MINUTES) * 1000) / 10,
    chairs: chairData,
    revenuePerChairHour,
    totalRevenueEstimate,
  };
}

export async function getWeeklyUtilization(startDate: string): Promise<WeeklyUtilization> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const start = new Date(startDate + 'T12:00:00');
  const days: WeeklyUtilization['days'] = [];

  // Fetch all appointments for the week in one query
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const allAppointments = await prisma.appointment.findMany({
    where: { date: { in: dates }, status: { not: 'cancelled' } },
    select: { date: true, duration: true, type: true },
  });

  // Group by date
  const byDate = new Map<string, typeof allAppointments>();
  for (const appt of allAppointments) {
    const arr = byDate.get(appt.date) ?? [];
    arr.push(appt);
    byDate.set(appt.date, arr);
  }

  for (const dateStr of dates) {
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayAppts = byDate.get(dateStr) ?? [];
    const bookedMinutes = dayAppts.reduce((s, a) => s + a.duration, 0);
    const revenueEstimate = dayAppts.reduce((s, a) => s + getRevenueEstimate(a.type), 0);

    days.push({
      date: dateStr,
      dayOfWeek: dayNames[dateObj.getDay()],
      utilization: Math.round((bookedMinutes / TOTAL_CHAIR_MINUTES) * 1000) / 10,
      bookedMinutes,
      appointmentCount: dayAppts.length,
      revenueEstimate,
    });
  }

  const avgUtil = days.length > 0
    ? Math.round((days.reduce((s, d) => s + d.utilization, 0) / days.length) * 10) / 10
    : 0;

  const totalRevenue = days.reduce((s, d) => s + d.revenueEstimate, 0);

  const sorted = [...days].sort((a, b) => b.utilization - a.utilization);
  const peakDay = sorted[0]?.date ?? startDate;
  const lowestDay = sorted[sorted.length - 1]?.date ?? startDate;

  const endDate = dates[dates.length - 1];

  return {
    startDate,
    endDate,
    days,
    averageUtilization: avgUtil,
    totalRevenue,
    peakDay,
    lowestDay,
  };
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export function addToWaitlist(data: {
  patientId: string;
  patientName: string;
  procedureType: string;
  estimatedDuration: number;
  preferredDays: string[];
  preferredTimes: string;
  urgency: 'routine' | 'soon' | 'urgent';
  treatmentPlanId?: string;
}): WaitlistEntry {
  const id = `wl-${waitlistIdCounter++}`;
  const entry: WaitlistEntry = {
    id,
    ...data,
    status: 'waiting',
    createdAt: new Date().toISOString(),
  };
  waitlist.set(id, entry);
  return entry;
}

export function getWaitlist(status?: string): WaitlistEntry[] {
  const entries = Array.from(waitlist.values());
  if (status) return entries.filter((e) => e.status === status);
  return entries;
}

export function updateWaitlistEntry(
  id: string,
  data: Partial<Pick<WaitlistEntry, 'status' | 'preferredDays' | 'preferredTimes' | 'urgency'>>,
): WaitlistEntry | null {
  const entry = waitlist.get(id);
  if (!entry) return null;

  const updated: WaitlistEntry = { ...entry, ...data };
  waitlist.set(id, updated);
  return updated;
}

export async function findWaitlistMatch(
  appointmentId: string,
): Promise<{ match: WaitlistEntry | null; candidates: WaitlistEntry[] }> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { date: true, time: true, duration: true, type: true },
  });

  if (!appointment) return { match: null, candidates: [] };

  const dateObj = new Date(appointment.date + 'T12:00:00');
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dateObj.getDay()];

  const hourNum = timeToMinutes(appointment.time) / 60;
  let timeOfDay = 'morning';
  if (hourNum >= 12 && hourNum < 17) timeOfDay = 'afternoon';
  else if (hourNum >= 17) timeOfDay = 'evening';

  const waitingEntries = getWaitlist('waiting');

  const candidates = waitingEntries.filter((entry) => {
    // Duration must fit
    if (entry.estimatedDuration > appointment.duration + 15) return false;

    // Check preferred days
    const daysMatch =
      entry.preferredDays.length === 0 ||
      entry.preferredDays.some((d) => d.toLowerCase() === dayName);

    // Check preferred times
    const timesMatch =
      !entry.preferredTimes ||
      entry.preferredTimes === 'any' ||
      entry.preferredTimes.toLowerCase() === timeOfDay;

    return daysMatch && timesMatch;
  });

  // Sort by urgency (urgent > soon > routine) then by createdAt (oldest first)
  const urgencyOrder: Record<string, number> = { urgent: 0, soon: 1, routine: 2 };
  candidates.sort((a, b) => {
    const urgDiff = (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2);
    if (urgDiff !== 0) return urgDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return {
    match: candidates[0] ?? null,
    candidates,
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function getSchedulingDashboard(date: string): Promise<SchedulingDashboard> {
  const predictions = await predictNoShows(date);
  const utilization = await getChairUtilization(date);
  const waitlistEntries = getWaitlist('waiting');

  const avgRisk =
    predictions.length > 0
      ? Math.round((predictions.reduce((s, p) => s + p.probability, 0) / predictions.length) * 1000) / 1000
      : 0;

  const highRiskAppts = predictions.filter((p) => p.probability >= 0.3);

  return {
    date,
    chairUtilization: utilization.utilization,
    avgNoShowRisk: avgRisk,
    revenuePerChairHour: utilization.revenuePerChairHour,
    waitlistSize: waitlistEntries.length,
    highRiskCount: highRiskAppts.length,
    totalAppointments: predictions.length,
    totalRevenueEstimate: utilization.totalRevenueEstimate,
    topRiskAppointments: highRiskAppts
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Schedule Templates
// ---------------------------------------------------------------------------

export function getScheduleTemplates(): ScheduleTemplate[] {
  return [
    {
      id: 'production-day',
      name: 'Production Day',
      description: 'Maximize revenue with high-value procedures. Ideal for days with the strongest clinical team.',
      procedures: [
        { type: 'Crown Prep', count: 2, avgDuration: 90, avgRevenue: 1200 },
        { type: 'Root Canal', count: 1, avgDuration: 90, avgRevenue: 950 },
        { type: 'Large Restoration', count: 2, avgDuration: 60, avgRevenue: 450 },
        { type: 'Consultation', count: 3, avgDuration: 30, avgRevenue: 100 },
      ],
      estimatedRevenue: 4050,
      estimatedUtilization: 87,
      recommendedProviders: ['Dentist + Assistant', 'Hygienist for overflow exams'],
    },
    {
      id: 'hygiene-heavy',
      name: 'Hygiene Heavy',
      description: 'Recall and preventive focus. Great for maintaining patient relationships and steady cash flow.',
      procedures: [
        { type: 'Hygiene / Cleaning', count: 8, avgDuration: 60, avgRevenue: 180 },
        { type: 'Perio Maintenance', count: 2, avgDuration: 60, avgRevenue: 220 },
        { type: 'Exam / New Patient', count: 2, avgDuration: 45, avgRevenue: 120 },
      ],
      estimatedRevenue: 2120,
      estimatedUtilization: 72,
      recommendedProviders: ['2 Hygienists', 'Dentist for exams'],
    },
    {
      id: 'balanced-mix',
      name: 'Balanced Mix',
      description: 'A well-rounded day balancing production, hygiene, and new patient flow.',
      procedures: [
        { type: 'Crown Prep', count: 1, avgDuration: 90, avgRevenue: 1200 },
        { type: 'Restoration', count: 4, avgDuration: 45, avgRevenue: 350 },
        { type: 'Hygiene / Cleaning', count: 4, avgDuration: 60, avgRevenue: 180 },
        { type: 'Exam', count: 2, avgDuration: 30, avgRevenue: 120 },
        { type: 'Consultation', count: 1, avgDuration: 30, avgRevenue: 100 },
      ],
      estimatedRevenue: 3460,
      estimatedUtilization: 81,
      recommendedProviders: ['Dentist + Assistant', '1 Hygienist'],
    },
  ];
}
