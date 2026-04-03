import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list payment plans
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;

    const plans = await prisma.paymentPlan.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        installments: { orderBy: { installmentNo: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment plans' });
  }
});

// GET /:id - single plan with installments
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.paymentPlan.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    });

    if (!plan) {
      res.status(404).json({ error: 'Payment plan not found' });
      return;
    }

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payment plan' });
  }
});

// POST / - create plan with auto-generated installments
router.post('/', async (req: Request, res: Response) => {
  try {
    const { totalAmount, downPayment = 0, monthlyPayment, startDate, patientId, interestRate = 0, notes } = req.body;

    const remaining = totalAmount - downPayment;
    const totalInstallments = Math.ceil(remaining / monthlyPayment);

    // Generate installment schedule
    const installments = [];
    const start = new Date(startDate);
    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(start.getFullYear(), start.getMonth() + i + 1, start.getDate());
      const isLast = i === totalInstallments - 1;
      const amount = isLast
        ? parseFloat((remaining - monthlyPayment * (totalInstallments - 1)).toFixed(2))
        : monthlyPayment;

      installments.push({
        installmentNo: i + 1,
        amount,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'pending',
      });
    }

    const plan = await prisma.paymentPlan.create({
      data: {
        patientId,
        totalAmount,
        downPayment,
        remainingAmount: remaining,
        monthlyPayment,
        totalInstallments,
        interestRate,
        startDate,
        notes: notes ?? null,
        installments: { create: installments },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    });

    await logActivity(
      'create_payment_plan',
      'PaymentPlan',
      plan.id,
      `Payment plan created for ${plan.patient.firstName} ${plan.patient.lastName} - $${totalAmount} in ${totalInstallments} installments`,
      { totalAmount, downPayment, monthlyPayment, totalInstallments }
    );

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment plan' });
  }
});

// PATCH /:id/pay-installment - pay next pending installment
router.patch('/:id/pay-installment', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.paymentPlan.findUnique({
      where: { id: req.params.id },
      include: {
        installments: { orderBy: { installmentNo: 'asc' } },
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!plan) {
      res.status(404).json({ error: 'Payment plan not found' });
      return;
    }

    const nextInstallment = plan.installments.find((i) => i.status === 'pending');
    if (!nextInstallment) {
      res.status(400).json({ error: 'No pending installments' });
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    await prisma.paymentPlanInstallment.update({
      where: { id: nextInstallment.id },
      data: { status: 'paid', paidDate: today },
    });

    const newPaidCount = plan.paidInstallments + 1;
    const allPaid = newPaidCount >= plan.totalInstallments;

    const updatedPlan = await prisma.paymentPlan.update({
      where: { id: req.params.id },
      data: {
        paidInstallments: newPaidCount,
        remainingAmount: { decrement: nextInstallment.amount },
        status: allPaid ? 'completed' : 'active',
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        installments: { orderBy: { installmentNo: 'asc' } },
      },
    });

    await logActivity(
      'pay_installment',
      'PaymentPlan',
      plan.id,
      `Installment #${nextInstallment.installmentNo} of $${nextInstallment.amount} paid for ${plan.patient.firstName} ${plan.patient.lastName}`,
      { installmentNo: nextInstallment.installmentNo, amount: nextInstallment.amount, paidDate: today }
    );

    res.json(updatedPlan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to pay installment' });
  }
});

// PATCH /:id/cancel - cancel plan
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.paymentPlan.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        installments: true,
      },
    });

    await logActivity(
      'cancel_payment_plan',
      'PaymentPlan',
      plan.id,
      `Payment plan cancelled for ${plan.patient.firstName} ${plan.patient.lastName}`,
      { remainingAmount: plan.remainingAmount }
    );

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel payment plan' });
  }
});

export default router;
