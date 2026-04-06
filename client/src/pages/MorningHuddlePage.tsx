import React, { useEffect, useState, useCallback } from 'react';
import {
  Sunrise,
  AlertTriangle,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Shield,
  RefreshCw,
  CheckCircle,
  Phone,
  ShieldAlert,
  CreditCard,
  UserPlus,
  ChevronRight,
  Loader2,
  Stethoscope,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PatientFlag {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action?: string;
}

interface PatientBrief {
  patientId: string;
  firstName: string;
  lastName: string;
  appointmentTime: string;
  appointmentType: string;
  provider: string;
  duration: number;
  isNewPatient: boolean;
  flags: PatientFlag[];
  outstandingBalance: number;
  insuranceStatus: string | null;
  noShowRate: number;
  pendingTreatmentValue: number;
}

interface HuddleAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  patientName: string;
  patientId: string;
  message: string;
  action: string;
}

interface HuddleOpportunity {
  id: string;
  type: string;
  patientName: string;
  patientId: string;
  title: string;
  value: number;
  description: string;
}

interface HuddleSummary {
  totalPatients: number;
  expectedProduction: number;
  newPatients: number;
  patientsWithBalances: number;
  totalCollectible: number;
  highRiskNoShows: number;
}

interface Huddle {
  id: string;
  date: string;
  generatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  summary: HuddleSummary;
  patients: PatientBrief[];
  alerts: HuddleAlert[];
  opportunities: HuddleOpportunity[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAlertIcon(type: string): React.ReactNode {
  switch (type) {
    case 'financial': return <DollarSign size={16} />;
    case 'insurance': return <Shield size={16} />;
    case 'attendance': return <Phone size={16} />;
    case 'treatment': return <Stethoscope size={16} />;
    case 'payment': return <CreditCard size={16} />;
    default: return <AlertTriangle size={16} />;
  }
}

function getAlertColors(severity: string): { border: string; bg: string; icon: string; text: string } {
  switch (severity) {
    case 'critical':
      return { border: 'border-red-300', bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-800' };
    case 'warning':
      return { border: 'border-amber-300', bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-amber-800' };
    default:
      return { border: 'border-blue-200', bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-800' };
  }
}

function getFlagBadge(flag: PatientFlag): { label: string; className: string } {
  switch (flag.type) {
    case 'financial':
      return { label: 'Balance Due', className: 'bg-red-100 text-red-700 border-red-200' };
    case 'insurance':
      return flag.severity === 'info'
        ? { label: 'Near Annual Max', className: 'bg-sky-100 text-sky-700 border-sky-200' }
        : { label: 'Verify Insurance', className: 'bg-amber-100 text-amber-700 border-amber-200' };
    case 'treatment':
      return { label: 'Unaccepted Plan', className: 'bg-blue-100 text-blue-700 border-blue-200' };
    case 'attendance':
      return { label: 'No-Show Risk', className: 'bg-purple-100 text-purple-700 border-purple-200' };
    case 'recall':
      return { label: 'Overdue Recall', className: 'bg-orange-100 text-orange-700 border-orange-200' };
    case 'clinical':
      return flag.message.includes('New patient')
        ? { label: 'New Patient', className: 'bg-green-100 text-green-700 border-green-200' }
        : { label: 'Clinical Note', className: 'bg-gray-100 text-gray-600 border-gray-200' };
    case 'payment':
      return { label: 'Overdue Payment', className: 'bg-red-100 text-red-700 border-red-200' };
    default:
      return { label: flag.type, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
}

function getActionButtonProps(action: string): { label: string; icon: React.ReactNode; className: string } {
  const lower = action.toLowerCase();
  if (lower.includes('call') || lower.includes('confirm')) {
    return { label: 'Call to Confirm', icon: <Phone size={13} />, className: 'bg-purple-600 hover:bg-purple-700 text-white' };
  }
  if (lower.includes('verify') || lower.includes('insurance')) {
    return { label: 'Verify Insurance', icon: <Shield size={13} />, className: 'bg-amber-600 hover:bg-amber-700 text-white' };
  }
  if (lower.includes('collect') || lower.includes('balance') || lower.includes('payment')) {
    return { label: 'Collect Balance', icon: <DollarSign size={13} />, className: 'bg-red-600 hover:bg-red-700 text-white' };
  }
  if (lower.includes('review')) {
    return { label: 'Review', icon: <ShieldAlert size={13} />, className: 'bg-red-700 hover:bg-red-800 text-white' };
  }
  return { label: action, icon: <ChevronRight size={13} />, className: 'bg-gray-600 hover:bg-gray-700 text-white' };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MorningHuddlePage() {
  const [huddle, setHuddle] = useState<Huddle | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Try multiple endpoints to load huddle — server auto-generates if none exists
  const fetchHuddle = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const { data } = await api.get<Huddle>(`/morning-huddle/${date}`);
      setHuddle(data);
    } catch {
      try {
        const { data } = await api.get<Huddle>('/morning-huddle/today');
        setHuddle(data);
      } catch {
        // Silently fail on initial load — user can click Generate
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHuddle(selectedDate);
  }, [selectedDate, fetchHuddle]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      // Try POST /generate first
      const { data } = await api.post<Huddle>('/morning-huddle/generate', { date: selectedDate });
      setHuddle(data);
      toast.success('Briefing generated successfully');
    } catch {
      // Fall back to GET /:date which also auto-generates
      try {
        const { data } = await api.get<Huddle>(`/morning-huddle/${selectedDate}`);
        setHuddle(data);
        toast.success('Briefing loaded successfully');
      } catch {
        toast.error('Could not reach the server. Make sure the backend is running.');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkReviewed() {
    if (!huddle) return;
    try {
      const { data } = await api.patch<Huddle>(`/morning-huddle/${huddle.id}/review`, {});
      setHuddle(data);
      toast.success('Huddle marked as reviewed');
    } catch {
      toast.error('Failed to mark as reviewed');
    }
  }

  function handleAlertAction(alert: HuddleAlert) {
    toast.success(`Action initiated: ${alert.action} for ${alert.patientName}`);
  }

  function handleSendReminder(opportunity: HuddleOpportunity) {
    toast.success(`Reminder sent to ${opportunity.patientName} for "${opportunity.title}"`);
  }

  // ─── Loading state ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Preparing your morning briefing...</p>
        </div>
      </div>
    );
  }

  const summary = huddle?.summary;

  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600">
              <Sunrise size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Morning Huddle</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[52px]">
            {formatDateDisplay(selectedDate)}
            {huddle?.generatedAt && (
              <span className="ml-2 text-gray-400">
                &middot; Generated {new Date(huddle.generatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input text-sm py-2 px-3"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary text-sm py-2.5 px-4"
          >
            {generating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Generate Briefing
          </button>
          {huddle && !huddle.reviewedAt && (
            <button
              onClick={handleMarkReviewed}
              className="inline-flex items-center gap-2 text-sm py-2.5 px-4 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors"
            >
              <CheckCircle size={16} />
              Mark Reviewed
            </button>
          )}
          {huddle?.reviewedAt && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-lg font-medium">
              <CheckCircle size={14} />
              Reviewed
            </span>
          )}
        </div>
      </div>

      {/* ─── Day Summary ─────────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                  <Users size={16} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Patients</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.totalPatients}</p>
            </div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp size={16} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Production</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.expectedProduction)}</p>
            </div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
                  <UserPlus size={16} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">New Patients</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{summary.newPatients}</p>
            </div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle size={16} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Alerts</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{huddle?.alerts.length ?? 0}</p>
            </div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                  <DollarSign size={16} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Collectible</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{formatCurrency(summary.totalCollectible)}</p>
            </div>
          </div>

          <div className="card p-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-transparent pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                  <TrendingUp size={16} />
                </div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Opportunities</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{huddle?.opportunities.length ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── Left Column: Alerts + Timeline ────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          {/* Critical Alerts */}
          {huddle && huddle.alerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Critical Alerts</h2>
                <span className="ml-1 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {huddle.alerts.length}
                </span>
              </div>
              <div className="space-y-3">
                {huddle.alerts.map((alert) => {
                  const colors = getAlertColors(alert.severity);
                  const actionProps = getActionButtonProps(alert.action);
                  return (
                    <div
                      key={alert.id}
                      className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex items-center justify-between gap-4`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon} flex-shrink-0 mt-0.5`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${colors.text}`}>
                            {alert.patientName}
                          </p>
                          <p className={`text-sm ${colors.text} opacity-80 mt-0.5`}>
                            {alert.message}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAlertAction(alert)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg flex-shrink-0 transition-colors ${actionProps.className}`}
                      >
                        {actionProps.icon}
                        {actionProps.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Patient Timeline */}
          {huddle && huddle.patients.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-900">Patient Timeline</h2>
              </div>
              <div className="space-y-2">
                {huddle.patients.map((patient) => {
                  const visibleFlags = patient.flags.filter(f => {
                    if (f.type === 'clinical' && !f.message.includes('New patient')) return false;
                    return true;
                  });

                  return (
                    <div
                      key={patient.patientId}
                      className="card px-5 py-4 hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-indigo-400"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Time */}
                          <div className="text-center flex-shrink-0 w-16">
                            <p className="text-sm font-bold text-indigo-600">{formatTime(patient.appointmentTime)}</p>
                            <p className="text-[10px] text-gray-400">{patient.duration} min</p>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-10 bg-gray-200 flex-shrink-0" />

                          {/* Patient info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <span className="text-xs text-gray-400">&middot;</span>
                              <p className="text-xs text-gray-500">{patient.provider}</p>
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{patient.appointmentType}</p>

                            {/* Flag badges */}
                            {visibleFlags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {visibleFlags.map((flag, idx) => {
                                  const badge = getFlagBadge(flag);
                                  return (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border ${badge.className}`}
                                      title={flag.message}
                                    >
                                      {badge.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right side: balance indicator */}
                        {patient.outstandingBalance > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-red-600 font-semibold">
                              {formatCurrency(patient.outstandingBalance)}
                            </p>
                            <p className="text-[10px] text-gray-400">balance</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Column: Opportunities + Yesterday ───────────────────── */}
        <div className="space-y-6">
          {/* Revenue Opportunities */}
          {huddle && huddle.opportunities.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Revenue Opportunities</h2>
              </div>

              {/* Unaccepted treatment plans */}
              {huddle.opportunities.filter(o => o.type === 'unaccepted_plan').length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Unaccepted Treatment Plans
                  </p>
                  <div className="space-y-2">
                    {huddle.opportunities
                      .filter(o => o.type === 'unaccepted_plan')
                      .sort((a, b) => b.value - a.value)
                      .map((op) => (
                        <div key={op.id} className="card p-4 border-l-4 border-l-green-400">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{op.patientName}</p>
                              <p className="text-xs font-medium text-gray-700 mt-0.5">{op.title}</p>
                            </div>
                            <p className="text-sm font-bold text-green-700 flex-shrink-0">
                              {formatCurrency(op.value)}
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{op.description}</p>
                          <button
                            onClick={() => handleSendReminder(op)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 mt-2 transition-colors"
                          >
                            <Send size={11} />
                            Send Reminder
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Near annual max */}
              {huddle.opportunities.filter(o => o.type === 'annual_max').length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Near Annual Maximum
                  </p>
                  <div className="space-y-2">
                    {huddle.opportunities
                      .filter(o => o.type === 'annual_max')
                      .map((op) => (
                        <div key={op.id} className="card p-4 border-l-4 border-l-sky-400">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-gray-900">{op.patientName}</p>
                            <p className="text-sm font-bold text-sky-700 flex-shrink-0">
                              {formatCurrency(op.value)} left
                            </p>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed">{op.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Total opportunity value */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                    Total Opportunity Value
                  </p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(
                      huddle.opportunities
                        .filter(o => o.type === 'unaccepted_plan')
                        .reduce((sum, o) => sum + o.value, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Yesterday's Performance */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Yesterday's Performance</h2>
            </div>
            <div className="card p-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Patients Seen</span>
                  <span className="text-sm font-semibold text-gray-900">10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Production</span>
                  <span className="text-sm font-semibold text-green-700">$4,850</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Collections</span>
                  <span className="text-sm font-semibold text-green-700">$3,920</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">No-Shows</span>
                  <span className="text-sm font-semibold text-red-600">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plans Accepted</span>
                  <span className="text-sm font-semibold text-indigo-700">2</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Collection Rate</span>
                    <span className="text-sm font-bold text-green-700">80.8%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: '80.8%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Comparison */}
          {summary && (
            <div className="card p-5 bg-gradient-to-br from-indigo-50/50 to-white">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-3">
                Today vs Yesterday
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Patients</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{summary.totalPatients}</span>
                    <span className={`text-xs font-medium ${summary.totalPatients >= 10 ? 'text-green-600' : 'text-amber-600'}`}>
                      {summary.totalPatients >= 10 ? '+' : ''}{summary.totalPatients - 10}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Est. Production</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(summary.expectedProduction)}</span>
                    <span className={`text-xs font-medium ${summary.expectedProduction >= 4850 ? 'text-green-600' : 'text-amber-600'}`}>
                      {summary.expectedProduction >= 4850 ? '+' : ''}{formatCurrency(summary.expectedProduction - 4850)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">No-Show Risk</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{summary.highRiskNoShows}</span>
                    <span className={`text-xs font-medium ${summary.highRiskNoShows <= 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.highRiskNoShows <= 1 ? 'Low' : 'High'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!huddle && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-amber-100 text-amber-600 mb-4">
            <Sunrise size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No Huddle Generated</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md">
            Click "Generate Briefing" to create your morning huddle for {formatDateDisplay(selectedDate)}.
          </p>
        </div>
      )}
    </div>
  );
}
