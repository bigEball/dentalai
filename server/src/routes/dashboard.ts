import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET /dashboard/stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Run all aggregation queries in parallel
    const [
      pendingClaimsCount,
      balanceAgg,
      overdueRecallCount,
      notesAwaitingCount,
      recentActivity,
      allClaims,
      allBalances,
      approvedThisMonth,
      treatmentPlansProposed,
      pendingPreAuths,
      allInventory,
      pendingFollowUps,
      pendingForms,
      activePaymentPlans,
      openReferrals,
    ] = await Promise.all([
      // Total pending claims (pending + submitted)
      prisma.insuranceClaim.count({
        where: { status: { in: ['pending', 'submitted'] } },
      }),

      // Total outstanding balance
      prisma.balance.aggregate({
        _sum: { amount: true },
        where: { amount: { gt: 0 } },
      }),

      // Patients overdue for hygiene
      prisma.recallTask.count({
        where: { status: 'pending', daysOverdue: { gt: 0 } },
      }),

      // Notes awaiting approval
      prisma.clinicalNote.count({
        where: { status: 'pending_approval' },
      }),

      // Recent activity (last 10)
      prisma.activityLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),

      // All claims for groupBy
      prisma.insuranceClaim.findMany({
        select: { status: true },
      }),

      // All balances for groupBy
      prisma.balance.findMany({
        select: { collectionStatus: true, amount: true },
      }),

      // Approved claims this month
      prisma.insuranceClaim.aggregate({
        _sum: { approvedAmount: true },
        where: {
          status: 'approved',
          submittedDate: { gte: firstOfMonth },
        },
      }),

      // Treatment plans proposed
      prisma.treatmentPlan.count({
        where: { status: 'proposed' },
      }),

      // Pending pre-authorizations
      prisma.preAuthorization.count({
        where: { status: 'submitted' },
      }),

      // All inventory items (for low stock check)
      prisma.inventoryItem.findMany({
        select: { currentStock: true, minStock: true },
      }),

      // Pending follow-ups
      prisma.followUp.count({
        where: { status: 'pending' },
      }),

      // Pending forms
      prisma.patientForm.count({
        where: { status: 'pending' },
      }),

      // Active payment plans
      prisma.paymentPlan.count({
        where: { status: 'active' },
      }),

      // Open referrals
      prisma.referral.count({
        where: { status: { in: ['pending', 'sent'] } },
      }),
    ]);

    // Claims grouped by status
    const claimsByStatus: Record<string, number> = {};
    for (const claim of allClaims) {
      claimsByStatus[claim.status] = (claimsByStatus[claim.status] ?? 0) + 1;
    }

    // Balances grouped by collection status (summed)
    const balancesByCollectionStatus: Record<string, number> = {};
    for (const bal of allBalances) {
      const key = bal.collectionStatus;
      balancesByCollectionStatus[key] = (balancesByCollectionStatus[key] ?? 0) + bal.amount;
    }

    // Parse metadata in activity logs
    const parsedActivity = recentActivity.map((log) => ({
      ...log,
      metadata: (() => {
        if (!log.metadata) return null;
        try {
          return JSON.parse(log.metadata);
        } catch {
          return log.metadata;
        }
      })(),
    }));

    // Low stock count (Prisma can't compare two columns, so filter in memory)
    const lowStockItems = allInventory.filter((item) => item.currentStock <= item.minStock).length;

    res.json({
      totalPendingClaims: pendingClaimsCount,
      totalOutstandingBalance: balanceAgg._sum.amount ?? 0,
      patientsOverdueForHygiene: overdueRecallCount,
      notesAwaitingApproval: notesAwaitingCount,
      recentActivity: parsedActivity,
      claimsByStatus,
      balancesByCollectionStatus,
      recoveredRevenueThisMonth: approvedThisMonth._sum.approvedAmount ?? 0,
      treatmentPlansProposed,
      pendingPreAuths,
      lowStockItems,
      pendingFollowUps,
      pendingForms,
      activePaymentPlans,
      openReferrals,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
