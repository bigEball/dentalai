import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  Mic,
  MicOff,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkles,
  Save,
  SkipForward,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { getPerioExams, createPerioExam, getPatients } from '@/lib/api';
import type { PerioExam, Patient } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import OpenDentalLink from '@/components/ui/OpenDentalLink';

// ---------------------------------------------------------------------------
// Speech Recognition type declarations
// ---------------------------------------------------------------------------

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResultList;
  resultIndex: number;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface ISpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor;
    webkitSpeechRecognition: ISpeechRecognitionConstructor;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const UPPER_TEETH = Array.from({ length: 16 }, (_, i) => i + 1);
const LOWER_TEETH = Array.from({ length: 16 }, (_, i) => i + 17);
const ALL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH];

const SITE_LABELS_BUCCAL = ['MB', 'B', 'DB'] as const;
const SITE_LABELS_LINGUAL = ['ML', 'L', 'DL'] as const;
const ALL_SITE_LABELS = [...SITE_LABELS_BUCCAL, ...SITE_LABELS_LINGUAL];

const TOTAL_SITES = 32 * 6; // 192

const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  'twenty one': 21, 'twenty two': 22, 'twenty three': 23, 'twenty four': 24,
  'twenty five': 25, 'twenty six': 26, 'twenty seven': 27, 'twenty eight': 28,
  'twenty nine': 29, thirty: 30, 'thirty one': 31, 'thirty two': 32,
};

// ---------------------------------------------------------------------------
// Mock data for demo / fallback
// ---------------------------------------------------------------------------

const MOCK_PATIENTS: Patient[] = [
  { id: 'p3', firstName: 'Maria', lastName: 'Garcia', dateOfBirth: '1992-11-08', phone: '5551238765', email: 'maria.g@email.com', preferredContactMethod: 'phone', outstandingBalance: 680.50, createdAt: '', updatedAt: '' },
  { id: 'p5', firstName: 'Michael', lastName: 'Torres', dateOfBirth: '1989-09-12', phone: '5552229988', email: 'mtorres@email.com', preferredContactMethod: 'text', outstandingBalance: 2840, createdAt: '', updatedAt: '' },
  { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
];

function buildMockPocketDepths(): Record<string, number[]> {
  const depths: Record<string, number[]> = {};
  for (let tooth = 1; tooth <= 32; tooth++) {
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

// ---------------------------------------------------------------------------
// Charting data types
// ---------------------------------------------------------------------------

interface ToothData {
  depths: (number | null)[]; // 6 sites: MB, B, DB, ML, L, DL
  bop: boolean[];            // 6 booleans
  recession: (number | null)[]; // 6 values
  missing: boolean;
}

function createEmptyToothData(): ToothData {
  return {
    depths: [null, null, null, null, null, null],
    bop: [false, false, false, false, false, false],
    recession: [null, null, null, null, null, null],
    missing: false,
  };
}

function createEmptyChartData(): Record<string, ToothData> {
  const data: Record<string, ToothData> = {};
  for (let t = 1; t <= 32; t++) {
    data[String(t)] = createEmptyToothData();
  }
  return data;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

function parsePocketDepths(raw: string | Record<string, unknown>): Record<string, number[]> {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
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

function depthCellBorder(depth: number): string {
  if (depth <= 3) return 'border-green-300';
  if (depth <= 5) return 'border-amber-300';
  return 'border-red-400';
}

function comparisonIndicator(current: number, previous: number): React.ReactNode {
  const diff = current - previous;
  if (diff < 0) return <ArrowDown size={10} className="text-green-600" />;
  if (diff > 0) return <ArrowUp size={10} className="text-red-600" />;
  return <Minus size={8} className="text-gray-300" />;
}

function parseTranscriptNumbers(transcript: string): number[] {
  const results: number[] = [];
  const normalized = transcript.toLowerCase().trim();

  // First try splitting by spaces and matching word-numbers or digit-numbers
  const tokens = normalized.split(/[\s,]+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    // Two-word numbers like "twenty one"
    const twoWord = tokens[i] + ' ' + (tokens[i + 1] || '');
    if (WORD_TO_NUMBER[twoWord] !== undefined) {
      results.push(WORD_TO_NUMBER[twoWord]);
      i++; // skip next token
      continue;
    }
    // Single-word numbers
    if (WORD_TO_NUMBER[tokens[i]] !== undefined) {
      results.push(WORD_TO_NUMBER[tokens[i]]);
      continue;
    }
    // Digit strings
    const num = parseInt(tokens[i], 10);
    if (!isNaN(num) && num >= 0 && num <= 32) {
      results.push(num);
    }
  }
  return results;
}

function computeClassification(chartData: Record<string, ToothData>): string {
  let totalSites = 0;
  let totalDepth = 0;
  let sitesGte4 = 0;
  let sitesGte6 = 0;
  let bopCount = 0;

  for (let t = 1; t <= 32; t++) {
    const td = chartData[String(t)];
    if (td.missing) continue;
    for (let s = 0; s < 6; s++) {
      const d = td.depths[s];
      if (d === null) continue;
      totalSites++;
      totalDepth += d;
      if (d >= 4) sitesGte4++;
      if (d >= 6) sitesGte6++;
      if (td.bop[s]) bopCount++;
    }
  }

  if (totalSites === 0) return 'Incomplete';

  const avgDepth = totalDepth / totalSites;
  const pctGte6 = (sitesGte6 / totalSites) * 100;
  const pctGte4 = (sitesGte4 / totalSites) * 100;
  const pctBop = (bopCount / totalSites) * 100;

  if (pctGte6 >= 30 || avgDepth >= 6) return 'Stage III/IV: Severe Periodontitis';
  if (pctGte6 >= 10 || pctGte4 >= 30 || avgDepth >= 5) return 'Stage III: Moderate-Severe Periodontitis';
  if (pctGte4 >= 10 || avgDepth >= 4) return 'Stage II: Moderate Periodontitis';
  if (sitesGte4 > 0 || avgDepth >= 3.5) return 'Stage I: Mild Periodontitis';
  if (pctBop >= 10) return 'Gingivitis';
  return 'Healthy Periodontium';
}

function generateAISummary(
  chartData: Record<string, ToothData>,
  patientName: string,
): string {
  let totalSites = 0;
  let totalDepth = 0;
  let sitesGte4 = 0;
  let sitesGte6 = 0;
  let bopCount = 0;
  let missingCount = 0;
  const deepSites: string[] = [];

  for (let t = 1; t <= 32; t++) {
    const td = chartData[String(t)];
    if (td.missing) { missingCount++; continue; }
    for (let s = 0; s < 6; s++) {
      const d = td.depths[s];
      if (d === null) continue;
      totalSites++;
      totalDepth += d;
      if (d >= 4) sitesGte4++;
      if (d >= 6) {
        sitesGte6++;
        deepSites.push(`#${t} ${ALL_SITE_LABELS[s]} (${d}mm)`);
      }
      if (td.bop[s]) bopCount++;
    }
  }

  if (totalSites === 0) return 'No charting data recorded.';

  const avg = (totalDepth / totalSites).toFixed(1);
  const classification = computeClassification(chartData);

  let summary = `Periodontal exam for ${patientName}. `;
  summary += `${totalSites} sites charted across ${32 - missingCount} teeth`;
  if (missingCount > 0) summary += ` (${missingCount} teeth missing)`;
  summary += `. `;
  summary += `Mean pocket depth: ${avg}mm. `;
  summary += `Sites >= 4mm: ${sitesGte4} (${((sitesGte4 / totalSites) * 100).toFixed(1)}%). `;
  summary += `Sites >= 6mm: ${sitesGte6} (${((sitesGte6 / totalSites) * 100).toFixed(1)}%). `;
  summary += `Bleeding on probing: ${bopCount} sites (${((bopCount / totalSites) * 100).toFixed(1)}%). `;
  summary += `\n\nClassification: ${classification}. `;

  if (deepSites.length > 0) {
    summary += `\n\nDeep sites (>= 6mm): ${deepSites.slice(0, 20).join(', ')}`;
    if (deepSites.length > 20) summary += ` and ${deepSites.length - 20} more`;
    summary += '. ';
  }

  if (classification.includes('Severe') || classification.includes('III')) {
    summary += '\n\nRecommendation: Scaling and root planing indicated. Consider referral to periodontist for comprehensive evaluation.';
  } else if (classification.includes('Moderate') || classification.includes('II')) {
    summary += '\n\nRecommendation: Localized scaling and root planing. 3-month recare interval recommended.';
  } else if (classification.includes('Mild') || classification.includes('I')) {
    summary += '\n\nRecommendation: Focused oral hygiene instruction. 4-month recare interval recommended.';
  } else if (classification === 'Gingivitis') {
    summary += '\n\nRecommendation: Reinforce home care and flossing technique. Standard 6-month recall.';
  } else {
    summary += '\n\nRecommendation: Continue current maintenance. Standard 6-month recall.';
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function PerioChartPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [exams, setExams] = useState<PerioExam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [comparing, setComparing] = useState(false);

  // New exam mode
  const [newExamMode, setNewExamMode] = useState(false);

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

  function handleStartNewExam() {
    if (!selectedPatientId) {
      toast.error('Select a patient first.');
      return;
    }
    setNewExamMode(true);
    setComparing(false);
  }

  async function handleSaveNewExam(chartData: Record<string, ToothData>, notes: string) {
    // Build pocket depths in legacy format: Record<string, number[]>
    const pocketDepths: Record<string, number[]> = {};
    const bopData: Record<string, boolean[]> = {};
    const recessionData: Record<string, (number | null)[]> = {};
    const missingTeeth: number[] = [];

    for (let t = 1; t <= 32; t++) {
      const td = chartData[String(t)];
      if (td.missing) {
        missingTeeth.push(t);
        continue;
      }
      pocketDepths[String(t)] = td.depths.map((d) => d ?? 0);
      bopData[String(t)] = td.bop;
      recessionData[String(t)] = td.recession;
    }

    const payload: Partial<PerioExam> = {
      patientId: selectedPatientId,
      providerId: 'prov1',
      examDate: new Date().toISOString().split('T')[0],
      pocketDepths: JSON.stringify(pocketDepths),
      bleeding: JSON.stringify(bopData),
      recession: JSON.stringify(recessionData),
      notes: notes || undefined,
    };

    try {
      await createPerioExam(payload);
      toast.success(`Perio exam saved for ${selectedPatient?.firstName} ${selectedPatient?.lastName}`);
      setNewExamMode(false);
      loadExams(selectedPatientId);
    } catch {
      // Save locally as fallback mock
      const newId = 'pe_local_' + Date.now();
      const newExam: PerioExam = {
        id: newId,
        patientId: selectedPatientId,
        providerId: 'prov1',
        examDate: new Date().toISOString().split('T')[0],
        pocketDepths: JSON.stringify(pocketDepths),
        bleeding: JSON.stringify(bopData),
        recession: JSON.stringify(recessionData),
        notes: notes || undefined,
        provider: { id: 'prov1', firstName: 'Dr. Sarah', lastName: 'Mitchell', title: 'DDS', specialty: 'General' },
      };
      setExams((prev) => [newExam, ...prev]);
      setSelectedExamId(newId);
      setNewExamMode(false);
      toast.success(`Perio exam saved locally for ${selectedPatient?.firstName} ${selectedPatient?.lastName}`);
    }
  }

  // ── New Exam Mode ─────────────────────────────────────────────────────────
  if (newExamMode && selectedPatient) {
    return (
      <NewExamView
        patient={selectedPatient}
        onSave={handleSaveNewExam}
        onCancel={() => setNewExamMode(false)}
      />
    );
  }

  // ── Standard View / Comparison Mode ───────────────────────────────────────
  const perioStats = {
    patients: MOCK_PATIENTS.length,
    exams: MOCK_EXAMS.length,
    withHistory: new Set(MOCK_EXAMS.map((e) => e.patientId)).size,
  };

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

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Select a patient to view their periodontal exam history</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Start a new exam — enter pocket depths using voice or by clicking the chart</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">Color-coded depths highlight areas of concern (red = 6mm+)</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Compare current vs. previous exams to track improvement or regression</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <User size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{perioStats.patients}</p>
              <p className="text-xs text-gray-500">Patients</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{perioStats.exams}</p>
              <p className="text-xs text-gray-500">Total Exams</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <GitCompare size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{perioStats.withHistory}</p>
              <p className="text-xs text-gray-500">With Exam History</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{selectedExam ? exams.length : '—'}</p>
              <p className="text-xs text-gray-500">{selectedExam ? 'Exams for Patient' : 'Select Patient'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patient selector */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[250px] max-w-md">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Select Patient
            </label>
            {loadingPatients ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 size={14} className="animate-spin" />
                Loading patients...
              </div>
            ) : (
              <div className="relative">
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
            {selectedPatientId && <OpenDentalLink patientId={selectedPatientId} />}
          </div>

          {selectedPatientId && (
            <button
              onClick={handleStartNewExam}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all mt-4 sm:mt-0"
            >
              <Plus size={16} />
              Start New Exam
            </button>
          )}
        </div>
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
          subtitle={`No periodontal exams on file for ${selectedPatient?.firstName} ${selectedPatient?.lastName}. Start a new exam to begin charting.`}
          action={
            <button
              onClick={handleStartNewExam}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
            >
              <Plus size={14} />
              Start New Exam
            </button>
          }
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

          {selectedExam && <ExamDetailView exam={selectedExam} />}
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
          <ComparisonView current={currentExamForCompare} previous={previousExamForCompare} />
        </>
      )}
    </div>
  );
}

// ===========================================================================
// ExamDetailView — read-only view of a saved exam
// ===========================================================================

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
          <p className="text-sm text-gray-600 mt-3 bg-gray-50 px-4 py-3 rounded-lg whitespace-pre-wrap">
            {exam.notes}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
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

      {/* Upper arch */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upper Arch (Teeth 1-16)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ToothRow teeth={UPPER_TEETH} depths={depths} />
        </div>
      </div>

      {/* Lower arch */}
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
            <div className={cn(
              'text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center mb-1.5',
              maxDepth >= 6 ? 'bg-red-100 text-red-700' :
              maxDepth >= 4 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700',
            )}>
              {tooth}
            </div>
            <div className="w-full h-8 bg-gray-50 rounded relative overflow-hidden mb-1">
              <div
                className={cn('absolute bottom-0 left-0 right-0 rounded-t transition-all', depthBgBar(maxDepth))}
                style={{ height: `${Math.min(100, (maxDepth / 10) * 100)}%`, opacity: 0.5 }}
              />
            </div>
            <div className="flex gap-px">
              {toothDepths.slice(0, 3).map((d, i) => (
                <span key={`b-${i}`} className={cn('text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center', depthColor(d))}>
                  {d}
                </span>
              ))}
            </div>
            <div className="flex gap-px mt-px">
              {toothDepths.slice(3, 6).map((d, i) => (
                <span key={`l-${i}`} className={cn('text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center', depthColor(d))}>
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

// ===========================================================================
// ComparisonView — compare two exams side by side
// ===========================================================================

function ComparisonView({ current, previous }: { current: PerioExam; previous: PerioExam }) {
  const currentDepths = parsePocketDepths(current.pocketDepths);
  const previousDepths = parsePocketDepths(previous.pocketDepths);

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

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Comparing: <span className="font-semibold text-gray-700">{formatDate(previous.examDate)}</span></span>
        <span className="text-gray-300">vs</span>
        <span>Latest: <span className="font-semibold text-gray-700">{formatDate(current.examDate)}</span></span>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
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

      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upper Arch Comparison (Teeth 1-16)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ComparisonToothRow teeth={UPPER_TEETH} currentDepths={currentDepths} previousDepths={previousDepths} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lower Arch Comparison (Teeth 17-32)</h3>
        </div>
        <div className="px-5 py-4 overflow-x-auto">
          <ComparisonToothRow teeth={LOWER_TEETH} currentDepths={currentDepths} previousDepths={previousDepths} />
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
            <div className={cn(
              'text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center mb-1',
              maxCurrent >= 6 ? 'bg-red-100 text-red-700' :
              maxCurrent >= 4 ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700',
            )}>
              {tooth}
            </div>
            <div className="mb-1">{comparisonIndicator(maxCurrent, maxPrevious)}</div>
            <div className="flex gap-px">
              {cd.slice(0, 3).map((d, i) => (
                <div key={`b-${i}`} className="flex flex-col items-center">
                  <span className={cn('text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center', depthColor(d))}>
                    {d}
                  </span>
                  <div className="h-2 flex items-center">{comparisonIndicator(d, pd[i] ?? 0)}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-px mt-px">
              {cd.slice(3, 6).map((d, i) => (
                <div key={`l-${i}`} className="flex flex-col items-center">
                  <span className={cn('text-[9px] font-bold w-4 h-4 rounded flex items-center justify-center', depthColor(d))}>
                    {d}
                  </span>
                  <div className="h-2 flex items-center">{comparisonIndicator(d, pd[i + 3] ?? 0)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================================
// NewExamView — the full charting experience with voice input
// ===========================================================================

function NewExamView({
  patient,
  onSave,
  onCancel,
}: {
  patient: Patient;
  onSave: (chartData: Record<string, ToothData>, notes: string) => void;
  onCancel: () => void;
}) {
  const [chartData, setChartData] = useState<Record<string, ToothData>>(createEmptyChartData);
  const [activeTooth, setActiveTooth] = useState<number>(1);
  const [activeSite, setActiveSite] = useState<number>(0); // 0..5 index into sites
  const [voiceActive, setVoiceActive] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [flashSite, setFlashSite] = useState<string | null>(null); // "tooth-site" key
  const [editingCell, setEditingCell] = useState<{ tooth: number; site: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const voiceActiveRef = useRef(false);

  // Keep ref in sync so the speech callback has the latest value
  useEffect(() => {
    voiceActiveRef.current = voiceActive;
  }, [voiceActive]);

  // ── Computed stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    let completed = 0;
    let totalDepth = 0;
    let sitesGte4 = 0;
    let sitesGte6 = 0;
    let bopCount = 0;
    let missingTeeth = 0;

    for (let t = 1; t <= 32; t++) {
      const td = chartData[String(t)];
      if (td.missing) { missingTeeth++; continue; }
      for (let s = 0; s < 6; s++) {
        if (td.depths[s] !== null) {
          completed++;
          totalDepth += td.depths[s]!;
          if (td.depths[s]! >= 4) sitesGte4++;
          if (td.depths[s]! >= 6) sitesGte6++;
        }
        if (td.bop[s]) bopCount++;
      }
    }

    const activeSiteCount = (32 - missingTeeth) * 6;
    const avgDepth = completed > 0 ? totalDepth / completed : 0;

    return {
      completed,
      activeSiteCount,
      avgDepth,
      sitesGte4,
      sitesGte6,
      bopCount,
      missingTeeth,
      pctGte4: completed > 0 ? ((sitesGte4 / completed) * 100) : 0,
      pctGte6: completed > 0 ? ((sitesGte6 / completed) * 100) : 0,
      pctBop: completed > 0 ? ((bopCount / completed) * 100) : 0,
    };
  }, [chartData]);

  const classification = useMemo(() => computeClassification(chartData), [chartData]);

  // ── Chart data mutation helpers ───────────────────────────────────────────

  const updateDepth = useCallback((tooth: number, site: number, value: number) => {
    setChartData((prev) => {
      const td = prev[String(tooth)];
      const newDepths = [...td.depths];
      newDepths[site] = value;
      return { ...prev, [String(tooth)]: { ...td, depths: newDepths } };
    });
    // Flash effect
    setFlashSite(`${tooth}-${site}`);
    setTimeout(() => setFlashSite(null), 400);
  }, []);

  const toggleBop = useCallback((tooth: number, site: number) => {
    setChartData((prev) => {
      const td = prev[String(tooth)];
      const newBop = [...td.bop];
      newBop[site] = !newBop[site];
      return { ...prev, [String(tooth)]: { ...td, bop: newBop } };
    });
  }, []);

  const setRecession = useCallback((tooth: number, site: number, value: number) => {
    setChartData((prev) => {
      const td = prev[String(tooth)];
      const newRec = [...td.recession];
      newRec[site] = value;
      return { ...prev, [String(tooth)]: { ...td, recession: newRec } };
    });
  }, []);

  const toggleMissing = useCallback((tooth: number) => {
    setChartData((prev) => {
      const td = prev[String(tooth)];
      return { ...prev, [String(tooth)]: { ...td, missing: !td.missing } };
    });
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const getNextTooth = useCallback((current: number): number => {
    const idx = ALL_TEETH.indexOf(current);
    for (let i = idx + 1; i < ALL_TEETH.length; i++) {
      if (!chartData[String(ALL_TEETH[i])].missing) return ALL_TEETH[i];
    }
    return current; // no more teeth
  }, [chartData]);

  const getPrevTooth = useCallback((current: number): number => {
    const idx = ALL_TEETH.indexOf(current);
    for (let i = idx - 1; i >= 0; i--) {
      if (!chartData[String(ALL_TEETH[i])].missing) return ALL_TEETH[i];
    }
    return current;
  }, [chartData]);

  const advanceToNextTooth = useCallback(() => {
    const next = getNextTooth(activeTooth);
    setActiveTooth(next);
    setActiveSite(0);
  }, [activeTooth, getNextTooth]);

  // ── Voice input ───────────────────────────────────────────────────────────

  const processVoiceInput = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    setLastTranscript(lower);

    // Command: stop / done
    if (/\b(stop|done|finish)\b/.test(lower)) {
      setVoiceActive(false);
      return;
    }

    // Command: missing
    if (/\bmissing\b/.test(lower)) {
      toggleMissing(activeTooth);
      const next = getNextTooth(activeTooth);
      setActiveTooth(next);
      setActiveSite(0);
      return;
    }

    // Command: skip
    if (/\bskip\b/.test(lower)) {
      const next = getNextTooth(activeTooth);
      setActiveTooth(next);
      setActiveSite(0);
      return;
    }

    // Command: go back / previous
    if (/\b(go back|previous|back)\b/.test(lower)) {
      const prev = getPrevTooth(activeTooth);
      setActiveTooth(prev);
      setActiveSite(0);
      return;
    }

    // Command: bleeding / BOP
    if (/\b(bleeding|bop|bleed)\b/.test(lower)) {
      toggleBop(activeTooth, activeSite);
      return;
    }

    // Command: recession [number]
    const recMatch = lower.match(/\brecession\s+(\w+)/);
    if (recMatch) {
      const nums = parseTranscriptNumbers(recMatch[1]);
      if (nums.length > 0 && nums[0] >= 0 && nums[0] <= 15) {
        setRecession(activeTooth, activeSite, nums[0]);
      }
      return;
    }

    // Command: tooth [number]
    const toothMatch = lower.match(/\btooth\s+(.+)/);
    if (toothMatch) {
      const nums = parseTranscriptNumbers(toothMatch[1]);
      if (nums.length > 0 && nums[0] >= 1 && nums[0] <= 32) {
        setActiveTooth(nums[0]);
        setActiveSite(0);
      }
      return;
    }

    // Numbers — fill in sites sequentially
    const numbers = parseTranscriptNumbers(lower);
    if (numbers.length > 0) {
      // Filter to valid depth range (0-15 for depths)
      const validNums = numbers.filter((n) => n >= 0 && n <= 15);

      let currentSiteIdx = activeSite;
      let currentTooth = activeTooth;

      for (const num of validNums) {
        if (currentSiteIdx >= 6) {
          // Move to next tooth
          currentTooth = getNextTooth(currentTooth);
          currentSiteIdx = 0;
          if (currentTooth === activeTooth && validNums.length > 6) break; // wrapped around
        }
        updateDepth(currentTooth, currentSiteIdx, num);
        currentSiteIdx++;
      }

      // If we filled all 6 sites, advance to next tooth
      if (currentSiteIdx >= 6) {
        const nextTooth = getNextTooth(currentTooth);
        setActiveTooth(nextTooth);
        setActiveSite(0);
      } else {
        setActiveTooth(currentTooth);
        setActiveSite(currentSiteIdx);
      }
    }
  }, [activeTooth, activeSite, getNextTooth, getPrevTooth, toggleMissing, toggleBop, setRecession, updateDepth]);

  const startVoice = useCallback(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      toast.error('Speech recognition not supported in this browser. Use Chrome for best results.');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript;
        processVoiceInput(transcript);
      }
    };

    recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please allow microphone permissions.');
        setVoiceActive(false);
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Restart if still active
      if (voiceActiveRef.current) {
        try { recognition.start(); } catch { /* already started */ }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setVoiceActive(true);
      toast.success('Voice charting started. Speak pocket depths.');
    } catch {
      toast.error('Failed to start speech recognition.');
    }
  }, [processVoiceInput]);

  const stopVoice = useCallback(() => {
    setVoiceActive(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* noop */ }
      }
    };
  }, []);

  // Update processVoiceInput when dependencies change — re-bind the recognition handler
  useEffect(() => {
    if (recognitionRef.current && voiceActive) {
      recognitionRef.current.onresult = (event: ISpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
          processVoiceInput(result[0].transcript);
        }
      };
    }
  }, [processVoiceInput, voiceActive]);

  // ── Manual cell editing ───────────────────────────────────────────────────

  function handleCellClick(tooth: number, site: number) {
    const td = chartData[String(tooth)];
    if (td.missing) return;
    setActiveTooth(tooth);
    setActiveSite(site);
    setEditingCell({ tooth, site });
    setEditValue(td.depths[site] !== null ? String(td.depths[site]) : '');
    // Focus will happen after render via useEffect
  }

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  function handleEditSubmit() {
    if (!editingCell) return;
    const num = parseInt(editValue, 10);
    if (!isNaN(num) && num >= 0 && num <= 15) {
      updateDepth(editingCell.tooth, editingCell.site, num);
    }
    setEditingCell(null);
    setEditValue('');
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleEditSubmit();
      // Advance to next site
      if (editingCell) {
        let nextSite = editingCell.site + 1;
        let nextTooth = editingCell.tooth;
        if (nextSite >= 6) {
          nextSite = 0;
          nextTooth = getNextTooth(editingCell.tooth);
        }
        setActiveTooth(nextTooth);
        setActiveSite(nextSite);
        handleCellClick(nextTooth, nextSite);
      }
    }
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  const toothIndex = ALL_TEETH.indexOf(activeTooth) + 1;
  const progressPct = stats.activeSiteCount > 0 ? ((stats.completed / stats.activeSiteCount) * 100) : 0;

  // ── Finish / summary ──────────────────────────────────────────────────────

  function handleFinish() {
    stopVoice();
    setShowSummary(true);
  }

  function handleGenerateAISummary() {
    const summary = generateAISummary(chartData, `${patient.firstName} ${patient.lastName}`);
    setNotes(summary);
    toast.success('AI summary generated.');
  }

  // ── Summary overlay ───────────────────────────────────────────────────────

  if (showSummary) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Check size={24} className="text-green-600" />
            Exam Summary
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and save the periodontal exam for {patient.firstName} {patient.lastName}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <StatBox label="Sites Charted" value={`${stats.completed} / ${stats.activeSiteCount}`} />
          <StatBox label="Avg Pocket Depth" value={`${stats.avgDepth.toFixed(1)}mm`} />
          <StatBox label="Sites >= 4mm" value={`${stats.sitesGte4} (${stats.pctGte4.toFixed(0)}%)`} color={stats.sitesGte4 > 0 ? 'amber' : undefined} />
          <StatBox label="Sites >= 6mm" value={`${stats.sitesGte6} (${stats.pctGte6.toFixed(0)}%)`} color={stats.sitesGte6 > 0 ? 'red' : undefined} />
          <StatBox label="BOP Sites" value={`${stats.bopCount} (${stats.pctBop.toFixed(0)}%)`} color={stats.bopCount > 0 ? 'red' : undefined} />
          <StatBox label="Missing Teeth" value={String(stats.missingTeeth)} />
        </div>

        {/* Classification */}
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={16} className="text-indigo-600" />
            <span className="text-sm font-semibold text-gray-700">AAP Classification</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{classification}</p>
        </div>

        {/* Notes */}
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-700">Clinical Notes</label>
            <button
              onClick={handleGenerateAISummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
            >
              <Sparkles size={13} />
              Generate AI Summary
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="input w-full resize-y text-sm"
            placeholder="Add clinical notes or generate an AI summary..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSummary(false)}
            className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft size={14} className="inline mr-1" />
            Back to Chart
          </button>
          <button
            onClick={() => onSave(chartData, notes)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all"
          >
            <Save size={16} />
            Save Exam
          </button>
        </div>
      </div>
    );
  }

  // ── Main charting UI ──────────────────────────────────────────────────────

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity size={20} className="text-indigo-600" />
            New Perio Exam
          </h1>
          <p className="text-sm text-gray-500">
            {patient.firstName} {patient.lastName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
          >
            <X size={14} className="inline mr-1" />
            Cancel
          </button>
          <button
            onClick={handleFinish}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all"
          >
            <Check size={14} className="inline mr-1" />
            Finish
          </button>
        </div>
      </div>

      {/* Voice control bar */}
      <div className={cn(
        'card p-4 mb-5 flex items-center gap-4 flex-wrap transition-all',
        voiceActive && 'ring-2 ring-indigo-400 bg-indigo-50/40',
      )}>
        <button
          onClick={voiceActive ? stopVoice : startVoice}
          className={cn(
            'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-sm transition-all',
            voiceActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700',
          )}
        >
          {voiceActive ? (
            <>
              <MicOff size={18} />
              Stop Voice
            </>
          ) : (
            <>
              <Mic size={18} />
              Start Voice Charting
            </>
          )}
        </button>

        {voiceActive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-sm font-medium text-red-600">Listening...</span>
          </div>
        )}

        {lastTranscript && (
          <div className="text-xs text-gray-500 bg-white/80 px-3 py-1.5 rounded-lg border border-gray-100">
            <Volume2 size={12} className="inline mr-1 text-gray-400" />
            &ldquo;{lastTranscript}&rdquo;
          </div>
        )}

        {/* Voice commands hint */}
        {!voiceActive && (
          <p className="text-xs text-gray-400 flex-1">
            Say numbers to fill sites. Commands: &ldquo;tooth 14&rdquo;, &ldquo;bleeding&rdquo;, &ldquo;missing&rdquo;, &ldquo;skip&rdquo;, &ldquo;go back&rdquo;, &ldquo;recession 2&rdquo;, &ldquo;stop&rdquo;
          </p>
        )}
      </div>

      {/* Current tooth indicator + progress */}
      <div className="card p-4 mb-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setActiveTooth(getPrevTooth(activeTooth)); setActiveSite(0); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <div className="text-3xl font-black text-indigo-700">#{activeTooth}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {chartData[String(activeTooth)].missing ? 'MISSING' : ALL_SITE_LABELS[activeSite]}
              </div>
            </div>
            <button
              onClick={() => { setActiveTooth(getNextTooth(activeTooth)); setActiveSite(0); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleMissing(activeTooth)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                chartData[String(activeTooth)].missing
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50',
              )}
            >
              {chartData[String(activeTooth)].missing ? 'Unmark Missing' : 'Mark Missing'}
            </button>
            <button
              onClick={() => { advanceToNextTooth(); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all"
            >
              <SkipForward size={12} />
              Next Tooth
            </button>
          </div>
        </div>

        {/* Active tooth site detail */}
        {!chartData[String(activeTooth)].missing && (
          <div className="flex items-center gap-2 flex-wrap">
            {ALL_SITE_LABELS.map((label, idx) => {
              const depth = chartData[String(activeTooth)].depths[idx];
              const bop = chartData[String(activeTooth)].bop[idx];
              const isActive = activeSite === idx;
              const isFlashing = flashSite === `${activeTooth}-${idx}`;

              return (
                <button
                  key={label}
                  onClick={() => { setActiveSite(idx); handleCellClick(activeTooth, idx); }}
                  className={cn(
                    'relative flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[56px]',
                    isActive ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300',
                    isFlashing && 'animate-pulse border-green-400 bg-green-50',
                  )}
                >
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">{label}</span>
                  {editingCell && editingCell.tooth === activeTooth && editingCell.site === idx ? (
                    <input
                      ref={editInputRef}
                      type="number"
                      min={0}
                      max={15}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={handleEditSubmit}
                      className="w-8 h-7 text-center text-lg font-bold border-0 bg-transparent outline-none focus:ring-0 p-0"
                    />
                  ) : (
                    <span className={cn(
                      'text-lg font-bold',
                      depth !== null
                        ? (depth <= 3 ? 'text-green-700' : depth <= 5 ? 'text-amber-700' : 'text-red-700')
                        : 'text-gray-300',
                    )}>
                      {depth !== null ? depth : '-'}
                    </span>
                  )}
                  {bop && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Tooth {toothIndex} of 32</span>
            <span>{stats.completed} / {stats.activeSiteCount} sites ({progressPct.toFixed(0)}%)</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Depth:</span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" /> 1-3mm
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 4-5mm
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 6+mm
        </span>
        <span className="inline-flex items-center gap-1 text-xs ml-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> BOP
        </span>
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" /> Missing
        </span>
      </div>

      {/* Interactive chart grid: Upper arch */}
      <div className="card overflow-hidden mb-4">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upper Arch (Teeth 1-16)</h3>
        </div>
        <div className="px-4 py-3 overflow-x-auto">
          <InteractiveToothRow
            teeth={UPPER_TEETH}
            chartData={chartData}
            activeTooth={activeTooth}
            activeSite={activeSite}
            flashSite={flashSite}
            onCellClick={handleCellClick}
            onToothClick={(t) => { setActiveTooth(t); setActiveSite(0); }}
            onToggleBop={toggleBop}
          />
        </div>
      </div>

      {/* Interactive chart grid: Lower arch */}
      <div className="card overflow-hidden mb-5">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lower Arch (Teeth 17-32)</h3>
        </div>
        <div className="px-4 py-3 overflow-x-auto">
          <InteractiveToothRow
            teeth={LOWER_TEETH}
            chartData={chartData}
            activeTooth={activeTooth}
            activeSite={activeSite}
            flashSite={flashSite}
            onCellClick={handleCellClick}
            onToothClick={(t) => { setActiveTooth(t); setActiveSite(0); }}
            onToggleBop={toggleBop}
          />
        </div>
      </div>

      {/* Live stats panel */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <BarChart3 size={15} className="text-indigo-600" />
          Live Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat label="Completed" value={`${stats.completed}/${stats.activeSiteCount}`} />
          <MiniStat label="Avg Depth" value={`${stats.avgDepth.toFixed(1)}mm`} />
          <MiniStat label=">= 4mm" value={`${stats.sitesGte4} (${stats.pctGte4.toFixed(0)}%)`} warn={stats.sitesGte4 > 0} />
          <MiniStat label=">= 6mm" value={`${stats.sitesGte6} (${stats.pctGte6.toFixed(0)}%)`} alert={stats.sitesGte6 > 0} />
          <MiniStat label="BOP" value={`${stats.bopCount} (${stats.pctBop.toFixed(0)}%)`} alert={stats.bopCount > 0} />
          <MiniStat label="Class." value={classification.split(':')[0] || classification} />
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// InteractiveToothRow — the editable grid for new exam mode
// ===========================================================================

function InteractiveToothRow({
  teeth,
  chartData,
  activeTooth,
  activeSite,
  flashSite,
  onCellClick,
  onToothClick,
  onToggleBop,
}: {
  teeth: number[];
  chartData: Record<string, ToothData>;
  activeTooth: number;
  activeSite: number;
  flashSite: string | null;
  onCellClick: (tooth: number, site: number) => void;
  onToothClick: (tooth: number) => void;
  onToggleBop: (tooth: number, site: number) => void;
}) {
  return (
    <div className="flex gap-1 min-w-max">
      {teeth.map((tooth) => {
        const td = chartData[String(tooth)];
        const isActive = activeTooth === tooth;

        if (td.missing) {
          return (
            <div
              key={tooth}
              onClick={() => onToothClick(tooth)}
              className={cn(
                'flex flex-col items-center w-[56px] opacity-40 cursor-pointer rounded-lg p-1',
                isActive && 'ring-2 ring-indigo-400 opacity-60',
              )}
            >
              <div className="text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center mb-1 bg-gray-200 text-gray-500 line-through">
                {tooth}
              </div>
              <div className="text-[8px] text-gray-400 uppercase">Missing</div>
            </div>
          );
        }

        const maxDepth = Math.max(...td.depths.map((d) => d ?? 0));

        return (
          <div
            key={tooth}
            onClick={() => onToothClick(tooth)}
            className={cn(
              'flex flex-col items-center w-[56px] cursor-pointer rounded-lg p-1 transition-all',
              isActive ? 'ring-2 ring-indigo-400 bg-indigo-50/50' : 'hover:bg-gray-50',
            )}
          >
            {/* Tooth number */}
            <div className={cn(
              'text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center mb-1',
              maxDepth >= 6 ? 'bg-red-100 text-red-700' :
              maxDepth >= 4 ? 'bg-amber-100 text-amber-700' :
              td.depths.some((d) => d !== null) ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-500',
            )}>
              {tooth}
            </div>

            {/* Buccal sites: MB, B, DB */}
            <div className="flex gap-px">
              {[0, 1, 2].map((siteIdx) => {
                const d = td.depths[siteIdx];
                const bop = td.bop[siteIdx];
                const isSiteActive = isActive && activeSite === siteIdx;
                const isFlashing = flashSite === `${tooth}-${siteIdx}`;

                return (
                  <button
                    key={siteIdx}
                    onClick={(e) => { e.stopPropagation(); onCellClick(tooth, siteIdx); }}
                    onDoubleClick={(e) => { e.stopPropagation(); onToggleBop(tooth, siteIdx); }}
                    className={cn(
                      'relative text-[9px] font-bold w-[16px] h-[16px] rounded flex items-center justify-center transition-all',
                      d !== null ? depthColor(d) : 'bg-gray-50 text-gray-300',
                      isSiteActive && 'ring-2 ring-indigo-500',
                      isFlashing && 'animate-pulse ring-2 ring-green-400',
                    )}
                  >
                    {d !== null ? d : '-'}
                    {bop && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Lingual sites: ML, L, DL */}
            <div className="flex gap-px mt-px">
              {[3, 4, 5].map((siteIdx) => {
                const d = td.depths[siteIdx];
                const bop = td.bop[siteIdx];
                const isSiteActive = isActive && activeSite === siteIdx;
                const isFlashing = flashSite === `${tooth}-${siteIdx}`;

                return (
                  <button
                    key={siteIdx}
                    onClick={(e) => { e.stopPropagation(); onCellClick(tooth, siteIdx); }}
                    onDoubleClick={(e) => { e.stopPropagation(); onToggleBop(tooth, siteIdx); }}
                    className={cn(
                      'relative text-[9px] font-bold w-[16px] h-[16px] rounded flex items-center justify-center transition-all',
                      d !== null ? depthColor(d) : 'bg-gray-50 text-gray-300',
                      isSiteActive && 'ring-2 ring-indigo-500',
                      isFlashing && 'animate-pulse ring-2 ring-green-400',
                    )}
                  >
                    {d !== null ? d : '-'}
                    {bop && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===========================================================================
// Small reusable sub-components
// ===========================================================================

function StatBox({ label, value, color }: { label: string; value: string; color?: 'amber' | 'red' }) {
  return (
    <div className={cn(
      'card p-4',
      color === 'amber' && 'bg-amber-50',
      color === 'red' && 'bg-red-50',
    )}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={cn(
        'text-lg font-bold',
        color === 'amber' ? 'text-amber-700' :
        color === 'red' ? 'text-red-700' :
        'text-gray-900',
      )}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({ label, value, warn, alert }: { label: string; value: string; warn?: boolean; alert?: boolean }) {
  return (
    <div className={cn(
      'px-3 py-2 rounded-lg border text-center',
      alert ? 'bg-red-50 border-red-200' :
      warn ? 'bg-amber-50 border-amber-200' :
      'bg-gray-50 border-gray-100',
    )}>
      <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">{label}</p>
      <p className={cn(
        'text-sm font-bold mt-0.5',
        alert ? 'text-red-700' :
        warn ? 'text-amber-700' :
        'text-gray-900',
      )}>
        {value}
      </p>
    </div>
  );
}
