import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AppLayout from '@/layouts/AppLayout';
import LoginPage from '@/pages/LoginPage';
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
        <Route path="patients" element={<PatientsPage />} />
        <Route path="notes" element={<AINotesPage />} />
        <Route path="insurance" element={<InsurancePage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="recall" element={<RecallPage />} />
        <Route path="treatment-plans" element={<TreatmentPlansPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="communications" element={<CommunicationsPage />} />
        <Route path="preauth" element={<PreauthPage />} />
        <Route path="payment-plans" element={<PaymentPlansPage />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="referrals" element={<ReferralsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="perio" element={<PerioChartPage />} />
        <Route path="patient-scores" element={<PatientScoresPage />} />
        <Route path="claim-scrubber" element={<ClaimScrubberPage />} />
        <Route path="patient-retention" element={<ChurnPredictionPage />} />
        <Route path="morning-huddle" element={<MorningHuddlePage />} />
        <Route path="nurture-sequences" element={<NurtureSequencesPage />} />
        <Route path="fee-optimizer" element={<FeeSchedulePage />} />
        <Route path="smart-scheduling" element={<SchedulingPage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="decision-support" element={<ClinicalDecisionSupportPage />} />
        <Route path="compliance" element={<ComplianceAutopilotPage />} />
        <Route path="multi-location" element={<MultiLocationPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="settings" element={<SettingsPage />} />
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
