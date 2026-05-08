import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/client';
import { logActivity } from './activity';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ObjectionType = 'cost' | 'fear' | 'time' | 'insurance' | 'indecision';
export type SequenceStatus = 'active' | 'paused' | 'completed' | 'converted';
export type TouchStatus = 'scheduled' | 'sent' | 'delivered' | 'opened' | 'responded';
export type TouchChannel = 'sms' | 'email';

export interface NurtureTouch {
  id: string;
  sequenceId: string;
  stepNumber: number;
  channel: TouchChannel;
  messageType: string;
  subject: string;
  body: string;
  scheduledFor: string;
  sentAt: string | null;
  status: TouchStatus;
  response: string | null;
}

export interface NurtureSequence {
  id: string;
  treatmentPlanId: string;
  patientId: string;
  patientName: string;
  planTitle: string;
  planValue: number;
  status: SequenceStatus;
  objectionType: ObjectionType;
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  lastTouchAt: string | null;
  nextTouchAt: string | null;
  convertedAt: string | null;
  conversionValue: number;
  touches: NurtureTouch[];
}

export interface NurtureDashboard {
  activeSequences: number;
  conversionRate: number;
  avgTouchesToConvert: number;
  revenueRecovered: number;
  totalSequences: number;
  convertedCount: number;
  pausedCount: number;
}

export interface NurtureFunnel {
  plansProposed: number;
  sequencesStarted: number;
  responsesReceived: number;
  converted: number;
}

// ─── In-Memory Store ────────────────────────────────────────────────────────

const sequences: Map<string, NurtureSequence> = new Map();
const touches: Map<string, NurtureTouch> = new Map();

// ─── Helpers ────────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function calcMonthly(amount: number, months: number): string {
  return (amount / months).toFixed(0);
}

// ─── Objection Classifier ───────────────────────────────────────────────────

async function classifyObjection(
  treatmentPlanId: string,
): Promise<ObjectionType> {
  const plan = await prisma.treatmentPlan.findUnique({
    where: { id: treatmentPlanId },
    include: {
      patient: true,
      items: true,
    },
  });

  if (!plan || !plan.patient) return 'indecision';

  const patient = plan.patient;

  // Cost signals
  const hasOutstandingBalance = patient.outstandingBalance > 200;
  const highPatientCost = plan.patientEst > 1000;
  const paymentPlans = await prisma.paymentPlan.findMany({
    where: { patientId: patient.id, status: 'active' },
  });
  const noPaymentPlan = paymentPlans.length === 0;
  if (hasOutstandingBalance || highPatientCost || (noPaymentPlan && plan.patientEst > 500)) {
    // Check cost strength: 2+ signals = definite cost
    const costSignals = [hasOutstandingBalance, highPatientCost, noPaymentPlan].filter(Boolean).length;
    if (costSignals >= 2) return 'cost';
  }

  // Fear signals
  const items = plan.items ?? [];
  const hasMajorProcedure = items.some(
    (item) =>
      item.procedureCode.startsWith('D7') ||
      item.procedureCode === 'D2740' ||
      item.procedureCode.startsWith('D33') ||
      item.procedureCode.startsWith('D60'),
  );
  const cancelledAppointments = await prisma.appointment.findMany({
    where: { patientId: patient.id, status: 'cancelled' },
  });
  const hasCancelledBefore = cancelledAppointments.length > 0;
  if (hasMajorProcedure || hasCancelledBefore) return 'fear';

  // Time signals
  const requiresMultipleVisits = items.length >= 3;
  const rescheduledAppointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
  });
  // Count appointments that were rescheduled (heuristic: cancelled + rescheduled on same type)
  const rescheduledCount = rescheduledAppointments.filter(
    (a) => a.status === 'cancelled',
  ).length;
  if (requiresMultipleVisits || rescheduledCount >= 2) return 'time';

  // Insurance signals
  const insuranceCoversPoorly = plan.patientEst > plan.totalEstimate * 0.6;
  const insurancePlans = await prisma.insurancePlan.findMany({
    where: { patientId: patient.id },
  });
  const nearAnnualMax = insurancePlans.some(
    (ip) => ip.annualUsed >= ip.annualMax * 0.8,
  );
  if (insuranceCoversPoorly || nearAnnualMax) return 'insurance';

  // Default
  return 'indecision';
}

// ─── Sequence Template Generator ────────────────────────────────────────────

function generateTouches(
  sequenceId: string,
  objection: ObjectionType,
  plan: {
    title: string;
    patientEst: number;
    insuranceEst: number;
    totalEstimate: number;
    items?: { procedureCode: string; description: string }[];
  },
  patient: { firstName: string; lastName: string },
  provider: { firstName: string; lastName: string; title: string } | null,
  startDate: Date,
): NurtureTouch[] {
  const name = patient.firstName;
  const providerName = provider
    ? `Dr. ${provider.lastName}`
    : 'Your dentist';
  const procedure = plan.title;
  const patientEst = plan.patientEst;
  const totalEstimate = plan.totalEstimate;
  const insuranceEst = plan.insuranceEst;
  const insurancePct =
    totalEstimate > 0
      ? Math.round((insuranceEst / totalEstimate) * 100)
      : 0;
  const remaining = insuranceEst;
  const monthly3 = calcMonthly(patientEst, 3);
  const monthly6 = calcMonthly(patientEst, 6);
  const monthly12 = calcMonthly(patientEst, 12);

  const templates: Record<
    ObjectionType,
    Array<{
      day: number;
      channel: TouchChannel;
      messageType: string;
      subject: string;
      body: string;
    }>
  > = {
    cost: [
      {
        day: 2,
        channel: 'sms',
        messageType: 'cost_awareness',
        subject: 'Investment in Your Smile',
        body: `Hi ${name}, we understand ${procedure} is an investment. Here's why treating this now saves money long-term: delaying treatment often leads to more extensive and expensive procedures. Your estimated cost is $${patientEst.toFixed(2)}.`,
      },
      {
        day: 5,
        channel: 'email',
        messageType: 'financing_options',
        subject: 'Flexible Financing Options for Your Treatment',
        body: `We offer flexible payment plans: $${monthly3}/mo for 3 months, $${monthly6}/mo for 6 months, or $${monthly12}/mo for 12 months. Zero interest available. Call us to set up a plan that works for your budget.`,
      },
      {
        day: 10,
        channel: 'sms',
        messageType: 'insurance_reminder',
        subject: 'Insurance Benefits Reminder',
        body: `You have $${remaining.toFixed(2)} in unused insurance benefits this year. Your plan covers ${insurancePct}% of ${procedure}. Benefits reset on Jan 1.`,
      },
      {
        day: 20,
        channel: 'email',
        messageType: 'provider_message',
        subject: `A Personal Note from ${providerName}`,
        body: `Dear ${name}, ${providerName} wanted to personally follow up about your treatment plan for ${plan.title}. We're here to answer any questions and help you make the best decision for your oral health.`,
      },
      {
        day: 30,
        channel: 'sms',
        messageType: 'final_reminder',
        subject: 'Last Reminder',
        body: `Last reminder: We'd love to help you get started on ${procedure}. Call us or reply to schedule. Limited financing offer available this month.`,
      },
    ],
    fear: [
      {
        day: 2,
        channel: 'sms',
        messageType: 'gentle_reassurance',
        subject: 'We Understand Your Concerns',
        body: `Hi ${name}, we know dental procedures can feel overwhelming. We want you to know that ${procedure} is a routine procedure and our team is experienced in making patients comfortable every step of the way.`,
      },
      {
        day: 5,
        channel: 'email',
        messageType: 'procedure_education',
        subject: `What to Expect: ${procedure}`,
        body: `We'd like to share what happens during ${procedure} so there are no surprises. Modern dentistry has made this procedure faster and more comfortable than ever. Most patients report minimal discomfort and are back to normal activities within a day.`,
      },
      {
        day: 10,
        channel: 'sms',
        messageType: 'testimonial',
        subject: 'Patient Success Story',
        body: `Hi ${name}, many of our patients felt the same way before their procedure. One patient recently said, "I wish I hadn't waited so long — it was so much easier than I expected!" We'd love to help you have the same experience.`,
      },
      {
        day: 20,
        channel: 'email',
        messageType: 'sedation_options',
        subject: 'Comfort Options for Your Visit',
        body: `Dear ${name}, we offer several comfort options including nitrous oxide (laughing gas), oral sedation, and noise-cancelling headphones. ${providerName} can discuss which option is best for you during a brief consultation.`,
      },
      {
        day: 30,
        channel: 'sms',
        messageType: 'personal_outreach',
        subject: 'We\'re Here for You',
        body: `${name}, ${providerName} asked us to reach out one more time. We truly care about your health and want to help you feel confident about ${procedure}. No pressure — just reply or call when you're ready.`,
      },
    ],
    time: [
      {
        day: 2,
        channel: 'sms',
        messageType: 'flexible_scheduling',
        subject: 'Flexible Scheduling Available',
        body: `Hi ${name}, we know your schedule is busy. We offer early morning, lunch hour, and evening appointments for ${procedure}. Let us work around your schedule.`,
      },
      {
        day: 5,
        channel: 'email',
        messageType: 'single_visit_options',
        subject: 'Streamlined Treatment Options',
        body: `Good news — we may be able to consolidate your treatment plan for ${plan.title} into fewer visits. Ask us about our same-day options and how we can minimize your time in the chair.`,
      },
      {
        day: 10,
        channel: 'sms',
        messageType: 'consequences_of_delay',
        subject: 'The Cost of Waiting',
        body: `Hi ${name}, we understand waiting feels easier, but delaying ${procedure} can lead to more complex treatment later. A small investment of time now can save you from longer procedures down the road.`,
      },
      {
        day: 20,
        channel: 'email',
        messageType: 'saved_spot',
        subject: 'We Saved Time for You',
        body: `Dear ${name}, we have several openings this month that would be perfect for starting your ${plan.title}. We can reserve a convenient time slot just for you — morning, afternoon, or evening.`,
      },
      {
        day: 30,
        channel: 'sms',
        messageType: 'check_in',
        subject: 'Quick Check-In',
        body: `${name}, just checking in about ${procedure}. Has your schedule opened up? We have flexible times available. Reply or call to book — it only takes a moment.`,
      },
    ],
    insurance: [
      {
        day: 2,
        channel: 'sms',
        messageType: 'coverage_explanation',
        subject: 'Understanding Your Coverage',
        body: `Hi ${name}, we want to make sure you understand your insurance coverage for ${procedure}. Your plan covers ${insurancePct}% of the treatment, bringing your out-of-pocket cost to $${patientEst.toFixed(2)}.`,
      },
      {
        day: 5,
        channel: 'email',
        messageType: 'benefits_timeline',
        subject: 'Maximize Your Insurance Benefits',
        body: `Your dental benefits reset at the end of the year. By scheduling ${procedure} now, you can use this year's remaining benefits ($${remaining.toFixed(2)} estimated coverage) and potentially split costs across two benefit years for larger treatments.`,
      },
      {
        day: 10,
        channel: 'sms',
        messageType: 'preauth_status',
        subject: 'Pre-Authorization Update',
        body: `Hi ${name}, we've submitted a pre-authorization for ${procedure} to help maximize your coverage. We'll keep you updated on the approval. In the meantime, feel free to call with any questions.`,
      },
      {
        day: 20,
        channel: 'email',
        messageType: 'remaining_benefits',
        subject: 'Your Remaining Benefits This Year',
        body: `Dear ${name}, a friendly reminder that your insurance benefits for this year include coverage for ${procedure}. Combined with our flexible payment options ($${monthly6}/mo for the patient portion), treatment is more affordable than you might think.`,
      },
      {
        day: 30,
        channel: 'sms',
        messageType: 'insurance_final_reminder',
        subject: 'Don\'t Leave Benefits on the Table',
        body: `${name}, your insurance benefits expire at year-end. Don't miss out on $${remaining.toFixed(2)} in coverage for ${procedure}. Call us today to schedule before benefits reset.`,
      },
    ],
    indecision: [
      {
        day: 2,
        channel: 'sms',
        messageType: 'educational_content',
        subject: 'Learn More About Your Treatment',
        body: `Hi ${name}, we wanted to share some information about ${procedure} to help you make an informed decision. Understanding the benefits can make the choice clearer. Feel free to call us with any questions.`,
      },
      {
        day: 5,
        channel: 'email',
        messageType: 'benefits_overview',
        subject: `Benefits of ${procedure}`,
        body: `${procedure} offers significant benefits for your oral health. Left untreated, the underlying condition may worsen over time, leading to more extensive treatment. Your estimated investment is $${patientEst.toFixed(2)} (after insurance).`,
      },
      {
        day: 10,
        channel: 'sms',
        messageType: 'qa_invitation',
        subject: 'Questions? We\'re Here to Help',
        body: `Hi ${name}, do you have any questions about your treatment plan for ${plan.title}? We'd be happy to schedule a quick phone call or in-office consultation to address any concerns. Just reply to this message.`,
      },
      {
        day: 20,
        channel: 'email',
        messageType: 'testimonial',
        subject: 'See What Other Patients Say',
        body: `Dear ${name}, many patients who've completed similar treatment plans say it was one of the best decisions they made for their health. ${providerName} and our team are committed to providing excellent care throughout your treatment.`,
      },
      {
        day: 30,
        channel: 'sms',
        messageType: 'final_checkin',
        subject: 'Final Check-In',
        body: `${name}, we just wanted to check in one last time about ${plan.title}. We respect your timeline and are here whenever you're ready. Reply "SCHEDULE" to book or "CALL" and we'll reach out.`,
      },
    ],
  };

  const template = templates[objection];

  return template.map((t, idx) => {
    const touch: NurtureTouch = {
      id: uuidv4(),
      sequenceId,
      stepNumber: idx + 1,
      channel: t.channel,
      messageType: t.messageType,
      subject: t.subject,
      body: t.body,
      scheduledFor: addDays(startDate, t.day),
      sentAt: null,
      status: 'scheduled',
      response: null,
    };
    touches.set(touch.id, touch);
    return touch;
  });
}

// ─── Seed mock data on first import ─────────────────────────────────────────

async function seedMockData(): Promise<void> {
  if (sequences.size > 0) return;

  try {
    const plans = await prisma.treatmentPlan.findMany({
      where: { status: { in: ['proposed', 'declined'] } },
      include: {
        patient: true,
        provider: true,
        items: true,
      },
      take: 5,
    });

    if (plans.length === 0) return;

    for (const plan of plans.slice(0, 3)) {
      if (!plan.patient) continue;

      const objection = await classifyObjection(plan.id);
      const seqId = uuidv4();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 20));

      const seqTouches = generateTouches(
        seqId,
        objection,
        plan,
        plan.patient,
        plan.provider,
        startDate,
      );

      // Simulate some touches already sent
      const sentCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < sentCount && i < seqTouches.length; i++) {
        seqTouches[i].status = 'sent';
        seqTouches[i].sentAt = seqTouches[i].scheduledFor;
        touches.set(seqTouches[i].id, seqTouches[i]);
      }

      const nextTouch = seqTouches.find((t) => t.status === 'scheduled');

      const seq: NurtureSequence = {
        id: seqId,
        treatmentPlanId: plan.id,
        patientId: plan.patientId,
        patientName: `${plan.patient.firstName} ${plan.patient.lastName}`,
        planTitle: plan.title,
        planValue: plan.totalEstimate,
        status: 'active',
        objectionType: objection,
        currentStep: sentCount,
        totalSteps: 5,
        startedAt: startDate.toISOString(),
        lastTouchAt: sentCount > 0 ? seqTouches[sentCount - 1].scheduledFor : null,
        nextTouchAt: nextTouch?.scheduledFor ?? null,
        convertedAt: null,
        conversionValue: plan.totalEstimate,
        touches: seqTouches,
      };

      sequences.set(seqId, seq);
    }

    // Add one converted sequence if we have enough plans
    if (plans.length >= 2) {
      const plan = plans[plans.length - 1];
      if (plan.patient) {
        const seqId = uuidv4();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 35);

        const seqTouches = generateTouches(
          seqId,
          'cost',
          plan,
          plan.patient,
          plan.provider,
          startDate,
        );

        // Mark all as sent and one as responded
        seqTouches.forEach((t, i) => {
          t.status = i === 1 ? 'responded' : 'sent';
          t.sentAt = t.scheduledFor;
          if (i === 1) {
            t.response = 'I would like to set up a payment plan. Can I do 6 months?';
          }
          touches.set(t.id, t);
        });

        const seq: NurtureSequence = {
          id: seqId,
          treatmentPlanId: plan.id,
          patientId: plan.patientId,
          patientName: `${plan.patient.firstName} ${plan.patient.lastName}`,
          planTitle: plan.title,
          planValue: plan.totalEstimate,
          status: 'converted',
          objectionType: 'cost',
          currentStep: 5,
          totalSteps: 5,
          startedAt: startDate.toISOString(),
          lastTouchAt: seqTouches[4].scheduledFor,
          nextTouchAt: null,
          convertedAt: addDays(startDate, 12),
          conversionValue: plan.totalEstimate,
          touches: seqTouches,
        };

        sequences.set(seqId, seq);
      }
    }
  } catch (err) {
    console.error('[nurtureEngine] Failed to seed mock data:', err);
  }
}

// Initialize mock data lazily
let seeded = false;
async function ensureSeeded(): Promise<void> {
  if (!seeded) {
    seeded = true;
    await seedMockData();
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function startSequence(
  treatmentPlanId: string,
): Promise<NurtureSequence> {
  await ensureSeeded();

  const plan = await prisma.treatmentPlan.findUnique({
    where: { id: treatmentPlanId },
    include: {
      patient: true,
      provider: true,
      items: true,
    },
  });

  if (!plan) throw new Error('Treatment plan not found');
  if (!plan.patient) throw new Error('Treatment plan has no patient');

  // Check if sequence already exists for this plan
  const existing = Array.from(sequences.values()).find(
    (seq) => seq.treatmentPlanId === treatmentPlanId && seq.status === 'active',
  );
  if (existing) {
    throw new Error('An active nurture sequence already exists for this treatment plan');
  }

  const objection = await classifyObjection(treatmentPlanId);
  const seqId = uuidv4();
  const startDate = new Date();

  const seqTouches = generateTouches(
    seqId,
    objection,
    plan,
    plan.patient,
    plan.provider,
    startDate,
  );

  const sequence: NurtureSequence = {
    id: seqId,
    treatmentPlanId: plan.id,
    patientId: plan.patientId,
    patientName: `${plan.patient.firstName} ${plan.patient.lastName}`,
    planTitle: plan.title,
    planValue: plan.totalEstimate,
    status: 'active',
    objectionType: objection,
    currentStep: 0,
    totalSteps: 5,
    startedAt: startDate.toISOString(),
    lastTouchAt: null,
    nextTouchAt: seqTouches[0]?.scheduledFor ?? null,
    convertedAt: null,
    conversionValue: plan.totalEstimate,
    touches: seqTouches,
  };

  sequences.set(seqId, sequence);

  await logActivity(
    'start_nurture_sequence',
    'NurtureSequence',
    seqId,
    `Nurture sequence started for "${plan.title}" — objection: ${objection}`,
    { treatmentPlanId, objection, patientEst: plan.patientEst },
  );

  return sequence;
}

export async function getSequences(
  filters?: { status?: string; patientId?: string },
): Promise<NurtureSequence[]> {
  await ensureSeeded();

  let result = Array.from(sequences.values());

  if (filters?.status) {
    result = result.filter((s) => s.status === filters.status);
  }
  if (filters?.patientId) {
    result = result.filter((s) => s.patientId === filters.patientId);
  }

  return result.sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
}

export async function getSequence(id: string): Promise<NurtureSequence | null> {
  await ensureSeeded();
  return sequences.get(id) ?? null;
}

export async function sendNextTouch(
  sequenceId: string,
): Promise<NurtureTouch> {
  await ensureSeeded();

  const sequence = sequences.get(sequenceId);
  if (!sequence) throw new Error('Sequence not found');
  if (sequence.status !== 'active')
    throw new Error('Sequence is not active');

  const nextTouch = sequence.touches.find((t) => t.status === 'scheduled');
  if (!nextTouch) throw new Error('No more scheduled touches');

  const now = new Date().toISOString();
  nextTouch.status = 'sent';
  nextTouch.sentAt = now;
  touches.set(nextTouch.id, nextTouch);

  sequence.currentStep = nextTouch.stepNumber;
  sequence.lastTouchAt = now;

  // Find next scheduled touch
  const upcoming = sequence.touches.find((t) => t.status === 'scheduled');
  sequence.nextTouchAt = upcoming?.scheduledFor ?? null;

  // If all touches sent, mark as completed
  if (!upcoming) {
    sequence.status = 'completed';
  }

  sequences.set(sequenceId, sequence);

  await logActivity(
    'send_nurture_touch',
    'NurtureSequence',
    sequenceId,
    `Touch ${nextTouch.stepNumber}/5 sent via ${nextTouch.channel} for "${sequence.planTitle}"`,
    { touchId: nextTouch.id, channel: nextTouch.channel, step: nextTouch.stepNumber },
  );

  return nextTouch;
}

export async function recordResponse(
  touchId: string,
  response: string,
): Promise<NurtureTouch> {
  await ensureSeeded();

  const touch = touches.get(touchId);
  if (!touch) throw new Error('Touch not found');

  touch.status = 'responded';
  touch.response = response;
  touches.set(touchId, touch);

  const sequence = sequences.get(touch.sequenceId);
  if (sequence) {
    // Check if response indicates conversion (positive keywords)
    const positiveKeywords = [
      'schedule',
      'book',
      'yes',
      'ready',
      'proceed',
      'payment plan',
      'set up',
      'let\'s do it',
      'interested',
    ];
    const isPositive = positiveKeywords.some((kw) =>
      response.toLowerCase().includes(kw),
    );

    if (isPositive) {
      sequence.status = 'converted';
      sequence.convertedAt = new Date().toISOString();
    }

    sequences.set(sequence.id, sequence);

    await logActivity(
      'nurture_response_received',
      'NurtureSequence',
      sequence.id,
      `Patient responded to touch ${touch.stepNumber}: "${response.slice(0, 100)}"`,
      { touchId, isPositive, step: touch.stepNumber },
    );
  }

  return touch;
}

export async function pauseSequence(id: string): Promise<NurtureSequence> {
  await ensureSeeded();

  const sequence = sequences.get(id);
  if (!sequence) throw new Error('Sequence not found');
  if (sequence.status !== 'active')
    throw new Error('Can only pause active sequences');

  sequence.status = 'paused';
  sequences.set(id, sequence);

  await logActivity(
    'pause_nurture_sequence',
    'NurtureSequence',
    id,
    `Nurture sequence paused for "${sequence.planTitle}"`,
  );

  return sequence;
}

export async function resumeSequence(id: string): Promise<NurtureSequence> {
  await ensureSeeded();

  const sequence = sequences.get(id);
  if (!sequence) throw new Error('Sequence not found');
  if (sequence.status !== 'paused')
    throw new Error('Can only resume paused sequences');

  sequence.status = 'active';
  sequences.set(id, sequence);

  await logActivity(
    'resume_nurture_sequence',
    'NurtureSequence',
    id,
    `Nurture sequence resumed for "${sequence.planTitle}"`,
  );

  return sequence;
}

export async function getNurtureDashboard(): Promise<NurtureDashboard> {
  await ensureSeeded();

  const all = Array.from(sequences.values());
  const active = all.filter((s) => s.status === 'active');
  const converted = all.filter((s) => s.status === 'converted');
  const paused = all.filter((s) => s.status === 'paused');

  const revenueRecovered = converted.reduce(
    (sum, s) => sum + s.conversionValue,
    0,
  );

  const avgTouches =
    converted.length > 0
      ? converted.reduce((sum, s) => sum + s.currentStep, 0) / converted.length
      : 0;

  const conversionRate =
    all.length > 0 ? (converted.length / all.length) * 100 : 0;

  return {
    activeSequences: active.length,
    conversionRate: Math.round(conversionRate * 10) / 10,
    avgTouchesToConvert: Math.round(avgTouches * 10) / 10,
    revenueRecovered,
    totalSequences: all.length,
    convertedCount: converted.length,
    pausedCount: paused.length,
  };
}

export async function getNurtureFunnel(): Promise<NurtureFunnel> {
  await ensureSeeded();

  // Count proposed plans from DB
  let plansProposed = 0;
  try {
    plansProposed = await prisma.treatmentPlan.count({
      where: { status: { in: ['proposed', 'declined'] } },
    });
  } catch {
    plansProposed = 10; // fallback
  }

  const all = Array.from(sequences.values());
  const sequencesStarted = all.length;

  // Count touches that received responses
  const allTouches = Array.from(touches.values());
  const responsesReceived = allTouches.filter(
    (t) => t.status === 'responded',
  ).length;

  const converted = all.filter((s) => s.status === 'converted').length;

  return {
    plansProposed: Math.max(plansProposed, sequencesStarted),
    sequencesStarted,
    responsesReceived,
    converted,
  };
}
