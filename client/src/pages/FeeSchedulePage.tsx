import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BadgeDollarSign,
  TrendingUp,
  AlertTriangle,
  FileText,
  BarChart3,
  Calculator,
  Loader2,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  X,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import axios from 'axios';

import { formatCurrency, cn } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeeScheduleSummary {
  id: string;
  name: string;
  type: string;
  payerName: string | null;
  effectiveDate: string;
  entryCount: number;
}

interface FeeEntry {
  id: string;
  scheduleId: string;
  code: string;
  description: string;
  category: string;
  feeAmount: number;
  ppoAllowedFee: number | null;
  annualVolume: number;
  ucrPercentile: number | null;
  writeOff: number | null;
  annualRevenue: number | null;
  annualWriteOff: number | null;
}

interface FeeScheduleDetail {
  id: string;
  name: string;
  type: string;
  payerName: string | null;
  entries: FeeEntry[];
}

interface OptimizationReport {
  id: string;
  scheduleId: string;
  scheduleName: string;
  generatedAt: string;
  totalAnnualRevenue: number;
  totalAnnualWriteOff: number;
  proceduresBelowP50: number;
  revenueOpportunity: number;
  modeledRevenue: { percentile: number; revenue: number; uplift: number }[];
  entryAnalysis: EntryAnalysis[];
}

interface EntryAnalysis {
  code: string;
  description: string;
  currentFee: number;
  ucrPercentile: number;
  feeAtP50: number;
  feeAtP75: number;
  feeAtP90: number;
  annualVolume: number;
  upliftAtP75: number;
  writeOff: number;
  flag: 'undercharging' | 'below_average' | 'competitive' | 'premium';
}

interface WriteOffAnalysis {
  byPayer: { payerName: string; totalWriteOff: number; procedureCount: number }[];
  details: {
    code: string;
    description: string;
    category: string;
    standardFee: number;
    ppoAllowedFee: number;
    writeOffPerUnit: number;
    annualVolume: number;
    annualWriteOff: number;
    payerName: string;
  }[];
}

interface RenegotiationBrief {
  id: string;
  text: string;
  payerName: string;
  procedureCount: number;
  totalAnnualImpact: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type SortKey =
  | 'code'
  | 'description'
  | 'currentFee'
  | 'ucrPercentile'
  | 'feeAtP50'
  | 'feeAtP75'
  | 'feeAtP90'
  | 'annualVolume'
  | 'writeOff'
  | 'upliftAtP75';

function percentileColor(pct: number): string {
  if (pct < 25) return 'bg-red-500';
  if (pct < 50) return 'bg-orange-500';
  if (pct < 75) return 'bg-amber-400';
  return 'bg-green-500';
}

function percentileTextColor(pct: number): string {
  if (pct < 25) return 'text-red-700';
  if (pct < 50) return 'text-orange-700';
  if (pct < 75) return 'text-amber-700';
  return 'text-green-700';
}

function flagBadge(flag: string): { label: string; color: string } {
  switch (flag) {
    case 'undercharging':
      return { label: 'Below Market', color: 'bg-red-50 text-red-700 border-red-200' };
    case 'below_average':
      return { label: 'Below Average', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'competitive':
      return { label: 'Competitive', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'premium':
      return { label: 'Premium', color: 'bg-green-50 text-green-700 border-green-200' };
    default:
      return { label: flag, color: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

const PERCENTILE_TARGETS = [
  { value: 50, label: '50th Percentile' },
  { value: 60, label: '60th Percentile' },
  { value: 75, label: '75th Percentile' },
  { value: 85, label: '85th Percentile' },
  { value: 90, label: '90th Percentile' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function FeeSchedulePage() {
  // Data state
  const [schedules, setSchedules] = useState<FeeScheduleSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [schedule, setSchedule] = useState<FeeScheduleDetail | null>(null);
  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [writeOffData, setWriteOffData] = useState<WriteOffAnalysis | null>(null);
  const [brief, setBrief] = useState<RenegotiationBrief | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [activeTab, setActiveTab] = useState<'fees' | 'writeoffs'>('fees');
  const [briefOpen, setBriefOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetPercentile, setTargetPercentile] = useState(75);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // ── Fetch schedules list ──────────────────────────────────────────────

  const loadSchedules = useCallback(async () => {
    try {
      const { data } = await api.get('/fee-schedules');
      setSchedules(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch {
      toast.error('Failed to load fee schedules');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // ── Fetch selected schedule detail ────────────────────────────────────

  const loadScheduleDetail = useCallback(async () => {
    if (!selectedId) return;
    try {
      const { data } = await api.get(`/fee-schedules/${selectedId}`);
      setSchedule(data);
    } catch {
      toast.error('Failed to load schedule details');
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) {
      loadScheduleDetail();
      setReport(null);
      setBrief(null);
    }
  }, [selectedId, loadScheduleDetail]);

  // ── Load write-off data ───────────────────────────────────────────────

  const loadWriteOffs = useCallback(async () => {
    try {
      const { data } = await api.get('/fee-schedules/write-off-analysis');
      setWriteOffData(data);
    } catch {
      // silently fail — non-critical
    }
  }, []);

  useEffect(() => {
    loadWriteOffs();
  }, [loadWriteOffs]);

  // ── Run analysis ──────────────────────────────────────────────────────

  const runAnalysis = async () => {
    if (!selectedId) return;
    setAnalyzing(true);
    try {
      const { data } = await api.post(`/fee-schedules/${selectedId}/analyze`);
      setSchedule(data);
      toast.success('UCR analysis complete');
      // Refresh write-offs too
      loadWriteOffs();
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Generate optimization report ──────────────────────────────────────

  const generateReport = async () => {
    if (!selectedId) return;
    setGeneratingReport(true);
    try {
      const { data } = await api.post(`/fee-schedules/${selectedId}/optimize`);
      setReport(data);
      // also refresh schedule (analysis runs as part of report)
      loadScheduleDetail();
      toast.success('Optimization report generated');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  // ── Generate renegotiation brief ──────────────────────────────────────

  const generateBrief = async () => {
    if (!selectedId) return;
    setGeneratingBrief(true);
    try {
      const { data } = await api.post(`/fee-schedules/${selectedId}/renegotiation-brief`);
      setBrief(data);
      setBriefOpen(true);
      toast.success('Renegotiation brief generated');
    } catch {
      toast.error('Failed to generate brief');
    } finally {
      setGeneratingBrief(false);
    }
  };

  // ── Copy brief to clipboard ───────────────────────────────────────────

  const copyBrief = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(brief.text);
      setCopied(true);
      toast.success('Brief copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // ── Summary stats ─────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!report) {
      // Derive from schedule entries if no report yet
      if (!schedule) return { revenue: 0, writeOff: 0, belowP50: 0, opportunity: 0 };

      const revenue = schedule.entries.reduce(
        (s, e) => s + (e.annualRevenue ?? (e.ppoAllowedFee ?? e.feeAmount) * e.annualVolume),
        0,
      );
      const writeOff = schedule.entries.reduce((s, e) => s + (e.annualWriteOff ?? 0), 0);
      const belowP50 = schedule.entries.filter((e) => e.ucrPercentile !== null && e.ucrPercentile < 50).length;

      return { revenue, writeOff, belowP50, opportunity: 0 };
    }

    return {
      revenue: report.totalAnnualRevenue,
      writeOff: report.totalAnnualWriteOff,
      belowP50: report.proceduresBelowP50,
      opportunity: report.revenueOpportunity,
    };
  }, [report, schedule]);

  // ── Sorted entries ────────────────────────────────────────────────────

  const sortedEntries = useMemo(() => {
    if (!report) return [];
    const entries = [...report.entryAnalysis];
    entries.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return entries;
  }, [report, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={13} className="text-gray-300 ml-0.5" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={13} className="text-indigo-600 ml-0.5" />
    ) : (
      <ChevronDown size={13} className="text-indigo-600 ml-0.5" />
    );
  };

  // ── Revenue impact chart data ─────────────────────────────────────────

  const revenueChartData = useMemo(() => {
    if (!report) return [];

    const current = report.totalAnnualRevenue;
    const targeted = report.modeledRevenue.find((m) => m.percentile === targetPercentile);

    return [
      { name: 'Current', revenue: current, fill: '#6366f1' },
      {
        name: `At ${targetPercentile}th Pctl`,
        revenue: targeted?.revenue ?? current,
        fill: '#10b981',
      },
    ];
  }, [report, targetPercentile]);

  const currentUplift = useMemo(() => {
    if (!report) return 0;
    const targeted = report.modeledRevenue.find((m) => m.percentile === targetPercentile);
    return targeted?.uplift ?? 0;
  }, [report, targetPercentile]);

  // ── Write-off chart data ──────────────────────────────────────────────

  const writeOffChartData = useMemo(() => {
    if (!writeOffData) return [];

    // Group by category
    const categoryMap: Record<string, Record<string, number>> = {};
    for (const row of writeOffData.details) {
      if (!categoryMap[row.category]) categoryMap[row.category] = {};
      if (!categoryMap[row.category][row.payerName]) categoryMap[row.category][row.payerName] = 0;
      categoryMap[row.category][row.payerName] += row.annualWriteOff;
    }

    return Object.entries(categoryMap).map(([category, payers]) => ({
      category,
      ...payers,
    }));
  }, [writeOffData]);

  const payerNames = useMemo(() => {
    if (!writeOffData) return [];
    return [...new Set(writeOffData.details.map((d) => d.payerName))];
  }, [writeOffData]);

  const PAYER_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899'];

  // ── Loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fee Schedule Optimization</h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyze your fees against UCR benchmarks, model revenue impact, and generate PPO renegotiation briefs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runAnalysis}
            disabled={analyzing || !selectedId}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {analyzing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Run Analysis
          </button>
          <button
            onClick={generateReport}
            disabled={generatingReport || !selectedId}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {generatingReport ? <Loader2 size={15} className="animate-spin" /> : <BarChart3 size={15} />}
            Optimize
          </button>
          <button
            onClick={generateBrief}
            disabled={generatingBrief || !selectedId}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {generatingBrief ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
            Renegotiation Brief
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">View your current fees alongside UCR benchmarks and PPO allowed amounts</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">See which procedures are priced below market rates and how much revenue you're leaving behind</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Model fee adjustments and preview the projected impact on annual revenue</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Generate PPO renegotiation briefs backed by data to support higher reimbursement rates</p>
          </div>
        </div>
      </div>

      {/* Fee Schedule Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Fee Schedule:</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.entryCount} procedures) {s.type === 'ppo' ? `— ${s.payerName}` : ''}
            </option>
          ))}
        </select>
        {schedule && (
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
            schedule.type === 'ppo'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-gray-100 text-gray-600 border-gray-200',
          )}>
            {schedule.type === 'ppo' ? 'PPO' : 'Standard'}
          </span>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Annual Revenue"
          value={formatCurrency(stats.revenue)}
          icon={<BadgeDollarSign size={20} />}
          iconColor="text-green-600 bg-green-50"
          subtitle="Based on current fees and volume"
        />
        <StatCard
          title="Total Write-Offs"
          value={formatCurrency(stats.writeOff)}
          icon={<TrendingUp size={20} />}
          iconColor="text-red-600 bg-red-50"
          subtitle="Annual PPO write-offs"
        />
        <StatCard
          title="Below 50th Percentile"
          value={stats.belowP50}
          icon={<AlertTriangle size={20} />}
          iconColor="text-orange-600 bg-orange-50"
          subtitle="Procedures below market rate"
          changeType={stats.belowP50 > 0 ? 'negative' : 'positive'}
          change={stats.belowP50 > 0 ? `${stats.belowP50} need attention` : 'All at market rate'}
        />
        <StatCard
          title="Revenue Opportunity"
          value={formatCurrency(stats.opportunity)}
          icon={<Calculator size={20} />}
          iconColor="text-indigo-600 bg-indigo-50"
          subtitle="Potential uplift to 75th percentile"
          changeType={stats.opportunity > 0 ? 'positive' : 'neutral'}
          change={stats.opportunity > 0 ? 'Available with fee optimization' : 'Run analysis to calculate'}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('fees')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'fees'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <BadgeDollarSign size={15} />
              Fee Analysis
            </span>
          </button>
          <button
            onClick={() => setActiveTab('writeoffs')}
            className={cn(
              'pb-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'writeoffs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <BarChart3 size={15} />
              Write-Off Analysis
            </span>
          </button>
        </nav>
      </div>

      {/* ─── Fee Analysis Tab ─────────────────────────────────────────────── */}
      {activeTab === 'fees' && (
        <>
          {!report && (
            <div className="card p-8 text-center">
              <Calculator size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                Click <strong>Run Analysis</strong> then <strong>Optimize</strong> to see fee analysis, UCR comparisons,
                and revenue modeling.
              </p>
            </div>
          )}

          {report && (
            <>
              {/* Fee Table */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Procedure Fee Analysis ({report.entryAnalysis.length} procedures)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        {[
                          { key: 'code' as SortKey, label: 'CDT Code' },
                          { key: 'description' as SortKey, label: 'Description' },
                          { key: 'currentFee' as SortKey, label: 'Your Fee' },
                          { key: 'feeAtP50' as SortKey, label: 'UCR 50th' },
                          { key: 'feeAtP75' as SortKey, label: 'UCR 75th' },
                          { key: 'feeAtP90' as SortKey, label: 'UCR 90th' },
                          { key: 'ucrPercentile' as SortKey, label: 'Your Percentile' },
                          { key: 'annualVolume' as SortKey, label: 'Volume/yr' },
                          { key: 'writeOff' as SortKey, label: 'Write-Off/yr' },
                          { key: 'upliftAtP75' as SortKey, label: 'Uplift Potential' },
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => toggleSort(col.key)}
                            className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                          >
                            <span className="inline-flex items-center">
                              {col.label}
                              <SortIcon col={col.key} />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedEntries.map((entry) => {
                        const badge = flagBadge(entry.flag);
                        return (
                          <tr key={entry.code} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2.5 font-mono text-xs font-medium text-gray-900">
                              {entry.code}
                            </td>
                            <td className="px-3 py-2.5 text-gray-700 max-w-[200px] truncate">
                              {entry.description}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-900 tabular-nums">
                              {formatCurrency(entry.currentFee)}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 tabular-nums">
                              {formatCurrency(entry.feeAtP50)}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 tabular-nums">
                              {formatCurrency(entry.feeAtP75)}
                            </td>
                            <td className="px-3 py-2.5 text-gray-500 tabular-nums">
                              {formatCurrency(entry.feeAtP90)}
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={cn('h-full rounded-full transition-all', percentileColor(entry.ucrPercentile))}
                                    style={{ width: `${Math.min(100, entry.ucrPercentile)}%` }}
                                  />
                                </div>
                                <span className={cn('text-xs font-medium tabular-nums', percentileTextColor(entry.ucrPercentile))}>
                                  {entry.ucrPercentile.toFixed(0)}th
                                </span>
                                <span className={cn('inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border', badge.color)}>
                                  {badge.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-gray-700 tabular-nums text-center">
                              {entry.annualVolume}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums">
                              {entry.writeOff > 0 ? (
                                <span className="text-red-600">{formatCurrency(entry.writeOff)}</span>
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 tabular-nums">
                              {entry.upliftAtP75 > 0 ? (
                                <span className="text-green-600 inline-flex items-center gap-0.5">
                                  <ArrowUpRight size={12} />
                                  {formatCurrency(entry.upliftAtP75)}
                                </span>
                              ) : (
                                <span className="text-gray-400">--</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Revenue Impact Simulator */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Revenue Impact Simulator</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Model what revenue would look like at different percentile targets
                    </p>
                  </div>
                  {currentUplift > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Projected uplift</p>
                      <p className="text-lg font-semibold text-green-600">
                        +{formatCurrency(currentUplift)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Percentile Slider */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Target Percentile: <span className="text-indigo-600 font-semibold">{targetPercentile}th</span>
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={90}
                    step={5}
                    value={targetPercentile}
                    onChange={(e) => setTargetPercentile(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                    {PERCENTILE_TARGETS.map((t) => (
                      <span key={t.value}>{t.value}th</span>
                    ))}
                  </div>
                </div>

                {/* Revenue Chart */}
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueChartData} barSize={80}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                      {revenueChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Modeled revenue table */}
                {report.modeledRevenue.length > 0 && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {report.modeledRevenue.map((m) => (
                      <div
                        key={m.percentile}
                        className={cn(
                          'rounded-lg p-3 text-center border cursor-pointer transition-all',
                          m.percentile === targetPercentile
                            ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100',
                        )}
                        onClick={() => setTargetPercentile(m.percentile)}
                      >
                        <p className="text-[10px] uppercase text-gray-500 font-medium">
                          {m.percentile}th Pctl
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {formatCurrency(m.revenue)}
                        </p>
                        {m.uplift > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            +{formatCurrency(m.uplift)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Write-Off Analysis Tab ───────────────────────────────────────── */}
      {activeTab === 'writeoffs' && (
        <>
          {!writeOffData || writeOffData.details.length === 0 ? (
            <div className="card p-8 text-center">
              <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                No write-off data available. PPO schedules must be analyzed first.
              </p>
            </div>
          ) : (
            <>
              {/* Payer summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {writeOffData.byPayer.map((payer) => (
                  <div key={payer.payerName} className="card p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {payer.payerName}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-red-600 tabular-nums">
                      {formatCurrency(payer.totalWriteOff)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {payer.procedureCount} procedures with write-offs
                    </p>
                  </div>
                ))}
              </div>

              {/* Stacked bar chart */}
              {writeOffChartData.length > 0 && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Write-Offs by Category and Payer
                  </h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={writeOffChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), '']}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {payerNames.map((name, i) => (
                        <Bar
                          key={name}
                          dataKey={name}
                          stackId="a"
                          fill={PAYER_COLORS[i % PAYER_COLORS.length]}
                          radius={i === payerNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Detail table */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Write-Off Detail ({writeOffData.details.length} procedures)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Standard Fee</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PPO Allowed</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Write-Off/Unit</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Volume/yr</th>
                        <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Write-Off</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {writeOffData.details.slice(0, 50).map((row, i) => (
                        <tr key={`${row.code}-${row.payerName}-${i}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-mono text-xs font-medium text-gray-900">{row.code}</td>
                          <td className="px-3 py-2.5 text-gray-700 max-w-[200px] truncate">{row.description}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {row.payerName}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 tabular-nums">{formatCurrency(row.standardFee)}</td>
                          <td className="px-3 py-2.5 text-gray-700 tabular-nums">{formatCurrency(row.ppoAllowedFee)}</td>
                          <td className="px-3 py-2.5 text-red-600 tabular-nums">{formatCurrency(row.writeOffPerUnit)}</td>
                          <td className="px-3 py-2.5 text-gray-700 tabular-nums text-center">{row.annualVolume}</td>
                          <td className="px-3 py-2.5 font-medium text-red-600 tabular-nums">{formatCurrency(row.annualWriteOff)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ─── Renegotiation Brief Modal ────────────────────────────────────── */}
      {briefOpen && brief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBriefOpen(false)} />
          <div className="relative w-full max-w-3xl mx-4 bg-white rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Renegotiation Brief</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {brief.payerName} -- {brief.procedureCount} procedures, {formatCurrency(brief.totalAnnualImpact)} annual impact
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyBrief}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => setBriefOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-800 bg-gray-50 rounded-lg p-5 border border-gray-200">
                {brief.text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
