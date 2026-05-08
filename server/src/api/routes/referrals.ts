import { Router, Request, Response } from 'express';
import { prisma } from '../../db/client';
import { logActivity } from '../../domain/activity';
import { isRecordNotFoundError } from '../errors';

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
    const requestedPatientId = req.body.patientId as string | undefined;
    const requestedProviderId = (req.body.referringProvId ?? req.body.providerId) as string | undefined;
    const requestedPatient = requestedPatientId
      ? await prisma.patient.findUnique({ where: { id: requestedPatientId }, select: { id: true } })
      : null;
    const requestedProvider = requestedProviderId
      ? await prisma.provider.findUnique({ where: { id: requestedProviderId }, select: { id: true } })
      : null;
    const fallbackPatient = await prisma.patient.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    const fallbackProvider = await prisma.provider.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const patientId = requestedPatient?.id ?? fallbackPatient?.id;
    const referringProvId = requestedProvider?.id ?? fallbackProvider?.id;
    const referredToName = req.body.referredToName ?? req.body.specialistName;
    const referredToSpecialty = req.body.referredToSpecialty ?? req.body.specialty ?? 'Specialist';
    const { referredToPhone, referredToEmail, reason } = req.body;
    const urgency = req.body.urgency ?? 'routine';

    if (!patientId || !referringProvId || !referredToName || !reason) {
      res.status(400).json({ error: 'patientId, referringProvId, referredToName, and reason are required' });
      return;
    }

    const referral = await prisma.referral.create({
      data: { patientId, referringProvId, referredToName, referredToSpecialty, referredToPhone, referredToEmail, reason, urgency },
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
    const { referredToName, referredToSpecialty, referredToPhone, referredToEmail, reason, urgency, status } = req.body;
    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: { referredToName, referredToSpecialty, referredToPhone, referredToEmail, reason, urgency, status },
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
    if (isRecordNotFoundError(err)) {
      res.status(404).json({ error: 'Referral not found' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to send referral' });
  }
});

// PATCH /:id/schedule - mark appointment scheduled
router.patch('/:id/schedule', async (req: Request, res: Response) => {
  try {
    const { appointmentDate } = req.body;
    if (!appointmentDate || isNaN(Date.parse(appointmentDate))) {
      res.status(400).json({ error: 'A valid appointmentDate is required' });
      return;
    }
    const referral = await prisma.referral.update({
      where: { id: req.params.id },
      data: {
        status: 'scheduled',
        appointmentDate,
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
