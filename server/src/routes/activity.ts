import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET /activity - list recent activity logs (last 50), newest first
router.get('/', async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    // Parse metadata JSON if present
    const parsed = logs.map((log) => ({
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

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
