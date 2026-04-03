import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET /appointments - list all appointments with patient and provider
router.get('/', async (_req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }],
    });
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// GET /appointments/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        provider: true,
        clinicalNotes: true,
        claims: true,
      },
    });
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
});

// PATCH /appointments/:id
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;
