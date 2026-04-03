import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET /production - production by provider
router.get('/production', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    const where: Record<string, unknown> = { status: 'approved' };
    if (start || end) {
      const dateFilter: Record<string, string> = {};
      if (start) dateFilter.gte = start as string;
      if (end) dateFilter.lte = end as string;
      where.submittedDate = dateFilter;
    }

    const claims = await prisma.insuranceClaim.findMany({
      where,
      include: {
        appointment: {
          include: {
            provider: { select: { id: true, firstName: true, lastName: true, title: true } },
          },
        },
      },
    });

    // Aggregate by provider
    const byProvider: Record<string, { provider: { id: string; firstName: string; lastName: string; title: string }; totalApproved: number; claimCount: number }> = {};
    for (const claim of claims) {
      const prov = claim.appointment.provider;
      if (!byProvider[prov.id]) {
        byProvider[prov.id] = { provider: prov, totalApproved: 0, claimCount: 0 };
      }
      byProvider[prov.id].totalApproved += claim.approvedAmount ?? 0;
      byProvider[prov.id].claimCount += 1;
    }

    res.json(Object.values(byProvider));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch production report' });
  }
});

// GET /collections - collections report
router.get('/collections', async (_req: Request, res: Response) => {
  try {
    const balances = await prisma.balance.findMany({
      select: { collectionStatus: true, amount: true, lastPaymentAmount: true },
    });

    const byStatus: Record<string, { count: number; totalAmount: number }> = {};
    let totalPayments = 0;

    for (const bal of balances) {
      if (!byStatus[bal.collectionStatus]) {
        byStatus[bal.collectionStatus] = { count: 0, totalAmount: 0 };
      }
      byStatus[bal.collectionStatus].count += 1;
      byStatus[bal.collectionStatus].totalAmount += bal.amount;
      totalPayments += bal.lastPaymentAmount ?? 0;
    }

    res.json({ byStatus, totalPayments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch collections report' });
  }
});

// GET /case-acceptance - treatment plan acceptance rate
router.get('/case-acceptance', async (_req: Request, res: Response) => {
  try {
    const plans = await prisma.treatmentPlan.findMany({
      select: { status: true },
    });

    const byStatus: Record<string, number> = {};
    for (const plan of plans) {
      byStatus[plan.status] = (byStatus[plan.status] ?? 0) + 1;
    }

    const total = plans.length;
    const accepted = byStatus['accepted'] ?? 0;
    const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0';

    res.json({ byStatus, total, accepted, acceptanceRate: parseFloat(acceptanceRate) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch case acceptance report' });
  }
});

// GET /hygiene - hygiene recall stats
router.get('/hygiene', async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.recallTask.findMany({
      select: { status: true, daysOverdue: true },
    });

    const total = tasks.length;
    const overdue = tasks.filter((t) => t.daysOverdue > 0).length;
    const scheduled = tasks.filter((t) => t.status === 'scheduled').length;
    const reappointmentRate = total > 0 ? ((scheduled / total) * 100).toFixed(1) : '0.0';

    const overdueBreakdown = {
      '1-30': tasks.filter((t) => t.daysOverdue > 0 && t.daysOverdue <= 30).length,
      '31-60': tasks.filter((t) => t.daysOverdue > 30 && t.daysOverdue <= 60).length,
      '61-90': tasks.filter((t) => t.daysOverdue > 60 && t.daysOverdue <= 90).length,
      '90+': tasks.filter((t) => t.daysOverdue > 90).length,
    };

    res.json({ total, overdue, scheduled, reappointmentRate: parseFloat(reappointmentRate), overdueBreakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch hygiene report' });
  }
});

// GET /aging-ar - aging accounts receivable
router.get('/aging-ar', async (_req: Request, res: Response) => {
  try {
    const balances = await prisma.balance.findMany({
      where: { amount: { gt: 0 } },
      select: { collectionStatus: true, amount: true },
    });

    const byStatus: Record<string, { count: number; totalAmount: number }> = {};
    let grandTotal = 0;

    for (const bal of balances) {
      if (!byStatus[bal.collectionStatus]) {
        byStatus[bal.collectionStatus] = { count: 0, totalAmount: 0 };
      }
      byStatus[bal.collectionStatus].count += 1;
      byStatus[bal.collectionStatus].totalAmount += bal.amount;
      grandTotal += bal.amount;
    }

    res.json({ byStatus, grandTotal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch aging AR report' });
  }
});

export default router;
