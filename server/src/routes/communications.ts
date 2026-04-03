import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list communications
router.get('/', async (req: Request, res: Response) => {
  try {
    const { patientId, channel } = req.query;
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId as string;
    if (channel) where.channel = channel as string;

    const communications = await prisma.communication.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(communications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// GET /:id - single communication
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const communication = await prisma.communication.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });

    if (!communication) {
      res.status(404).json({ error: 'Communication not found' });
      return;
    }

    res.json(communication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch communication' });
  }
});

// POST / - create/send communication
router.post('/', async (req: Request, res: Response) => {
  try {
    const communication = await prisma.communication.create({
      data: {
        ...req.body,
        sentAt: req.body.sentAt ?? new Date().toISOString(),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'send_communication',
      'Communication',
      communication.id,
      `${communication.channel} message sent to ${communication.patient.firstName} ${communication.patient.lastName}`,
      { channel: communication.channel, direction: communication.direction }
    );

    res.status(201).json(communication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create communication' });
  }
});

// POST /bulk - send bulk message to multiple patients
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { patientIds, channel, subject, body, sentBy } = req.body;

    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      res.status(400).json({ error: 'patientIds array is required' });
      return;
    }

    const now = new Date().toISOString();
    const created = [];

    for (const patientId of patientIds) {
      const comm = await prisma.communication.create({
        data: {
          patientId,
          channel: channel ?? 'sms',
          direction: 'outbound',
          subject: subject ?? null,
          body,
          status: 'sent',
          sentAt: now,
          sentBy: sentBy ?? 'system',
        },
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      created.push(comm);
    }

    await logActivity(
      'bulk_communication',
      'Communication',
      'bulk',
      `Bulk ${channel ?? 'sms'} sent to ${patientIds.length} patients`,
      { patientCount: patientIds.length, channel: channel ?? 'sms' }
    );

    res.status(201).json({ sent: created.length, communications: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send bulk communications' });
  }
});

export default router;
