import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import * as insuranceService from '../services/insuranceService';

const router = Router();

// ----------------------------------------------------------------
// Plans
// ----------------------------------------------------------------

// GET /insurance/plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await insuranceService.getPlans({
      patientId: req.query.patientId as string | undefined,
    });
    res.json(plans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch insurance plans' });
  }
});

// GET /insurance/plans/:id
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const plan = await insuranceService.getPlan(req.params.id);
    if (!plan) {
      res.status(404).json({ error: 'Insurance plan not found' });
      return;
    }
    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch insurance plan' });
  }
});

// POST /insurance/plans — create a new plan
router.post('/plans', async (req: Request, res: Response) => {
  try {
    const { patientId, provider, memberId, groupNumber, deductible, annualMax,
      coPayPreventive, coPayBasic, coPayMajor } = req.body;

    if (!patientId || !provider || !memberId || !groupNumber) {
      res.status(400).json({ error: 'patientId, provider, memberId, and groupNumber are required' });
      return;
    }

    const plan = await insuranceService.createPlan({
      patientId,
      provider,
      memberId,
      groupNumber,
      deductible: Number(deductible) || 0,
      annualMax: Number(annualMax) || 0,
      coPayPreventive: coPayPreventive != null ? Number(coPayPreventive) : undefined,
      coPayBasic: coPayBasic != null ? Number(coPayBasic) : undefined,
      coPayMajor: coPayMajor != null ? Number(coPayMajor) : undefined,
    });

    const planPatient = (plan as { patient?: { firstName?: string; lastName?: string } }).patient;
    await logActivity(
      'create_insurance_plan',
      'InsurancePlan',
      plan.id,
      `Insurance plan created: ${provider} for patient ${planPatient?.firstName ?? ''} ${planPatient?.lastName ?? ''}`,
      { provider, memberId }
    );

    res.status(201).json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create insurance plan' });
  }
});

// PATCH /insurance/plans/:id — update plan (whitelisted fields only)
router.patch('/plans/:id', async (req: Request, res: Response) => {
  try {
    const updated = await insuranceService.updatePlan(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update insurance plan' });
  }
});

// PATCH /insurance/plans/:id/verify
router.patch('/plans/:id/verify', async (req: Request, res: Response) => {
  try {
    const plan = await insuranceService.verifyPlan(req.params.id);

    await logActivity(
      'verify_insurance',
      'InsurancePlan',
      plan.id,
      `Insurance verified for ${(plan as any).patient?.firstName ?? ''} ${(plan as any).patient?.lastName ?? ''}`,
      { verifiedDate: (plan as any).verifiedDate }
    );

    res.json(plan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify insurance plan' });
  }
});

// ----------------------------------------------------------------
// Claims
// ----------------------------------------------------------------

// GET /insurance/claims
router.get('/claims', async (req: Request, res: Response) => {
  try {
    const claims = await insuranceService.getClaims({
      status: req.query.status as string | undefined,
      patientId: req.query.patientId as string | undefined,
    });
    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// GET /insurance/claims/:id
router.get('/claims/:id', async (req: Request, res: Response) => {
  try {
    const claim = await insuranceService.getClaim(req.params.id);
    if (!claim) {
      res.status(404).json({ error: 'Claim not found' });
      return;
    }
    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch claim' });
  }
});

// POST /insurance/claims — create a draft claim
router.post('/claims', async (req: Request, res: Response) => {
  try {
    const { patientId, insurancePlanId, appointmentId, procedureCodes, totalAmount, narrative } = req.body;

    if (!patientId || !insurancePlanId || !procedureCodes) {
      res.status(400).json({ error: 'patientId, insurancePlanId, and procedureCodes are required' });
      return;
    }

    const claim = await insuranceService.createClaim({
      patientId,
      insurancePlanId,
      appointmentId,
      procedureCodes,
      totalAmount: Number(totalAmount) || 0,
      narrative: narrative || '',
    });

    await logActivity(
      'create_claim',
      'InsuranceClaim',
      claim.id,
      `Claim created for ${(claim as any).patient?.firstName ?? ''} ${(claim as any).patient?.lastName ?? ''} — ${(claim as any).insurancePlan?.provider ?? ''}`,
      { totalAmount: claim.totalAmount }
    );

    res.status(201).json(claim);
  } catch (err: any) {
    console.error(err);
    const msg = err?.message?.includes('No appointment found') ? err.message : 'Failed to create claim';
    res.status(400).json({ error: msg });
  }
});

// PATCH /insurance/claims/:id — update claim fields
router.patch('/claims/:id', async (req: Request, res: Response) => {
  try {
    const updated = await insuranceService.updateClaim(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update claim' });
  }
});

// PATCH /insurance/claims/:id/submit
router.patch('/claims/:id/submit', async (req: Request, res: Response) => {
  try {
    const claim = await insuranceService.submitClaim(req.params.id);

    await logActivity(
      'submit_claim',
      'InsuranceClaim',
      claim.id,
      `Claim submitted for ${(claim as any).patient?.firstName ?? ''} ${(claim as any).patient?.lastName ?? ''} to ${(claim as any).insurancePlan?.provider ?? ''}`,
      { submittedDate: (claim as any).submittedDate, totalAmount: claim.totalAmount }
    );

    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit claim' });
  }
});

// POST /insurance/claims/generate — auto-generate from completed appointments
router.post('/claims/generate', async (req: Request, res: Response) => {
  try {
    const drafts = await insuranceService.generateClaimsFromAppointments();

    for (const claim of drafts) {
      await logActivity(
        'generate_claim',
        'InsuranceClaim',
        claim.id,
        `Auto-generated claim for ${(claim as any).patient?.firstName ?? ''} ${(claim as any).patient?.lastName ?? ''}`,
        { totalAmount: claim.totalAmount }
      );
    }

    res.json({ generated: drafts.length, claims: drafts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate claims' });
  }
});

export default router;
