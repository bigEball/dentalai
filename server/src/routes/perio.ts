import { Router, Request, Response } from 'express';
import { prisma } from '../db/client';
import { logActivity } from '../lib/activity';

const router = Router();

// GET / - list perio exams
router.get('/', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.query;
    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId as string;

    const exams = await prisma.perioExam.findMany({
      where,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true, title: true } },
      },
      orderBy: { examDate: 'desc' },
    });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch perio exams' });
  }
});

// GET /patient/:patientId/compare - compare last 2 exams for a patient
router.get('/patient/:patientId/compare', async (req: Request, res: Response) => {
  try {
    const exams = await prisma.perioExam.findMany({
      where: { patientId: req.params.patientId },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { examDate: 'desc' },
      take: 2,
    });

    if (exams.length === 0) {
      res.status(404).json({ error: 'No perio exams found for this patient' });
      return;
    }

    // Parse JSON fields for comparison
    const parsed = exams.map((exam) => ({
      ...exam,
      pocketDepths: JSON.parse(exam.pocketDepths),
      recession: exam.recession ? JSON.parse(exam.recession) : null,
      bleeding: exam.bleeding ? JSON.parse(exam.bleeding) : null,
      furcation: exam.furcation ? JSON.parse(exam.furcation) : null,
      mobility: exam.mobility ? JSON.parse(exam.mobility) : null,
      plaque: exam.plaque ? JSON.parse(exam.plaque) : null,
    }));

    res.json({
      current: parsed[0],
      previous: parsed[1] ?? null,
      hasComparison: parsed.length === 2,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compare perio exams' });
  }
});

// GET /:id - single exam with parsed JSON fields
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const exam = await prisma.perioExam.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        provider: true,
      },
    });

    if (!exam) {
      res.status(404).json({ error: 'Perio exam not found' });
      return;
    }

    res.json({
      ...exam,
      pocketDepths: JSON.parse(exam.pocketDepths),
      recession: exam.recession ? JSON.parse(exam.recession) : null,
      bleeding: exam.bleeding ? JSON.parse(exam.bleeding) : null,
      furcation: exam.furcation ? JSON.parse(exam.furcation) : null,
      mobility: exam.mobility ? JSON.parse(exam.mobility) : null,
      plaque: exam.plaque ? JSON.parse(exam.plaque) : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch perio exam' });
  }
});

// POST / - create perio exam
router.post('/', async (req: Request, res: Response) => {
  try {
    const { pocketDepths, recession, bleeding, furcation, mobility, plaque, ...rest } = req.body;

    // Validate pocket depths JSON
    if (!pocketDepths) {
      res.status(400).json({ error: 'pocketDepths is required' });
      return;
    }

    let parsedDepths;
    try {
      parsedDepths = typeof pocketDepths === 'string' ? JSON.parse(pocketDepths) : pocketDepths;
    } catch {
      res.status(400).json({ error: 'pocketDepths must be valid JSON' });
      return;
    }

    const exam = await prisma.perioExam.create({
      data: {
        ...rest,
        pocketDepths: typeof pocketDepths === 'string' ? pocketDepths : JSON.stringify(pocketDepths),
        recession: recession ? (typeof recession === 'string' ? recession : JSON.stringify(recession)) : null,
        bleeding: bleeding ? (typeof bleeding === 'string' ? bleeding : JSON.stringify(bleeding)) : null,
        furcation: furcation ? (typeof furcation === 'string' ? furcation : JSON.stringify(furcation)) : null,
        mobility: mobility ? (typeof mobility === 'string' ? mobility : JSON.stringify(mobility)) : null,
        plaque: plaque ? (typeof plaque === 'string' ? plaque : JSON.stringify(plaque)) : null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        provider: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logActivity(
      'create_perio_exam',
      'PerioExam',
      exam.id,
      `Perio exam recorded for ${exam.patient.firstName} ${exam.patient.lastName} on ${exam.examDate}`,
      { examDate: exam.examDate, providerId: exam.providerId }
    );

    res.status(201).json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create perio exam' });
  }
});

export default router;
