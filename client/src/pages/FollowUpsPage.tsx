import React, { useEffect, useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle,
  Loader2,
  MessageSquare,
  Mail,
  Phone,
  Plus,
  X,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getFollowUps, sendFollowUp, completeFollowUp, createFollowUp, getPatients } from '@/lib/api';
import type { FollowUp, Patient } from '@/types';
import { formatDate } from '@/lib/utils';

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'responded', label: 'Responded' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  sent: 'bg-blue-100 text-blue-700',
  responded: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
};

const CHANNEL_ICONS: Record<string, typeof MessageSquare> = {
  sms: MessageSquare,
  email: Mail,
  phone: Phone,
};

function daysFromNow(dateStr: string): string {
  const diff = Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [creating, setCreating] = useState(false);
  const [newFu, setNewFu] = useState({
    patientId: '', procedureType: '', procedureDate: '', followUpDate: '',
    channel: 'sms', message: '',
  });

  async function load() {
    setLoading(true);
    try {
      const res = await getFollowUps({ status: statusFilter || undefined });
      setFollowUps(res.followUps);
    } catch {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function handleSend(id: string) {
    try {
      await sendFollowUp(id);
      toast.success('Follow-up sent');
      load();
    } catch {
      toast.error('Failed to send');
    }
  }

  async function handleComplete(id: string) {
    try {
      await completeFollowUp(id);
      toast.success('Follow-up completed');
      load();
    } catch {
      toast.error('Failed to complete');
    }
  }

  async function openCreate() {
    setShowCreate(true);
    if (patients.length === 0) {
      try {
        const res = await getPatients();
        setPatients(res.patients);
      } catch { /* ignore */ }
    }
  }

  async function handleCreate() {
    if (!newFu.patientId || !newFu.procedureType || !newFu.followUpDate || !newFu.message) {
      toast.error('Fill in all required fields');
      return;
    }
    setCreating(true);
    try {
      await createFollowUp({
        patientId: newFu.patientId,
        procedureType: newFu.procedureType,
        procedureDate: newFu.procedureDate || new Date().toISOString().split('T')[0],
        followUpDate: newFu.followUpDate,
        channel: newFu.channel as any,
        message: newFu.message,
      });
      toast.success('Follow-up created');
      setShowCreate(false);
      setNewFu({ patientId: '', procedureType: '', procedureDate: '', followUpDate: '', channel: 'sms', message: '' });
      load();
    } catch {
      toast.error('Failed to create');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-Ups</h1>
          <p className="text-sm text-gray-500 mt-1">Post-procedure check-ins</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
          <Plus size={16} /> New Follow-Up
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {STATUS_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === key ? 'bg-indigo-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
      ) : followUps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No follow-ups found</div>
      ) : (
        <div className="space-y-3">
          {followUps.map((fu) => {
            const ChannelIcon = CHANNEL_ICONS[fu.channel] || MessageSquare;
            return (
              <div key={fu.id} className="bg-white border rounded-xl p-5 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                      <ChannelIcon size={18} className="text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          {fu.patient ? `${fu.patient.firstName} ${fu.patient.lastName}` : 'Unknown'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[fu.status]}`}>
                          {fu.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">{fu.procedureType}</span>
                        {fu.procedureDate && <span className="text-gray-400"> on {formatDate(fu.procedureDate)}</span>}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">{fu.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          Follow-up: {daysFromNow(fu.followUpDate)}
                        </span>
                        <span className="capitalize">{fu.channel}</span>
                      </div>
                      {fu.response && (
                        <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-700 mb-1">Patient Response:</p>
                          <p className="text-sm text-green-800">{fu.response}</p>
                          {fu.respondedAt && <p className="text-xs text-green-500 mt-1">{formatDate(fu.respondedAt)}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {fu.status === 'pending' && (
                      <button onClick={() => handleSend(fu.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                        <Send size={12} /> Send
                      </button>
                    )}
                    {fu.status === 'responded' && (
                      <button onClick={() => handleComplete(fu.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                        <CheckCircle size={12} /> Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">New Follow-Up</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select value={newFu.patientId} onChange={(e) => setNewFu({ ...newFu, patientId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select patient...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Type</label>
                <input type="text" value={newFu.procedureType}
                  onChange={(e) => setNewFu({ ...newFu, procedureType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Extraction, Root Canal" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Date</label>
                  <input type="date" value={newFu.procedureDate}
                    onChange={(e) => setNewFu({ ...newFu, procedureDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Date</label>
                  <input type="date" value={newFu.followUpDate}
                    onChange={(e) => setNewFu({ ...newFu, followUpDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                <select value={newFu.channel} onChange={(e) => setNewFu({ ...newFu, channel: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows={3} value={newFu.message}
                  onChange={(e) => setNewFu({ ...newFu, message: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Hi [name], this is Bright Smiles Dental checking in..." />
              </div>
              <button onClick={handleCreate} disabled={creating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create Follow-Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
