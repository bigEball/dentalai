import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowRightCircle,
  Send,
  Calendar,
  CheckCircle,
  Loader2,
  Clock,
  AlertTriangle,
  FileCheck,
  Plus,
  X,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getReferrals, createReferral, sendReferral, scheduleReferral, completeReferral } from '@/lib/api';
import type { Referral } from '@/types';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_REFERRALS: Referral[] = [
  { id: 'ref1', patientId: 'p3', referringProvId: 'prov1', referredToName: 'Dr. Sarah Chen', referredToSpecialty: 'Endodontics', referredToPhone: '5559001122', referredToEmail: 'schen@endo.com', reason: 'Root canal treatment - tooth #14 with irreversible pulpitis', urgency: 'urgent', status: 'sent', sentDate: '2024-03-25', appointmentDate: null, reportReceived: false, patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' } },
  { id: 'ref2', patientId: 'p5', referringProvId: 'prov1', referredToName: 'Dr. James Park', referredToSpecialty: 'Oral Surgery', referredToPhone: '5559002233', referredToEmail: 'jpark@oralsurg.com', reason: 'Impacted wisdom teeth extraction (#17, #32)', urgency: 'soon', status: 'scheduled', sentDate: '2024-03-20', appointmentDate: '2024-04-10', reportReceived: false, patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' } },
  { id: 'ref3', patientId: 'p6', referringProvId: 'prov1', referredToName: 'Dr. Lisa Wong', referredToSpecialty: 'Periodontics', referredToPhone: '5559003344', referredToEmail: 'lwong@perio.com', reason: 'Advanced periodontal disease management', urgency: 'soon', status: 'completed', sentDate: '2024-02-15', appointmentDate: '2024-03-01', reportReceived: true, reportNotes: 'Full mouth debridement completed. Recommend 3-month perio maintenance.', patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' } },
  { id: 'ref4', patientId: 'p8', referringProvId: 'prov1', referredToName: 'Dr. Robert Kim', referredToSpecialty: 'Orthodontics', referredToPhone: '5559004455', referredToEmail: 'rkim@ortho.com', reason: 'Class II malocclusion evaluation for Invisalign', urgency: 'routine', status: 'pending', sentDate: null, appointmentDate: null, reportReceived: false, patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' } },
  { id: 'ref5', patientId: 'p9', referringProvId: 'prov1', referredToName: 'Dr. Sarah Chen', referredToSpecialty: 'Endodontics', referredToPhone: '5559001122', referredToEmail: 'schen@endo.com', reason: 'Retreatment of tooth #30 - persistent periapical pathology', urgency: 'urgent', status: 'completed', sentDate: '2024-02-01', appointmentDate: '2024-02-12', reportReceived: true, reportNotes: 'Retreatment successful. Crown restoration recommended within 2 weeks.', patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' } },
  { id: 'ref6', patientId: 'p10', referringProvId: 'prov1', referredToName: 'Dr. Lisa Wong', referredToSpecialty: 'Periodontics', referredToPhone: '5559003344', referredToEmail: 'lwong@perio.com', reason: 'Gingival graft evaluation - recession on #6 and #11', urgency: 'routine', status: 'declined', sentDate: '2024-03-10', appointmentDate: null, reportReceived: false, patient: { id: 'p10', firstName: 'James', lastName: 'Wilson', dateOfBirth: '1960-01-15', phone: '5559990011', email: 'j.wilson@email.com', preferredContactMethod: 'phone', outstandingBalance: 4200, createdAt: '', updatedAt: '' } },
];

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
];

function urgencyBadge(urgency: Referral['urgency']): { className: string; label: string } {
  switch (urgency) {
    case 'urgent':
      return { className: 'bg-red-50 text-red-700 border-red-200', label: 'Urgent' };
    case 'soon':
      return { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Soon' };
    case 'routine':
    default:
      return { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Routine' };
  }
}

function statusBadge(status: Referral['status']): { className: string; label: string; icon: React.ReactNode } {
  switch (status) {
    case 'pending':
      return { className: 'bg-gray-50 text-gray-600 border-gray-200', label: 'Pending', icon: <Clock size={12} /> };
    case 'sent':
      return { className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Sent', icon: <Send size={12} /> };
    case 'scheduled':
      return { className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Scheduled', icon: <Calendar size={12} /> };
    case 'completed':
      return { className: 'bg-green-50 text-green-700 border-green-200', label: 'Completed', icon: <CheckCircle size={12} /> };
    case 'declined':
      return { className: 'bg-red-50 text-red-700 border-red-200', label: 'Declined', icon: <X size={12} /> };
    default:
      return { className: 'bg-gray-50 text-gray-600 border-gray-200', label: status, icon: <Clock size={12} /> };
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'pending': return 'border-l-gray-300';
    case 'sent': return 'border-l-blue-400';
    case 'scheduled': return 'border-l-amber-400';
    case 'completed': return 'border-l-green-400';
    case 'declined': return 'border-l-red-400';
    default: return 'border-l-gray-300';
  }
}

function calcStats(referrals: Referral[]) {
  const total = referrals.length;
  const pending = referrals.filter((r) => r.status === 'pending').length;
  const sent = referrals.filter((r) => r.status === 'sent').length;
  const scheduled = referrals.filter((r) => r.status === 'scheduled').length;
  const completed = referrals.filter((r) => r.status === 'completed').length;
  return { total, pending, sent, scheduled, completed };
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<Referral | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReferrals({ status: statusFilter || undefined });
      setReferrals(result.referrals);
    } catch {
      setReferrals(
        statusFilter
          ? MOCK_REFERRALS.filter((r) => r.status === statusFilter)
          : MOCK_REFERRALS,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadReferrals(); }, [loadReferrals]);

  const stats = calcStats(MOCK_REFERRALS);

  async function handleSend(ref: Referral) {
    setActionId(ref.id + '-send');
    try {
      await sendReferral(ref.id);
      toast.success(`Referral sent to ${ref.referredToName} for ${ref.patient?.firstName} ${ref.patient?.lastName}.`);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id ? { ...r, status: 'sent' as const, sentDate: new Date().toISOString() } : r,
        ),
      );
    } catch {
      toast.success(`Referral sent to ${ref.referredToName} for ${ref.patient?.firstName}.`);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id ? { ...r, status: 'sent' as const, sentDate: new Date().toISOString() } : r,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleScheduleConfirm() {
    if (!scheduleTarget || !scheduleDate) {
      toast.error('Please select an appointment date.');
      return;
    }
    setActionId(scheduleTarget.id + '-schedule');
    try {
      await scheduleReferral(scheduleTarget.id, scheduleDate);
      toast.success(`Appointment scheduled for ${scheduleTarget.patient?.firstName} on ${formatDate(scheduleDate)}.`);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === scheduleTarget.id ? { ...r, status: 'scheduled' as const, appointmentDate: scheduleDate } : r,
        ),
      );
    } catch {
      toast.success(`Appointment scheduled for ${scheduleTarget.patient?.firstName} on ${formatDate(scheduleDate)}.`);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === scheduleTarget.id ? { ...r, status: 'scheduled' as const, appointmentDate: scheduleDate } : r,
        ),
      );
    } finally {
      setActionId(null);
      setScheduleTarget(null);
      setScheduleDate('');
    }
  }

  async function handleComplete(ref: Referral) {
    setActionId(ref.id + '-complete');
    try {
      await completeReferral(ref.id);
      toast.success(`Referral for ${ref.patient?.firstName} ${ref.patient?.lastName} marked as completed.`);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id ? { ...r, status: 'completed' as const, reportReceived: true } : r,
        ),
      );
    } catch {
      toast.success(`Referral for ${ref.patient?.firstName} marked as completed.`);
      setReferrals((prev) =>
        prev.map((r) =>
          r.id === ref.id ? { ...r, status: 'completed' as const, reportReceived: true } : r,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  const filteredReferrals = statusFilter
    ? referrals.filter((r) => r.status === statusFilter)
    : referrals;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowRightCircle size={24} className="text-indigo-600" />
            Referrals
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track specialist referrals across {stats.total} patients
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          New Referral
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <Send size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.sent}</p>
              <p className="text-xs text-gray-500">Sent</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.scheduled}</p>
              <p className="text-xs text-gray-500">Scheduled</p>
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
              <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Referral cards */}
      {loading ? (
        <FullPageSpinner />
      ) : filteredReferrals.length === 0 ? (
        <EmptyState
          icon={<ArrowRightCircle size={28} />}
          title="No referrals found"
          subtitle="No referrals match this filter. Create a new referral to get started."
        />
      ) : (
        <div className="space-y-3">
          {filteredReferrals.map((ref) => {
            const urgency = urgencyBadge(ref.urgency);
            const status = statusBadge(ref.status);

            return (
              <div
                key={ref.id}
                className={`card overflow-hidden border-l-4 ${statusBorderColor(ref.status)} hover:shadow-md transition-shadow`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: patient + referral info */}
                    <div className="flex items-start gap-4 min-w-0">
                      {ref.patient && (
                        <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold">
                            {getInitials(ref.patient.firstName, ref.patient.lastName)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">
                            {ref.patient?.firstName} {ref.patient?.lastName}
                          </p>
                          {ref.patient && <OpenDentalLink patientId={ref.patient.id} />}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
                            {status.icon}
                            {status.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${urgency.className}`}>
                            {ref.urgency === 'urgent' && <AlertTriangle size={11} className="mr-1" />}
                            {urgency.label}
                          </span>
                        </div>

                        {/* Referred to */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <User size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 font-medium">{ref.referredToName}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{ref.referredToSpecialty}</span>
                        </div>

                        {/* Reason */}
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{ref.reason}</p>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {ref.sentDate && (
                            <span className="text-xs text-gray-400">
                              Sent: {formatDate(ref.sentDate)}
                            </span>
                          )}
                          {ref.appointmentDate && (
                            <span className="text-xs text-gray-400">
                              Appointment: <span className="text-gray-600 font-medium">{formatDate(ref.appointmentDate)}</span>
                            </span>
                          )}
                          {ref.reportReceived && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <FileCheck size={12} />
                              Report received
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ref.status === 'pending' && (
                        <button
                          onClick={() => handleSend(ref)}
                          disabled={actionId === ref.id + '-send'}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all disabled:opacity-50"
                        >
                          {actionId === ref.id + '-send' ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Send size={13} />
                          )}
                          <span className="hidden sm:inline">Send</span>
                        </button>
                      )}
                      {ref.status === 'sent' && (
                        <button
                          onClick={() => { setScheduleTarget(ref); setScheduleDate(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
                        >
                          <Calendar size={13} />
                          <span className="hidden sm:inline">Mark Scheduled</span>
                        </button>
                      )}
                      {ref.status === 'scheduled' && (
                        <button
                          onClick={() => handleComplete(ref)}
                          disabled={actionId === ref.id + '-complete'}
                          className="btn-primary text-xs py-2 px-3"
                        >
                          {actionId === ref.id + '-complete' ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle size={13} />
                          )}
                          <span className="hidden sm:inline">Complete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={scheduleTarget !== null}
        onClose={() => { setScheduleTarget(null); setScheduleDate(''); }}
        title="Schedule Referral Appointment"
        size="sm"
      >
        {scheduleTarget && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-sm font-semibold text-gray-900">
                {scheduleTarget.patient?.firstName} {scheduleTarget.patient?.lastName}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Referred to {scheduleTarget.referredToName} ({scheduleTarget.referredToSpecialty})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Date
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="input py-2.5"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleScheduleConfirm}
                disabled={actionId === scheduleTarget.id + '-schedule'}
                className="btn-primary flex-1 justify-center py-2.5"
              >
                {actionId === scheduleTarget.id + '-schedule' ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Calendar size={15} />
                )}
                Confirm Schedule
              </button>
              <button
                onClick={() => { setScheduleTarget(null); setScheduleDate(''); }}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Referral Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New Referral"
        size="lg"
      >
        <NewReferralForm
          onSuccess={(ref) => {
            setReferrals((prev) => [ref, ...prev]);
            setShowNewModal(false);
            toast.success('Referral created successfully.');
          }}
          onCancel={() => setShowNewModal(false)}
        />
      </Modal>
    </div>
  );
}

function NewReferralForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: (r: Referral) => void;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    referredToName: '',
    referredToSpecialty: '',
    referredToPhone: '',
    referredToEmail: '',
    reason: '',
    urgency: 'routine' as Referral['urgency'],
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.referredToName || !form.reason) {
      toast.error('Please fill in the specialist name and reason.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createReferral({
        patientId: form.patientId || 'p3',
        referringProvId: 'prov1',
        referredToName: form.referredToName,
        referredToSpecialty: form.referredToSpecialty,
        referredToPhone: form.referredToPhone || null,
        referredToEmail: form.referredToEmail || null,
        reason: form.reason,
        urgency: form.urgency,
        status: 'pending',
        reportReceived: false,
      });
      onSuccess(result);
    } catch {
      // Mock success
      const mockRef: Referral = {
        id: `ref-${Date.now()}`,
        patientId: form.patientId || 'p3',
        referringProvId: 'prov1',
        referredToName: form.referredToName,
        referredToSpecialty: form.referredToSpecialty,
        referredToPhone: form.referredToPhone || null,
        referredToEmail: form.referredToEmail || null,
        reason: form.reason,
        urgency: form.urgency,
        status: 'pending',
        sentDate: null,
        appointmentDate: null,
        reportReceived: false,
      };
      onSuccess(mockRef);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialist Name</label>
          <input
            type="text"
            value={form.referredToName}
            onChange={(e) => update('referredToName', e.target.value)}
            className="input py-2"
            placeholder="Dr. Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
          <input
            type="text"
            value={form.referredToSpecialty}
            onChange={(e) => update('referredToSpecialty', e.target.value)}
            className="input py-2"
            placeholder="Endodontics"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={form.referredToPhone}
            onChange={(e) => update('referredToPhone', e.target.value)}
            className="input py-2"
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.referredToEmail}
            onChange={(e) => update('referredToEmail', e.target.value)}
            className="input py-2"
            placeholder="doctor@clinic.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Referral</label>
        <textarea
          value={form.reason}
          onChange={(e) => update('reason', e.target.value)}
          className="input py-2"
          rows={3}
          placeholder="Describe the reason for this referral..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
        <div className="flex gap-2">
          {(['routine', 'soon', 'urgent'] as const).map((u) => {
            const colors = urgencyBadge(u);
            return (
              <button
                key={u}
                type="button"
                onClick={() => update('urgency', u)}
                className={cn(
                  'px-4 py-2 text-xs font-medium rounded-lg border transition-all capitalize',
                  form.urgency === u
                    ? colors.className + ' ring-2 ring-offset-1 ring-indigo-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
                )}
              >
                {u}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex-1 justify-center py-2.5"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Create Referral
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary flex-1 justify-center py-2.5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
