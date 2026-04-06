import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  analyzePatient,
  analyzeAllPatients,
  getRecommendation,
  getAllRecommendations,
  updateRecommendationStatus,
  getDashboardStats,
} from '../lib/decisionSupport';
import type { RecommendationCategory, RecommendationPriority, RecommendationStatus } from '../lib/decisionSupport';

const router = Router();

// ─── GET /recommendations — list all active recommendations ──────────────────
router.get('/recommendations', (req: Request, res: Response) => {
  try {
    const { patientId, category, priority, status } = req.query;

    const recs = getAllRecommendations({
      patientId: patientId as string | undefined,
      category: category as RecommendationCategory | undefined,
      priority: priority as RecommendationPriority | undefined,
      status: status as RecommendationStatus | undefined,
    });

    res.json(recs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// ─── GET /recommendations/:id — single recommendation ────────────────────────
router.get('/recommendations/:id', (req: Request, res: Response) => {
  try {
    const rec = getRecommendation(req.params.id);
    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }
    res.json(rec);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recommendation' });
  }
});

// ─── POST /analyze/:patientId — analyze a single patient ─────────────────────
router.post('/analyze/:patientId', async (req: Request, res: Response) => {
  try {
    const recs = await analyzePatient(req.params.patientId);

    await logActivity(
      'analyze_patient_decisions',
      'DecisionSupport',
      req.params.patientId,
      `Clinical decision analysis completed — ${recs.length} recommendation(s) generated`,
      { recommendationCount: recs.length, patientId: req.params.patientId }
    );

    res.json({ patientId: req.params.patientId, recommendations: recs, count: recs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze patient' });
  }
});

// ─── POST /analyze-all — analyze all patients ────────────────────────────────
router.post('/analyze-all', async (_req: Request, res: Response) => {
  try {
    const recs = await analyzeAllPatients();

    await logActivity(
      'analyze_all_decisions',
      'DecisionSupport',
      'all',
      `Full clinical decision analysis completed — ${recs.length} actionable recommendation(s) across all patients`,
      { totalRecommendations: recs.length }
    );

    res.json({ recommendations: recs, count: recs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze all patients' });
  }
});

// ─── PATCH /recommendations/:id — update status (accept/dismiss) ─────────────
router.patch('/recommendations/:id', async (req: Request, res: Response) => {
  try {
    const { status, dismissReason } = req.body;

    if (!status || !['new', 'reviewed', 'accepted', 'dismissed'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be one of: new, reviewed, accepted, dismissed' });
      return;
    }

    const rec = updateRecommendationStatus(req.params.id, status as RecommendationStatus, dismissReason);
    if (!rec) {
      res.status(404).json({ error: 'Recommendation not found' });
      return;
    }

    await logActivity(
      `${status}_recommendation`,
      'DecisionSupport',
      rec.id,
      `Recommendation "${rec.title}" ${status}${dismissReason ? ` — Reason: ${dismissReason}` : ''}`,
      { patientId: rec.patientId, category: rec.category, priority: rec.priority, status }
    );

    res.json(rec);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update recommendation' });
  }
});

// ─── GET /dashboard — aggregate stats ────────────────────────────────────────
router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
