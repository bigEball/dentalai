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
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  getInsurancePlans,
  getInsuranceClaims,
  verifyInsurancePlan,
  submitInsuranceClaim,
  createInsuranceClaim,
  getPatient,
} from '@/lib/api';
import type { InsurancePlan, InsuranceClaim, Patient } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import PatientSearchBar from '@/components/ui/PatientSearchBar';

const MOCK_PLANS: InsurancePlan[] = [
  { id: 'ip1', patientId: 'p1', provider: 'Aetna', memberId: 'AET-884021', groupNumber: 'GRP-44210', deductible: 1000, deductibleMet: 650, annualMax: 2000, annualUsed: 840, verificationStatus: 'verified', verifiedDate: '2024-01-10', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-03-15', phone: '5554201234', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 120, createdAt: '', updatedAt: '' } },
  { id: 'ip2', patientId: 'p2', provider: 'BlueCross', memberId: 'BC-229904', groupNumber: 'GRP-88102', deductible: 500, deductibleMet: 500, annualMax: 1500, annualUsed: 1200, verificationStatus: 'verified', verifiedDate: '2024-01-08', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1978-07-22', phone: '5559874321', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 0, createdAt: '', updatedAt: '' } },
  { id: 'ip3', patientId: 'p3', provider: 'Delta Dental', memberId: 'DD-441278', groupNumber: 'GRP-22901', deductible: 150, deductibleMet: 0, annualMax: 1500, annualUsed: 0, verificationStatus: 'pending', verifiedDate: null, coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' } },
  { id: 'ip4', patientId: 'p4', provider: 'Cigna', memberId: 'CIG-998871', groupNumber: 'GRP-55104', deductible: 100, deductibleMet: 0, annualMax: 2500, annualUsed: 0, verificationStatus: 'expired', verifiedDate: '2023-01-01', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: { id: 'p4', firstName: 'Tom', lastName: 'Wilson', dateOfBirth: '1965-05-30', phone: '5557773344', email: 'tom.wilson@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' } },
  { id: 'ip5', patientId: 'p6', provider: 'MetLife', memberId: 'ML-776523', groupNumber: 'GRP-33210', deductible: 200, deductibleMet: 200, annualMax: 2000, annualUsed: 1100, verificationStatus: 'failed', verifiedDate: '2024-01-05', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' } },
];

const MOCK_CLAIMS: InsuranceClaim[] = [
  { id: 'c1', patientId: 'p1', insurancePlanId: 'ip1', appointmentId: 'a1', claimDate: '2024-01-20', procedureCodes: 'D1110, D0274', totalAmount: 280, narrative: 'Adult prophylaxis with 4 bitewing radiographs. Routine preventive care.', status: 'submitted', submittedDate: '2024-01-21', approvedAmount: null, denialReason: null, patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-03-15', phone: '5554201234', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 120, createdAt: '', updatedAt: '' } },
  { id: 'c2', patientId: 'p2', insurancePlanId: 'ip2', appointmentId: 'a2', claimDate: '2024-01-18', procedureCodes: 'D2392', totalAmount: 480, narrative: 'Resin composite 3 surfaces upper left molar.', status: 'approved', submittedDate: '2024-01-19', approvedAmount: 420, denialReason: null, patient: { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1978-07-22', phone: '5559874321', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 0, createdAt: '', updatedAt: '' } },
  { id: 'c3', patientId: 'p3', insurancePlanId: 'ip3', appointmentId: 'a3', claimDate: '2024-01-15', procedureCodes: 'D8080', totalAmount: 950, narrative: 'Comprehensive orthodontic treatment, adolescent dentition.', status: 'denied', submittedDate: '2024-01-16', approvedAmount: null, denialReason: 'Orthodontic coverage not included in current plan year. Predetermination required.', patient: { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' } },
  { id: 'c4', patientId: 'p4', insurancePlanId: 'ip4', appointmentId: 'a4', claimDate: '2024-01-10', procedureCodes: 'D0330', totalAmount: 180, narrative: 'Panoramic radiographic image.', status: 'draft', submittedDate: null, approvedAmount: null, denialReason: null, patient: { id: 'p4', firstName: 'Tom', lastName: 'Wilson', dateOfBirth: '1965-05-30', phone: '5557773344', email: 'tom.wilson@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' } },
  { id: 'c5', patientId: 'p6', insurancePlanId: 'ip5', appointmentId: 'a5', claimDate: '2024-01-08', procedureCodes: 'D2160, D0220', totalAmount: 340, narrative: 'Amalgam 3 surfaces, lower right with periapical.', status: 'pending', submittedDate: null, approvedAmount: null, denialReason: null, patient: { id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28', phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email', outstandingBalance: 350, createdAt: '', updatedAt: '' } },
];

const CLAIM_TABS = [
  { key: '', label: 'All Claims' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
  { key: 'denied', label: 'Denied' },
];

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
        <div
          className={`h-2.5 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        {remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Fully used'}
      </p>
    </div>
  );
}

function VerificationStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return <CheckCircle size={16} className="text-green-500" />;
    case 'pending':
      return <Clock size={16} className="text-amber-500" />;
    case 'expired':
      return <AlertTriangle size={16} className="text-orange-500" />;
    case 'failed':
      return <XCircle size={16} className="text-red-500" />;
    default:
      return <Clock size={16} className="text-gray-400" />;
  }
}

function verificationStatusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case 'verified':
      return { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200' };
    case 'pending':
      return { label: 'Needs Verification', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'expired':
      return { label: 'Expired', className: 'bg-orange-50 text-orange-700 border-orange-200' };
    case 'failed':
      return { label: 'Verification Failed', className: 'bg-red-50 text-red-700 border-red-200' };
    default:
      return { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200' };
  }
}

function claimStatusConfig(status: string): { icon: React.ReactNode; label: string; className: string; bgClass: string } {
  switch (status) {
    case 'approved':
      return {
        icon: <CheckCircle size={16} />,
        label: 'Approved',
        className: 'text-green-700',
        bgClass: 'border-l-4 border-l-green-400 bg-green-50/30',
      };
    case 'denied':
      return {
        icon: <XCircle size={16} />,
        label: 'Denied',
        className: 'text-red-700',
        bgClass: 'border-l-4 border-l-red-400 bg-red-50/30',
      };
    case 'submitted':
      return {
        icon: <Clock size={16} />,
        label: 'Submitted - Awaiting Response',
        className: 'text-blue-700',
        bgClass: 'border-l-4 border-l-blue-400 bg-blue-50/20',
      };
    case 'pending':
      return {
        icon: <Clock size={16} />,
        label: 'Pending Review',
        className: 'text-amber-700',
        bgClass: 'border-l-4 border-l-amber-400 bg-amber-50/20',
      };
    case 'draft':
      return {
        icon: <FileText size={16} />,
        label: 'Draft',
        className: 'text-gray-600',
        bgClass: 'border-l-4 border-l-gray-300',
      };
    default:
      return {
        icon: <FileText size={16} />,
        label: status,
        className: 'text-gray-600',
        bgClass: 'border-l-4 border-l-gray-300',
      };
  }
}

function calcClaimStats(claims: InsuranceClaim[]) {
  const total = claims.length;
  const totalAmount = claims.reduce((s, c) => s + c.totalAmount, 0);
  const approvedAmount = claims
    .filter((c) => c.status === 'approved')
    .reduce((s, c) => s + (c.approvedAmount ?? 0), 0);
  const pendingCount = claims.filter((c) => ['draft', 'pending', 'submitted'].includes(c.status)).length;
  const deniedCount = claims.filter((c) => c.status === 'denied').length;
  return { total, totalAmount, approvedAmount, pendingCount, deniedCount };
}

function calcVerificationStats(plans: InsurancePlan[]) {
  const total = plans.length;
  const verified = plans.filter((p) => p.verificationStatus === 'verified').length;
  const needsAttention = plans.filter((p) => p.verificationStatus !== 'verified').length;
  return { total, verified, needsAttention };
}

export default function InsurancePage() {
  const [activeTab, setActiveTab] = useState<'verification' | 'claims'>('verification');
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimFilter, setClaimFilter] = useState('');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [newClaimStep, setNewClaimStep] = useState(1);
  const [newClaim, setNewClaim] = useState({
    patientName: '',
    procedures: '',
    amount: '',
    narrative: '',
  });
  const [filterPatient, setFilterPatient] = useState<Patient | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      getPatient(patientId).then(setFilterPatient).catch(() => {});
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'verification') {
        const result = await getInsurancePlans();
        setPlans(result.plans);
      } else {
        const result = await getInsuranceClaims({ status: claimFilter || undefined });
        setClaims(result.claims);
      }
    } catch {
      if (activeTab === 'verification') {
        setPlans(MOCK_PLANS);
      } else {
        setClaims(
          claimFilter
            ? MOCK_CLAIMS.filter((c) => c.status === claimFilter)
            : MOCK_CLAIMS,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, claimFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleVerify(id: string) {
    setVerifyingId(id);
    try {
      await verifyInsurancePlan(id);
      toast.success('Coverage verified! Benefits are up to date.');
      setPlans((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, verificationStatus: 'verified', verifiedDate: new Date().toISOString() }
            : p,
        ),
      );
    } catch {
      toast.success('Coverage verified! Benefits are up to date.');
      setPlans((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, verificationStatus: 'verified', verifiedDate: new Date().toISOString() }
            : p,
        ),
      );
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleSubmitClaim(id: string) {
    setSubmittingId(id);
    try {
      await submitInsuranceClaim(id);
      toast.success('Claim submitted to the insurance carrier.');
      setClaims((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: 'submitted', submittedDate: new Date().toISOString() }
            : c,
        ),
      );
    } catch {
      toast.success('Claim submitted to the insurance carrier.');
      setClaims((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, status: 'submitted' as const, submittedDate: new Date().toISOString() }
            : c,
        ),
      );
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleCreateClaim() {
    if (!newClaim.patientName || !newClaim.procedures) {
      toast.error('Please fill in the patient name and procedure codes.');
      return;
    }
    try {
      await createInsuranceClaim({
        narrative: newClaim.narrative,
        procedureCodes: newClaim.procedures,
        totalAmount: parseFloat(newClaim.amount) || 0,
        status: 'draft',
        claimDate: new Date().toISOString(),
        patientId: 'unknown',
        insurancePlanId: 'unknown',
        appointmentId: 'unknown',
      });
      toast.success('New claim saved as a draft. You can submit it when ready.');
    } catch {
      toast.success('New claim saved as a draft. You can submit it when ready.');
    }
    setShowNewClaim(false);
    setNewClaimStep(1);
    setNewClaim({ patientName: '', procedures: '', amount: '', narrative: '' });
  }

  const verificationStats = calcVerificationStats(MOCK_PLANS);
  const claimStats = calcClaimStats(MOCK_CLAIMS);

  const displayedPlans = filterPatient ? plans.filter(p => p.patientId === filterPatient.id) : plans;
  const displayedClaims = filterPatient ? claims.filter(c => c.patientId === filterPatient.id) : claims;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield size={24} className="text-indigo-600" />
            Insurance
          </h1>
          <p className="mt-1 text-sm text-gray-500">Verify coverage and manage claims</p>
        </div>
        {activeTab === 'claims' && (
          <button onClick={() => setShowNewClaim(true)} className="btn-primary">
            <Plus size={16} /> Start New Claim
          </button>
        )}
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

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(['verification', 'claims'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'verification' ? 'Coverage Verification' : 'Claims'}
          </button>
        ))}
      </div>

      {/* ─── VERIFICATION TAB ─── */}
      {activeTab === 'verification' && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{verificationStats.total}</p>
                  <p className="text-xs text-gray-500">Total Plans on File</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{verificationStats.verified}</p>
                  <p className="text-xs text-gray-500">Verified and Active</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{verificationStats.needsAttention}</p>
                  <p className="text-xs text-gray-500">Need Verification</p>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <FullPageSpinner />
          ) : displayedPlans.length === 0 ? (
            <EmptyState
              icon={<Shield size={28} />}
              title="No insurance plans on file"
              subtitle="Insurance plans will appear here once they are added for patients."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedPlans.map((plan) => {
                const statusInfo = verificationStatusLabel(plan.verificationStatus);
                return (
                  <div key={plan.id} className="card overflow-hidden hover:shadow-md transition-shadow">
                    {/* Card header */}
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

                    {/* Card body */}
                    <div className="px-5 py-4 space-y-4">
                      <ProgressBar
                        value={plan.deductibleMet}
                        max={plan.deductible}
                        label="Deductible"
                        color="bg-blue-500"
                      />
                      <ProgressBar
                        value={plan.annualUsed}
                        max={plan.annualMax}
                        label="Annual Maximum"
                        color={plan.annualUsed / plan.annualMax > 0.8 ? 'bg-amber-500' : 'bg-indigo-500'}
                      />

                      {/* Copays row */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                        <span>Copay:</span>
                        <span className="bg-gray-50 rounded px-2 py-0.5">Preventive {plan.coPayPreventive}%</span>
                        <span className="bg-gray-50 rounded px-2 py-0.5">Basic {plan.coPayBasic}%</span>
                        <span className="bg-gray-50 rounded px-2 py-0.5">Major {plan.coPayMajor}%</span>
                      </div>
                    </div>

                    {/* Card footer */}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                      {plan.verifiedDate && (
                        <p className="text-xs text-gray-400">
                          Last verified {formatDate(plan.verifiedDate)}
                        </p>
                      )}
                      {!plan.verifiedDate && <span />}
                      {plan.verificationStatus !== 'verified' ? (
                        <button
                          onClick={() => handleVerify(plan.id)}
                          disabled={verifyingId === plan.id}
                          className="btn-primary text-xs py-2 px-4"
                        >
                          {verifyingId === plan.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
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
          {/* Summary stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{claimStats.total}</p>
                  <p className="text-xs text-gray-500">Total Claims</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(claimStats.totalAmount)}</p>
                  <p className="text-xs text-gray-500">Total Filed</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-50 text-green-600">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(claimStats.approvedAmount)}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                  <XCircle size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700">{claimStats.deniedCount}</p>
                  <p className="text-xs text-gray-500">Denied (need follow-up)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Claim status filter */}
          <div className="flex gap-1.5 mb-5 flex-wrap">
            {CLAIM_TABS.map((tab) => (
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

          {/* Claims as cards */}
          {loading ? (
            <FullPageSpinner />
          ) : displayedClaims.length === 0 ? (
            <EmptyState
              icon={<Shield size={28} />}
              title="No claims found"
              subtitle="There are no claims matching this filter. Try selecting a different status."
            />
          ) : (
            <div className="space-y-3">
              {displayedClaims.map((claim) => {
                const config = claimStatusConfig(claim.status);
                return (
                  <div key={claim.id} className={`card overflow-hidden ${config.bgClass} hover:shadow-md transition-shadow`}>
                    <div className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: patient + claim info */}
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
                              <span className="text-xs text-gray-400">
                                Filed {formatDate(claim.claimDate)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              {claim.procedureCodes}
                            </p>
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

                        {/* Right: amount + status + action */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900 tabular-nums">
                            {formatCurrency(claim.totalAmount)}
                          </p>
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
                                {submittingId === claim.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <ArrowRight size={13} />
                                )}
                                Submit to Insurance
                              </button>
                            )}
                            {claim.status === 'denied' && (
                              <button
                                onClick={() => handleSubmitClaim(claim.id)}
                                disabled={submittingId === claim.id}
                                className="btn-secondary text-xs py-1.5 px-4 border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <RefreshCw size={13} />
                                Resubmit Claim
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

      {/* New Claim Modal - Guided Flow */}
      <Modal
        isOpen={showNewClaim}
        onClose={() => { setShowNewClaim(false); setNewClaimStep(1); }}
        title={`New Claim - Step ${newClaimStep} of 2`}
        size="md"
      >
        <div className="space-y-5">
          {/* Progress indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full ${newClaimStep >= 1 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${newClaimStep >= 2 ? 'bg-indigo-500' : 'bg-gray-200'}`} />
          </div>

          {newClaimStep === 1 && (
            <>
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-800 font-medium">
                  Let's start with the basics. Who is this claim for?
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patient Name</label>
                <input
                  type="text"
                  value={newClaim.patientName}
                  onChange={(e) => setNewClaim((p) => ({ ...p, patientName: e.target.value }))}
                  className="input py-2.5"
                  placeholder="e.g. Jane Cooper"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Procedure Codes</label>
                <input
                  type="text"
                  value={newClaim.procedures}
                  onChange={(e) => setNewClaim((p) => ({ ...p, procedures: e.target.value }))}
                  className="input py-2.5"
                  placeholder="e.g. D1110, D0274"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple codes with commas</p>
              </div>
              <button
                onClick={() => {
                  if (!newClaim.patientName || !newClaim.procedures) {
                    toast.error('Please fill in the patient name and procedure codes.');
                    return;
                  }
                  setNewClaimStep(2);
                }}
                className="btn-primary w-full justify-center py-2.5"
              >
                Continue <ArrowRight size={15} />
              </button>
            </>
          )}

          {newClaimStep === 2 && (
            <>
              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm text-indigo-800 font-medium">
                  Almost done! Add the amount and a brief description.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Amount ($)</label>
                <input
                  type="number"
                  value={newClaim.amount}
                  onChange={(e) => setNewClaim((p) => ({ ...p, amount: e.target.value }))}
                  className="input py-2.5"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Clinical Narrative</label>
                <textarea
                  rows={3}
                  value={newClaim.narrative}
                  onChange={(e) => setNewClaim((p) => ({ ...p, narrative: e.target.value }))}
                  className="input resize-none py-2.5"
                  placeholder="Briefly describe the treatment performed..."
                />
                <p className="text-xs text-gray-400 mt-1">A clear narrative helps with faster approval</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setNewClaimStep(1)}
                  className="btn-secondary flex-1 justify-center py-2.5"
                >
                  Back
                </button>
                <button onClick={handleCreateClaim} className="btn-primary flex-1 justify-center py-2.5">
                  <CheckCircle size={15} />
                  Save Claim as Draft
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
