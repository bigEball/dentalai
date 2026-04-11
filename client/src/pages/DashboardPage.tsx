import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  DollarSign,
  RefreshCw,
  FileText,
  ArrowRight,
  TrendingUp,
  CalendarCheck,
  Send,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';

import { getDashboardStats } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import ActivityFeed from '@/components/ui/ActivityFeed';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import OpenDentalLink from '@/components/ui/OpenDentalLink';
import { useAuth } from '@/context/AuthContext';
import { ROLES, resolveRole } from '@/lib/roles';

const MOCK_REVENUE = [
  { month: 'Sep', revenue: 38200 },
  { month: 'Oct', revenue: 42100 },
  { month: 'Nov', revenue: 39800 },
  { month: 'Dec', revenue: 35500 },
  { month: 'Jan', revenue: 44200 },
  { month: 'Feb', revenue: 47600 },
  { month: 'Mar', revenue: 51300 },
];

const MOCK_STATS: DashboardStats = {
  totalPendingClaims: 12,
  totalOutstandingBalance: 24850.0,
  patientsOverdueForHygiene: 47,
  notesAwaitingApproval: 8,
  recentActivity: [
    {
      id: '1',
      action: 'approved',
      entityType: 'note',
      entityId: 'n1',
      description: 'Clinical note approved for Jane Cooper',
      userId: 'demo-user',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: '2',
      action: 'submitted',
      entityType: 'insurance_claim',
      entityId: 'c1',
      description: 'Claim #1042 submitted to BlueCross for $480',
      userId: 'demo-user',
      timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    },
    {
      id: '3',
      action: 'verified',
      entityType: 'insurance_plan',
      entityId: 'p1',
      description: 'Insurance verified for Robert Chen — Aetna PPO',
      userId: 'demo-user',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    {
      id: '4',
      action: 'sent',
      entityType: 'recall',
      entityId: 'r1',
      description: 'Recall text sent to Maria Garcia (211 days overdue)',
      userId: 'demo-user',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: '5',
      action: 'generated',
      entityType: 'note',
      entityId: 'n2',
      description: 'AI note generated for Tom Wilson — D1110 prophylaxis',
      userId: 'demo-user',
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
  ],
  claimsByStatus: {
    draft: 4,
    pending: 3,
    submitted: 5,
    approved: 18,
    denied: 2,
    resubmit: 1,
  },
  balancesByCollectionStatus: {
    current: 8,
    overdue_30: 5,
    overdue_60: 3,
    overdue_90: 2,
    collections: 1,
  },
  recoveredRevenueThisMonth: 51300,
  treatmentPlansProposed: 6,
  pendingPreAuths: 3,
  lowStockItems: 2,
  pendingFollowUps: 4,
  pendingForms: 1,
  activePaymentPlans: 5,
  openReferrals: 2,
};

const MOCK_TOP_BALANCES = [
  { id: 'b1', patientId: 'p5', name: 'Michael Torres', amount: 2840.0, status: 'overdue_90', daysOverdue: 94, dueDate: '2024-01-01' },
  { id: 'b2', patientId: 'p7', name: 'Sarah Kim', amount: 1920.5, status: 'overdue_60', daysOverdue: 67, dueDate: '2024-01-15' },
  { id: 'b3', patientId: 'p8', name: 'David Park', amount: 1450.0, status: 'overdue_30', daysOverdue: 38, dueDate: '2024-02-01' },
  { id: 'b4', patientId: 'p9', name: 'Amanda Chen', amount: 980.75, status: 'overdue_30', daysOverdue: 31, dueDate: '2024-02-10' },
  { id: 'b5', patientId: 'p10', name: 'James Wilson', amount: 750.0, status: 'current', daysOverdue: 0, dueDate: '2024-03-01' },
];

function claimsChartData(claimsByStatus: Record<string, number>) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    submitted: 'Submitted',
    approved: 'Approved',
    denied: 'Denied',
    resubmit: 'Resubmit',
  };
  return Object.entries(claimsByStatus).map(([key, value]) => ({
    name: labels[key] ?? key,
    count: value,
    fill:
      key === 'approved'
        ? '#22c55e'
        : key === 'denied'
        ? '#ef4444'
        : key === 'submitted'
        ? '#6366f1'
        : key === 'pending'
        ? '#f59e0b'
        : '#94a3b8',
  }));
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function overdueRowColor(status: string): string {
  if (status === 'overdue_90' || status === 'collections') return 'border-l-4 border-l-red-400 bg-red-50/40';
  if (status === 'overdue_60') return 'border-l-4 border-l-orange-400 bg-orange-50/30';
  if (status === 'overdue_30') return 'border-l-4 border-l-amber-400 bg-amber-50/20';
  return 'border-l-4 border-l-green-400';
}

function overdueTextColor(daysOverdue: number): string {
  if (daysOverdue >= 90) return 'text-red-600 font-bold';
  if (daysOverdue >= 60) return 'text-orange-600 font-semibold';
  if (daysOverdue >= 30) return 'text-amber-600 font-medium';
  return 'text-gray-500';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const currentRole = resolveRole(user?.role);
  const roleConfig = ROLES[currentRole];
  const displayName = user?.name?.replace('Dr. ', '') ?? roleConfig.userName;

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then(s => { if (!cancelled) setStats(s); })
      .catch(() => { if (!cancelled) setStats(MOCK_STATS); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <FullPageSpinner />;

  const s = stats ?? MOCK_STATS;
  const chartData = claimsChartData(s.claimsByStatus);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">{getTodayFormatted()}</p>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Open your dashboard each morning to see today's key metrics at a glance</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Review pending items — notes to approve, open referrals, and pre-auths</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Click any stat card to jump directly to that module and take action</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Track production and activity trends throughout the day</p>
          </div>
        </div>
      </div>

      {/* Stat cards — role-tailored */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* ── Doctor stat cards ── */}
        {currentRole === 'doctor' && (
          <button
            onClick={() => navigate('/notes')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Notes to Review
                </span>
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                  <FileText size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.notesAwaitingApproval}
              </p>
              <p className="mt-1 text-xs text-gray-400">Pending provider approval</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500">
                <ClipboardList size={13} />
                Oldest: 2 days ago
              </p>
            </div>
          </button>
        )}

        {currentRole === 'doctor' && (
          <button
            onClick={() => navigate('/referrals')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Open Referrals
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                  <Shield size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.openReferrals}
              </p>
              <p className="mt-1 text-xs text-gray-400">Awaiting specialist reports</p>
            </div>
          </button>
        )}

        {currentRole === 'doctor' && (
          <button
            onClick={() => navigate('/treatment-plans')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Plans Proposed
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <ClipboardList size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.treatmentPlansProposed}
              </p>
              <p className="mt-1 text-xs text-gray-400">Treatment plans awaiting acceptance</p>
            </div>
          </button>
        )}

        {currentRole === 'doctor' && (
          <button
            onClick={() => navigate('/decision-support')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Clinical Alerts
                </span>
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <RefreshCw size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                5
              </p>
              <p className="mt-1 text-xs text-gray-400">AI treatment recommendations</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500">
                <TrendingUp size={13} />
                2 urgent
              </p>
            </div>
          </button>
        )}

        {/* ── Office stat cards ── */}
        {currentRole === 'office' && (
          <button
            onClick={() => navigate('/insurance')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pending Claims
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                  <Shield size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.totalPendingClaims}
              </p>
              <p className="mt-1 text-xs text-gray-400">Awaiting submission or approval</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-red-500">
                <TrendingUp size={13} />
                +2 from last week
              </p>
            </div>
          </button>
        )}

        {currentRole === 'office' && (
          <button
            onClick={() => navigate('/billing')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Outstanding Balance
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <DollarSign size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(s.totalOutstandingBalance)}
              </p>
              <p className="mt-1 text-xs text-gray-400">Across all patients</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                <TrendingUp size={13} />
                {formatCurrency(s.recoveredRevenueThisMonth)} recovered this month
              </p>
            </div>
          </button>
        )}

        {currentRole === 'office' && (
          <button
            onClick={() => navigate('/recall')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Overdue Recalls
                </span>
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <RefreshCw size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.patientsOverdueForHygiene}
              </p>
              <p className="mt-1 text-xs text-gray-400">Patients past hygiene due date</p>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-green-600">
                <CalendarCheck size={13} />
                5 scheduled this week
              </p>
            </div>
          </button>
        )}

        {/* Office: Pending Forms */}
        {currentRole === 'office' && (
          <button
            onClick={() => navigate('/forms')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pending Forms
                </span>
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
                  <FileText size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.pendingForms}
              </p>
              <p className="mt-1 text-xs text-gray-400">Patient forms awaiting review</p>
            </div>
          </button>
        )}

        {/* Assistant: Low Stock Items */}
        {currentRole === 'assistant' && (
          <button
            onClick={() => navigate('/inventory')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Low Stock Alerts
                </span>
                <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
                  <Shield size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.lowStockItems}
              </p>
              <p className="mt-1 text-xs text-gray-400">Items below reorder level</p>
            </div>
          </button>
        )}

        {/* Assistant: Pending Follow-Ups */}
        {currentRole === 'assistant' && (
          <button
            onClick={() => navigate('/follow-ups')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pending Follow-Ups
                </span>
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                  <RefreshCw size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.pendingFollowUps}
              </p>
              <p className="mt-1 text-xs text-gray-400">Patient follow-ups to complete</p>
            </div>
          </button>
        )}

        {/* Assistant: Pending Forms */}
        {currentRole === 'assistant' && (
          <button
            onClick={() => navigate('/forms')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pending Forms
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
                  <FileText size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                {s.pendingForms}
              </p>
              <p className="mt-1 text-xs text-gray-400">Forms awaiting completion</p>
            </div>
          </button>
        )}

        {/* Assistant: Today's Schedule */}
        {currentRole === 'assistant' && (
          <button
            onClick={() => navigate('/smart-scheduling')}
            className="card p-6 text-left hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Schedule
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
                  <CalendarCheck size={20} />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">
                12
              </p>
              <p className="mt-1 text-xs text-gray-400">Appointments scheduled today</p>
            </div>
          </button>
        )}
      </div>

      {/* Charts row — doctor & office only */}
      {(currentRole === 'doctor' || currentRole === 'office') && (
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Revenue area chart */}
        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-400 mt-0.5">Monthly collections over the last 7 months</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
              <TrendingUp size={13} />
              +8.4% vs last month
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_REVENUE} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                contentStyle={{ fontSize: 13, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6366f1"
                strokeWidth={2.5}
                fill="url(#revenueGrad)"
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Claims bar chart */}
        <div className="card p-6 xl:col-span-2">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900">Claims Overview</h3>
            <p className="text-sm text-gray-400 mt-0.5">Current period by status</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 13, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      )}

      {/* Quick Actions — role-tailored */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* ── Doctor quick actions ── */}
          {currentRole === 'doctor' && (
            <button
              onClick={() => { navigate('/notes'); toast.success('Opening clinical notes...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-purple-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <Sparkles size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    Review AI Notes
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Approve AI-generated clinical notes</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'doctor' && (
            <button
              onClick={() => { navigate('/referrals'); toast.success('Opening referrals...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <Shield size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    Manage Referrals
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Review specialist reports and referrals</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'doctor' && (
            <button
              onClick={() => { navigate('/treatment-plans'); toast.success('Opening treatment plans...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <ClipboardList size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    Treatment Plans
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Review and create treatment plans</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'doctor' && (
            <button
              onClick={() => { navigate('/perio'); toast.success('Opening perio charting...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <Send size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                    Perio Charting
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Record and compare periodontal exams</p>
                </div>
              </div>
            </button>
          )}

          {/* ── Office quick actions ── */}
          {currentRole === 'office' && (
            <button
              onClick={() => { navigate('/insurance'); toast.success('Opening insurance verification...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <Shield size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    Verify Insurance
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Check coverage and eligibility</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'office' && (
            <button
              onClick={() => { navigate('/recall'); toast.success('Opening patient recall...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <Send size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                    Send Recall Reminders
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Reach out to overdue patients</p>
                </div>
              </div>
            </button>
          )}

          {/* Office only */}
          {currentRole === 'office' && (
            <button
              onClick={() => { navigate('/smart-scheduling'); toast.success('Opening scheduling...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-purple-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <Sparkles size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    Smart Scheduling
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">View today's schedule and predictions</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'office' && (
            <button
              onClick={() => { navigate('/communications'); toast.success('Opening messages...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <DollarSign size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    Patient Messages
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">View and respond to messages</p>
                </div>
              </div>
            </button>
          )}

          {/* Assistant */}
          {currentRole === 'assistant' && (
            <button
              onClick={() => { navigate('/inventory'); toast.success('Opening inventory...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                  <Shield size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    Check Inventory
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Review stock levels and reorder</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'assistant' && (
            <button
              onClick={() => { navigate('/procurement'); toast.success('Opening procurement...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-emerald-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <DollarSign size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    Purchase Orders
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Review and approve supply orders</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'assistant' && (
            <button
              onClick={() => { navigate('/compliance'); toast.success('Opening compliance...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
                  <Send size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                    Compliance Tasks
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Sterilization logs and OSHA tasks</p>
                </div>
              </div>
            </button>
          )}

          {currentRole === 'assistant' && (
            <button
              onClick={() => { navigate('/smart-scheduling'); toast.success('Opening schedule...'); }}
              className="card p-5 text-left hover:shadow-md hover:border-purple-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                  <Sparkles size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                    Today's Schedule
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Room prep and appointment list</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row — doctor & office only */}
      {(currentRole === 'doctor' || currentRole === 'office') && (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Top balances */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Top Overdue Balances</h3>
              <p className="text-sm text-gray-400 mt-0.5">Patients who need attention</p>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="btn-ghost text-xs"
            >
              View all balances <ArrowRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_TOP_BALANCES.map((b) => (
              <div
                key={b.id}
                className={`flex items-center justify-between px-6 py-4 ${overdueRowColor(b.status)} transition-colors hover:bg-gray-50/60`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">
                      {b.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                      <OpenDentalLink patientId={b.patientId} />
                    </div>
                    {b.daysOverdue > 0 ? (
                      <p className={`text-xs ${overdueTextColor(b.daysOverdue)}`}>
                        {b.daysOverdue} days overdue
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Due {formatDate(b.dueDate)}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-base font-bold text-gray-900 tabular-nums">
                    {formatCurrency(b.amount)}
                  </span>
                  <Badge status={b.status} variant="collection" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-400 mt-0.5">What happened today</p>
          </div>
          <div className="px-6 py-4">
            <ActivityFeed activities={s.recentActivity} />
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
