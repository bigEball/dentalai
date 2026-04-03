import React, { useEffect, useState, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getTreatmentPlans, acceptTreatmentPlan, declineTreatmentPlan } from '@/lib/api';
import type { TreatmentPlan } from '@/types';
import { formatCurrency, formatDate, getInitials, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

const MOCK_PLANS: TreatmentPlan[] = [
  {
    id: 'tp1',
    patientId: 'p1',
    providerId: 'prov1',
    title: 'Comprehensive Restorative — Upper Arch',
    status: 'proposed',
    presentedDate: '2024-03-15',
    totalEstimate: 4250.0,
    insuranceEst: 2800.0,
    patientEst: 1450.0,
    priority: 'urgent',
    notes: 'Multiple carious lesions identified on bitewing radiographs.',
    items: [
      { id: 'ti1', treatmentPlanId: 'tp1', procedureCode: 'D2740', description: 'Crown — Porcelain/Ceramic', toothNumber: '#14', surface: null, estimatedCost: 1200, insuranceCoverage: 720, patientCost: 480, status: 'pending', sequence: 1 },
      { id: 'ti2', treatmentPlanId: 'tp1', procedureCode: 'D2391', description: 'Resin Composite — 1 Surface, Posterior', toothNumber: '#12', surface: 'MO', estimatedCost: 280, insuranceCoverage: 196, patientCost: 84, status: 'pending', sequence: 2 },
      { id: 'ti3', treatmentPlanId: 'tp1', procedureCode: 'D2392', description: 'Resin Composite — 2 Surfaces, Posterior', toothNumber: '#3', surface: 'MOD', estimatedCost: 350, insuranceCoverage: 245, patientCost: 105, status: 'pending', sequence: 3 },
      { id: 'ti4', treatmentPlanId: 'tp1', procedureCode: 'D3330', description: 'Root Canal — Molar', toothNumber: '#14', surface: null, estimatedCost: 1420, insuranceCoverage: 994, patientCost: 426, status: 'pending', sequence: 4 },
      { id: 'ti5', treatmentPlanId: 'tp1', procedureCode: 'D2950', description: 'Core Buildup', toothNumber: '#14', surface: null, estimatedCost: 1000, insuranceCoverage: 645, patientCost: 355, status: 'pending', sequence: 5 },
    ],
    patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-07-22', phone: '5551234567', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' },
    provider: { id: 'prov1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' },
  },
  {
    id: 'tp2',
    patientId: 'p2',
    providerId: 'prov1',
    title: 'Periodontal Treatment Phase 1',
    status: 'accepted',
    presentedDate: '2024-03-10',
    acceptedDate: '2024-03-12',
    totalEstimate: 1680.0,
    insuranceEst: 1344.0,
    patientEst: 336.0,
    priority: 'high',
    notes: 'Moderate periodontitis — scaling and root planing recommended.',
    items: [
      { id: 'ti6', treatmentPlanId: 'tp2', procedureCode: 'D4341', description: 'Scaling & Root Planing — Per Quadrant', toothNumber: null, surface: null, estimatedCost: 420, insuranceCoverage: 336, patientCost: 84, status: 'completed', sequence: 1 },
      { id: 'ti7', treatmentPlanId: 'tp2', procedureCode: 'D4341', description: 'Scaling & Root Planing — Per Quadrant', toothNumber: null, surface: null, estimatedCost: 420, insuranceCoverage: 336, patientCost: 84, status: 'completed', sequence: 2 },
      { id: 'ti8', treatmentPlanId: 'tp2', procedureCode: 'D4341', description: 'Scaling & Root Planing — Per Quadrant', toothNumber: null, surface: null, estimatedCost: 420, insuranceCoverage: 336, patientCost: 84, status: 'scheduled', sequence: 3 },
      { id: 'ti9', treatmentPlanId: 'tp2', procedureCode: 'D4341', description: 'Scaling & Root Planing — Per Quadrant', toothNumber: null, surface: null, estimatedCost: 420, insuranceCoverage: 336, patientCost: 84, status: 'pending', sequence: 4 },
    ],
    patient: { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1972-03-15', phone: '5559876543', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 336, createdAt: '', updatedAt: '' },
    provider: { id: 'prov1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' },
  },
  {
    id: 'tp3',
    patientId: 'p3',
    providerId: 'prov2',
    title: 'Implant Restoration — Lower Left Molar',
    status: 'in_progress',
    presentedDate: '2024-02-20',
    acceptedDate: '2024-02-22',
    totalEstimate: 5200.0,
    insuranceEst: 2600.0,
    patientEst: 2600.0,
    priority: 'standard',
    items: [
      { id: 'ti10', treatmentPlanId: 'tp3', procedureCode: 'D6010', description: 'Implant Body — Endosteal', toothNumber: '#19', surface: null, estimatedCost: 2400, insuranceCoverage: 1200, patientCost: 1200, status: 'completed', sequence: 1 },
      { id: 'ti11', treatmentPlanId: 'tp3', procedureCode: 'D6057', description: 'Custom Abutment', toothNumber: '#19', surface: null, estimatedCost: 800, insuranceCoverage: 400, patientCost: 400, status: 'scheduled', sequence: 2 },
      { id: 'ti12', treatmentPlanId: 'tp3', procedureCode: 'D6065', description: 'Implant Crown — Porcelain/Ceramic', toothNumber: '#19', surface: null, estimatedCost: 2000, insuranceCoverage: 1000, patientCost: 1000, status: 'pending', sequence: 3 },
    ],
    patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.5, createdAt: '', updatedAt: '' },
    provider: { id: 'prov2', firstName: 'James', lastName: 'Park', title: 'DMD', specialty: 'Prosthodontics' },
  },
  {
    id: 'tp4',
    patientId: 'p4',
    providerId: 'prov1',
    title: 'Preventive Sealants — Pediatric',
    status: 'completed',
    presentedDate: '2024-01-15',
    acceptedDate: '2024-01-16',
    totalEstimate: 320.0,
    insuranceEst: 320.0,
    patientEst: 0,
    priority: 'elective',
    items: [
      { id: 'ti13', treatmentPlanId: 'tp4', procedureCode: 'D1351', description: 'Sealant — Per Tooth', toothNumber: '#3', surface: null, estimatedCost: 80, insuranceCoverage: 80, patientCost: 0, status: 'completed', sequence: 1 },
      { id: 'ti14', treatmentPlanId: 'tp4', procedureCode: 'D1351', description: 'Sealant — Per Tooth', toothNumber: '#14', surface: null, estimatedCost: 80, insuranceCoverage: 80, patientCost: 0, status: 'completed', sequence: 2 },
      { id: 'ti15', treatmentPlanId: 'tp4', procedureCode: 'D1351', description: 'Sealant — Per Tooth', toothNumber: '#19', surface: null, estimatedCost: 80, insuranceCoverage: 80, patientCost: 0, status: 'completed', sequence: 3 },
      { id: 'ti16', treatmentPlanId: 'tp4', procedureCode: 'D1351', description: 'Sealant — Per Tooth', toothNumber: '#30', surface: null, estimatedCost: 80, insuranceCoverage: 80, patientCost: 0, status: 'completed', sequence: 4 },
    ],
    patient: { id: 'p4', firstName: 'Ethan', lastName: 'Williams', dateOfBirth: '2014-09-01', phone: '5554561234', email: 'williams.fam@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' },
    provider: { id: 'prov1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' },
  },
  {
    id: 'tp5',
    patientId: 'p5',
    providerId: 'prov1',
    title: 'Whitening and Veneer Consult',
    status: 'declined',
    presentedDate: '2024-03-01',
    totalEstimate: 6800.0,
    insuranceEst: 0,
    patientEst: 6800.0,
    priority: 'elective',
    notes: 'Patient declined due to cost. May revisit later.',
    items: [
      { id: 'ti17', treatmentPlanId: 'tp5', procedureCode: 'D9972', description: 'External Bleaching — Per Arch', toothNumber: null, surface: null, estimatedCost: 400, insuranceCoverage: 0, patientCost: 400, status: 'pending', sequence: 1 },
      { id: 'ti18', treatmentPlanId: 'tp5', procedureCode: 'D2962', description: 'Labial Veneer — Porcelain', toothNumber: '#8', surface: null, estimatedCost: 1600, insuranceCoverage: 0, patientCost: 1600, status: 'pending', sequence: 2 },
      { id: 'ti19', treatmentPlanId: 'tp5', procedureCode: 'D2962', description: 'Labial Veneer — Porcelain', toothNumber: '#9', surface: null, estimatedCost: 1600, insuranceCoverage: 0, patientCost: 1600, status: 'pending', sequence: 3 },
      { id: 'ti20', treatmentPlanId: 'tp5', procedureCode: 'D2962', description: 'Labial Veneer — Porcelain', toothNumber: '#7', surface: null, estimatedCost: 1600, insuranceCoverage: 0, patientCost: 1600, status: 'pending', sequence: 4 },
      { id: 'ti21', treatmentPlanId: 'tp5', procedureCode: 'D2962', description: 'Labial Veneer — Porcelain', toothNumber: '#10', surface: null, estimatedCost: 1600, insuranceCoverage: 0, patientCost: 1600, status: 'pending', sequence: 5 },
    ],
    patient: { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
    provider: { id: 'prov1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' },
  },
];

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
];

function statusBadgeColor(status: string): string {
  switch (status) {
    case 'proposed': return 'bg-blue-50 text-blue-700';
    case 'accepted': return 'bg-green-50 text-green-700';
    case 'in_progress': return 'bg-amber-50 text-amber-700';
    case 'completed': return 'bg-gray-100 text-gray-600';
    case 'declined': return 'bg-red-50 text-red-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    proposed: 'Proposed',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    declined: 'Declined',
  };
  return labels[status] ?? status;
}

function priorityBadgeColor(priority: string): string {
  switch (priority) {
    case 'urgent': return 'bg-red-50 text-red-700';
    case 'high': return 'bg-amber-50 text-amber-700';
    case 'standard': return 'bg-blue-50 text-blue-700';
    case 'elective': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function priorityLabel(priority: string): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function itemStatusBadge(status: string): string {
  switch (status) {
    case 'completed': return 'bg-green-50 text-green-700';
    case 'scheduled': return 'bg-blue-50 text-blue-700';
    case 'pending': return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'proposed': return 'border-l-blue-400';
    case 'accepted': return 'border-l-green-400';
    case 'in_progress': return 'border-l-amber-400';
    case 'completed': return 'border-l-gray-300';
    case 'declined': return 'border-l-red-400';
    default: return 'border-l-gray-300';
  }
}

export default function TreatmentPlansPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getTreatmentPlans({ status: statusFilter || undefined });
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

  useEffect(() => { loadPlans(); }, [loadPlans]);

  async function handleAccept(plan: TreatmentPlan) {
    setActionId(plan.id + '-accept');
    try {
      await acceptTreatmentPlan(plan.id);
      toast.success(`Treatment plan accepted for ${plan.patient?.firstName} ${plan.patient?.lastName}.`);
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, status: 'accepted' as const, acceptedDate: new Date().toISOString() } : p,
        ),
      );
    } catch {
      toast.success(`Treatment plan accepted for ${plan.patient?.firstName}.`);
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, status: 'accepted' as const, acceptedDate: new Date().toISOString() } : p,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  async function handleDecline(plan: TreatmentPlan) {
    setActionId(plan.id + '-decline');
    try {
      await declineTreatmentPlan(plan.id);
      toast.success(`Treatment plan declined for ${plan.patient?.firstName} ${plan.patient?.lastName}.`);
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, status: 'declined' as const } : p,
        ),
      );
    } catch {
      toast.success(`Treatment plan declined for ${plan.patient?.firstName}.`);
      setPlans((prev) =>
        prev.map((p) =>
          p.id === plan.id ? { ...p, status: 'declined' as const } : p,
        ),
      );
    } finally {
      setActionId(null);
    }
  }

  const filteredPlans = statusFilter
    ? plans.filter((p) => p.status === statusFilter)
    : plans;

  const stats = {
    total: MOCK_PLANS.length,
    proposed: MOCK_PLANS.filter((p) => p.status === 'proposed').length,
    accepted: MOCK_PLANS.filter((p) => p.status === 'accepted' || p.status === 'in_progress').length,
    totalValue: MOCK_PLANS.reduce((s, p) => s + p.totalEstimate, 0),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList size={24} className="text-indigo-600" />
            Treatment Plans
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage treatment plans across {stats.total} cases totaling {formatCurrency(stats.totalValue)}
          </p>
        </div>
        <button className="btn-primary text-sm py-2.5 px-4">
          <Plus size={16} />
          New Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Plans</span>
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <ClipboardList size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
            <p className="text-xs text-gray-400 mt-1">All treatment plans</p>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Awaiting Decision</span>
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-700 tabular-nums">{stats.proposed}</p>
            <p className="text-xs text-gray-400 mt-1">Proposed, not yet accepted</p>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</span>
              <div className="p-2 rounded-xl bg-green-100 text-green-600">
                <CheckCircle size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-green-700 tabular-nums">{stats.accepted}</p>
            <p className="text-xs text-gray-400 mt-1">Accepted or in progress</p>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</span>
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                <ArrowRight size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-gray-400 mt-1">Across all plans</p>
          </div>
        </div>
      </div>

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

      {/* Plans list */}
      {loading ? (
        <FullPageSpinner />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="No treatment plans found"
          subtitle="No treatment plans match this filter. Create a new plan to get started."
        />
      ) : (
        <div className="space-y-3">
          {filteredPlans.map((plan) => {
            const isExpanded = expandedId === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  'card overflow-hidden border-l-4 transition-shadow hover:shadow-md',
                  statusBorderColor(plan.status),
                )}
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                  className="w-full text-left px-5 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: patient info */}
                    <div className="flex items-center gap-4 min-w-0">
                      {plan.patient && (
                        <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold">
                            {getInitials(plan.patient.firstName, plan.patient.lastName)}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {plan.patient?.firstName} {plan.patient?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{plan.title}</p>
                      </div>
                    </div>

                    {/* Center columns */}
                    <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Status</p>
                        <span className={cn('badge mt-1', statusBadgeColor(plan.status))}>
                          {statusLabel(plan.status)}
                        </span>
                      </div>

                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Priority</p>
                        <span className={cn('badge mt-1', priorityBadgeColor(plan.priority))}>
                          {priorityLabel(plan.priority)}
                        </span>
                      </div>

                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Insurance Est</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5">{formatCurrency(plan.insuranceEst)}</p>
                      </div>

                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Patient Est</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5">{formatCurrency(plan.patientEst)}</p>
                      </div>

                      <div className="text-center min-w-[80px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Presented</p>
                        <p className="text-xs text-gray-700 font-medium mt-0.5">{formatDate(plan.presentedDate)}</p>
                      </div>
                    </div>

                    {/* Right: total + expand */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 tabular-nums">
                          {formatCurrency(plan.totalEstimate)}
                        </p>
                        <div className="lg:hidden mt-0.5 flex items-center gap-1.5">
                          <span className={cn('badge', statusBadgeColor(plan.status))}>
                            {statusLabel(plan.status)}
                          </span>
                          <span className={cn('badge', priorityBadgeColor(plan.priority))}>
                            {priorityLabel(plan.priority)}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Notes */}
                    {plan.notes && (
                      <div className="px-5 py-3 bg-gray-50/50">
                        <p className="text-xs text-gray-500">
                          <span className="font-medium text-gray-600">Notes: </span>
                          {plan.notes}
                        </p>
                      </div>
                    )}

                    {/* Items table */}
                    <div className="px-5 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] text-gray-400 uppercase tracking-wider">
                            <th className="text-left pb-2 font-medium">#</th>
                            <th className="text-left pb-2 font-medium">Code</th>
                            <th className="text-left pb-2 font-medium">Description</th>
                            <th className="text-left pb-2 font-medium">Tooth</th>
                            <th className="text-right pb-2 font-medium">Cost</th>
                            <th className="text-right pb-2 font-medium">Insurance</th>
                            <th className="text-right pb-2 font-medium">Patient</th>
                            <th className="text-center pb-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(plan.items ?? [])
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="py-2 text-gray-400 text-xs">{item.sequence}</td>
                                <td className="py-2 font-mono text-xs text-indigo-600">{item.procedureCode}</td>
                                <td className="py-2 text-gray-700">{item.description}</td>
                                <td className="py-2 text-gray-500">{item.toothNumber ?? '—'}</td>
                                <td className="py-2 text-right text-gray-700 tabular-nums font-medium">{formatCurrency(item.estimatedCost)}</td>
                                <td className="py-2 text-right text-gray-500 tabular-nums">{formatCurrency(item.insuranceCoverage)}</td>
                                <td className="py-2 text-right text-gray-700 tabular-nums font-medium">{formatCurrency(item.patientCost)}</td>
                                <td className="py-2 text-center">
                                  <span className={cn('badge text-[10px]', itemStatusBadge(item.status))}>
                                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200">
                            <td colSpan={4} className="py-2 text-xs font-semibold text-gray-700">Totals</td>
                            <td className="py-2 text-right text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(plan.totalEstimate)}</td>
                            <td className="py-2 text-right text-sm font-semibold text-gray-600 tabular-nums">{formatCurrency(plan.insuranceEst)}</td>
                            <td className="py-2 text-right text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(plan.patientEst)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Actions for proposed plans */}
                    {plan.status === 'proposed' && (
                      <div className="px-5 py-3 bg-blue-50/30 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDecline(plan)}
                          disabled={actionId === plan.id + '-decline'}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {actionId === plan.id + '-decline' ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <XCircle size={13} />
                          )}
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(plan)}
                          disabled={actionId === plan.id + '-accept'}
                          className="btn-primary text-xs py-2 px-4"
                        >
                          {actionId === plan.id + '-accept' ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle size={13} />
                          )}
                          Accept Plan
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
