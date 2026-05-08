// ─── Compliance Autopilot Engine ─────────────────────────────────────────────
// In-memory compliance task management, training records, audit reports,
// and scoring for OSHA / HIPAA / Infection Control / State-Regulatory.

import { logActivity } from './activity';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ComplianceCategory = 'hipaa' | 'osha' | 'infection_control' | 'state_regulatory';
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
export type TaskStatus = 'compliant' | 'due_soon' | 'overdue' | 'not_started';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TrainingStatus = 'current' | 'expiring_soon' | 'expired';

export interface ComplianceTask {
  id: string;
  title: string;
  category: ComplianceCategory;
  description: string;
  frequency: TaskFrequency;
  lastCompleted: string | null;
  nextDue: string;
  status: TaskStatus;
  assignee: string;
  notes: string;
  evidence: string;
  priority: TaskPriority;
}

export interface TrainingRecord {
  id: string;
  staffName: string;
  staffRole: string;
  trainingType: string;
  completedDate: string;
  expiryDate: string;
  certificateRef: string;
  status: TrainingStatus;
}

export interface AuditReport {
  id: string;
  type: string;
  generatedAt: string;
  overallScore: number;
  categoryScores: Record<string, number>;
  sections: AuditSection[];
}

export interface AuditSection {
  category: string;
  tasks: AuditTaskEntry[];
  score: number;
}

export interface AuditTaskEntry {
  title: string;
  status: TaskStatus;
  lastCompleted: string | null;
  nextDue: string;
  evidence: string;
  priority: TaskPriority;
}

export interface ExpiryAlert {
  id: string;
  type: 'task' | 'training';
  title: string;
  category: string;
  dueDate: string;
  daysUntilDue: number;
  urgency: '30_days' | '60_days' | '90_days';
  assignee: string;
}

export interface ComplianceDashboard {
  overallScore: number;
  categoryScores: Record<ComplianceCategory, number>;
  totalTasks: number;
  compliantCount: number;
  dueSoonCount: number;
  overdueCount: number;
  notStartedCount: number;
  expiringTrainingCount: number;
  expiredTrainingCount: number;
  recentAudits: AuditReport[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let nextId = 100;
function genId(prefix: string): string {
  return `${prefix}-${++nextId}`;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

function frequencyDays(freq: TaskFrequency): number {
  switch (freq) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'semi_annual': return 182;
    case 'annual': return 365;
  }
}

function calculateNextDue(lastCompleted: string, frequency: TaskFrequency): string {
  const d = new Date(lastCompleted);
  d.setDate(d.getDate() + frequencyDays(frequency));
  return d.toISOString().split('T')[0];
}

function computeTaskStatus(task: { lastCompleted: string | null; nextDue: string }): TaskStatus {
  if (!task.lastCompleted) return 'not_started';
  const now = new Date(today());
  const due = new Date(task.nextDue);
  const diff = daysBetween(today(), task.nextDue);
  if (diff < 0) return 'overdue';
  if (diff <= 30) return 'due_soon';
  return 'compliant';
}

function computeTrainingStatus(rec: { expiryDate: string }): TrainingStatus {
  const diff = daysBetween(today(), rec.expiryDate);
  if (diff < 0) return 'expired';
  if (diff <= 60) return 'expiring_soon';
  return 'current';
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ─── In-memory data stores ───────────────────────────────────────────────────

const complianceTasks: ComplianceTask[] = [];
const trainingRecords: TrainingRecord[] = [];
const auditHistory: AuditReport[] = [];

// ─── Seed compliance tasks (40+) ────────────────────────────────────────────

function seedTasks(): void {
  const raw: Omit<ComplianceTask, 'id' | 'status'>[] = [
    // ── HIPAA (10) ───────────────────────────────────────────
    { title: 'Annual HIPAA Risk Assessment', category: 'hipaa', description: 'Conduct comprehensive risk analysis identifying threats to ePHI confidentiality, integrity, and availability per 45 CFR 164.308(a)(1)(ii)(A).', frequency: 'annual', lastCompleted: daysAgo(340), nextDue: daysFromNow(25), assignee: 'Dr. Sarah Chen', notes: 'Use OCR SRA Tool for documentation', evidence: 'Risk assessment report filed in compliance binder', priority: 'critical' },
    { title: 'Privacy Policy Review & Update', category: 'hipaa', description: 'Review and update Notice of Privacy Practices (NPP) to reflect current data handling procedures and any regulatory changes.', frequency: 'annual', lastCompleted: daysAgo(300), nextDue: daysFromNow(65), assignee: 'Lisa Park', notes: 'Check for state law changes', evidence: 'Updated NPP document v2024', priority: 'high' },
    { title: 'Business Associate Agreements Review', category: 'hipaa', description: 'Review all BAAs with vendors who handle PHI (labs, billing services, IT, cloud storage). Ensure all are current and compliant.', frequency: 'annual', lastCompleted: daysAgo(280), nextDue: daysFromNow(85), assignee: 'Lisa Park', notes: 'Includes lab, billing company, IT managed services, cloud backup', evidence: 'BAA tracking spreadsheet', priority: 'high' },
    { title: 'Patient Rights Notice Posting Verification', category: 'hipaa', description: 'Verify that patient rights notices are prominently displayed in waiting area and exam rooms. Confirm copies available at front desk.', frequency: 'quarterly', lastCompleted: daysAgo(80), nextDue: daysFromNow(10), assignee: 'Lisa Park', notes: 'Check English and Spanish versions', evidence: 'Verification checklist with photos', priority: 'medium' },
    { title: 'Breach Notification Procedures Test', category: 'hipaa', description: 'Conduct tabletop exercise simulating a PHI breach. Test notification procedures, timelines, and documentation per HITECH Act requirements.', frequency: 'annual', lastCompleted: daysAgo(200), nextDue: daysFromNow(165), assignee: 'Dr. Sarah Chen', notes: 'Include scenario with lost laptop', evidence: 'Tabletop exercise report and action items', priority: 'high' },
    { title: 'Minimum Necessary Standard Training', category: 'hipaa', description: 'Train all staff on minimum necessary principle — only access/disclose PHI needed for their job function.', frequency: 'annual', lastCompleted: daysAgo(350), nextDue: daysFromNow(15), assignee: 'Dr. Sarah Chen', notes: 'Role-based access refresher', evidence: 'Training sign-in sheets', priority: 'high' },
    { title: 'Electronic PHI Access Audit', category: 'hipaa', description: 'Review EHR access logs for unauthorized access, unusual patterns, or policy violations. Document findings and corrective actions.', frequency: 'quarterly', lastCompleted: daysAgo(95), nextDue: daysFromNow(-5), assignee: 'Dr. James Wilson', notes: 'Check after-hours access patterns', evidence: 'Access audit log report', priority: 'critical' },
    { title: 'Workstation Security Assessment', category: 'hipaa', description: 'Assess physical and technical safeguards for all workstations with ePHI access. Verify screen locks, encryption, and physical placement.', frequency: 'semi_annual', lastCompleted: daysAgo(160), nextDue: daysFromNow(22), assignee: 'Dr. James Wilson', notes: 'Include laptops and tablets', evidence: 'Workstation security checklist', priority: 'high' },
    { title: 'Patient Authorization Form Review', category: 'hipaa', description: 'Review patient authorization forms for PHI use/disclosure. Ensure they meet all required elements under HIPAA Privacy Rule.', frequency: 'annual', lastCompleted: daysAgo(250), nextDue: daysFromNow(115), assignee: 'Lisa Park', notes: 'Include research and marketing authorizations', evidence: 'Updated authorization templates', priority: 'medium' },
    { title: 'Designated HIPAA Privacy Officer Documentation', category: 'hipaa', description: 'Maintain current documentation of designated Privacy Officer and Security Officer appointments. Update if personnel change.', frequency: 'annual', lastCompleted: daysAgo(180), nextDue: daysFromNow(185), assignee: 'Dr. Sarah Chen', notes: 'Dr. Chen serves as both currently', evidence: 'Officer designation letters on file', priority: 'medium' },

    // ── OSHA (10) ────────────────────────────────────────────
    { title: 'Bloodborne Pathogens Exposure Control Plan Update', category: 'osha', description: 'Review and update the Exposure Control Plan (ECP) per OSHA 29 CFR 1910.1030. Include new procedures, devices, and exposure incidents.', frequency: 'annual', lastCompleted: daysAgo(370), nextDue: daysFromNow(-5), assignee: 'Maria Rodriguez', notes: 'Must reflect new safety-engineered devices', evidence: 'Updated ECP document', priority: 'critical' },
    { title: 'Hazard Communication Program Review (GHS)', category: 'osha', description: 'Review HazCom program compliance with GHS-aligned standards. Verify all chemical containers labeled and SDS sheets accessible.', frequency: 'annual', lastCompleted: daysAgo(320), nextDue: daysFromNow(45), assignee: 'Maria Rodriguez', notes: 'New chemicals added: Cavicide, Birex SE', evidence: 'Updated chemical inventory list', priority: 'high' },
    { title: 'Fire Extinguisher Inspection', category: 'osha', description: 'Monthly visual inspection of all fire extinguishers. Check charge, accessibility, signage, and maintenance tags.', frequency: 'monthly', lastCompleted: daysAgo(35), nextDue: daysFromNow(-5), assignee: 'Maria Rodriguez', notes: '4 extinguishers: lobby, operatory hall, lab, break room', evidence: 'Monthly inspection tags initialed', priority: 'high' },
    { title: 'Emergency Exit Inspection', category: 'osha', description: 'Inspect all emergency exits for clear pathways, proper signage, functioning illuminated exit signs, and unlocked doors during business hours.', frequency: 'monthly', lastCompleted: daysAgo(28), nextDue: daysFromNow(2), assignee: 'Maria Rodriguez', notes: '3 exits: front, side, rear', evidence: 'Exit inspection log', priority: 'high' },
    { title: 'Eyewash Station Testing', category: 'osha', description: 'Flush eyewash stations for 3 minutes to verify proper operation and clear stagnant water from supply lines.', frequency: 'weekly', lastCompleted: daysAgo(8), nextDue: daysFromNow(-1), assignee: 'Jennifer Adams', notes: '2 stations: lab and sterilization room', evidence: 'Weekly flush log', priority: 'high' },
    { title: 'Sharps Container Replacement Log', category: 'osha', description: 'Monitor and document sharps container fill levels. Replace when 3/4 full. Log disposal through licensed waste hauler.', frequency: 'monthly', lastCompleted: daysAgo(20), nextDue: daysFromNow(10), assignee: 'Jennifer Adams', notes: '6 containers across operatories', evidence: 'Sharps disposal manifests', priority: 'high' },
    { title: 'Chemical Inventory (SDS Sheets) Update', category: 'osha', description: 'Update Safety Data Sheet binder with any new chemicals. Remove discontinued products. Verify electronic SDS access.', frequency: 'annual', lastCompleted: daysAgo(290), nextDue: daysFromNow(75), assignee: 'Maria Rodriguez', notes: '47 chemicals currently inventoried', evidence: 'SDS binder index updated', priority: 'medium' },
    { title: 'Personal Protective Equipment Assessment', category: 'osha', description: 'Assess PPE adequacy for all job classifications. Evaluate gloves, eyewear, masks, gowns. Document hazard assessment per OSHA 1910.132.', frequency: 'annual', lastCompleted: daysAgo(310), nextDue: daysFromNow(55), assignee: 'Dr. Sarah Chen', notes: 'Include fit testing for N95 respirators', evidence: 'PPE hazard assessment worksheet', priority: 'medium' },
    { title: 'Injury and Illness Prevention Program Review', category: 'osha', description: 'Review IIPP for completeness. Update hazard identification, correction procedures, training records, and incident investigation procedures.', frequency: 'annual', lastCompleted: daysAgo(330), nextDue: daysFromNow(35), assignee: 'Dr. Sarah Chen', notes: 'Zero recordable incidents this year', evidence: 'IIPP manual current version', priority: 'medium' },
    { title: 'Workplace Hazard Assessment Walkthrough', category: 'osha', description: 'Conduct quarterly walkthrough of all areas identifying slip/trip/fall hazards, electrical hazards, ergonomic issues, and chemical storage.', frequency: 'quarterly', lastCompleted: daysAgo(100), nextDue: daysFromNow(-10), assignee: 'Maria Rodriguez', notes: 'Use standardized checklist', evidence: 'Walkthrough report with corrective actions', priority: 'medium' },

    // ── Infection Control (10) ───────────────────────────────
    { title: 'Sterilizer (Autoclave) Spore Testing', category: 'infection_control', description: 'Perform biological monitoring (spore test) on each sterilizer. Use Geobacillus stearothermophilus BI. Document results.', frequency: 'weekly', lastCompleted: daysAgo(5), nextDue: daysFromNow(2), assignee: 'Jennifer Adams', notes: '2 autoclaves: Statim and Midmark M11', evidence: 'Spore test results log (all negative)', priority: 'critical' },
    { title: 'Instrument Processing Validation', category: 'infection_control', description: 'Validate entire instrument reprocessing workflow: cleaning, packaging, sterilization, storage. Ensure compliance with CDC guidelines.', frequency: 'monthly', lastCompleted: daysAgo(25), nextDue: daysFromNow(5), assignee: 'Jennifer Adams', notes: 'Include ultrasonic cleaner verification', evidence: 'Processing validation checklist', priority: 'critical' },
    { title: 'Dental Unit Waterline Testing', category: 'infection_control', description: 'Test dental unit waterlines for heterotrophic bacteria. Must be below 500 CFU/mL per CDC/ADA recommendations.', frequency: 'quarterly', lastCompleted: daysAgo(70), nextDue: daysFromNow(20), assignee: 'Maria Rodriguez', notes: '4 operatories + hygiene rooms', evidence: 'Water test lab results', priority: 'critical' },
    { title: 'Surface Disinfection Protocol Review', category: 'infection_control', description: 'Review and update surface disinfection protocols. Verify proper contact times, approved products, and staff compliance.', frequency: 'annual', lastCompleted: daysAgo(240), nextDue: daysFromNow(125), assignee: 'Maria Rodriguez', notes: 'Using CaviCide and barrier techniques', evidence: 'Updated disinfection protocol document', priority: 'high' },
    { title: 'Hand Hygiene Compliance Audit', category: 'infection_control', description: 'Observe and document hand hygiene compliance among all clinical staff. Target: >95% compliance rate.', frequency: 'quarterly', lastCompleted: daysAgo(60), nextDue: daysFromNow(30), assignee: 'Dr. Sarah Chen', notes: 'Last audit: 92% compliance', evidence: 'Hand hygiene observation forms', priority: 'high' },
    { title: 'Dental Aerosol Management Protocol Review', category: 'infection_control', description: 'Review aerosol-generating procedure protocols including HVE use, pre-procedural rinse, and air filtration requirements.', frequency: 'semi_annual', lastCompleted: daysAgo(150), nextDue: daysFromNow(32), assignee: 'Dr. James Wilson', notes: 'HEPA filters in all operatories', evidence: 'Aerosol management SOP', priority: 'high' },
    { title: 'PPE Donning/Doffing Competency Check', category: 'infection_control', description: 'Observe clinical staff demonstrating proper PPE donning and doffing sequence. Document competency for each team member.', frequency: 'semi_annual', lastCompleted: daysAgo(140), nextDue: daysFromNow(42), assignee: 'Maria Rodriguez', notes: 'All 5 clinical staff', evidence: 'Competency checklists signed', priority: 'medium' },
    { title: 'Sterilization Area Maintenance Inspection', category: 'infection_control', description: 'Inspect sterilization area for proper workflow (dirty-to-clean), ventilation, and equipment maintenance needs.', frequency: 'monthly', lastCompleted: daysAgo(32), nextDue: daysFromNow(-2), assignee: 'Jennifer Adams', notes: 'Unidirectional workflow maintained', evidence: 'Sterilization area inspection form', priority: 'medium' },
    { title: 'Single-Use Device Compliance Check', category: 'infection_control', description: 'Audit that single-use/disposable items are not being reprocessed or reused. Verify inventory procedures support single-use protocol.', frequency: 'quarterly', lastCompleted: daysAgo(85), nextDue: daysFromNow(5), assignee: 'Jennifer Adams', notes: 'Focus on burs, prophy angles, suction tips', evidence: 'Single-use device audit report', priority: 'medium' },
    { title: 'Infection Control Manual Annual Review', category: 'infection_control', description: 'Comprehensive annual review of entire infection control manual. Update per latest CDC, OSAP, and ADA guidelines.', frequency: 'annual', lastCompleted: daysAgo(335), nextDue: daysFromNow(30), assignee: 'Dr. Sarah Chen', notes: 'Reference CDC Summary 2016 + updates', evidence: 'Infection control manual revision log', priority: 'high' },

    // ── State/Regulatory (11) ────────────────────────────────
    { title: 'DEA Controlled Substances Inventory', category: 'state_regulatory', description: 'Conduct biennial inventory of all Schedule II-V controlled substances. Reconcile with dispensing/administration records.', frequency: 'annual', lastCompleted: daysAgo(200), nextDue: daysFromNow(165), assignee: 'Dr. Sarah Chen', notes: 'Nitrous oxide, local anesthetics with epi', evidence: 'DEA inventory forms', priority: 'critical' },
    { title: 'State Dental Board License Renewal Tracking', category: 'state_regulatory', description: 'Track license renewal dates for all dentists. Verify CE requirements met and renewals submitted before expiration.', frequency: 'annual', lastCompleted: daysAgo(180), nextDue: daysFromNow(185), assignee: 'Lisa Park', notes: 'Dr. Chen: June, Dr. Wilson: September', evidence: 'License copies on file', priority: 'critical' },
    { title: 'Dental Assistant Certification Tracking', category: 'state_regulatory', description: 'Track certification and registration renewal for dental assistants. Ensure expanded function certifications are current.', frequency: 'annual', lastCompleted: daysAgo(200), nextDue: daysFromNow(165), assignee: 'Lisa Park', notes: 'Jennifer Adams - RDA expires Dec 2026', evidence: 'Certification copies in HR file', priority: 'high' },
    { title: 'Radiation Safety Compliance Review', category: 'state_regulatory', description: 'Review radiation safety program: equipment inspection, lead apron testing, dosimetry reports, restricted area signage, and operator training.', frequency: 'annual', lastCompleted: daysAgo(270), nextDue: daysFromNow(95), assignee: 'Dr. James Wilson', notes: 'Digital sensors + panoramic unit', evidence: 'Radiation safety survey report', priority: 'high' },
    { title: 'Sedation Permit Renewal Tracking', category: 'state_regulatory', description: 'Track sedation/anesthesia permit renewal dates. Ensure facility inspections, equipment checks, and emergency protocols are current.', frequency: 'annual', lastCompleted: daysAgo(240), nextDue: daysFromNow(125), assignee: 'Dr. Sarah Chen', notes: 'Minimal sedation (N2O) permit only', evidence: 'Sedation permit certificate', priority: 'high' },
    { title: 'Continuing Education Hours Tracking', category: 'state_regulatory', description: 'Track CE hours for all licensed staff. Verify compliance with state-mandated topics (infection control, ethics, opioid prescribing).', frequency: 'quarterly', lastCompleted: daysAgo(50), nextDue: daysFromNow(40), assignee: 'Lisa Park', notes: 'State requires 40hrs/2yr for DDS, 24hrs for RDH', evidence: 'CE tracking spreadsheet', priority: 'medium' },
    { title: 'Medical Emergency Preparedness Drill', category: 'state_regulatory', description: 'Conduct medical emergency simulation drill. Test emergency kit, oxygen delivery, AED, and team response protocols.', frequency: 'quarterly', lastCompleted: daysAgo(75), nextDue: daysFromNow(15), assignee: 'Dr. James Wilson', notes: 'Scenario: anaphylaxis during procedure', evidence: 'Drill evaluation form', priority: 'high' },
    { title: 'Emergency Drug Kit Inspection', category: 'state_regulatory', description: 'Inspect emergency drug kit: verify all medications present, within expiration dates, and stored properly.', frequency: 'monthly', lastCompleted: daysAgo(22), nextDue: daysFromNow(8), assignee: 'Maria Rodriguez', notes: 'Includes epinephrine, nitroglycerin, diphenhydramine, aspirin, glucose, oxygen', evidence: 'Drug kit inspection log', priority: 'critical' },
    { title: 'OSHA 300 Log Review & Posting', category: 'state_regulatory', description: 'Review OSHA Form 300 injury/illness log. Post OSHA 300A summary Feb 1-Apr 30. File records retention per requirements.', frequency: 'annual', lastCompleted: daysAgo(90), nextDue: daysFromNow(275), assignee: 'Lisa Park', notes: 'Zero incidents to record this year', evidence: 'OSHA 300/300A forms filed', priority: 'medium' },
    { title: 'Dental Practice Act Compliance Review', category: 'state_regulatory', description: 'Review current state Dental Practice Act for changes. Ensure scope-of-practice compliance for all team members.', frequency: 'annual', lastCompleted: daysAgo(260), nextDue: daysFromNow(105), assignee: 'Dr. Sarah Chen', notes: 'Check legislative updates from state board', evidence: 'Practice act review notes', priority: 'medium' },
    { title: 'AED Inspection & Maintenance', category: 'state_regulatory', description: 'Inspect AED unit: verify battery status, pad expiration, readiness indicators, and signage. Document monthly per manufacturer specs.', frequency: 'monthly', lastCompleted: daysAgo(15), nextDue: daysFromNow(15), assignee: 'Jennifer Adams', notes: 'Philips HeartStart FRx', evidence: 'AED inspection log', priority: 'high' },
  ];

  for (const t of raw) {
    const task: ComplianceTask = {
      ...t,
      id: genId('ct'),
      status: computeTaskStatus(t),
    };
    complianceTasks.push(task);
  }
}

// ─── Seed training records ───────────────────────────────────────────────────

function seedTraining(): void {
  const staff: { name: string; role: string }[] = [
    { name: 'Dr. Sarah Chen', role: 'Dentist (Owner)' },
    { name: 'Dr. James Wilson', role: 'Associate Dentist' },
    { name: 'Emily Nguyen', role: 'Dental Hygienist' },
    { name: 'Rachel Thompson', role: 'Dental Hygienist' },
    { name: 'Jennifer Adams', role: 'Dental Assistant (RDA)' },
    { name: 'Lisa Park', role: 'Front Desk / Office Manager' },
  ];

  const trainings: { type: string; validYears: number }[] = [
    { type: 'HIPAA Privacy & Security', validYears: 1 },
    { type: 'OSHA Bloodborne Pathogens', validYears: 1 },
    { type: 'BLS/CPR Certification', validYears: 2 },
    { type: 'Radiation Safety', validYears: 2 },
    { type: 'Infection Control', validYears: 1 },
  ];

  for (const s of staff) {
    for (const t of trainings) {
      // Skip radiation safety for front desk
      if (t.type === 'Radiation Safety' && s.role.includes('Front Desk')) continue;

      // Vary completion dates for realism
      const baseOffset = Math.floor(Math.random() * 120) + 200; // 200-320 days ago
      const completedDate = daysAgo(baseOffset);
      const expiryDate = (() => {
        const d = new Date(completedDate);
        d.setFullYear(d.getFullYear() + t.validYears);
        return d.toISOString().split('T')[0];
      })();

      const rec: TrainingRecord = {
        id: genId('tr'),
        staffName: s.name,
        staffRole: s.role,
        trainingType: t.type,
        completedDate,
        expiryDate,
        certificateRef: `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: computeTrainingStatus({ expiryDate }),
      };
      trainingRecords.push(rec);
    }
  }

  // Make some records expiring soon or expired for realism
  if (trainingRecords.length >= 5) {
    trainingRecords[0].expiryDate = daysFromNow(20);
    trainingRecords[0].status = 'expiring_soon';
    trainingRecords[3].expiryDate = daysFromNow(45);
    trainingRecords[3].status = 'expiring_soon';
    trainingRecords[7].expiryDate = daysAgo(15);
    trainingRecords[7].status = 'expired';
    trainingRecords[12].expiryDate = daysFromNow(55);
    trainingRecords[12].status = 'expiring_soon';
    trainingRecords[18].expiryDate = daysAgo(5);
    trainingRecords[18].status = 'expired';
  }
}

// ─── Initialize data ─────────────────────────────────────────────────────────

seedTasks();
seedTraining();

// ─── Exported service functions ──────────────────────────────────────────────

export function getComplianceTasks(filters?: {
  category?: ComplianceCategory;
  status?: TaskStatus;
}): ComplianceTask[] {
  let result = [...complianceTasks];

  // Recompute status on each read so it stays current
  for (const t of result) {
    t.status = computeTaskStatus(t);
  }

  if (filters?.category) {
    result = result.filter((t) => t.category === filters.category);
  }
  if (filters?.status) {
    result = result.filter((t) => t.status === filters.status);
  }

  return result;
}

export function createTask(data: Omit<ComplianceTask, 'id' | 'status'>): ComplianceTask {
  const task: ComplianceTask = {
    ...data,
    id: genId('ct'),
    status: computeTaskStatus(data),
  };
  complianceTasks.push(task);
  return task;
}

export function updateTask(
  id: string,
  data: Partial<Omit<ComplianceTask, 'id'>>,
): ComplianceTask | null {
  const idx = complianceTasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const updated = { ...complianceTasks[idx], ...data };
  updated.status = computeTaskStatus(updated);
  complianceTasks[idx] = updated;
  return updated;
}

export function completeTask(
  id: string,
  completionDate: string,
  evidenceNotes?: string,
): ComplianceTask | null {
  const idx = complianceTasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;

  const task = complianceTasks[idx];
  const updated: ComplianceTask = {
    ...task,
    lastCompleted: completionDate,
    nextDue: calculateNextDue(completionDate, task.frequency),
    evidence: evidenceNotes ?? task.evidence,
    status: 'compliant',
  };
  // Recompute to get accurate status
  updated.status = computeTaskStatus(updated);
  complianceTasks[idx] = updated;
  return updated;
}

export function getTrainingRecords(filters?: {
  staffName?: string;
}): TrainingRecord[] {
  let result = [...trainingRecords];

  // Recompute status
  for (const r of result) {
    r.status = computeTrainingStatus(r);
  }

  if (filters?.staffName) {
    result = result.filter((r) =>
      r.staffName.toLowerCase().includes(filters.staffName!.toLowerCase()),
    );
  }

  return result;
}

export function addTrainingRecord(
  data: Omit<TrainingRecord, 'id' | 'status'>,
): TrainingRecord {
  const rec: TrainingRecord = {
    ...data,
    id: genId('tr'),
    status: computeTrainingStatus(data),
  };
  trainingRecords.push(rec);
  return rec;
}

export function updateTrainingRecord(
  id: string,
  data: Partial<Omit<TrainingRecord, 'id'>>,
): TrainingRecord | null {
  const idx = trainingRecords.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const updated = { ...trainingRecords[idx], ...data };
  updated.status = computeTrainingStatus(updated);
  trainingRecords[idx] = updated;
  return updated;
}

export function getExpiryAlerts(): ExpiryAlert[] {
  const alerts: ExpiryAlert[] = [];
  const now = today();

  // Task expirations
  for (const task of complianceTasks) {
    const diff = daysBetween(now, task.nextDue);
    if (diff >= 0 && diff <= 90) {
      const urgency: ExpiryAlert['urgency'] = diff <= 30 ? '30_days' : diff <= 60 ? '60_days' : '90_days';
      alerts.push({
        id: `alert-${task.id}`,
        type: 'task',
        title: task.title,
        category: task.category,
        dueDate: task.nextDue,
        daysUntilDue: diff,
        urgency,
        assignee: task.assignee,
      });
    }
  }

  // Training expirations
  for (const rec of trainingRecords) {
    const diff = daysBetween(now, rec.expiryDate);
    if (diff >= 0 && diff <= 90) {
      const urgency: ExpiryAlert['urgency'] = diff <= 30 ? '30_days' : diff <= 60 ? '60_days' : '90_days';
      alerts.push({
        id: `alert-${rec.id}`,
        type: 'training',
        title: `${rec.staffName} - ${rec.trainingType}`,
        category: 'training',
        dueDate: rec.expiryDate,
        daysUntilDue: diff,
        urgency,
        assignee: rec.staffName,
      });
    }
  }

  // Sort by soonest due
  alerts.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  return alerts;
}

export function generateAuditReport(type: string): AuditReport {
  const categories: ComplianceCategory[] =
    type === 'full'
      ? ['hipaa', 'osha', 'infection_control', 'state_regulatory']
      : type === 'hipaa'
      ? ['hipaa']
      : type === 'osha'
      ? ['osha']
      : type === 'infection_control'
      ? ['infection_control']
      : ['hipaa', 'osha', 'infection_control', 'state_regulatory'];

  const sections: AuditSection[] = [];
  const categoryScores: Record<string, number> = {};

  for (const cat of categories) {
    const tasks = complianceTasks.filter((t) => t.category === cat);
    let weightedComplete = 0;
    let totalWeight = 0;

    const entries: AuditTaskEntry[] = tasks.map((t) => {
      const status = computeTaskStatus(t);
      const weight = PRIORITY_WEIGHT[t.priority];
      totalWeight += weight;
      if (status === 'compliant') weightedComplete += weight;
      else if (status === 'due_soon') weightedComplete += weight * 0.5;

      return {
        title: t.title,
        status,
        lastCompleted: t.lastCompleted,
        nextDue: t.nextDue,
        evidence: t.evidence,
        priority: t.priority,
      };
    });

    const score = totalWeight > 0 ? Math.round((weightedComplete / totalWeight) * 100) : 0;
    categoryScores[cat] = score;
    sections.push({ category: cat, tasks: entries, score });
  }

  const overallScore =
    sections.length > 0
      ? Math.round(sections.reduce((s, sec) => s + sec.score, 0) / sections.length)
      : 0;

  const report: AuditReport = {
    id: genId('audit'),
    type,
    generatedAt: new Date().toISOString(),
    overallScore,
    categoryScores,
    sections,
  };

  auditHistory.push(report);
  return report;
}

export function getAuditHistory(): AuditReport[] {
  return [...auditHistory].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime(),
  );
}

export function getComplianceScore(): {
  overall: number;
  byCategory: Record<ComplianceCategory, number>;
  byPriority: Record<TaskPriority, { total: number; compliant: number; score: number }>;
} {
  const categories: ComplianceCategory[] = ['hipaa', 'osha', 'infection_control', 'state_regulatory'];
  const byCategory = {} as Record<ComplianceCategory, number>;

  const byPriority = {} as Record<TaskPriority, { total: number; compliant: number; score: number }>;
  for (const p of ['critical', 'high', 'medium', 'low'] as TaskPriority[]) {
    byPriority[p] = { total: 0, compliant: 0, score: 0 };
  }

  let totalWeight = 0;
  let compliantWeight = 0;

  for (const cat of categories) {
    const tasks = complianceTasks.filter((t) => t.category === cat);
    let catWeight = 0;
    let catCompliant = 0;

    for (const t of tasks) {
      const status = computeTaskStatus(t);
      const w = PRIORITY_WEIGHT[t.priority];
      catWeight += w;
      totalWeight += w;

      byPriority[t.priority].total++;

      if (status === 'compliant') {
        catCompliant += w;
        compliantWeight += w;
        byPriority[t.priority].compliant++;
      } else if (status === 'due_soon') {
        catCompliant += w * 0.5;
        compliantWeight += w * 0.5;
      }
    }

    byCategory[cat] = catWeight > 0 ? Math.round((catCompliant / catWeight) * 100) : 0;
  }

  for (const p of Object.keys(byPriority) as TaskPriority[]) {
    const entry = byPriority[p];
    entry.score = entry.total > 0 ? Math.round((entry.compliant / entry.total) * 100) : 0;
  }

  return {
    overall: totalWeight > 0 ? Math.round((compliantWeight / totalWeight) * 100) : 0,
    byCategory,
    byPriority,
  };
}

export function getComplianceDashboard(): ComplianceDashboard {
  const tasks = getComplianceTasks();
  const training = getTrainingRecords();
  const score = getComplianceScore();

  return {
    overallScore: score.overall,
    categoryScores: score.byCategory,
    totalTasks: tasks.length,
    compliantCount: tasks.filter((t) => t.status === 'compliant').length,
    dueSoonCount: tasks.filter((t) => t.status === 'due_soon').length,
    overdueCount: tasks.filter((t) => t.status === 'overdue').length,
    notStartedCount: tasks.filter((t) => t.status === 'not_started').length,
    expiringTrainingCount: training.filter((r) => r.status === 'expiring_soon').length,
    expiredTrainingCount: training.filter((r) => r.status === 'expired').length,
    recentAudits: getAuditHistory().slice(0, 5),
  };
}
