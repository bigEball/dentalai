import axios from 'axios';
import type {
  Patient,
  ClinicalNote,
  InsurancePlan,
  InsuranceClaim,
  Balance,
  RecallTask,
  RadiographStudy,
  DashboardStats,
  ActivityLog,
} from '@/types';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

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

export async function getInsurancePlans(params?: { status?: string }): Promise<{ plans: InsurancePlan[]; total: number }> {
  const { data } = await api.get<InsurancePlan[]>('/insurance/plans', { params });
  return { plans: data, total: data.length };
}

export async function getInsurancePlan(id: string): Promise<InsurancePlan> {
  const { data } = await api.get<InsurancePlan>(`/insurance/plans/${id}`);
  return data;
}

export async function verifyInsurancePlan(id: string): Promise<InsurancePlan> {
  const { data } = await api.patch<InsurancePlan>(`/insurance/plans/${id}/verify`);
  return data;
}

// ─── Insurance Claims ─────────────────────────────────────────────────────────

export async function getInsuranceClaims(params?: { status?: string; patientId?: string }): Promise<{ claims: InsuranceClaim[]; total: number }> {
  const { data } = await api.get<InsuranceClaim[]>('/insurance/claims', { params });
  return { claims: data, total: data.length };
}

export async function getInsuranceClaim(id: string): Promise<InsuranceClaim> {
  const { data } = await api.get<InsuranceClaim>(`/insurance/claims/${id}`);
  return data;
}

export async function createInsuranceClaim(payload: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
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

// ─── Radiographs ─────────────────────────────────────────────────────────────

export async function getRadiographs(params?: { patientId?: string }): Promise<{ studies: RadiographStudy[]; total: number }> {
  const { data } = await api.get<RadiographStudy[]>('/radiographs', { params });
  return { studies: data, total: data.length };
}

export async function getRadiograph(id: string): Promise<RadiographStudy> {
  const { data } = await api.get<RadiographStudy>(`/radiographs/${id}`);
  return data;
}

export async function updateRadiographNotes(id: string, notes: string): Promise<RadiographStudy> {
  const { data } = await api.patch<RadiographStudy>(`/radiographs/${id}/notes`, { providerNotes: notes });
  return data;
}

// Route uses POST for mark-reviewed
export async function markRadiographReviewed(id: string): Promise<RadiographStudy> {
  const { data } = await api.post<RadiographStudy>(`/radiographs/${id}/reviewed`);
  return data;
}

export async function uploadRadiograph(file: File, patientId: string, type: string): Promise<RadiographStudy> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('patientId', patientId);
  formData.append('type', type);
  const { data } = await api.post<RadiographStudy>('/radiographs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
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
    radiographs: boolean;
  };
}

export interface SystemStatus {
  mode: 'demo' | 'live';
  openDentalConnected: boolean;
  ollamaAvailable: boolean;
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

export default api;
