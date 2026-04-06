import { Router, Request, Response } from 'express';
import { generateHuddle, getHuddleHistory, getHuddleByDate, markHuddleReviewed } from '../lib/morningHuddle';
import { logActivity } from '../lib/activity';

const router = Router();

// GET /today — Get or generate today's huddle
router.get('/today', async (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let huddle = getHuddleByDate(today);

    if (!huddle) {
      huddle = await generateHuddle(today);
      await logActivity(
        'generate_huddle',
        'MorningHuddle',
        huddle.id,
        `Morning huddle generated for ${today} — ${huddle.summary.totalPatients} patients, ${huddle.alerts.length} alerts`,
        { date: today, totalPatients: huddle.summary.totalPatients }
      );
    }

    res.json(huddle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get today\'s huddle' });
  }
});

// GET /history — List past huddles
router.get('/history', async (_req: Request, res: Response) => {
  try {
    const history = getHuddleHistory();
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch huddle history' });
  }
});

// GET /:date — Get huddle for specific date
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    let huddle = getHuddleByDate(date);

    if (!huddle) {
      huddle = await generateHuddle(date);
      await logActivity(
        'generate_huddle',
        'MorningHuddle',
        huddle.id,
        `Morning huddle generated for ${date} — ${huddle.summary.totalPatients} patients`,
        { date, totalPatients: huddle.summary.totalPatients }
      );
    }

    res.json(huddle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get huddle for date' });
  }
});

// POST /generate — Force regenerate huddle
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
      return;
    }

    const huddle = await generateHuddle(targetDate);

    await logActivity(
      'regenerate_huddle',
      'MorningHuddle',
      huddle.id,
      `Morning huddle regenerated for ${targetDate} — ${huddle.summary.totalPatients} patients, ${huddle.alerts.length} alerts`,
      { date: targetDate, totalPatients: huddle.summary.totalPatients, forced: true }
    );

    res.json(huddle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate huddle' });
  }
});

// PATCH /:id/review — Mark huddle as reviewed
router.patch('/:id/review', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewedBy } = req.body;

    const huddle = markHuddleReviewed(id, reviewedBy || 'demo-user');

    if (!huddle) {
      res.status(404).json({ error: 'Huddle not found' });
      return;
    }

    await logActivity(
      'review_huddle',
      'MorningHuddle',
      huddle.id,
      `Morning huddle for ${huddle.date} marked as reviewed`,
      { date: huddle.date, reviewedBy: huddle.reviewedBy }
    );

    res.json(huddle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark huddle as reviewed' });
  }
});

export default router;
