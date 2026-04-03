import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Scan,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  ImageIcon,
  X,
  FileImage,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  getRadiographs,
  getPatients,
  updateRadiographNotes,
  markRadiographReviewed,
  uploadRadiograph,
  getPatient,
} from '@/lib/api';
import type { RadiographStudy, RadiographFinding, Patient } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import PatientSearchBar from '@/components/ui/PatientSearchBar';

// ─── Mock data for fallback ──────────────────────────────────────────────────

const MOCK_FINDINGS_1: RadiographFinding[] = [
  { id: 'f1', description: 'Incipient caries mesial surface tooth #3', tooth: '3', severity: 'medium', confidence: 0.87, category: 'decay' },
  { id: 'f2', description: 'Calculus deposit lingual aspect teeth #24-25', tooth: '24-25', severity: 'low', confidence: 0.92, category: 'calculus' },
  { id: 'f3', description: 'Watch area: distal surface tooth #14', tooth: '14', severity: 'low', confidence: 0.71, category: 'watch' },
];

const MOCK_FINDINGS_2: RadiographFinding[] = [
  { id: 'f4', description: 'Moderate horizontal bone loss posterior mandible', severity: 'high', confidence: 0.94, category: 'bone_loss' },
  { id: 'f5', description: 'Periapical radiolucency tooth #19', tooth: '19', severity: 'high', confidence: 0.89, category: 'decay' },
  { id: 'f6', description: 'Secondary caries under existing restoration tooth #30', tooth: '30', severity: 'medium', confidence: 0.83, category: 'decay' },
];

const MOCK_RADIOGRAPHS: RadiographStudy[] = [
  { id: 'rad1', patientId: 'p1', date: '2024-01-20', type: 'bitewing', findings: MOCK_FINDINGS_1, reviewedBy: null, reviewedDate: null, providerNotes: '', imageUrl: '', patient: { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-03-15', phone: '5554201234', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 120, createdAt: '', updatedAt: '' } },
  { id: 'rad2', patientId: 'p8', date: '2024-01-18', type: 'panoramic', findings: MOCK_FINDINGS_2, reviewedBy: 'Dr. Mitchell', reviewedDate: '2024-01-18', providerNotes: 'Significant bone loss consistent with periodontal disease. Refer to periodontist.', imageUrl: '', patient: { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' } },
  { id: 'rad3', patientId: 'p4', date: '2024-01-15', type: 'panoramic', findings: [], reviewedBy: null, reviewedDate: null, providerNotes: '', imageUrl: '', patient: { id: 'p4', firstName: 'Tom', lastName: 'Wilson', dateOfBirth: '1965-05-30', phone: '5557773344', email: 'tom.wilson@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' } },
  { id: 'rad4', patientId: 'p2', date: '2024-01-10', type: 'periapical', findings: [{ id: 'f7', description: 'Normal periapical tissue, no pathology detected', severity: 'low', confidence: 0.96, category: 'normal' }], reviewedBy: 'Dr. Mitchell', reviewedDate: '2024-01-10', providerNotes: 'Normal findings. No treatment indicated.', imageUrl: '', patient: { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1978-07-22', phone: '5559874321', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 0, createdAt: '', updatedAt: '' } },
];

const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', firstName: 'Jane', lastName: 'Cooper', dateOfBirth: '1985-03-15', phone: '5554201234', email: 'jane.cooper@email.com', preferredContactMethod: 'email', outstandingBalance: 120, createdAt: '', updatedAt: '' },
  { id: 'p2', firstName: 'Robert', lastName: 'Chen', dateOfBirth: '1978-07-22', phone: '5559874321', email: 'r.chen@email.com', preferredContactMethod: 'text', outstandingBalance: 0, createdAt: '', updatedAt: '' },
  { id: 'p4', firstName: 'Tom', lastName: 'Wilson', dateOfBirth: '1965-05-30', phone: '5557773344', email: 'tom.wilson@email.com', preferredContactMethod: 'email', outstandingBalance: 0, createdAt: '', updatedAt: '' },
  { id: 'p8', firstName: 'David', lastName: 'Park', dateOfBirth: '1975-08-22', phone: '5554449900', email: 'd.park@email.com', preferredContactMethod: 'phone', outstandingBalance: 1450, createdAt: '', updatedAt: '' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const XRAY_TYPES = ['bitewing', 'panoramic', 'periapical', 'cephalometric'] as const;

function parsedFindings(findings: RadiographFinding[] | string): RadiographFinding[] {
  if (Array.isArray(findings)) return findings;
  try { return JSON.parse(findings) as RadiographFinding[]; } catch { return []; }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'high': return 'bg-red-50 text-red-700 border-red-200';
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return severity;
  }
}

function categoryIcon(category: string): string {
  switch (category) {
    case 'decay': return '🦷';
    case 'bone_loss': return '🦴';
    case 'calculus': return '🪨';
    case 'watch': return '👁';
    case 'normal': return '✓';
    default: return '•';
  }
}

function categoryColor(category: string): string {
  switch (category) {
    case 'decay': return 'bg-red-50 text-red-600 border-red-200';
    case 'bone_loss': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'calculus': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'watch': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'normal': return 'bg-green-50 text-green-600 border-green-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function confidenceColor(conf: number): string {
  if (conf >= 0.9) return 'bg-green-500';
  if (conf >= 0.75) return 'bg-amber-400';
  return 'bg-orange-400';
}

function imageUrlFull(imageUrl: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  return `http://localhost:3001${imageUrl}`;
}

// ─── X-Ray Placeholder SVG ──────────────────────────────────────────────────

function XRayPlaceholder({ type, className }: { type: string; className?: string }) {
  return (
    <div className={`w-full h-full bg-gray-900 flex items-center justify-center rounded-lg relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, #1a1a2e 0%, #0a0a0f 100%)' }} />
      <svg
        viewBox="0 0 200 200"
        className="w-32 h-32 relative z-10 opacity-40"
        fill="none"
        stroke="#a0aec0"
        strokeWidth="1.5"
      >
        {type === 'panoramic' ? (
          <>
            <ellipse cx="100" cy="120" rx="80" ry="50" strokeWidth="1" />
            {[40, 55, 70, 85, 100, 115, 130, 145, 160].map((x, i) => (
              <rect key={i} x={x - 6} y={90} width={12} height={30} rx="3" strokeWidth="1.5" />
            ))}
            <ellipse cx="100" cy="75" rx="65" ry="40" strokeWidth="1" />
            {[45, 60, 75, 90, 110, 125, 140, 155].map((x, i) => (
              <rect key={i} x={x - 5} y={55} width={10} height={25} rx="2" strokeWidth="1" />
            ))}
          </>
        ) : (
          <>
            {[30, 55, 80, 105, 130].map((x, i) => (
              <g key={i}>
                <rect x={x} y={60} width={20} height={35} rx="4" strokeWidth="1.5" />
                <rect x={x + 4} y={95} width={12} height={20} rx="2" strokeWidth="1" />
              </g>
            ))}
            <line x1="20" y1="115" x2="180" y2="115" strokeDasharray="4 3" strokeWidth="0.5" />
          </>
        )}
        <text x="100" y="185" textAnchor="middle" fontSize="8" fill="#718096" fontFamily="monospace">
          {type.toUpperCase()} — DEMO
        </text>
      </svg>
    </div>
  );
}

// ─── Small Thumbnail for Card Grid ──────────────────────────────────────────

function Thumbnail({ study }: { study: RadiographStudy }) {
  const hasRealImage = study.imageUrl && study.imageUrl.startsWith('/uploads/');

  if (hasRealImage) {
    return (
      <div className="w-full h-36 rounded-t-xl overflow-hidden bg-gray-900">
        <img
          src={imageUrlFull(study.imageUrl)}
          alt={`${study.type} X-ray`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-36 rounded-t-xl overflow-hidden">
      <XRayPlaceholder type={study.type} />
    </div>
  );
}

// ─── Upload Area Component ──────────────────────────────────────────────────

interface UploadAreaProps {
  patients: Patient[];
  onUploaded: (study: RadiographStudy) => void;
}

function UploadArea({ patients, onUploaded }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [xrayType, setXrayType] = useState<string>('bitewing');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleFile(file: File) {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    } else {
      toast.error('Please drop an image file (JPG, PNG, etc.)');
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function clearSelection() {
    setSelectedFile(null);
    setPreview(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload() {
    if (!selectedFile) return;
    if (!patientId) {
      toast.error('Please select a patient');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    // Simulate progress steps
    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 15, 85));
    }, 300);

    try {
      const study = await uploadRadiograph(selectedFile, patientId, xrayType);
      clearInterval(progressTimer);
      setUploadProgress(100);

      const findings = parsedFindings(study.findings);
      toast.success(`X-ray uploaded! AI analysis found ${findings.length} finding${findings.length !== 1 ? 's' : ''}.`);

      onUploaded(study);
      clearSelection();
      setPatientId('');
      setXrayType('bitewing');
    } catch {
      clearInterval(progressTimer);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  return (
    <div className="card mb-6">
      <div className="p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Upload size={16} className="text-indigo-500" />
          Upload X-Ray
        </h2>

        {!selectedFile ? (
          /* ─── Drop zone ─── */
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative cursor-pointer rounded-xl border-2 border-dashed p-8
              flex flex-col items-center justify-center text-center
              transition-all duration-200
              ${dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50/50'
              }
            `}
          >
            <div className={`p-3 rounded-full mb-3 transition-colors ${dragOver ? 'bg-indigo-100' : 'bg-gray-100'}`}>
              <ImageIcon size={24} className={dragOver ? 'text-indigo-500' : 'text-gray-400'} />
            </div>
            <p className="text-sm font-medium text-gray-700">
              Drop X-ray images here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Accepts JPG, PNG, and other image formats (up to 20 MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        ) : (
          /* ─── File selected — show preview + metadata form ─── */
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Preview thumbnail */}
            <div className="relative flex-shrink-0">
              <div className="w-full sm:w-48 h-36 rounded-xl overflow-hidden bg-gray-900 border border-gray-200">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileImage size={32} className="text-gray-500" />
                  </div>
                )}
              </div>
              <button
                onClick={clearSelection}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md border border-gray-200 hover:bg-red-50 transition-colors"
              >
                <X size={14} className="text-gray-500" />
              </button>
              <p className="text-xs text-gray-400 mt-1 truncate max-w-[12rem]">
                {selectedFile.name}
              </p>
            </div>

            {/* Metadata form */}
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Patient</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="input text-sm"
                >
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">X-Ray Type</label>
                <select
                  value={xrayType}
                  onChange={(e) => setXrayType(e.target.value)}
                  className="input text-sm"
                >
                  {XRAY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload progress */}
              {uploading && (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Uploading and analyzing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploading || !patientId}
                className="btn-primary text-sm w-full sm:w-auto"
              >
                {uploading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scan size={14} />
                    Upload &amp; Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RadiographsPage() {
  const [studies, setStudies] = useState<RadiographStudy[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RadiographStudy | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [marking, setMarking] = useState(false);
  const [showFindings, setShowFindings] = useState(true);
  const [filterPatient, setFilterPatient] = useState<Patient | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const patientId = searchParams.get('patient');
    if (patientId) {
      getPatient(patientId).then(setFilterPatient).catch(() => {});
    }
  }, [searchParams]);

  const loadStudies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRadiographs();
      setStudies(result.studies);
    } catch {
      setStudies(MOCK_RADIOGRAPHS);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPatients = useCallback(async () => {
    try {
      const result = await getPatients();
      setPatients(result.patients);
    } catch {
      setPatients(MOCK_PATIENTS);
    }
  }, []);

  useEffect(() => {
    loadStudies();
    loadPatients();
  }, [loadStudies, loadPatients]);

  function openStudy(study: RadiographStudy) {
    setSelected(study);
    setNotes(study.providerNotes ?? '');
    setShowFindings(true);
  }

  function handleUploaded(study: RadiographStudy) {
    setStudies((prev) => [study, ...prev]);
  }

  async function handleSaveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    try {
      await updateRadiographNotes(selected.id, notes);
      toast.success('Notes saved');
      setStudies((prev) => prev.map((s) => s.id === selected.id ? { ...s, providerNotes: notes } : s));
      setSelected((prev) => prev ? { ...prev, providerNotes: notes } : null);
    } catch {
      toast.success('Notes saved (demo mode)');
      setStudies((prev) => prev.map((s) => s.id === selected.id ? { ...s, providerNotes: notes } : s));
      setSelected((prev) => prev ? { ...prev, providerNotes: notes } : null);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleMarkReviewed() {
    if (!selected) return;
    setMarking(true);
    try {
      await markRadiographReviewed(selected.id);
      toast.success('Study marked as reviewed');
      const updated = { ...selected, reviewedBy: 'Dr. Mitchell', reviewedDate: new Date().toISOString() };
      setStudies((prev) => prev.map((s) => s.id === selected.id ? updated : s));
      setSelected(updated);
    } catch {
      toast.success('Marked as reviewed (demo mode)');
      const updated = { ...selected, reviewedBy: 'Dr. Mitchell', reviewedDate: new Date().toISOString() };
      setStudies((prev) => prev.map((s) => s.id === selected.id ? updated : s));
      setSelected(updated);
    } finally {
      setMarking(false);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  if (selected) {
    const findings = parsedFindings(selected.findings);
    const highFindings = findings.filter((f) => f.severity === 'high');
    const mediumFindings = findings.filter((f) => f.severity === 'medium');
    const hasRealImage = selected.imageUrl && selected.imageUrl.startsWith('/uploads/');

    return (
      <div>
        {/* Back button & header badges */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setSelected(null)} className="btn-ghost text-sm">
            <ChevronLeft size={15} /> Back to all radiographs
          </button>
          <div className="flex items-center gap-2">
            <span className="badge bg-gray-100 text-gray-600 capitalize">{selected.type}</span>
            {selected.reviewedDate ? (
              <span className="badge bg-green-50 text-green-700 flex items-center gap-1">
                <CheckCircle size={10} /> Reviewed
              </span>
            ) : (
              <span className="badge bg-amber-50 text-amber-700">Needs Review</span>
            )}
          </div>
        </div>

        {/* Disclaimer banner */}
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-800">
              DEMO — Simulated AI Analysis
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              These findings are computer-generated for demonstration purposes and are not diagnostic. All findings must be verified by a licensed provider.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* ── Left: Image + Notes ── */}
          <div className="xl:col-span-3 space-y-4">
            {/* Image viewer card */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {selected.patient && (
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold">
                        {getInitials(selected.patient.firstName, selected.patient.lastName)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {selected.patient
                        ? `${selected.patient.firstName} ${selected.patient.lastName}`
                        : 'Unknown Patient'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selected.type.charAt(0).toUpperCase() + selected.type.slice(1)} · {formatDate(selected.date)}
                    </p>
                  </div>
                </div>
                {!selected.reviewedDate ? (
                  <button
                    onClick={handleMarkReviewed}
                    disabled={marking}
                    className="btn-primary text-xs"
                  >
                    {marking ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Mark as Reviewed
                  </button>
                ) : (
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle size={14} />
                      <span className="text-xs font-semibold">Reviewed</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {selected.reviewedBy} · {formatDate(selected.reviewedDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* X-ray image area */}
              <div className="relative rounded-lg overflow-hidden" style={{ height: 340 }}>
                {hasRealImage ? (
                  <img
                    src={imageUrlFull(selected.imageUrl)}
                    alt={`${selected.type} X-ray`}
                    className="w-full h-full object-contain bg-gray-900 rounded-lg"
                  />
                ) : (
                  <XRayPlaceholder type={selected.type} />
                )}
                {highFindings.length > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
                    {highFindings.length} High Severity
                  </div>
                )}
              </div>
            </div>

            {/* Provider Notes card */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Provider Notes</h3>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add clinical observations or treatment recommendations..."
                className="input resize-none leading-relaxed text-sm"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="btn-primary text-xs"
                >
                  {savingNotes ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save Notes
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: AI Findings ── */}
          <div className="xl:col-span-2">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  AI Findings
                  <span className="ml-2 text-xs font-normal text-gray-400">({findings.length})</span>
                </h3>
                <button
                  onClick={() => setShowFindings((v) => !v)}
                  className="btn-ghost text-xs"
                >
                  {showFindings ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showFindings ? 'Hide' : 'Show'}
                </button>
              </div>

              {/* Summary bar */}
              {showFindings && findings.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-600">
                    AI detected <span className="font-semibold text-gray-900">{findings.length} finding{findings.length !== 1 ? 's' : ''}</span>
                    {highFindings.length > 0 && (
                      <span className="text-red-600 font-semibold">
                        : {highFindings.length} critical
                      </span>
                    )}
                    {mediumFindings.length > 0 && (
                      <span className="text-amber-600 font-semibold">
                        {highFindings.length > 0 ? ', ' : ': '}{mediumFindings.length} moderate
                      </span>
                    )}
                  </p>
                </div>
              )}

              {!showFindings ? (
                <p className="text-sm text-gray-400 py-4 text-center">Findings hidden</p>
              ) : findings.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle size={24} className="mx-auto text-green-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">No significant findings</p>
                  <p className="text-xs text-gray-400 mt-1">AI analysis did not detect any concerns</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {findings.map((finding) => (
                    <div
                      key={finding.id}
                      className="p-3 rounded-xl bg-white border border-gray-100 shadow-sm"
                    >
                      {/* Category badge + description */}
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${categoryColor(finding.category)}`}>
                          {categoryIcon(finding.category)} {finding.category.replace('_', ' ')}
                        </span>
                        {finding.tooth && (
                          <span className="flex-shrink-0 text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            🦷 #{finding.tooth}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-800 leading-snug mb-2">
                        {finding.description}
                      </p>

                      {/* Severity badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${severityColor(finding.severity)}`}>
                          {severityLabel(finding.severity)} Severity
                        </span>
                      </div>

                      {/* Confidence bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-16">Confidence</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${confidenceColor(finding.confidence)}`}
                            style={{ width: `${finding.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 w-8 text-right font-mono">
                          {Math.round(finding.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayedStudies = filterPatient
    ? studies.filter((s) => s.patientId === filterPatient.id)
    : studies;

  // ══════════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div>
      <PageHeader
        title="Radiograph Review"
        subtitle="Upload and review X-rays with AI-assisted findings"
      />

      {/* Upload area */}
      <UploadArea patients={patients} onUploaded={handleUploaded} />

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

      {/* Content */}
      {loading ? (
        <FullPageSpinner />
      ) : displayedStudies.length === 0 ? (
        /* ── Empty state ── */
        <div className="card">
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="mb-4 p-4 rounded-full bg-indigo-50 text-indigo-400">
              <Scan size={28} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No X-rays uploaded yet</h3>
            <p className="mt-1.5 text-sm text-gray-500 max-w-sm">
              Upload your first radiograph above to see AI-assisted findings. The AI will analyze the image and highlight areas of concern.
            </p>
          </div>
        </div>
      ) : (
        /* ── Card grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayedStudies.map((study) => {
            const findings = parsedFindings(study.findings);
            const highCount = findings.filter((f) => f.severity === 'high').length;

            return (
              <div
                key={study.id}
                onClick={() => openStudy(study)}
                className="card cursor-pointer hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                {/* Image thumbnail */}
                <Thumbnail study={study} />

                {/* Card body */}
                <div className="p-4">
                  {/* Patient name + date */}
                  <div className="flex items-center gap-2 mb-2">
                    {study.patient && (
                      <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-semibold">
                          {getInitials(study.patient.firstName, study.patient.lastName)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {study.patient
                          ? `${study.patient.firstName} ${study.patient.lastName}`
                          : 'Unknown'}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatDate(study.date)}</p>
                    </div>
                  </div>

                  {/* Type + findings + review status */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="badge bg-gray-100 text-gray-600 text-[10px] capitalize">
                      {study.type}
                    </span>

                    {findings.length > 0 ? (
                      <span className={`badge text-[10px] ${highCount > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {findings.length} finding{findings.length !== 1 ? 's' : ''}
                        {highCount > 0 ? ` (${highCount} high)` : ''}
                      </span>
                    ) : (
                      <span className="badge bg-green-50 text-green-600 text-[10px]">
                        No findings
                      </span>
                    )}

                    {study.reviewedDate ? (
                      <span className="badge bg-green-50 text-green-700 text-[10px] flex items-center gap-0.5">
                        <CheckCircle size={8} /> Reviewed
                      </span>
                    ) : (
                      <span className="badge bg-amber-50 text-amber-700 text-[10px]">
                        Needs Review
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
