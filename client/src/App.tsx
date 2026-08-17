import React, { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { isRouteAllowed, resolveRole } from '@/lib/roles';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // A failed dynamic import is not a broken session — it is usually a stale
      // tab whose chunk hashes no longer exist after a deploy. Clearing storage
      // would not fix it and would sign the user out for nothing; reloading does.
      const isStaleChunk = /dynamically imported module|Importing a module script failed|Loading chunk/i.test(
        this.state.error?.message ?? '',
      );

      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>
            {isStaleChunk ? 'This page needs a refresh' : 'Something went wrong'}
          </h1>
          <p style={{ color: '#666', marginBottom: 16 }}>
            {isStaleChunk
              ? 'A newer version of the site is available.'
              : this.state.error?.message}
          </p>
          <button
            onClick={() => {
              if (isStaleChunk) {
                window.location.reload();
                return;
              }
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{
              padding: '10px 24px', background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}
          >
            {isStaleChunk ? 'Reload' : 'Clear session & reload'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Shown while a lazy route chunk is in flight. Deliberately blank rather than a
 * spinner: on a warm cache the chunk resolves in a frame or two, and a spinner
 * that flashes for 30ms reads as jank.
 */
function RouteFallback() {
  return <div style={{ minHeight: '100vh', background: '#eef2f8' }} />;
}
/* Eager: everything a first-time visitor can land on. The marketing pages and
   the sign-in are the public surface, and they are small — the landing page
   should paint without waiting on a second network round trip. */
import LandingPage from '@/features/landing/LandingPage';
import { useSeo } from '@/features/landing/useSeo';
import AboutPage from '@/features/landing/pages/AboutPage';
import ServicesPage from '@/features/landing/pages/ServicesPage';
import ContactPage from '@/features/landing/pages/ContactPage';
import ThankYouPage from '@/features/landing/pages/ThankYouPage';
import PrivacyPage from '@/features/landing/pages/PrivacyPage';
import TermsPage from '@/features/landing/pages/TermsPage';
import AccessibilityPage from '@/features/landing/pages/AccessibilityPage';
import LoginPage from '@/features/auth/LoginPage';
import AccessDeniedPage from '@/features/auth/AccessDeniedPage';

/* Lazy: the application behind the sign-in. Twenty-six feature screens and the
   charting library they share are about a megabyte of JavaScript, and none of
   it is reachable — or useful — until someone has signed in. Loaded eagerly it
   was landing on every visitor to the marketing page before the hero painted. */
const AppLayout = lazy(() => import('@/layouts/AppLayout'));
const DashboardPage = lazy(() => import('@/features/dashboard/Page'));
const PatientsPage = lazy(() => import('@/features/patients/Page'));
const AINotesPage = lazy(() => import('@/features/notes/Page'));
const InsurancePage = lazy(() => import('@/features/insurance/Page'));
const BillingPage = lazy(() => import('@/features/billing/Page'));
const RecallPage = lazy(() => import('@/features/recall/Page'));
const SettingsPage = lazy(() => import('@/features/settings/Page'));
const TreatmentPlansPage = lazy(() => import('@/features/treatment-plans/Page'));
const ReportsPage = lazy(() => import('@/features/reports/Page'));
const CommunicationsPage = lazy(() => import('@/features/communications/Page'));
const PreauthPage = lazy(() => import('@/features/preauth/Page'));
const PaymentPlansPage = lazy(() => import('@/features/payment-plans/Page'));
const FormsPage = lazy(() => import('@/features/forms/Page'));
const FollowUpsPage = lazy(() => import('@/features/follow-ups/Page'));
const ReferralsPage = lazy(() => import('@/features/referrals/Page'));
const InventoryPage = lazy(() => import('@/features/inventory/Page'));
const PerioChartPage = lazy(() => import('@/features/perio/Page'));
const PatientScoresPage = lazy(() => import('@/features/patient-scores/Page'));
const ToolsPage = lazy(() => import('@/features/tools/Page'));
const ClaimScrubberPage = lazy(() => import('@/features/claim-scrubber/Page'));
const ChurnPredictionPage = lazy(() => import('@/features/patient-retention/Page'));
const MorningHuddlePage = lazy(() => import('@/features/morning-huddle/Page'));
const NurtureSequencesPage = lazy(() => import('@/features/nurture-sequences/Page'));
const FeeSchedulePage = lazy(() => import('@/features/fee-optimizer/Page'));
const SchedulingPage = lazy(() => import('@/features/smart-scheduling/Page'));
const ProcurementPage = lazy(() => import('@/features/procurement/Page'));
const ClinicalDecisionSupportPage = lazy(() => import('@/features/decision-support/Page'));
const ComplianceAutopilotPage = lazy(() => import('@/features/compliance/Page'));
const AIAssistantPage = lazy(() => import('@/features/ai-assistant/Page'));

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function HomeRoute() {
  const navigate = useNavigate();
  // The landing page builds its own chrome instead of sitting in `PageShell`,
  // so it asks for its head entries directly.
  useSeo();
  return (
    <LandingPage
      demoHref="/login"
      onDemoClick={(e) => {
        e.preventDefault();
        navigate('/login');
      }}
      onNavigate={(to, event) => {
        event.preventDefault();
        navigate(to);
      }}
    />
  );
}

function RequireRole({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = resolveRole(user?.role);
  const path = '/' + location.pathname.split('/')[1];

  if (!isRouteAllowed(role, path)) {
    return <AccessDeniedPage />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Marketing and legal pages. Every link in the site footer resolves
          here — a dead Privacy Policy link fails an A2P SMS registration. */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/accessibility" element={<AccessibilityPage />} />
      {/* The live site published its demo entry point at /demo/login. */}
      <Route path="/demo/login" element={<Navigate to="/login" replace />} />
      <Route
        path="/ai-assistant-preview"
        element={
          <div className="min-h-screen bg-gray-50 px-5 py-8 sm:px-8">
            <AIAssistantPage />
          </div>
        }
      />
      <Route path="/ai-assistant" element={<Navigate to="/ai-assistant-preview" replace />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="dashboard" element={<RequireRole><DashboardPage /></RequireRole>} />
        <Route path="patients" element={<RequireRole><PatientsPage /></RequireRole>} />
        <Route path="notes" element={<RequireRole><AINotesPage /></RequireRole>} />
        <Route path="insurance" element={<RequireRole><InsurancePage /></RequireRole>} />
        <Route path="billing" element={<RequireRole><BillingPage /></RequireRole>} />
        <Route path="recall" element={<RequireRole><RecallPage /></RequireRole>} />
        <Route path="treatment-plans" element={<RequireRole><TreatmentPlansPage /></RequireRole>} />
        <Route path="reports" element={<RequireRole><ReportsPage /></RequireRole>} />
        <Route path="communications" element={<RequireRole><CommunicationsPage /></RequireRole>} />
        <Route path="preauth" element={<RequireRole><PreauthPage /></RequireRole>} />
        <Route path="payment-plans" element={<RequireRole><PaymentPlansPage /></RequireRole>} />
        <Route path="forms" element={<RequireRole><FormsPage /></RequireRole>} />
        <Route path="follow-ups" element={<RequireRole><FollowUpsPage /></RequireRole>} />
        <Route path="referrals" element={<RequireRole><ReferralsPage /></RequireRole>} />
        <Route path="inventory" element={<RequireRole><InventoryPage /></RequireRole>} />
        <Route path="perio" element={<RequireRole><PerioChartPage /></RequireRole>} />
        <Route path="patient-scores" element={<RequireRole><PatientScoresPage /></RequireRole>} />
        <Route path="claim-scrubber" element={<RequireRole><ClaimScrubberPage /></RequireRole>} />
        <Route path="patient-retention" element={<RequireRole><ChurnPredictionPage /></RequireRole>} />
        <Route path="morning-huddle" element={<RequireRole><MorningHuddlePage /></RequireRole>} />
        <Route path="nurture-sequences" element={<RequireRole><NurtureSequencesPage /></RequireRole>} />
        <Route path="fee-optimizer" element={<RequireRole><FeeSchedulePage /></RequireRole>} />
        <Route path="smart-scheduling" element={<RequireRole><SchedulingPage /></RequireRole>} />
        <Route path="procurement" element={<RequireRole><ProcurementPage /></RequireRole>} />
        <Route path="decision-support" element={<RequireRole><ClinicalDecisionSupportPage /></RequireRole>} />
        <Route path="compliance" element={<RequireRole><ComplianceAutopilotPage /></RequireRole>} />
        <Route path="tools" element={<RequireRole><ToolsPage /></RequireRole>} />
        <Route path="settings" element={<RequireRole><SettingsPage /></RequireRole>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  );
}
