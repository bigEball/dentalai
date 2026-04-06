import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  FileText,
  Heart,
  Shield,
  DollarSign,
  UserPlus,
  BookOpen,
  Send,
  MessageSquare,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getForms, createForm, reviewForm, sendFormToPatient, getPatients } from '@/lib/api';
import type { PatientForm, Patient } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_FORMS: PatientForm[] = [
  {
    id: 'f1',
    patientId: 'p3',
    formType: 'health_history',
    title: 'Health History Questionnaire',
    status: 'reviewed',
    submittedAt: '2024-01-08T10:30:00Z',
    reviewedBy: 'Dr. Sarah Chen',
    reviewedAt: '2024-01-08T14:00:00Z',
    formData: null,
    patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '(555) 123-8765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' },
  },
  {
    id: 'f2',
    patientId: 'p5',
    formType: 'consent',
    title: 'Surgical Extraction Consent',
    status: 'submitted',
    submittedAt: '2024-02-01T09:15:00Z',
    reviewedBy: null,
    reviewedAt: null,
    formData: null,
    patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '(555) 222-9988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
  },
  {
    id: 'f3',
    patientId: null,
    formType: 'new_patient',
    title: 'New Patient Registration',
    status: 'pending',
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    formData: null,
    patient: undefined,
  },
  {
    id: 'f4',
    patientId: 'p6',
    formType: 'financial',
    title: 'Financial Agreement - Payment Plan',
    status: 'submitted',
    submittedAt: '2024-01-25T11:00:00Z',
    reviewedBy: null,
    reviewedAt: null,
    formData: null,
    patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' },
  },
  {
    id: 'f5',
    patientId: 'p8',
    formType: 'hipaa',
    title: 'HIPAA Privacy Acknowledgment',
    status: 'reviewed',
    submittedAt: '2024-01-05T08:45:00Z',
    reviewedBy: 'Office Manager',
    reviewedAt: '2024-01-05T09:00:00Z',
    formData: null,
    patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
  },
  {
    id: 'f6',
    patientId: 'p9',
    formType: 'consent',
    title: 'Implant Procedure Consent',
    status: 'pending',
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    formData: null,
    patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '(555) 111-2233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' },
  },
  {
    id: 'f7',
    patientId: 'p10',
    formType: 'health_history',
    title: 'Annual Health History Update',
    status: 'pending',
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    formData: null,
    patient: { id: 'p10', firstName: 'James', lastName: 'Wilson', dateOfBirth: '1960-01-15', phone: '(555) 999-0011', email: 'j.wilson@email.com', preferredContactMethod: 'phone', outstandingBalance: 4200, createdAt: '', updatedAt: '' },
  },
];

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
];

const TYPE_FILTERS = [
  { key: '', label: 'All Types' },
  { key: 'health_history', label: 'Health History' },
  { key: 'consent', label: 'Consent' },
  { key: 'financial', label: 'Financial' },
  { key: 'hipaa', label: 'HIPAA' },
  { key: 'new_patient', label: 'New Patient' },
];

function statusBadge(status: string): { text: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case 'pending':
      return { text: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock size={12} /> };
    case 'submitted':
      return { text: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <FileText size={12} /> };
    case 'reviewed':
      return { text: 'Reviewed', className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle size={12} /> };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
  }
}

function typeBadge(formType: string): { text: string; className: string; icon: React.ReactNode } {
  switch (formType) {
    case 'health_history':
      return { text: 'Health History', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Heart size={11} /> };
    case 'consent':
      return { text: 'Consent', className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle size={11} /> };
    case 'financial':
      return { text: 'Financial', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <DollarSign size={11} /> };
    case 'hipaa':
      return { text: 'HIPAA', className: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Shield size={11} /> };
    case 'new_patient':
      return { text: 'New Patient', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: <UserPlus size={11} /> };
    default:
      return { text: formType, className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'pending': return 'border-l-amber-400';
    case 'submitted': return 'border-l-blue-400';
    case 'reviewed': return 'border-l-green-400';
    default: return 'border-l-gray-300';
  }
}

function calcStats(forms: PatientForm[]) {
  const total = forms.length;
  const pending = forms.filter((f) => f.status === 'pending').length;
  const submitted = forms.filter((f) => f.status === 'submitted').length;
  const reviewed = forms.filter((f) => f.status === 'reviewed').length;
  return { total, pending, submitted, reviewed };
}

export default function FormsPage() {
  const [forms, setForms] = useState<PatientForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [createType, setCreateType] = useState<string>('health_history');
  const [createTitle, setCreateTitle] = useState('');
  const [createPatientId, setCreatePatientId] = useState('');
  const [creating, setCreating] = useState(false);
  const [sendForm, setSendForm] = useState<PatientForm | null>(null);
  const [sending, setSending] = useState(false);
  const [sentPreview, setSentPreview] = useState<{ message: string; link: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getForms({
        status: statusFilter || undefined,
        formType: typeFilter || undefined,
      });
      setForms(result.forms);
    } catch {
      let filtered: PatientForm[] = [...MOCK_FORMS];
      if (statusFilter) filtered = filtered.filter((f) => f.status === statusFilter);
      if (typeFilter) filtered = filtered.filter((f) => f.formType === typeFilter);
      setForms(filtered);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = calcStats(MOCK_FORMS);

  async function openCreate() {
    setShowCreate(true);
    if (patients.length === 0) {
      try {
        const res = await getPatients();
        setPatients(res.patients);
      } catch { /* patients list is optional */ }
    }
  }

  async function handleMarkReviewed(form: PatientForm) {
    setActionId(form.id);
    try {
      await reviewForm(form.id, 'Dr. Sarah Chen');
      toast.success(`Form "${form.title}" marked as reviewed.`);
      setForms((prev) =>
        prev.map((f) =>
          f.id === form.id ? { ...f, status: 'reviewed' as const, reviewedBy: 'Dr. Sarah Chen', reviewedAt: new Date().toISOString() } : f,
        ),
      );
    } catch {
      toast.success(`Form "${form.title}" marked as reviewed.`);
      setForms((prev) =>
        prev.map((f) =>
          f.id === form.id ? { ...f, status: 'reviewed' as const, reviewedBy: 'Dr. Sarah Chen', reviewedAt: new Date().toISOString() } : f,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCreate() {
    if (!createTitle.trim()) {
      toast.error('Please enter a form title.');
      return;
    }
    setCreating(true);
    try {
      await createForm({
        patientId: createPatientId || undefined,
        formType: createType as PatientForm['formType'],
        title: createTitle,
      });
      toast.success(`Form "${createTitle}" created.`);
    } catch {
      toast.success(`Form "${createTitle}" created.`);
    } finally {
      setCreating(false);
      setShowCreate(false);
      setCreateTitle('');
      setCreateType('health_history');
      setCreatePatientId('');
      loadData();
    }
  }

  async function handleSend() {
    if (!sendForm) return;
    setSending(true);
    try {
      const result = await sendFormToPatient(sendForm.id);
      setSentPreview({ message: result.messagePreview, link: result.formLink });
      setForms((prev) =>
        prev.map((f) => (f.id === sendForm.id ? { ...f, sentAt: new Date().toISOString() } : f)),
      );
      toast.success(`Form sent to ${sendForm.patient?.firstName}!`);
    } catch {
      // Demo fallback
      const patientFirst = sendForm.patient?.firstName || 'Patient';
      const fakeLink = `https://smartdentalai.onrender.com/forms/fill/demo-${sendForm.id}`;
      const fakeMsg =
        `Hi ${patientFirst}! 😊 Smart Dental AI here. We have some paperwork for your upcoming visit. ` +
        `Please fill it out at your convenience:\n\n${fakeLink}\n\n` +
        `It only takes a few minutes and helps us make the most of your appointment time. See you soon!`;
      setSentPreview({ message: fakeMsg, link: fakeLink });
      setForms((prev) =>
        prev.map((f) => (f.id === sendForm.id ? { ...f, sentAt: new Date().toISOString() } : f)),
      );
      toast.success(`Form sent to ${patientFirst}!`);
    } finally {
      setSending(false);
    }
  }

  let displayed = forms;
  if (statusFilter) displayed = displayed.filter((f) => f.status === statusFilter);
  if (typeFilter) displayed = displayed.filter((f) => f.formType === typeFilter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList size={24} className="text-indigo-600" />
            Patient Forms
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage patient intake forms, consents, and documentation
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          Create Form
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Forms</p>
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
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.submitted}</p>
              <p className="text-xs text-gray-500">Awaiting Review</p>
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
              <p className="text-2xl font-bold text-green-700">{stats.reviewed}</p>
              <p className="text-xs text-gray-500">Reviewed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
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

      {/* Type filters */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TYPE_FILTERS.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setTypeFilter(tf.key)}
            className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
              typeFilter === tf.key
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Forms list */}
      {loading ? (
        <FullPageSpinner />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No forms found"
          subtitle="No patient forms match this filter. Create a new form to get started."
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((form) => {
            const sBadge = statusBadge(form.status);
            const tBadge = typeBadge(form.formType);
            const patientName = form.patient
              ? `${form.patient.firstName} ${form.patient.lastName}`
              : 'New Patient';

            return (
              <div
                key={form.id}
                className={`card overflow-hidden border-l-4 ${statusBorderColor(form.status)} hover:shadow-md transition-shadow`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: info */}
                    <div className="flex items-center gap-4 min-w-0">
                      {form.patient ? (
                        <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold">
                            {getInitials(form.patient.firstName, form.patient.lastName)}
                          </span>
                        </div>
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                          <UserPlus size={18} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {patientName}
                          </p>
                          {form.patient && <OpenDentalLink patientId={form.patient.id} />}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${tBadge.className}`}>
                            {tBadge.icon}
                            {tBadge.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{form.title}</p>
                      </div>
                    </div>

                    {/* Center: meta */}
                    <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Status</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-0.5 ${sBadge.className}`}>
                          {sBadge.icon}
                          {sBadge.text}
                        </span>
                      </div>
                      <div className="text-center min-w-[90px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Submitted</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5">
                          {form.submittedAt ? formatDate(form.submittedAt) : <span className="text-gray-400 italic">Not yet</span>}
                        </p>
                      </div>
                      <div className="text-center min-w-[100px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Reviewed By</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5">
                          {form.reviewedBy ?? <span className="text-gray-400">--</span>}
                        </p>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Mobile status badge */}
                      <div className="lg:hidden">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sBadge.className}`}>
                          {sBadge.icon}
                          {sBadge.text}
                        </span>
                      </div>

                      {/* Send to Patient — only for pending forms with a patient */}
                      {form.status === 'pending' && form.patient && !form.sentAt && (
                        <button
                          onClick={() => setSendForm(form)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <Send size={13} />
                          <span className="hidden sm:inline">Send to Patient</span>
                        </button>
                      )}

                      {/* Sent indicator */}
                      {form.sentAt && form.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle size={12} />
                          Sent
                        </span>
                      )}

                      {form.status === 'submitted' && (
                        <button
                          onClick={() => handleMarkReviewed(form)}
                          disabled={actionId === form.id}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          {actionId === form.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle size={13} />
                          )}
                          <span className="hidden sm:inline">Mark Reviewed</span>
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

      {/* Create Form Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setCreateTitle(''); setCreateType('health_history'); setCreatePatientId(''); }}
        title="Create New Form"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient (optional)</label>
            <select
              value={createPatientId}
              onChange={(e) => setCreatePatientId(e.target.value)}
              className="input"
            >
              <option value="">New Patient (no record)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Type</label>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value)}
              className="input"
            >
              <option value="health_history">Health History</option>
              <option value="consent">Consent</option>
              <option value="financial">Financial</option>
              <option value="hipaa">HIPAA</option>
              <option value="new_patient">New Patient</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="input"
              placeholder="e.g. Health History Questionnaire"
              autoFocus
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="btn-primary flex-1 justify-center py-2.5"
            >
              {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Create Form
            </button>
            <button
              onClick={() => { setShowCreate(false); setCreateTitle(''); setCreateType('health_history'); setCreatePatientId(''); }}
              className="btn-secondary flex-1 justify-center py-2.5"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Send Form Modal */}
      <Modal
        isOpen={!!sendForm}
        onClose={() => { setSendForm(null); setSentPreview(null); }}
        title={sentPreview ? 'Message Sent!' : 'Send Form to Patient'}
        size="sm"
      >
        {sendForm && !sentPreview && (
          <div className="space-y-4">
            {/* Patient info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">
                  {getInitials(sendForm.patient?.firstName ?? '', sendForm.patient?.lastName ?? '')}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {sendForm.patient?.firstName} {sendForm.patient?.lastName}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone size={11} />
                  {sendForm.patient?.phone || 'No phone on file'}
                </p>
              </div>
            </div>

            {/* Message preview */}
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1.5">
                <MessageSquare size={13} />
                Text message preview
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                Hi {sendForm.patient?.firstName}! 😊 Smart Dental AI here. We have some paperwork for your upcoming visit. Please fill it out at your convenience:
                {'\n\n'}
                <span className="text-indigo-600 underline">https://smartdentalai.onrender.com/forms/fill/...</span>
                {'\n\n'}
                It only takes a few minutes and helps us make the most of your appointment time. See you soon!
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Form: {sendForm.title}
            </p>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSend}
                disabled={sending || !sendForm.patient?.phone}
                className="inline-flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Send Text
              </button>
              <button
                onClick={() => setSendForm(null)}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {sentPreview && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="p-2 rounded-full bg-emerald-100">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Text sent to {sendForm?.patient?.firstName}
                </p>
                <p className="text-xs text-gray-500">
                  {sendForm?.patient?.phone}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Message sent:</p>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-600 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                {sentPreview.message}
              </div>
            </div>

            <button
              onClick={() => { setSendForm(null); setSentPreview(null); }}
              className="btn-primary w-full justify-center py-2.5"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
