import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

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
    const plan = await prisma.treatmentPlan.update({
      where: { id: req.params.id },
      data: req.body,
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

// POST /:id/items - add item to plan
router.post('/:id/items', async (req: Request, res: Response) => {
  try {
    const item = await prisma.treatmentPlanItem.create({
      data: {
        treatmentPlanId: req.params.id,
        ...req.body,
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
    const item = await prisma.treatmentPlanItem.update({
      where: { id: req.params.itemId },
      data: req.body,
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update treatment plan item' });
  }
});

export default router;
