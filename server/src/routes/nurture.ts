import { Router, Request, Response } from 'express';
import {
  startSequence,
  getSequences,
  getSequence,
  sendNextTouch,
  recordResponse,
  pauseSequence,
  resumeSequence,
  getNurtureDashboard,
  getNurtureFunnel,
} from '../lib/nurtureEngine';

const router = Router();

// POST /start/:treatmentPlanId — Start nurture sequence for a treatment plan
router.post('/start/:treatmentPlanId', async (req: Request, res: Response) => {
  try {
    const sequence = await startSequence(req.params.treatmentPlanId);
    res.status(201).json(sequence);
  } catch (err: any) {
    const message = err?.message ?? 'Failed to start nurture sequence';
    const status = message.includes('not found')
      ? 404
      : message.includes('already exists')
        ? 409
        : 500;
    console.error('[nurture] start error:', message);
    res.status(status).json({ error: message });
  }
});

// GET /sequences — List all sequences with optional filters
router.get('/sequences', async (req: Request, res: Response) => {
  try {
    const { status, patientId } = req.query;
    const filters: { status?: string; patientId?: string } = {};
    if (status) filters.status = status as string;
    if (patientId) filters.patientId = patientId as string;

    const seqs = await getSequences(filters);
    res.json(seqs);
  } catch (err) {
    console.error('[nurture] list error:', err);
    res.status(500).json({ error: 'Failed to fetch nurture sequences' });
  }
});

// GET /sequences/:id — Single sequence with touches
router.get('/sequences/:id', async (req: Request, res: Response) => {
  try {
    const seq = await getSequence(req.params.id);
    if (!seq) {
      res.status(404).json({ error: 'Sequence not found' });
      return;
    }
    res.json(seq);
  } catch (err) {
    console.error('[nurture] get error:', err);
    res.status(500).json({ error: 'Failed to fetch nurture sequence' });
  }
});

// PATCH /sequences/:id/pause — Pause a sequence
router.patch('/sequences/:id/pause', async (req: Request, res: Response) => {
  try {
    const seq = await pauseSequence(req.params.id);
    res.json(seq);
  } catch (err: any) {
    const message = err?.message ?? 'Failed to pause sequence';
    const status = message.includes('not found') ? 404 : 400;
    console.error('[nurture] pause error:', message);
    res.status(status).json({ error: message });
  }
});

// PATCH /sequences/:id/resume — Resume a paused sequence
router.patch('/sequences/:id/resume', async (req: Request, res: Response) => {
  try {
    const seq = await resumeSequence(req.params.id);
    res.json(seq);
  } catch (err: any) {
    const message = err?.message ?? 'Failed to resume sequence';
    const status = message.includes('not found') ? 404 : 400;
    console.error('[nurture] resume error:', message);
    res.status(status).json({ error: message });
  }
});

// POST /sequences/:id/send-next — Send the next scheduled touch
router.post('/sequences/:id/send-next', async (req: Request, res: Response) => {
  try {
    const touch = await sendNextTouch(req.params.id);
    res.json(touch);
  } catch (err: any) {
    const message = err?.message ?? 'Failed to send next touch';
    const status = message.includes('not found')
      ? 404
      : message.includes('not active') || message.includes('No more')
        ? 400
        : 500;
    console.error('[nurture] send-next error:', message);
    res.status(status).json({ error: message });
  }
});

// PATCH /touches/:id/respond — Record a patient response
router.patch('/touches/:id/respond', async (req: Request, res: Response) => {
  try {
    const { response } = req.body;
    if (!response || typeof response !== 'string') {
      res.status(400).json({ error: 'Response text is required' });
      return;
    }
    const touch = await recordResponse(req.params.id, response);
    res.json(touch);
  } catch (err: any) {
    const message = err?.message ?? 'Failed to record response';
    const status = message.includes('not found') ? 404 : 500;
    console.error('[nurture] respond error:', message);
    res.status(status).json({ error: message });
  }
});

// GET /dashboard — Conversion stats
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const dashboard = await getNurtureDashboard();
    res.json(dashboard);
  } catch (err) {
    console.error('[nurture] dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch nurture dashboard' });
  }
});

// GET /funnel — Funnel data
router.get('/funnel', async (_req: Request, res: Response) => {
  try {
    const funnel = await getNurtureFunnel();
    res.json(funnel);
  } catch (err) {
    console.error('[nurture] funnel error:', err);
    res.status(500).json({ error: 'Failed to fetch nurture funnel' });
  }
});

export default router;
