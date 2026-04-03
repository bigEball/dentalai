import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list pre-authorizations
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;

    const preAuths = await prisma.preAuthorization.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: { select: { id: true, provider: true, memberId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(preAuths);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pre-authorizations' });
  }
});

// GET /:id - single pre-auth
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const preAuth = await prisma.preAuthorization.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        insurancePlan: true,
      },
    });

    if (!preAuth) {
      res.status(404).json({ error: 'Pre-authorization not found' });
      return;
    }

    res.json(preAuth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pre-authorization' });
  }
});

// POST / - create pre-auth
router.post('/', async (req: Request, res: Response) => {
  try {
    const preAuth = await prisma.preAuthorization.create({
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: { select: { id: true, provider: true } },
      },
    });

    await logActivity(
      'create_preauth',
      'PreAuthorization',
      preAuth.id,
      `Pre-authorization created for ${preAuth.patient.firstName} ${preAuth.patient.lastName} - ${preAuth.procedureCodes}`,
      { estimatedCost: preAuth.estimatedCost }
    );

    res.status(201).json(preAuth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pre-authorization' });
  }
});

// PATCH /:id - update pre-auth
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const preAuth = await prisma.preAuthorization.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        insurancePlan: true,
      },
    });
    res.json(preAuth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update pre-authorization' });
  }
});

// PATCH /:id/submit - submit pre-auth
router.patch('/:id/submit', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const preAuth = await prisma.preAuthorization.update({
      where: { id: req.params.id },
      data: {
        status: 'submitted',
        submittedDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'submit_preauth',
      'PreAuthorization',
      preAuth.id,
      `Pre-authorization submitted for ${preAuth.patient.firstName} ${preAuth.patient.lastName}`,
      { submittedDate: today }
    );

    res.json(preAuth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit pre-authorization' });
  }
});

// PATCH /:id/approve - mock approve
router.patch('/:id/approve', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const responseDate = today.toISOString().split('T')[0];
    const expiryDate = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
      .toISOString()
      .split('T')[0];

    const preAuth = await prisma.preAuthorization.update({
      where: { id: req.params.id },
      data: {
        status: 'approved',
        approvedAmount: req.body.approvedAmount ?? null,
        authNumber: `AUTH-${Date.now().toString(36).toUpperCase()}`,
        responseDate,
        expiryDate,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'approve_preauth',
      'PreAuthorization',
      preAuth.id,
      `Pre-authorization approved for ${preAuth.patient.firstName} ${preAuth.patient.lastName} - $${preAuth.approvedAmount ?? 0}`,
      { approvedAmount: preAuth.approvedAmount, authNumber: preAuth.authNumber }
    );

    res.json(preAuth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve pre-authorization' });
  }
});

// PATCH /:id/deny - mock deny
router.patch('/:id/deny', async (req: Request, res: Response) => {
  try {
    const responseDate = new Date().toISOString().split('T')[0];

    const preAuth = await prisma.preAuthorization.update({
      where: { id: req.params.id },
      data: {
        status: 'denied',
        denialReason: req.body.denialReason ?? 'Not medically necessary',
        responseDate,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'deny_preauth',
      'PreAuthorization',
      preAuth.id,
      `Pre-authorization denied for ${preAuth.patient.firstName} ${preAuth.patient.lastName}: ${preAuth.denialReason}`,
      { denialReason: preAuth.denialReason }
    );

    res.json(preAuth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to deny pre-authorization' });
  }
});

export default router;
