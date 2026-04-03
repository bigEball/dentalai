import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /insurance/plans - list all plans with patient data
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.insurancePlan.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch insurance plans' });
  }
});

// GET /insurance/plans/:id - single plan
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.insurancePlan.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        claims: { orderBy: { claimDate: 'desc' } },
      },
    });

    if (!plan) {
      res.status(404).json({ error: 'Insurance plan not found' });
      return;
    }

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch insurance plan' });
  }
});

// PATCH /insurance/plans/:id/verify - simulate verification
router.patch('/plans/:id/verify', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const plan = await prisma.insurancePlan.update({
      where: { id: req.params.id },
      data: {
        verificationStatus: 'verified',
        verifiedDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'verify_insurance',
      'InsurancePlan',
      plan.id,
      `Insurance verified for ${plan.patient.firstName} ${plan.patient.lastName} — ${plan.provider}`,
      { verifiedDate: today }
    );

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify insurance plan' });
  }
});

// GET /insurance/claims - list all claims with patient data
router.get('/claims', async (_req: Request, res: Response) => {
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

// GET /insurance/claims/:id - single claim
router.get('/claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        insurancePlan: true,
        appointment: { include: { clinicalNotes: true } },
      },
    });

    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// POST /insurance/claims - create a draft claim
router.post('/claims', async (req: Request, res: Response) => {
  try {
    const claim = await prisma.insuranceClaim.create({
      data: { ...req.body, status: 'draft' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: { select: { id: true, provider: true } },
      },
    });

    await logActivity(
      'create_claim',
      'InsuranceClaim',
      claim.id,
      `Claim created for ${claim.patient.firstName} ${claim.patient.lastName} — ${claim.insurancePlan.provider}`,
      { totalAmount: claim.totalAmount }
    );

    res.status(201).json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create claim' });
  }
});

// PATCH /insurance/claims/:id - update claim
router.patch('/claims/:id', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.insuranceClaim.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

// PATCH /insurance/claims/:id/submit - submit claim
router.patch('/claims/:id/submit', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const claim = await prisma.insuranceClaim.update({
      where: { id: req.params.id },
      data: {
        status: 'submitted',
        submittedDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: { select: { id: true, provider: true } },
      },
    });

    await logActivity(
      'submit_claim',
      'InsuranceClaim',
      claim.id,
      `Claim submitted for ${claim.patient.firstName} ${claim.patient.lastName} to ${claim.insurancePlan.provider}`,
      { submittedDate: today, totalAmount: claim.totalAmount }
    );

    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

export default router;
