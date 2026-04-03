import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET /claims - alias that proxies to insurance claims
router.get('/', async (_req: Request, res: Response) => {
  try {
    const claims = await prisma.insuranceClaim.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: { select: { id: true, provider: true, memberId: true } },
        appointment: { select: { id: true, date: true, type: true } },
      },
      orderBy: { claimDate: 'desc' },
    });
    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

export default router;
