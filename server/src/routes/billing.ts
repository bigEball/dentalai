import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /billing/balances - list all balances with patient info
router.get('/balances', async (_req: Request, res: Response) => {
  try {
    const balances = await prisma.balance.findMany({
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
    res.json(balances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// GET /billing/balances/:id - single balance
router.get('/balances/:id', async (req: Request, res: Response) => {
  try {
    const balance = await prisma.balance.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });

    if (!balance) {
      res.status(404).json({ error: 'Balance not found' });
      return;
    }

    res.json(balance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// PATCH /billing/balances/:id/send-statement - mark statement sent
router.patch('/balances/:id/send-statement', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const balance = await prisma.balance.update({
      where: { id: req.params.id },
      data: {
        statementSent: true,
        statementDate: today,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'send_statement',
      'Balance',
      balance.id,
      `Statement sent to ${balance.patient.firstName} ${balance.patient.lastName} for $${balance.amount.toFixed(2)}`,
      { statementDate: today, amount: balance.amount }
    );

    res.json(balance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark statement sent' });
  }
});

// PATCH /billing/balances/:id/send-reminder - log reminder sent
router.patch('/balances/:id/send-reminder', async (req: Request, res: Response) => {
  try {
    const balance = await prisma.balance.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!balance) {
      res.status(404).json({ error: 'Balance not found' });
      return;
    }

    await logActivity(
      'send_reminder',
      'Balance',
      balance.id,
      `Payment reminder sent to ${balance.patient.firstName} ${balance.patient.lastName} for $${balance.amount.toFixed(2)}`,
      { amount: balance.amount, collectionStatus: balance.collectionStatus }
    );

    res.json({ success: true, balance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log reminder' });
  }
});

// PATCH /billing/balances/:id/mark-paid - mark balance as paid
router.patch('/balances/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const existing = await prisma.balance.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, outstandingBalance: true } },
      },
    });

    if (!existing) {
      res.status(404).json({ error: 'Balance not found' });
      return;
    }

    const paidAmount = existing.amount;

    const balance = await prisma.balance.update({
      where: { id: req.params.id },
      data: {
        lastPaymentDate: today,
        lastPaymentAmount: paidAmount,
        amount: 0,
        collectionStatus: 'paid',
      },
    });

    // Update patient's outstanding balance
    const newOutstanding = Math.max(0, existing.patient.outstandingBalance - paidAmount);
    await prisma.patient.update({
      where: { id: existing.patientId },
      data: { outstandingBalance: newOutstanding },
    });

    await logActivity(
      'mark_paid',
      'Balance',
      balance.id,
      `Payment of $${paidAmount.toFixed(2)} recorded for ${existing.patient.firstName} ${existing.patient.lastName}`,
      { paidAmount, paymentDate: today }
    );

    res.json(balance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark balance as paid' });
  }
});

export default router;
