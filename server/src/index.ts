import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { clientDistDir, uploadsDir } from './core/paths';

import patientsRouter from './api/routes/patients';
import appointmentsRouter from './api/routes/appointments';
import notesRouter from './api/routes/notes';
import insuranceRouter from './api/routes/insurance';
import claimsRouter from './api/routes/claims';
import billingRouter from './api/routes/billing';
import recallRouter from './api/routes/recall';
import dashboardRouter from './api/routes/dashboard';
import activityRouter from './api/routes/activity';
import settingsRouter from './api/routes/settings';
import treatmentPlansRouter from './api/routes/treatmentPlans';
import reportsRouter from './api/routes/reports';
import communicationsRouter from './api/routes/communications';
import preauthRouter from './api/routes/preauth';
import paymentPlansRouter from './api/routes/paymentPlans';
import formsRouter from './api/routes/forms';
import followupsRouter from './api/routes/followups';
import referralsRouter from './api/routes/referrals';
import inventoryRouter from './api/routes/inventory';
import inventoryImportRouter from './api/routes/inventoryImport';
import perioRouter from './api/routes/perio';
import scoresRouter from './api/routes/scores';
import claimScrubberRouter from './api/routes/claimScrubber';
import churnRouter from './api/routes/churn';
import morningHuddleRouter from './api/routes/morningHuddle';
import nurtureRouter from './api/routes/nurture';
import feeScheduleRouter from './api/routes/feeSchedule';
import schedulingRouter from './api/routes/scheduling';
import procurementRouter from './api/routes/procurement';
import decisionSupportRouter from './api/routes/decisionSupport';
import complianceRouter from './api/routes/compliance';
import multiLocationRouter from './api/routes/multiLocation';
import demoRequestsRouter from './api/routes/demoRequests';

const app = express();
const PORT = process.env.PORT ?? 3001;
const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        configuredOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && devOriginPattern.test(origin));

      callback(isAllowed ? null : new Error(`CORS blocked origin ${origin}`), isAllowed);
    },
    credentials: true,
  })
);
app.use(express.json());

// Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Serve client build in production
if (process.env.NODE_ENV === 'production') {
  // `redirect: false` because the public pages are prerendered to directories
  // — dist/about/index.html and so on. Left at its default, express.static
  // answers /about with a 301 to /about/, which is a different URL from the
  // canonical the page itself declares, so every marketing page would advertise
  // one address and redirect to another.
  app.use(express.static(clientDistDir, { redirect: false }));
}

// Request logger (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

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
app.use('/api/v1/demo-requests', demoRequestsRouter);

// SPA fallback for anything the static middleware above did not answer
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    // Don't intercept API calls — let them fall through to 404
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // A public page has a prerendered file and was already served. What reaches
    // here is /login and the application routes, which get the empty shell:
    // index.html now holds the rendered landing page, and serving that to the
    // dashboard would make React hydrate one tree against the markup of
    // another. app.html is the same document with an empty root and a noindex.
    res.sendFile(path.join(clientDistDir, 'app.html'), (err) => {
      // Falls back to index.html if the client was built before app.html
      // existed, so a stale dist still boots rather than 500s.
      if (err) res.sendFile(path.join(clientDistDir, 'index.html'));
    });
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
  console.log(`Summit Tech server running on http://localhost:${PORT}`);
});

export default app;
