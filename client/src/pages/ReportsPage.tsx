import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  PieChart,
  Heart,
  Clock,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getProductionReport,
  getCollectionsReport,
  getCaseAcceptanceReport,
  getHygieneReport,
  getAgingARReport,
} from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';

type TabKey = 'production' | 'collections' | 'case_acceptance' | 'hygiene' | 'aging_ar';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'production', label: 'Production', icon: <BarChart3 size={15} /> },
  { key: 'collections', label: 'Collections', icon: <DollarSign size={15} /> },
  { key: 'case_acceptance', label: 'Case Acceptance', icon: <PieChart size={15} /> },
  { key: 'hygiene', label: 'Hygiene', icon: <Heart size={15} /> },
  { key: 'aging_ar', label: 'Aging AR', icon: <Clock size={15} /> },
];

// ─── Mock data ──────────────────────────────────────────────────────────────

interface ProductionRow {
  provider: string;
  title: string;
  procedures: number;
  production: number;
  adjustments: number;
  netProduction: number;
}

const MOCK_PRODUCTION: ProductionRow[] = [
  { provider: 'Dr. Sarah Mitchell', title: 'DDS', procedures: 87, production: 51300, adjustments: -3200, netProduction: 48100 },
  { provider: 'Dr. James Park', title: 'DMD', procedures: 42, production: 38400, adjustments: -1800, netProduction: 36600 },
  { provider: 'Lisa Nguyen', title: 'RDH', procedures: 105, production: 18900, adjustments: -600, netProduction: 18300 },
];

interface CollectionRow {
  category: string;
  amount: number;
  count: number;
  color: string;
}

const MOCK_COLLECTIONS: CollectionRow[] = [
  { category: 'Patient Payments', amount: 32400, count: 68, color: 'bg-green-500' },
  { category: 'Insurance Payments', amount: 45800, count: 34, color: 'bg-blue-500' },
  { category: 'Adjustments / Write-offs', amount: -5600, count: 12, color: 'bg-red-500' },
  { category: 'Refunds', amount: -1200, count: 3, color: 'bg-amber-500' },
];

interface CaseAcceptanceData {
  proposed: number;
  accepted: number;
  declined: number;
  pending: number;
  proposedValue: number;
  acceptedValue: number;
  declinedValue: number;
}

const MOCK_CASE_ACCEPTANCE: CaseAcceptanceData = {
  proposed: 42,
  accepted: 28,
  declined: 8,
  pending: 6,
  proposedValue: 186400,
  acceptedValue: 124800,
  declinedValue: 38600,
};

interface HygieneData {
  totalRecalls: number;
  overdue: number;
  sentThisMonth: number;
  scheduledFromRecall: number;
  reappointmentRate: number;
  avgDaysOverdue: number;
}

const MOCK_HYGIENE: HygieneData = {
  totalRecalls: 312,
  overdue: 47,
  sentThisMonth: 64,
  scheduledFromRecall: 28,
  reappointmentRate: 72,
  avgDaysOverdue: 34,
};

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  color: string;
  bgColor: string;
}

const MOCK_AGING: AgingBucket[] = [
  { label: 'Current', amount: 12400, count: 24, color: 'text-green-700', bgColor: 'bg-green-50' },
  { label: '1-30 Days', amount: 8600, count: 14, color: 'text-amber-700', bgColor: 'bg-amber-50' },
  { label: '31-60 Days', amount: 5200, count: 8, color: 'text-orange-700', bgColor: 'bg-orange-50' },
  { label: '61-90 Days', amount: 3400, count: 5, color: 'text-red-600', bgColor: 'bg-red-50' },
  { label: '90+ Days', amount: 6800, count: 7, color: 'text-red-800', bgColor: 'bg-red-100' },
  { label: 'Collections', amount: 4200, count: 2, color: 'text-red-900', bgColor: 'bg-red-200/60' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('production');
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Fake fetch on tab change
  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'production':
          await getProductionReport({ start: startDate, end: endDate });
          break;
        case 'collections':
          await getCollectionsReport();
          break;
        case 'case_acceptance':
          await getCaseAcceptanceReport();
          break;
        case 'hygiene':
          await getHygieneReport();
          break;
        case 'aging_ar':
          await getAgingARReport();
          break;
      }
    } catch {
      // Fall through to mock data
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const totalProduction = MOCK_PRODUCTION.reduce((s, r) => s + r.netProduction, 0);
  const totalCollections = MOCK_COLLECTIONS.reduce((s, r) => s + r.amount, 0);
  const totalAR = MOCK_AGING.reduce((s, r) => s + r.amount, 0);
  const acceptanceRate = Math.round((MOCK_CASE_ACCEPTANCE.accepted / MOCK_CASE_ACCEPTANCE.proposed) * 100);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 size={24} className="text-indigo-600" />
          Reports &amp; Analytics
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Practice performance metrics and financial reports
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Production</span>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{formatCurrency(totalProduction)}</p>
            <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> +12% vs last period
            </p>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collections</span>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{formatCurrency(totalCollections)}</p>
            <p className="text-xs text-gray-400 mt-1">This period</p>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Case Acceptance</span>
            <p className="text-2xl font-bold text-blue-700 tabular-nums mt-1">{acceptanceRate}%</p>
            <p className="text-xs text-gray-400 mt-1">{MOCK_CASE_ACCEPTANCE.accepted} of {MOCK_CASE_ACCEPTANCE.proposed} plans</p>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total AR</span>
            <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{formatCurrency(totalAR)}</p>
            <p className="text-xs text-red-500 font-medium mt-1">{MOCK_AGING.filter((b) => b.label.includes('90') || b.label === 'Collections').reduce((s, b) => s + b.count, 0)} accounts 90+ days</p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 flex-wrap border-b border-gray-200 pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-all -mb-px',
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? (
        <FullPageSpinner />
      ) : (
        <div>
          {/* ── Production ── */}
          {activeTab === 'production' && (
            <div>
              {/* Date range */}
              <div className="flex items-center gap-3 mb-5">
                <label className="text-xs font-medium text-gray-600">From</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input text-xs py-1.5 px-3 w-auto"
                />
                <label className="text-xs font-medium text-gray-600">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input text-xs py-1.5 px-3 w-auto"
                />
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-semibold">Provider</th>
                      <th className="text-center px-5 py-3 font-semibold">Procedures</th>
                      <th className="text-right px-5 py-3 font-semibold">Gross Production</th>
                      <th className="text-right px-5 py-3 font-semibold">Adjustments</th>
                      <th className="text-right px-5 py-3 font-semibold">Net Production</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_PRODUCTION.map((row) => (
                      <tr key={row.provider} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-semibold text-gray-900">{row.provider}</p>
                          <p className="text-xs text-gray-400">{row.title}</p>
                        </td>
                        <td className="text-center px-5 py-4 text-gray-700 tabular-nums">{row.procedures}</td>
                        <td className="text-right px-5 py-4 text-gray-700 tabular-nums">{formatCurrency(row.production)}</td>
                        <td className="text-right px-5 py-4 text-red-600 tabular-nums">{formatCurrency(row.adjustments)}</td>
                        <td className="text-right px-5 py-4 text-gray-900 font-bold tabular-nums">{formatCurrency(row.netProduction)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-5 py-3 text-sm font-semibold text-gray-700">Totals</td>
                      <td className="text-center px-5 py-3 text-sm font-semibold text-gray-700 tabular-nums">
                        {MOCK_PRODUCTION.reduce((s, r) => s + r.procedures, 0)}
                      </td>
                      <td className="text-right px-5 py-3 text-sm font-semibold text-gray-700 tabular-nums">
                        {formatCurrency(MOCK_PRODUCTION.reduce((s, r) => s + r.production, 0))}
                      </td>
                      <td className="text-right px-5 py-3 text-sm font-semibold text-red-600 tabular-nums">
                        {formatCurrency(MOCK_PRODUCTION.reduce((s, r) => s + r.adjustments, 0))}
                      </td>
                      <td className="text-right px-5 py-3 text-sm font-bold text-gray-900 tabular-nums">
                        {formatCurrency(totalProduction)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Visual bar summary */}
              <div className="card p-5 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Production by Provider</h3>
                <div className="space-y-3">
                  {MOCK_PRODUCTION.map((row) => {
                    const pct = Math.round((row.netProduction / totalProduction) * 100);
                    return (
                      <div key={row.provider}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{row.provider}</span>
                          <span className="text-xs font-semibold text-gray-900 tabular-nums">{formatCurrency(row.netProduction)} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Collections ── */}
          {activeTab === 'collections' && (
            <div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-semibold">Category</th>
                      <th className="text-center px-5 py-3 font-semibold">Transactions</th>
                      <th className="text-right px-5 py-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_COLLECTIONS.map((row) => (
                      <tr key={row.category} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className={cn('w-3 h-3 rounded-full flex-shrink-0', row.color)} />
                            <span className="text-sm font-medium text-gray-900">{row.category}</span>
                          </div>
                        </td>
                        <td className="text-center px-5 py-4 text-gray-700 tabular-nums">{row.count}</td>
                        <td className={cn(
                          'text-right px-5 py-4 font-semibold tabular-nums',
                          row.amount < 0 ? 'text-red-600' : 'text-gray-900',
                        )}>
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-5 py-3 text-sm font-semibold text-gray-700">Net Collections</td>
                      <td className="text-center px-5 py-3 text-sm font-semibold text-gray-700 tabular-nums">
                        {MOCK_COLLECTIONS.reduce((s, r) => s + r.count, 0)}
                      </td>
                      <td className="text-right px-5 py-3 text-sm font-bold text-gray-900 tabular-nums">
                        {formatCurrency(totalCollections)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Collection rate bar */}
              <div className="card p-5 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Collection Rate</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Collections vs Production</span>
                  <span className="text-xs font-bold text-green-600">
                    {Math.round((totalCollections / totalProduction) * 100)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((totalCollections / totalProduction) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Case Acceptance ── */}
          {activeTab === 'case_acceptance' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Counts */}
              <div className="card p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5">Plan Outcomes</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Proposed', value: MOCK_CASE_ACCEPTANCE.proposed, color: 'bg-blue-500', textColor: 'text-blue-700' },
                    { label: 'Accepted', value: MOCK_CASE_ACCEPTANCE.accepted, color: 'bg-green-500', textColor: 'text-green-700' },
                    { label: 'Declined', value: MOCK_CASE_ACCEPTANCE.declined, color: 'bg-red-500', textColor: 'text-red-700' },
                    { label: 'Pending', value: MOCK_CASE_ACCEPTANCE.pending, color: 'bg-amber-500', textColor: 'text-amber-700' },
                  ].map((item) => {
                    const pct = Math.round((item.value / MOCK_CASE_ACCEPTANCE.proposed) * 100);
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{item.label}</span>
                          <span className={cn('text-xs font-semibold tabular-nums', item.textColor)}>
                            {item.value} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', item.color)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Values */}
              <div className="card p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5">Financial Impact</h3>
                <div className="space-y-5">
                  <div className="bg-green-50 rounded-xl p-5">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Accepted Value</p>
                    <p className="text-2xl font-bold text-green-700 tabular-nums mt-1">
                      {formatCurrency(MOCK_CASE_ACCEPTANCE.acceptedValue)}
                    </p>
                    <p className="text-xs text-green-600 mt-1">{MOCK_CASE_ACCEPTANCE.accepted} plans accepted</p>
                  </div>

                  <div className="bg-red-50 rounded-xl p-5">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Declined Value</p>
                    <p className="text-2xl font-bold text-red-700 tabular-nums mt-1">
                      {formatCurrency(MOCK_CASE_ACCEPTANCE.declinedValue)}
                    </p>
                    <p className="text-xs text-red-600 mt-1">{MOCK_CASE_ACCEPTANCE.declined} plans declined</p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-5">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Total Proposed</p>
                    <p className="text-2xl font-bold text-blue-700 tabular-nums mt-1">
                      {formatCurrency(MOCK_CASE_ACCEPTANCE.proposedValue)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Overall acceptance rate: <span className="font-bold">{acceptanceRate}%</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Hygiene ── */}
          {activeTab === 'hygiene' && (
            <div>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
                <div className="card p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Recall Patients</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{MOCK_HYGIENE.totalRecalls}</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">Currently Overdue</p>
                  <p className="text-2xl font-bold text-red-700 tabular-nums mt-1">{MOCK_HYGIENE.overdue}</p>
                  <p className="text-xs text-gray-400 mt-1">Avg {MOCK_HYGIENE.avgDaysOverdue} days overdue</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reminders Sent</p>
                  <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{MOCK_HYGIENE.sentThisMonth}</p>
                  <p className="text-xs text-gray-400 mt-1">This month</p>
                </div>
                <div className="card p-5">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Scheduled from Recall</p>
                  <p className="text-2xl font-bold text-green-700 tabular-nums mt-1">{MOCK_HYGIENE.scheduledFromRecall}</p>
                  <p className="text-xs text-gray-400 mt-1">This month</p>
                </div>
                <div className="card p-5 col-span-2 xl:col-span-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Reappointment Rate</p>
                  <div className="flex items-center gap-4">
                    <p className="text-3xl font-bold text-indigo-700 tabular-nums">{MOCK_HYGIENE.reappointmentRate}%</p>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${MOCK_HYGIENE.reappointmentRate}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Target: 85% | {MOCK_HYGIENE.reappointmentRate >= 85 ? 'On track' : `${85 - MOCK_HYGIENE.reappointmentRate}% below target`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Aging AR ── */}
          {activeTab === 'aging_ar' && (
            <div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-5 py-3 font-semibold">Aging Bucket</th>
                      <th className="text-center px-5 py-3 font-semibold">Accounts</th>
                      <th className="text-right px-5 py-3 font-semibold">Amount</th>
                      <th className="text-right px-5 py-3 font-semibold">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {MOCK_AGING.map((bucket) => {
                      const pct = Math.round((bucket.amount / totalAR) * 100);
                      return (
                        <tr key={bucket.label} className={cn('hover:bg-gray-50/60 transition-colors', bucket.bgColor)}>
                          <td className="px-5 py-4">
                            <span className={cn('text-sm font-semibold', bucket.color)}>{bucket.label}</span>
                          </td>
                          <td className="text-center px-5 py-4 text-gray-700 tabular-nums">{bucket.count}</td>
                          <td className={cn('text-right px-5 py-4 font-bold tabular-nums', bucket.color)}>
                            {formatCurrency(bucket.amount)}
                          </td>
                          <td className="text-right px-5 py-4 text-gray-500 tabular-nums">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td className="px-5 py-3 text-sm font-semibold text-gray-700">Total AR</td>
                      <td className="text-center px-5 py-3 text-sm font-semibold text-gray-700 tabular-nums">
                        {MOCK_AGING.reduce((s, b) => s + b.count, 0)}
                      </td>
                      <td className="text-right px-5 py-3 text-sm font-bold text-gray-900 tabular-nums">
                        {formatCurrency(totalAR)}
                      </td>
                      <td className="text-right px-5 py-3 text-sm font-semibold text-gray-700">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Visual breakdown */}
              <div className="card p-5 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">AR Distribution</h3>
                <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
                  {MOCK_AGING.map((bucket) => {
                    const pct = (bucket.amount / totalAR) * 100;
                    const barColors: Record<string, string> = {
                      'Current': 'bg-green-400',
                      '1-30 Days': 'bg-amber-400',
                      '31-60 Days': 'bg-orange-400',
                      '61-90 Days': 'bg-red-400',
                      '90+ Days': 'bg-red-600',
                      'Collections': 'bg-red-800',
                    };
                    return (
                      <div
                        key={bucket.label}
                        className={cn('h-full first:rounded-l-full last:rounded-r-full', barColors[bucket.label] ?? 'bg-gray-400')}
                        style={{ width: `${pct}%` }}
                        title={`${bucket.label}: ${formatCurrency(bucket.amount)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {MOCK_AGING.map((bucket) => {
                    const dotColors: Record<string, string> = {
                      'Current': 'bg-green-400',
                      '1-30 Days': 'bg-amber-400',
                      '31-60 Days': 'bg-orange-400',
                      '61-90 Days': 'bg-red-400',
                      '90+ Days': 'bg-red-600',
                      'Collections': 'bg-red-800',
                    };
                    return (
                      <div key={bucket.label} className="flex items-center gap-1.5">
                        <span className={cn('w-2.5 h-2.5 rounded-full', dotColors[bucket.label] ?? 'bg-gray-400')} />
                        <span className="text-[10px] text-gray-500">{bucket.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
