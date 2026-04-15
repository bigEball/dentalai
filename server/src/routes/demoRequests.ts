import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

const router = Router();

const REQUESTS_PATH = resolve(__dirname, '..', '..', '..', 'data', 'demo-requests.json');

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  practice: string;
  phone: string;
  providers: string;
  source: string;
  message: string;
  submittedAt: string;
}

function loadRequests(): DemoRequest[] {
  try {
    if (!existsSync(REQUESTS_PATH)) return [];
    return JSON.parse(readFileSync(REQUESTS_PATH, 'utf-8')) as DemoRequest[];
  } catch {
    return [];
  }
}

function saveRequests(requests: DemoRequest[]): void {
  const dir = dirname(REQUESTS_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(REQUESTS_PATH, JSON.stringify(requests, null, 2), 'utf-8');
}

// POST /api/v1/demo-requests — submit a demo booking request
router.post('/', (req: Request, res: Response) => {
  const { name, email, practice, phone, providers, source, message } = req.body as Partial<DemoRequest>;

  if (!name || !email || !practice) {
    res.status(400).json({ error: 'name, email, and practice are required' });
    return;
  }

  const entry: DemoRequest = {
    id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    practice: String(practice).trim(),
    phone: phone ? String(phone).trim() : '',
    providers: providers ? String(providers) : '',
    source: source ? String(source) : '',
    message: message ? String(message).trim() : '',
    submittedAt: new Date().toISOString(),
  };

  const all = loadRequests();
  all.push(entry);
  saveRequests(all);

  console.log(`[demo-request] New request from ${entry.name} at ${entry.practice} <${entry.email}>`);

  res.status(201).json({ success: true, id: entry.id });
});

// GET /api/v1/demo-requests — list all requests (admin use)
router.get('/', (_req: Request, res: Response) => {
  res.json(loadRequests());
});

export default router;
