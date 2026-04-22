import axios from 'axios';
import { getMockForPath } from './mockData';
import type {
  Patient,
  Provider,
  Appointment,
  ClinicalNote,
  InsurancePlan,
  InsuranceClaim,
  Balance,
  RecallTask,
  DashboardStats,
  ActivityLog,
  TreatmentPlan,
  TreatmentPlanItem,
  PaymentPlan,
  PatientForm,
  Referral,
  InventoryItem,
  Communication,
  FollowUp,
  PerioExam,
  PreAuthorization,
} from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// If the backend is unreachable (static-only deploy), serve mock data
// from the seed so every page renders a realistic demo state.
function resolveMock(url: string, method: string, requestBody?: unknown): { data: unknown } | undefined {
  const mock = getMockForPath(url);
  if (mock === undefined) return undefined;

  if (method !== 'get') {
    let payload: unknown = mock;
    try {
      if (typeof requestBody === 'string' && requestBody.length > 0) {
        payload = { ...(mock as object), ...JSON.parse(requestBody), id: `mock-${Date.now()}` };
      } else if (requestBody && typeof requestBody === 'object') {
        payload = { ...(mock as object), ...(requestBody as object), id: `mock-${Date.now()}` };
      }
    } catch {
      /* use mock as-is */
    }
    return { data: payload };
  }

  return { data: mock };
}

api.interceptors.response.use(
  response => {
    // Netlify's SPA fallback could return index.html (HTML, 200) for an
    // unknown /api/v1/* path. If the response looks like HTML when we
    // expected JSON, treat it as a miss and fall back to mock data.
    const contentType = String(response.headers?.['content-type'] ?? '');
    const looksLikeHtml =
      contentType.includes('text/html') ||
      (typeof response.data === 'string' && response.data.trim().startsWith('<'));

    if (looksLikeHtml) {
      const url: string = response.config?.url ?? '';
      const method: string = (response.config?.method ?? 'get').toLowerCase();
      const mock = resolveMock(url, method, response.config?.data);
      if (mock !== undefined) {
        return { ...response, ...mock, status: 200, statusText: 'OK' };
      }
    }
    return response;
  },
  error => {
    const url: string = error?.config?.url ?? '';
    const method: string = (error?.config?.method ?? 'get').toLowerCase();
    const mock = resolveMock(url, method, error?.config?.data);

    if (mock !== undefined) {
      return Promise.resolve({ ...mock, status: 200, statusText: 'OK', headers: {}, config: error.config });
    }
    // No mock — let the caller see the original error.
    return Promise.reject(error);
  }
);

// ─── Patients ────────────────────────────────────────────────────────────────

export async function getPatients(params?: { search?: string }): Promise<{ patients: Patient[]; total: number }> {
  const { data } = await api.get<Patient[]>('/patients', { params });
  return { patients: data, total: data.length };
}

export async function getPatient(id: string): Promise<Patient> {
  const { data } = await api.get<Patient>(`/patients/${id}`);
  return data;
}

export async function updatePatient(id: string, payload: Partial<Patient>): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}`, payload);
  return data;
}

// ─── Clinical Notes ───────────────────────────────────────────────────────────

export async function getNotes(params?: { status?: string; patientId?: string }): Promise<{ notes: ClinicalNote[]; total: number }> {
  const { data } = await api.get<ClinicalNote[]>('/notes', { params });
  return { notes: data, total: data.length };
}

export async function getNote(id: string): Promise<ClinicalNote> {
  const { data } = await api.get<ClinicalNote>(`/notes/${id}`);
  return data;
}

export async function createNote(payload: Partial<ClinicalNote>): Promise<ClinicalNote> {
  const { data } = await api.post<ClinicalNote>('/notes', payload);
  return data;
}

export async function generateNote(payload: {
  transcript: string;
  patientId: string;
  appointmentId?: string;
  procedureCode?: string;
  toothNumbers?: string;
}): Promise<ClinicalNote> {
  const { data } = await api.post<ClinicalNote>('/notes/generate', payload);
  return data;
}

export async function updateNote(id: string, payload: Partial<ClinicalNote>): Promise<ClinicalNote> {
  const { data } = await api.patch<ClinicalNote>(`/notes/${id}`, payload);
  return data;
}

export async function approveNote(id: string): Promise<ClinicalNote> {
  const { data } = await api.patch<ClinicalNote>(`/notes/${id}/approve`);
  return data;
}

// ─── Insurance Plans ──────────────────────────────────────────────────────────

export async function getInsurancePlans(params?: { status?: string; patientId?: string }): Promise<InsurancePlan[]> {
  const { data } = await api.get<InsurancePlan[]>('/insurance/plans', { params });
  return Array.isArray(data) ? data : [];
}

export async function getInsurancePlan(id: string): Promise<InsurancePlan> {
  const { data } = await api.get<InsurancePlan>(`/insurance/plans/${id}`);
  return data;
}

export async function createInsurancePlan(payload: {
  patientId: string;
  provider: string;
  memberId: string;
  groupNumber: string;
  deductible: number;
  annualMax: number;
  coPayPreventive?: number;
  coPayBasic?: number;
  coPayMajor?: number;
}): Promise<InsurancePlan> {
  const { data } = await api.post<InsurancePlan>('/insurance/plans', payload);
  return data;
}

export async function verifyInsurancePlan(id: string): Promise<InsurancePlan> {
  const { data } = await api.patch<InsurancePlan>(`/insurance/plans/${id}/verify`);
  return data;
}

// ─── Insurance Claims ─────────────────────────────────────────────────────────

export async function getInsuranceClaims(params?: { status?: string; patientId?: string }): Promise<InsuranceClaim[]> {
  const { data } = await api.get<InsuranceClaim[]>('/insurance/claims', { params });
  return Array.isArray(data) ? data : [];
}

export async function getInsuranceClaim(id: string): Promise<InsuranceClaim> {
  const { data } = await api.get<InsuranceClaim>(`/insurance/claims/${id}`);
  return data;
}

export async function createInsuranceClaim(payload: {
  patientId: string;
  insurancePlanId: string;
  appointmentId?: string;
  procedureCodes: string;
  totalAmount: number;
  narrative: string;
}): Promise<InsuranceClaim> {
  const { data } = await api.post<InsuranceClaim>('/insurance/claims', payload);
  return data;
}

export async function updateInsuranceClaim(id: string, payload: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
  const { data } = await api.patch<InsuranceClaim>(`/insurance/claims/${id}`, payload);
  return data;
}

export async function submitInsuranceClaim(id: string): Promise<InsuranceClaim> {
  const { data } = await api.patch<InsuranceClaim>(`/insurance/claims/${id}/submit`);
  return data;
}

export async function generateClaims(): Promise<{ generated: number; claims: InsuranceClaim[] }> {
  const { data } = await api.post<{ generated: number; claims: InsuranceClaim[] }>('/insurance/claims/generate');
  return data;
}

// ─── Billing / Balances ───────────────────────────────────────────────────────

export async function getBalances(params?: { status?: string }): Promise<{ balances: Balance[]; total: number }> {
  const { data } = await api.get<Balance[]>('/billing/balances', { params });
  return { balances: data, total: data.length };
}

export async function getBalance(id: string): Promise<Balance> {
  const { data } = await api.get<Balance>(`/billing/balances/${id}`);
  return data;
}

// Routes use PATCH for all billing mutations
export async function sendStatement(id: string): Promise<Balance> {
  const { data } = await api.patch<Balance>(`/billing/balances/${id}/send-statement`);
  return data;
}

export async function sendReminder(id: string): Promise<{ success: boolean }> {
  const { data } = await api.patch<{ success: boolean }>(`/billing/balances/${id}/send-reminder`);
  return data;
}

export async function markPaid(id: string, amount: number): Promise<Balance> {
  const { data } = await api.patch<Balance>(`/billing/balances/${id}/mark-paid`, { amount });
  return data;
}

// ─── Recall ───────────────────────────────────────────────────────────────────

export async function getRecallTasks(params?: { status?: string }): Promise<{ tasks: RecallTask[]; total: number }> {
  const { data } = await api.get<RecallTask[]>('/recall/tasks', { params });
  return { tasks: data, total: data.length };
}

export async function contactRecallTask(id: string): Promise<RecallTask> {
  const { data } = await api.patch<RecallTask>(`/recall/tasks/${id}/contact`);
  return data;
}

export async function scheduleRecallTask(id: string): Promise<RecallTask> {
  const { data } = await api.patch<RecallTask>(`/recall/tasks/${id}/schedule`);
  return data;
}

export async function sendRecallText(id: string): Promise<{ success: boolean }> {
  const { data } = await api.patch<{ success: boolean }>(`/recall/tasks/${id}/send-text`);
  return data;
}

export async function sendRecallEmail(id: string): Promise<{ success: boolean }> {
  const { data } = await api.patch<{ success: boolean }>(`/recall/tasks/${id}/send-email`);
  return data;
}

// ─── Treatment Plans ─────────────────────────────────────────────────────────

export async function getTreatmentPlans(params?: { status?: string; patientId?: string }): Promise<{ plans: TreatmentPlan[]; total: number }> {
  const { data } = await api.get<TreatmentPlan[]>('/treatment-plans', { params });
  return { plans: data, total: data.length };
}

export async function getTreatmentPlan(id: string): Promise<TreatmentPlan> {
  const { data } = await api.get<TreatmentPlan>(`/treatment-plans/${id}`);
  return data;
}

export async function createTreatmentPlan(payload: Partial<TreatmentPlan> & { items?: Partial<TreatmentPlanItem>[] }): Promise<TreatmentPlan> {
  const { data } = await api.post<TreatmentPlan>('/treatment-plans', payload);
  return data;
}

export async function updateTreatmentPlan(id: string, payload: Partial<TreatmentPlan>): Promise<TreatmentPlan> {
  const { data } = await api.patch<TreatmentPlan>(`/treatment-plans/${id}`, payload);
  return data;
}

export async function acceptTreatmentPlan(id: string): Promise<TreatmentPlan> {
  const { data } = await api.patch<TreatmentPlan>(`/treatment-plans/${id}/accept`);
  return data;
}

export async function declineTreatmentPlan(id: string): Promise<TreatmentPlan> {
  const { data } = await api.patch<TreatmentPlan>(`/treatment-plans/${id}/decline`);
  return data;
}

export async function sendTreatmentPlanToPatient(id: string): Promise<TreatmentPlan & { messagePreview: string; planLink: string }> {
  const { data } = await api.post<TreatmentPlan & { messagePreview: string; planLink: string }>(`/treatment-plans/${id}/send`);
  return data;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getProductionReport(params?: { start?: string; end?: string }): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>('/reports/production', { params });
  return data;
}

export async function getCollectionsReport(): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>('/reports/collections');
  return data;
}

export async function getCaseAcceptanceReport(): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>('/reports/case-acceptance');
  return data;
}

export async function getHygieneReport(): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>('/reports/hygiene');
  return data;
}

export async function getAgingARReport(): Promise<Record<string, unknown>> {
  const { data } = await api.get<Record<string, unknown>>('/reports/aging-ar');
  return data;
}

// ─── Communications ──────────────────────────────────────────────────────────

export async function getCommunications(params?: { patientId?: string; channel?: string }): Promise<{ communications: Communication[]; total: number }> {
  const { data } = await api.get<Communication[]>('/communications', { params });
  return { communications: data, total: data.length };
}

export async function getCommunication(id: string): Promise<Communication> {
  const { data } = await api.get<Communication>(`/communications/${id}`);
  return data;
}

export async function sendCommunication(payload: Partial<Communication>): Promise<Communication> {
  const { data } = await api.post<Communication>('/communications', payload);
  return data;
}

export async function sendBulkCommunication(payload: { patientIds: string[]; channel: string; subject?: string; body: string }): Promise<{ success: boolean; sent: number }> {
  const { data } = await api.post<{ success: boolean; sent: number }>('/communications/bulk', payload);
  return data;
}

// ─── Pre-Authorization ──────────────────────────────────────────────────────

export async function getPreAuths(params?: { status?: string }): Promise<{ preAuths: PreAuthorization[]; total: number }> {
  const { data } = await api.get<PreAuthorization[]>('/preauth', { params });
  return { preAuths: data, total: data.length };
}

export async function getPreAuth(id: string): Promise<PreAuthorization> {
  const { data } = await api.get<PreAuthorization>(`/preauth/${id}`);
  return data;
}

export async function createPreAuth(payload: Partial<PreAuthorization>): Promise<PreAuthorization> {
  const { data } = await api.post<PreAuthorization>('/preauth', payload);
  return data;
}

export async function updatePreAuth(id: string, payload: Partial<PreAuthorization>): Promise<PreAuthorization> {
  const { data } = await api.patch<PreAuthorization>(`/preauth/${id}`, payload);
  return data;
}

export async function submitPreAuth(id: string): Promise<PreAuthorization> {
  const { data } = await api.patch<PreAuthorization>(`/preauth/${id}/submit`);
  return data;
}

// ─── Payment Plans ───────────────────────────────────────────────────────────

export async function getPaymentPlans(params?: { status?: string }): Promise<{ plans: PaymentPlan[]; total: number }> {
  const { data } = await api.get<PaymentPlan[]>('/payment-plans', { params });
  return { plans: data, total: data.length };
}

export async function getPaymentPlan(id: string): Promise<PaymentPlan> {
  const { data } = await api.get<PaymentPlan>(`/payment-plans/${id}`);
  return data;
}

export async function createPaymentPlan(payload: { patientId: string; totalAmount: number; downPayment?: number; monthlyPayment: number; startDate: string; interestRate?: number; notes?: string }): Promise<PaymentPlan> {
  const { data } = await api.post<PaymentPlan>('/payment-plans', payload);
  return data;
}

export async function payInstallment(id: string): Promise<PaymentPlan> {
  const { data } = await api.patch<PaymentPlan>(`/payment-plans/${id}/pay-installment`);
  return data;
}

export async function cancelPaymentPlan(id: string): Promise<PaymentPlan> {
  const { data } = await api.patch<PaymentPlan>(`/payment-plans/${id}/cancel`);
  return data;
}

// ─── Forms ───────────────────────────────────────────────────────────────────

export async function getForms(params?: { status?: string; formType?: string }): Promise<{ forms: PatientForm[]; total: number }> {
  const { data } = await api.get<PatientForm[]>('/forms', { params });
  return { forms: data, total: data.length };
}

export async function getForm(id: string): Promise<PatientForm> {
  const { data } = await api.get<PatientForm>(`/forms/${id}`);
  return data;
}

export async function createForm(payload: Partial<PatientForm>): Promise<PatientForm> {
  const { data } = await api.post<PatientForm>('/forms', payload);
  return data;
}

export async function submitForm(id: string): Promise<PatientForm> {
  const { data } = await api.patch<PatientForm>(`/forms/${id}/submit`);
  return data;
}

export async function reviewForm(id: string, reviewedBy: string): Promise<PatientForm> {
  const { data } = await api.patch<PatientForm>(`/forms/${id}/review`, { reviewedBy });
  return data;
}

export async function sendFormToPatient(id: string): Promise<PatientForm & { messagePreview: string; formLink: string }> {
  const { data } = await api.post<PatientForm & { messagePreview: string; formLink: string }>(`/forms/${id}/send`);
  return data;
}

// ─── Follow-Ups ──────────────────────────────────────────────────────────────

export async function getFollowUps(params?: { status?: string }): Promise<{ followUps: FollowUp[]; total: number }> {
  const { data } = await api.get<FollowUp[]>('/followups', { params });
  return { followUps: data, total: data.length };
}

export async function getFollowUp(id: string): Promise<FollowUp> {
  const { data } = await api.get<FollowUp>(`/followups/${id}`);
  return data;
}

export async function createFollowUp(payload: Partial<FollowUp>): Promise<FollowUp> {
  const { data } = await api.post<FollowUp>('/followups', payload);
  return data;
}

export async function sendFollowUp(id: string): Promise<FollowUp> {
  const { data } = await api.patch<FollowUp>(`/followups/${id}/send`);
  return data;
}

export async function respondFollowUp(id: string, response: string): Promise<FollowUp> {
  const { data } = await api.patch<FollowUp>(`/followups/${id}/respond`, { response });
  return data;
}

export async function completeFollowUp(id: string): Promise<FollowUp> {
  const { data } = await api.patch<FollowUp>(`/followups/${id}/complete`);
  return data;
}

// ─── Referrals ───────────────────────────────────────────────────────────────

export async function getReferrals(params?: { status?: string }): Promise<{ referrals: Referral[]; total: number }> {
  const { data } = await api.get<Referral[]>('/referrals', { params });
  return { referrals: data, total: data.length };
}

export async function getReferral(id: string): Promise<Referral> {
  const { data } = await api.get<Referral>(`/referrals/${id}`);
  return data;
}

export async function createReferral(payload: Partial<Referral>): Promise<Referral> {
  const { data } = await api.post<Referral>('/referrals', payload);
  return data;
}

export async function updateReferral(id: string, payload: Partial<Referral>): Promise<Referral> {
  const { data } = await api.patch<Referral>(`/referrals/${id}`, payload);
  return data;
}

export async function sendReferral(id: string): Promise<Referral> {
  const { data } = await api.patch<Referral>(`/referrals/${id}/send`);
  return data;
}

export async function scheduleReferral(id: string, appointmentDate: string): Promise<Referral> {
  const { data } = await api.patch<Referral>(`/referrals/${id}/schedule`, { appointmentDate });
  return data;
}

export async function completeReferral(id: string, reportNotes?: string): Promise<Referral> {
  const { data } = await api.patch<Referral>(`/referrals/${id}/complete`, { reportNotes });
  return data;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export async function getInventory(params?: { category?: string; lowStock?: boolean }): Promise<{ items: InventoryItem[]; total: number }> {
  const { data } = await api.get<InventoryItem[]>('/inventory', { params });
  return { items: data, total: data.length };
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const { data } = await api.get<InventoryItem>(`/inventory/${id}`);
  return data;
}

export async function createInventoryItem(payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data } = await api.post<InventoryItem>('/inventory', payload);
  return data;
}

export async function updateInventoryItem(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data } = await api.patch<InventoryItem>(`/inventory/${id}`, payload);
  return data;
}

export async function restockItem(id: string, quantity: number): Promise<InventoryItem> {
  const { data } = await api.patch<InventoryItem>(`/inventory/${id}/restock`, { quantity });
  return data;
}

export async function adjustStock(id: string, quantity: number, reason?: string): Promise<InventoryItem> {
  const { data } = await api.patch<InventoryItem>(`/inventory/${id}/adjust`, { quantity, reason });
  return data;
}

export async function getInventoryAlerts(): Promise<InventoryItem[]> {
  const { data } = await api.get<InventoryItem[]>('/inventory/alerts');
  return data;
}

export async function searchItemPrices(itemId: string): Promise<import('@/types').PriceSearchResponse> {
  const { data } = await api.get<import('@/types').PriceSearchResponse>(`/inventory/price-search/${itemId}`);
  return data;
}

export async function searchPricesByQuery(query: string): Promise<import('@/types').PriceSearchResponse> {
  const { data } = await api.get<import('@/types').PriceSearchResponse>('/inventory/price-search', { params: { q: query } });
  return data;
}

export async function parseInventoryFile(file: File): Promise<import('@/types').InventoryImportPreview> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<import('@/types').InventoryImportPreview>('/inventory/import/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data;
}

export async function confirmInventoryImport(items: import('@/types').InventoryImportRow[]): Promise<import('@/types').InventoryImportResult> {
  const { data } = await api.post<import('@/types').InventoryImportResult>('/inventory/import/confirm', { items });
  return data;
}

// ─── Patient Scores ──────────────────────────────────────────────────────────

export async function getAllPatientScores(): Promise<import('@/types').PatientScores[]> {
  const { data } = await api.get<import('@/types').PatientScores[]>('/scores');
  return data;
}

export async function getPatientScore(patientId: string): Promise<import('@/types').PatientScores> {
  const { data } = await api.get<import('@/types').PatientScores>(`/scores/${patientId}`);
  return data;
}

export async function getScoreAlerts(): Promise<import('@/types').PatientScores[]> {
  const { data } = await api.get<import('@/types').PatientScores[]>('/scores/alerts');
  return data;
}

// ─── Perio ───────────────────────────────────────────────────────────────────

export async function getPerioExams(params?: { patientId?: string }): Promise<{ exams: PerioExam[]; total: number }> {
  const { data } = await api.get<PerioExam[]>('/perio', { params });
  return { exams: data, total: data.length };
}

export async function getPerioExam(id: string): Promise<PerioExam> {
  const { data } = await api.get<PerioExam>(`/perio/${id}`);
  return data;
}

export async function createPerioExam(payload: Partial<PerioExam>): Promise<PerioExam> {
  const { data } = await api.post<PerioExam>('/perio', payload);
  return data;
}

export async function comparePerioExams(patientId: string): Promise<{ exams: PerioExam[]; comparison: Record<string, unknown> }> {
  const { data } = await api.get<{ exams: PerioExam[]; comparison: Record<string, unknown> }>(`/perio/patient/${patientId}/compare`);
  return data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/dashboard/stats');
  return data;
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function getActivity(params?: { limit?: number }): Promise<{ activities: ActivityLog[]; total: number }> {
  const { data } = await api.get<ActivityLog[]>('/activity', { params });
  return { activities: data, total: data.length };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppConfig {
  mode: 'demo' | 'live';
  openDental: {
    serverUrl: string;
    developerKey: string;
    customerKey: string;
  };
  ollama: {
    url: string;
    model: string;
    enabled: boolean;
  };
  whisper: {
    modelPath: string;
    enabled: boolean;
  };
  office: {
    name: string;
    locations: string[];
    timezone: string;
  };
  modules: {
    aiNotes: boolean;
    insurance: boolean;
    billing: boolean;
    recall: boolean;
  };
}

export interface SystemStatus {
  mode: 'demo' | 'live';
  openDentalConnected: boolean;
  ollamaAvailable: boolean;
}

export interface DemoRequest {
  id: string;
  name: string;
  email: string;
  practice: string;
  phone: string;
  locations?: string;
  providers?: string;
  source?: string;
  message: string;
  submittedAt: string;
}

export async function getSettings(): Promise<AppConfig> {
  const { data } = await api.get<AppConfig>('/settings');
  return data;
}

export async function updateSettings(payload: Partial<AppConfig>): Promise<AppConfig> {
  const { data } = await api.patch<AppConfig>('/settings', payload);
  return data;
}

export async function testConnection(): Promise<{ connected: boolean; message: string }> {
  const { data } = await api.post<{ connected: boolean; message: string }>('/settings/test-connection');
  return data;
}

export async function triggerSync(): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post<{ success: boolean; message: string }>('/settings/sync');
  return data;
}

export async function switchMode(mode: 'demo' | 'live'): Promise<AppConfig> {
  const { data } = await api.post<AppConfig>('/settings/switch-mode', { mode });
  return data;
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const { data } = await api.get<SystemStatus>('/settings/status');
  return data;
}

export async function getDemoRequests(): Promise<DemoRequest[]> {
  const { data } = await api.get<DemoRequest[]>('/demo-requests');
  return Array.isArray(data) ? data : [];
}

export async function deleteDemoRequest(id: string): Promise<void> {
  await api.delete(`/demo-requests/${id}`);
}

export default api;
