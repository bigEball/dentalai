import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /recall/tasks - list recall tasks with patient info
router.get('/tasks', async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.recallTask.findMany({
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            preferredContactMethod: true,
          },
        },
      },
      orderBy: { daysOverdue: 'desc' },
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recall tasks' });
  }
});

// PATCH /recall/tasks/:id/contact - log contact attempt
router.patch('/tasks/:id/contact', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const task = await prisma.recallTask.update({
      where: { id: req.params.id },
      data: {
        contactAttempts: { increment: 1 },
        lastContactDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'recall_contact',
      'RecallTask',
      task.id,
      `Contact attempt #${task.contactAttempts} logged for ${task.patient.firstName} ${task.patient.lastName}`,
      { contactDate: today, attempts: task.contactAttempts }
    );

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log contact attempt' });
  }
});

// PATCH /recall/tasks/:id/schedule - mark task as scheduled
router.patch('/tasks/:id/schedule', async (req: Request, res: Response) => {
  try {
    const task = await prisma.recallTask.update({
      where: { id: req.params.id },
      data: { status: 'scheduled' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'recall_scheduled',
      'RecallTask',
      task.id,
      `Recall appointment scheduled for ${task.patient.firstName} ${task.patient.lastName}`
    );

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark recall as scheduled' });
  }
});

// PATCH /recall/tasks/:id/send-text - log text sent
router.patch('/tasks/:id/send-text', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const task = await prisma.recallTask.update({
      where: { id: req.params.id },
      data: {
        contactAttempts: { increment: 1 },
        lastContactDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    await logActivity(
      'recall_text_sent',
      'RecallTask',
      task.id,
      `Recall text message sent to ${task.patient.firstName} ${task.patient.lastName} at ${task.patient.phone}`,
      { contactDate: today, phone: task.patient.phone }
    );

    res.json({ success: true, task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log text sent' });
  }
});

// PATCH /recall/tasks/:id/send-email - log email sent
router.patch('/tasks/:id/send-email', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const task = await prisma.recallTask.update({
      where: { id: req.params.id },
      data: {
        contactAttempts: { increment: 1 },
        lastContactDate: today,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await logActivity(
      'recall_email_sent',
      'RecallTask',
      task.id,
      `Recall email sent to ${task.patient.firstName} ${task.patient.lastName} at ${task.patient.email}`,
      { contactDate: today, email: task.patient.email }
    );

    res.json({ success: true, task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log email sent' });
  }
});

export default router;
