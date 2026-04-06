export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  preferredContactMethod: 'email' | 'text' | 'phone';
  lastCleaningDate?: string | null;
  recallDueDate?: string | null;
  insuranceProvider?: string | null;
  memberId?: string | null;
  outstandingBalance: number;
  providerId?: string | null;
  createdAt: string;
  updatedAt: string;
  provider?: Provider | null;
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  time: string;
  duration: number;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string | null;
  patient?: Patient;
  provider?: Provider;
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  appointmentId: string;
  providerId: string;
  date: string;
  transcript?: string | null;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  status: 'draft' | 'pending_approval' | 'approved';
  procedureCode?: string | null;
  toothNumbers?: string | null;
  patient?: Patient;
  appointment?: Appointment;
  provider?: Provider;
}

export interface InsurancePlan {
  id: string;
  patientId: string;
  provider: string;
  memberId: string;
  groupNumber: string;
  deductible: number;
  deductibleMet: number;
  annualMax: number;
  annualUsed: number;
  verificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  verifiedDate?: string | null;
  coPayPreventive: number;
  coPayBasic: number;
  coPayMajor: number;
  patient?: Patient;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  insurancePlanId: string;
  appointmentId: string;
  claimDate: string;
  procedureCodes: string;
  totalAmount: number;
  narrative: string;
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'denied' | 'resubmit';
  submittedDate?: string | null;
  approvedAmount?: number | null;
  denialReason?: string | null;
  patient?: Patient;
  insurancePlan?: InsurancePlan;
}

export interface Balance {
  id: string;
  patientId: string;
  amount: number;
  dueDate: string;
  lastPaymentDate?: string | null;
  lastPaymentAmount?: number | null;
  statementSent: boolean;
  statementDate?: string | null;
  collectionStatus: 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'collections';
  notes?: string | null;
  patient?: Patient;
}

export interface RecallTask {
  id: string;
  patientId: string;
  lastHygieneDate: string;
  recallDueDate: string;
  daysOverdue: number;
  contactAttempts: number;
  lastContactDate?: string | null;
  status: 'pending' | 'contacted' | 'scheduled' | 'declined';
  suggestedMessage: string;
  patient?: Patient;
}

export interface RadiographFinding {
  id: string;
  description: string;
  tooth?: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  category: 'decay' | 'bone_loss' | 'calculus' | 'watch' | 'normal';
}

export interface RadiographStudy {
  id: string;
  patientId: string;
  date: string;
  type: 'bitewing' | 'periapical' | 'panoramic' | 'cephalometric';
  findings: RadiographFinding[] | string;
  reviewedBy?: string | null;
  reviewedDate?: string | null;
  providerNotes?: string | null;
  imageUrl: string;
  patient?: Patient;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  userId: string;
  timestamp: string;
  metadata?: string | null;
}

export interface DashboardStats {
  totalPendingClaims: number;
  totalOutstandingBalance: number;
  patientsOverdueForHygiene: number;
  notesAwaitingApproval: number;
  recentActivity: ActivityLog[];
  claimsByStatus: Record<string, number>;
  balancesByCollectionStatus: Record<string, number>;
  recoveredRevenueThisMonth: number;
  treatmentPlansProposed: number;
  pendingPreAuths: number;
  lowStockItems: number;
  pendingFollowUps: number;
  pendingForms: number;
  activePaymentPlans: number;
  openReferrals: number;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  providerId: string;
  title: string;
  status: 'proposed' | 'accepted' | 'in_progress' | 'completed' | 'declined';
  presentedDate: string;
  acceptedDate?: string | null;
  totalEstimate: number;
  insuranceEst: number;
  patientEst: number;
  priority: 'urgent' | 'high' | 'standard' | 'elective';
  notes?: string | null;
  sentAt?: string | null;
  planToken?: string | null;
  items?: TreatmentPlanItem[];
  patient?: Patient;
  provider?: Provider;
}

export interface TreatmentPlanItem {
  id: string;
  treatmentPlanId: string;
  procedureCode: string;
  description: string;
  toothNumber?: string | null;
  surface?: string | null;
  estimatedCost: number;
  insuranceCoverage: number;
  patientCost: number;
  status: 'pending' | 'scheduled' | 'completed';
  sequence: number;
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  totalAmount: number;
  downPayment: number;
  remainingAmount: number;
  monthlyPayment: number;
  totalInstallments: number;
  paidInstallments: number;
  interestRate: number;
  startDate: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  notes?: string | null;
  patient?: Patient;
  installments?: PaymentPlanInstallment[];
}

export interface PaymentPlanInstallment {
  id: string;
  paymentPlanId: string;
  installmentNo: number;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'missed';
}

export interface PatientForm {
  id: string;
  patientId?: string | null;
  formType: 'health_history' | 'consent' | 'financial' | 'hipaa' | 'new_patient';
  title: string;
  status: 'pending' | 'submitted' | 'reviewed';
  submittedAt?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  formData?: string | null;
  sentAt?: string | null;
  formToken?: string | null;
  patient?: Patient;
}

export interface Referral {
  id: string;
  patientId: string;
  referringProvId: string;
  referredToName: string;
  referredToSpecialty: string;
  referredToPhone?: string | null;
  referredToEmail?: string | null;
  reason: string;
  urgency: 'urgent' | 'soon' | 'routine';
  status: 'pending' | 'sent' | 'scheduled' | 'completed' | 'declined';
  sentDate?: string | null;
  appointmentDate?: string | null;
  reportReceived: boolean;
  reportNotes?: string | null;
  patient?: Patient;
  referringProvider?: Provider;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'restorative' | 'preventive' | 'surgical' | 'orthodontic' | 'office' | 'ppe';
  sku?: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  supplier?: string | null;
  lastOrderDate?: string | null;
  expiryDate?: string | null;
  location?: string | null;
}

export interface PriceResult {
  supplier: string;
  title: string;
  price: number;
  originalPrice?: number;
  url: string;
  imageUrl?: string;
  shipping?: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
}

export interface PriceSearchResponse {
  item?: { id: string; name: string; currentUnitCost: number; supplier: string | null };
  query: string;
  resultCount: number;
  cheapestPrice: number | null;
  averagePrice: number | null;
  potentialSavings?: number;
  results: PriceResult[];
}

export interface InventoryImportRow {
  name: string;
  category: string;
  sku: string | null;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  unitCost: number;
  supplier: string | null;
  location: string | null;
}

export interface InventoryImportPreview {
  fileName: string;
  fileSize: number;
  itemCount: number;
  items: InventoryImportRow[];
}

export interface InventoryImportResult {
  created: number;
  skipped: number;
  skippedNames: string[];
  items: Array<{ id: string; name: string }>;
}

export interface ScoreAlert {
  type: 'deposit_required' | 'double_book' | 'priority_outreach' | 'front_desk_warning' | 'high_value';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  score: string;
}

export interface PatientScores {
  patientId: string;
  patientName: string;
  attendance: number;
  financial: number;
  engagement: number;
  treatmentCommitment: number;
  composite: number;
  alerts: ScoreAlert[];
  calculatedAt: string;
}

export interface Communication {
  id: string;
  patientId: string;
  channel: 'sms' | 'email' | 'phone' | 'portal';
  direction: 'inbound' | 'outbound';
  subject?: string | null;
  body: string;
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: string | null;
  readAt?: string | null;
  sentBy: string;
  metadata?: string | null;
  patient?: Patient;
}

export interface FollowUp {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  procedureType: string;
  procedureDate: string;
  followUpDate: string;
  status: 'pending' | 'sent' | 'responded' | 'completed';
  channel: 'sms' | 'email' | 'phone';
  message: string;
  response?: string | null;
  respondedAt?: string | null;
  patient?: Patient;
}

export interface PerioExam {
  id: string;
  patientId: string;
  providerId: string;
  examDate: string;
  pocketDepths: string | Record<string, unknown>;
  recession?: string | null;
  bleeding?: string | null;
  furcation?: string | null;
  mobility?: string | null;
  plaque?: string | null;
  notes?: string | null;
  patient?: Patient;
  provider?: Provider;
}

export interface PreAuthorization {
  id: string;
  patientId: string;
  insurancePlanId: string;
  procedureCodes: string;
  toothNumbers?: string | null;
  estimatedCost: number;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'denied' | 'expired';
  submittedDate?: string | null;
  responseDate?: string | null;
  approvedAmount?: number | null;
  denialReason?: string | null;
  expiryDate?: string | null;
  authNumber?: string | null;
  notes?: string | null;
  patient?: Patient;
  insurancePlan?: InsurancePlan;
}
