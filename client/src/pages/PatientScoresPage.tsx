import React, { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  MessageSquare,
  ClipboardCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Info,
  CreditCard,
  CalendarX,
  Megaphone,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getAllPatientScores, getScoreAlerts } from '@/lib/api';
import type { PatientScores, ScoreAlert } from '@/types';
import { getInitials } from '@/lib/utils';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

type SortField = 'composite' | 'attendance' | 'financial' | 'engagement' | 'treatmentCommitment';

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-700';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-amber-100 text-amber-600';
  if (score >= 40) return 'bg-orange-100 text-orange-600';
  return 'bg-red-100 text-red-700';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function severityIcon(severity: string) {
  switch (severity) {
    case 'critical': return <AlertCircle size={14} className="text-red-500" />;
    case 'warning': return <AlertTriangle size={14} className="text-amber-500" />;
    default: return <Info size={14} className="text-blue-500" />;
  }
}

function alertTypeIcon(type: string) {
  switch (type) {
    case 'deposit_required': return <CreditCard size={14} />;
    case 'double_book': return <CalendarX size={14} />;
    case 'priority_outreach': return <Megaphone size={14} />;
    case 'front_desk_warning': return <AlertTriangle size={14} />;
    case 'high_value': return <Star size={14} />;
    default: return <Info size={14} />;
  }
}

function alertTypeBg(type: string): string {
  switch (type) {
    case 'deposit_required': return 'bg-red-50 border-red-200 text-red-700';
    case 'double_book': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'priority_outreach': return 'bg-green-50 border-green-200 text-green-700';
    case 'front_desk_warning': return 'bg-red-50 border-red-200 text-red-800';
    case 'high_value': return 'bg-blue-50 border-blue-200 text-blue-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-600';
  }
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider w-20 text-right">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 ${scoreColor(score)}`}>{score}</span>
    </div>
  );
}

export default function PatientScoresPage() {
  const [scores, setScores] = useState<PatientScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortField>('composite');
  const [sortAsc, setSortAsc] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<'all' | 'alerts'>('all');
  const [alertScores, setAlertScores] = useState<PatientScores[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [all, alerts] = await Promise.all([
        getAllPatientScores(),
        getScoreAlerts(),
      ]);
      setScores(all);
      setAlertScores(alerts);
    } catch {
      toast.error('Failed to load patient scores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  }

  const displayScores = view === 'alerts' ? alertScores : scores;
  const sorted = [...displayScores].sort((a, b) => {
    const diff = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
    return sortAsc ? diff : -diff;
  });

  // Stats
  const avgComposite = scores.length > 0 ? Math.round(scores.reduce((s, p) => s + p.composite, 0) / scores.length) : 0;
  const highRisk = scores.filter((s) => s.composite < 40).length;
  const highValue = scores.filter((s) => s.composite >= 80).length;
  const totalAlerts = alertScores.reduce((s, p) => s + p.alerts.filter((a) => a.severity === 'critical' || a.severity === 'warning').length, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield size={24} className="text-indigo-600" />
            Patient Reliability Scores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered patient evaluation across attendance, financial, engagement, and treatment commitment
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Each patient gets four scores: attendance, financial, engagement, and treatment commitment</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Scores update automatically based on appointment history and payment behavior</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Sort by any score to find your most reliable — or most at-risk — patients</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Review alerts for patients whose scores drop below critical thresholds</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-indigo-500" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Avg Score</span>
          </div>
          <p className={`text-2xl font-bold ${scoreColor(avgComposite)}`}>{avgComposite}</p>
          <p className="text-xs text-gray-400">across {scores.length} patients</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Star size={14} className="text-green-500" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">High Value</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{highValue}</p>
          <p className="text-xs text-gray-400">score 80+</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown size={14} className="text-red-500" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">High Risk</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{highRisk}</p>
          <p className="text-xs text-gray-400">score below 40</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Active Alerts</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalAlerts}</p>
          <p className="text-xs text-gray-400">actions needed</p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={14} className="inline mr-1.5" />
          All Patients ({scores.length})
        </button>
        <button
          onClick={() => setView('alerts')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'alerts' ? 'bg-amber-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={14} className="inline mr-1.5" />
          Action Required ({alertScores.length})
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Patient</th>
                {(['composite', 'attendance', 'financial', 'engagement', 'treatmentCommitment'] as SortField[]).map((field) => {
                  const labels: Record<string, string> = {
                    composite: 'Overall', attendance: 'Attendance', financial: 'Financial',
                    engagement: 'Engagement', treatmentCommitment: 'Treatment',
                  };
                  const icons: Record<string, typeof Shield> = {
                    composite: Shield, attendance: Users, financial: DollarSign,
                    engagement: MessageSquare, treatmentCommitment: ClipboardCheck,
                  };
                  const Icon = icons[field];
                  return (
                    <th key={field} className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleSort(field)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                      >
                        <Icon size={11} />
                        {labels[field]}
                        {sortBy === field && (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                      </button>
                    </th>
                  );
                })}
                <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((patient) => {
                const isExpanded = expandedId === patient.patientId;
                const nameParts = patient.patientName.split(' ');
                return (
                  <React.Fragment key={patient.patientId}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : patient.patientId)}
                      className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">
                              {getInitials(nameParts[0] || '', nameParts[1] || '')}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{patient.patientName}</span>
                          <OpenDentalLink patientId={patient.patientId} />
                        </div>
                      </td>

                      {/* Scores */}
                      {(['composite', 'attendance', 'financial', 'engagement', 'treatmentCommitment'] as SortField[]).map((field) => (
                        <td key={field} className="px-3 py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center h-8 w-12 rounded-lg text-sm font-bold ${
                            field === 'composite' ? scoreBg(patient[field]) : scoreColor(patient[field])
                          }`}>
                            {patient[field]}
                          </span>
                        </td>
                      ))}

                      {/* Alerts count */}
                      <td className="px-5 py-3.5 text-center">
                        {patient.alerts.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {patient.alerts.some((a) => a.severity === 'critical') && (
                              <span className="h-2 w-2 rounded-full bg-red-500" />
                            )}
                            {patient.alerts.some((a) => a.severity === 'warning') && (
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                            )}
                            <span className="text-xs font-medium text-gray-500">{patient.alerts.length}</span>
                          </div>
                        ) : (
                          <CheckCircle size={14} className="text-green-400 mx-auto" />
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="px-5 py-4 bg-gray-50/30">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Score breakdown */}
                            <div className="space-y-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Score Breakdown</p>
                              <ScoreBar score={patient.attendance} label="Attendance" />
                              <ScoreBar score={patient.financial} label="Financial" />
                              <ScoreBar score={patient.engagement} label="Engagement" />
                              <ScoreBar score={patient.treatmentCommitment} label="Treatment" />
                              <div className="pt-2 border-t">
                                <ScoreBar score={patient.composite} label="Overall" />
                              </div>
                            </div>

                            {/* Alerts */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Automated Actions {patient.alerts.length > 0 && `(${patient.alerts.length})`}
                              </p>
                              {patient.alerts.length === 0 ? (
                                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg p-3">
                                  <CheckCircle size={16} />
                                  No actions needed — patient is in good standing
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {patient.alerts.map((alert, idx) => (
                                    <div key={idx} className={`flex items-start gap-2.5 p-3 rounded-lg border ${alertTypeBg(alert.type)}`}>
                                      <div className="flex-shrink-0 mt-0.5">{alertTypeIcon(alert.type)}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          {severityIcon(alert.severity)}
                                          <span className="text-xs font-semibold capitalize">
                                            {alert.type.replace(/_/g, ' ')}
                                          </span>
                                        </div>
                                        <p className="text-xs">{alert.message}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-400">No patients found</div>
          )}
        </div>
      )}
    </div>
  );
}
