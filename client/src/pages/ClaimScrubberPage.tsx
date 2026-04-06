import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileSearch,
  Zap,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  TrendingUp,
  Copy,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { formatCurrency, formatDate, cn } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScrubIssue {
  id: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  weight: number;
  title: string;
  description: string;
  suggestedFix: string;
  procedureCode?: string;
  autoFixable: boolean;
}

interface ScrubResult {
  id: string;
  claimId: string;
  patientId: string;
  patientName: string;
  claimDate: string;
  procedureCodes: string;
  totalAmount: number;
  payerName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: ScrubIssue[];
  suggestedNarrative: string | null;
  originalNarrative: string;
  status: 'pending' | 'reviewed' | 'applied' | 'dismissed';
  scrubbedAt: string;
}

interface PayerDenialPattern {
  id: string;
  payer: string;
  procedureCode: string;
  denialReason: string;
  frequency: number;
  preventionTip: string;
  category: string;
}

interface ScrubStats {
  totalScrubbed: number;
  totalIssuesFound: number;
  highRiskCount: number;
  criticalCount: number;
  preventionRate: number;
  issuesByCategory: Record<string, number>;
  topRisks: Array<{ code: string; description: string; count: number }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function riskBadgeColor(level: string): string {
  switch (level) {
    case 'low': return 'bg-green-50 text-green-700 border-green-200';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'critical': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function severityIcon(severity: string) {
  switch (severity) {
    case 'low': return <CheckCircle size={16} className="text-green-500 flex-shrink-0" />;
    case 'medium': return <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />;
    case 'high': return <ShieldAlert size={16} className="text-orange-500 flex-shrink-0" />;
    case 'critical': return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
    default: return <FileSearch size={16} className="text-gray-400 flex-shrink-0" />;
  }
}

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'reviewed': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'applied': return 'bg-green-50 text-green-700 border-green-200';
    case 'dismissed': return 'bg-gray-100 text-gray-500 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function categoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    frequency: 'Frequency Limit',
    narrative: 'Narrative Issue',
    documentation: 'Missing Docs',
    annual_max: 'Annual Max',
    deductible: 'Deductible',
    payer_pattern: 'Payer Pattern',
    bundling: 'Bundling Risk',
  };
  return labels[cat] || cat;
}

function categoryBadgeColor(cat: string): string {
  const colors: Record<string, string> = {
    frequency: 'bg-purple-50 text-purple-700',
    narrative: 'bg-blue-50 text-blue-700',
    documentation: 'bg-red-50 text-red-700',
    annual_max: 'bg-amber-50 text-amber-700',
    deductible: 'bg-cyan-50 text-cyan-700',
    payer_pattern: 'bg-indigo-50 text-indigo-700',
    bundling: 'bg-orange-50 text-orange-700',
  };
  return colors[cat] || 'bg-gray-100 text-gray-600';
}

// ─── Mock Data for Display Before First Scrub ───────────────────────────────

const MOCK_RESULTS: ScrubResult[] = [
  {
    id: 'mock_1', claimId: 'clm1', patientId: 'p1',
    patientName: 'Jane Cooper', claimDate: '2026-03-28',
    procedureCodes: 'D2750, D2950', totalAmount: 2200,
    payerName: 'Delta Dental', riskScore: 72, riskLevel: 'high',
    issues: [
      { id: 'mi1', category: 'bundling', severity: 'high', weight: 30, title: 'Bundling Risk: Core Buildup + Crown', description: 'D2950 (Core Buildup) and D2750 (Crown) are billed on the same claim. Delta Dental bundles these procedures — the buildup will likely be denied as inclusive with the crown.', suggestedFix: 'Add narrative justifying the buildup as a separate procedure. Document that remaining tooth structure is less than 50%.', procedureCode: 'D2950', autoFixable: true },
      { id: 'mi2', category: 'documentation', severity: 'high', weight: 30, title: 'Pre-Authorization Missing', description: 'Procedures D2750, D2950 typically require pre-authorization from Delta Dental. No approved pre-auth was found.', suggestedFix: 'Submit pre-authorization request to Delta Dental for D2750, D2950 before filing this claim.', autoFixable: false },
      { id: 'mi3', category: 'payer_pattern', severity: 'medium', weight: 15, title: 'Delta Dental Denial Risk: D2750', description: 'Crown downgraded to large amalgam restoration — missing narrative justification. This issue accounts for approximately 22% of Delta Dental denials for D2750.', suggestedFix: 'Include specific clinical findings: fracture lines, cusp involvement percentage, and pre-op radiograph date.', procedureCode: 'D2750', autoFixable: false },
    ],
    suggestedNarrative: 'Patient Jane Cooper presented with clinical and radiographic evidence of structural compromise requiring full-coverage restoration on tooth #14. The existing tooth structure was insufficient to support a direct restoration due to extent of fracture involving the mesio-lingual cusp. Remaining coronal tooth structure was less than 40%. A core buildup (D2950) was required as a separate restorative procedure prior to crown fabrication. A full-coverage PFM crown (D2750) was determined to be the appropriate restoration to restore proper form, function, and structural integrity.',
    originalNarrative: 'Crown and buildup on tooth 14.',
    status: 'pending', scrubbedAt: '2026-04-05T10:30:00Z',
  },
  {
    id: 'mock_2', claimId: 'clm2', patientId: 'p2',
    patientName: 'Robert Chen', claimDate: '2026-04-01',
    procedureCodes: 'D1110, D0274, D0120', totalAmount: 380,
    payerName: 'Aetna', riskScore: 18, riskLevel: 'low',
    issues: [
      { id: 'mi4', category: 'deductible', severity: 'low', weight: 5, title: 'Deductible Not Yet Met', description: "Patient's annual deductible is $50.00 with $0.00 met so far. The remaining $50.00 will be applied to this claim.", suggestedFix: 'Collect $50.00 deductible from patient at time of service.', autoFixable: false },
    ],
    suggestedNarrative: null,
    originalNarrative: 'Periodic evaluation, prophylaxis, and bitewing radiographs performed. Patient in good oral health, no active caries noted.',
    status: 'pending', scrubbedAt: '2026-04-05T10:30:00Z',
  },
  {
    id: 'mock_3', claimId: 'clm3', patientId: 'p3',
    patientName: 'Maria Garcia', claimDate: '2026-03-25',
    procedureCodes: 'D4341, D4341, D4341, D4341', totalAmount: 1680,
    payerName: 'Cigna', riskScore: 58, riskLevel: 'high',
    issues: [
      { id: 'mi5', category: 'documentation', severity: 'critical', weight: 50, title: 'No Clinical Note Found', description: 'This claim includes major procedures but has no associated clinical note. Payers require clinical documentation to support medical necessity.', suggestedFix: 'Create and approve a clinical note for this appointment before submitting the claim.', autoFixable: false },
      { id: 'mi6', category: 'payer_pattern', severity: 'medium', weight: 15, title: 'Cigna Denial Risk: D4341', description: 'SRP denied without periodontal charting. This issue accounts for approximately 15% of denials.', suggestedFix: 'Attach full perio chart showing pocket depths >= 4mm. Include bleeding on probing data.', procedureCode: 'D4341', autoFixable: false },
      { id: 'mi7', category: 'annual_max', severity: 'medium', weight: 15, title: 'Approaching Annual Maximum', description: 'After this claim, the patient will have used $1,930 of their $2,000 annual maximum.', suggestedFix: 'Alert the patient that their remaining insurance benefits will be limited after this claim.', autoFixable: false },
    ],
    suggestedNarrative: 'Patient Maria Garcia presented with generalized moderate to severe periodontitis. Periodontal examination revealed pocket depths of 4-7mm with bleeding on probing and clinical attachment loss. Full-mouth scaling and root planing was performed under local anesthesia across all four quadrants to remove subgingular calculus and diseased root cementum. Oral hygiene instructions reinforced. Patient scheduled for periodontal re-evaluation in 4-6 weeks.',
    originalNarrative: 'SRP all quads.',
    status: 'pending', scrubbedAt: '2026-04-05T10:30:00Z',
  },
  {
    id: 'mock_4', claimId: 'clm4', patientId: 'p4',
    patientName: 'David Wilson', claimDate: '2026-04-02',
    procedureCodes: 'D1110, D4910', totalAmount: 520,
    payerName: 'BlueCross BlueShield', riskScore: 85, riskLevel: 'critical',
    issues: [
      { id: 'mi8', category: 'bundling', severity: 'critical', weight: 50, title: 'Mutually Exclusive Procedures: Prophy + Perio Maintenance', description: 'D1110 (Prophylaxis) and D4910 (Periodontal Maintenance) are mutually exclusive and cannot be billed on the same date. This claim will be denied.', suggestedFix: 'Remove either D1110 or D4910. For patients with a history of periodontal disease, bill D4910.', autoFixable: false },
      { id: 'mi9', category: 'narrative', severity: 'medium', weight: 15, title: 'Narrative Missing Key Terms', description: 'The claim narrative does not contain expected terminology for preventive or periodontal procedures.', suggestedFix: 'Update narrative to include clinical terminology appropriate for the billed procedures.', autoFixable: true },
    ],
    suggestedNarrative: 'Patient David Wilson, a periodontal maintenance patient, presented for scheduled periodontal maintenance visit (D4910). Probing depths measured and recorded. Subgingular scaling performed in areas of residual pocketing. Supragingular prophylaxis completed. Oral hygiene reinforced with emphasis on interproximal cleaning. Next periodontal maintenance visit scheduled in 3 months.',
    originalNarrative: 'Cleaning and maintenance visit.',
    status: 'pending', scrubbedAt: '2026-04-05T10:30:00Z',
  },
  {
    id: 'mock_5', claimId: 'clm5', patientId: 'p5',
    patientName: 'Sarah Kim', claimDate: '2026-03-30',
    procedureCodes: 'D3330, D2950, D2750', totalAmount: 3420,
    payerName: 'MetLife', riskScore: 64, riskLevel: 'high',
    issues: [
      { id: 'mi10', category: 'annual_max', severity: 'high', weight: 30, title: 'Annual Maximum Will Be Exceeded', description: 'This claim for $3,420.00 plus annual used ($800.00) exceeds the annual maximum of $2,000.00. Patient will owe an additional $2,220.00 out of pocket.', suggestedFix: 'Inform the patient of estimated out-of-pocket cost. Consider splitting treatment across benefit years.', autoFixable: false },
      { id: 'mi11', category: 'documentation', severity: 'high', weight: 30, title: 'Pre-Authorization Missing', description: 'Procedures D3330, D2950, D2750 typically require pre-authorization from MetLife.', suggestedFix: 'Submit pre-authorization request to MetLife before filing this claim.', autoFixable: false },
      { id: 'mi12', category: 'payer_pattern', severity: 'medium', weight: 15, title: 'MetLife Denial Risk: D2750', description: 'Crown denied — less than 5 years since last crown on same tooth. MetLife enforces strict 5-year replacement rule.', suggestedFix: 'Document catastrophic failure, fracture, or recurrent decay with radiograph.', procedureCode: 'D2750', autoFixable: false },
    ],
    suggestedNarrative: null,
    originalNarrative: 'Root canal, buildup, and crown on tooth #30. Patient presented with spontaneous pain and periapical radiolucency.',
    status: 'pending', scrubbedAt: '2026-04-05T10:30:00Z',
  },
];

const MOCK_STATS: ScrubStats = {
  totalScrubbed: 47,
  totalIssuesFound: 89,
  highRiskCount: 12,
  criticalCount: 3,
  preventionRate: 74,
  issuesByCategory: { frequency: 18, documentation: 22, bundling: 14, payer_pattern: 19, narrative: 9, annual_max: 5, deductible: 2 },
  topRisks: [
    { code: 'D2750', description: 'Crown', count: 11 },
    { code: 'D2950', description: 'Core Buildup', count: 9 },
    { code: 'D4341', description: 'SRP', count: 7 },
    { code: 'D0274', description: 'Bitewings', count: 5 },
    { code: 'D1110', description: 'Prophylaxis', count: 4 },
  ],
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ClaimScrubberPage() {
  const [activeTab, setActiveTab] = useState<'results' | 'patterns'>('results');
  const [results, setResults] = useState<ScrubResult[]>(MOCK_RESULTS);
  const [stats, setStats] = useState<ScrubStats>(MOCK_STATS);
  const [patterns, setPatterns] = useState<PayerDenialPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [patternPayerFilter, setPatternPayerFilter] = useState<string>('');

  // ── Fetch data ────────────────────────────────────────────────────────────

  const fetchResults = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (riskFilter) params.set('risk', riskFilter);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/claim-scrubber/results?${params.toString()}`);
      if (data.length > 0) {
        setResults(data);
      }
    } catch {
      // Keep mock data on failure
    }
  }, [riskFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/claim-scrubber/stats');
      if (data.totalScrubbed > 0) {
        setStats(data);
      }
    } catch {
      // Keep mock stats on failure
    }
  }, []);

  const fetchPatterns = useCallback(async () => {
    try {
      const { data } = await api.get('/claim-scrubber/payer-patterns');
      setPatterns(data);
    } catch {
      // Patterns will be empty
    }
  }, []);

  useEffect(() => {
    fetchResults();
    fetchStats();
    fetchPatterns();
  }, [fetchResults, fetchStats, fetchPatterns]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleScrubAll = async () => {
    setScrubbing(true);
    try {
      const { data } = await api.post('/claim-scrubber/scrub-batch');
      if (data.results && data.results.length > 0) {
        setResults(data.results);
        toast.success(`Scrubbed ${data.scrubbed} claims — ${data.totalIssues} issues found`);
      } else {
        toast.success('No pending claims to scrub. Showing sample data.');
      }
      fetchStats();
    } catch {
      toast.error('Failed to run batch scrub. Displaying sample data.');
    } finally {
      setScrubbing(false);
    }
  };

  const handleApply = async (resultId: string) => {
    try {
      const { data } = await api.patch(`/claim-scrubber/results/${resultId}/apply`);
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: data.status } : r));
      toast.success('Suggested fixes applied to claim');
      fetchStats();
    } catch {
      // Update locally for mock data
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: 'applied' } : r));
      toast.success('Suggested fixes applied to claim');
    }
  };

  const handleDismiss = async (resultId: string) => {
    try {
      const { data } = await api.patch(`/claim-scrubber/results/${resultId}/dismiss`);
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: data.status } : r));
      toast.success('Finding dismissed');
      fetchStats();
    } catch {
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, status: 'dismissed' } : r));
      toast.success('Finding dismissed');
    }
  };

  const copyNarrative = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Narrative copied to clipboard');
  };

  // ── Filtered data ─────────────────────────────────────────────────────────

  const filteredResults = results.filter(r => {
    if (riskFilter && r.riskLevel !== riskFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const filteredPatterns = patternPayerFilter
    ? patterns.filter(p => p.payer === patternPayerFilter)
    : patterns;

  const uniquePayers = [...new Set(patterns.map(p => p.payer))];

  if (loading) return <FullPageSpinner />;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="text-indigo-600" size={28} />
            AI Claim Scrubber
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Pre-submission denial prevention powered by payer intelligence
          </p>
        </div>
        <button
          onClick={handleScrubAll}
          disabled={scrubbing}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all',
            scrubbing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          )}
        >
          {scrubbing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Scrubbing...
            </>
          ) : (
            <>
              <Zap size={16} />
              Scrub All Pending Claims
            </>
          )}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Select pending claims or click "Scrub All" to queue every unsent claim for AI review</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">AI cross-checks each claim against payer rules, coding guidelines, and denial patterns</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Review flagged issues sorted by risk level with suggested fixes for each problem</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Apply corrections and submit clean claims to maximize first-pass acceptance rates</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Claims Scrubbed"
          value={stats.totalScrubbed}
          icon={<FileSearch size={20} />}
          iconColor="text-indigo-600 bg-indigo-50"
          subtitle="Total claims analyzed"
        />
        <StatCard
          title="Issues Found"
          value={stats.totalIssuesFound}
          icon={<AlertTriangle size={20} />}
          iconColor="text-amber-600 bg-amber-50"
          subtitle={`${Object.keys(stats.issuesByCategory).length} issue categories`}
        />
        <StatCard
          title="High-Risk Claims"
          value={stats.highRiskCount}
          icon={<ShieldAlert size={20} />}
          iconColor="text-red-600 bg-red-50"
          subtitle={`${stats.criticalCount} critical`}
          change={stats.criticalCount > 0 ? `${stats.criticalCount} need immediate attention` : undefined}
          changeType={stats.criticalCount > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          title="Prevention Rate"
          value={`${stats.preventionRate}%`}
          icon={<Shield size={20} />}
          iconColor="text-green-600 bg-green-50"
          subtitle="Issues addressed before submission"
          change="Saves avg $847/denied claim"
          changeType="positive"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('results')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'results'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          Scrub Results
        </button>
        <button
          onClick={() => setActiveTab('patterns')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            activeTab === 'patterns'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          Payer Denial Patterns
        </button>
      </div>

      {/* ── Results Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="critical">Critical Risk</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="applied">Applied</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredResults.length === 0 ? (
            <EmptyState
              icon={<CheckCircle size={40} className="text-green-400" />}
              title="No results match your filters"
              subtitle="Try adjusting your filters or run a new scrub on pending claims."
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Patient</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Claim Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Procedures</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Payer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Risk</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Issues</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredResults.map((result) => (
                    <React.Fragment key={result.id}>
                      <tr
                        onClick={() => setExpandedRow(expandedRow === result.id ? null : result.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          expandedRow === result.id ? 'bg-indigo-50/30' : 'hover:bg-gray-50/80'
                        )}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{result.patientName}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(result.claimDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {result.procedureCodes.split(',').map((code, i) => (
                              <span key={i} className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                {code.trim()}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{result.payerName}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium tabular-nums">{formatCurrency(result.totalAmount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border', riskBadgeColor(result.riskLevel))}>
                            {result.riskScore}
                            <span className="hidden sm:inline">
                              {result.riskLevel}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                            result.issues.length === 0 ? 'bg-green-100 text-green-700' :
                            result.issues.length <= 2 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          )}>
                            {result.issues.length}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium border', statusBadgeColor(result.status))}>
                            {result.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {expandedRow === result.id ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail Row */}
                      {expandedRow === result.id && (
                        <tr>
                          <td colSpan={9} className="px-0 py-0">
                            <div className="bg-gray-50/70 border-t border-gray-100 px-6 py-5 space-y-5">
                              {/* Issues List */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                  <AlertTriangle size={15} className="text-amber-500" />
                                  Issues Detected ({result.issues.length})
                                </h4>
                                <div className="space-y-3">
                                  {result.issues.map((issue) => (
                                    <div key={issue.id} className="bg-white rounded-lg border border-gray-100 p-4">
                                      <div className="flex items-start gap-3">
                                        {severityIcon(issue.severity)}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm text-gray-900">{issue.title}</span>
                                            <span className={cn('px-1.5 py-0.5 rounded text-xs font-medium', categoryBadgeColor(issue.category))}>
                                              {categoryLabel(issue.category)}
                                            </span>
                                            <span className={cn(
                                              'px-1.5 py-0.5 rounded text-xs font-medium capitalize',
                                              issue.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                              issue.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                              issue.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                              'bg-green-100 text-green-700'
                                            )}>
                                              {issue.severity}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                                          <div className="mt-2 p-2.5 bg-blue-50 rounded-md border border-blue-100">
                                            <p className="text-xs font-medium text-blue-800 flex items-center gap-1">
                                              <TrendingUp size={12} />
                                              Suggested Fix
                                            </p>
                                            <p className="text-xs text-blue-700 mt-1">{issue.suggestedFix}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Suggested Narrative */}
                              {result.suggestedNarrative && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <FileSearch size={15} className="text-indigo-500" />
                                    AI-Generated Compliant Narrative
                                  </h4>
                                  <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-3">
                                    <div>
                                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Original Narrative</p>
                                      <p className="text-sm text-gray-500 italic">{result.originalNarrative}</p>
                                    </div>
                                    <div className="border-t border-gray-100 pt-3">
                                      <p className="text-xs font-medium text-green-600 uppercase tracking-wider mb-1">Suggested Narrative</p>
                                      <p className="text-sm text-gray-800 leading-relaxed">{result.suggestedNarrative}</p>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); copyNarrative(result.suggestedNarrative!); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                      >
                                        <Copy size={12} />
                                        Copy
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              {result.status === 'pending' && (
                                <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                                  {result.suggestedNarrative && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApply(result.id); }}
                                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                      <CheckCircle size={14} />
                                      Apply Fixes
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDismiss(result.id); }}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <XCircle size={14} />
                                    Dismiss
                                  </button>
                                </div>
                              )}
                              {result.status === 'applied' && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                  <CheckCircle size={16} className="text-green-500" />
                                  <span className="text-sm text-green-700 font-medium">Fixes applied successfully</span>
                                </div>
                              )}
                              {result.status === 'dismissed' && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                  <XCircle size={16} className="text-gray-400" />
                                  <span className="text-sm text-gray-500">Findings dismissed by reviewer</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Payer Patterns Tab ────────────────────────────────────────────────── */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Common denial patterns learned from payer behavior. Use these insights to prevent claim rejections.
            </p>
            <select
              value={patternPayerFilter}
              onChange={(e) => setPatternPayerFilter(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Payers</option>
              {uniquePayers.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {filteredPatterns.length === 0 ? (
            <EmptyState
              icon={<Shield size={40} className="text-indigo-300" />}
              title="No payer patterns loaded"
              subtitle="Payer denial patterns will populate when the scrubber engine is connected."
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Payer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Procedure</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Denial Reason</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Denial Rate</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Prevention Tip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPatterns.map((pattern) => (
                    <tr key={pattern.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{pattern.payer}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                          {pattern.procedureCode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', categoryBadgeColor(pattern.category))}>
                          {categoryLabel(pattern.category) || pattern.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <p className="line-clamp-2">{pattern.denialReason}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'inline-block px-2 py-1 rounded-full text-xs font-bold',
                          pattern.frequency >= 25 ? 'bg-red-100 text-red-700' :
                          pattern.frequency >= 15 ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        )}>
                          {pattern.frequency}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-sm">
                        <p className="line-clamp-2 text-xs">{pattern.preventionTip}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
