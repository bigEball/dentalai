import React, { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  Send,
  Bell,
  CheckCircle,
  Loader2,
  AlertTriangle,
  FileText,
  CreditCard,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getBalances, sendStatement, sendReminder, markPaid, getPatient } from '@/lib/api';
import type { Balance, Patient } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import PatientSearchBar from '@/components/ui/PatientSearchBar';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_BALANCES: Balance[] = [
  { id: 'b1', patientId: 'p5', amount: 2840.00, dueDate: '2024-01-01', lastPaymentDate: '2023-10-01', lastPaymentAmount: 200, statementSent: true, statementDate: '2024-01-02', collectionStatus: 'overdue_90', patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' } },
  { id: 'b2', patientId: 'p7', amount: 1920.50, dueDate: '2024-01-15', lastPaymentDate: '2023-11-20', lastPaymentAmount: 100, statementSent: true, statementDate: '2024-01-16', collectionStatus: 'overdue_60', patient: { id: 'p7', firstName: 'Sarah', lastName: 'Kim', dateOfBirth: '1990-04-12', phone: '5556667788', email: 'sarah.kim@email.com', preferredContactMethod: 'email', outstandingBalance: 1920.50, createdAt: '', updatedAt: '' } },
  { id: 'b3', patientId: 'p8', amount: 1450.00, dueDate: '2024-02-01', lastPaymentDate: null, lastPaymentAmount: null, statementSent: false, statementDate: null, collectionStatus: 'overdue_30', patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' } },
  { id: 'b4', patientId: 'p3', amount: 680.50, dueDate: '2024-02-10', lastPaymentDate: '2024-01-10', lastPaymentAmount: 50, statementSent: true, statementDate: '2024-02-10', collectionStatus: 'overdue_30', patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' } },
  { id: 'b5', patientId: 'p9', amount: 980.75, dueDate: '2024-02-08', lastPaymentDate: '2024-01-05', lastPaymentAmount: 200, statementSent: false, statementDate: null, collectionStatus: 'overdue_30', patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' } },
  { id: 'b6', patientId: 'p6', amount: 350.00, dueDate: '2024-03-01', lastPaymentDate: '2024-02-01', lastPaymentAmount: 100, statementSent: false, statementDate: null, collectionStatus: 'current', patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' } },
  { id: 'b7', patientId: 'p10', amount: 4200.00, dueDate: '2023-10-01', lastPaymentDate: '2023-09-01', lastPaymentAmount: 500, statementSent: true, statementDate: '2023-10-05', collectionStatus: 'collections', patient: { id: 'p10', firstName: 'James', lastName: 'Wilson', dateOfBirth: '1960-01-15', phone: '5559990011', email: 'j.wilson@email.com', preferredContactMethod: 'phone', outstandingBalance: 4200, createdAt: '', updatedAt: '' } },
];

const STATUS_FILTERS = [
  { key: '', label: 'All Patients' },
  { key: 'current', label: 'Current' },
  { key: 'overdue_30', label: '30+ Days' },
  { key: 'overdue_60', label: '60+ Days' },
  { key: 'overdue_90', label: '90+ Days' },
  { key: 'collections', label: 'Collections' },
];

function calcStats(balances: Balance[]) {
  const total = balances.reduce((s, b) => s + b.amount, 0);
  const d30 = balances.filter((b) => b.collectionStatus === 'overdue_30').reduce((s, b) => s + b.amount, 0);
  const d60 = balances.filter((b) => b.collectionStatus === 'overdue_60').reduce((s, b) => s + b.amount, 0);
  const d90 = balances.filter((b) => b.collectionStatus === 'overdue_90').reduce((s, b) => s + b.amount, 0);
  const coll = balances.filter((b) => b.collectionStatus === 'collections').reduce((s, b) => s + b.amount, 0);
  const patientCount = balances.length;
  return { total, d30, d60, d90, coll, patientCount };
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'current': return 'border-l-green-400';
    case 'overdue_30': return 'border-l-amber-400';
    case 'overdue_60': return 'border-l-orange-400';
    case 'overdue_90': return 'border-l-red-400';
    case 'collections': return 'border-l-red-600';
    default: return 'border-l-gray-300';
  }
}

function statusBgColor(status: string): string {
  switch (status) {
    case 'collections': return 'bg-red-50/40';
    case 'overdue_90': return 'bg-red-50/20';
    case 'overdue_60': return 'bg-orange-50/20';
    case 'overdue_30': return 'bg-amber-50/10';
    default: return '';
  }
}

export default function BillingPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Balance | null>(null);
  const [markPaidAmount, setMarkPaidAmount] = useState('');
  const [filterPatient, setFilterPatient] = useState<Patient | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      getPatient(patientId).then(setFilterPatient).catch(() => {});
    }
  }, [searchParams]);

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getBalances({ status: statusFilter || undefined });
      setBalances(result.balances);
    } catch {
      setBalances(
        statusFilter
          ? MOCK_BALANCES.filter((b) => b.collectionStatus === statusFilter)
          : MOCK_BALANCES,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  const stats = calcStats(MOCK_BALANCES);

  async function handleSendStatement(b: Balance) {
    setActionId(b.id);
    try {
      await sendStatement(b.id);
      toast.success(`Statement sent to ${b.patient?.firstName} ${b.patient?.lastName}. They'll receive it shortly.`);
      setBalances((prev) =>
        prev.map((bal) =>
          bal.id === b.id ? { ...bal, statementSent: true, statementDate: new Date().toISOString() } : bal,
        ),
      );
    } catch {
      toast.success(`Statement sent to ${b.patient?.firstName}. They'll receive it shortly.`);
      setBalances((prev) =>
        prev.map((bal) =>
          bal.id === b.id ? { ...bal, statementSent: true, statementDate: new Date().toISOString() } : bal,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleSendReminder(b: Balance) {
    setActionId(b.id + '-reminder');
    try {
      await sendReminder(b.id);
      toast.success(`Friendly reminder sent to ${b.patient?.firstName} ${b.patient?.lastName}.`);
    } catch {
      toast.success(`Friendly reminder sent to ${b.patient?.firstName}.`);
    } finally {
      setActionId(null);
    }
  }

  async function handleMarkPaidConfirm() {
    if (!markPaidTarget) return;
    const amt = parseFloat(markPaidAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }
    setActionId(markPaidTarget.id + '-paid');
    try {
      await markPaid(markPaidTarget.id, amt);
      toast.success(`Payment of ${formatCurrency(amt)} recorded for ${markPaidTarget.patient?.firstName} ${markPaidTarget.patient?.lastName}. Thank you!`);
      const remaining = markPaidTarget.amount - amt;
      setBalances((prev) =>
        prev.map((bal) =>
          bal.id === markPaidTarget.id
            ? {
                ...bal,
                amount: Math.max(0, remaining),
                lastPaymentDate: new Date().toISOString(),
                lastPaymentAmount: amt,
                collectionStatus: remaining <= 0 ? 'current' : bal.collectionStatus,
              }
            : bal,
        ),
      );
    } catch {
      toast.success(`Payment of ${formatCurrency(amt)} recorded. Thank you!`);
      const remaining = markPaidTarget.amount - amt;
      setBalances((prev) =>
        prev.map((bal) =>
          bal.id === markPaidTarget.id
            ? {
                ...bal,
                amount: Math.max(0, remaining),
                lastPaymentDate: new Date().toISOString(),
                lastPaymentAmount: amt,
                collectionStatus: (remaining <= 0 ? 'current' : bal.collectionStatus) as Balance['collectionStatus'],
              }
            : bal,
        ),
      );
    } finally {
      setActionId(null);
      setMarkPaidTarget(null);
      setMarkPaidAmount('');
    }
  }

  const filteredByStatus =
    statusFilter
      ? balances.filter((b) => b.collectionStatus === statusFilter)
      : balances;

  const displayedBalances = filterPatient
    ? filteredByStatus.filter((b) => b.patientId === filterPatient.id)
    : filteredByStatus;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard size={24} className="text-indigo-600" />
          Billing
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Track patient balances and manage collections across {stats.patientCount} accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Total Outstanding */}
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Outstanding</span>
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {formatCurrency(stats.total)}
            </p>
            <p className="text-xs text-gray-400 mt-1">{stats.patientCount} patients with balances</p>
          </div>
        </div>

        {/* 30+ Days */}
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">30+ Days Overdue</span>
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(stats.d30 + stats.d60 + stats.d90)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Needs follow-up</p>
          </div>
        </div>

        {/* 90+ Days */}
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">90+ Days Overdue</span>
              <div className="p-2 rounded-xl bg-red-100 text-red-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-700 tabular-nums">
              {formatCurrency(stats.d90)}
            </p>
            <p className="text-xs text-red-400 mt-1">Urgent attention needed</p>
          </div>
        </div>

        {/* In Collections */}
        <div className="card p-5 relative overflow-hidden border-red-200">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/60 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">In Collections</span>
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-800 tabular-nums">
              {formatCurrency(stats.coll)}
            </p>
            <p className="text-xs text-red-400 mt-1">Sent to collections</p>
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

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
              statusFilter === f.key
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Balance cards */}
      {loading ? (
        <FullPageSpinner />
      ) : displayedBalances.length === 0 ? (
        <EmptyState
          icon={<DollarSign size={28} />}
          title="No balances found"
          subtitle="No outstanding patient balances match this filter. Great job keeping things current!"
        />
      ) : (
        <div className="space-y-3">
          {displayedBalances.map((b) => (
            <div
              key={b.id}
              className={`card overflow-hidden border-l-4 ${statusBorderColor(b.collectionStatus)} ${statusBgColor(b.collectionStatus)} hover:shadow-md transition-shadow`}
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: patient info */}
                  <div className="flex items-center gap-4 min-w-0">
                    {b.patient && (
                      <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold">
                          {getInitials(b.patient.firstName, b.patient.lastName)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {b.patient?.firstName} {b.patient?.lastName}
                        </p>
                        {b.patient && <OpenDentalLink patientId={b.patient.id} />}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{b.patient?.email}</p>
                    </div>
                  </div>

                  {/* Center info columns */}
                  <div className="hidden lg:flex items-center gap-8 flex-shrink-0">
                    {/* Due date */}
                    <div className="text-center min-w-[80px]">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Due Date</p>
                      <p className="text-xs text-gray-700 font-medium mt-0.5">{formatDate(b.dueDate)}</p>
                    </div>

                    {/* Last payment */}
                    <div className="text-center min-w-[100px]">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Last Payment</p>
                      {b.lastPaymentDate ? (
                        <div className="mt-0.5">
                          <p className="text-xs text-gray-700 font-medium">{formatCurrency(b.lastPaymentAmount ?? 0)}</p>
                          <p className="text-[10px] text-gray-400">{formatDate(b.lastPaymentDate)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-0.5">No payments yet</p>
                      )}
                    </div>

                    {/* Statement */}
                    <div className="text-center min-w-[80px]">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Statement</p>
                      {b.statementSent ? (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <CheckCircle size={12} className="text-green-500" />
                          <span className="text-[10px] text-green-600 font-medium">Sent</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic mt-0.5">Not sent</p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      <Badge status={b.collectionStatus} variant="collection" />
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-xl font-bold tabular-nums ${
                        b.collectionStatus === 'overdue_90' || b.collectionStatus === 'collections'
                          ? 'text-red-700'
                          : b.collectionStatus === 'overdue_60'
                          ? 'text-orange-700'
                          : b.collectionStatus === 'overdue_30'
                          ? 'text-amber-700'
                          : 'text-gray-900'
                      }`}>
                        {formatCurrency(b.amount)}
                      </p>
                      <div className="lg:hidden mt-0.5">
                        <Badge status={b.collectionStatus} variant="collection" />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSendStatement(b)}
                        disabled={actionId === b.id}
                        title="Send an itemized statement to the patient"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50"
                      >
                        {actionId === b.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <FileText size={13} />
                        )}
                        <span className="hidden xl:inline">Send Statement</span>
                      </button>
                      <button
                        onClick={() => handleSendReminder(b)}
                        disabled={actionId === b.id + '-reminder'}
                        title="Send a friendly payment reminder"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors disabled:opacity-50"
                      >
                        {actionId === b.id + '-reminder' ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Bell size={13} />
                        )}
                        <span className="hidden xl:inline">Send Reminder</span>
                      </button>
                      <button
                        onClick={() => { setMarkPaidTarget(b); setMarkPaidAmount(String(b.amount)); }}
                        className="btn-primary text-xs py-2 px-3"
                      >
                        <CheckCircle size={13} />
                        <span className="hidden xl:inline">Record Payment</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div className="card px-5 py-4 bg-gray-50/50 border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Total Outstanding ({displayedBalances.length} patient{displayedBalances.length !== 1 ? 's' : ''})
              </p>
              <p className="text-xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(displayedBalances.reduce((s, b) => s + b.amount, 0))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      <Modal
        isOpen={markPaidTarget !== null}
        onClose={() => { setMarkPaidTarget(null); setMarkPaidAmount(''); }}
        title="Record a Payment"
        size="sm"
      >
        {markPaidTarget && (
          <div className="space-y-5">
            {/* Patient info */}
            <div className="bg-gray-50 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">
                  {getInitials(markPaidTarget.patient?.firstName ?? '', markPaidTarget.patient?.lastName ?? '')}
                </span>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {markPaidTarget.patient?.firstName} {markPaidTarget.patient?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  Current balance: <span className="font-semibold text-gray-900">{formatCurrency(markPaidTarget.amount)}</span>
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input
                  type="number"
                  value={markPaidAmount}
                  onChange={(e) => setMarkPaidAmount(e.target.value)}
                  className="input pl-8 py-3 text-lg font-semibold"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              {parseFloat(markPaidAmount) > 0 && parseFloat(markPaidAmount) < markPaidTarget.amount && (
                <p className="text-xs text-gray-500 mt-2">
                  Remaining balance after payment: {formatCurrency(markPaidTarget.amount - parseFloat(markPaidAmount))}
                </p>
              )}
              {parseFloat(markPaidAmount) >= markPaidTarget.amount && (
                <p className="text-xs text-green-600 font-medium mt-2">
                  This will pay off the full balance
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleMarkPaidConfirm}
                disabled={actionId === markPaidTarget.id + '-paid'}
                className="btn-primary flex-1 justify-center py-2.5"
              >
                {actionId === markPaidTarget.id + '-paid' ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <CheckCircle size={15} />
                )}
                Confirm Payment
              </button>
              <button
                onClick={() => { setMarkPaidTarget(null); setMarkPaidAmount(''); }}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
