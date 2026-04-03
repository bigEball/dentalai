import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list follow-ups
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { followUpDate: 'asc' },
    });
    res.json(followUps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
});

// GET /:id - single follow-up
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const followUp = await prisma.followUp.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        appointment: true,
      },
    });

    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    res.json(followUp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch follow-up' });
  }
});

// POST / - create follow-up
router.post('/', async (req: Request, res: Response) => {
  try {
    const followUp = await prisma.followUp.create({
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'create_followup',
      'FollowUp',
      followUp.id,
      `Follow-up created for ${followUp.patient.firstName} ${followUp.patient.lastName} - ${followUp.procedureType}`,
      { procedureType: followUp.procedureType, followUpDate: followUp.followUpDate }
    );

    res.status(201).json(followUp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
});

// PATCH /:id/send - send follow-up
router.patch('/:id/send', async (req: Request, res: Response) => {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data: { status: 'sent' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'send_followup',
      'FollowUp',
      followUp.id,
      `Follow-up sent to ${followUp.patient.firstName} ${followUp.patient.lastName} via ${followUp.channel}`,
      { channel: followUp.channel }
    );

    res.json(followUp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send follow-up' });
  }
});

// PATCH /:id/respond - log patient response
router.patch('/:id/respond', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();

    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data: {
        status: 'responded',
        response: req.body.response,
        respondedAt: now,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'followup_response',
      'FollowUp',
      followUp.id,
      `${followUp.patient.firstName} ${followUp.patient.lastName} responded to follow-up`,
      { response: followUp.response, respondedAt: now }
    );

    res.json(followUp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log follow-up response' });
  }
});

// PATCH /:id/complete - mark completed
router.patch('/:id/complete', async (req: Request, res: Response) => {
  try {
    const followUp = await prisma.followUp.update({
      where: { id: req.params.id },
      data: { status: 'completed' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json(followUp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete follow-up' });
  }
});

export default router;
