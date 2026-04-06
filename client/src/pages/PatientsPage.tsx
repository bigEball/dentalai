import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  X,
  User,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  ChevronRight,
  Users,
  FileText,
  Shield,
  DollarSign,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getPatients } from '@/lib/api';
import type { Patient } from '@/types';
import { formatCurrency, formatDate, formatPhone, getInitials, daysOverdue } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-03-15',
    phone: '5554201234', email: 'jane.cooper@email.com', preferredContactMethod: 'email',
    lastCleaningDate: '2023-08-10', recallDueDate: '2024-02-10', insuranceProvider: 'Aetna',
    memberId: 'AET-884021', outstandingBalance: 120.00, providerId: 'dr1',
    createdAt: '2022-01-01T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
    provider: { id: 'dr1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DMD', specialty: 'General Dentistry' },
  },
  {
    id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1978-07-22',
    phone: '5559874321', email: 'r.chen@email.com', preferredContactMethod: 'text',
    lastCleaningDate: '2023-09-05', recallDueDate: '2024-03-05', insuranceProvider: 'BlueCross',
    memberId: 'BC-229904', outstandingBalance: 0, providerId: 'dr1',
    createdAt: '2021-06-15T00:00:00Z', updatedAt: '2024-01-10T00:00:00Z',
    provider: { id: 'dr1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DMD', specialty: 'General Dentistry' },
  },
  {
    id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08',
    phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone',
    lastCleaningDate: '2022-09-20', recallDueDate: '2023-03-20', insuranceProvider: 'Delta Dental',
    memberId: 'DD-441278', outstandingBalance: 680.50, providerId: 'dr2',
    createdAt: '2020-04-10T00:00:00Z', updatedAt: '2024-01-18T00:00:00Z',
    provider: { id: 'dr2', firstName: 'James', lastName: 'Patterson', title: 'DDS', specialty: 'Orthodontics' },
  },
  {
    id: 'p4', firstName: 'Tom', lastName: 'Wilson', dateOfBirth: '1965-05-30',
    phone: '5557773344', email: 'tom.wilson@email.com', preferredContactMethod: 'email',
    lastCleaningDate: '2023-11-15', recallDueDate: '2024-05-15', insuranceProvider: 'Cigna',
    memberId: 'CIG-998871', outstandingBalance: 0, providerId: 'dr1',
    createdAt: '2019-09-01T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z',
    provider: { id: 'dr1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DMD', specialty: 'General Dentistry' },
  },
  {
    id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12',
    phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text',
    lastCleaningDate: '2022-06-01', recallDueDate: '2022-12-01', insuranceProvider: null,
    memberId: null, outstandingBalance: 2840.00, providerId: 'dr2',
    createdAt: '2021-11-20T00:00:00Z', updatedAt: '2024-01-12T00:00:00Z',
    provider: { id: 'dr2', firstName: 'James', lastName: 'Patterson', title: 'DDS', specialty: 'Orthodontics' },
  },
  {
    id: 'p6', firstName: 'Emily', lastName: 'Johnson', dateOfBirth: '1994-02-28',
    phone: '5558884455', email: 'emily.j@email.com', preferredContactMethod: 'email',
    lastCleaningDate: '2023-10-01', recallDueDate: '2024-04-01', insuranceProvider: 'MetLife',
    memberId: 'ML-776523', outstandingBalance: 350.00, providerId: 'dr1',
    createdAt: '2023-03-01T00:00:00Z', updatedAt: '2024-01-08T00:00:00Z',
    provider: { id: 'dr1', firstName: 'Sarah', lastName: 'Mitchell', title: 'DMD', specialty: 'General Dentistry' },
  },
];

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function RecallBadge({ recallDueDate }: { recallDueDate?: string | null }) {
  if (!recallDueDate) return <span className="text-gray-400 text-xs italic">Not set</span>;
  const days = daysOverdue(recallDueDate);
  if (days <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
        {formatDate(recallDueDate)}
      </span>
    );
  }
  if (days > 180) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full">
        {days}d overdue
      </span>
    );
  }
  if (days > 60) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded-full">
        {days}d overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
      {days}d overdue
    </span>
  );
}

function BalanceBadge({ amount }: { amount: number }) {
  if (amount <= 0) {
    return (
      <span className="inline-flex items-center text-xs text-green-600 font-medium bg-green-50 px-2.5 py-0.5 rounded-full">
        Paid in full
      </span>
    );
  }
  if (amount >= 1000) {
    return (
      <span className="text-sm font-bold text-red-600">{formatCurrency(amount)}</span>
    );
  }
  if (amount >= 500) {
    return (
      <span className="text-sm font-semibold text-orange-600">{formatCurrency(amount)}</span>
    );
  }
  return (
    <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Patient | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPatients({ search });
      setPatients(result.patients);
    } catch {
      setPatients(
        MOCK_PATIENTS.filter((p) => {
          const q = search.toLowerCase();
          return (
            !q ||
            p.firstName.toLowerCase().includes(q) ||
            p.lastName.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q) ||
            p.phone.includes(q)
          );
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const totalWithBalance = patients.filter((p) => p.outstandingBalance > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users size={24} className="text-indigo-600" />
            Patients
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} total
            {totalWithBalance > 0 && (
              <span className="text-amber-600 ml-2 font-medium">
                ({totalWithBalance} with open balance)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search patients by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Patient list */}
      {loading ? (
        <FullPageSpinner />
      ) : patients.length === 0 ? (
        <EmptyState
          icon={<User size={28} />}
          title={search ? 'No patients match your search' : 'No patients yet'}
          subtitle={
            search
              ? `We couldn't find anyone matching "${search}". Try a different name, phone number, or email.`
              : 'Patients will appear here once they are added to the system.'
          }
        />
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelected(patient)}
              className="card hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div className={`h-12 w-12 rounded-full ${avatarColor(patient.id)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-sm font-bold">
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>

                {/* Name + contact */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <OpenDentalLink patientId={patient.id} />
                    {patient.provider && (
                      <span className="hidden sm:inline text-xs text-gray-400">
                        Dr. {patient.provider.lastName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone size={11} />
                      {formatPhone(patient.phone)}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <Mail size={11} />
                      {patient.email}
                    </span>
                  </div>
                </div>

                {/* Key info columns */}
                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                  {/* Insurance */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Insurance</p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">
                      {patient.insuranceProvider ?? (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="text-right min-w-[90px]">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Balance</p>
                    <div className="mt-0.5">
                      <BalanceBadge amount={patient.outstandingBalance} />
                    </div>
                  </div>

                  {/* Recall */}
                  <div className="text-right min-w-[100px]">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Recall</p>
                    <div className="mt-0.5">
                      <RecallBadge recallDueDate={patient.recallDueDate} />
                    </div>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Patient detail side panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
              <div className="px-6 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-full ${avatarColor(selected.id)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-lg font-bold">
                        {getInitials(selected.firstName, selected.lastName)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">
                          {selected.firstName} {selected.lastName}
                        </h2>
                        <OpenDentalLink patientId={selected.id} />
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        {selected.insuranceProvider ? (
                          <>
                            <CreditCard size={13} />
                            {selected.insuranceProvider}
                          </>
                        ) : (
                          <span className="italic text-gray-400">No insurance on file</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Outstanding Balance Alert */}
              {selected.outstandingBalance > 0 && (
                <div className={`rounded-xl p-4 flex items-center gap-3 ${
                  selected.outstandingBalance >= 1000
                    ? 'bg-red-50 border border-red-100'
                    : 'bg-amber-50 border border-amber-100'
                }`}>
                  <AlertCircle size={18} className={selected.outstandingBalance >= 1000 ? 'text-red-500' : 'text-amber-500'} />
                  <div>
                    <p className={`text-xs font-medium ${selected.outstandingBalance >= 1000 ? 'text-red-700' : 'text-amber-700'}`}>
                      Outstanding Balance
                    </p>
                    <p className={`text-xl font-bold ${selected.outstandingBalance >= 1000 ? 'text-red-800' : 'text-amber-800'}`}>
                      {formatCurrency(selected.outstandingBalance)}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Calendar size={15} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(selected.dateOfBirth)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Phone size={15} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{formatPhone(selected.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <Mail size={15} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="text-sm font-medium text-gray-900">{selected.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <CreditCard size={15} className="text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Member ID</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selected.memberId ?? <span className="text-gray-400 italic">None</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hygiene Info */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hygiene Status
                </h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Cleaning</span>
                  <span className="font-medium text-gray-900">{formatDate(selected.lastCleaningDate ?? '')}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-600">Recall Due</span>
                  {selected.recallDueDate ? (
                    <RecallBadge recallDueDate={selected.recallDueDate} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">Not set</span>
                  )}
                </div>
              </div>

              {/* Provider */}
              {selected.provider && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">Primary Provider</span>
                  <span className="font-medium text-gray-900">
                    {selected.provider.title} {selected.provider.firstName} {selected.provider.lastName}
                  </span>
                </div>
              )}

              {/* Preferred contact */}
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Preferred Contact</span>
                <span className="capitalize font-medium text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded-full text-xs">
                  {selected.preferredContactMethod}
                </span>
              </div>

              {/* Quick Links */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Links</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Link to={`/notes?patient=${selected.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                    <FileText size={14} />
                    Clinical Notes
                  </Link>
                  <Link to={`/insurance?patient=${selected.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                    <Shield size={14} />
                    Insurance
                  </Link>
                  <Link to={`/billing?patient=${selected.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                    <DollarSign size={14} />
                    Billing
                  </Link>
                  <Link to={`/recall?patient=${selected.id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                    <RefreshCw size={14} />
                    Recall
                  </Link>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    toast.success('Note creation coming soon');
                    setSelected(null);
                  }}
                  className="btn-primary flex-1 justify-center py-2.5"
                >
                  Create Clinical Note
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="btn-secondary flex-1 justify-center py-2.5"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
