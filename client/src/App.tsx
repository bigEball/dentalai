import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
      return (
        <div style={{ padding: 40, fontFamily: 'system-ui', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>{this.state.error?.message}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            style={{
              padding: '10px 24px', background: '#4f46e5', color: '#fff',
              border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
            }}
          >
            Clear session &amp; reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import AppLayout from '@/layouts/AppLayout';
import LandingPage from '@/features/landing/Page';
import LoginPage from '@/features/auth/LoginPage';
import AccessDeniedPage from '@/features/auth/AccessDeniedPage';
import DashboardPage from '@/features/dashboard/Page';
import PatientsPage from '@/features/patients/Page';
import AINotesPage from '@/features/notes/Page';
import InsurancePage from '@/features/insurance/Page';
import BillingPage from '@/features/billing/Page';
import RecallPage from '@/features/recall/Page';
import SettingsPage from '@/features/settings/Page';
import TreatmentPlansPage from '@/features/treatment-plans/Page';
import ReportsPage from '@/features/reports/Page';
import CommunicationsPage from '@/features/communications/Page';
import PreauthPage from '@/features/preauth/Page';
import PaymentPlansPage from '@/features/payment-plans/Page';
import FormsPage from '@/features/forms/Page';
import FollowUpsPage from '@/features/follow-ups/Page';
import ReferralsPage from '@/features/referrals/Page';
import InventoryPage from '@/features/inventory/Page';
import PerioChartPage from '@/features/perio/Page';
import PatientScoresPage from '@/features/patient-scores/Page';
import ToolsPage from '@/features/tools/Page';
import ClaimScrubberPage from '@/features/claim-scrubber/Page';
import ChurnPredictionPage from '@/features/patient-retention/Page';
import MorningHuddlePage from '@/features/morning-huddle/Page';
import NurtureSequencesPage from '@/features/nurture-sequences/Page';
import FeeSchedulePage from '@/features/fee-optimizer/Page';
import SchedulingPage from '@/features/smart-scheduling/Page';
import ProcurementPage from '@/features/procurement/Page';
import ClinicalDecisionSupportPage from '@/features/decision-support/Page';
import ComplianceAutopilotPage from '@/features/compliance/Page';
import AIAssistantPage from '@/features/ai-assistant/Page';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function HomeRoute() {
  return <LandingPage />;
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
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
