import React, { useEffect, useState, useCallback } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Heart,
  Bone,
  Shield,
  FileText,
  TrendingUp,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  RefreshCw,
  XCircle,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

import { formatCurrency, cn } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';
import PageHeader from '@/components/ui/PageHeader';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Recommendation {
  id: string;
  patientId: string;
  patientName: string;
  category: 'perio' | 'restorative' | 'preventive' | 'referral';
  priority: 'urgent' | 'high' | 'standard' | 'low';
  title: string;
  description: string;
  rationale: string;
  guidelineReference: string;
  suggestedProcedureCodes: string[];
  estimatedRevenue: number;
  status: 'new' | 'reviewed' | 'accepted' | 'dismissed';
  createdAt: string;
  dismissReason?: string;
}

interface DashboardStats {
  totalRecommendations: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  estimatedRevenue: number;
  acceptanceRate: number;
  totalAccepted: number;
  totalDismissed: number;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-1',
    patientId: 'p1',
    patientName: 'Jane Cooper',
    category: 'perio',
    priority: 'urgent',
    title: 'SRP Recommended — Teeth #3, #14, #19',
    description: 'Pocket depths of 7mm detected. Scaling and root planing is indicated for teeth with pockets >= 5mm.',
    rationale: '3 teeth with pocket depths >= 5mm found on most recent perio exam (2026-03-20). Maximum depth: 7mm.',
    guidelineReference: 'ADA CDT D4341: Periodontal scaling and root planing indicated for pocket depths >= 5mm (AAP Clinical Practice Guidelines)',
    suggestedProcedureCodes: ['D4341', 'D4341', 'D4341', 'D4341'],
    estimatedRevenue: 1400,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-2',
    patientId: 'p1',
    patientName: 'Jane Cooper',
    category: 'restorative',
    priority: 'high',
    title: 'Crown Needed After RCT — Tooth #14',
    description: 'Tooth #14 has received root canal therapy (D3330) but has no full-coverage restoration planned. Unrestored endodontically treated teeth are at high risk of fracture.',
    rationale: 'Root canal treated teeth lose significant structural integrity and require full-coverage crowns to prevent catastrophic fracture.',
    guidelineReference: 'Standard of care: Endodontically treated posterior teeth should receive full-coverage restoration (AAE Position Statement; J Endod 2019)',
    suggestedProcedureCodes: ['D2750', 'D2950'],
    estimatedRevenue: 1450,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-3',
    patientId: 'p2',
    patientName: 'Robert Chen',
    category: 'perio',
    priority: 'high',
    title: 'Elevated Bleeding on Probing',
    description: 'Bleeding detected at 42% of sites (81/192). This exceeds the 30% threshold indicating active periodontal disease.',
    rationale: 'Bleeding on probing > 30% is a strong indicator of active periodontal inflammation requiring intervention.',
    guidelineReference: 'AAP Classification System: Bleeding on probing is the primary clinical indicator of gingival inflammation (AAP/EFP 2017)',
    suggestedProcedureCodes: ['D4341'],
    estimatedRevenue: 350,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-4',
    patientId: 'p2',
    patientName: 'Robert Chen',
    category: 'preventive',
    priority: 'standard',
    title: 'Prophylaxis Overdue',
    description: 'No hygiene/prophylaxis appointment found in the last 6 months. Patient should be scheduled for routine cleaning.',
    rationale: 'Regular prophylaxis is fundamental to maintaining oral health and preventing periodontal disease progression.',
    guidelineReference: 'ADA recommends prophylaxis every 6 months for low-risk patients (ADA Clinical Practice Guidelines)',
    suggestedProcedureCodes: ['D1110'],
    estimatedRevenue: 135,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-5',
    patientId: 'p3',
    patientName: 'Maria Santos',
    category: 'restorative',
    priority: 'urgent',
    title: 'Missed Treatment — Caries Without Restoration',
    description: 'Clinical notes mention deep caries or significant decay, but no restorative procedure is currently planned.',
    rationale: 'Untreated caries will progress and may lead to pulpal involvement, pain, and potential tooth loss.',
    guidelineReference: 'ADA Caries Classification System: Deep caries lesions require prompt restorative intervention (ADA Clinical Practice Guidelines)',
    suggestedProcedureCodes: ['D2392'],
    estimatedRevenue: 320,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-6',
    patientId: 'p3',
    patientName: 'Maria Santos',
    category: 'preventive',
    priority: 'standard',
    title: 'Fluoride Treatment Recommended',
    description: 'Patient shows indicators of elevated caries risk (multiple restorations and/or caries noted in records) but no fluoride varnish application (D1208) on file.',
    rationale: 'Patients with high caries risk benefit significantly from professional fluoride application.',
    guidelineReference: 'ADA Council on Scientific Affairs: Professionally applied topical fluoride recommended for patients at elevated caries risk (ADA Clinical Recommendations 2013)',
    suggestedProcedureCodes: ['D1208'],
    estimatedRevenue: 45,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-7',
    patientId: 'p1',
    patientName: 'Jane Cooper',
    category: 'referral',
    priority: 'high',
    title: 'Periodontist Referral Recommended',
    description: 'Patient presents with pockets up to 7mm, suggesting moderate-to-severe periodontal disease requiring specialist evaluation.',
    rationale: 'Moderate to severe periodontitis often exceeds the scope of general practice and benefits from specialist management.',
    guidelineReference: 'ADA Standards: Referral to a periodontist is recommended for patients with moderate-to-severe periodontitis (AAP/ADA Referral Guidelines)',
    suggestedProcedureCodes: [],
    estimatedRevenue: 0,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-8',
    patientId: 'p4',
    patientName: 'David Kim',
    category: 'preventive',
    priority: 'low',
    title: 'Bitewing Radiographs Due',
    description: 'No bitewing radiographs found in the last 12 months. Radiographic evaluation is recommended for caries and bone level assessment.',
    rationale: 'Bitewing radiographs detect interproximal caries and early bone loss not visible clinically.',
    guidelineReference: 'ADA/FDA Guidelines for Prescribing Dental Radiographs: Posterior bitewing exam recommended at 6-18 month intervals depending on risk',
    suggestedProcedureCodes: ['D0274'],
    estimatedRevenue: 75,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-9',
    patientId: 'p4',
    patientName: 'David Kim',
    category: 'preventive',
    priority: 'standard',
    title: 'Periodic Exam Overdue',
    description: 'No periodic oral evaluation (D0120) found in the last 6 months.',
    rationale: 'Regular examinations allow early detection of caries, periodontal disease, oral cancer, and other pathology.',
    guidelineReference: "ADA recommends periodic oral evaluation at intervals determined by the patient's risk factors, typically every 6 months (ADA Clinical Practice Guidelines)",
    suggestedProcedureCodes: ['D0120'],
    estimatedRevenue: 65,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
  {
    id: 'rec-10',
    patientId: 'p2',
    patientName: 'Robert Chen',
    category: 'perio',
    priority: 'standard',
    title: 'Periodontal Maintenance Recommended',
    description: 'Patient has a history of periodontal treatment but no periodontal maintenance (D4910) is currently scheduled.',
    rationale: 'After active periodontal therapy, patients should be placed on a periodontal maintenance schedule, typically every 3-4 months.',
    guidelineReference: 'ADA recommends periodontal maintenance following active therapy (ADA Clinical Practice Guidelines; AAP Position Paper on Periodontal Maintenance)',
    suggestedProcedureCodes: ['D4910'],
    estimatedRevenue: 200,
    status: 'new',
    createdAt: '2026-04-05T10:00:00Z',
  },
];

const MOCK_STATS: DashboardStats = {
  totalRecommendations: 10,
  byCategory: { perio: 4, restorative: 3, preventive: 4, referral: 1 },
  byPriority: { urgent: 2, high: 3, standard: 4, low: 1 },
  estimatedRevenue: 4040,
  acceptanceRate: 0,
  totalAccepted: 0,
  totalDismissed: 0,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TabKey = 'all' | 'urgent' | 'by-patient' | 'by-category';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'by-patient', label: 'By Patient' },
  { key: 'by-category', label: 'By Category' },
];

const CATEGORY_LABELS: Record<string, string> = {
  perio: 'Periodontal',
  restorative: 'Restorative',
  preventive: 'Preventive',
  referral: 'Referral',
};

const CATEGORY_COLORS: Record<string, string> = {
  perio: '#ef4444',
  restorative: '#3b82f6',
  preventive: '#22c55e',
  referral: '#a855f7',
};

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  perio: 'bg-red-50 text-red-700 border-red-200',
  restorative: 'bg-blue-50 text-blue-700 border-blue-200',
  preventive: 'bg-green-50 text-green-700 border-green-200',
  referral: 'bg-purple-50 text-purple-700 border-purple-200',
};

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-amber-100 text-amber-800 border-amber-300',
  standard: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

function categoryIcon(category: string) {
  switch (category) {
    case 'perio':
      return <Bone size={16} />;
    case 'restorative':
      return <Stethoscope size={16} />;
    case 'preventive':
      return <Shield size={16} />;
    case 'referral':
      return <Heart size={16} />;
    default:
      return <FileText size={16} />;
  }
}

// ---------------------------------------------------------------------------
// Recommendation Card
// ---------------------------------------------------------------------------

function RecommendationCard({
  rec,
  onAccept,
  onDismiss,
}: {
  rec: Recommendation;
  onAccept: (id: string) => void;
  onDismiss: (id: string, reason?: string) => void;
}) {
  const [showDismissInput, setShowDismissInput] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Category icon */}
        <div
          className={cn(
            'p-2 rounded-lg flex-shrink-0 mt-0.5',
            rec.category === 'perio' && 'bg-red-50 text-red-600',
            rec.category === 'restorative' && 'bg-blue-50 text-blue-600',
            rec.category === 'preventive' && 'bg-green-50 text-green-600',
            rec.category === 'referral' && 'bg-purple-50 text-purple-600',
          )}
        >
          {categoryIcon(rec.category)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row: badges + patient */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                PRIORITY_BADGE_CLASSES[rec.priority],
              )}
            >
              {rec.priority === 'urgent' && <AlertTriangle size={11} className="mr-1" />}
              {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                CATEGORY_BADGE_CLASSES[rec.category],
              )}
            >
              {CATEGORY_LABELS[rec.category]}
            </span>
            <span className="text-xs text-gray-500">{rec.patientName}</span>
          </div>

          {/* Title */}
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{rec.title}</h4>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-1">{rec.description}</p>

          {/* Expandable details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 mb-2"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide details' : 'Show rationale & guidelines'}
          </button>

          {expanded && (
            <div className="mb-3 space-y-2 bg-gray-50 rounded-lg p-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                  Clinical Rationale
                </p>
                <p className="text-sm text-gray-700">{rec.rationale}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">
                  ADA Guideline Reference
                </p>
                <p className="text-sm text-gray-600 italic">{rec.guidelineReference}</p>
              </div>
            </div>
          )}

          {/* Procedure codes + revenue */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {rec.suggestedProcedureCodes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {/* Deduplicate codes with count */}
                {Object.entries(
                  rec.suggestedProcedureCodes.reduce<Record<string, number>>((acc, c) => {
                    acc[c] = (acc[c] ?? 0) + 1;
                    return acc;
                  }, {}),
                ).map(([code, count]) => (
                  <span
                    key={code}
                    className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-mono"
                  >
                    {code}
                    {count > 1 && ` x${count}`}
                  </span>
                ))}
              </div>
            )}
            {rec.estimatedRevenue > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                <DollarSign size={11} />
                {formatCurrency(rec.estimatedRevenue)}
              </span>
            )}
          </div>

          {/* Actions */}
          {(rec.status === 'new' || rec.status === 'reviewed') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAccept(rec.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={13} />
                Accept
              </button>
              {!showDismissInput ? (
                <button
                  onClick={() => setShowDismissInput(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <XCircle size={13} />
                  Dismiss
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={dismissReason}
                    onChange={(e) => setDismissReason(e.target.value)}
                    placeholder="Reason (optional)"
                    className="px-2 py-1 text-xs border rounded-md w-40"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      onDismiss(rec.id, dismissReason || undefined);
                      setShowDismissInput(false);
                      setDismissReason('');
                    }}
                    className="px-2 py-1.5 rounded-md text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setShowDismissInput(false);
                      setDismissReason('');
                    }}
                    className="p-1"
                  >
                    <X size={13} className="text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          )}

          {rec.status === 'accepted' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
              <CheckCircle size={13} /> Accepted
            </span>
          )}
          {rec.status === 'dismissed' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
              <XCircle size={13} /> Dismissed
              {rec.dismissReason && ` — ${rec.dismissReason}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Patient Group (expandable)
// ---------------------------------------------------------------------------

function PatientGroup({
  patientName,
  recs,
  onAccept,
  onDismiss,
}: {
  patientName: string;
  recs: Recommendation[];
  onAccept: (id: string) => void;
  onDismiss: (id: string, reason?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = recs.filter((r) => r.status === 'new' || r.status === 'reviewed').length;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">{patientName}</span>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
            {activeCount}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {recs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onAccept={onAccept} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Group (expandable)
// ---------------------------------------------------------------------------

function CategoryGroup({
  category,
  recs,
  onAccept,
  onDismiss,
}: {
  category: string;
  recs: Recommendation[];
  onAccept: (id: string) => void;
  onDismiss: (id: string, reason?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeCount = recs.filter((r) => r.status === 'new' || r.status === 'reviewed').length;

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-1.5 rounded-md',
              category === 'perio' && 'bg-red-50 text-red-600',
              category === 'restorative' && 'bg-blue-50 text-blue-600',
              category === 'preventive' && 'bg-green-50 text-green-600',
              category === 'referral' && 'bg-purple-50 text-purple-600',
            )}
          >
            {categoryIcon(category)}
          </div>
          <span className="text-sm font-semibold text-gray-900">{CATEGORY_LABELS[category]}</span>
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold">
            {activeCount}
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {recs.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} onAccept={onAccept} onDismiss={onDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ClinicalDecisionSupportPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Fetch data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [recsRes, statsRes] = await Promise.all([
        api.get<Recommendation[]>('/decision-support/recommendations').catch(() => null),
        api.get<DashboardStats>('/decision-support/dashboard').catch(() => null),
      ]);

      if (recsRes?.data && Array.isArray(recsRes.data) && recsRes.data.length > 0) {
        setRecommendations(recsRes.data);
      } else {
        setRecommendations(MOCK_RECOMMENDATIONS);
      }

      if (statsRes?.data && typeof statsRes.data.totalRecommendations === 'number') {
        setStats(statsRes.data);
      } else {
        setStats(MOCK_STATS);
      }
    } catch {
      setRecommendations(MOCK_RECOMMENDATIONS);
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Analyze all ─────────────────────────────────────────────────────────
  const handleAnalyzeAll = useCallback(async () => {
    setAnalyzing(true);
    try {
      const { data } = await api.post<{ recommendations: Recommendation[]; count: number }>(
        '/decision-support/analyze-all',
      );
      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        toast.success(`Analysis complete — ${data.count} recommendations generated`);
      } else {
        toast.success('Analysis complete — no actionable recommendations found');
      }
      // Refresh stats
      const statsRes = await api.get<DashboardStats>('/decision-support/dashboard').catch(() => null);
      if (statsRes?.data) setStats(statsRes.data);
    } catch {
      toast.error('Analysis failed — displaying sample recommendations');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  // ── Accept / Dismiss ────────────────────────────────────────────────────
  const handleAccept = useCallback(
    async (id: string) => {
      try {
        await api.patch(`/decision-support/recommendations/${id}`, { status: 'accepted' });
        toast.success('Recommendation accepted');
      } catch {
        // Update locally even if API fails
      }
      setRecommendations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'accepted' } : r)));
      setStats((prev) => ({
        ...prev,
        totalRecommendations: Math.max(0, prev.totalRecommendations - 1),
        totalAccepted: prev.totalAccepted + 1,
        acceptanceRate:
          prev.totalAccepted + prev.totalDismissed + 1 > 0
            ? ((prev.totalAccepted + 1) / (prev.totalAccepted + prev.totalDismissed + 1)) * 100
            : 0,
      }));
    },
    [],
  );

  const handleDismiss = useCallback(
    async (id: string, reason?: string) => {
      try {
        await api.patch(`/decision-support/recommendations/${id}`, {
          status: 'dismissed',
          dismissReason: reason,
        });
        toast.success('Recommendation dismissed');
      } catch {
        // Update locally even if API fails
      }
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: 'dismissed', dismissReason: reason } : r,
        ),
      );
      setStats((prev) => ({
        ...prev,
        totalRecommendations: Math.max(0, prev.totalRecommendations - 1),
        totalDismissed: prev.totalDismissed + 1,
        acceptanceRate:
          prev.totalAccepted + prev.totalDismissed + 1 > 0
            ? (prev.totalAccepted / (prev.totalAccepted + prev.totalDismissed + 1)) * 100
            : 0,
      }));
    },
    [],
  );

  // ── Filtered data ───────────────────────────────────────────────────────
  const activeRecs = recommendations.filter(
    (r) => r.status === 'new' || r.status === 'reviewed',
  );
  const urgentRecs = activeRecs.filter((r) => r.priority === 'urgent');

  const filteredRecs = activeRecs.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.patientName.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.suggestedProcedureCodes.some((c) => c.toLowerCase().includes(q))
    );
  });

  // Group by patient
  const byPatient = filteredRecs.reduce<Record<string, Recommendation[]>>((acc, r) => {
    const key = r.patientName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Group by category
  const byCategory = filteredRecs.reduce<Record<string, Recommendation[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  // Donut chart data
  const pieData = Object.entries(stats.byCategory)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({
      name: CATEGORY_LABELS[key] ?? key,
      value: count,
      color: CATEGORY_COLORS[key] ?? '#6b7280',
    }));

  const totalRevenue = activeRecs.reduce((sum, r) => sum + r.estimatedRevenue, 0);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Decision Support"
        subtitle="AI-powered clinical recommendations based on patient records, perio data, and ADA guidelines"
        action={
          <button
            onClick={handleAnalyzeAll}
            disabled={analyzing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {analyzing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            {analyzing ? 'Analyzing...' : 'Analyze All Patients'}
          </button>
        }
      />

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">AI reviews patient records, perio charts, and imaging data during each appointment</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Evidence-based treatment options are suggested using ADA guidelines and clinical best practices</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Contraindications, drug interactions, and medical history alerts are flagged before treatment</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Clear rationale and procedure codes help you present recommended treatment to patients confidently</p>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Recommendations"
          value={activeRecs.length}
          icon={<Stethoscope size={20} />}
          iconColor="text-indigo-600 bg-indigo-50"
          subtitle={`${recommendations.length} total across all statuses`}
        />
        <StatCard
          title="Urgent Items"
          value={urgentRecs.length}
          icon={<AlertTriangle size={20} />}
          iconColor="text-red-600 bg-red-50"
          subtitle={urgentRecs.length > 0 ? 'Require immediate attention' : 'No urgent items'}
          change={urgentRecs.length > 0 ? 'Action required' : undefined}
          changeType={urgentRecs.length > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          title="Potential Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp size={20} />}
          iconColor="text-green-600 bg-green-50"
          subtitle="From accepting all recommendations"
        />
        <StatCard
          title="Acceptance Rate"
          value={`${stats.acceptanceRate.toFixed(0)}%`}
          icon={<BarChart3 size={20} />}
          iconColor="text-amber-600 bg-amber-50"
          subtitle={`${stats.totalAccepted} accepted, ${stats.totalDismissed} dismissed`}
        />
      </div>

      {/* ── Charts + Tabs row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut chart */}
        <div className="card p-5 lg:col-span-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommendations by Category</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} recommendations`, name]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-gray-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
              No data yet
            </div>
          )}
        </div>

        {/* Recommendations list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {tab.label}
                  {tab.key === 'urgent' && urgentRecs.length > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {urgentRecs.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recommendations..."
                className="pl-8 pr-3 py-1.5 text-xs border rounded-lg w-full sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {activeTab === 'all' && (
              <>
                {filteredRecs.length === 0 ? (
                  <EmptyState
                    icon={<Stethoscope size={32} />}
                    title="No recommendations found"
                    subtitle={
                      searchQuery
                        ? 'Try adjusting your search query'
                        : 'Click "Analyze All Patients" to generate clinical recommendations'
                    }
                  />
                ) : (
                  filteredRecs.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      onAccept={handleAccept}
                      onDismiss={handleDismiss}
                    />
                  ))
                )}
              </>
            )}

            {activeTab === 'urgent' && (
              <>
                {urgentRecs.length === 0 ? (
                  <EmptyState
                    icon={<AlertTriangle size={32} />}
                    title="No urgent recommendations"
                    subtitle="All urgent clinical items have been addressed"
                  />
                ) : (
                  urgentRecs
                    .filter((r) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        r.patientName.toLowerCase().includes(q) ||
                        r.title.toLowerCase().includes(q)
                      );
                    })
                    .map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        rec={rec}
                        onAccept={handleAccept}
                        onDismiss={handleDismiss}
                      />
                    ))
                )}
              </>
            )}

            {activeTab === 'by-patient' && (
              <>
                {Object.keys(byPatient).length === 0 ? (
                  <EmptyState
                    icon={<Stethoscope size={32} />}
                    title="No recommendations found"
                    subtitle="Click Analyze All Patients to generate recommendations"
                  />
                ) : (
                  Object.entries(byPatient)
                    .sort(([, a], [, b]) => b.length - a.length)
                    .map(([patientName, recs]) => (
                      <PatientGroup
                        key={patientName}
                        patientName={patientName}
                        recs={recs}
                        onAccept={handleAccept}
                        onDismiss={handleDismiss}
                      />
                    ))
                )}
              </>
            )}

            {activeTab === 'by-category' && (
              <>
                {Object.keys(byCategory).length === 0 ? (
                  <EmptyState
                    icon={<Stethoscope size={32} />}
                    title="No recommendations found"
                    subtitle="Click Analyze All Patients to generate recommendations"
                  />
                ) : (
                  ['perio', 'restorative', 'preventive', 'referral']
                    .filter((cat) => byCategory[cat]?.length > 0)
                    .map((cat) => (
                      <CategoryGroup
                        key={cat}
                        category={cat}
                        recs={byCategory[cat]}
                        onAccept={handleAccept}
                        onDismiss={handleDismiss}
                      />
                    ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
