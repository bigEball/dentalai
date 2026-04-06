import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';
import {
  scrubClaim,
  scrubAllPending,
  getPayerPatterns,
  getScrubStats,
  getAllResults,
  getResultByClaimId,
  getResultById,
  updateResultStatus,
} from '../lib/claimScrubber';

const router = Router();

// POST /scrub/:claimId — Run the scrubber on a single claim
router.post('/scrub/:claimId', async (req: Request, res: Response) => {
  try {
    const { claimId } = req.params;

    // Verify claim exists
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      select: { id: true, patientId: true, procedureCodes: true },
    });

    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }

    const result = await scrubClaim(claimId);

    await logActivity(
      'scrub_claim',
      'InsuranceClaim',
      claimId,
      `Claim scrubbed: ${result.issues.length} issue(s) found, risk score ${result.riskScore} (${result.riskLevel})`,
      {
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        issueCount: result.issues.length,
        procedureCodes: claim.procedureCodes,
      }
    );

    res.json(result);
  } catch (err) {
    console.error('[claim-scrubber] scrub error:', err);
    res.status(500).json({ error: 'Failed to scrub claim' });
  }
});

// POST /scrub-batch — Scrub all pending/draft claims
router.post('/scrub-batch', async (_req: Request, res: Response) => {
  try {
    const results = await scrubAllPending();

    const highRisk = results.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    await logActivity(
      'scrub_batch',
      'InsuranceClaim',
      'batch',
      `Batch scrub completed: ${results.length} claims analyzed, ${totalIssues} issues found, ${highRisk} high-risk`,
      {
        claimCount: results.length,
        totalIssues,
        highRiskCount: highRisk,
      }
    );

    res.json({
      scrubbed: results.length,
      totalIssues,
      highRiskCount: highRisk,
      results,
    });
  } catch (err) {
    console.error('[claim-scrubber] batch scrub error:', err);
    res.status(500).json({ error: 'Failed to run batch scrub' });
  }
});

// GET /results — List all scrub results with optional filters
router.get('/results', async (req: Request, res: Response) => {
  try {
    const { risk, status } = req.query;
    const results = getAllResults({
      risk: risk as string | undefined,
      status: status as string | undefined,
    });
    res.json(results);
  } catch (err) {
    console.error('[claim-scrubber] results error:', err);
    res.status(500).json({ error: 'Failed to fetch scrub results' });
  }
});

// GET /results/:claimId — Get scrub result for a specific claim
router.get('/results/:claimId', async (req: Request, res: Response) => {
  try {
    const result = getResultByClaimId(req.params.claimId);
    if (!result) {
      res.status(404).json({ error: 'No scrub result found for this claim' });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error('[claim-scrubber] result error:', err);
    res.status(500).json({ error: 'Failed to fetch scrub result' });
  }
});

// PATCH /results/:id/apply — Apply suggested fix (update claim narrative)
router.patch('/results/:id/apply', async (req: Request, res: Response) => {
  try {
    const result = getResultById(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Scrub result not found' });
      return;
    }

    // If there is a suggested narrative, apply it to the claim
    if (result.suggestedNarrative) {
      await prisma.insuranceClaim.update({
        where: { id: result.claimId },
        data: { narrative: result.suggestedNarrative },
      });
    }

    const updated = updateResultStatus(req.params.id, 'applied');

    await logActivity(
      'apply_scrub_fix',
      'InsuranceClaim',
      result.claimId,
      `Applied scrubber suggestions for claim ${result.claimId} — narrative updated, ${result.issues.length} issue(s) addressed`,
      {
        scrubResultId: result.id,
        riskScore: result.riskScore,
        issueCount: result.issues.length,
      }
    );

    res.json(updated);
  } catch (err) {
    console.error('[claim-scrubber] apply error:', err);
    res.status(500).json({ error: 'Failed to apply fix' });
  }
});

// PATCH /results/:id/dismiss — Dismiss suggestion
router.patch('/results/:id/dismiss', async (req: Request, res: Response) => {
  try {
    const result = getResultById(req.params.id);
    if (!result) {
      res.status(404).json({ error: 'Scrub result not found' });
      return;
    }

    const updated = updateResultStatus(req.params.id, 'dismissed');

    await logActivity(
      'dismiss_scrub_result',
      'InsuranceClaim',
      result.claimId,
      `Dismissed scrubber findings for claim ${result.claimId} (risk: ${result.riskLevel})`,
      {
        scrubResultId: result.id,
        riskScore: result.riskScore,
        issueCount: result.issues.length,
      }
    );

    res.json(updated);
  } catch (err) {
    console.error('[claim-scrubber] dismiss error:', err);
    res.status(500).json({ error: 'Failed to dismiss result' });
  }
});

// GET /payer-patterns — List all payer denial patterns
router.get('/payer-patterns', async (_req: Request, res: Response) => {
  try {
    const patterns = getPayerPatterns();
    res.json(patterns);
  } catch (err) {
    console.error('[claim-scrubber] payer-patterns error:', err);
    res.status(500).json({ error: 'Failed to fetch payer patterns' });
  }
});

// GET /stats — Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = getScrubStats();
    res.json(stats);
  } catch (err) {
    console.error('[claim-scrubber] stats error:', err);
    res.status(500).json({ error: 'Failed to fetch scrub stats' });
  }
});

export default router;
