import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';

const router = Router();

// GET / - get appointments with date range and provider filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end, providerId } = req.query;
    const where: Record<string, unknown> = {};

    if (start || end) {
      const dateFilter: Record<string, string> = {};
      if (start) dateFilter.gte = start as string;
      if (end) dateFilter.lte = end as string;
      where.date = dateFilter;
    }
    if (providerId) where.providerId = providerId as string;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch calendar appointments' });
  }
});

// GET /providers - list all providers (for calendar column view)
router.get('/providers', async (_req: Request, res: Response) => {
  try {
    const providers = await prisma.provider.findMany({
      orderBy: { lastName: 'asc' },
    });
    res.json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// GET /availability - get open slots for a provider on a date
router.get('/availability', async (req: Request, res: Response) => {
  try {
    const { providerId, date } = req.query;

    if (!providerId || !date) {
      res.status(400).json({ error: 'providerId and date are required' });
      return;
    }

    // Get existing appointments for this provider on this date
    const existing = await prisma.appointment.findMany({
      where: {
        providerId: providerId as string,
        date: date as string,
        status: { not: 'cancelled' },
      },
      select: { time: true, duration: true },
    });

    // Build set of occupied 30-min slots
    const occupied = new Set<string>();
    for (const appt of existing) {
      const [hours, minutes] = appt.time.split(':').map(Number);
      const startMin = hours * 60 + minutes;
      const slots = Math.ceil(appt.duration / 30);
      for (let i = 0; i < slots; i++) {
        const slotMin = startMin + i * 30;
        const h = Math.floor(slotMin / 60).toString().padStart(2, '0');
        const m = (slotMin % 60).toString().padStart(2, '0');
        occupied.add(`${h}:${m}`);
      }
    }

    // Generate all 30-min slots from 8:00 to 17:00
    const openSlots: string[] = [];
    for (let min = 8 * 60; min < 17 * 60; min += 30) {
      const h = Math.floor(min / 60).toString().padStart(2, '0');
      const m = (min % 60).toString().padStart(2, '0');
      const slot = `${h}:${m}`;
      if (!occupied.has(slot)) {
        openSlots.push(slot);
      }
    }

    res.json({ date, providerId, openSlots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
