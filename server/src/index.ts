import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';

import patientsRouter from './routes/patients';
import appointmentsRouter from './routes/appointments';
import notesRouter from './routes/notes';
import insuranceRouter from './routes/insurance';
import claimsRouter from './routes/claims';
import billingRouter from './routes/billing';
import recallRouter from './routes/recall';
import radiographsRouter from './routes/radiographs';
import dashboardRouter from './routes/dashboard';
import activityRouter from './routes/activity';
import settingsRouter from './routes/settings';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// Serve uploaded files statically
const uploadsPath = path.resolve(__dirname, '../../data/uploads');
app.use('/uploads', express.static(uploadsPath));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
}

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/appointments', appointmentsRouter);
app.use('/api/v1/notes', notesRouter);
app.use('/api/v1/insurance', insuranceRouter);
app.use('/api/v1/claims', claimsRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/recall', recallRouter);
app.use('/api/v1/radiographs', radiographsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/settings', settingsRouter);

// SPA fallback — serve index.html for non-API routes in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../../client/dist');
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// 404 handler (API routes only in production)
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[error]', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Smart Dental AI server running on http://localhost:${PORT}`);
});

export default app;
