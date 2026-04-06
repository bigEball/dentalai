import React, { useEffect, useState, useCallback } from 'react';
import {
  HeartHandshake,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Pause,
  Play,
  TrendingUp,
  Target,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  Zap,
  DollarSign,
  Clock,
  Shield,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface NurtureTouch {
  id: string;
  sequenceId: string;
  stepNumber: number;
  channel: 'sms' | 'email';
  messageType: string;
  subject: string;
  body: string;
  scheduledFor: string;
  sentAt: string | null;
  status: 'scheduled' | 'sent' | 'delivered' | 'opened' | 'responded';
  response: string | null;
}

interface NurtureSequence {
  id: string;
  treatmentPlanId: string;
  patientId: string;
  patientName: string;
  planTitle: string;
  planValue: number;
  status: 'active' | 'paused' | 'completed' | 'converted';
  objectionType: 'cost' | 'fear' | 'time' | 'insurance' | 'indecision';
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  lastTouchAt: string | null;
  nextTouchAt: string | null;
  convertedAt: string | null;
  conversionValue: number;
  touches: NurtureTouch[];
}

interface NurtureDashboard {
  activeSequences: number;
  conversionRate: number;
  avgTouchesToConvert: number;
  revenueRecovered: number;
  totalSequences: number;
  convertedCount: number;
  pausedCount: number;
}

interface NurtureFunnel {
  plansProposed: number;
  sequencesStarted: number;
  responsesReceived: number;
  converted: number;
}

interface TreatmentPlan {
  id: string;
  patientId: string;
  title: string;
  status: string;
  totalEstimate: number;
  insuranceEst: number;
  patientEst: number;
  priority: string;
  patient?: { id: string; firstName: string; lastName: string };
  provider?: { id: string; firstName: string; lastName: string; title: string };
  items?: Array<{ procedureCode: string; description: string }>;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'converted', label: 'Converted' },
  { key: 'all', label: 'All' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const OBJECTION_COLORS: Record<string, string> = {
  cost: 'bg-blue-50 text-blue-700',
  fear: 'bg-purple-50 text-purple-700',
  time: 'bg-amber-50 text-amber-700',
  insurance: 'bg-green-50 text-green-700',
  indecision: 'bg-gray-100 text-gray-600',
};

const OBJECTION_ICONS: Record<string, React.ReactNode> = {
  cost: <DollarSign size={12} />,
  fear: <Shield size={12} />,
  time: <Clock size={12} />,
  insurance: <CheckCircle2 size={12} />,
  indecision: <HelpCircle size={12} />,
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  paused: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  converted: 'bg-indigo-50 text-indigo-700',
};

const TOUCH_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-50 text-blue-700',
  delivered: 'bg-green-50 text-green-700',
  opened: 'bg-indigo-50 text-indigo-700',
  responded: 'bg-purple-50 text-purple-700',
};

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#34d399'];

// ─── Mock data for when API is empty ────────────────────────────────────────

const MOCK_DASHBOARD: NurtureDashboard = {
  activeSequences: 3,
  conversionRate: 25.0,
  avgTouchesToConvert: 3.2,
  revenueRecovered: 6800,
  totalSequences: 4,
  convertedCount: 1,
  pausedCount: 0,
};

const MOCK_FUNNEL: NurtureFunnel = {
  plansProposed: 12,
  sequencesStarted: 4,
  responsesReceived: 2,
  converted: 1,
};

const MOCK_SEQUENCES: NurtureSequence[] = [
  {
    id: 'ns1',
    treatmentPlanId: 'tp1',
    patientId: 'p1',
    patientName: 'Jane Cooper',
    planTitle: 'Comprehensive Restorative — Upper Arch',
    planValue: 4250,
    status: 'active',
    objectionType: 'cost',
    currentStep: 2,
    totalSteps: 5,
    startedAt: '2026-03-20T10:00:00Z',
    lastTouchAt: '2026-03-25T10:00:00Z',
    nextTouchAt: '2026-03-30T10:00:00Z',
    convertedAt: null,
    conversionValue: 4250,
    touches: [
      { id: 't1', sequenceId: 'ns1', stepNumber: 1, channel: 'sms', messageType: 'cost_awareness', subject: 'Investment in Your Smile', body: 'Hi Jane, we understand Comprehensive Restorative is an investment. Here\'s why treating this now saves money long-term: delaying treatment often leads to more extensive procedures. Your estimated cost is $1,450.00.', scheduledFor: '2026-03-22T10:00:00Z', sentAt: '2026-03-22T10:00:00Z', status: 'sent', response: null },
      { id: 't2', sequenceId: 'ns1', stepNumber: 2, channel: 'email', messageType: 'financing_options', subject: 'Flexible Financing Options for Your Treatment', body: 'We offer flexible payment plans: $483/mo for 3 months, $242/mo for 6 months, or $121/mo for 12 months. Zero interest available.', scheduledFor: '2026-03-25T10:00:00Z', sentAt: '2026-03-25T10:00:00Z', status: 'sent', response: null },
      { id: 't3', sequenceId: 'ns1', stepNumber: 3, channel: 'sms', messageType: 'insurance_reminder', subject: 'Insurance Benefits Reminder', body: 'You have $2,800.00 in unused insurance benefits this year. Your plan covers 66% of Comprehensive Restorative. Benefits reset on Jan 1.', scheduledFor: '2026-03-30T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
      { id: 't4', sequenceId: 'ns1', stepNumber: 4, channel: 'email', messageType: 'provider_message', subject: 'A Personal Note from Dr. Mitchell', body: 'Dear Jane, Dr. Mitchell wanted to personally follow up about your treatment plan. We\'re here to answer any questions.', scheduledFor: '2026-04-09T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
      { id: 't5', sequenceId: 'ns1', stepNumber: 5, channel: 'sms', messageType: 'final_reminder', subject: 'Last Reminder', body: 'Last reminder: We\'d love to help you get started. Call us or reply to schedule. Limited financing offer available this month.', scheduledFor: '2026-04-19T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
    ],
  },
  {
    id: 'ns2',
    treatmentPlanId: 'tp5',
    patientId: 'p5',
    patientName: 'Michael Torres',
    planTitle: 'Whitening and Veneer Consult',
    planValue: 6800,
    status: 'active',
    objectionType: 'fear',
    currentStep: 1,
    totalSteps: 5,
    startedAt: '2026-03-28T10:00:00Z',
    lastTouchAt: '2026-03-30T10:00:00Z',
    nextTouchAt: '2026-04-02T10:00:00Z',
    convertedAt: null,
    conversionValue: 6800,
    touches: [
      { id: 't6', sequenceId: 'ns2', stepNumber: 1, channel: 'sms', messageType: 'gentle_reassurance', subject: 'We Understand Your Concerns', body: 'Hi Michael, we know dental procedures can feel overwhelming. Our team is experienced in making patients comfortable every step of the way.', scheduledFor: '2026-03-30T10:00:00Z', sentAt: '2026-03-30T10:00:00Z', status: 'sent', response: null },
      { id: 't7', sequenceId: 'ns2', stepNumber: 2, channel: 'email', messageType: 'procedure_education', subject: 'What to Expect: Veneers', body: 'Modern dentistry has made veneers faster and more comfortable than ever. Most patients report minimal discomfort.', scheduledFor: '2026-04-02T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
      { id: 't8', sequenceId: 'ns2', stepNumber: 3, channel: 'sms', messageType: 'testimonial', subject: 'Patient Success Story', body: 'Many patients felt the same way before their procedure. "I wish I hadn\'t waited so long!"', scheduledFor: '2026-04-07T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
      { id: 't9', sequenceId: 'ns2', stepNumber: 4, channel: 'email', messageType: 'sedation_options', subject: 'Comfort Options for Your Visit', body: 'We offer nitrous oxide, oral sedation, and noise-cancelling headphones.', scheduledFor: '2026-04-17T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
      { id: 't10', sequenceId: 'ns2', stepNumber: 5, channel: 'sms', messageType: 'personal_outreach', subject: 'We\'re Here for You', body: 'No pressure — just reply or call when you\'re ready.', scheduledFor: '2026-04-27T10:00:00Z', sentAt: null, status: 'scheduled', response: null },
    ],
  },
  {
    id: 'ns3',
    treatmentPlanId: 'tp3',
    patientId: 'p3',
    patientName: 'Maria Garcia',
    planTitle: 'Implant Restoration — Lower Left Molar',
    planValue: 5200,
    status: 'converted',
    objectionType: 'cost',
    currentStep: 5,
    totalSteps: 5,
    startedAt: '2026-02-15T10:00:00Z',
    lastTouchAt: '2026-03-17T10:00:00Z',
    nextTouchAt: null,
    convertedAt: '2026-02-27T10:00:00Z',
    conversionValue: 5200,
    touches: [
      { id: 't11', sequenceId: 'ns3', stepNumber: 1, channel: 'sms', messageType: 'cost_awareness', subject: 'Investment in Your Smile', body: 'Hi Maria, we understand your implant restoration is an investment.', scheduledFor: '2026-02-17T10:00:00Z', sentAt: '2026-02-17T10:00:00Z', status: 'sent', response: null },
      { id: 't12', sequenceId: 'ns3', stepNumber: 2, channel: 'email', messageType: 'financing_options', subject: 'Flexible Financing Options', body: 'We offer flexible payment plans starting at $217/mo for 12 months.', scheduledFor: '2026-02-20T10:00:00Z', sentAt: '2026-02-20T10:00:00Z', status: 'responded', response: 'I would like to set up a payment plan. Can I do 6 months?' },
      { id: 't13', sequenceId: 'ns3', stepNumber: 3, channel: 'sms', messageType: 'insurance_reminder', subject: 'Insurance Benefits', body: 'Your plan covers 50% of the implant restoration.', scheduledFor: '2026-02-25T10:00:00Z', sentAt: '2026-02-25T10:00:00Z', status: 'sent', response: null },
      { id: 't14', sequenceId: 'ns3', stepNumber: 4, channel: 'email', messageType: 'provider_message', subject: 'A Note from Dr. Park', body: 'Dr. Park wanted to personally follow up.', scheduledFor: '2026-03-07T10:00:00Z', sentAt: '2026-03-07T10:00:00Z', status: 'sent', response: null },
      { id: 't15', sequenceId: 'ns3', stepNumber: 5, channel: 'sms', messageType: 'final_reminder', subject: 'Last Reminder', body: 'Limited financing offer available this month.', scheduledFor: '2026-03-17T10:00:00Z', sentAt: '2026-03-17T10:00:00Z', status: 'sent', response: null },
    ],
  },
];

// ─── Helper Components ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={cn('p-2.5 rounded-lg', color)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {current}/{total}
      </span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NurtureSequencesPage() {
  const [sequences, setSequences] = useState<NurtureSequence[]>([]);
  const [dashboard, setDashboard] = useState<NurtureDashboard | null>(null);
  const [funnel, setFunnel] = useState<NurtureFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Start sequence modal
  const [showStartModal, setShowStartModal] = useState(false);
  const [unacceptedPlans, setUnacceptedPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [startingSequence, setStartingSequence] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [seqRes, dashRes, funnelRes] = await Promise.all([
        api.get<NurtureSequence[]>('/nurture/sequences').catch(() => null),
        api.get<NurtureDashboard>('/nurture/dashboard').catch(() => null),
        api.get<NurtureFunnel>('/nurture/funnel').catch(() => null),
      ]);

      const seqData = seqRes?.data;
      const dashData = dashRes?.data;
      const funnelData = funnelRes?.data;

      setSequences(
        Array.isArray(seqData) && seqData.length > 0 ? seqData : MOCK_SEQUENCES,
      );
      setDashboard(
        dashData && dashData.totalSequences > 0 ? dashData : MOCK_DASHBOARD,
      );
      setFunnel(
        funnelData && funnelData.sequencesStarted > 0 ? funnelData : MOCK_FUNNEL,
      );
    } catch {
      setSequences(MOCK_SEQUENCES);
      setDashboard(MOCK_DASHBOARD);
      setFunnel(MOCK_FUNNEL);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchUnacceptedPlans = async () => {
    try {
      const { data } = await api.get<TreatmentPlan[]>('/treatment-plans', {
        params: { status: 'proposed' },
      });
      setUnacceptedPlans(Array.isArray(data) ? data : []);
    } catch {
      setUnacceptedPlans([]);
    }
  };

  const handleStartSequence = async () => {
    if (!selectedPlan) return;
    setStartingSequence(true);
    try {
      const { data } = await api.post<NurtureSequence>(
        `/nurture/start/${selectedPlan.id}`,
      );
      toast.success(`Nurture sequence started for ${selectedPlan.title}`);
      setShowStartModal(false);
      setSelectedPlan(null);
      setSequences((prev) => [data, ...prev]);
      fetchData();
    } catch {
      toast.error('Failed to start nurture sequence');
    } finally {
      setStartingSequence(false);
    }
  };

  const handleSendNext = async (sequenceId: string) => {
    setActionLoading(sequenceId);
    try {
      await api.post(`/nurture/sequences/${sequenceId}/send-next`);
      toast.success('Touch sent successfully');
      fetchData();
    } catch {
      toast.error('Failed to send touch');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePause = async (sequenceId: string) => {
    setActionLoading(sequenceId);
    try {
      await api.patch(`/nurture/sequences/${sequenceId}/pause`);
      toast.success('Sequence paused');
      fetchData();
    } catch {
      toast.error('Failed to pause sequence');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (sequenceId: string) => {
    setActionLoading(sequenceId);
    try {
      await api.patch(`/nurture/sequences/${sequenceId}/resume`);
      toast.success('Sequence resumed');
      fetchData();
    } catch {
      toast.error('Failed to resume sequence');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSequences =
    activeTab === 'all'
      ? sequences
      : sequences.filter((s) => s.status === activeTab);

  const funnelChartData = funnel
    ? [
        { name: 'Plans Proposed', value: funnel.plansProposed, pct: 100 },
        {
          name: 'Sequences Started',
          value: funnel.sequencesStarted,
          pct:
            funnel.plansProposed > 0
              ? Math.round(
                  (funnel.sequencesStarted / funnel.plansProposed) * 100,
                )
              : 0,
        },
        {
          name: 'Responses',
          value: funnel.responsesReceived,
          pct:
            funnel.plansProposed > 0
              ? Math.round(
                  (funnel.responsesReceived / funnel.plansProposed) * 100,
                )
              : 0,
        },
        {
          name: 'Converted',
          value: funnel.converted,
          pct:
            funnel.plansProposed > 0
              ? Math.round(
                  (funnel.converted / funnel.plansProposed) * 100,
                )
              : 0,
        },
      ]
    : [];

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50">
            <HeartHandshake className="text-indigo-600" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Nurture Sequences
            </h1>
            <p className="text-sm text-gray-500">
              Automated follow-ups to convert unaccepted treatment plans
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            fetchUnacceptedPlans();
            setShowStartModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Zap size={16} />
          Start Sequence
        </button>
      </div>

      {/* Stat Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Sequences"
            value={dashboard.activeSequences}
            icon={<Target size={18} className="text-indigo-600" />}
            color="bg-indigo-50"
          />
          <StatCard
            label="Conversion Rate"
            value={`${dashboard.conversionRate}%`}
            icon={<TrendingUp size={18} className="text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            label="Avg Touches to Convert"
            value={dashboard.avgTouchesToConvert}
            icon={<MessageSquare size={18} className="text-purple-600" />}
            color="bg-purple-50"
          />
          <StatCard
            label="Revenue Recovered"
            value={formatCurrency(dashboard.revenueRecovered)}
            icon={<DollarSign size={18} className="text-amber-600" />}
            color="bg-amber-50"
          />
        </div>
      )}

      {/* Conversion Funnel */}
      {funnelChartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Conversion Funnel
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelChartData}
                layout="vertical"
                margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <Tooltip
                  formatter={(value: number, _name: string, props: any) => [
                    `${value} (${props.payload.pct}%)`,
                    '',
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                  {funnelChartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Inline funnel summary */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
            {funnelChartData.map((item, idx) => (
              <React.Fragment key={item.name}>
                <span className="font-medium text-gray-700">
                  {item.value}
                </span>
                <span>{item.name}</span>
                {idx < funnelChartData.length - 1 && (
                  <ArrowRight size={12} className="text-gray-300 mx-1" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sequences Table */}
      {filteredSequences.length === 0 ? (
        <EmptyState
          icon={<HeartHandshake size={28} />}
          title="No sequences found"
          subtitle={`No ${activeTab === 'all' ? '' : activeTab} nurture sequences yet. Start one to convert unaccepted treatment plans.`}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-8" />
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Treatment Plan
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Plan Value
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Objection
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 min-w-[140px]">
                    Progress
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Next Touch
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSequences.map((seq) => (
                  <React.Fragment key={seq.id}>
                    <tr
                      className={cn(
                        'border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer',
                        expandedId === seq.id && 'bg-gray-50/50',
                      )}
                      onClick={() =>
                        setExpandedId(expandedId === seq.id ? null : seq.id)
                      }
                    >
                      <td className="px-4 py-3">
                        {expandedId === seq.id ? (
                          <ChevronUp size={14} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={14} className="text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {seq.patientName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                        {seq.planTitle}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(seq.planValue)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            OBJECTION_COLORS[seq.objectionType],
                          )}
                        >
                          {OBJECTION_ICONS[seq.objectionType]}
                          {seq.objectionType.charAt(0).toUpperCase() +
                            seq.objectionType.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ProgressBar
                          current={seq.currentStep}
                          total={seq.totalSteps}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {seq.nextTouchAt ? formatDate(seq.nextTouchAt) : '---'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                            STATUS_COLORS[seq.status],
                          )}
                        >
                          {seq.status.charAt(0).toUpperCase() +
                            seq.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {seq.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleSendNext(seq.id)}
                                disabled={actionLoading === seq.id}
                                className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                title="Send Next Touch"
                              >
                                {actionLoading === seq.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Send size={14} />
                                )}
                              </button>
                              <button
                                onClick={() => handlePause(seq.id)}
                                disabled={actionLoading === seq.id}
                                className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                                title="Pause Sequence"
                              >
                                <Pause size={14} />
                              </button>
                            </>
                          )}
                          {seq.status === 'paused' && (
                            <button
                              onClick={() => handleResume(seq.id)}
                              disabled={actionLoading === seq.id}
                              className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="Resume Sequence"
                            >
                              <Play size={14} />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === seq.id ? null : seq.id,
                              )
                            }
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — touch timeline */}
                    {expandedId === seq.id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-gray-50/80">
                          <div className="ml-8 space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Sequence Timeline
                            </h4>
                            {seq.touches.map((touch) => (
                              <div
                                key={touch.id}
                                className={cn(
                                  'flex items-start gap-3 p-3 rounded-lg border bg-white',
                                  touch.status === 'responded'
                                    ? 'border-purple-200'
                                    : 'border-gray-100',
                                )}
                              >
                                {/* Step indicator */}
                                <div
                                  className={cn(
                                    'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                                    touch.status === 'scheduled'
                                      ? 'bg-gray-100 text-gray-400'
                                      : touch.status === 'responded'
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'bg-indigo-100 text-indigo-600',
                                  )}
                                >
                                  {touch.stepNumber}
                                </div>

                                {/* Channel icon */}
                                <div className="flex-shrink-0 pt-0.5">
                                  {touch.channel === 'sms' ? (
                                    <Phone
                                      size={14}
                                      className="text-green-500"
                                    />
                                  ) : (
                                    <Mail
                                      size={14}
                                      className="text-blue-500"
                                    />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-semibold text-gray-900">
                                      {touch.subject}
                                    </span>
                                    <span
                                      className={cn(
                                        'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium',
                                        TOUCH_STATUS_COLORS[touch.status],
                                      )}
                                    >
                                      {touch.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 line-clamp-2">
                                    {touch.body}
                                  </p>
                                  {touch.response && (
                                    <div className="mt-2 p-2 bg-purple-50 rounded-md border border-purple-100">
                                      <p className="text-xs font-medium text-purple-700">
                                        Patient Response:
                                      </p>
                                      <p className="text-xs text-purple-600 mt-0.5">
                                        {touch.response}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Date */}
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-[10px] text-gray-400">
                                    {touch.sentAt
                                      ? `Sent ${formatDate(touch.sentAt)}`
                                      : `Scheduled ${formatDate(touch.scheduledFor)}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Start Sequence Modal */}
      <Modal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false);
          setSelectedPlan(null);
        }}
        title="Start Nurture Sequence"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a proposed treatment plan to start an automated nurture
            sequence. The system will detect the likely objection and tailor
            messaging accordingly.
          </p>

          {unacceptedPlans.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No proposed treatment plans available. Create a treatment plan
              first.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unacceptedPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-colors',
                    selectedPlan?.id === plan.id
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {plan.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {plan.patient
                          ? `${plan.patient.firstName} ${plan.patient.lastName}`
                          : 'Unknown Patient'}{' '}
                        &middot; {plan.items?.length ?? 0} procedures
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(plan.totalEstimate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Patient: {formatCurrency(plan.patientEst)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedPlan && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Target size={14} className="text-indigo-600" />
                <span className="text-xs font-semibold text-gray-700">
                  Selected Plan Details
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Total Estimate:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(selectedPlan.totalEstimate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Patient Cost:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(selectedPlan.patientEst)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Insurance Est:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(selectedPlan.insuranceEst)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Procedures:</span>{' '}
                  <span className="font-medium">
                    {selectedPlan.items?.length ?? 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowStartModal(false);
                setSelectedPlan(null);
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartSequence}
              disabled={!selectedPlan || startingSequence}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {startingSequence ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <HeartHandshake size={14} />
              )}
              Start Nurture
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
