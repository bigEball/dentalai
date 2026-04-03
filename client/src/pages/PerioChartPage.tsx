import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  User,
  FileText,
  Loader2,
  GitCompare,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getPerioExams, comparePerioExams, getPatients } from '@/lib/api';
import type { PerioExam, Patient } from '@/types';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

// Mock data for demo/fallback
const MOCK_PATIENTS: Patient[] = [
  { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' },
  { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
  { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
];

function buildMockPocketDepths(): Record<string, number[]> {
  const depths: Record<string, number[]> = {};
  for (let tooth = 1; tooth <= 32; tooth++) {
    // Generate 6 sites per tooth (MB, B, DB, ML, L, DL)
    depths[String(tooth)] = Array.from({ length: 6 }, () => {
      const r = Math.random();
      if (r < 0.55) return 2 + Math.round(Math.random());
      if (r < 0.8) return 4;
      if (r < 0.92) return 5;
      return 6 + Math.round(Math.random() * 2);
    });
  }
  return depths;
}

function buildMockPocketDepths2(): Record<string, number[]> {
  const depths: Record<string, number[]> = {};
  for (let tooth = 1; tooth <= 32; tooth++) {
    depths[String(tooth)] = Array.from({ length: 6 }, () => {
      const r = Math.random();
      if (r < 0.5) return 2 + Math.round(Math.random());
      if (r < 0.75) return 4;
      if (r < 0.88) return 5;
      return 6 + Math.round(Math.random() * 3);
    });
  }
  return depths;
}

const MOCK_EXAMS: PerioExam[] = [
  { id: 'pe1', patientId: 'p3', providerId: 'prov1', examDate: '2024-03-15', pocketDepths: JSON.stringify(buildMockPocketDepths()), notes: 'Generalized mild gingivitis. Localized 4-5mm pockets in posterior. Recommend improved home care and 3-month recall.', provider: { id: 'prov1', firstName: 'Dr. Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' } },
  { id: 'pe2', patientId: 'p3', providerId: 'prov1', examDate: '2023-09-20', pocketDepths: JSON.stringify(buildMockPocketDepths2()), notes: 'Moderate periodontal disease. Multiple sites with 5-6mm pockets. Bleeding on probing. SRP recommended.', provider: { id: 'prov1', firstName: 'Dr. Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' } },
  { id: 'pe3', patientId: 'p5', providerId: 'prov1', examDate: '2024-02-10', pocketDepths: JSON.stringify(buildMockPocketDepths()), notes: 'Healthy periodontium. All readings within normal limits. Continue current home care routine.', provider: { id: 'prov1', firstName: 'Dr. Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' } },
  { id: 'pe4', patientId: 'p8', providerId: 'prov1', examDate: '2024-01-05', pocketDepths: JSON.stringify(buildMockPocketDepths2()), notes: 'Advanced periodontitis. Multiple sites exceeding 6mm. Referral to periodontist recommended.', provider: { id: 'prov1', firstName: 'Dr. Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' } },
];

function parsePocketDepths(raw: string | Record<string, unknown>): Record<string, number[]> {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw as Record<string, number[]>;
}

function depthColor(depth: number): string {
  if (depth <= 3) return 'text-green-700 bg-green-50';
  if (depth <= 5) return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function depthBgBar(depth: number): string {
  if (depth <= 3) return 'bg-green-400';
  if (depth <= 5) return 'bg-amber-400';
  return 'bg-red-500';
}

function comparisonIndicator(current: number, previous: number): React.ReactNode {
  const diff = current - previous;
  if (diff < 0) {
    return <ArrowDown size={10} className="text-green-600" />;
  }
  if (diff > 0) {
    return <ArrowUp size={10} className="text-red-600" />;
  }
  return <Minus size={8} className="text-gray-300" />;
}

const UPPER_TEETH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_TEETH = Array.from({ length: 16 }, (_, i) => i + 17);

export default function PerioChartPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [exams, setExams] = useState<PerioExam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [comparing, setComparing] = useState(false);

  // Load patients
  useEffect(() => {
    async function load() {
      setLoadingPatients(true);
      try {
        const result = await getPatients();
        setPatients(result.patients);
      } catch {
        setPatients(MOCK_PATIENTS);
      } finally {
        setLoadingPatients(false);
      }
    }
    load();
  }, []);

  // Load exams when patient changes
  const loadExams = useCallback(async (patientId: string) => {
    if (!patientId) {
      setExams([]);
      setSelectedExamId('');
      return;
    }
    setLoadingExams(true);
    setComparing(false);
    try {
      const result = await getPerioExams({ patientId });
      setExams(result.exams);
      if (result.exams.length > 0) {
        setSelectedExamId(result.exams[0].id);
      }
    } catch {
      const filtered = MOCK_EXAMS.filter((e) => e.patientId === patientId);
      setExams(filtered);
      if (filtered.length > 0) {
        setSelectedExamId(filtered[0].id);
      } else {
        setSelectedExamId('');
      }
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadExams(selectedPatientId);
    } else {
      setExams([]);
      setSelectedExamId('');
      setComparing(false);
    }
  }, [selectedPatientId, loadExams]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // For comparison, find the second most recent exam
  const sortedExams = [...exams].sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());
  const canCompare = sortedExams.length >= 2;
  const currentExamForCompare = sortedExams[0];
  const previousExamForCompare = sortedExams[1];

  function handleCompare() {
    if (!canCompare) {
      toast.error('Need at least 2 exams to compare.');
      return;
    }
    setComparing(true);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Activity size={24} className="text-indigo-600" />
          Perio Charting
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View periodontal exam data and track pocket depth changes over time
        </p>
      </div>

      {/* Patient selector */}
      <div className="card p-5 mb-6">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Select Patient
        </label>
        {loadingPatients ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            Loading patients...
          </div>
        ) : (
          <div className="relative max-w-md">
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="input py-2.5 pr-10 appearance-none cursor-pointer"
            >
              <option value="">-- Choose a patient --</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} (DOB: {formatDate(p.dateOfBirth)})
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}
      </div>

      {!selectedPatientId && (
        <EmptyState
          icon={<Activity size={28} />}
          title="Select a patient"
          subtitle="Choose a patient above to view their periodontal exam history and charting data."
        />
      )}

      {selectedPatientId && loadingExams && <FullPageSpinner />}

      {selectedPatientId && !loadingExams && exams.length === 0 && (
        <EmptyState
          icon={<FileText size={28} />}
          title="No exams found"
          subtitle={`No periodontal exams on file for ${selectedPatient?.firstName} ${selectedPatient?.lastName}.`}
        />
      )}

      {selectedPatientId && !loadingExams && exams.length > 0 && !comparing && (
        <>
          {/* Exam history list */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Exam History</h2>
            {canCompare && (
              <button
                onClick={handleCompare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
              >
                <GitCompare size={13} />
                Compare Last 2 Exams
              </button>
            )}
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {sortedExams.map((exam) => (
              <button
                key={exam.id}
                onClick={() => setSelectedExamId(exam.id)}
                className={cn(
                  'px-4 py-2 text-xs font-medium rounded-lg border transition-all',
                  selectedExamId === exam.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                <Calendar size={12} className="inline mr-1.5" />
                {formatDate(exam.examDate)}
              </button>
            ))}
          </div>

          {/* Selected exam detail */}
          {selectedExam && (
            <ExamDetailView exam={selectedExam} />
          )}
        </>
      )}

      {/* Comparison view */}
      {selectedPatientId && !loadingExams && comparing && canCompare && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Exam Comparison</h2>
            <button
              onClick={() => setComparing(false)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all"
            >
              Back to Exams
            </button>
          </div>

          <ComparisonView
            current={currentExamForCompare}
            previous={previousExamForCompare}
          />
        </>
      )}
    </div>
  );
}

function ExamDetailView({ exam }: { exam: PerioExam }) {
  const depths = parsePocketDepths(exam.pocketDepths);

  return (
    <div className="space-y-6">
      {/* Exam info */}
      <div className="card p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <span className="text-sm text-gray-700 font-medium">{formatDate(exam.examDate)}</span>
          </div>
          {exam.provider && (
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">
                {exam.provider.firstName} {exam.provider.lastName}
              </span>
            </div>
          )}
        </div>
        {exam.notes && (
          <p className="text-sm text-gray-600 mt-3 bg-gray-50 px-4 py-3 rounded-lg">
            {exam.notes}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500 font-medium">Pocket Depth:</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" /> 1-3mm (healthy)
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 4-5mm (moderate)
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 6mm+ (severe)
        </span>
      </div>

      {/* Tooth chart: upper arch */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upper Arch (Teeth 1-16)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ToothRow teeth={UPPER_TEETH} depths={depths} />
        </div>
      </div>

      {/* Tooth chart: lower arch */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lower Arch (Teeth 17-32)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ToothRow teeth={LOWER_TEETH} depths={depths} />
        </div>
      </div>
    </div>
  );
}

function ToothRow({ teeth, depths }: { teeth: number[]; depths: Record<string, number[]> }) {
  return (
    <div className="flex gap-1 min-w-max">
      {teeth.map((tooth) => {
        const toothDepths = depths[String(tooth)] || [0, 0, 0, 0, 0, 0];
        const maxDepth = Math.max(...toothDepths);

        return (
          <div key={tooth} className="flex flex-col items-center w-[52px]">
            {/* Tooth number */}
            <div className={cn(
              'text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center mb-1.5',
              maxDepth >= 6 ? 'bg-red-100 text-red-700' :
              maxDepth >= 4 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700',
            )}>
              {tooth}
            </div>

            {/* Depth bar visualization */}
            <div className="w-full h-8 bg-gray-50 rounded relative overflow-hidden mb-1">
              <div
                className={cn('absolute bottom-0 left-0 right-0 rounded-t transition-all', depthBgBar(maxDepth))}
                style={{ height: `${Math.min(100, (maxDepth / 10) * 100)}%`, opacity: 0.5 }}
              />
            </div>

            {/* Individual site readings: top row (buccal) */}
            <div className="flex gap-px">
              {toothDepths.slice(0, 3).map((d, i) => (
                <span
                  key={`b-${i}`}
                  className={cn(
                    'text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center',
                    depthColor(d),
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
            {/* Bottom row (lingual) */}
            <div className="flex gap-px mt-px">
              {toothDepths.slice(3, 6).map((d, i) => (
                <span
                  key={`l-${i}`}
                  className={cn(
                    'text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center',
                    depthColor(d),
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComparisonView({ current, previous }: { current: PerioExam; previous: PerioExam }) {
  const currentDepths = parsePocketDepths(current.pocketDepths);
  const previousDepths = parsePocketDepths(previous.pocketDepths);

  // Compute summary
  let improved = 0;
  let worsened = 0;
  let unchanged = 0;
  for (let tooth = 1; tooth <= 32; tooth++) {
    const cd = currentDepths[String(tooth)] || [];
    const pd = previousDepths[String(tooth)] || [];
    for (let i = 0; i < Math.min(cd.length, pd.length); i++) {
      if (cd[i] < pd[i]) improved++;
      else if (cd[i] > pd[i]) worsened++;
      else unchanged++;
    }
  }
  const total = improved + worsened + unchanged;

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowDown size={16} className="text-green-600" />
              <span className="text-2xl font-bold text-green-700">{improved}</span>
            </div>
            <p className="text-xs text-gray-500">Sites Improved</p>
            <p className="text-[10px] text-gray-400">{total > 0 ? Math.round((improved / total) * 100) : 0}% of sites</p>
          </div>
        </div>
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-transparent pointer-events-none" />
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Minus size={16} className="text-gray-400" />
              <span className="text-2xl font-bold text-gray-700">{unchanged}</span>
            </div>
            <p className="text-xs text-gray-500">Unchanged</p>
            <p className="text-[10px] text-gray-400">{total > 0 ? Math.round((unchanged / total) * 100) : 0}% of sites</p>
          </div>
        </div>
        <div className="card p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/80 to-transparent pointer-events-none" />
          <div className="relative text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <ArrowUp size={16} className="text-red-600" />
              <span className="text-2xl font-bold text-red-700">{worsened}</span>
            </div>
            <p className="text-xs text-gray-500">Sites Worsened</p>
            <p className="text-[10px] text-gray-400">{total > 0 ? Math.round((worsened / total) * 100) : 0}% of sites</p>
          </div>
        </div>
      </div>

      {/* Date labels */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Comparing: <span className="font-semibold text-gray-700">{formatDate(previous.examDate)}</span></span>
        <span className="text-gray-300">vs</span>
        <span>Latest: <span className="font-semibold text-gray-700">{formatDate(current.examDate)}</span></span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-500 font-medium">Change:</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <ArrowDown size={10} className="text-green-600" /> Improved (depth decreased)
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <ArrowUp size={10} className="text-red-600" /> Worsened (depth increased)
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <Minus size={8} className="text-gray-300" /> No change
        </span>
      </div>

      {/* Upper arch comparison */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upper Arch Comparison (Teeth 1-16)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ComparisonToothRow
            teeth={UPPER_TEETH}
            currentDepths={currentDepths}
            previousDepths={previousDepths}
          />
        </div>
      </div>

      {/* Lower arch comparison */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lower Arch Comparison (Teeth 17-32)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ComparisonToothRow
            teeth={LOWER_TEETH}
            currentDepths={currentDepths}
            previousDepths={previousDepths}
          />
        </div>
      </div>
    </div>
  );
}

function ComparisonToothRow({
  teeth,
  currentDepths,
  previousDepths,
}: {
  teeth: number[];
  currentDepths: Record<string, number[]>;
  previousDepths: Record<string, number[]>;
}) {
  return (
    <div className="flex gap-1 min-w-max">
      {teeth.map((tooth) => {
        const cd = currentDepths[String(tooth)] || [0, 0, 0, 0, 0, 0];
        const pd = previousDepths[String(tooth)] || [0, 0, 0, 0, 0, 0];
        const maxCurrent = Math.max(...cd);
        const maxPrevious = Math.max(...pd);

        return (
          <div key={tooth} className="flex flex-col items-center w-[52px]">
            {/* Tooth number with overall change */}
            <div className={cn(
              'text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center mb-1',
              maxCurrent >= 6 ? 'bg-red-100 text-red-700' :
              maxCurrent >= 4 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700',
            )}>
              {tooth}
            </div>

            {/* Overall change indicator */}
            <div className="mb-1">
              {comparisonIndicator(maxCurrent, maxPrevious)}
            </div>

            {/* Current buccal readings */}
            <div className="flex gap-px">
              {cd.slice(0, 3).map((d, i) => (
                <div key={`b-${i}`} className="flex flex-col items-center">
                  <span className={cn(
                    'text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center',
                    depthColor(d),
                  )}>
                    {d}
                  </span>
                  <div className="h-2 flex items-center">
                    {comparisonIndicator(d, pd[i] ?? 0)}
                  </div>
                </div>
              ))}
            </div>

            {/* Current lingual readings */}
            <div className="flex gap-px mt-px">
              {cd.slice(3, 6).map((d, i) => (
                <div key={`l-${i}`} className="flex flex-col items-center">
                  <span className={cn(
                    'text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center',
                    depthColor(d),
                  )}>
                    {d}
                  </span>
                  <div className="h-2 flex items-center">
                    {comparisonIndicator(d, pd[i + 3] ?? 0)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
