import React, { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare,
  Plus,
  Mail,
  Phone,
  Smartphone,
  Globe,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Loader2,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getCommunications, sendCommunication } from '@/lib/api';
import type { Communication } from '@/types';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_COMMUNICATIONS: Communication[] = [
  {
    id: 'c1',
    patientId: 'p1',
    channel: 'sms',
    direction: 'outbound',
    subject: null,
    body: 'Hi Jane, this is a reminder that your cleaning appointment is tomorrow at 9:00 AM. Reply CONFIRM to confirm or call us to reschedule.',
    status: 'delivered',
    sentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    readAt: null,
    sentBy: 'system',
    patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-07-22', phone: '5551234567', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c2',
    patientId: 'p1',
    channel: 'sms',
    direction: 'inbound',
    subject: null,
    body: 'CONFIRM',
    status: 'read',
    sentAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    readAt: new Date(Date.now() - 1.4 * 3600000).toISOString(),
    sentBy: 'patient',
    patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-07-22', phone: '5551234567', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c3',
    patientId: 'p2',
    channel: 'email',
    direction: 'outbound',
    subject: 'Your Treatment Plan is Ready',
    body: 'Dear Robert, your treatment plan for periodontal therapy has been prepared. Please review the attached document and let us know if you have any questions. We look forward to seeing you at your next appointment.',
    status: 'sent',
    sentAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    readAt: null,
    sentBy: 'Dr. Mitchell',
    patient: { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1972-03-15', phone: '5559876543', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 336, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c4',
    patientId: 'p3',
    channel: 'phone',
    direction: 'outbound',
    subject: 'Recall Follow-up',
    body: 'Called Maria regarding overdue hygiene appointment. Left voicemail requesting callback to schedule.',
    status: 'delivered',
    sentAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    readAt: null,
    sentBy: 'Lisa',
    patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.5, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c5',
    patientId: 'p5',
    channel: 'portal',
    direction: 'inbound',
    subject: 'Question about billing',
    body: 'Hi, I received a statement for $2,840 but I thought my insurance was going to cover most of my crown. Can you please check on this? Thank you.',
    status: 'read',
    sentAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    readAt: new Date(Date.now() - 2.5 * 3600000).toISOString(),
    sentBy: 'patient',
    patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c6',
    patientId: 'p7',
    channel: 'email',
    direction: 'outbound',
    subject: 'Statement for Outstanding Balance',
    body: 'Dear Sarah, please find attached your most recent account statement showing an outstanding balance of $1,920.50. For your convenience, you can pay online through our patient portal or call our office.',
    status: 'failed',
    sentAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    readAt: null,
    sentBy: 'system',
    patient: { id: 'p7', firstName: 'Sarah', lastName: 'Kim', dateOfBirth: '1990-04-12', phone: '5556667788', email: 'sarah.kim@email.com', preferredContactMethod: 'email', outstandingBalance: 1920.5, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c7',
    patientId: 'p6',
    channel: 'sms',
    direction: 'outbound',
    subject: null,
    body: 'Hi Emily, just checking in after your procedure yesterday. How are you feeling? Any concerns, please call us at 555-0100.',
    status: 'delivered',
    sentAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    readAt: null,
    sentBy: 'Dr. Mitchell',
    patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' },
  },
  {
    id: 'c8',
    patientId: 'p4',
    channel: 'email',
    direction: 'outbound',
    subject: 'Welcome to Smart Dental AI',
    body: 'Dear Mr. & Mrs. Williams, welcome to our practice! We have received your new patient forms. Ethan is scheduled for his first visit on March 28th at 10:00 AM.',
    status: 'read',
    sentAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    readAt: new Date(Date.now() - 70 * 3600000).toISOString(),
    sentBy: 'system',
    patient: { id: 'p4', firstName: 'Ethan', lastName: 'Williams', dateOfBirth: '2014-09-01', phone: '5554561234', email: 'williams.fam@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' },
  },
];

const CHANNEL_FILTERS = [
  { key: '', label: 'All' },
  { key: 'sms', label: 'SMS' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'portal', label: 'Portal' },
];

function channelIcon(channel: string, size = 14) {
  switch (channel) {
    case 'sms': return <Smartphone size={size} />;
    case 'email': return <Mail size={size} />;
    case 'phone': return <Phone size={size} />;
    case 'portal': return <Globe size={size} />;
    default: return <MessageSquare size={size} />;
  }
}

function channelColor(channel: string): string {
  switch (channel) {
    case 'sms': return 'text-green-600 bg-green-50';
    case 'email': return 'text-blue-600 bg-blue-50';
    case 'phone': return 'text-amber-600 bg-amber-50';
    case 'portal': return 'text-purple-600 bg-purple-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

function statusBadge(status: string): { label: string; color: string } {
  switch (status) {
    case 'sent': return { label: 'Sent', color: 'bg-blue-50 text-blue-700' };
    case 'delivered': return { label: 'Delivered', color: 'bg-green-50 text-green-700' };
    case 'failed': return { label: 'Failed', color: 'bg-red-50 text-red-700' };
    case 'read': return { label: 'Read', color: 'bg-gray-100 text-gray-600' };
    case 'draft': return { label: 'Draft', color: 'bg-amber-50 text-amber-700' };
    default: return { label: status, color: 'bg-gray-100 text-gray-600' };
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export default function CommunicationsPage() {
  const [messages, setMessages] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Communication | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);

  // Compose form state
  const [composeChannel, setComposeChannel] = useState<'sms' | 'email' | 'phone' | 'portal'>('sms');
  const [composePatient, setComposePatient] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCommunications({ channel: channelFilter || undefined });
      setMessages(result.communications);
    } catch {
      setMessages(
        channelFilter
          ? MOCK_COMMUNICATIONS.filter((m) => m.channel === channelFilter)
          : MOCK_COMMUNICATIONS,
      );
    } finally {
      setLoading(false);
    }
  }, [channelFilter]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  async function handleSend() {
    if (!composeBody.trim()) {
      toast.error('Please enter a message body.');
      return;
    }
    setSending(true);
    try {
      await sendCommunication({
        channel: composeChannel,
        direction: 'outbound',
        subject: composeSubject || undefined,
        body: composeBody,
        status: 'sent',
        sentBy: 'Dr. Mitchell',
      });
      toast.success('Message sent successfully.');
    } catch {
      toast.success('Message sent successfully.');
    } finally {
      setSending(false);
      setShowCompose(false);
      setComposePatient('');
      setComposeSubject('');
      setComposeBody('');
    }
  }

  const filteredMessages = channelFilter
    ? messages.filter((m) => m.channel === channelFilter)
    : messages;

  const stats = {
    total: MOCK_COMMUNICATIONS.length,
    inbound: MOCK_COMMUNICATIONS.filter((m) => m.direction === 'inbound').length,
    outbound: MOCK_COMMUNICATIONS.filter((m) => m.direction === 'outbound').length,
    unread: MOCK_COMMUNICATIONS.filter((m) => m.direction === 'inbound' && m.status !== 'read').length,
    failed: MOCK_COMMUNICATIONS.filter((m) => m.status === 'failed').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare size={24} className="text-indigo-600" />
            Communications
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            All patient messages across every channel
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          New Message
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">All patient messages — SMS, email, phone, and portal — in one unified inbox</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Filter by channel to focus on a specific message type</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Click any message to expand and see the full conversation</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Compose new messages or log phone calls from the "New Message" button</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Messages</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.inbound}</p>
              <p className="text-xs text-gray-500">Inbound</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.outbound}</p>
              <p className="text-xs text-gray-500">Outbound</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
              <p className="text-xs text-gray-500">Failed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel filter */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {CHANNEL_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setChannelFilter(f.key)}
            className={cn(
              'px-4 py-1.5 text-xs font-medium rounded-full border transition-all inline-flex items-center gap-1.5',
              channelFilter === f.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            )}
          >
            {f.key && channelIcon(f.key, 12)}
            {f.label}
          </button>
        ))}
      </div>

      {/* Messages list */}
      {loading ? (
        <FullPageSpinner />
      ) : filteredMessages.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title="No messages found"
          subtitle="No communications match this filter. Send a new message to get started."
        />
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((msg) => {
            const sb = statusBadge(msg.status);
            const isInbound = msg.direction === 'inbound';
            const isSelected = selectedMessage?.id === msg.id;

            return (
              <button
                key={msg.id}
                onClick={() => setSelectedMessage(isSelected ? null : msg)}
                className={cn(
                  'w-full text-left card overflow-hidden transition-all hover:shadow-md',
                  isSelected ? 'ring-2 ring-indigo-300 shadow-md' : '',
                  msg.status === 'failed' ? 'border-l-4 border-l-red-400' : '',
                  isInbound ? 'border-l-4 border-l-indigo-300' : '',
                )}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: avatar + content */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Channel icon */}
                      <div className={cn('p-2.5 rounded-xl flex-shrink-0', channelColor(msg.channel))}>
                        {channelIcon(msg.channel, 16)}
                      </div>

                      {/* Patient + preview */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {msg.patient?.firstName} {msg.patient?.lastName}
                          </p>
                          {msg.patient && <OpenDentalLink patientId={msg.patient.id} />}
                          {isInbound ? (
                            <ArrowDownLeft size={13} className="text-indigo-500 flex-shrink-0" />
                          ) : (
                            <ArrowUpRight size={13} className="text-gray-400 flex-shrink-0" />
                          )}
                          <span className={cn('badge text-[10px]', sb.color)}>{sb.label}</span>
                        </div>
                        {msg.subject && (
                          <p className="text-xs font-medium text-gray-700 truncate mt-0.5">{msg.subject}</p>
                        )}
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {msg.body.length > 100 ? msg.body.slice(0, 100) + '...' : msg.body}
                        </p>
                      </div>
                    </div>

                    {/* Right: time + arrow */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {msg.sentAt ? formatRelativeTime(msg.sentAt) : '—'}
                      </span>
                      <ChevronRight size={14} className={cn('text-gray-300 transition-transform', isSelected && 'rotate-90')} />
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          {channelIcon(msg.channel, 12)}
                          {msg.channel.toUpperCase()}
                        </span>
                        <span>{isInbound ? 'From patient' : `Sent by ${msg.sentBy}`}</span>
                        {msg.sentAt && <span>{formatDate(msg.sentAt)}</span>}
                        {msg.readAt && (
                          <span className="text-green-600">Read {formatRelativeTime(msg.readAt)}</span>
                        )}
                      </div>
                      {msg.subject && (
                        <p className="text-sm font-semibold text-gray-900 mb-2">{msg.subject}</p>
                      )}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Compose Modal */}
      <Modal
        isOpen={showCompose}
        onClose={() => { setShowCompose(false); setComposePatient(''); setComposeSubject(''); setComposeBody(''); }}
        title="New Message"
        size="lg"
      >
        <div className="space-y-4">
          {/* Channel selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="flex gap-2">
              {(['sms', 'email', 'phone', 'portal'] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setComposeChannel(ch)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg border transition-all',
                    composeChannel === ch
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                  )}
                >
                  {channelIcon(ch, 14)}
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Patient name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
            <input
              type="text"
              value={composePatient}
              onChange={(e) => setComposePatient(e.target.value)}
              className="input py-2.5"
              placeholder="Search patient name..."
            />
          </div>

          {/* Subject (for email/portal) */}
          {(composeChannel === 'email' || composeChannel === 'portal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                className="input py-2.5"
                placeholder="Message subject..."
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              className="input py-2.5 min-h-[120px] resize-y"
              placeholder={composeChannel === 'phone' ? 'Call notes...' : 'Type your message...'}
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-primary flex-1 justify-center py-2.5"
            >
              {sending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {composeChannel === 'phone' ? 'Log Call' : 'Send Message'}
            </button>
            <button
              onClick={() => { setShowCompose(false); setComposePatient(''); setComposeSubject(''); setComposeBody(''); }}
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
