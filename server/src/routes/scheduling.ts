import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  predictNoShows,
  getChairUtilization,
  getWeeklyUtilization,
  addToWaitlist,
  getWaitlist,
  updateWaitlistEntry,
  findWaitlistMatch,
  getSchedulingDashboard,
  getScheduleTemplates,
} from '../lib/schedulingEngine';

const router = Router();

// GET /predictions/:date — All no-show predictions for a date
router.get('/predictions/:date', async (req: Request, res: Response) => {
  try {
    const predictions = await predictNoShows(req.params.date);
    res.json(predictions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
});

// POST /predict — Generate predictions for a date or date range
router.post('/predict', async (req: Request, res: Response) => {
  try {
    const { date, startDate, endDate } = req.body;

    if (date) {
      const predictions = await predictNoShows(date);

      await logActivity(
        'generate_predictions',
        'Scheduling',
        date,
        `Generated no-show predictions for ${date}: ${predictions.length} appointments analyzed`,
        { appointmentCount: predictions.length, highRiskCount: predictions.filter((p) => p.probability >= 0.3).length },
      );

      res.json({ date, predictions });
      return;
    }

    if (startDate && endDate) {
      const start = new Date(startDate + 'T12:00:00');
      const end = new Date(endDate + 'T12:00:00');
      const results: Record<string, unknown[]> = {};

      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        results[dateStr] = await predictNoShows(dateStr);
        current.setDate(current.getDate() + 1);
      }

      await logActivity(
        'generate_predictions_range',
        'Scheduling',
        startDate,
        `Generated predictions for ${startDate} to ${endDate}`,
      );

      res.json({ startDate, endDate, predictions: results });
      return;
    }

    res.status(400).json({ error: 'Provide either "date" or "startDate" and "endDate"' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// GET /utilization/weekly — Weekly utilization summary (must come before /:date)
router.get('/utilization/weekly', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || new Date().toISOString().split('T')[0];
    const weekly = await getWeeklyUtilization(startDate);
    res.json(weekly);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weekly utilization' });
  }
});

// GET /utilization/:date — Chair utilization for a specific date
router.get('/utilization/:date', async (req: Request, res: Response) => {
  try {
    const utilization = await getChairUtilization(req.params.date);
    res.json(utilization);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chair utilization' });
  }
});

// POST /waitlist — Add to waitlist
router.post('/waitlist', async (req: Request, res: Response) => {
  try {
    const { patientId, patientName, procedureType, estimatedDuration, preferredDays, preferredTimes, urgency, treatmentPlanId } = req.body;

    if (!patientId || !patientName || !procedureType) {
      res.status(400).json({ error: 'patientId, patientName, and procedureType are required' });
      return;
    }

    const entry = addToWaitlist({
      patientId,
      patientName,
      procedureType,
      estimatedDuration: estimatedDuration ?? 60,
      preferredDays: preferredDays ?? [],
      preferredTimes: preferredTimes ?? 'any',
      urgency: urgency ?? 'routine',
      treatmentPlanId,
    });

    await logActivity(
      'add_to_waitlist',
      'Scheduling',
      entry.id,
      `${patientName} added to waitlist for ${procedureType} (${urgency ?? 'routine'})`,
      { patientId, procedureType, urgency },
    );

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
});

// GET /waitlist — Current waitlist
router.get('/waitlist', async (_req: Request, res: Response) => {
  try {
    const status = _req.query.status as string | undefined;
    const entries = getWaitlist(status);
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
});

// PATCH /waitlist/:id — Update waitlist entry
router.patch('/waitlist/:id', async (req: Request, res: Response) => {
  try {
    const updated = updateWaitlistEntry(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Waitlist entry not found' });
      return;
    }

    await logActivity(
      'update_waitlist',
      'Scheduling',
      updated.id,
      `Waitlist entry for ${updated.patientName} updated: status=${updated.status}`,
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update waitlist entry' });
  }
});

// POST /auto-fill/:appointmentId — Find waitlist match for a cancelled slot
router.post('/auto-fill/:appointmentId', async (req: Request, res: Response) => {
  try {
    const result = await findWaitlistMatch(req.params.appointmentId);

    if (result.match) {
      await logActivity(
        'waitlist_match_found',
        'Scheduling',
        req.params.appointmentId,
        `Waitlist match found: ${result.match.patientName} for appointment ${req.params.appointmentId}`,
        { waitlistEntryId: result.match.id, candidateCount: result.candidates.length },
      );
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to find waitlist match' });
  }
});

// GET /templates — Schedule templates
router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = getScheduleTemplates();
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch schedule templates' });
  }
});

// GET /dashboard/:date — Scheduling dashboard stats
router.get('/dashboard/:date', async (req: Request, res: Response) => {
  try {
    const dashboard = await getSchedulingDashboard(req.params.date);
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scheduling dashboard' });
  }
});

export default router;
