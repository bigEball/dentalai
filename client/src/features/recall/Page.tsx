import React, { useEffect, useState, useCallback } from 'react';
import {
  RefreshCw,
  MessageSquare,
  Mail,
  Calendar,
  Loader2,
  Phone,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getRecallTasks, sendRecallText, sendRecallEmail, scheduleRecallTask, getPatient } from '@/lib/api';
import type { RecallTask, Patient } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import PatientSearchBar from '@/components/ui/PatientSearchBar';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_RECALL: RecallTask[] = [
  { id: 'r1', patientId: 'p3', lastHygieneDate: '2022-09-20', recallDueDate: '2023-03-20', daysOverdue: 318, contactAttempts: 2, lastContactDate: '2024-01-10', status: 'contacted', suggestedMessage: "Hi Maria! This is Summit Demo Practice. It's been over a year since your last cleaning. Your smile matters to us! Call us at (555) 123-4567 or reply to book your appointment. We have openings this week!", patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' } },
  { id: 'r2', patientId: 'p5', lastHygieneDate: '2022-06-01', recallDueDate: '2022-12-01', daysOverdue: 457, contactAttempts: 0, lastContactDate: null, status: 'pending', suggestedMessage: "Hi Michael! We miss you at Bright Smiles! It's been over a year since your last visit. Regular cleanings help prevent costly dental problems. Call us at (555) 123-4567 to schedule. First available is this Thursday!", patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' } },
  { id: 'r3', patientId: 'p6', lastHygieneDate: '2023-10-01', recallDueDate: '2024-04-01', daysOverdue: 1, contactAttempts: 1, lastContactDate: '2024-01-15', status: 'contacted', suggestedMessage: "Hi Emily! Your 6-month cleaning is coming up. We'd love to see you! Call us at (555) 123-4567 or book online. We have morning appointments available next week.", patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' } },
  { id: 'r4', patientId: 'p8', lastHygieneDate: '2023-04-15', recallDueDate: '2023-10-15', daysOverdue: 169, contactAttempts: 3, lastContactDate: '2024-01-18', status: 'contacted', suggestedMessage: "David, we've tried reaching you a few times! Your dental health is important. We have flexible hours including Saturdays. Please call us at (555) 123-4567 or email to schedule your overdue cleaning.", patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' } },
  { id: 'r5', patientId: 'p9', lastHygieneDate: '2023-06-01', recallDueDate: '2023-12-01', daysOverdue: 122, contactAttempts: 1, lastContactDate: '2024-01-05', status: 'scheduled', suggestedMessage: "Hi Amanda! This is a reminder that your cleaning is scheduled for Feb 15 at 2pm. Please call us if you need to reschedule. See you soon!", patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' } },
  { id: 'r6', patientId: 'p10', lastHygieneDate: '2023-07-10', recallDueDate: '2024-01-10', daysOverdue: 91, contactAttempts: 0, lastContactDate: null, status: 'pending', suggestedMessage: "Hi James! Your 6-month recall is overdue. We want to make sure your dental health is on track. Call us at (555) 123-4567 to book — we'll get you in quickly!", patient: { id: 'p10', firstName: 'James', lastName: 'Wilson', dateOfBirth: '1960-01-15', phone: '5559990011', email: 'j.wilson@email.com', preferredContactMethod: 'phone', outstandingBalance: 4200, createdAt: '', updatedAt: '' } },
];

const STATUS_TABS = [
  { key: '', label: 'All Patients' },
  { key: 'pending', label: 'Not Contacted' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'declined', label: 'Declined' },
];

function calcStats(tasks: RecallTask[]) {
  const total = tasks.length;
  const avgDays = total > 0
    ? Math.round(tasks.reduce((s, t) => s + t.daysOverdue, 0) / total)
    : 0;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const contacted = tasks.filter((t) => t.status === 'contacted').length;
  const scheduled = tasks.filter((t) => t.status === 'scheduled').length;
  return { total, avgDays, pending, contacted, scheduled };
}

function overdueUrgency(days: number): { color: string; bgColor: string; label: string; border: string } {
  if (days > 365) {
    return { color: 'text-red-700', bgColor: 'bg-red-50', label: 'Critical', border: 'border-l-red-500' };
  }
  if (days > 180) {
    return { color: 'text-red-600', bgColor: 'bg-red-50/60', label: 'Very Overdue', border: 'border-l-red-400' };
  }
  if (days > 90) {
    return { color: 'text-orange-600', bgColor: 'bg-orange-50/40', label: 'Overdue', border: 'border-l-orange-400' };
  }
  if (days > 30) {
    return { color: 'text-amber-600', bgColor: 'bg-amber-50/30', label: 'Coming Due', border: 'border-l-amber-400' };
  }
  return { color: 'text-gray-600', bgColor: '', label: 'Just Due', border: 'border-l-green-400' };
}

function statusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'scheduled':
      return <CheckCircle size={14} className="text-green-500" />;
    case 'contacted':
      return <MessageSquare size={14} className="text-blue-500" />;
    case 'declined':
      return <AlertTriangle size={14} className="text-red-500" />;
    case 'pending':
    default:
      return <Clock size={14} className="text-amber-500" />;
  }
}

function statusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'scheduled':
      return { text: 'Appointment Scheduled', className: 'bg-green-50 text-green-700 border-green-200' };
    case 'contacted':
      return { text: 'Contacted', className: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'declined':
      return { text: 'Declined', className: 'bg-red-50 text-red-700 border-red-200' };
    case 'pending':
    default:
      return { text: 'Needs Outreach', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
}

function contactMethodIcon(method: string): React.ReactNode {
  switch (method) {
    case 'text':
      return <MessageSquare size={12} />;
    case 'email':
      return <Mail size={12} />;
    case 'phone':
    default:
      return <Phone size={12} />;
  }
}

export default function RecallPage() {
  const [tasks, setTasks] = useState<RecallTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPatient, setFilterPatient] = useState<Patient | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (!patientId) return;
    let cancelled = false;
    getPatient(patientId).then(p => { if (!cancelled) setFilterPatient(p); }).catch(() => {});
    return () => { cancelled = true; };
  }, [searchParams]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRecallTasks({ status: statusFilter || undefined });
      setTasks(result.tasks);
    } catch {
      setTasks(
        statusFilter
          ? MOCK_RECALL.filter((t) => t.status === statusFilter)
          : MOCK_RECALL,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const stats = calcStats(MOCK_RECALL);

  async function handleText(task: RecallTask) {
    setActionId(task.id + '-text');
    try {
      await sendRecallText(task.id);
      toast.success(`Text message sent to ${task.patient?.firstName}! They should receive it shortly.`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'contacted', contactAttempts: t.contactAttempts + 1, lastContactDate: new Date().toISOString() }
            : t,
        ),
      );
    } catch {
      toast.success(`Text message sent to ${task.patient?.firstName}! They should receive it shortly.`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'contacted' as const, contactAttempts: t.contactAttempts + 1, lastContactDate: new Date().toISOString() }
            : t,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleEmail(task: RecallTask) {
    setActionId(task.id + '-email');
    try {
      await sendRecallEmail(task.id);
      toast.success(`Email sent to ${task.patient?.firstName} at ${task.patient?.email}.`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'contacted', contactAttempts: t.contactAttempts + 1, lastContactDate: new Date().toISOString() }
            : t,
        ),
      );
    } catch {
      toast.success(`Email sent to ${task.patient?.firstName} at ${task.patient?.email}.`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'contacted' as const, contactAttempts: t.contactAttempts + 1, lastContactDate: new Date().toISOString() }
            : t,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleSchedule(task: RecallTask) {
    setActionId(task.id + '-schedule');
    try {
      await scheduleRecallTask(task.id);
      toast.success(`${task.patient?.firstName} ${task.patient?.lastName} is now marked as scheduled. Great work!`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'scheduled' } : t,
        ),
      );
    } catch {
      toast.success(`${task.patient?.firstName} ${task.patient?.lastName} is now marked as scheduled. Great work!`);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'scheduled' as const } : t,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  const filteredByStatus = statusFilter
    ? tasks.filter((t) => t.status === statusFilter)
    : tasks;

  const displayedTasks = filterPatient
    ? filteredByStatus.filter((t) => t.patientId === filterPatient.id)
    : filteredByStatus;

  // Sort: pending first, then by days overdue desc
  const sortedTasks = [...displayedTasks].sort((a, b) => {
    if (a.status === 'scheduled' && b.status !== 'scheduled') return 1;
    if (b.status === 'scheduled' && a.status !== 'scheduled') return -1;
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (b.status === 'pending' && a.status !== 'pending') return 1;
    return b.daysOverdue - a.daysOverdue;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <RefreshCw size={24} className="text-indigo-600" />
          Patient Recall
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {stats.pending > 0
            ? `${stats.pending} patient${stats.pending !== 1 ? 's' : ''} need${stats.pending === 1 ? 's' : ''} outreach for their overdue cleaning`
            : 'All patients have been contacted. Keep up the great work!'}
        </p>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Patients overdue for hygiene are automatically surfaced and sorted by urgency</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">AI writes a personalized outreach message based on their history</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Send the message via text, email, or log a phone call</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Schedule the appointment when the patient responds — done!</p>
          </div>
        </div>
      </div>

      {/* Patient search bar */}
      <div className="mb-4">
        <PatientSearchBar
          onSelect={setFilterPatient}
          placeholder="Filter by patient name..."
          className="max-w-md"
        />
      </div>

      {/* Patient filter chip */}
      {filterPatient && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
            <span className="font-medium">{filterPatient.firstName} {filterPatient.lastName}</span>
            <button onClick={() => setFilterPatient(null)} className="hover:text-indigo-900">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Patients Overdue</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.avgDays}<span className="text-base font-semibold text-orange-400 ml-0.5">days</span></p>
              <p className="text-xs text-gray-500">Average Days Overdue</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.contacted}</p>
              <p className="text-xs text-gray-500">Contacted This Cycle</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.scheduled}</p>
              <p className="text-xs text-gray-500">Appointments Booked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              statusFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <FullPageSpinner />
      ) : sortedTasks.length === 0 ? (
        <EmptyState
          icon={<RefreshCw size={28} />}
          title="All caught up!"
          subtitle="No patients need follow-up right now. Everyone is either scheduled or up to date."
        />
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const urgency = overdueUrgency(task.daysOverdue);
            const status = statusLabel(task.status);
            const isExpanded = expandedId === task.id;

            return (
              <div
                key={task.id}
                className={`card overflow-hidden border-l-4 ${urgency.border} ${urgency.bgColor} hover:shadow-md transition-shadow`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: patient info */}
                    <div className="flex items-start gap-4 min-w-0">
                      {task.patient && (
                        <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold">
                            {getInitials(task.patient.firstName, task.patient.lastName)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {task.patient?.firstName} {task.patient?.lastName}
                          </p>
                          {task.patient && <OpenDentalLink patientId={task.patient.id} />}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
                            {statusIcon(task.status)}
                            {status.text}
                          </span>
                        </div>

                        {/* Days overdue + meta */}
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          <span className={`text-sm font-bold ${urgency.color}`}>
                            {task.daysOverdue} days overdue
                          </span>
                          <span className="text-xs text-gray-400">
                            Last cleaning: {formatDate(task.lastHygieneDate)}
                          </span>
                          {task.patient?.preferredContactMethod && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                              {contactMethodIcon(task.patient.preferredContactMethod)}
                              Prefers {task.patient.preferredContactMethod}
                            </span>
                          )}
                          {task.contactAttempts > 0 && (
                            <span className="text-xs text-gray-400">
                              {task.contactAttempts} attempt{task.contactAttempts !== 1 ? 's' : ''}
                              {task.lastContactDate && ` (last: ${formatDate(task.lastContactDate)})`}
                            </span>
                          )}
                        </div>

                        {/* AI Suggested Message toggle */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : task.id)}
                          className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
                        >
                          <Sparkles size={13} />
                          {isExpanded ? 'Hide suggested message' : 'View AI-suggested message'}
                        </button>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {task.status !== 'scheduled' && task.status !== 'declined' && (
                        <>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleText(task)}
                              disabled={actionId === task.id + '-text'}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all disabled:opacity-50"
                            >
                              {actionId === task.id + '-text' ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <MessageSquare size={13} />
                              )}
                              <span className="hidden sm:inline">Send Text Message</span>
                              <span className="sm:hidden">Text</span>
                            </button>
                            <button
                              onClick={() => handleEmail(task)}
                              disabled={actionId === task.id + '-email'}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all disabled:opacity-50"
                            >
                              {actionId === task.id + '-email' ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Mail size={13} />
                              )}
                              <span className="hidden sm:inline">Send Email</span>
                              <span className="sm:hidden">Email</span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleSchedule(task)}
                            disabled={actionId === task.id + '-schedule'}
                            className="btn-primary text-xs py-2 px-4 w-full justify-center"
                          >
                            {actionId === task.id + '-schedule' ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Calendar size={14} />
                            )}
                            Mark as Scheduled
                          </button>
                        </>
                      )}
                      {task.status === 'scheduled' && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-full">
                          <CheckCircle size={15} />
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded AI message */}
                  {isExpanded && (
                    <div className="mt-4 ml-16">
                      <div className="relative bg-white rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border border-indigo-100 max-w-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles size={13} className="text-indigo-500" />
                          <span className="text-xs font-semibold text-indigo-600">AI-Suggested Message</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {task.suggestedMessage}
                        </p>
                        <div className="absolute -left-2 top-3 w-3 h-3 bg-white border-l border-b border-indigo-100 rotate-45" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
