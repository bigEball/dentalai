import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';
import { getConfig } from '../config';

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
    const { patientId, formType, title, status } = req.body;
    const form = await prisma.patientForm.create({
      data: { patientId, formType, title, status },
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

// POST /:id/send - send form link to patient via text
router.post('/:id/send', async (req: Request, res: Response) => {
  try {
    const form = await prisma.patientForm.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });

    if (!form) {
      res.status(404).json({ error: 'Form not found' });
      return;
    }

    if (!form.patient) {
      res.status(400).json({ error: 'Cannot send a form with no patient assigned' });
      return;
    }

    if (!form.patient.phone) {
      res.status(400).json({ error: 'Patient has no phone number on file' });
      return;
    }

    // Generate a unique token for the form link
    const formToken = form.formToken || uuidv4();
    const now = new Date().toISOString();

    // Build the form link (uses app origin or a placeholder)
    const baseUrl = process.env.APP_URL || 'http://localhost:5173';
    const formLink = `${baseUrl}/forms/fill/${formToken}`;

    // Friendly text message
    const config = getConfig();
    const officeName = config.office.name;
    const patientFirst = form.patient.firstName;
    const messageBody =
      `Hi ${patientFirst}! 😊 ${officeName} here. We have some paperwork for your upcoming visit. ` +
      `Please fill it out at your convenience:\n\n${formLink}\n\n` +
      `It only takes a few minutes and helps us make the most of your appointment time. See you soon!`;

    // Update the form with token and sent timestamp
    const updated = await prisma.patientForm.update({
      where: { id: form.id },
      data: { formToken, sentAt: now },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
    });

    // Log a communication record
    await prisma.communication.create({
      data: {
        patientId: form.patient.id,
        channel: 'sms',
        direction: 'outbound',
        subject: `Form: ${form.title}`,
        body: messageBody,
        status: 'sent',
        sentAt: now,
        sentBy: 'Office Manager',
        metadata: JSON.stringify({ formId: form.id, formToken, formLink }),
      },
    });

    await logActivity(
      'send_form',
      'PatientForm',
      form.id,
      `"${form.title}" sent to ${form.patient.firstName} ${form.patient.lastName} at ${form.patient.phone}`,
      { phone: form.patient.phone, formToken, sentAt: now }
    );

    res.json({ ...updated, messagePreview: messageBody, formLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send form' });
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
