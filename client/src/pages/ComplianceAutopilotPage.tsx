import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  ClipboardCheck,
  GraduationCap,
  Bell,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  X,
  ChevronRight,
  Clock,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

import { formatDate, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';

// ─── API base ────────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type ComplianceCategory = 'hipaa' | 'osha' | 'infection_control' | 'state_regulatory';
type TaskStatus = 'compliant' | 'due_soon' | 'overdue' | 'not_started';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
type TrainingStatus = 'current' | 'expiring_soon' | 'expired';
type TabKey = 'tasks' | 'training' | 'expiry' | 'audits';

interface ComplianceTask {
  id: string;
  title: string;
  category: ComplianceCategory;
  description: string;
  frequency: string;
  lastCompleted: string | null;
  nextDue: string;
  status: TaskStatus;
  assignee: string;
  notes: string;
  evidence: string;
  priority: TaskPriority;
}

interface TrainingRecord {
  id: string;
  staffName: string;
  staffRole: string;
  trainingType: string;
  completedDate: string;
  expiryDate: string;
  certificateRef: string;
  status: TrainingStatus;
}

interface ExpiryAlert {
  id: string;
  type: 'task' | 'training';
  title: string;
  category: string;
  dueDate: string;
  daysUntilDue: number;
  urgency: '30_days' | '60_days' | '90_days';
  assignee: string;
}

interface AuditSection {
  category: string;
  tasks: {
    title: string;
    status: TaskStatus;
    lastCompleted: string | null;
    nextDue: string;
    evidence: string;
    priority: TaskPriority;
  }[];
  score: number;
}

interface AuditReport {
  id: string;
  type: string;
  generatedAt: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  sections: AuditSection[];
}

interface Dashboard {
  overallScore: number;
  categoryScores: Record<ComplianceCategory, number>;
  totalTasks: number;
  compliantCount: number;
  dueSoonCount: number;
  overdueCount: number;
  notStartedCount: number;
  expiringTrainingCount: number;
  expiredTrainingCount: number;
  recentAudits: AuditReport[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  hipaa: 'HIPAA',
  osha: 'OSHA',
  infection_control: 'Infection Control',
  state_regulatory: 'State/Regulatory',
};

const CATEGORY_COLORS: Record<ComplianceCategory, string> = {
  hipaa: 'bg-blue-50 text-blue-700 border-blue-200',
  osha: 'bg-amber-50 text-amber-700 border-amber-200',
  infection_control: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  state_regulatory: 'bg-purple-50 text-purple-700 border-purple-200',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  compliant: 'bg-green-50 text-green-700',
  due_soon: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  not_started: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  compliant: 'Compliant',
  due_soon: 'Due Soon',
  overdue: 'Overdue',
  not_started: 'Not Started',
};

const TRAINING_STATUS_COLORS: Record<TrainingStatus, string> = {
  current: 'bg-green-50 text-green-700',
  expiring_soon: 'bg-amber-50 text-amber-700',
  expired: 'bg-red-50 text-red-700',
};

const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  current: 'Current',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: 'text-red-600',
  high: 'text-orange-600',
  medium: 'text-blue-600',
  low: 'text-gray-500',
};

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

function scoreRingColor(score: number): string {
  if (score >= 90) return 'stroke-green-500';
  if (score >= 70) return 'stroke-amber-500';
  return 'stroke-red-500';
}

function scoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

function urgencyBadge(urgency: string): string {
  switch (urgency) {
    case '30_days': return 'bg-red-100 text-red-700';
    case '60_days': return 'bg-amber-100 text-amber-700';
    case '90_days': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

// ─── Circular Progress Ring ──────────────────────────────────────────────────

function CircularScore({ score, size = 140, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700 ease-out', scoreRingColor(score))}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-3xl font-bold tabular-nums', scoreColor(score))}>{score}%</span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">Compliant</span>
      </div>
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ score, label, className }: { score: number; label: string; className?: string }) {
  return (
    <div className={cn('', className)}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={cn('text-sm font-semibold tabular-nums', scoreColor(score))}>{score}%</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', scoreBgColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ComplianceAutopilotPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('tasks');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<ComplianceCategory | ''>('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');

  // Training state
  const [training, setTraining] = useState<TrainingRecord[]>([]);
  const [showAddTraining, setShowAddTraining] = useState(false);
  const [newTraining, setNewTraining] = useState({
    staffName: '',
    staffRole: '',
    trainingType: '',
    completedDate: '',
    expiryDate: '',
    certificateRef: '',
  });

  // Expiry alerts
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);

  // Audit reports
  const [audits, setAudits] = useState<AuditReport[]>([]);
  const [generatingAudit, setGeneratingAudit] = useState<string | null>(null);
  const [viewingAudit, setViewingAudit] = useState<AuditReport | null>(null);

  // Complete task modal
  const [completingTask, setCompletingTask] = useState<ComplianceTask | null>(null);
  const [completionDate, setCompletionDate] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // ── Fetch helpers ────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async () => {
    try {
      const { data } = await api.get<Dashboard>('/compliance/dashboard');
      setDashboard(data);
    } catch {
      // Fallback: still show page
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get<ComplianceTask[]>('/compliance/tasks', { params });
      setTasks(data);
    } catch {
      toast.error('Failed to load compliance tasks');
    }
  }, [categoryFilter, statusFilter]);

  const fetchTraining = useCallback(async () => {
    try {
      const { data } = await api.get<TrainingRecord[]>('/compliance/training');
      setTraining(data);
    } catch {
      toast.error('Failed to load training records');
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data } = await api.get<ExpiryAlert[]>('/compliance/expiry-alerts');
      setAlerts(data);
    } catch {
      toast.error('Failed to load expiry alerts');
    }
  }, []);

  const fetchAudits = useCallback(async () => {
    try {
      const { data } = await api.get<AuditReport[]>('/compliance/audits');
      setAudits(data);
    } catch {
      toast.error('Failed to load audit history');
    }
  }, []);

  // ── Initial load ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchTasks(), fetchTraining(), fetchAlerts(), fetchAudits()]);
      setLoading(false);
    }
    init();
  }, [fetchDashboard, fetchTasks, fetchTraining, fetchAlerts, fetchAudits]);

  // Refetch tasks when filters change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleCompleteTask() {
    if (!completingTask) return;
    try {
      await api.patch(`/compliance/tasks/${completingTask.id}/complete`, {
        completionDate: completionDate || undefined,
        evidenceNotes: evidenceNotes || undefined,
      });
      toast.success(`"${completingTask.title}" marked as completed`);
      setCompletingTask(null);
      setCompletionDate('');
      setEvidenceNotes('');
      await Promise.all([fetchTasks(), fetchDashboard(), fetchAlerts()]);
    } catch {
      toast.error('Failed to complete task');
    }
  }

  async function handleAddTraining() {
    try {
      await api.post('/compliance/training', newTraining);
      toast.success('Training record added');
      setShowAddTraining(false);
      setNewTraining({ staffName: '', staffRole: '', trainingType: '', completedDate: '', expiryDate: '', certificateRef: '' });
      await Promise.all([fetchTraining(), fetchDashboard(), fetchAlerts()]);
    } catch {
      toast.error('Failed to add training record');
    }
  }

  async function handleGenerateAudit(type: string) {
    setGeneratingAudit(type);
    try {
      const { data } = await api.post<AuditReport>(`/compliance/audit/${type}`);
      toast.success(`${type.toUpperCase()} audit report generated — Score: ${data.overallScore}%`);
      setViewingAudit(data);
      await fetchAudits();
    } catch {
      toast.error('Failed to generate audit report');
    } finally {
      setGeneratingAudit(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) return <FullPageSpinner />;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'tasks', label: 'Tasks', icon: <ClipboardCheck size={16} />, count: tasks.length },
    { key: 'training', label: 'Training', icon: <GraduationCap size={16} />, count: training.length },
    { key: 'expiry', label: 'Expiry Alerts', icon: <Bell size={16} />, count: alerts.length },
    { key: 'audits', label: 'Audit Reports', icon: <FileText size={16} />, count: audits.length },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Compliance Autopilot</h1>
          <p className="mt-1 text-sm text-gray-500">
            OSHA, HIPAA, infection control, and state regulatory compliance — all in one place.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">AI continuously monitors HIPAA, OSHA, infection control, and state regulatory requirements</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Tasks approaching or past their due dates are flagged so nothing falls through the cracks</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Staff training certifications and expiry dates are tracked with automatic renewal reminders</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Audit-ready compliance reports are generated on demand with scores and evidence attached</p>
          </div>
        </div>
      </div>

      {/* ── Score + Category Cards ──────────────────────────────────────── */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Overall Score */}
          <div className="lg:col-span-1 card p-6 flex flex-col items-center justify-center">
            <CircularScore score={dashboard.overallScore} />
            <p className="mt-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</p>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertTriangle size={12} /> {dashboard.overdueCount} overdue
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock size={12} /> {dashboard.dueSoonCount} due soon
              </span>
            </div>
          </div>

          {/* Category Score Cards */}
          {(['hipaa', 'osha', 'infection_control', 'state_regulatory'] as ComplianceCategory[]).map((cat) => (
            <div key={cat} className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn('p-1.5 rounded-lg', CATEGORY_COLORS[cat].split(' ').slice(0, 1).join(' '))}>
                  <ShieldCheck size={16} className={CATEGORY_COLORS[cat].split(' ')[1]} />
                </div>
                <h3 className="text-sm font-semibold text-gray-700">{CATEGORY_LABELS[cat]}</h3>
              </div>
              <ProgressBar score={dashboard.categoryScores[cat] ?? 0} label="" />
              <p className="mt-2 text-xs text-gray-400">
                {tasks.filter((t) => t.category === cat && t.status === 'overdue').length} overdue /{' '}
                {tasks.filter((t) => t.category === cat).length} total
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Stat summary row ────────────────────────────────────────────── */}
      {dashboard && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-50">
              <CheckCircle2 size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 tabular-nums">{dashboard.compliantCount}</p>
              <p className="text-xs text-gray-500">Compliant</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 tabular-nums">{dashboard.dueSoonCount}</p>
              <p className="text-xs text-gray-500">Due Soon</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 tabular-nums">{dashboard.overdueCount}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <GraduationCap size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {dashboard.expiringTrainingCount + dashboard.expiredTrainingCount}
              </p>
              <p className="text-xs text-gray-500">Training Alerts</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full',
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500',
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}

      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'training' && <TrainingTab />}
      {activeTab === 'expiry' && <ExpiryTab />}
      {activeTab === 'audits' && <AuditsTab />}

      {/* ── Complete Task Modal ──────────────────────────────────────────── */}
      <Modal isOpen={!!completingTask} onClose={() => setCompletingTask(null)} title="Complete Compliance Task">
        {completingTask && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{completingTask.title}</p>
              <p className="text-xs text-gray-500 mt-1">{completingTask.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evidence / Notes</label>
              <textarea
                rows={3}
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Documentation reference, certificate number, or notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCompleteTask}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark Completed
              </button>
              <button
                onClick={() => setCompletingTask(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Add Training Modal ──────────────────────────────────────────── */}
      <Modal isOpen={showAddTraining} onClose={() => setShowAddTraining(false)} title="Add Training Record" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name</label>
              <input
                type="text"
                value={newTraining.staffName}
                onChange={(e) => setNewTraining({ ...newTraining, staffName: e.target.value })}
                placeholder="e.g. Dr. Sarah Chen"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={newTraining.staffRole}
                onChange={(e) => setNewTraining({ ...newTraining, staffRole: e.target.value })}
                placeholder="e.g. Dentist, Hygienist"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Type</label>
            <input
              type="text"
              value={newTraining.trainingType}
              onChange={(e) => setNewTraining({ ...newTraining, trainingType: e.target.value })}
              placeholder="e.g. HIPAA Privacy & Security"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date</label>
              <input
                type="date"
                value={newTraining.completedDate}
                onChange={(e) => setNewTraining({ ...newTraining, completedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={newTraining.expiryDate}
                onChange={(e) => setNewTraining({ ...newTraining, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Reference</label>
            <input
              type="text"
              value={newTraining.certificateRef}
              onChange={(e) => setNewTraining({ ...newTraining, certificateRef: e.target.value })}
              placeholder="Certificate or completion number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddTraining}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Record
            </button>
            <button
              onClick={() => setShowAddTraining(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── View Audit Modal ────────────────────────────────────────────── */}
      <Modal isOpen={!!viewingAudit} onClose={() => setViewingAudit(null)} title={`Audit Report — ${viewingAudit?.type.toUpperCase()}`} size="lg">
        {viewingAudit && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Generated: {formatDate(viewingAudit.generatedAt)}</p>
              </div>
              <div className={cn('text-2xl font-bold tabular-nums', scoreColor(viewingAudit.overallScore))}>
                {viewingAudit.overallScore}%
              </div>
            </div>

            {viewingAudit.sections.map((section) => (
              <div key={section.category} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 capitalize">
                    {section.category.replace('_', ' ')}
                  </span>
                  <span className={cn('text-sm font-bold tabular-nums', scoreColor(section.score))}>
                    {section.score}%
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {section.tasks.map((t, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 truncate">{t.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last: {t.lastCompleted ? formatDate(t.lastCompleted) : 'Never'} | Due: {formatDate(t.nextDue)}
                        </p>
                      </div>
                      <span className={cn('ml-3 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0', STATUS_COLORS[t.status])}>
                        {STATUS_LABELS[t.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );

  // ── Tasks Tab ──────────────────────────────────────────────────────────

  function TasksTab() {
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ComplianceCategory | '')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Categories</option>
              {(Object.keys(CATEGORY_LABELS) as ComplianceCategory[]).map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">{tasks.length} tasks</span>
        </div>

        {/* Tasks table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Completed</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      task.status === 'overdue' && 'border-l-4 border-l-red-500',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{task.title}</p>
                        <p className={cn('text-xs mt-0.5', PRIORITY_COLORS[task.priority])}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} priority
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium rounded-full border', CATEGORY_COLORS[task.category])}>
                        {CATEGORY_LABELS[task.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{task.frequency.replace('_', '-')}</td>
                    <td className="px-4 py-3 text-gray-600">{task.lastCompleted ? formatDate(task.lastCompleted) : <span className="text-gray-400">Never</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(task.nextDue)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium rounded-full', STATUS_COLORS[task.status])}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{task.assignee}</td>
                    <td className="px-4 py-3">
                      {task.status !== 'compliant' && (
                        <button
                          onClick={() => {
                            setCompletingTask(task);
                            setCompletionDate(new Date().toISOString().split('T')[0]);
                            setEvidenceNotes('');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle2 size={13} />
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No tasks match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Training Tab ───────────────────────────────────────────────────────

  function TrainingTab() {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{training.length} training records</p>
          <button
            onClick={() => setShowAddTraining(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            Add Training
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Training Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {training.map((rec) => (
                  <tr
                    key={rec.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      rec.status === 'expired' && 'bg-red-50/40',
                      rec.status === 'expiring_soon' && 'bg-amber-50/40',
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">{rec.staffName}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{rec.staffRole}</td>
                    <td className="px-4 py-3 text-gray-800">{rec.trainingType}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(rec.completedDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(rec.expiryDate)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium rounded-full', TRAINING_STATUS_COLORS[rec.status])}>
                        {TRAINING_STATUS_LABELS[rec.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{rec.certificateRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ── Expiry Alerts Tab ──────────────────────────────────────────────────

  function ExpiryTab() {
    return (
      <div className="space-y-3">
        {alerts.length === 0 && (
          <div className="card p-12 text-center">
            <CheckCircle2 size={40} className="mx-auto text-green-400 mb-3" />
            <p className="text-gray-500 text-sm">No upcoming expirations in the next 90 days.</p>
          </div>
        )}

        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'card p-4 flex items-center gap-4',
              alert.urgency === '30_days' && 'border-l-4 border-l-red-500',
              alert.urgency === '60_days' && 'border-l-4 border-l-amber-500',
              alert.urgency === '90_days' && 'border-l-4 border-l-blue-400',
            )}
          >
            <div className={cn('p-2 rounded-lg flex-shrink-0', alert.type === 'task' ? 'bg-indigo-50' : 'bg-purple-50')}>
              {alert.type === 'task' ? (
                <ClipboardCheck size={18} className="text-indigo-600" />
              ) : (
                <GraduationCap size={18} className="text-purple-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {alert.type === 'task' ? 'Compliance Task' : 'Training Certification'} — {alert.assignee}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs text-gray-500">Due</p>
                <p className="text-sm font-medium text-gray-700">{formatDate(alert.dueDate)}</p>
              </div>
              <span className={cn('px-2.5 py-1 text-xs font-bold rounded-full tabular-nums', urgencyBadge(alert.urgency))}>
                {alert.daysUntilDue}d
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Audit Reports Tab ──────────────────────────────────────────────────

  function AuditsTab() {
    return (
      <div className="space-y-4">
        {/* Generate buttons */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Generate Audit Report</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { type: 'hipaa', label: 'HIPAA Audit', color: 'bg-blue-600 hover:bg-blue-700' },
              { type: 'osha', label: 'OSHA Audit', color: 'bg-amber-600 hover:bg-amber-700' },
              { type: 'infection_control', label: 'Infection Control Audit', color: 'bg-emerald-600 hover:bg-emerald-700' },
              { type: 'full', label: 'Full Compliance Audit', color: 'bg-indigo-600 hover:bg-indigo-700' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleGenerateAudit(item.type)}
                disabled={generatingAudit !== null}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50',
                  item.color,
                )}
              >
                {generatingAudit === item.type ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileText size={14} />
                )}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Past audits */}
        {audits.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Audit History</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setViewingAudit(audit)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <FileText size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{audit.type.replace('_', ' ')} Audit</p>
                      <p className="text-xs text-gray-500">{formatDate(audit.generatedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn('text-lg font-bold tabular-nums', scoreColor(audit.overallScore))}>
                      {audit.overallScore}%
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {audits.length === 0 && (
          <div className="card p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No audit reports yet. Generate your first audit above.</p>
          </div>
        )}
      </div>
    );
  }
}
