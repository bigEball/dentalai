import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FileText,
  Sparkles,
  ChevronLeft,
  Check,
  Clock,
  User,
  Loader2,
  Plus,
  Mic,
  MicOff,
  Pencil,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import { getNotes, getPatients, generateNote, updateNote, approveNote, getPatient } from '@/lib/api';
import type { ClinicalNote, Patient } from '@/types';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import PatientSearchBar from '@/components/ui/PatientSearchBar';
import OpenDentalLink from '@/components/ui/OpenDentalLink';


/* ─── Mock data (fallback when backend is unavailable) ───────────────────── */

const MOCK_NOTES: ClinicalNote[] = [
  {
    id: 'n1',
    patientId: 'p1',
    appointmentId: 'a1',
    providerId: 'dr1',
    date: '2024-01-20',
    status: 'pending_approval',
    transcript:
      'Patient presents for 6-month recall. Reports slight sensitivity on upper right. No pain. Last cleaning was 6 months ago. X-rays taken. Found small caries on tooth 3.',
    subjective:
      'Patient presents for routine 6-month prophylaxis. Reports mild thermal sensitivity on tooth #3. No spontaneous pain. No swelling. Good compliance with oral hygiene.',
    objective:
      'Periodontal assessment: BOP in posterior regions. Probing depths 2-4mm throughout. Calculus: light supragingival. Radiographic evaluation: incipient caries tooth #3 mesial.',
    assessment:
      'D1110 -- Adult prophylaxis completed. Incipient caries tooth #3 requiring monitoring. Periodontal status: generalized mild gingivitis.',
    plan: 'Schedule composite restoration tooth #3. Reinforce flossing technique. 6-month recall. Fluoride varnish applied.',
    procedureCode: 'D1110',
    toothNumbers: '3',
    patient: {
      id: 'p1',
      firstName: 'Jane',
      lastName: 'Cooper',
      dateOfBirth: '1985-03-15',
      phone: '5554201234',
      email: 'jane.cooper@email.com',
      preferredContactMethod: 'email',
      outstandingBalance: 120,
      createdAt: '',
      updatedAt: '',
    },
    provider: {
      id: 'dr1',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      title: 'DMD',
      specialty: 'General Dentistry',
    },
  },
  {
    id: 'n2',
    patientId: 'p2',
    appointmentId: 'a2',
    providerId: 'dr1',
    date: '2024-01-18',
    status: 'approved',
    subjective:
      'Patient presents for follow-up composite placement tooth #14. Anaesthetic administered without incident. Patient tolerated procedure well.',
    objective:
      'Tooth #14: Class II composite placed. Margins sealed. Occlusion checked and adjusted. Bite within normal limits.',
    assessment: 'D2392 -- Resin-based composite, 3 surfaces posterior.',
    plan: 'Patient instructed on post-op care. Schedule 6-month recall. Will monitor adjacent teeth.',
    procedureCode: 'D2392',
    toothNumbers: '14',
    patient: {
      id: 'p2',
      firstName: 'Robert',
      lastName: 'Chen',
      dateOfBirth: '1978-07-22',
      phone: '5559874321',
      email: 'r.chen@email.com',
      preferredContactMethod: 'text',
      outstandingBalance: 0,
      createdAt: '',
      updatedAt: '',
    },
    provider: {
      id: 'dr1',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      title: 'DMD',
      specialty: 'General Dentistry',
    },
  },
  {
    id: 'n3',
    patientId: 'p4',
    appointmentId: 'a3',
    providerId: 'dr1',
    date: '2024-01-15',
    status: 'draft',
    transcript:
      'Patient in for panoramic x-ray and exam. No complaints. Interested in whitening.',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    procedureCode: 'D0330',
    patient: {
      id: 'p4',
      firstName: 'Tom',
      lastName: 'Wilson',
      dateOfBirth: '1965-05-30',
      phone: '5557773344',
      email: 'tom.wilson@email.com',
      preferredContactMethod: 'email',
      outstandingBalance: 0,
      createdAt: '',
      updatedAt: '',
    },
    provider: {
      id: 'dr1',
      firstName: 'Sarah',
      lastName: 'Mitchell',
      title: 'DMD',
      specialty: 'General Dentistry',
    },
  },
  {
    id: 'n4',
    patientId: 'p3',
    appointmentId: 'a4',
    providerId: 'dr2',
    date: '2024-01-12',
    status: 'pending_approval',
    subjective:
      'Patient presents for orthodontic adjustment. Braces placed 4 months ago. Reports mild discomfort after last adjustment. Oral hygiene needs improvement.',
    objective:
      'Arch wires changed upper and lower. Elastics placed. Oral hygiene: fair. No broken brackets.',
    assessment:
      'D8080 -- Comprehensive orthodontic treatment, adolescent. Progress satisfactory.',
    plan: 'Next adjustment in 6 weeks. Reinforce oral hygiene. Patient reminded to wear elastics 22 hours/day.',
    procedureCode: 'D8080',
    patient: {
      id: 'p3',
      firstName: 'Maria',
      lastName: 'Garcia',
      dateOfBirth: '1992-11-08',
      phone: '5551238765',
      email: 'maria.g@email.com',
      preferredContactMethod: 'phone',
      outstandingBalance: 680.5,
      createdAt: '',
      updatedAt: '',
    },
    provider: {
      id: 'dr2',
      firstName: 'James',
      lastName: 'Patterson',
      title: 'DDS',
      specialty: 'Orthodontics',
    },
  },
];

/* ─── Simulated transcripts for demo mode ────────────────────────────────── */

const SIMULATED_TRANSCRIPTS: Record<string, string> = {
  D1110:
    'Patient is here for their six-month prophylaxis and recall exam. They mentioned some slight bleeding when flossing lately, mostly in the upper right area. No pain or sensitivity otherwise. Medical history is unchanged, still taking lisinopril for blood pressure. I completed the prophy, moderate calculus buildup in the lower anteriors. Probing depths all within normal limits, three to four millimeters throughout. Applied fluoride varnish. Reminded patient to focus on flossing the upper right quadrant.',
  D2392:
    'Patient presents for a composite restoration on tooth number fourteen. We reviewed the radiographs from last visit showing the mesio-occlusal caries. Administered two percent lidocaine with one-to-one-hundred-thousand epi, one carpule, inferior alveolar nerve block. Achieved adequate anesthesia. Isolated with cotton rolls. Removed the carious dentin, the prep extended to a Class II MO. Placed a Tofflemire matrix band. Applied bonding agent, light cured. Placed composite in increments, light cured each layer. Adjusted occlusion, patient feels the bite is comfortable. Polished the restoration. Patient tolerated the procedure well. Post-op instructions given.',
  D0330:
    'Patient is in for a panoramic radiograph and comprehensive exam. No chief complaint today, they are interested in discussing whitening options. Panoramic image obtained and reviewed. No acute pathology noted. Third molars are absent, previously extracted. Existing restorations appear intact. Mild generalized bone loss consistent with age. Discussed whitening options including in-office and take-home trays. Patient would like to think about it.',
  D8080:
    'Orthodontic progress check and adjustment visit. Braces were placed four months ago. Patient reports mild soreness that resolves within two days after adjustments. They have been wearing their elastics about twenty hours per day. Oral hygiene could be better, some plaque around the brackets in the lower anterior region. Changed archwires upper and lower, now in sixteen by twenty-two nickel titanium. Placed new elastics, Class II configuration. Reinforced oral hygiene instructions. Next visit in six weeks.',
  D2750:
    'Patient presents for crown preparation on tooth number thirty. Previous root canal was completed three weeks ago and the tooth needs definitive restoration. Administered local anesthesia, two percent lidocaine with epi, buccal infiltration. Reduced the tooth on all surfaces for a full-coverage PFM crown. Took digital impression with the scanner. Shade A2 selected. Fabricated and placed a temporary crown with TempBond. Checked the occlusion on the temporary. Patient is comfortable. Final crown will be ready in two weeks.',
  default:
    'Patient is here for their scheduled appointment. They have no specific complaints today. Vital signs are stable. Reviewed medical history, no changes since last visit. Completed the clinical examination. Oral hygiene is good overall. No acute issues identified. Discussed treatment recommendations and home care instructions. Patient had a good visit and will return for their next scheduled appointment.',
};

function getSimulatedTranscript(procedureCode: string): string {
  return (
    SIMULATED_TRANSCRIPTS[procedureCode] ?? SIMULATED_TRANSCRIPTS['default']
  );
}

/* ─── Step indicator component ───────────────────────────────────────────── */

interface StepIndicatorProps {
  steps: { label: string; complete: boolean; active: boolean }[];
}

function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((step, i) => (
        <React.Fragment key={step.label}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-300',
                step.complete
                  ? 'bg-green-100 text-green-700'
                  : step.active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-gray-100 text-gray-400',
              )}
            >
              {step.complete ? <Check size={14} /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm font-medium transition-colors hidden sm:inline',
                step.complete
                  ? 'text-green-700'
                  : step.active
                    ? 'text-gray-900'
                    : 'text-gray-400',
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 rounded-full transition-colors',
                step.complete ? 'bg-green-200' : 'bg-gray-100',
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Audio level bars component ─────────────────────────────────────────── */

function AudioLevelBars({ level }: { level: number }) {
  const barCount = 5;
  return (
    <div className="flex items-end gap-1 h-8">
      {Array.from({ length: barCount }).map((_, i) => {
        const threshold = (i + 1) / barCount;
        const active = level >= threshold * 0.6;
        return (
          <div
            key={i}
            className={cn(
              'w-1.5 rounded-full transition-all duration-150',
              active ? 'bg-red-400' : 'bg-gray-200',
            )}
            style={{
              height: `${((i + 1) / barCount) * 100}%`,
              opacity: active ? 0.7 + level * 0.3 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Shimmer / skeleton for loading state ───────────────────────────────── */

function SoapSkeleton() {
  const sections = [
    { label: 'S -- Subjective', color: 'border-blue-400' },
    { label: 'O -- Objective', color: 'border-purple-400' },
    { label: 'A -- Assessment', color: 'border-amber-400' },
    { label: 'P -- Plan', color: 'border-green-400' },
  ];
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div
          key={s.label}
          className={cn('bg-white rounded-lg border-l-4 p-4', s.color)}
        >
          <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STATUS_TABS = [
  { key: '', label: 'All Notes' },
  { key: 'draft', label: 'Drafts' },
  { key: 'pending_approval', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
];

interface NoteFormState {
  transcript: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  procedureCode: string;
  toothNumbers: string;
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function AINotesPage() {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NoteFormState>({
    transcript: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    procedureCode: '',
    toothNumbers: '',
  });
  const [filterPatient, setFilterPatient] = useState<Patient | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      getPatient(patientId).then(setFilterPatient).catch(() => {});
    }
  }, [searchParams]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioCaptured, setAudioCaptured] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // New note patient search state
  const [showNewNoteSearch, setShowNewNoteSearch] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // UI state
  const [showManualTranscript, setShowManualTranscript] = useState(false);
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [editingSections, setEditingSections] = useState<
    Record<string, boolean>
  >({});

  /* ─── Load notes ──────────────────────────────────────────────────────── */

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getNotes({
        status: statusFilter || undefined,
      });
      setNotes(result.notes);
    } catch {
      const filtered = statusFilter
        ? MOCK_NOTES.filter((n) => n.status === statusFilter)
        : MOCK_NOTES;
      setNotes(filtered);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  /* ─── Patient search for new note ──────────────────────────────────── */

  function handlePatientSearch(query: string) {
    setPatientSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!query.trim()) {
      setPatientSearchResults([]);
      return;
    }
    setSearchingPatients(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await getPatients({ search: query });
        setPatientSearchResults(result.patients);
      } catch {
        setPatientSearchResults([]);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
  }

  function startNewNote(patient: Patient) {
    const today = new Date().toISOString().split('T')[0];
    const newNote: ClinicalNote = {
      id: `new-${Date.now()}`,
      patientId: patient.id,
      appointmentId: '',
      providerId: '',
      date: today,
      status: 'draft',
      transcript: '',
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
      procedureCode: '',
      toothNumbers: '',
      patient,
    };
    setShowNewNoteSearch(false);
    setPatientSearchQuery('');
    setPatientSearchResults([]);
    openNote(newNote);
    toast.success(`Starting note for ${patient.firstName} ${patient.lastName}`);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setShowNewNoteSearch(false);
        setPatientSearchQuery('');
        setPatientSearchResults([]);
      }
    }
    if (showNewNoteSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNewNoteSearch]);

  /* ─── Open / close note ───────────────────────────────────────────────── */

  function openNote(note: ClinicalNote) {
    setSelectedNote(note);
    setForm({
      transcript: note.transcript ?? '',
      subjective: note.subjective,
      objective: note.objective,
      assessment: note.assessment,
      plan: note.plan,
      procedureCode: note.procedureCode ?? '',
      toothNumbers: note.toothNumbers ?? '',
    });
    setAudioCaptured(false);
    setRecordingTime(0);
    setShowManualTranscript(!!note.transcript);
    setEditingTranscript(false);
    setEditingSections({});
  }

  function closeNote() {
    stopRecordingCleanup();
    setSelectedNote(null);
    setAudioCaptured(false);
    setRecordingTime(0);
    setShowManualTranscript(false);
    setEditingTranscript(false);
    setEditingSections({});
  }

  /* ─── Audio recording ─────────────────────────────────────────────────── */

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Audio level monitoring
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.start(1000);

      // Timer
      setRecordingTime(0);
      timerRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000,
      );
      setIsRecording(true);

      // Audio level animation
      function updateLevel() {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(avg / 128);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      }
      updateLevel();
    } catch {
      toast.error(
        'Could not access microphone. Please check your browser permissions.',
      );
    }
  }

  function stopRecordingCleanup() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((t) => t.stop());
    }
    mediaRecorderRef.current = null;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevel(0);
  }

  function stopRecording() {
    stopRecordingCleanup();

    // Demo mode: simulate transcript based on procedure code
    const transcript = getSimulatedTranscript(form.procedureCode);
    setForm((prev) => ({ ...prev, transcript }));
    setAudioCaptured(true);
    setShowManualTranscript(true);
    toast.success('Recording captured! Review the transcript below.');
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Generate SOAP note ──────────────────────────────────────────────── */

  async function handleGenerate() {
    if (!selectedNote || !form.transcript.trim()) {
      toast.error('Please record or type a transcript first.');
      return;
    }
    setGenerating(true);
    try {
      const result = await generateNote({
        transcript: form.transcript,
        patientId: selectedNote.patientId,
        appointmentId: selectedNote.appointmentId,
        procedureCode: form.procedureCode || undefined,
        toothNumbers: form.toothNumbers || undefined,
      });
      setForm((prev) => ({
        ...prev,
        subjective: result.subjective,
        objective: result.objective,
        assessment: result.assessment,
        plan: result.plan,
      }));
      toast.success('SOAP note generated successfully!');
    } catch {
      // Simulate generation with a realistic delay
      await new Promise((r) => setTimeout(r, 1800));
      setForm((prev) => ({
        ...prev,
        subjective: `Patient ${selectedNote.patient?.firstName} ${selectedNote.patient?.lastName} presents for ${form.procedureCode || 'scheduled appointment'}. ${prev.transcript.split('.').slice(0, 2).join('.')}. Medical history reviewed and unchanged from last visit.`,
        objective: `Clinical examination performed. Periodontal assessment: probing depths within normal limits. ${form.toothNumbers ? `Tooth #${form.toothNumbers} examined and assessed.` : 'Full mouth evaluation completed.'} No acute pathology identified. Radiographic evaluation as indicated per treatment plan.`,
        assessment: `${form.procedureCode ? `${form.procedureCode} -- ` : ''}Procedure completed as planned. Clinical findings consistent with examination. Patient tolerated treatment well with no complications noted.`,
        plan: 'Post-operative instructions provided to patient. Patient advised to contact the office if any pain, swelling, or concerns develop. Follow-up care scheduled per treatment plan. Continue current home care regimen.',
      }));
      toast.success('SOAP note generated (demo mode)');
    } finally {
      setGenerating(false);
    }
  }

  /* ─── Save / submit / approve ─────────────────────────────────────────── */

  async function handleSave() {
    if (!selectedNote) return;
    setSaving(true);
    try {
      await updateNote(selectedNote.id, {
        transcript: form.transcript,
        subjective: form.subjective,
        objective: form.objective,
        assessment: form.assessment,
        plan: form.plan,
        procedureCode: form.procedureCode,
        toothNumbers: form.toothNumbers,
      });
      toast.success('Draft saved successfully.');
      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNote.id ? { ...n, ...form } : n)),
      );
    } catch {
      toast.success('Draft saved (demo mode).');
      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNote.id ? { ...n, ...form } : n)),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePendingApproval() {
    if (!selectedNote) return;
    setSaving(true);
    try {
      await updateNote(selectedNote.id, { status: 'pending_approval' });
      toast.success('Note submitted for approval.');
      setSelectedNote((prev) =>
        prev ? { ...prev, status: 'pending_approval' } : null,
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, status: 'pending_approval' as const }
            : n,
        ),
      );
    } catch {
      toast.success('Note submitted for approval (demo mode).');
      setSelectedNote((prev) =>
        prev ? { ...prev, status: 'pending_approval' } : null,
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, status: 'pending_approval' as const }
            : n,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!selectedNote) return;
    setSaving(true);
    try {
      await approveNote(selectedNote.id);
      toast.success(
        "Note approved! It will appear in the patient's chart.",
      );
      setSelectedNote((prev) =>
        prev ? { ...prev, status: 'approved' } : null,
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, status: 'approved' as const }
            : n,
        ),
      );
    } catch {
      toast.success(
        "Note approved! It will appear in the patient's chart. (demo mode)",
      );
      setSelectedNote((prev) =>
        prev ? { ...prev, status: 'approved' } : null,
      );
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, status: 'approved' as const }
            : n,
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  /* ─── Computed step state ─────────────────────────────────────────────── */

  const hasTranscript = form.transcript.trim().length > 0;
  const hasSoap =
    form.subjective.trim().length > 0 ||
    form.objective.trim().length > 0 ||
    form.assessment.trim().length > 0 ||
    form.plan.trim().length > 0;
  const isApproved = selectedNote?.status === 'approved';

  const steps = [
    { label: 'Record', complete: hasTranscript, active: !hasTranscript },
    {
      label: 'Generate',
      complete: hasSoap,
      active: hasTranscript && !hasSoap,
    },
    {
      label: 'Review',
      complete: hasSoap && isApproved,
      active: hasSoap && !isApproved,
    },
    { label: 'Approve', complete: isApproved, active: false },
  ];

  /* ════════════════════════════════════════════════════════════════════════ */
  /* ─── Detail view ────────────────────────────────────────────────────── */
  /* ════════════════════════════════════════════════════════════════════════ */

  if (selectedNote) {
    const patient = selectedNote.patient;
    const note = selectedNote;

    return (
      <div className="max-w-5xl mx-auto">
        {/* Top bar: back button */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={closeNote} className="btn-ghost">
            <ChevronLeft size={15} /> Back to Notes
          </button>
        </div>

        {/* Patient info bar */}
        <div className="card px-5 py-4 mb-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-3">
              {patient && (
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">
                    {getInitials(patient.firstName, patient.lastName)}
                  </span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-base font-semibold text-gray-900">
                    {patient
                      ? `${patient.firstName} ${patient.lastName}`
                      : 'Unknown Patient'}
                  </p>
                  {patient && <OpenDentalLink patientId={patient.id} />}
                </div>
                {patient?.dateOfBirth && (
                  <p className="text-xs text-gray-400">
                    DOB: {formatDate(patient.dateOfBirth)}
                  </p>
                )}
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-200" />

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {formatDate(note.date)}
              </span>
              {form.procedureCode && (
                <span className="flex items-center gap-1.5">
                  <Hash size={14} className="text-gray-400" />
                  {form.procedureCode}
                </span>
              )}
              {form.toothNumbers && (
                <span className="text-gray-500">
                  Tooth #{form.toothNumbers}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User size={14} className="text-gray-400" />
                {note.provider
                  ? `Dr. ${note.provider.firstName} ${note.provider.lastName}, ${note.provider.title}`
                  : 'Provider'}
              </span>
              <Badge status={note.status} variant="note" />
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator steps={steps} />

        {/* Procedure info (collapsible) */}
        <div className="card p-4 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Procedure Code
              </label>
              <input
                type="text"
                value={form.procedureCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, procedureCode: e.target.value }))
                }
                className="input"
                placeholder="e.g. D1110"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Tooth Numbers
              </label>
              <input
                type="text"
                value={form.toothNumbers}
                onChange={(e) =>
                  setForm((p) => ({ ...p, toothNumbers: e.target.value }))
                }
                className="input"
                placeholder="e.g. 3, 14"
              />
            </div>
          </div>
        </div>

        {/* ── Step 1: Record ──────────────────────────────────────────────── */}
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              1
            </span>
            Record Appointment
          </h3>

          {/* Mic button area */}
          {!hasTranscript || audioCaptured ? (
            <div className="card p-8 flex flex-col items-center justify-center text-center">
              {/* Microphone button */}
              <div className="relative mb-4">
                {/* Pulsing ring when recording */}
                {isRecording && (
                  <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
                )}
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn(
                    'relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg',
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300',
                  )}
                >
                  {isRecording ? (
                    <MicOff size={28} className="text-white" />
                  ) : (
                    <Mic size={28} className="text-white" />
                  )}
                </button>
              </div>

              {/* Recording status */}
              {isRecording ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-lg font-semibold text-gray-900 tabular-nums">
                      {formatTime(recordingTime)}
                    </span>
                    <AudioLevelBars level={audioLevel} />
                  </div>
                  <p className="text-sm text-gray-500">
                    Recording... Tap the button to stop
                  </p>
                </div>
              ) : audioCaptured ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-medium">
                      Transcript captured
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Review below, then click Generate to create your SOAP note
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                    Demo: simulated transcript
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Tap to start recording
                  </p>
                  <p className="text-xs text-gray-400">
                    Record the appointment and we will generate your note
                  </p>
                </div>
              )}

              {/* Manual transcript toggle */}
              {!isRecording && !audioCaptured && (
                <button
                  onClick={() => setShowManualTranscript((v) => !v)}
                  className="mt-5 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
                >
                  {showManualTranscript ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  Or type / paste a transcript manually
                </button>
              )}

              {/* Manual transcript textarea */}
              {showManualTranscript && !isRecording && !audioCaptured && (
                <div className="w-full mt-3">
                  <textarea
                    rows={5}
                    value={form.transcript}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, transcript: e.target.value }))
                    }
                    placeholder="Type or paste your clinical transcript here..."
                    className="input resize-none leading-relaxed text-sm"
                  />
                </div>
              )}
            </div>
          ) : null}

          {/* Show transcript if it already existed (loaded from saved note) and not from recording */}
          {hasTranscript && !audioCaptured && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Transcript
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setForm((p) => ({ ...p, transcript: '' }));
                      setShowManualTranscript(false);
                      setAudioCaptured(false);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Re-record
                  </button>
                  <button
                    onClick={() => setEditingTranscript((v) => !v)}
                    className="btn-ghost text-xs"
                  >
                    <Pencil size={12} />
                    {editingTranscript ? 'Done' : 'Edit'}
                  </button>
                </div>
              </div>
              {editingTranscript ? (
                <textarea
                  rows={5}
                  value={form.transcript}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, transcript: e.target.value }))
                  }
                  className="input resize-none leading-relaxed text-sm"
                />
              ) : (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {form.transcript}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Transcript display after recording (if captured) ────────── */}
        {audioCaptured && hasTranscript && (
          <div className="card p-5 mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Transcript
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setForm((p) => ({ ...p, transcript: '' }));
                    setAudioCaptured(false);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Re-record
                </button>
                <button
                  onClick={() => setEditingTranscript((v) => !v)}
                  className="btn-ghost text-xs"
                >
                  <Pencil size={12} />
                  {editingTranscript ? 'Done' : 'Edit'}
                </button>
              </div>
            </div>
            {editingTranscript ? (
              <textarea
                rows={5}
                value={form.transcript}
                onChange={(e) =>
                  setForm((p) => ({ ...p, transcript: e.target.value }))
                }
                className="input resize-none leading-relaxed text-sm"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {form.transcript}
              </p>
            )}
          </div>
        )}

        {/* ── Step 2: Generate ────────────────────────────────────────────── */}
        {hasTranscript && !hasSoap && !generating && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                2
              </span>
              Generate SOAP Note
            </h3>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              <Sparkles size={18} />
              Generate SOAP Note
            </button>
          </div>
        )}

        {/* Generating skeleton */}
        {generating && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                2
              </span>
              Generating SOAP Note
              <Loader2 size={14} className="animate-spin text-indigo-500 ml-1" />
            </h3>
            <SoapSkeleton />
          </div>
        )}

        {/* ── Step 3: Review & Edit ────────────────────────────────────────── */}
        {hasSoap && !generating && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                  3
                </span>
                Review SOAP Note
              </h3>
              <button
                onClick={handleGenerate}
                disabled={generating || !hasTranscript}
                className="btn-ghost text-xs"
              >
                <Sparkles size={12} />
                Regenerate
              </button>
            </div>

            <div className="space-y-3">
              {(
                [
                  {
                    key: 'subjective' as const,
                    label: 'S -- Subjective',
                    color: 'border-blue-400',
                    labelBg: 'bg-blue-50 text-blue-700',
                  },
                  {
                    key: 'objective' as const,
                    label: 'O -- Objective',
                    color: 'border-purple-400',
                    labelBg: 'bg-purple-50 text-purple-700',
                  },
                  {
                    key: 'assessment' as const,
                    label: 'A -- Assessment',
                    color: 'border-amber-400',
                    labelBg: 'bg-amber-50 text-amber-700',
                  },
                  {
                    key: 'plan' as const,
                    label: 'P -- Plan',
                    color: 'border-green-400',
                    labelBg: 'bg-green-50 text-green-700',
                  },
                ] as const
              ).map((section) => (
                <div
                  key={section.key}
                  className={cn(
                    'bg-white rounded-lg border border-gray-100 border-l-4 p-4 shadow-sm',
                    section.color,
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        'inline-block text-xs font-semibold px-2 py-0.5 rounded',
                        section.labelBg,
                      )}
                    >
                      {section.label}
                    </span>
                    <button
                      onClick={() =>
                        setEditingSections((prev) => ({
                          ...prev,
                          [section.key]: !prev[section.key],
                        }))
                      }
                      className="btn-ghost text-xs"
                    >
                      <Pencil size={12} />
                      {editingSections[section.key] ? 'Done' : 'Edit'}
                    </button>
                  </div>
                  {editingSections[section.key] ? (
                    <textarea
                      rows={4}
                      value={form[section.key]}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          [section.key]: e.target.value,
                        }))
                      }
                      className="input resize-none text-sm leading-relaxed"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {form[section.key] || (
                        <span className="text-gray-300 italic">
                          No content yet
                        </span>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Approve ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              4
            </span>
            Save & Approve
          </h3>

          {note.status === 'approved' ? (
            <div className="card p-6 flex items-center justify-center gap-3 bg-green-50 border-green-200">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                <CheckCircle2 size={22} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Approved and saved to chart
                </p>
                <p className="text-xs text-green-600">
                  This note has been finalized and added to the patient record.
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-secondary flex-1 min-w-[140px] justify-center"
                >
                  {saving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <FileText size={14} />
                  )}
                  Save Draft
                </button>

                {note.status === 'draft' && (
                  <button
                    onClick={handlePendingApproval}
                    disabled={saving || !hasSoap}
                    className="btn-secondary flex-1 min-w-[140px] justify-center"
                  >
                    <Clock size={14} className="text-amber-500" />
                    Submit for Approval
                  </button>
                )}

                {(note.status === 'draft' ||
                  note.status === 'pending_approval') && (
                  <button
                    onClick={handleApprove}
                    disabled={saving || !hasSoap}
                    className="flex-1 min-w-[180px] inline-flex items-center gap-2 justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Check size={14} />
                    Approve & Write to Chart
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /* ─── List view ──────────────────────────────────────────────────────── */
  /* ════════════════════════════════════════════════════════════════════════ */

  const noteStats = {
    total: MOCK_NOTES.length,
    draft: MOCK_NOTES.filter((n) => n.status === 'draft').length,
    pending: MOCK_NOTES.filter((n) => n.status === 'pending_approval').length,
    approved: MOCK_NOTES.filter((n) => n.status === 'approved').length,
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
            <FileText size={24} className="text-indigo-600" />
            Clinical Notes
          </h1>
          <p className="mt-1 text-sm text-gray-500">Record appointments and generate AI-powered SOAP notes</p>
        </div>
        <div className="relative" ref={searchDropdownRef}>
          {showNewNoteSearch ? (
            <div className="w-80">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoFocus
                  value={patientSearchQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  placeholder="Search patient by name..."
                  className="input pl-10 pr-10"
                />
                <button
                  onClick={() => { setShowNewNoteSearch(false); setPatientSearchQuery(''); setPatientSearchResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              {(patientSearchResults.length > 0 || searchingPatients || patientSearchQuery.trim()) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-72 overflow-y-auto">
                  {searchingPatients ? (
                    <div className="px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      Searching patients...
                    </div>
                  ) : patientSearchResults.length === 0 && patientSearchQuery.trim() ? (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      No patients found for "{patientSearchQuery}"
                    </div>
                  ) : (
                    patientSearchResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => startNewNote(patient)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold">{getInitials(patient.firstName, patient.lastName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{patient.firstName} {patient.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">
                            DOB: {formatDate(patient.dateOfBirth)}
                            {patient.phone ? ` · ${patient.phone}` : ''}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowNewNoteSearch(true)}
              className="btn-primary"
            >
              <Plus size={15} />
              Start New Note
            </button>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-900 mb-2">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <p className="text-xs text-indigo-800">Click "Start New Note" and select a patient from the search</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <p className="text-xs text-indigo-800">Record the visit using voice dictation or type the transcript manually</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <p className="text-xs text-indigo-800">AI generates a structured SOAP note — review and edit each section</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <p className="text-xs text-indigo-800">Approve the final note to lock it into the patient's record</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{noteStats.total}</p>
              <p className="text-xs text-gray-500">Total Notes</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-100 text-gray-500">
              <Pencil size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-700">{noteStats.draft}</p>
              <p className="text-xs text-gray-500">Drafts</p>
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
              <p className="text-2xl font-bold text-amber-700">{noteStats.pending}</p>
              <p className="text-xs text-gray-500">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{noteStats.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
              statusFilter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Patient search bar */}
      <div className="mb-4">
        <PatientSearchBar
          onSelect={setFilterPatient}
          placeholder="Filter notes by patient name..."
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

      {/* Notes list */}
      {(() => {
        const displayedNotes = filterPatient
          ? notes.filter((n) => n.patientId === filterPatient.id)
          : notes;

        return loading ? (
        <FullPageSpinner />
      ) : displayedNotes.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Mic size={24} />}
            title="No notes yet"
            subtitle="Start by recording your first appointment. Tap the button above to get started."
            action={
              <button
                onClick={() => setShowNewNoteSearch(true)}
                className="btn-primary mt-2"
              >
                <Mic size={14} />
                Start New Note
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedNotes.map((note) => {
            const patient = note.patient;
            const preview = note.subjective
              ? note.subjective.length > 80
                ? note.subjective.slice(0, 80) + '...'
                : note.subjective
              : note.transcript
                ? note.transcript.length > 80
                  ? note.transcript.slice(0, 80) + '...'
                  : note.transcript
                : null;

            return (
              <button
                key={note.id}
                onClick={() => openNote(note)}
                className="card p-5 text-left hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {patient && (
                    <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <span className="text-sm font-bold">
                        {getInitials(patient.firstName, patient.lastName)}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Name + status */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {patient
                            ? `${patient.firstName} ${patient.lastName}`
                            : 'Unknown Patient'}
                        </h3>
                        {patient && <OpenDentalLink patientId={patient.id} />}
                      </div>
                      <Badge status={note.status} variant="note" />
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400 mb-2">
                      <span>{formatDate(note.date)}</span>
                      {note.procedureCode && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">
                          {note.procedureCode}
                        </span>
                      )}
                      {note.provider && (
                        <span>Dr. {note.provider.lastName}</span>
                      )}
                    </div>

                    {/* Preview */}
                    {preview && (
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {preview}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      );
      })()}
    </div>
  );
}
