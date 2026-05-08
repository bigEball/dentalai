import React, { useEffect, useState, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Calendar,
  DollarSign,
  Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getPaymentPlans, payInstallment, cancelPaymentPlan } from '@/lib/api';
import type { PaymentPlan, PaymentPlanInstallment } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_INSTALLMENTS_1: PaymentPlanInstallment[] = [
  { id: 'inst1-1', paymentPlanId: 'pp1', installmentNo: 1, amount: 200, dueDate: '2024-01-15', paidDate: '2024-01-14', status: 'paid' },
  { id: 'inst1-2', paymentPlanId: 'pp1', installmentNo: 2, amount: 200, dueDate: '2024-02-15', paidDate: '2024-02-15', status: 'paid' },
  { id: 'inst1-3', paymentPlanId: 'pp1', installmentNo: 3, amount: 200, dueDate: '2024-03-15', paidDate: null, status: 'pending' },
  { id: 'inst1-4', paymentPlanId: 'pp1', installmentNo: 4, amount: 200, dueDate: '2024-04-15', paidDate: null, status: 'pending' },
  { id: 'inst1-5', paymentPlanId: 'pp1', installmentNo: 5, amount: 200, dueDate: '2024-05-15', paidDate: null, status: 'pending' },
  { id: 'inst1-6', paymentPlanId: 'pp1', installmentNo: 6, amount: 200, dueDate: '2024-06-15', paidDate: null, status: 'pending' },
];

const MOCK_INSTALLMENTS_2: PaymentPlanInstallment[] = [
  { id: 'inst2-1', paymentPlanId: 'pp2', installmentNo: 1, amount: 150, dueDate: '2023-09-01', paidDate: '2023-09-01', status: 'paid' },
  { id: 'inst2-2', paymentPlanId: 'pp2', installmentNo: 2, amount: 150, dueDate: '2023-10-01', paidDate: '2023-10-02', status: 'paid' },
  { id: 'inst2-3', paymentPlanId: 'pp2', installmentNo: 3, amount: 150, dueDate: '2023-11-01', paidDate: '2023-11-01', status: 'paid' },
  { id: 'inst2-4', paymentPlanId: 'pp2', installmentNo: 4, amount: 150, dueDate: '2023-12-01', paidDate: '2023-12-01', status: 'paid' },
];

const MOCK_INSTALLMENTS_3: PaymentPlanInstallment[] = [
  { id: 'inst3-1', paymentPlanId: 'pp3', installmentNo: 1, amount: 350, dueDate: '2024-01-01', paidDate: '2024-01-02', status: 'paid' },
  { id: 'inst3-2', paymentPlanId: 'pp3', installmentNo: 2, amount: 350, dueDate: '2024-02-01', paidDate: null, status: 'overdue' },
  { id: 'inst3-3', paymentPlanId: 'pp3', installmentNo: 3, amount: 350, dueDate: '2024-03-01', paidDate: null, status: 'missed' },
  { id: 'inst3-4', paymentPlanId: 'pp3', installmentNo: 4, amount: 350, dueDate: '2024-04-01', paidDate: null, status: 'pending' },
];

const MOCK_PLANS: PaymentPlan[] = [
  {
    id: 'pp1',
    patientId: 'p3',
    totalAmount: 1500.0,
    downPayment: 300.0,
    remainingAmount: 800.0,
    monthlyPayment: 200.0,
    totalInstallments: 6,
    paidInstallments: 2,
    interestRate: 0,
    startDate: '2024-01-15',
    status: 'active',
    notes: 'Crown and buildup - no interest plan',
    patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' },
    installments: MOCK_INSTALLMENTS_1,
  },
  {
    id: 'pp2',
    patientId: 'p6',
    totalAmount: 900.0,
    downPayment: 300.0,
    remainingAmount: 0,
    monthlyPayment: 150.0,
    totalInstallments: 4,
    paidInstallments: 4,
    interestRate: 0,
    startDate: '2023-09-01',
    status: 'completed',
    notes: 'Root canal treatment',
    patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' },
    installments: MOCK_INSTALLMENTS_2,
  },
  {
    id: 'pp3',
    patientId: 'p8',
    totalAmount: 2100.0,
    downPayment: 700.0,
    remainingAmount: 1050.0,
    monthlyPayment: 350.0,
    totalInstallments: 4,
    paidInstallments: 1,
    interestRate: 0,
    startDate: '2024-01-01',
    status: 'defaulted',
    notes: 'Implant procedure',
    patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
    installments: MOCK_INSTALLMENTS_3,
  },
  {
    id: 'pp4',
    patientId: 'p9',
    totalAmount: 800.0,
    downPayment: 200.0,
    remainingAmount: 600.0,
    monthlyPayment: 100.0,
    totalInstallments: 6,
    paidInstallments: 0,
    interestRate: 0,
    startDate: '2024-03-01',
    status: 'cancelled',
    notes: 'Patient transferred to another practice',
    patient: { id: 'p9', firstName: 'Amanda', lastName: 'Chen', dateOfBirth: '1988-06-14', phone: '5551112233', email: 'amanda.c@email.com', preferredContactMethod: 'text', outstandingBalance: 980.75, createdAt: '', updatedAt: '' },
    installments: [],
  },
];

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'defaulted', label: 'Defaulted' },
  { key: 'cancelled', label: 'Cancelled' },
];

function statusBadge(status: string): { text: string; className: string; icon: React.ReactNode } {
  switch (status) {
    case 'active':
      return { text: 'Active', className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle size={12} /> };
    case 'completed':
      return { text: 'Completed', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle size={12} /> };
    case 'defaulted':
      return { text: 'Defaulted', className: 'bg-red-50 text-red-700 border-red-200', icon: <AlertTriangle size={12} /> };
    case 'cancelled':
      return { text: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200', icon: <XCircle size={12} /> };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-600 border-gray-200', icon: null };
  }
}

function installmentStatusBadge(status: string): { text: string; className: string } {
  switch (status) {
    case 'paid':
      return { text: 'Paid', className: 'bg-green-50 text-green-700' };
    case 'pending':
      return { text: 'Pending', className: 'bg-gray-100 text-gray-600' };
    case 'overdue':
      return { text: 'Overdue', className: 'bg-red-50 text-red-700' };
    case 'missed':
      return { text: 'Missed', className: 'bg-red-100 text-red-800' };
    default:
      return { text: status, className: 'bg-gray-100 text-gray-600' };
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'active': return 'border-l-green-400';
    case 'completed': return 'border-l-blue-400';
    case 'defaulted': return 'border-l-red-400';
    case 'cancelled': return 'border-l-gray-300';
    default: return 'border-l-gray-300';
  }
}

function calcStats(plans: PaymentPlan[]) {
  const total = plans.length;
  const active = plans.filter((p) => p.status === 'active').length;
  const totalOwed = plans.filter((p) => p.status === 'active').reduce((s, p) => s + p.remainingAmount, 0);
  const collected = plans.reduce((s, p) => s + (p.totalAmount - p.remainingAmount - p.downPayment), 0);
  return { total, active, totalOwed, collected };
}

function getNextDueDate(plan: PaymentPlan): string | null {
  if (!plan.installments) return null;
  const next = plan.installments.find((i) => i.status === 'pending' || i.status === 'overdue');
  return next?.dueDate ?? null;
}

export default function PaymentPlansPage() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaymentPlans({ status: statusFilter || undefined });
      setPlans(result.plans);
    } catch {
      setPlans(
        statusFilter
          ? MOCK_PLANS.filter((p) => p.status === statusFilter)
          : MOCK_PLANS,
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = calcStats(MOCK_PLANS);

  async function handlePayInstallment(plan: PaymentPlan) {
    setActionId(plan.id);
    try {
      await payInstallment(plan.id);
      toast.success(`Payment of ${formatCurrency(plan.monthlyPayment)} recorded for ${plan.patient?.firstName} ${plan.patient?.lastName}.`);
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== plan.id) return p;
          const newPaid = p.paidInstallments + 1;
          const newRemaining = Math.max(0, p.remainingAmount - p.monthlyPayment);
          const newInstallments = p.installments?.map((inst, idx) => {
            if (inst.status === 'pending' || inst.status === 'overdue') {
              if (idx === p.installments!.findIndex((i) => i.status === 'pending' || i.status === 'overdue')) {
                return { ...inst, status: 'paid' as const, paidDate: new Date().toISOString() };
              }
            }
            return inst;
          });
          return {
            ...p,
            paidInstallments: newPaid,
            remainingAmount: newRemaining,
            status: newPaid >= p.totalInstallments ? 'completed' as const : p.status,
            installments: newInstallments,
          };
        }),
      );
    } catch {
      toast.success(`Payment of ${formatCurrency(plan.monthlyPayment)} recorded for ${plan.patient?.firstName}.`);
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id !== plan.id) return p;
          const newPaid = p.paidInstallments + 1;
          const newRemaining = Math.max(0, p.remainingAmount - p.monthlyPayment);
          const newInstallments = p.installments?.map((inst, idx) => {
            if (inst.status === 'pending' || inst.status === 'overdue') {
              if (idx === p.installments!.findIndex((i) => i.status === 'pending' || i.status === 'overdue')) {
                return { ...inst, status: 'paid' as const, paidDate: new Date().toISOString() };
              }
            }
            return inst;
          });
          return {
            ...p,
            paidInstallments: newPaid,
            remainingAmount: newRemaining,
            status: (newPaid >= p.totalInstallments ? 'completed' : p.status) as PaymentPlan['status'],
            installments: newInstallments,
          };
        }),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleCancel(plan: PaymentPlan) {
    if (!confirm(`Cancel payment plan for ${plan.patient?.firstName} ${plan.patient?.lastName}?`)) return;
    setActionId(plan.id + '-cancel');
    try {
      await cancelPaymentPlan(plan.id);
      toast.success(`Payment plan for ${plan.patient?.firstName} ${plan.patient?.lastName} has been cancelled.`);
      setPlans((prev) =>
        prev.map((p) => p.id === plan.id ? { ...p, status: 'cancelled' as const } : p),
      );
    } catch {
      toast.success(`Payment plan cancelled.`);
      setPlans((prev) =>
        prev.map((p) => p.id === plan.id ? { ...p, status: 'cancelled' as const } : p),
      );
    } finally {
      setActionId(null);
    }
  }

  const displayed = statusFilter
    ? plans.filter((p) => p.status === statusFilter)
    : plans;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet size={24} className="text-indigo-600" />
            Payment Plans
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage patient payment plans and installment schedules
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary text-sm py-2.5 px-4"
        >
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Set up a payment plan with the total amount, number of installments, and schedule</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Each installment shows amount due and due date at a glance</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Record payments as they come in — the plan updates automatically</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Track overdue installments and cancel plans if needed</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total Plans</p>
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
              <p className="text-2xl font-bold text-green-700">{stats.active}</p>
              <p className="text-xs text-gray-500">Active Plans</p>
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
              <p className="text-2xl font-bold text-amber-700 tabular-nums">{formatCurrency(stats.totalOwed)}</p>
              <p className="text-xs text-gray-500">Outstanding on Plans</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700 tabular-nums">{formatCurrency(stats.collected)}</p>
              <p className="text-xs text-gray-500">Collected via Plans</p>
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

      {/* Plan cards */}
      {loading ? (
        <FullPageSpinner />
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={<Wallet size={28} />}
          title="No payment plans found"
          subtitle="No payment plans match this filter. Create a new one to help patients manage their costs."
        />
      ) : (
        <div className="space-y-4">
          {displayed.map((plan) => {
            const badge = statusBadge(plan.status);
            const isExpanded = expandedId === plan.id;
            const progressPct = plan.totalInstallments > 0
              ? Math.round((plan.paidInstallments / plan.totalInstallments) * 100)
              : 0;
            const nextDue = getNextDueDate(plan);

            return (
              <div
                key={plan.id}
                className={`card overflow-hidden border-l-4 ${statusBorderColor(plan.status)} hover:shadow-md transition-shadow`}
              >
                <div className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: patient info */}
                    <div className="flex items-start gap-4 min-w-0">
                      {plan.patient && (
                        <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold">
                            {getInitials(plan.patient.firstName, plan.patient.lastName)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-base font-semibold text-gray-900">
                            {plan.patient?.firstName} {plan.patient?.lastName}
                          </p>
                          {plan.patient && <OpenDentalLink patientId={plan.patient.id} />}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                            {badge.icon}
                            {badge.text}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 max-w-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">
                              {plan.paidInstallments} of {plan.totalInstallments} payments ({progressPct}%)
                            </span>
                            <span className="text-xs font-semibold text-gray-700 tabular-nums">
                              {formatCurrency(plan.monthlyPayment)}/mo
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                plan.status === 'defaulted' ? 'bg-red-400' :
                                plan.status === 'completed' ? 'bg-blue-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-gray-500">
                            Total: <span className="font-semibold text-gray-700">{formatCurrency(plan.totalAmount)}</span>
                          </span>
                          {plan.downPayment > 0 && (
                            <span className="text-xs text-gray-500">
                              Down: <span className="font-medium">{formatCurrency(plan.downPayment)}</span>
                            </span>
                          )}
                          {nextDue && plan.status === 'active' && (
                            <span className="text-xs text-gray-500">
                              Next due: <span className="font-medium">{formatDate(nextDue)}</span>
                            </span>
                          )}
                          {plan.notes && (
                            <span className="text-xs text-gray-400 italic">{plan.notes}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: amount + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-xl font-bold text-gray-900 tabular-nums">
                        {formatCurrency(plan.remainingAmount)}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Remaining</p>

                      <div className="flex items-center gap-2 mt-1">
                        {plan.status === 'active' && (
                          <>
                            <button
                              onClick={() => handlePayInstallment(plan)}
                              disabled={actionId === plan.id}
                              className="btn-primary text-xs py-1.5 px-3"
                            >
                              {actionId === plan.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <CreditCard size={13} />
                              )}
                              <span className="hidden sm:inline">Record Payment</span>
                            </button>
                            <button
                              onClick={() => handleCancel(plan)}
                              disabled={actionId === plan.id + '-cancel'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-50"
                            >
                              {actionId === plan.id + '-cancel' ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Ban size={13} />
                              )}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          <span className="hidden sm:inline">Schedule</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded installment schedule */}
                  {isExpanded && plan.installments && plan.installments.length > 0 && (
                    <div className="mt-4 ml-16">
                      <div className="bg-gray-50/80 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200/60">
                              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Paid Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {plan.installments.map((inst) => {
                              const instBadge = installmentStatusBadge(inst.status);
                              return (
                                <tr key={inst.id} className="hover:bg-white/60 transition-colors">
                                  <td className="px-4 py-2.5 text-gray-700 font-medium">{inst.installmentNo}</td>
                                  <td className="px-4 py-2.5 text-gray-900 font-semibold tabular-nums">{formatCurrency(inst.amount)}</td>
                                  <td className="px-4 py-2.5 text-gray-600">{formatDate(inst.dueDate)}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${instBadge.className}`}>
                                      {instBadge.text}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600">
                                    {inst.paidDate ? formatDate(inst.paidDate) : <span className="text-gray-400">--</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {isExpanded && (!plan.installments || plan.installments.length === 0) && (
                    <div className="mt-4 ml-16">
                      <p className="text-sm text-gray-400 italic py-4 text-center">No installment schedule available</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Payment Plan"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Set up a payment plan to help patients manage their treatment costs over time.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <input type="text" className="input" placeholder="Search patient..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" className="input pl-7" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" className="input pl-7" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" className="input pl-7" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input min-h-[60px]" placeholder="Treatment description..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => { setShowCreate(false); toast.success('Payment plan created.'); }} className="btn-primary flex-1 justify-center py-2.5">
              <Plus size={15} />
              Create Plan
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
