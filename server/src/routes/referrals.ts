import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list referrals
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;

    const referrals = await prisma.referral.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        referringProvider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(referrals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// GET /:id - single referral
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        referringProvider: true,
      },
    });

    if (!referral) {
      res.status(404).json({ error: 'Referral not found' });
      return;
    }

    res.json(referral);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch referral' });
  }
});

// POST / - create referral
router.post('/', async (req: Request, res: Response) => {
  try {
    const referral = await prisma.referral.create({
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        referringProvider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'create_referral',
      'Referral',
      referral.id,
      `Referral created for ${referral.patient.firstName} ${referral.patient.lastName} to ${referral.referredToName} (${referral.referredToSpecialty})`,
      { referredTo: referral.referredToName, specialty: referral.referredToSpecialty, urgency: referral.urgency }
    );

    res.status(201).json(referral);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// PATCH /:id - update referral
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        referringProvider: true,
      },
    });
    res.json(referral);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update referral' });
  }
});

// PATCH /:id/send - mark as sent
router.patch('/:id/send', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: {
        status: 'sent',
        sentDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'send_referral',
      'Referral',
      referral.id,
      `Referral sent for ${referral.patient.firstName} ${referral.patient.lastName} to ${referral.referredToName}`,
      { sentDate: today }
    );

    res.json(referral);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send referral' });
  }
});

// PATCH /:id/schedule - mark appointment scheduled
router.patch('/:id/schedule', async (req: Request, res: Response) => {
  try {
    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: {
        status: 'scheduled',
        appointmentDate: req.body.appointmentDate,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'schedule_referral',
      'Referral',
      referral.id,
      `Referral appointment scheduled for ${referral.patient.firstName} ${referral.patient.lastName} on ${referral.appointmentDate}`,
      { appointmentDate: referral.appointmentDate }
    );

    res.json(referral);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to schedule referral' });
  }
});

// PATCH /:id/complete - mark completed with report
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: {
        status: 'completed',
        reportReceived: true,
        reportNotes: req.body.reportNotes ?? null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'complete_referral',
      'Referral',
      referral.id,
      `Referral completed for ${referral.patient.firstName} ${referral.patient.lastName} - report received`,
      { reportReceived: true }
    );

    res.json(referral);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete referral' });
  }
});

export default router;
