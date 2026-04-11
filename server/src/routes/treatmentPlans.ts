import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';
import { getConfig } from '../config';

const router = Router();

// GET / - list all treatment plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, patientId } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;
    if (patientId) where.patientId = patientId as string;

    const plans = await prisma.treatmentPlan.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch treatment plans' });
  }
});

// GET /:id - single plan with items, patient, provider
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        provider: true,
        items: { orderBy: { sequence: 'asc' } },
      },
    });

    if (!plan) {
      res.status(404).json({ error: 'Treatment plan not found' });
      return;
    }

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch treatment plan' });
  }
});

// POST / - create plan with items array
router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, ...planData } = req.body;

    const plan = await prisma.treatmentPlan.create({
      data: {
        ...planData,
        items: items ? { create: items } : undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
        items: true,
      },
    });

    await logActivity(
      'create_treatment_plan',
      'TreatmentPlan',
      plan.id,
      `Treatment plan "${plan.title}" created for ${plan.patient.firstName} ${plan.patient.lastName}`,
      { totalEstimate: plan.totalEstimate, itemCount: plan.items.length }
    );

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create treatment plan' });
  }
});

// PATCH /:id - update plan fields
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { title, status, totalEstimate, insuranceEst, patientEst, notes } = req.body;
    const plan = await prisma.treatmentPlan.update({
      where: { id: req.params.id },
      data: { title, status, totalEstimate, insuranceEst, patientEst, notes },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: true,
        items: true,
      },
    });
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update treatment plan' });
  }
});

// PATCH /:id/accept - set status to accepted
router.patch('/:id/accept', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const plan = await prisma.treatmentPlan.update({
      where: { id: req.params.id },
      data: {
        status: 'accepted',
        acceptedDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        items: true,
      },
    });

    await logActivity(
      'accept_treatment_plan',
      'TreatmentPlan',
      plan.id,
      `Treatment plan "${plan.title}" accepted by ${plan.patient.firstName} ${plan.patient.lastName}`,
      { acceptedDate: today, totalEstimate: plan.totalEstimate }
    );

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept treatment plan' });
  }
});

// PATCH /:id/decline - set status to declined
router.patch('/:id/decline', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.treatmentPlan.update({
      where: { id: req.params.id },
      data: { status: 'declined' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'decline_treatment_plan',
      'TreatmentPlan',
      plan.id,
      `Treatment plan "${plan.title}" declined by ${plan.patient.firstName} ${plan.patient.lastName}`
    );

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline treatment plan' });
  }
});

// POST /:id/send - send treatment plan to patient via text
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: req.params.id },
      include: { patient: true, items: true },
    });

    if (!plan) {
      res.status(404).json({ error: 'Treatment plan not found' });
      return;
    }

    if (!plan.patient) {
      res.status(400).json({ error: 'Cannot send a plan with no patient assigned' });
      return;
    }

    if (!plan.patient.phone) {
      res.status(400).json({ error: 'Patient has no phone number on file' });
      return;
    }

    const planToken = plan.planToken || uuidv4();
    const now = new Date().toISOString();

    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const planLink = `${baseUrl}/treatment-plans/view/${planToken}`;

    const config = getConfig();
    const officeName = config.office.name;
    const patientFirst = plan.patient.firstName;
    const itemCount = plan.items?.length ?? 0;
    const messageBody =
      `Hi ${patientFirst}! 😊 ${officeName} here. Your dentist has prepared a treatment plan for you — ` +
      `"${plan.title}" with ${itemCount} procedure${itemCount !== 1 ? 's' : ''} ` +
      `(estimated patient cost: $${plan.patientEst.toFixed(2)}).\n\n` +
      `Review it here: ${planLink}\n\n` +
      `If you have any questions, feel free to call us. We look forward to helping you!`;

    const updated = await prisma.treatmentPlan.update({
      where: { id: plan.id },
      data: { planToken, sentAt: now },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        items: true,
      },
    });

    await prisma.communication.create({
      data: {
        patientId: plan.patient.id,
        channel: 'sms',
        direction: 'outbound',
        subject: `Treatment Plan: ${plan.title}`,
        body: messageBody,
        status: 'sent',
        sentAt: now,
        sentBy: 'Office Manager',
        metadata: JSON.stringify({ treatmentPlanId: plan.id, planToken, planLink }),
      },
    });

    await logActivity(
      'send_treatment_plan',
      'TreatmentPlan',
      plan.id,
      `"${plan.title}" sent to ${plan.patient.firstName} ${plan.patient.lastName} at ${plan.patient.phone}`,
      { phone: plan.patient.phone, planToken, sentAt: now, totalEstimate: plan.totalEstimate, itemCount }
    );

    res.json({ ...updated, messagePreview: messageBody, planLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send treatment plan' });
  }
});

// POST /:id/items - add item to plan
router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const { procedureCode, description, toothNumber, surface, estimatedCost, insuranceCoverage, patientCost, sequence, status } = req.body;
    const item = await prisma.treatmentPlanItem.create({
      data: {
        treatmentPlanId: req.params.id,
        procedureCode, description, toothNumber, surface, estimatedCost, insuranceCoverage, patientCost, sequence, status,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add treatment plan item' });
  }
});

// PATCH /:id/items/:itemId - update item status
router.patch('/:id/items/:itemId', async (req: Request, res: Response) => {
  try {
    const { status, estimatedCost, insuranceCoverage, patientCost } = req.body;
    const item = await prisma.treatmentPlanItem.update({
      where: { id: req.params.itemId },
      data: { status, estimatedCost, insuranceCoverage, patientCost },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update treatment plan item' });
  }
});

export default router;
