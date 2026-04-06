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
import dashboardRouter from './routes/dashboard';
import activityRouter from './routes/activity';
import settingsRouter from './routes/settings';
import treatmentPlansRouter from './routes/treatmentPlans';
import reportsRouter from './routes/reports';
import communicationsRouter from './routes/communications';
import preauthRouter from './routes/preauth';
import paymentPlansRouter from './routes/paymentPlans';
import formsRouter from './routes/forms';
import followupsRouter from './routes/followups';
import referralsRouter from './routes/referrals';
import inventoryRouter from './routes/inventory';
import inventoryImportRouter from './routes/inventoryImport';
import perioRouter from './routes/perio';
import scoresRouter from './routes/scores';
import claimScrubberRouter from './routes/claimScrubber';
import churnRouter from './routes/churn';
import morningHuddleRouter from './routes/morningHuddle';
import nurtureRouter from './routes/nurture';
import feeScheduleRouter from './routes/feeSchedule';
import schedulingRouter from './routes/scheduling';
import procurementRouter from './routes/procurement';
import decisionSupportRouter from './routes/decisionSupport';
import complianceRouter from './routes/compliance';
import multiLocationRouter from './routes/multiLocation';

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
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/treatment-plans', treatmentPlansRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/communications', communicationsRouter);
app.use('/api/v1/preauth', preauthRouter);
app.use('/api/v1/payment-plans', paymentPlansRouter);
app.use('/api/v1/forms', formsRouter);
app.use('/api/v1/followups', followupsRouter);
app.use('/api/v1/referrals', referralsRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/inventory/import', inventoryImportRouter);
app.use('/api/v1/perio', perioRouter);
app.use('/api/v1/scores', scoresRouter);
app.use('/api/v1/claim-scrubber', claimScrubberRouter);
app.use('/api/v1/churn', churnRouter);
app.use('/api/v1/morning-huddle', morningHuddleRouter);
app.use('/api/v1/nurture', nurtureRouter);
app.use('/api/v1/fee-schedules', feeScheduleRouter);
app.use('/api/v1/scheduling', schedulingRouter);
app.use('/api/v1/procurement', procurementRouter);
app.use('/api/v1/decision-support', decisionSupportRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/multi-location', multiLocationRouter);

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
