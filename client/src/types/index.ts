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
}
