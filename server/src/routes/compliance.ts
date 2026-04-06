import { Router, Request, Response } from 'express';
import { logActivity } from '../lib/activity';
import {
  getComplianceTasks,
  createTask,
  updateTask,
  completeTask,
  getTrainingRecords,
  addTrainingRecord,
  updateTrainingRecord,
  getExpiryAlerts,
  generateAuditReport,
  getAuditHistory,
  getComplianceDashboard,
  getComplianceScore,
} from '../lib/complianceEngine';
import type { ComplianceCategory, TaskStatus } from '../lib/complianceEngine';

const router = Router();

// ─── Tasks ───────────────────────────────────────────────────────────────────

// GET /tasks — All compliance tasks (?category=&status=)
router.get('/tasks', (_req: Request, res: Response) => {
  try {
    const category = _req.query.category as ComplianceCategory | undefined;
    const status = _req.query.status as TaskStatus | undefined;
    const tasks = getComplianceTasks({ category, status });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch compliance tasks' });
  }
});

// POST /tasks — Create task
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const task = createTask(req.body);

    await logActivity(
      'create_compliance_task',
      'ComplianceTask',
      task.id,
      `Compliance task "${task.title}" created in category ${task.category}`,
      { category: task.category, priority: task.priority },
    );

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create compliance task' });
  }
});

// PATCH /tasks/:id — Update task (complete, snooze, reassign)
router.patch('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const task = updateTask(req.params.id, req.body);
    if (!task) {
      res.status(404).json({ error: 'Compliance task not found' });
      return;
    }

    await logActivity(
      'update_compliance_task',
      'ComplianceTask',
      task.id,
      `Compliance task "${task.title}" updated`,
      { changes: Object.keys(req.body) },
    );

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update compliance task' });
  }
});

// PATCH /tasks/:id/complete — Mark completed
router.patch('/tasks/:id/complete', async (req: Request, res: Response) => {
  try {
    const { completionDate, evidenceNotes } = req.body;
    const dateStr = completionDate || new Date().toISOString().split('T')[0];

    const task = completeTask(req.params.id, dateStr, evidenceNotes);
    if (!task) {
      res.status(404).json({ error: 'Compliance task not found' });
      return;
    }

    await logActivity(
      'complete_compliance_task',
      'ComplianceTask',
      task.id,
      `Compliance task "${task.title}" marked completed on ${dateStr}`,
      { completionDate: dateStr, nextDue: task.nextDue },
    );

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete compliance task' });
  }
});

// ─── Training ────────────────────────────────────────────────────────────────

// GET /training — Training records (?staffName=)
router.get('/training', (_req: Request, res: Response) => {
  try {
    const staffName = _req.query.staffName as string | undefined;
    const records = getTrainingRecords({ staffName });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch training records' });
  }
});

// POST /training — Add training record
router.post('/training', async (req: Request, res: Response) => {
  try {
    const record = addTrainingRecord(req.body);

    await logActivity(
      'add_training_record',
      'TrainingRecord',
      record.id,
      `Training record added: ${record.staffName} — ${record.trainingType}`,
      { staffName: record.staffName, trainingType: record.trainingType },
    );

    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add training record' });
  }
});

// PATCH /training/:id — Update training record
router.patch('/training/:id', async (req: Request, res: Response) => {
  try {
    const record = updateTrainingRecord(req.params.id, req.body);
    if (!record) {
      res.status(404).json({ error: 'Training record not found' });
      return;
    }

    await logActivity(
      'update_training_record',
      'TrainingRecord',
      record.id,
      `Training record updated: ${record.staffName} — ${record.trainingType}`,
      { changes: Object.keys(req.body) },
    );

    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update training record' });
  }
});

// ─── Expiry Alerts ───────────────────────────────────────────────────────────

// GET /expiry-alerts — Upcoming expirations
router.get('/expiry-alerts', (_req: Request, res: Response) => {
  try {
    const alerts = getExpiryAlerts();
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch expiry alerts' });
  }
});

// ─── Audit Reports ───────────────────────────────────────────────────────────

// POST /audit/:type — Generate audit report
router.post('/audit/:type', async (req: Request, res: Response) => {
  try {
    const validTypes = ['hipaa', 'osha', 'infection_control', 'full'];
    if (!validTypes.includes(req.params.type)) {
      res.status(400).json({ error: `Invalid audit type. Must be one of: ${validTypes.join(', ')}` });
      return;
    }

    const report = generateAuditReport(req.params.type);

    await logActivity(
      'generate_audit_report',
      'AuditReport',
      report.id,
      `${req.params.type.toUpperCase()} audit report generated — Score: ${report.overallScore}%`,
      { type: req.params.type, score: report.overallScore },
    );

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate audit report' });
  }
});

// GET /audits — Past audits
router.get('/audits', (_req: Request, res: Response) => {
  try {
    const audits = getAuditHistory();
    res.json(audits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch audit history' });
  }
});

// ─── Dashboard & Score ───────────────────────────────────────────────────────

// GET /dashboard — Dashboard stats
router.get('/dashboard', (_req: Request, res: Response) => {
  try {
    const dashboard = getComplianceDashboard();
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch compliance dashboard' });
  }
});

// GET /score — Overall compliance score breakdown
router.get('/score', (_req: Request, res: Response) => {
  try {
    const score = getComplianceScore();
    res.json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch compliance score' });
  }
});

export default router;
