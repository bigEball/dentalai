import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  calculateChurnProfile,
  calculateAllProfiles,
  getChurnDashboard,
  generateRetentionActions,
  getRetentionActions,
  updateRetentionAction,
  getCachedProfiles,
  getCachedProfile,
} from '../lib/churnEngine';
import type { RetentionActionStatus } from '../lib/churnEngine';

const router = Router();

// GET /profiles — All patient churn profiles, sortable
router.get('/profiles', async (req: Request, res: Response) => {
  try {
    let profiles = getCachedProfiles();

    // If no cached profiles, calculate them
    if (profiles.length === 0) {
      profiles = await calculateAllProfiles();
    }

    // Sorting
    const sort = (req.query.sort as string) || 'retentionPriority';
    const order = (req.query.order as string) || 'desc';
    const tier = req.query.tier as string;

    // Filter by tier if specified
    if (tier) {
      profiles = profiles.filter((p) => p.churnRiskTier === tier);
    }

    // Sort
    const validSortFields = [
      'churnProbability',
      'lifetimeValue',
      'annualValue',
      'retentionPriority',
      'daysSinceLastVisit',
      'patientName',
    ];

    if (validSortFields.includes(sort)) {
      profiles = [...profiles].sort((a, b) => {
        const aVal = a[sort as keyof typeof a];
        const bVal = b[sort as keyof typeof b];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return order === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return order === 'asc' ? aNum - bNum : bNum - aNum;
      });
    }

    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch churn profiles' });
  }
});

// GET /profiles/:patientId — Single patient profile
router.get('/profiles/:patientId', async (req: Request, res: Response) => {
  try {
    let profile = getCachedProfile(req.params.patientId);

    if (!profile) {
      profile = await calculateChurnProfile(req.params.patientId);
    }

    res.json(profile);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch churn profile' });
  }
});

// POST /calculate — Recalculate all profiles
router.post('/calculate', async (_req: Request, res: Response) => {
  try {
    const profiles = await calculateAllProfiles();

    await logActivity(
      'recalculate_churn',
      'ChurnEngine',
      'all',
      `Recalculated churn profiles for ${profiles.length} patients`,
      { patientCount: profiles.length },
    );

    res.json({
      message: `Calculated churn profiles for ${profiles.length} patients`,
      count: profiles.length,
      profiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate churn profiles' });
  }
});

// POST /calculate/:patientId — Recalculate single patient
router.post('/calculate/:patientId', async (req: Request, res: Response) => {
  try {
    const profile = await calculateChurnProfile(req.params.patientId);

    await logActivity(
      'recalculate_churn',
      'ChurnEngine',
      req.params.patientId,
      `Recalculated churn profile for ${profile.patientName}: ${profile.churnRiskTier} risk (${(profile.churnProbability * 100).toFixed(1)}%)`,
      { churnProbability: profile.churnProbability, tier: profile.churnRiskTier },
    );

    res.json(profile);
  } catch (err: any) {
    if (err?.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to calculate churn profile' });
  }
});

// GET /dashboard — Aggregated churn stats
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const dashboard = await getChurnDashboard();
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch churn dashboard' });
  }
});

// GET /retention-actions — List pending retention actions
router.get('/retention-actions', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as RetentionActionStatus | undefined;
    const actions = getRetentionActions(status);
    res.json(actions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch retention actions' });
  }
});

// PATCH /retention-actions/:id — Update an action
router.patch('/retention-actions/:id', async (req: Request, res: Response) => {
  try {
    const { status, outcome, notes } = req.body;
    const action = updateRetentionAction(req.params.id, { status, outcome, notes });

    if (!action) {
      res.status(404).json({ error: 'Retention action not found' });
      return;
    }

    await logActivity(
      'update_retention_action',
      'RetentionAction',
      action.id,
      `Updated retention action for ${action.patientName}: ${action.actionType} -> ${action.status}`,
      { actionType: action.actionType, status: action.status, outcome },
    );

    res.json(action);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update retention action' });
  }
});

// POST /retention-actions/auto-generate — Generate actions for high-risk patients
router.post('/retention-actions/auto-generate', async (_req: Request, res: Response) => {
  try {
    let profiles = getCachedProfiles();

    if (profiles.length === 0) {
      profiles = await calculateAllProfiles();
    }

    // Generate for moderate, high, and critical risk patients
    const atRiskProfiles = profiles.filter(
      (p) => p.churnRiskTier === 'moderate' || p.churnRiskTier === 'high' || p.churnRiskTier === 'critical',
    );

    const allActions = [];
    for (const profile of atRiskProfiles) {
      const actions = await generateRetentionActions(profile.patientId);
      allActions.push(...actions);
    }

    await logActivity(
      'auto_generate_retention_actions',
      'ChurnEngine',
      'all',
      `Auto-generated ${allActions.length} retention actions for ${atRiskProfiles.length} at-risk patients`,
      { actionCount: allActions.length, patientCount: atRiskProfiles.length },
    );

    res.json({
      message: `Generated ${allActions.length} retention actions for ${atRiskProfiles.length} at-risk patients`,
      actionCount: allActions.length,
      actions: allActions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate retention actions' });
  }
});

export default router;
