import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list forms
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, formType } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;
    if (formType) where.formType = formType as string;

    const forms = await prisma.patientForm.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// GET /:id - single form
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const form = await prisma.patientForm.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    res.json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// POST / - create form
router.post('/', async (req: Request, res: Response) => {
  try {
    const form = await prisma.patientForm.create({
      data: req.body,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'create_form',
      'PatientForm',
      form.id,
      `${form.formType} form "${form.title}" created${form.patient ? ` for ${form.patient.firstName} ${form.patient.lastName}` : ''}`,
      { formType: form.formType }
    );

    res.status(201).json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// PATCH /:id/submit - submit form
router.patch('/:id/submit', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();

    const form = await prisma.patientForm.update({
      where: { id: req.params.id },
      data: {
        status: 'submitted',
        submittedAt: now,
        formData: req.body.formData ?? undefined,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'submit_form',
      'PatientForm',
      form.id,
      `${form.formType} form "${form.title}" submitted${form.patient ? ` by ${form.patient.firstName} ${form.patient.lastName}` : ''}`,
      { submittedAt: now }
    );

    res.json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// PATCH /:id/review - mark reviewed
router.patch('/:id/review', async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString();

    const form = await prisma.patientForm.update({
      where: { id: req.params.id },
      data: {
        status: 'reviewed',
        reviewedBy: req.body.reviewedBy,
        reviewedAt: now,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'review_form',
      'PatientForm',
      form.id,
      `${form.formType} form "${form.title}" reviewed by ${form.reviewedBy}`,
      { reviewedBy: form.reviewedBy, reviewedAt: now }
    );

    res.json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to review form' });
  }
});

export default router;
