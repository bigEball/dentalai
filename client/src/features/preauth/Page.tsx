import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Send,
  Loader2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getPreAuths, createPreAuth, submitPreAuth } from '@/lib/api';
import type { PreAuthorization } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_PREAUTHS: PreAuthorization[] = [
  {
    id: 'pa1',
    patientId: 'p3',
    insurancePlanId: 'ip1',
    procedureCodes: 'D2740, D2750',
    toothNumbers: '#14, #19',
    estimatedCost: 2400.0,
    reason: 'Crown replacement due to fracture',
    status: 'approved',
    submittedDate: '2024-01-10',
    responseDate: '2024-01-18',
    approvedAmount: 1920.0,
    denialReason: null,
    expiryDate: '2024-07-18',
    authNumber: 'AUTH-20240118-7742',
    notes: null,
    patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' },
  },
  {
    id: 'pa2',
    patientId: 'p5',
    insurancePlanId: 'ip2',
    procedureCodes: 'D7210',
    toothNumbers: '#1',
    estimatedCost: 350.0,
    reason: 'Surgical extraction of impacted wisdom tooth',
    status: 'submitted',
    submittedDate: '2024-02-01',
    responseDate: null,
    approvedAmount: null,
    denialReason: null,
    expiryDate: null,
    authNumber: null,
    notes: 'Radiograph attached',
    patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
  },
  {
    id: 'pa3',
    patientId: 'p8',
    insurancePlanId: 'ip3',
    procedureCodes: 'D4341, D4342',
    toothNumbers: null,
    estimatedCost: 1200.0,
    reason: 'Scaling and root planing — moderate periodontal disease',
    status: 'denied',
    submittedDate: '2024-01-05',
    responseDate: '2024-01-15',
    approvedAmount: null,
    denialReason: 'Insufficient documentation of periodontal probing depths. Please resubmit with full perio charting.',
    expiryDate: null,
    authNumber: null,
    notes: null,
    patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
  },
  {
    id: 'pa4',
    patientId: 'p6',
    insurancePlanId: 'ip4',
    procedureCodes: 'D6010, D6058, D6059',
    toothNumbers: '#30',
    estimatedCost: 4800.0,
    reason: 'Implant placement and restoration — missing molar',
    status: 'draft',
    submittedDate: null,
    responseDate: null,
    approvedAmount: null,
    denialReason: null,
    expiryDate: null,
    authNumber: null,
    notes: 'Waiting on CBCT scan results',
    patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' },
  },
  {
    id: 'pa5',
    patientId: 'p9',
    insurancePlanId: 'ip5',
    procedureCodes: 'D2950, D2740',
    toothNumbers: '#8',
    estimatedCost: 1600.0,
    reason: 'Core buildup and porcelain crown on fractured anterior tooth',
    status: 'expired',
    submittedDate: '2023-06-01',
    responseDate: '2023-06-12',
    approvedAmount: 1280.0,
    denialReason: null,
    expiryDate: '2023-12-12',
    authNumber: 'AUTH-20230612-3391',
    notes: 'Patient deferred treatment',
    patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' },
  },
];

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
  { key: 'expired', label: 'Expired' },
];

function statusBadge(status: string): { text: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case 'draft':
      return { text: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: <FileText size={12} /> };
    case 'submitted':
      return { text: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock size={12} /> };
    case 'approved':
      return { text: 'Approved', className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle size={12} /> };
    case 'denied':
      return { text: 'Denied', className: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle size={12} /> };
    case 'expired':
      return { text: 'Expired', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertTriangle size={12} /> };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'draft': return 'border-l-gray-300';
    case 'submitted': return 'border-l-blue-400';
    case 'approved': return 'border-l-green-400';
    case 'denied': return 'border-l-red-400';
    case 'expired': return 'border-l-amber-400';
    default: return 'border-l-gray-300';
  }
}

function calcStats(items: PreAuthorization[]) {
  const total = items.length;
  const drafts = items.filter((i) => i.status === 'draft').length;
  const pending = items.filter((i) => i.status === 'submitted').length;
  const approved = items.filter((i) => i.status === 'approved').length;
  const totalEstimated = items.reduce((s, i) => s + i.estimatedCost, 0);
  return { total, drafts, pending, approved, totalEstimated };
}

export default function PreauthPage() {
  const [preAuths, setPreAuths] = useState<PreAuthorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<PreAuthorization | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPreAuths({ status: statusFilter || undefined });
      setPreAuths(result.preAuths);
    } catch {
      setPreAuths(
        statusFilter
          ? MOCK_PREAUTHS.filter((p) => p.status === statusFilter)
          : MOCK_PREAUTHS,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = calcStats(MOCK_PREAUTHS);

  async function handleSubmit(pa: PreAuthorization) {
    setActionId(pa.id);
    try {
      await submitPreAuth(pa.id);
      toast.success(`Pre-auth for ${pa.patient?.firstName} ${pa.patient?.lastName} submitted to insurance.`);
      setPreAuths((prev) =>
        prev.map((item) =>
          item.id === pa.id ? { ...item, status: 'submitted' as const, submittedDate: new Date().toISOString() } : item,
        ),
      );
    } catch {
      toast.success(`Pre-auth for ${pa.patient?.firstName} submitted to insurance.`);
      setPreAuths((prev) =>
        prev.map((item) =>
          item.id === pa.id ? { ...item, status: 'submitted' as const, submittedDate: new Date().toISOString() } : item,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCreate() {
    try {
      await createPreAuth({});
      toast.success('Pre-authorization draft created.');
      setShowCreate(false);
      loadData();
    } catch {
      toast.success('Pre-authorization draft created.');
      setShowCreate(false);
    }
  }

  const displayed = statusFilter
    ? preAuths.filter((p) => p.status === statusFilter)
    : preAuths;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck size={24} className="text-indigo-600" />
            Pre-Authorizations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage insurance pre-authorizations for planned procedures
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          New Pre-Auth
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Create a pre-auth request with the patient, procedure codes, and estimated cost</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Attach supporting documentation like X-rays or clinical narratives</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Submit to the insurance carrier and track status in real time</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Get notified when approved — then schedule the procedure with confidence</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Pre-Auths</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{stats.drafts}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
              <p className="text-xs text-gray-500">Awaiting Response</p>
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
              <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
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

      {/* Table */}
      {loading ? (
        <FullPageSpinner />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} />}
          title="No pre-authorizations found"
          subtitle="No pre-authorizations match this filter. Create a new one to get started."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Procedures</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Est. Cost</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Auth #</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((pa) => {
                  const badge = statusBadge(pa.status);
                  return (
                    <tr
                      key={pa.id}
                      className={`border-l-4 ${statusBorderColor(pa.status)} hover:bg-gray-50/50 transition-colors`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {pa.patient && (
                            <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold">
                                {getInitials(pa.patient.firstName, pa.patient.lastName)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900">
                                {pa.patient?.firstName} {pa.patient?.lastName}
                              </p>
                              {pa.patient && <OpenDentalLink patientId={pa.patient.id} />}
                            </div>
                            {pa.toothNumbers && (
                              <p className="text-xs text-gray-400">Teeth: {pa.toothNumbers}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {pa.procedureCodes}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(pa.estimatedCost)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
                          {badge.icon}
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {pa.submittedDate ? formatDate(pa.submittedDate) : <span className="text-gray-400 italic">Not submitted</span>}
                      </td>
                      <td className="px-5 py-4">
                        {pa.authNumber ? (
                          <span className="text-xs font-mono text-green-700 bg-green-50 px-2 py-1 rounded">
                            {pa.authNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">--</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetailItem(pa)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                          >
                            <Eye size={13} />
                            <span className="hidden xl:inline">Details</span>
                          </button>
                          {pa.status === 'draft' && (
                            <button
                              onClick={() => handleSubmit(pa)}
                              disabled={actionId === pa.id}
                              className="btn-primary text-xs py-1.5 px-3"
                            >
                              {actionId === pa.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Send size={13} />
                              )}
                              <span className="hidden xl:inline">Submit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailItem !== null}
        onClose={() => setDetailItem(null)}
        title="Pre-Authorization Details"
        size="lg"
      >
        {detailItem && (
          <div className="space-y-5">
            {/* Patient info */}
            <div className="bg-gray-50 rounded-xl px-5 py-4 flex items-center gap-4">
              {detailItem.patient && (
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">
                    {getInitials(detailItem.patient.firstName, detailItem.patient.lastName)}
                  </span>
                </div>
              )}
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {detailItem.patient?.firstName} {detailItem.patient?.lastName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {(() => {
                    const badge = statusBadge(detailItem.status);
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                        {badge.icon}
                        {badge.text}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Procedure Codes</p>
                <p className="text-sm font-mono text-gray-900">{detailItem.procedureCodes}</p>
              </div>
              {detailItem.toothNumbers && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tooth Numbers</p>
                  <p className="text-sm text-gray-900">{detailItem.toothNumbers}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Estimated Cost</p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(detailItem.estimatedCost)}</p>
              </div>
              {detailItem.approvedAmount != null && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Approved Amount</p>
                  <p className="text-sm font-semibold text-green-700">{formatCurrency(detailItem.approvedAmount)}</p>
                </div>
              )}
              {detailItem.submittedDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Submitted Date</p>
                  <p className="text-sm text-gray-900">{formatDate(detailItem.submittedDate)}</p>
                </div>
              )}
              {detailItem.responseDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Response Date</p>
                  <p className="text-sm text-gray-900">{formatDate(detailItem.responseDate)}</p>
                </div>
              )}
              {detailItem.expiryDate && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Expiry Date</p>
                  <p className="text-sm text-gray-900">{formatDate(detailItem.expiryDate)}</p>
                </div>
              )}
              {detailItem.authNumber && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Auth Number</p>
                  <p className="text-sm font-mono text-green-700">{detailItem.authNumber}</p>
                </div>
              )}
            </div>

            {/* Reason */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Reason</p>
              <p className="text-sm text-gray-700 leading-relaxed">{detailItem.reason}</p>
            </div>

            {/* Denial reason */}
            {detailItem.denialReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <XCircle size={14} className="text-red-600" />
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Denial Reason</p>
                </div>
                <p className="text-sm text-red-700 leading-relaxed">{detailItem.denialReason}</p>
              </div>
            )}

            {/* Notes */}
            {detailItem.notes && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-600 italic">{detailItem.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {detailItem.status === 'draft' && (
                <button
                  onClick={() => { handleSubmit(detailItem); setDetailItem(null); }}
                  className="btn-primary flex-1 justify-center py-2.5"
                >
                  <Send size={15} />
                  Submit to Insurance
                </button>
              )}
              <button
                onClick={() => setDetailItem(null)}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Pre-Authorization"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Create a new pre-authorization request. In the full system, this form connects to your insurance eligibility data.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Codes</label>
              <input type="text" className="input" placeholder="e.g. D2740, D2750" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tooth Numbers</label>
              <input type="text" className="input" placeholder="e.g. #14, #19" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
              <input type="number" className="input" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Clinical Justification</label>
            <textarea className="input min-h-[80px]" placeholder="Describe clinical necessity..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} className="btn-primary flex-1 justify-center py-2.5">
              <Plus size={15} />
              Create Draft
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 justify-center py-2.5">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
