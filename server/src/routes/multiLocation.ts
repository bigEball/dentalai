import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  getLocations,
  getLocationById,
  getLocationKPIs,
  getAllLocationKPIs,
  getComparison,
  getRootCauseAnalysis,
  getGroupReport,
  getDashboard,
  getTrends,
} from '../lib/multiLocation';

const router = Router();

// GET /dashboard — Multi-location dashboard stats
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const dashboard = getDashboard();

    await logActivity(
      'view_multi_location_dashboard',
      'MultiLocation',
      'all',
      'Viewed multi-location dashboard'
    );

    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load multi-location dashboard' });
  }
});

// GET /kpis — All location KPIs side by side
router.get('/kpis', async (_req: Request, res: Response) => {
  try {
    const kpis = getAllLocationKPIs();
    res.json(kpis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load KPIs' });
  }
});

// GET /comparison — Cross-location benchmarking with rankings
router.get('/comparison', async (_req: Request, res: Response) => {
  try {
    const comparison = getComparison();

    await logActivity(
      'view_location_comparison',
      'MultiLocation',
      'all',
      'Viewed cross-location benchmarking comparison'
    );

    res.json(comparison);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load comparison data' });
  }
});

// GET /group-report — Consolidated group report
router.get('/group-report', async (_req: Request, res: Response) => {
  try {
    const report = getGroupReport();

    await logActivity(
      'view_group_report',
      'MultiLocation',
      'all',
      'Generated consolidated group report'
    );

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate group report' });
  }
});

// GET /trends — KPI trends over 6 months for all locations
router.get('/trends', async (_req: Request, res: Response) => {
  try {
    const trends = getTrends();
    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load trend data' });
  }
});

// GET /locations — All locations
router.get('/locations', async (_req: Request, res: Response) => {
  try {
    const locs = getLocations();
    res.json(locs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load locations' });
  }
});

// GET /locations/:id — Single location
router.get('/locations/:id', async (req: Request, res: Response) => {
  try {
    const loc = getLocationById(req.params.id);
    if (!loc) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }
    res.json(loc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load location' });
  }
});

// GET /locations/:id/kpis — KPIs for one location
router.get('/locations/:id/kpis', async (req: Request, res: Response) => {
  try {
    const kpis = getLocationKPIs(req.params.id);
    if (!kpis) {
      res.status(404).json({ error: 'Location KPIs not found' });
      return;
    }
    res.json(kpis);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load location KPIs' });
  }
});

// GET /locations/:id/root-cause — Root cause analysis for a location
router.get('/locations/:id/root-cause', async (req: Request, res: Response) => {
  try {
    const loc = getLocationById(req.params.id);
    if (!loc) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const insights = getRootCauseAnalysis(req.params.id);

    await logActivity(
      'run_root_cause_analysis',
      'MultiLocation',
      req.params.id,
      `Root cause analysis run for ${loc.name}`,
      { locationId: req.params.id, insightCount: insights.length }
    );

    res.json({ location: loc, insights });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to run root cause analysis' });
  }
});

export default router;
