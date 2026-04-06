import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  getFeeSchedules,
  createFeeSchedule,
  getFeeSchedule,
  updateFeeEntry,
  analyzeFees,
  generateOptimizationReport,
  getWriteOffAnalysis,
  generateRenegotiationBrief,
  getReports,
} from '../lib/feeOptimizer';

const router = Router();

// GET /reports — List optimization reports (defined before /:id to avoid route conflict)
router.get('/reports', (_req: Request, res: Response) => {
  try {
    const reports = getReports();
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /write-off-analysis — Write-offs by procedure and payer
router.get('/write-off-analysis', (_req: Request, res: Response) => {
  try {
    const analysis = getWriteOffAnalysis();
    res.json(analysis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate write-off analysis' });
  }
});

// GET / — List all fee schedules
router.get('/', (_req: Request, res: Response) => {
  try {
    const schedules = getFeeSchedules();
    res.json(schedules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fee schedules' });
  }
});

// POST / — Create a new fee schedule
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, type, payerName, effectiveDate, entries } = req.body;

    if (!name || !type) {
      res.status(400).json({ error: 'name and type are required' });
      return;
    }

    const schedule = createFeeSchedule({ name, type, payerName, effectiveDate, entries });
    res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create fee schedule' });
  }
});

// GET /:id — Single schedule with entries
router.get('/:id', (req: Request, res: Response) => {
  try {
    const schedule = getFeeSchedule(req.params.id);

    if (!schedule) {
      res.status(404).json({ error: 'Fee schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch fee schedule' });
  }
});

// PATCH /:id/entries/:entryId — Update a fee entry
router.patch('/:id/entries/:entryId', (req: Request, res: Response) => {
  try {
    const { feeAmount, ppoAllowedFee, annualVolume } = req.body;

    const entry = updateFeeEntry(req.params.id, req.params.entryId, {
      feeAmount,
      ppoAllowedFee,
      annualVolume,
    });

    if (!entry) {
      res.status(404).json({ error: 'Fee schedule or entry not found' });
      return;
    }

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update fee entry' });
  }
});

// POST /:id/analyze — Run UCR analysis on all entries
router.post('/:id/analyze', (req: Request, res: Response) => {
  try {
    const schedule = analyzeFees(req.params.id);

    if (!schedule) {
      res.status(404).json({ error: 'Fee schedule not found' });
      return;
    }

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze fees' });
  }
});

// POST /:id/optimize — Generate optimization report
router.post('/:id/optimize', (req: Request, res: Response) => {
  try {
    const report = generateOptimizationReport(req.params.id);

    if (!report) {
      res.status(404).json({ error: 'Fee schedule not found' });
      return;
    }

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate optimization report' });
  }
});

// POST /:id/renegotiation-brief — Generate renegotiation brief
router.post('/:id/renegotiation-brief', (req: Request, res: Response) => {
  try {
    const brief = generateRenegotiationBrief(req.params.id);

    if (!brief) {
      res.status(404).json({ error: 'Fee schedule not found' });
      return;
    }

    res.json(brief);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate renegotiation brief' });
  }
});

export default router;
