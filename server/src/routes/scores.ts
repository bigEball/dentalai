import { Router, Request, Response } from 'express';
import { scorePatient, scoreAllPatients, getPatientAlerts } from '../lib/patientScoring';

const router = Router();

// GET / — all patients ranked by composite score
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scores = await scoreAllPatients();
    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate patient scores' });
  }
});

// GET /alerts — patients with actionable alerts, sorted by severity
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await getPatientAlerts();
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch patient alerts' });
  }
});

// GET /:patientId — scores for a single patient
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const scores = await scorePatient(req.params.patientId);
    res.json(scores);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate patient scores' });
  }
});

export default router;
