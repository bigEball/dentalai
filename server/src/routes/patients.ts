import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET /patients - list all with optional search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search } = req.query as { search?: string };

    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : undefined,
      include: {
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// GET /patients/:id - single patient with related data
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        provider: true,
        appointments: {
          orderBy: { date: 'desc' },
          include: {
            provider: { select: { id: true, firstName: true, lastName: true, title: true } },
          },
        },
        clinicalNotes: {
          orderBy: { date: 'desc' },
          include: {
            provider: { select: { id: true, firstName: true, lastName: true, title: true } },
          },
        },
        insurancePlans: true,
        insuranceClaims: {
          orderBy: { claimDate: 'desc' },
        },
        balances: true,
        recallTasks: true,
      },
    });

    if (!patient) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// PATCH /patients/:id - update patient fields
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, dateOfBirth, phone, email, preferredContactMethod, providerId } = req.body;
    const updated = await prisma.patient.update({
      where: { id: req.params.id },
      data: { firstName, lastName, dateOfBirth, phone, email, preferredContactMethod, providerId },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update patient' });
  }
});

export default router;
