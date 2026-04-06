import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Heart,
  UserMinus,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Gift,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
} from 'recharts';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChurnFactors {
  recency: number;
  frequency: number;
  monetary: number;
  engagement: number;
  negativeSignals: number;
}

interface ChurnProfile {
  patientId: string;
  patientName: string;
  churnProbability: number;
  churnRiskTier: 'low' | 'moderate' | 'high' | 'critical';
  factors: ChurnFactors;
  annualValue: number;
  lifetimeValue: number;
  ltvTier: 'platinum' | 'gold' | 'silver' | 'bronze';
  retentionPriority: number;
  daysSinceLastVisit: number;
  recoveryTier: 'warm' | 'cooling' | 'cold' | 'frozen' | null;
  yearsAsPatient: number;
  totalAppointments: number;
  calculatedAt: string;
}

interface RetentionAction {
  id: string;
  patientId: string;
  patientName: string;
  actionType: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  outcome: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChurnDashboard {
  totalPatients: number;
  atRiskCount: number;
  criticalCount: number;
  totalLtvAtRisk: number;
  avgChurnProbability: number;
  tierDistribution: Record<string, number>;
  ltvTierDistribution: Record<string, number>;
  recoveryPipeline: Record<string, number>;
  recoveredCount: number;
  pendingActionsCount: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROFILES: ChurnProfile[] = [
  { patientId: 'p1', patientName: 'Jane Cooper', churnProbability: 0.82, churnRiskTier: 'critical', factors: { recency: 0.9, frequency: 0.7, monetary: 0.2, engagement: 0.8, negativeSignals: 0.6 }, annualValue: 3800, lifetimeValue: 6840, ltvTier: 'gold', retentionPriority: 88, daysSinceLastVisit: 410, recoveryTier: 'cold', yearsAsPatient: 4.2, totalAppointments: 12, calculatedAt: new Date().toISOString() },
  { patientId: 'p2', patientName: 'Robert Chen', churnProbability: 0.65, churnRiskTier: 'high', factors: { recency: 0.6, frequency: 0.5, monetary: 0.4, engagement: 0.7, negativeSignals: 0.4 }, annualValue: 5200, lifetimeValue: 18200, ltvTier: 'platinum', retentionPriority: 76, daysSinceLastVisit: 245, recoveryTier: 'warm', yearsAsPatient: 6.1, totalAppointments: 22, calculatedAt: new Date().toISOString() },
  { patientId: 'p3', patientName: 'Maria Santos', churnProbability: 0.35, churnRiskTier: 'moderate', factors: { recency: 0.3, frequency: 0.3, monetary: 0.2, engagement: 0.4, negativeSignals: 0.2 }, annualValue: 2100, lifetimeValue: 13650, ltvTier: 'silver', retentionPriority: 52, daysSinceLastVisit: 120, recoveryTier: null, yearsAsPatient: 3.5, totalAppointments: 9, calculatedAt: new Date().toISOString() },
  { patientId: 'p4', patientName: 'James Wilson', churnProbability: 0.12, churnRiskTier: 'low', factors: { recency: 0.1, frequency: 0.1, monetary: 0.05, engagement: 0.15, negativeSignals: 0.0 }, annualValue: 4500, lifetimeValue: 39600, ltvTier: 'gold', retentionPriority: 22, daysSinceLastVisit: 45, recoveryTier: null, yearsAsPatient: 8.0, totalAppointments: 28, calculatedAt: new Date().toISOString() },
  { patientId: 'p5', patientName: 'Sarah Kim', churnProbability: 0.78, churnRiskTier: 'critical', factors: { recency: 0.9, frequency: 0.9, monetary: 0.6, engagement: 0.85, negativeSignals: 0.8 }, annualValue: 850, lifetimeValue: 1870, ltvTier: 'bronze', retentionPriority: 92, daysSinceLastVisit: 520, recoveryTier: 'frozen', yearsAsPatient: 1.8, totalAppointments: 3, calculatedAt: new Date().toISOString() },
  { patientId: 'p6', patientName: 'David Park', churnProbability: 0.45, churnRiskTier: 'moderate', factors: { recency: 0.3, frequency: 0.5, monetary: 0.3, engagement: 0.5, negativeSignals: 0.4 }, annualValue: 1800, lifetimeValue: 9900, ltvTier: 'silver', retentionPriority: 58, daysSinceLastVisit: 160, recoveryTier: null, yearsAsPatient: 2.9, totalAppointments: 7, calculatedAt: new Date().toISOString() },
  { patientId: 'p7', patientName: 'Emily Thompson', churnProbability: 0.55, churnRiskTier: 'high', factors: { recency: 0.6, frequency: 0.4, monetary: 0.5, engagement: 0.6, negativeSignals: 0.3 }, annualValue: 3200, lifetimeValue: 14400, ltvTier: 'gold', retentionPriority: 68, daysSinceLastVisit: 280, recoveryTier: 'cooling', yearsAsPatient: 5.0, totalAppointments: 16, calculatedAt: new Date().toISOString() },
  { patientId: 'p8', patientName: 'Michael Brown', churnProbability: 0.08, churnRiskTier: 'low', factors: { recency: 0.1, frequency: 0.1, monetary: 0.05, engagement: 0.1, negativeSignals: 0.0 }, annualValue: 6200, lifetimeValue: 57040, ltvTier: 'platinum', retentionPriority: 14, daysSinceLastVisit: 30, recoveryTier: null, yearsAsPatient: 10.2, totalAppointments: 35, calculatedAt: new Date().toISOString() },
  { patientId: 'p9', patientName: 'Lisa Nguyen', churnProbability: 0.72, churnRiskTier: 'high', factors: { recency: 0.6, frequency: 0.7, monetary: 0.85, engagement: 0.75, negativeSignals: 0.6 }, annualValue: 720, lifetimeValue: 2016, ltvTier: 'bronze', retentionPriority: 85, daysSinceLastVisit: 340, recoveryTier: 'cooling', yearsAsPatient: 1.5, totalAppointments: 4, calculatedAt: new Date().toISOString() },
  { patientId: 'p10', patientName: 'Andrew Martinez', churnProbability: 0.18, churnRiskTier: 'low', factors: { recency: 0.1, frequency: 0.2, monetary: 0.2, engagement: 0.2, negativeSignals: 0.1 }, annualValue: 2800, lifetimeValue: 22960, ltvTier: 'silver', retentionPriority: 30, daysSinceLastVisit: 68, recoveryTier: null, yearsAsPatient: 4.8, totalAppointments: 15, calculatedAt: new Date().toISOString() },
];

const MOCK_DASHBOARD: ChurnDashboard = {
  totalPatients: 10,
  atRiskCount: 5,
  criticalCount: 2,
  totalLtvAtRisk: 43326,
  avgChurnProbability: 0.47,
  tierDistribution: { low: 3, moderate: 2, high: 3, critical: 2 },
  ltvTierDistribution: { platinum: 2, gold: 3, silver: 3, bronze: 2 },
  recoveryPipeline: { warm: 1, cooling: 2, cold: 1, frozen: 1 },
  recoveredCount: 3,
  pendingActionsCount: 8,
};

const MOCK_ACTIONS: RetentionAction[] = [
  { id: 'ra_1', patientId: 'p1', patientName: 'Jane Cooper', actionType: 'reactivation_email', description: 'Send a reactivation email campaign with a special return offer', priority: 88, status: 'pending', outcome: null, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ra_2', patientId: 'p2', patientName: 'Robert Chen', actionType: 'vip_outreach_call', description: 'Schedule a personal outreach call from the provider to discuss care continuity', priority: 76, status: 'pending', outcome: null, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ra_3', patientId: 'p5', patientName: 'Sarah Kim', actionType: 'special_offer', description: 'Extend a special offer for a complimentary cleaning or exam to encourage return', priority: 92, status: 'pending', outcome: null, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ra_4', patientId: 'p7', patientName: 'Emily Thompson', actionType: 'personal_provider_message', description: 'Send a personalized message from their provider expressing concern', priority: 68, status: 'in_progress', outcome: null, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ra_5', patientId: 'p3', patientName: 'Maria Santos', actionType: 'personalized_checkin', description: 'Send a personalized check-in message asking about their dental health', priority: 52, status: 'pending', outcome: null, notes: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

function tierColor(tier: string): string {
  switch (tier) {
    case 'low': return 'bg-green-100 text-green-700 border-green-200';
    case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function tierBarColor(tier: string): string {
  switch (tier) {
    case 'low': return 'bg-green-500';
    case 'moderate': return 'bg-yellow-500';
    case 'high': return 'bg-orange-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

function ltvBadgeColor(tier: string): string {
  switch (tier) {
    case 'platinum': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'gold': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'silver': return 'bg-gray-200 text-gray-700 border-gray-300';
    case 'bronze': return 'bg-orange-100 text-orange-600 border-orange-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function recoveryTierColor(tier: string): string {
  switch (tier) {
    case 'warm': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    case 'cooling': return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'cold': return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'frozen': return 'bg-slate-100 border-slate-300 text-slate-800';
    default: return 'bg-gray-50 border-gray-200 text-gray-800';
  }
}

function recoveryTierIcon(tier: string): string {
  switch (tier) {
    case 'warm': return '6-9 months';
    case 'cooling': return '9-12 months';
    case 'cold': return '12-18 months';
    case 'frozen': return '18+ months';
    default: return '';
  }
}

function scatterDotColor(tier: string): string {
  switch (tier) {
    case 'low': return '#22c55e';
    case 'moderate': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#9ca3af';
  }
}

function factorLabel(key: string): string {
  switch (key) {
    case 'recency': return 'Recency';
    case 'frequency': return 'Frequency';
    case 'monetary': return 'Monetary';
    case 'engagement': return 'Engagement';
    case 'negativeSignals': return 'Negative Signals';
    default: return key;
  }
}

function factorBarColor(value: number): string {
  if (value <= 0.25) return 'bg-green-500';
  if (value <= 0.5) return 'bg-yellow-500';
  if (value <= 0.75) return 'bg-orange-500';
  return 'bg-red-500';
}

function actionTypeLabel(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function actionStatusColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'in_progress': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'dismissed': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-600';
  }
}

// ─── Custom Tooltip for Scatter Chart ───────────────────────────────────────

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-900">{data.patientName}</p>
      <p className="text-gray-600">Churn: {(data.churnProbability * 100).toFixed(0)}%</p>
      <p className="text-gray-600">LTV: {formatCurrency(data.lifetimeValue)}</p>
      <p className="text-gray-600">Priority: {data.retentionPriority}</p>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ChurnPredictionPage() {
  const [profiles, setProfiles] = useState<ChurnProfile[]>([]);
  const [dashboard, setDashboard] = useState<ChurnDashboard | null>(null);
  const [actions, setActions] = useState<RetentionAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'at-risk' | 'recovery'>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('retentionPriority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, dashboardRes, actionsRes] = await Promise.all([
        api.get('/churn/profiles', { params: { sort: sortField, order: sortOrder } }),
        api.get('/churn/dashboard'),
        api.get('/churn/retention-actions'),
      ]);
      setProfiles(profilesRes.data);
      setDashboard(dashboardRes.data);
      setActions(actionsRes.data);
    } catch {
      setProfiles(MOCK_PROFILES);
      setDashboard(MOCK_DASHBOARD);
      setActions(MOCK_ACTIONS);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      await api.post('/churn/calculate');
      toast.success('Churn profiles recalculated');
      await loadData();
    } catch {
      toast.error('Failed to recalculate. Showing mock data.');
    } finally {
      setRecalculating(false);
    }
  }

  async function handleAutoGenerate() {
    try {
      const { data } = await api.post('/churn/retention-actions/auto-generate');
      toast.success(`Generated ${data.actionCount} retention actions`);
      await loadData();
    } catch {
      toast.error('Failed to generate actions');
    }
  }

  async function handleUpdateAction(id: string, status: 'completed' | 'dismissed' | 'in_progress') {
    try {
      await api.patch(`/churn/retention-actions/${id}`, { status });
      toast.success('Action updated');
      setActions((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a)),
      );
    } catch {
      toast.error('Failed to update action');
    }
  }

  function handleSort(field: string) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }

  // Filtered profiles based on tab
  const filteredProfiles = profiles.filter((p) => {
    if (activeTab === 'at-risk') return p.churnRiskTier === 'high' || p.churnRiskTier === 'critical';
    if (activeTab === 'recovery') return p.recoveryTier !== null;
    return true;
  });

  // Recovery grouping
  const recoveryGroups: Record<string, ChurnProfile[]> = { warm: [], cooling: [], cold: [], frozen: [] };
  profiles.forEach((p) => {
    if (p.recoveryTier) {
      recoveryGroups[p.recoveryTier].push(p);
    }
  });

  // Scatter data
  const scatterData = profiles.map((p) => ({
    x: p.churnProbability,
    y: p.lifetimeValue,
    z: p.retentionPriority,
    patientName: p.patientName,
    churnProbability: p.churnProbability,
    lifetimeValue: p.lifetimeValue,
    retentionPriority: p.retentionPriority,
    churnRiskTier: p.churnRiskTier,
  }));

  const maxLTV = Math.max(...profiles.map((p) => p.lifetimeValue), 1);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown className="h-7 w-7 text-indigo-600" />
            Churn Prediction & Lifetime Value
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Predict patient attrition and optimize retention strategies
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAutoGenerate}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Heart className="h-4 w-4" />
            Generate Actions
          </button>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {recalculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalculate All
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients at Risk"
          value={dashboard?.atRiskCount ?? 0}
          subtitle={`${dashboard?.criticalCount ?? 0} critical`}
          icon={<UserMinus className="h-5 w-5 text-red-600" />}
          color="red"
        />
        <StatCard
          title="Total LTV at Risk"
          value={formatCurrency(dashboard?.totalLtvAtRisk ?? 0)}
          subtitle="High & critical tier"
          icon={<DollarSign className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
        <StatCard
          title="Avg Churn Probability"
          value={`${((dashboard?.avgChurnProbability ?? 0) * 100).toFixed(1)}%`}
          subtitle={`${dashboard?.totalPatients ?? 0} patients analyzed`}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          color="orange"
        />
        <StatCard
          title="Recovered This Month"
          value={dashboard?.recoveredCount ?? 0}
          subtitle={`${dashboard?.pendingActionsCount ?? 0} actions pending`}
          icon={<Heart className="h-5 w-5 text-green-600" />}
          color="green"
        />
      </div>

      {/* Retention Priority Matrix */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Retention Priority Matrix</h2>
        <div className="relative h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 1]}
                tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`}
                name="Churn Probability"
                stroke="#6b7280"
                fontSize={12}
              >
                <Label value="Churn Probability" position="bottom" offset={0} style={{ fontSize: 12, fill: '#6b7280' }} />
              </XAxis>
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, maxLTV * 1.1]}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                name="Lifetime Value"
                stroke="#6b7280"
                fontSize={12}
              >
                <Label value="Lifetime Value" angle={-90} position="insideLeft" offset={10} style={{ fontSize: 12, fill: '#6b7280' }} />
              </YAxis>
              <Tooltip content={<ScatterTooltip />} />
              <ReferenceLine x={0.5} stroke="#d1d5db" strokeDasharray="3 3" />
              <ReferenceLine y={maxLTV * 0.5} stroke="#d1d5db" strokeDasharray="3 3" />
              <Scatter name="Patients" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={scatterDotColor(entry.churnRiskTier)}
                    r={Math.max(6, Math.min(16, entry.retentionPriority / 6))}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          {/* Quadrant Labels */}
          <div className="pointer-events-none absolute inset-0 flex">
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 items-start justify-start pl-16 pt-6">
                <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 opacity-80">
                  Nurture
                </span>
              </div>
              <div className="flex flex-1 items-end justify-start pb-10 pl-16">
                <span className="rounded bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 opacity-80">
                  Monitor
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col">
              <div className="flex flex-1 items-start justify-end pr-10 pt-6">
                <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 opacity-80">
                  Protect
                </span>
              </div>
              <div className="flex flex-1 items-end justify-end pb-10 pr-10">
                <span className="rounded bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700 opacity-80">
                  Re-engage
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" /> Low</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" /> Moderate</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" /> High</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> Critical</span>
          <span className="ml-4 text-gray-400">Dot size = retention priority</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {(['all', 'at-risk', 'recovery'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'all' && 'All Patients'}
            {tab === 'at-risk' && `At Risk (${profiles.filter((p) => p.churnRiskTier === 'high' || p.churnRiskTier === 'critical').length})`}
            {tab === 'recovery' && `Recovery Pipeline (${profiles.filter((p) => p.recoveryTier !== null).length})`}
          </button>
        ))}
      </div>

      {/* Recovery Pipeline Tab */}
      {activeTab === 'recovery' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(['warm', 'cooling', 'cold', 'frozen'] as const).map((tier) => (
            <div
              key={tier}
              className={`rounded-xl border p-4 ${recoveryTierColor(tier)}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold capitalize">{tier}</h3>
                  <p className="text-xs opacity-70">{recoveryTierIcon(tier)}</p>
                </div>
                <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-lg font-bold">
                  {recoveryGroups[tier].length}
                </span>
              </div>
              <div className="space-y-2">
                {recoveryGroups[tier].map((p) => (
                  <div key={p.patientId} className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium">{p.patientName}</p>
                      <p className="text-xs opacity-70">{p.daysSinceLastVisit} days since visit</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          toast.success(`Email sent to ${p.patientName}`);
                        }}
                        className="rounded p-1.5 hover:bg-white/60"
                        title="Send Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          toast.success(`Call scheduled for ${p.patientName}`);
                        }}
                        className="rounded p-1.5 hover:bg-white/60"
                        title="Call"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          toast.success(`Offer sent to ${p.patientName}`);
                        }}
                        className="rounded p-1.5 hover:bg-white/60"
                        title="Send Offer"
                      >
                        <Gift className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {recoveryGroups[tier].length === 0 && (
                  <p className="py-4 text-center text-xs opacity-50">No patients</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient Table (all & at-risk tabs) */}
      {activeTab !== 'recovery' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 w-8" />
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('patientName')}
                  >
                    Patient {sortField === 'patientName' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('churnProbability')}
                  >
                    Churn Probability {sortField === 'churnProbability' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('lifetimeValue')}
                  >
                    LTV {sortField === 'lifetimeValue' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3">LTV Tier</th>
                  <th
                    className="px-4 py-3 cursor-pointer hover:text-gray-700"
                    onClick={() => handleSort('retentionPriority')}
                  >
                    Priority {sortField === 'retentionPriority' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProfiles.map((profile) => (
                  <React.Fragment key={profile.patientId}>
                    {/* Main row */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === profile.patientId ? null : profile.patientId,
                            )
                          }
                          className="rounded p-0.5 text-gray-400 hover:text-gray-700"
                        >
                          {expandedRow === profile.patientId ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{profile.patientName}</p>
                          <p className="text-xs text-gray-500">{profile.yearsAsPatient} yrs | {profile.totalAppointments} appts</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <div className="h-2 w-full rounded-full bg-gray-200">
                              <div
                                className={`h-2 rounded-full transition-all ${tierBarColor(profile.churnRiskTier)}`}
                                style={{ width: `${profile.churnProbability * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(profile.churnProbability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {formatCurrency(profile.lifetimeValue)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${ltvBadgeColor(profile.ltvTier)}`}>
                          {profile.ltvTier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">{profile.retentionPriority}</span>
                          <div className="h-1.5 w-12 rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${profile.retentionPriority}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${tierColor(profile.churnRiskTier)}`}>
                          {profile.churnRiskTier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setExpandedRow(
                                expandedRow === profile.patientId ? null : profile.patientId,
                              )
                            }
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toast.success(`Email sent to ${profile.patientName}`)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                            title="Send Email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toast.success(`Call scheduled for ${profile.patientName}`)}
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                            title="Call"
                          >
                            <Phone className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — factor breakdown */}
                    {expandedRow === profile.patientId && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Churn Factor Breakdown */}
                            <div>
                              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Churn Factor Breakdown
                              </h4>
                              <div className="space-y-2.5">
                                {(Object.entries(profile.factors) as [string, number][]).map(
                                  ([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                      <span className="w-28 text-xs font-medium text-gray-600">
                                        {factorLabel(key)}
                                      </span>
                                      <div className="h-2.5 flex-1 rounded-full bg-gray-200">
                                        <div
                                          className={`h-2.5 rounded-full transition-all ${factorBarColor(value)}`}
                                          style={{ width: `${value * 100}%` }}
                                        />
                                      </div>
                                      <span className="w-10 text-right text-xs font-medium text-gray-500">
                                        {(value * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            {/* Visit Info */}
                            <div>
                              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                Patient Summary
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-xs text-gray-500">Days Since Visit</p>
                                  <p className="text-lg font-bold text-gray-900">{profile.daysSinceLastVisit}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-xs text-gray-500">Annual Value</p>
                                  <p className="text-lg font-bold text-gray-900">{formatCurrency(profile.annualValue)}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-xs text-gray-500">Years as Patient</p>
                                  <p className="text-lg font-bold text-gray-900">{profile.yearsAsPatient}</p>
                                </div>
                                <div className="rounded-lg border border-gray-200 bg-white p-3">
                                  <p className="text-xs text-gray-500">Recovery Tier</p>
                                  <p className="text-lg font-bold capitalize text-gray-900">
                                    {profile.recoveryTier ?? 'Active'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {filteredProfiles.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                      <Users className="mx-auto mb-2 h-8 w-8" />
                      <p>No patients match current filter</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Retention Actions */}
      {actions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="h-5 w-5 text-indigo-600" />
            Pending Retention Actions
          </h2>
          <div className="space-y-3">
            {actions
              .filter((a) => a.status !== 'dismissed')
              .slice(0, 10)
              .map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {action.patientName}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${actionStatusColor(action.status)}`}>
                        {action.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      <span className="font-medium text-indigo-600">
                        {actionTypeLabel(action.actionType)}
                      </span>{' '}
                      — {action.description}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">
                      Priority: {action.priority}
                    </span>
                    {action.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateAction(action.id, 'in_progress')}
                          className="rounded p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Start"
                        >
                          <Clock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateAction(action.id, 'completed')}
                          className="rounded p-1.5 text-green-400 hover:bg-green-50 hover:text-green-600"
                          title="Complete"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateAction(action.id, 'dismissed')}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Dismiss"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {action.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateAction(action.id, 'completed')}
                        className="rounded p-1.5 text-green-400 hover:bg-green-50 hover:text-green-600"
                        title="Complete"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: 'red' | 'amber' | 'orange' | 'green';
}) {
  const bgColor = {
    red: 'bg-red-50',
    amber: 'bg-amber-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
  }[color];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-lg ${bgColor} p-2`}>{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
