import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { isRouteAllowed, resolveRole } from '@/lib/roles';
import AppLayout from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
import AccessDeniedPage from '@/pages/AccessDeniedPage';
import DashboardPage from '@/pages/DashboardPage';
import PatientsPage from '@/pages/PatientsPage';
import AINotesPage from '@/pages/AINotesPage';
import InsurancePage from '@/pages/InsurancePage';
import BillingPage from '@/pages/BillingPage';
import RecallPage from '@/pages/RecallPage';
import SettingsPage from '@/pages/SettingsPage';
import TreatmentPlansPage from '@/pages/TreatmentPlansPage';
import ReportsPage from '@/pages/ReportsPage';
import CommunicationsPage from '@/pages/CommunicationsPage';
import PreauthPage from '@/pages/PreauthPage';
import PaymentPlansPage from '@/pages/PaymentPlansPage';
import FormsPage from '@/pages/FormsPage';
import FollowUpsPage from '@/pages/FollowUpsPage';
import ReferralsPage from '@/pages/ReferralsPage';
import InventoryPage from '@/pages/InventoryPage';
import PerioChartPage from '@/pages/PerioChartPage';
import PatientScoresPage from '@/pages/PatientScoresPage';
import ToolsPage from '@/pages/ToolsPage';
import ClaimScrubberPage from '@/pages/ClaimScrubberPage';
import ChurnPredictionPage from '@/pages/ChurnPredictionPage';
import MorningHuddlePage from '@/pages/MorningHuddlePage';
import NurtureSequencesPage from '@/pages/NurtureSequencesPage';
import FeeSchedulePage from '@/pages/FeeSchedulePage';
import SchedulingPage from '@/pages/SchedulingPage';
import ProcurementPage from '@/pages/ProcurementPage';
import ClinicalDecisionSupportPage from '@/pages/ClinicalDecisionSupportPage';
import ComplianceAutopilotPage from '@/pages/ComplianceAutopilotPage';
import MultiLocationPage from '@/pages/MultiLocationPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
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
        <Route path="multi-location" element={<RequireRole><MultiLocationPage /></RequireRole>} />
        <Route path="tools" element={<RequireRole><ToolsPage /></RequireRole>} />
        <Route path="settings" element={<RequireRole><SettingsPage /></RequireRole>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
