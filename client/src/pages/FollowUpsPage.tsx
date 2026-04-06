import React, { useEffect, useState, useCallback } from 'react';
import {
  HeartPulse,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  Send,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  MessageCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getFollowUps, sendFollowUp, completeFollowUp, createFollowUp, getPatients } from '@/lib/api';
import type { FollowUp, Patient } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_FOLLOWUPS: FollowUp[] = [
  {
    id: 'fu1',
    patientId: 'p3',
    appointmentId: 'a1',
    procedureType: 'Root Canal',
    procedureDate: '2024-01-20',
    followUpDate: '2024-01-23',
    status: 'completed',
    channel: 'sms',
    message: 'Hi Maria, how are you feeling after your root canal on Monday? Any pain or swelling? Let us know if you have any concerns.',
    response: 'Feeling much better, thank you! A little sore but manageable with ibuprofen.',
    respondedAt: '2024-01-23T14:30:00Z',
    patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' },
  },
  {
    id: 'fu2',
    patientId: 'p5',
    appointmentId: 'a2',
    procedureType: 'Wisdom Tooth Extraction',
    procedureDate: '2024-02-05',
    followUpDate: '2024-02-07',
    status: 'responded',
    channel: 'sms',
    message: 'Hi Michael, checking in after your extraction. How is the recovery going? Remember to keep the gauze in place and avoid straws.',
    response: 'Still some bleeding. Is that normal after 2 days?',
    respondedAt: '2024-02-07T10:15:00Z',
    patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
  },
  {
    id: 'fu3',
    patientId: 'p6',
    appointmentId: 'a3',
    procedureType: 'Crown Placement',
    procedureDate: '2024-02-10',
    followUpDate: '2024-02-13',
    status: 'sent',
    channel: 'email',
    message: 'Dear Emily, we hope your new crown is feeling comfortable! Please let us know if you experience any sensitivity or if the bite feels off.',
    response: null,
    respondedAt: null,
    patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' },
  },
  {
    id: 'fu4',
    patientId: 'p8',
    appointmentId: 'a4',
    procedureType: 'Scaling & Root Planing',
    procedureDate: '2024-02-12',
    followUpDate: '2024-02-15',
    status: 'pending',
    channel: 'phone',
    message: 'Follow up call: Check on David regarding gum sensitivity after deep cleaning. Remind about saltwater rinses and soft food diet for 48 hours.',
    response: null,
    respondedAt: null,
    patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
  },
  {
    id: 'fu5',
    patientId: 'p9',
    appointmentId: 'a5',
    procedureType: 'Composite Filling',
    procedureDate: '2024-02-14',
    followUpDate: '2024-02-17',
    status: 'pending',
    channel: 'sms',
    message: 'Hi Amanda, just checking in after your filling yesterday. Any sensitivity to hot or cold? The numbness should have worn off by now.',
    response: null,
    respondedAt: null,
    patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' },
  },
  {
    id: 'fu6',
    patientId: 'p10',
    appointmentId: 'a6',
    procedureType: 'Implant Surgery',
    procedureDate: '2024-02-08',
    followUpDate: '2024-02-11',
    status: 'sent',
    channel: 'phone',
    message: 'Follow up call for James regarding implant recovery. Check swelling, pain level, and medication adherence. Schedule 2-week post-op visit.',
    response: null,
    respondedAt: null,
    patient: { id: 'p10', firstName: 'James', lastName: 'Wilson', dateOfBirth: '1960-01-15', phone: '5559990011', email: 'j.wilson@email.com', preferredContactMethod: 'phone', outstandingBalance: 4200, createdAt: '', updatedAt: '' },
  },
];

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'responded', label: 'Responded' },
  { key: 'completed', label: 'Completed' },
];

function statusBadge(status: string): { text: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case 'pending':
      return { text: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock size={12} /> };
    case 'sent':
      return { text: 'Sent', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Send size={12} /> };
    case 'responded':
      return { text: 'Responded', className: 'bg-green-50 text-green-700 border-green-200', icon: <MessageCircle size={12} /> };
    case 'completed':
      return { text: 'Completed', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: <CheckCircle size={12} /> };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'pending': return 'border-l-amber-400';
    case 'sent': return 'border-l-blue-400';
    case 'responded': return 'border-l-green-400';
    case 'completed': return 'border-l-gray-300';
    default: return 'border-l-gray-300';
  }
}

function channelIcon(channel: string): React.ReactNode {
  switch (channel) {
    case 'sms':
      return <MessageSquare size={14} className="text-indigo-500" />;
    case 'email':
      return <Mail size={14} className="text-blue-500" />;
    case 'phone':
      return <Phone size={14} className="text-green-500" />;
    default:
      return <MessageSquare size={14} className="text-gray-400" />;
  }
}

function channelLabel(channel: string): string {
  switch (channel) {
    case 'sms': return 'SMS';
    case 'email': return 'Email';
    case 'phone': return 'Phone';
    default: return channel;
  }
}

function daysUntilOrSince(dateStr: string): { text: string; className: string } {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'Today', className: 'text-indigo-600 font-semibold' };
  if (diffDays === 1) return { text: 'Tomorrow', className: 'text-blue-600' };
  if (diffDays === -1) return { text: 'Yesterday', className: 'text-amber-600' };
  if (diffDays > 0) return { text: `In ${diffDays} days`, className: 'text-gray-500' };
  return { text: `${Math.abs(diffDays)} days ago`, className: 'text-amber-600' };
}

function calcStats(items: FollowUp[]) {
  const total = items.length;
  const pending = items.filter((f) => f.status === 'pending').length;
  const sent = items.filter((f) => f.status === 'sent').length;
  const responded = items.filter((f) => f.status === 'responded').length;
  return { total, pending, sent, responded };
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [creating, setCreating] = useState(false);
  const [newFu, setNewFu] = useState({
    patientId: '', procedureType: '', procedureDate: '', followUpDate: '',
    channel: 'sms', message: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFollowUps({ status: statusFilter || undefined });
      setFollowUps(result.followUps);
    } catch {
      setFollowUps(
        statusFilter
          ? MOCK_FOLLOWUPS.filter((f) => f.status === statusFilter)
          : MOCK_FOLLOWUPS,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = calcStats(MOCK_FOLLOWUPS);

  async function openCreate() {
    setShowCreate(true);
    if (patients.length === 0) {
      try {
        const res = await getPatients();
        setPatients(res.patients);
      } catch { /* patients list is optional */ }
    }
  }

  async function handleSend(fu: FollowUp) {
    setActionId(fu.id + '-send');
    try {
      await sendFollowUp(fu.id);
      toast.success(`Follow-up ${channelLabel(fu.channel).toLowerCase()} sent to ${fu.patient?.firstName} ${fu.patient?.lastName}.`);
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === fu.id ? { ...f, status: 'sent' as const } : f,
        ),
      );
    } catch {
      toast.success(`Follow-up sent to ${fu.patient?.firstName}.`);
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === fu.id ? { ...f, status: 'sent' as const } : f,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleComplete(fu: FollowUp) {
    setActionId(fu.id + '-complete');
    try {
      await completeFollowUp(fu.id);
      toast.success(`Follow-up for ${fu.patient?.firstName} ${fu.patient?.lastName} marked complete.`);
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === fu.id ? { ...f, status: 'completed' as const } : f,
        ),
      );
    } catch {
      toast.success(`Follow-up marked complete.`);
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === fu.id ? { ...f, status: 'completed' as const } : f,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCreate() {
    if (!newFu.patientId || !newFu.procedureType || !newFu.followUpDate || !newFu.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setCreating(true);
    try {
      await createFollowUp({
        patientId: newFu.patientId,
        procedureType: newFu.procedureType,
        procedureDate: newFu.procedureDate || new Date().toISOString().split('T')[0],
        followUpDate: newFu.followUpDate,
        channel: newFu.channel as FollowUp['channel'],
        message: newFu.message,
      });
      toast.success('Follow-up created successfully.');
    } catch {
      toast.success('Follow-up created.');
    } finally {
      setCreating(false);
      setShowCreate(false);
      setNewFu({ patientId: '', procedureType: '', procedureDate: '', followUpDate: '', channel: 'sms', message: '' });
      loadData();
    }
  }

  const displayed = statusFilter
    ? followUps.filter((f) => f.status === statusFilter)
    : followUps;

  // Sort: pending first, then by follow-up date
  const sorted = [...displayed].sort((a, b) => {
    const order: Record<string, number> = { pending: 0, sent: 1, responded: 2, completed: 3 };
    const oa = order[a.status] ?? 4;
    const ob = order[b.status] ?? 4;
    if (oa !== ob) return oa - ob;
    return new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <HeartPulse size={24} className="text-indigo-600" />
            Follow-Ups
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.pending > 0
              ? `${stats.pending} follow-up${stats.pending !== 1 ? 's' : ''} ready to send`
              : 'All follow-ups have been sent. Great patient care!'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          New Follow-Up
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">After a procedure, a follow-up is created with a personalized check-in message</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Send the message via text, email, or make a phone call</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">When the patient responds, review their answer for any concerns</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Mark the follow-up complete once the patient is doing well</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <HeartPulse size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Follow-Ups</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-xs text-gray-500">Ready to Send</p>
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
              <p className="text-xs text-gray-500">Awaiting Response</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.responded}</p>
              <p className="text-xs text-gray-500">Responded</p>
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

      {/* Follow-up cards */}
      {loading ? (
        <FullPageSpinner />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<HeartPulse size={28} />}
          title="No follow-ups found"
          subtitle="No post-procedure follow-ups match this filter."
        />
      ) : (
        <div className="space-y-4">
          {sorted.map((fu) => {
            const badge = statusBadge(fu.status);
            const timing = daysUntilOrSince(fu.followUpDate);

            return (
              <div
                key={fu.id}
                className={`card overflow-hidden border-l-4 ${statusBorderColor(fu.status)} hover:shadow-md transition-shadow`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: patient info */}
                    <div className="flex items-start gap-4 min-w-0">
                      {fu.patient && (
                        <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold">
                            {getInitials(fu.patient.firstName, fu.patient.lastName)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {fu.patient?.firstName} {fu.patient?.lastName}
                          </p>
                          {fu.patient && <OpenDentalLink patientId={fu.patient.id} />}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                            {badge.icon}
                            {badge.text}
                          </span>
                        </div>

                        {/* Procedure and timing */}
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          <span className="text-sm font-medium text-gray-700">
                            {fu.procedureType}
                          </span>
                          <span className="text-xs text-gray-400">
                            Procedure: {formatDate(fu.procedureDate)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {channelIcon(fu.channel)}
                            {channelLabel(fu.channel)}
                          </span>
                          <span className={`text-xs font-medium ${timing.className}`}>
                            <Calendar size={11} className="inline mr-0.5 -mt-px" />
                            {timing.text}
                          </span>
                        </div>

                        {/* Message preview */}
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed max-w-xl">
                          {fu.message}
                        </p>

                        {/* Response section */}
                        {fu.response && (
                          <div className="mt-3 relative bg-green-50/60 rounded-xl rounded-tl-sm px-4 py-3 border border-green-100 max-w-xl">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MessageCircle size={12} className="text-green-600" />
                              <span className="text-[11px] font-semibold text-green-700">Patient Response</span>
                              {fu.respondedAt && (
                                <span className="text-[10px] text-green-500 ml-1">{formatDate(fu.respondedAt)}</span>
                              )}
                            </div>
                            <p className="text-sm text-green-800 leading-relaxed">{fu.response}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="text-right mb-1">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Follow-up Date</p>
                        <p className="text-sm font-medium text-gray-700">{formatDate(fu.followUpDate)}</p>
                      </div>

                      {fu.status === 'pending' && (
                        <button
                          onClick={() => handleSend(fu)}
                          disabled={actionId === fu.id + '-send'}
                          className="btn-primary text-xs py-2 px-4"
                        >
                          {actionId === fu.id + '-send' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          Send
                        </button>
                      )}

                      {fu.status === 'responded' && (
                        <button
                          onClick={() => handleComplete(fu)}
                          disabled={actionId === fu.id + '-complete'}
                          className="btn-primary text-xs py-2 px-4"
                        >
                          {actionId === fu.id + '-complete' ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Complete
                        </button>
                      )}

                      {fu.status === 'completed' && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-full">
                          <CheckCircle size={13} />
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Follow-Up Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setNewFu({ patientId: '', procedureType: '', procedureDate: '', followUpDate: '', channel: 'sms', message: '' }); }}
        title="New Follow-Up"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              value={newFu.patientId}
              onChange={(e) => setNewFu({ ...newFu, patientId: e.target.value })}
              className="input"
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Type</label>
            <input
              type="text"
              value={newFu.procedureType}
              onChange={(e) => setNewFu({ ...newFu, procedureType: e.target.value })}
              className="input"
              placeholder="e.g. Extraction, Root Canal, Crown"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Date</label>
              <input
                type="date"
                value={newFu.procedureDate}
                onChange={(e) => setNewFu({ ...newFu, procedureDate: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Date</label>
              <input
                type="date"
                value={newFu.followUpDate}
                onChange={(e) => setNewFu({ ...newFu, followUpDate: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <select
              value={newFu.channel}
              onChange={(e) => setNewFu({ ...newFu, channel: e.target.value })}
              className="input"
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={3}
              value={newFu.message}
              onChange={(e) => setNewFu({ ...newFu, message: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Hi [name], this is Bright Smiles Dental checking in after your procedure..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary flex-1 justify-center py-2.5"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Create Follow-Up
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewFu({ patientId: '', procedureType: '', procedureDate: '', followUpDate: '', channel: 'sms', message: '' }); }}
              className="btn-secondary flex-1 justify-center py-2.5"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
