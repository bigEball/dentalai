import React, { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  RefreshCw,
  Plus,
  Loader2,
  CheckCircle,
  X,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  getInsurancePlans,
  getInsuranceClaims,
  verifyInsurancePlan,
  submitInsuranceClaim,
  createInsuranceClaim,
  createInsurancePlan,
  generateClaims,
  getPatient,
} from '@/lib/api';
import type { InsurancePlan, InsuranceClaim, Patient } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import PatientSearchBar from '@/components/ui/PatientSearchBar';

// ─── Status Tab Config ────────────────────────────────────────────────────────

const CLAIM_TABS = [
  { key: '', label: 'All Claims' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
];

// ─── Helper Components ────────────────────────────────────────────────────────

function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const remaining = max - value;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-900 font-semibold tabular-nums">
          {formatCurrency(value)} <span className="text-gray-400 font-normal">of {formatCurrency(max)}</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        {remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Fully used'}
      </p>
    </div>
  );
}

function VerificationStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'verified': return <CheckCircle size={16} className="text-green-500" />;
    case 'pending': return <Clock size={16} className="text-amber-500" />;
    case 'expired': return <AlertTriangle size={16} className="text-orange-500" />;
    case 'failed': return <XCircle size={16} className="text-red-500" />;
    default: return <Clock size={16} className="text-gray-400" />;
  }
}

function verificationStatusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case 'verified': return { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' };
    case 'pending': return { label: 'Needs Verification', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'expired': return { label: 'Expired', className: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'failed': return { label: 'Verification Failed', className: 'bg-red-50 text-red-700 border-red-200' };
    default: return { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' };
  }
}

function claimStatusConfig(status: string): { icon: React.ReactNode; label: string; className: string; bgClass: string } {
  switch (status) {
    case 'approved': return {
      icon: <CheckCircle size={16} />, label: 'Approved', className: 'text-green-700',
      bgClass: 'border-l-4 border-l-green-400 bg-green-50/30',
    };
    case 'denied': return {
      icon: <XCircle size={16} />, label: 'Denied', className: 'text-red-700',
      bgClass: 'border-l-4 border-l-red-400 bg-red-50/30',
    };
    case 'submitted': return {
      icon: <Clock size={16} />, label: 'Submitted — Awaiting Response', className: 'text-blue-700',
      bgClass: 'border-l-4 border-l-blue-400 bg-blue-50/20',
    };
    case 'pending': return {
      icon: <Clock size={16} />, label: 'Pending Review', className: 'text-amber-700',
      bgClass: 'border-l-4 border-l-amber-400 bg-amber-50/20',
    };
    case 'draft': return {
      icon: <FileText size={16} />, label: 'Draft — Ready for Review', className: 'text-gray-600',
      bgClass: 'border-l-4 border-l-gray-300',
    };
    default: return {
      icon: <FileText size={16} />, label: status, className: 'text-gray-600',
      bgClass: 'border-l-4 border-l-gray-300',
    };
  }
}

function calcClaimStats(claims: InsuranceClaim[]) {
  const total = claims.length;
  const totalAmount = claims.reduce((s, c) => s + c.totalAmount, 0);
  const approvedAmount = claims.filter(c => c.status === 'approved').reduce((s, c) => s + (c.approvedAmount ?? 0), 0);
  const pendingCount = claims.filter(c => ['draft', 'pending', 'submitted'].includes(c.status)).length;
  const deniedCount = claims.filter(c => c.status === 'denied').length;
  return { total, totalAmount, approvedAmount, pendingCount, deniedCount };
}

function calcVerificationStats(plans: InsurancePlan[]) {
  const total = plans.length;
  const verified = plans.filter(p => p.verificationStatus === 'verified').length;
  const needsAttention = plans.filter(p => p.verificationStatus !== 'verified').length;
  return { total, verified, needsAttention };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'claims'>('verification');
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimFilter, setClaimFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [filterPatient, setFilterPatient] = useState<Patient | null>(null);
  const [searchParams] = useSearchParams();

  // Modals
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showNewPlan, setShowNewPlan] = useState(false);

  // New Claim form state
  const [claimPatient, setClaimPatient] = useState<Patient | null>(null);
  const [claimPatientPlans, setClaimPatientPlans] = useState<InsurancePlan[]>([]);
  const [claimForm, setClaimForm] = useState({ planId: '', procedures: '', amount: '', narrative: '' });
  const [claimStep, setClaimStep] = useState(1);

  // New Plan form state
  const [planPatient, setPlanPatient] = useState<Patient | null>(null);
  const [planForm, setPlanForm] = useState({
    provider: '', memberId: '', groupNumber: '',
    deductible: '', annualMax: '',
    coPayPreventive: '0', coPayBasic: '20', coPayMajor: '50',
  });

  // Load patient from URL param
  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      getPatient(patientId).then(setFilterPatient).catch(() => {});
    }
  }, [searchParams]);

  // Load data when tab or filter changes
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'verification') {
        const result = await getInsurancePlans(
          filterPatient ? { patientId: filterPatient.id } : undefined,
        );
        setPlans(result);
      } else {
        const result = await getInsuranceClaims({
          status: claimFilter || undefined,
          patientId: filterPatient?.id,
        });
        setClaims(result);
      }
    } catch {
      toast.error('Failed to load insurance data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, claimFilter, filterPatient]);

  useEffect(() => { loadData(); }, [loadData]);

  // When a claim patient is selected, fetch their plans
  useEffect(() => {
    if (claimPatient) {
      getInsurancePlans({ patientId: claimPatient.id }).then(p => {
        setClaimPatientPlans(p);
        if (p.length === 1) setClaimForm(f => ({ ...f, planId: p[0].id }));
      }).catch(() => setClaimPatientPlans([]));
    } else {
      setClaimPatientPlans([]);
    }
  }, [claimPatient]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleVerify(id: string) {
    setVerifyingId(id);
    try {
      await verifyInsurancePlan(id);
      toast.success('Coverage verified! Benefits are up to date.');
      setPlans(prev => prev.map(p =>
        p.id === id ? { ...p, verificationStatus: 'verified' as const, verifiedDate: new Date().toISOString() } : p,
      ));
    } catch {
      toast.error('Failed to verify coverage. Please try again.');
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleSubmitClaim(id: string) {
    setSubmittingId(id);
    try {
      await submitInsuranceClaim(id);
      toast.success('Claim submitted to the insurance carrier.');
      setClaims(prev => prev.map(c =>
        c.id === id ? { ...c, status: 'submitted' as const, submittedDate: new Date().toISOString() } : c,
      ));
    } catch {
      toast.error('Failed to submit claim. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleGenerateClaims() {
    setGenerating(true);
    try {
      const result = await generateClaims();
      if (result.generated > 0) {
        toast.success(`Generated ${result.generated} new draft claim${result.generated > 1 ? 's' : ''} from completed appointments.`);
        loadData();
      } else {
        toast.success('No new claims to generate. All completed appointments already have claims.');
      }
    } catch {
      toast.error('Failed to generate claims.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCreateClaim() {
    if (!claimPatient || !claimForm.planId || !claimForm.procedures) {
      toast.error('Please select a patient, insurance plan, and enter procedure codes.');
      return;
    }
    try {
      await createInsuranceClaim({
        patientId: claimPatient.id,
        insurancePlanId: claimForm.planId,
        procedureCodes: claimForm.procedures,
        totalAmount: parseFloat(claimForm.amount) || 0,
        narrative: claimForm.narrative,
      });
      toast.success('Claim saved as draft. You can review and submit it when ready.');
      resetClaimModal();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create claim.');
    }
  }

  async function handleCreatePlan() {
    if (!planPatient || !planForm.provider || !planForm.memberId || !planForm.groupNumber) {
      toast.error('Please fill in all required fields.');
      return;
    }
    try {
      await createInsurancePlan({
        patientId: planPatient.id,
        provider: planForm.provider,
        memberId: planForm.memberId,
        groupNumber: planForm.groupNumber,
        deductible: parseFloat(planForm.deductible) || 0,
        annualMax: parseFloat(planForm.annualMax) || 0,
        coPayPreventive: parseFloat(planForm.coPayPreventive) || 0,
        coPayBasic: parseFloat(planForm.coPayBasic) || 20,
        coPayMajor: parseFloat(planForm.coPayMajor) || 50,
      });
      toast.success('Insurance plan added successfully.');
      resetPlanModal();
      loadData();
    } catch {
      toast.error('Failed to create insurance plan.');
    }
  }

  function resetClaimModal() {
    setShowNewClaim(false);
    setClaimStep(1);
    setClaimPatient(null);
    setClaimPatientPlans([]);
    setClaimForm({ planId: '', procedures: '', amount: '', narrative: '' });
  }

  function resetPlanModal() {
    setShowNewPlan(false);
    setPlanPatient(null);
    setPlanForm({
      provider: '', memberId: '', groupNumber: '',
      deductible: '', annualMax: '',
      coPayPreventive: '0', coPayBasic: '20', coPayMajor: '50',
    });
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const verificationStats = calcVerificationStats(plans);
  const claimStats = calcClaimStats(claims);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield size={24} className="text-indigo-600" />
            Insurance
          </h1>
          <p className="mt-1 text-sm text-gray-500">Verify coverage, manage claims, and track reimbursements</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'verification' && (
            <button onClick={() => setShowNewPlan(true)} className="btn-primary">
              <Plus size={16} /> Add Plan
            </button>
          )}
          {activeTab === 'claims' && (
            <>
              <button
                onClick={handleGenerateClaims}
                disabled={generating}
                className="btn-secondary"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                Auto-Generate Claims
              </button>
              <button onClick={() => setShowNewClaim(true)} className="btn-primary">
                <Plus size={16} /> New Claim
              </button>
            </>
          )}
        </div>
      </div>

      {/* Patient filter */}
      <div className="mb-4">
        <PatientSearchBar
          onSelect={setFilterPatient}
          placeholder="Filter by patient name..."
          className="max-w-md"
        />
      </div>
      {filterPatient && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
            <span className="font-medium">{filterPatient.firstName} {filterPatient.lastName}</span>
            <button onClick={() => setFilterPatient(null)} className="hover:text-indigo-900"><X size={14} /></button>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['verification', 'claims'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'verification' ? 'Coverage Verification' : 'Claims'}
          </button>
        ))}
      </div>

      {/* ─── VERIFICATION TAB ─── */}
      {activeTab === 'verification' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Shield size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{verificationStats.total}</p>
                  <p className="text-xs text-gray-500">Total Plans on File</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-600"><CheckCircle size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{verificationStats.verified}</p>
                  <p className="text-xs text-gray-500">Verified and Active</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{verificationStats.needsAttention}</p>
                  <p className="text-xs text-gray-500">Need Verification</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <FullPageSpinner />
          ) : plans.length === 0 ? (
            <EmptyState
              icon={<Shield size={28} />}
              title="No insurance plans on file"
              subtitle="Add insurance plans for patients to start verifying coverage and submitting claims."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plans.map(plan => {
                const statusInfo = verificationStatusLabel(plan.verificationStatus);
                return (
                  <div key={plan.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {plan.patient && (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold">
                              {getInitials(plan.patient.firstName, plan.patient.lastName)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {plan.patient?.firstName} {plan.patient?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {plan.provider} <span className="text-gray-300 mx-1">|</span>
                            <span className="font-mono text-gray-400">{plan.memberId}</span>
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                        <VerificationStatusIcon status={plan.verificationStatus} />
                        {statusInfo.label}
                      </div>
                    </div>

                    <div className="px-5 py-4 space-y-4">
                      <ProgressBar value={plan.deductibleMet} max={plan.deductible} label="Deductible" color="bg-blue-500" />
                      <ProgressBar
                        value={plan.annualUsed}
                        max={plan.annualMax}
                        label="Annual Maximum"
                        color={plan.annualMax > 0 && plan.annualUsed / plan.annualMax > 0.8 ? 'bg-amber-500' : 'bg-indigo-500'}
                      />
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                        <span>Patient Pays:</span>
                        <span className="bg-gray-50 rounded px-2 py-0.5">Preventive {plan.coPayPreventive}%</span>
                        <span className="bg-gray-50 rounded px-2 py-0.5">Basic {plan.coPayBasic}%</span>
                        <span className="bg-gray-50 rounded px-2 py-0.5">Major {plan.coPayMajor}%</span>
                      </div>
                    </div>

                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                      {plan.verifiedDate ? (
                        <p className="text-xs text-gray-400">Last verified {formatDate(plan.verifiedDate)}</p>
                      ) : <span />}
                      {plan.verificationStatus !== 'verified' ? (
                        <button
                          onClick={() => handleVerify(plan.id)}
                          disabled={verifyingId === plan.id}
                          className="btn-primary text-xs py-2 px-4"
                        >
                          {verifyingId === plan.id ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                          Verify Coverage Now
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full">
                          <CheckCircle size={14} /> Coverage Active
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── CLAIMS TAB ─── */}
      {activeTab === 'claims' && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><FileText size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{claimStats.total}</p>
                  <p className="text-xs text-gray-500">Total Claims</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><DollarSign size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(claimStats.totalAmount)}</p>
                  <p className="text-xs text-gray-500">Total Filed</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-600"><CheckCircle size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(claimStats.approvedAmount)}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600"><XCircle size={20} /></div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{claimStats.deniedCount}</p>
                  <p className="text-xs text-gray-500">Denied (need follow-up)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 mb-5 flex-wrap">
            {CLAIM_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setClaimFilter(tab.key)}
                className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-all ${
                  claimFilter === tab.key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <FullPageSpinner />
          ) : claims.length === 0 ? (
            <EmptyState
              icon={<Shield size={28} />}
              title="No claims found"
              subtitle={claimFilter
                ? 'No claims match this filter. Try selecting a different status.'
                : 'Click "Auto-Generate Claims" to create claims from completed appointments, or add one manually.'
              }
            />
          ) : (
            <div className="space-y-3">
              {claims.map(claim => {
                const config = claimStatusConfig(claim.status);
                return (
                  <div key={claim.id} className={`card overflow-hidden ${config.bgClass} hover:shadow-md transition-shadow`}>
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 min-w-0">
                          {claim.patient && (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold">
                                {getInitials(claim.patient.firstName, claim.patient.lastName)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900">
                                {claim.patient?.firstName} {claim.patient?.lastName}
                              </p>
                              {claim.insurancePlan && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {claim.insurancePlan.provider}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">Filed {formatDate(claim.claimDate)}</span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono mt-1">{claim.procedureCodes}</p>
                            <p className="text-xs text-gray-500 mt-1 max-w-lg truncate" title={claim.narrative}>
                              {claim.narrative}
                            </p>
                            {claim.denialReason && (
                              <div className="mt-2 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                                <p className="text-xs text-red-700 font-medium">Denial reason:</p>
                                <p className="text-xs text-red-600 mt-0.5">{claim.denialReason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(claim.totalAmount)}</p>
                          {claim.approvedAmount != null && (
                            <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                              Approved: {formatCurrency(claim.approvedAmount)}
                            </p>
                          )}
                          <div className={`flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
                            {config.icon}
                            {config.label}
                          </div>
                          <div className="mt-1">
                            {(claim.status === 'draft' || claim.status === 'pending') && (
                              <button
                                onClick={() => handleSubmitClaim(claim.id)}
                                disabled={submittingId === claim.id}
                                className="btn-primary text-xs py-1.5 px-4"
                              >
                                {submittingId === claim.id ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                                Review & Submit
                              </button>
                            )}
                            {claim.status === 'denied' && (
                              <button
                                onClick={() => handleSubmitClaim(claim.id)}
                                disabled={submittingId === claim.id}
                                className="btn-secondary text-xs py-1.5 px-4 border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <RefreshCw size={13} /> Appeal
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── New Claim Modal ─── */}
      <Modal isOpen={showNewClaim} onClose={resetClaimModal} title={`New Claim — Step ${claimStep} of 2`} size="md">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${claimStep >= 1 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${claimStep >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
          </div>

          {claimStep === 1 && (
            <>
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-800 font-medium">Select the patient and their insurance plan.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient</label>
                <PatientSearchBar
                  onSelect={setClaimPatient}
                  placeholder="Search for a patient..."
                />
                {claimPatient && (
                  <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                    <CheckCircle size={14} />
                    <span className="font-medium">{claimPatient.firstName} {claimPatient.lastName}</span>
                    <button onClick={() => setClaimPatient(null)} className="ml-auto hover:text-green-900"><X size={14} /></button>
                  </div>
                )}
              </div>
              {claimPatient && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurance Plan</label>
                  {claimPatientPlans.length === 0 ? (
                    <p className="text-sm text-amber-600">No insurance plans found for this patient. Add one first.</p>
                  ) : (
                    <select
                      value={claimForm.planId}
                      onChange={e => setClaimForm(f => ({ ...f, planId: e.target.value }))}
                      className="input py-2.5"
                    >
                      <option value="">Select insurance plan...</option>
                      {claimPatientPlans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.provider} — {p.memberId} ({p.groupNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <button
                onClick={() => {
                  if (!claimPatient) { toast.error('Please select a patient.'); return; }
                  if (!claimForm.planId) { toast.error('Please select an insurance plan.'); return; }
                  setClaimStep(2);
                }}
                disabled={!claimPatient || !claimForm.planId}
                className="btn-primary w-full justify-center py-2.5"
              >
                Continue <ArrowRight size={15} />
              </button>
            </>
          )}

          {claimStep === 2 && (
            <>
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-800 font-medium">
                  Enter the procedure details and clinical narrative.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CDT Procedure Codes</label>
                <input
                  type="text"
                  value={claimForm.procedures}
                  onChange={e => setClaimForm(f => ({ ...f, procedures: e.target.value }))}
                  className="input py-2.5"
                  placeholder="e.g. D1110, D0274"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple codes with commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Amount ($)</label>
                <input
                  type="number"
                  value={claimForm.amount}
                  onChange={e => setClaimForm(f => ({ ...f, amount: e.target.value }))}
                  className="input py-2.5"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinical Narrative</label>
                <textarea
                  rows={3}
                  value={claimForm.narrative}
                  onChange={e => setClaimForm(f => ({ ...f, narrative: e.target.value }))}
                  className="input resize-none py-2.5"
                  placeholder="Describe the treatment performed..."
                />
                <p className="text-xs text-gray-400 mt-1">A clear narrative helps with faster approval</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setClaimStep(1)} className="btn-secondary flex-1 justify-center py-2.5">
                  Back
                </button>
                <button onClick={handleCreateClaim} className="btn-primary flex-1 justify-center py-2.5">
                  <CheckCircle size={15} /> Save as Draft
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ─── New Plan Modal ─── */}
      <Modal isOpen={showNewPlan} onClose={resetPlanModal} title="Add Insurance Plan" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient</label>
            <PatientSearchBar onSelect={setPlanPatient} placeholder="Search for a patient..." />
            {planPatient && (
              <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                <CheckCircle size={14} />
                <span className="font-medium">{planPatient.firstName} {planPatient.lastName}</span>
                <button onClick={() => setPlanPatient(null)} className="ml-auto hover:text-green-900"><X size={14} /></button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Insurance Provider</label>
              <input
                type="text"
                value={planForm.provider}
                onChange={e => setPlanForm(f => ({ ...f, provider: e.target.value }))}
                className="input py-2.5"
                placeholder="e.g. Delta Dental"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Member ID</label>
              <input
                type="text"
                value={planForm.memberId}
                onChange={e => setPlanForm(f => ({ ...f, memberId: e.target.value }))}
                className="input py-2.5"
                placeholder="e.g. DD-123456"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Group Number</label>
            <input
              type="text"
              value={planForm.groupNumber}
              onChange={e => setPlanForm(f => ({ ...f, groupNumber: e.target.value }))}
              className="input py-2.5"
              placeholder="e.g. GRP-44210"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Deductible ($)</label>
              <input
                type="number"
                value={planForm.deductible}
                onChange={e => setPlanForm(f => ({ ...f, deductible: e.target.value }))}
                className="input py-2.5"
                placeholder="500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Annual Maximum ($)</label>
              <input
                type="number"
                value={planForm.annualMax}
                onChange={e => setPlanForm(f => ({ ...f, annualMax: e.target.value }))}
                className="input py-2.5"
                placeholder="2000"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Patient Copay Percentages</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Preventive</label>
                <div className="relative">
                  <input
                    type="number"
                    value={planForm.coPayPreventive}
                    onChange={e => setPlanForm(f => ({ ...f, coPayPreventive: e.target.value }))}
                    className="input py-2 pr-7 text-center"
                    min="0" max="100"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Basic</label>
                <div className="relative">
                  <input
                    type="number"
                    value={planForm.coPayBasic}
                    onChange={e => setPlanForm(f => ({ ...f, coPayBasic: e.target.value }))}
                    className="input py-2 pr-7 text-center"
                    min="0" max="100"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Major</label>
                <div className="relative">
                  <input
                    type="number"
                    value={planForm.coPayMajor}
                    onChange={e => setPlanForm(f => ({ ...f, coPayMajor: e.target.value }))}
                    className="input py-2 pr-7 text-center"
                    min="0" max="100"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={handleCreatePlan}
            disabled={!planPatient || !planForm.provider || !planForm.memberId || !planForm.groupNumber}
            className="btn-primary w-full justify-center py-2.5 mt-2"
          >
            <CheckCircle size={15} /> Add Insurance Plan
          </button>
        </div>
      </Modal>
    </div>
  );
}
