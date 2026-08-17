/**
 * Client-side mock data registry.
 *
 * Served by the axios interceptor in api.ts whenever a backend request
 * fails (network error, 4xx, 5xx). This lets the app run as a pure
 * static demo on Netlify with no backend at all. Keys are URL pattern
 * strings; values are the payload the interceptor returns as `data`.
 *
 * If the real backend is reachable, responses take precedence — mocks
 * only kick in on failure. Pages that already ship their own internal
 * mock fallbacks (Inventory Management, Claim Review, Churn, Scheduling, etc.)
 * aren't repeated here; the interceptor resolves those with `[]` or
 * `{}` so the page's own fallback takes over.
 */

// ─── Helpers to keep mock blocks compact ─────────────────────────────────────

const PATIENTS = [
  { id: 'pat-001', firstName: 'Margaret', lastName: 'Harrington', email: 'margaret.harrington@email.com', phone: '(312) 555-0142', dob: '1952-03-18', address: '145 Lakeshore Dr, Chicago, IL 60611', insuranceProvider: 'Delta Dental', lastVisit: '2026-03-15', status: 'active' },
  { id: 'pat-002', firstName: 'Robert', lastName: 'Kessler', email: 'r.kessler@workplace.com', phone: '(312) 555-0287', dob: '1978-11-04', address: '2203 Wabash Ave, Chicago, IL 60616', insuranceProvider: 'Cigna Dental', lastVisit: '2026-04-02', status: 'active' },
  { id: 'pat-003', firstName: 'Aisha', lastName: 'Washington', email: 'aisha.washington@gmail.com', phone: '(773) 555-0391', dob: '1988-07-22', address: '1847 N Halsted, Chicago, IL 60614', insuranceProvider: 'Aetna Dental', lastVisit: '2026-03-28', status: 'active' },
  { id: 'pat-004', firstName: 'Thomas', lastName: 'Brennan', email: 'tbrennan@hotmail.com', phone: '(630) 555-0458', dob: '1965-02-11', address: '512 Main St, Naperville, IL 60540', insuranceProvider: 'MetLife Dental', lastVisit: '2026-02-20', status: 'active' },
  { id: 'pat-005', firstName: 'Linda', lastName: 'Castillo', email: 'linda.castillo@yahoo.com', phone: '(847) 555-0512', dob: '1971-09-30', address: '88 Northbrook Ct, Northbrook, IL 60062', insuranceProvider: 'Blue Cross Dental', lastVisit: '2026-04-10', status: 'active' },
  { id: 'pat-006', firstName: 'David', lastName: 'Nguyen', email: 'david.nguyen@company.org', phone: '(312) 555-0614', dob: '1983-12-05', address: '701 Dearborn, Chicago, IL 60605', insuranceProvider: 'Delta Dental', lastVisit: '2026-04-15', status: 'active' },
  { id: 'pat-007', firstName: 'Patricia', lastName: 'Monroe', email: 'pat.monroe@email.net', phone: '(708) 555-0723', dob: '1959-05-17', address: '310 Oak Park Ave, Oak Park, IL 60302', insuranceProvider: 'Cigna Dental', lastVisit: '2026-03-28', status: 'active' },
  { id: 'pat-008', firstName: 'Kevin', lastName: 'Okafor', email: 'kevin.okafor@gmail.com', phone: '(773) 555-0834', dob: '1990-04-28', address: '1122 W Belmont, Chicago, IL 60657', insuranceProvider: 'Aetna Dental', lastVisit: '2026-01-15', status: 'active' },
  { id: 'pat-009', firstName: 'Susan', lastName: 'Whitfield', email: 'swhitfield@outlook.com', phone: '(847) 555-0945', dob: '1948-08-09', address: '55 Sheridan Rd, Evanston, IL 60201', insuranceProvider: 'MetLife Dental', lastVisit: '2026-03-05', status: 'active' },
  { id: 'pat-010', firstName: 'Carlos', lastName: 'Ramirez', email: 'carlos.ramirez@mail.com', phone: '(312) 555-1023', dob: '1995-01-14', address: '2400 N Lincoln, Chicago, IL 60614', insuranceProvider: 'Delta Dental', lastVisit: '2026-04-12', status: 'active' },
  { id: 'pat-011', firstName: 'Emily', lastName: 'Thornton', email: 'emily.thornton@comcast.net', phone: '(630) 555-1134', dob: '1962-10-25', address: '900 Warrenville Rd, Lisle, IL 60532', insuranceProvider: 'Blue Cross Dental', lastVisit: '2026-02-12', status: 'active' },
  { id: 'pat-012', firstName: 'Jason', lastName: 'Park', email: 'jpark2001@gmail.com', phone: '(773) 555-1245', dob: '2001-06-03', address: '1730 W Fullerton, Chicago, IL 60614', insuranceProvider: 'Cigna Dental', lastVisit: '2026-03-01', status: 'active' },
];

const pt = (i: number) => ({ id: PATIENTS[i]!.id, firstName: PATIENTS[i]!.firstName, lastName: PATIENTS[i]!.lastName });

// ─── Dashboard ────────────────────────────────────────────────────────────────

const DASHBOARD_ACTIVITY = [
  { id: 'act-001', action: 'approve_note', entityType: 'ClinicalNote', entityId: 'note-001', description: 'Clinical note approved for Margaret Harrington', userId: 'demo-user', timestamp: '2026-04-20T14:05:00Z' },
  { id: 'act-002', action: 'submit_claim', entityType: 'InsuranceClaim', entityId: 'claim-004', description: 'Claim submitted for Patricia Monroe to Cigna Dental', userId: 'demo-user', timestamp: '2026-04-20T13:42:00Z' },
  { id: 'act-003', action: 'send_statement', entityType: 'Balance', entityId: 'bal-002', description: 'Statement sent to Thomas Brennan', userId: 'demo-user', timestamp: '2026-04-20T11:20:00Z' },
  { id: 'act-004', action: 'create_treatment_plan', entityType: 'TreatmentPlan', entityId: 'tp-004', description: 'Treatment plan created for Robert Kessler - Implant #19', userId: 'demo-user', timestamp: '2026-04-20T09:15:00Z' },
  { id: 'act-005', action: 'verify_insurance', entityType: 'InsurancePlan', entityId: 'plan-006', description: 'Insurance verified for David Nguyen - Delta Dental', userId: 'demo-user', timestamp: '2026-04-19T16:50:00Z' },
];

const DASHBOARD_STATS = {
  totalPendingClaims: 12,
  totalOutstandingBalance: 24850,
  patientsOverdueForHygiene: 47,
  notesAwaitingApproval: 8,
  recentActivity: DASHBOARD_ACTIVITY,
  claimsByStatus: {
    draft: 4,
    pending: 3,
    submitted: 5,
    approved: 18,
    denied: 2,
    resubmit: 1,
  },
  balancesByCollectionStatus: {
    current: 8,
    overdue_30: 5,
    overdue_60: 3,
    overdue_90: 2,
    collections: 1,
  },
  recoveredRevenueThisMonth: 51300,
  treatmentPlansProposed: 6,
  pendingPreAuths: 3,
  lowStockItems: 2,
  pendingFollowUps: 4,
  pendingForms: 1,
  activePaymentPlans: 5,
  openReferrals: 2,
};

// ─── Insurance ────────────────────────────────────────────────────────────────

const INSURANCE_PLANS = [
  { id: 'plan-001', patientId: 'pat-001', provider: 'Delta Dental', memberId: 'DD-8821445', groupNumber: 'GRP-441209', deductible: 100, deductibleMet: 100, annualMax: 2000, annualUsed: 620, verificationStatus: 'verified', verifiedDate: '2026-01-02', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: pt(0) },
  { id: 'plan-002', patientId: 'pat-002', provider: 'Cigna Dental', memberId: 'CIG-3347821', groupNumber: 'GRP-882341', deductible: 150, deductibleMet: 150, annualMax: 1500, annualUsed: 1340, verificationStatus: 'verified', verifiedDate: '2026-01-05', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: pt(1) },
  { id: 'plan-003', patientId: 'pat-003', provider: 'Aetna Dental', memberId: 'AET-5592038', groupNumber: 'GRP-209341', deductible: 50, deductibleMet: 50, annualMax: 2500, annualUsed: 195, verificationStatus: 'verified', verifiedDate: '2026-01-10', coPayPreventive: 0, coPayBasic: 15, coPayMajor: 40, patient: pt(2) },
  { id: 'plan-004', patientId: 'pat-004', provider: 'MetLife Dental', memberId: 'MET-7734902', groupNumber: 'GRP-331892', deductible: 75, deductibleMet: 75, annualMax: 1750, annualUsed: 520, verificationStatus: 'pending', verifiedDate: null, coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: pt(3) },
  { id: 'plan-005', patientId: 'pat-005', provider: 'Blue Cross Dental', memberId: 'BCBS-2290183', groupNumber: 'GRP-778123', deductible: 100, deductibleMet: 100, annualMax: 3000, annualUsed: 1820, verificationStatus: 'verified', verifiedDate: '2026-01-08', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: pt(4) },
  { id: 'plan-006', patientId: 'pat-006', provider: 'Delta Dental', memberId: 'DD-4473829', groupNumber: 'GRP-990123', deductible: 100, deductibleMet: 100, annualMax: 2000, annualUsed: 880, verificationStatus: 'verified', verifiedDate: '2026-02-01', coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: pt(5) },
  { id: 'plan-007', patientId: 'pat-007', provider: 'Cigna Dental', memberId: 'CIG-8819023', groupNumber: 'GRP-556712', deductible: 150, deductibleMet: 75, annualMax: 1500, annualUsed: 195, verificationStatus: 'pending', verifiedDate: null, coPayPreventive: 0, coPayBasic: 20, coPayMajor: 50, patient: pt(6) },
];

const INSURANCE_CLAIMS = [
  { id: 'claim-001', patientId: 'pat-001', insurancePlanId: 'plan-001', appointmentId: 'appt-001', claimDate: '2026-03-20', procedureCodes: 'D1110,D0274', totalAmount: 195, narrative: 'Adult prophylaxis and bitewings.', status: 'approved', submittedDate: '2026-03-20', approvedAmount: 175.5, denialReason: null, patient: pt(0), insurancePlan: { id: 'plan-001', provider: 'Delta Dental', memberId: 'DD-8821445' } },
  { id: 'claim-002', patientId: 'pat-002', insurancePlanId: 'plan-002', appointmentId: 'appt-002', claimDate: '2026-04-05', procedureCodes: 'D4341,D4381', totalAmount: 820, narrative: 'SRP lower arch, 2 quadrants. Arestin placed at two sites.', status: 'approved', submittedDate: '2026-04-06', approvedAmount: 656, denialReason: null, patient: pt(1), insurancePlan: { id: 'plan-002', provider: 'Cigna Dental', memberId: 'CIG-3347821' } },
  { id: 'claim-003', patientId: 'pat-005', insurancePlanId: 'plan-005', appointmentId: 'appt-005', claimDate: '2026-04-14', procedureCodes: 'D2750,D0340', totalAmount: 1250, narrative: 'PFM crown tooth #3.', status: 'pending', submittedDate: null, approvedAmount: null, denialReason: null, patient: pt(4), insurancePlan: { id: 'plan-005', provider: 'Blue Cross Dental', memberId: 'BCBS-2290183' } },
  { id: 'claim-004', patientId: 'pat-007', insurancePlanId: 'plan-007', appointmentId: 'appt-007', claimDate: '2026-03-28', procedureCodes: 'D2391,D2392', totalAmount: 425, narrative: 'Composite restorations #28 DO and #30 MO.', status: 'submitted', submittedDate: '2026-03-29', approvedAmount: null, denialReason: null, patient: pt(6), insurancePlan: { id: 'plan-007', provider: 'Cigna Dental', memberId: 'CIG-8819023' } },
  { id: 'claim-005', patientId: 'pat-007', insurancePlanId: 'plan-007', appointmentId: 'appt-008', claimDate: '2026-03-15', procedureCodes: 'D0150,D0274,D1110', totalAmount: 485, narrative: 'Comprehensive exam, FMX, prophy.', status: 'denied', submittedDate: '2026-03-16', approvedAmount: 0, denialReason: 'Coverage lapsed — member not found in eligibility file at time of service.', patient: pt(6), insurancePlan: { id: 'plan-007', provider: 'Cigna Dental', memberId: 'CIG-8819023' } },
  { id: 'claim-006', patientId: 'pat-006', insurancePlanId: 'plan-006', appointmentId: 'appt-006', claimDate: '2026-04-08', procedureCodes: 'D4910', totalAmount: 240, narrative: 'Periodontal maintenance.', status: 'approved', submittedDate: '2026-04-09', approvedAmount: 216, denialReason: null, patient: pt(5), insurancePlan: { id: 'plan-006', provider: 'Delta Dental', memberId: 'DD-4473829' } },
  { id: 'claim-007', patientId: 'pat-012', insurancePlanId: 'plan-002', appointmentId: 'appt-012', claimDate: '2026-03-01', procedureCodes: 'D1110,D0274', totalAmount: 175, narrative: 'Adult prophylaxis and bitewings.', status: 'draft', submittedDate: null, approvedAmount: null, denialReason: null, patient: pt(11), insurancePlan: { id: 'plan-002', provider: 'Cigna Dental', memberId: 'CIG-3347821' } },
];

// ─── Billing ──────────────────────────────────────────────────────────────────

const BALANCES = [
  { id: 'bal-001', patientId: 'pat-001', amount: 420, dueDate: '2026-05-01', status: 'current', daysOverdue: 0, lastStatementDate: '2026-04-01', lastReminderDate: null, patient: pt(0) },
  { id: 'bal-002', patientId: 'pat-004', amount: 1840, dueDate: '2026-03-15', status: 'overdue', daysOverdue: 38, lastStatementDate: '2026-03-01', lastReminderDate: '2026-04-10', patient: pt(3) },
  { id: 'bal-003', patientId: 'pat-005', amount: 3250, dueDate: '2026-04-20', status: 'current', daysOverdue: 0, lastStatementDate: '2026-04-15', lastReminderDate: null, patient: pt(4) },
  { id: 'bal-004', patientId: 'pat-007', amount: 485, dueDate: '2026-02-20', status: 'overdue', daysOverdue: 61, lastStatementDate: '2026-02-05', lastReminderDate: '2026-03-15', patient: pt(6) },
  { id: 'bal-005', patientId: 'pat-009', amount: 210, dueDate: '2026-05-10', status: 'current', daysOverdue: 0, lastStatementDate: '2026-04-10', lastReminderDate: null, patient: pt(8) },
  { id: 'bal-006', patientId: 'pat-010', amount: 680, dueDate: '2026-04-25', status: 'current', daysOverdue: 0, lastStatementDate: '2026-04-15', lastReminderDate: null, patient: pt(9) },
  { id: 'bal-007', patientId: 'pat-011', amount: 1450, dueDate: '2026-03-01', status: 'overdue', daysOverdue: 52, lastStatementDate: '2026-02-15', lastReminderDate: '2026-04-01', patient: pt(10) },
];

// ─── Recall ───────────────────────────────────────────────────────────────────

const RECALL_TASKS = [
  {
    id: 'rcl-001',
    patientId: 'pat-001',
    lastHygieneDate: '2025-11-10',
    recallDueDate: '2026-05-10',
    daysOverdue: 3,
    contactAttempts: 0,
    lastContactDate: null,
    status: 'pending',
    suggestedMessage: 'Hi Margaret, this is Summit Demo Practice. You are due for your 6-month hygiene visit. We have openings this week if you would like to schedule your cleaning and check-up.',
    patient: pt(0),
  },
  {
    id: 'rcl-002',
    patientId: 'pat-003',
    lastHygieneDate: '2025-10-28',
    recallDueDate: '2026-04-28',
    daysOverdue: 15,
    contactAttempts: 0,
    lastContactDate: null,
    status: 'pending',
    suggestedMessage: 'Hi Aisha, you are a little overdue for your hygiene appointment. Reply here or call us and we can help find a time that works for your schedule.',
    patient: pt(2),
  },
  {
    id: 'rcl-003',
    patientId: 'pat-004',
    lastHygieneDate: '2026-01-15',
    recallDueDate: '2026-04-15',
    daysOverdue: 28,
    contactAttempts: 1,
    lastContactDate: '2026-04-12',
    status: 'contacted',
    suggestedMessage: 'Hi Thomas, this is a quick reminder that your periodontal maintenance visit is due. Staying on track helps protect your gums and avoid bigger treatment later.',
    patient: pt(3),
  },
  {
    id: 'rcl-004',
    patientId: 'pat-008',
    lastHygieneDate: '2025-10-20',
    recallDueDate: '2026-04-20',
    daysOverdue: 23,
    contactAttempts: 1,
    lastContactDate: '2026-04-10',
    status: 'scheduled',
    suggestedMessage: 'Hi Kevin, your cleaning is scheduled for May 2. Please call or reply if you need to change that appointment.',
    patient: pt(7),
  },
  {
    id: 'rcl-005',
    patientId: 'pat-009',
    lastHygieneDate: '2025-11-05',
    recallDueDate: '2026-05-05',
    daysOverdue: 8,
    contactAttempts: 0,
    lastContactDate: null,
    status: 'pending',
    suggestedMessage: 'Hi Susan, your hygiene recall is due. We would be happy to reserve an appointment for you this month.',
    patient: pt(8),
  },
  {
    id: 'rcl-006',
    patientId: 'pat-011',
    lastHygieneDate: '2026-02-12',
    recallDueDate: '2026-05-12',
    daysOverdue: 1,
    contactAttempts: 0,
    lastContactDate: null,
    status: 'pending',
    suggestedMessage: 'Hi Emily, your periodontal maintenance visit is due. Reply here or call us and we can get you scheduled.',
    patient: pt(10),
  },
];

// ─── Treatment Plans ──────────────────────────────────────────────────────────

const TREATMENT_PLANS = [
  { id: 'tp-001', patientId: 'pat-001', title: 'Crown #14 with buildup', status: 'accepted', totalCost: 1500, createdDate: '2026-03-05', acceptedDate: '2026-03-08', items: [{ id: 'tp-001-a', procedureCode: 'D2950', description: 'Core buildup #14', cost: 300 }, { id: 'tp-001-b', procedureCode: 'D2750', description: 'PFM crown #14', cost: 1200 }], patient: pt(0) },
  { id: 'tp-002', patientId: 'pat-005', title: 'Full perio therapy', status: 'accepted', totalCost: 1680, createdDate: '2026-03-20', acceptedDate: '2026-03-22', items: [{ id: 'tp-002-a', procedureCode: 'D4341', description: 'SRP UR quadrant', cost: 420 }, { id: 'tp-002-b', procedureCode: 'D4341', description: 'SRP UL quadrant', cost: 420 }, { id: 'tp-002-c', procedureCode: 'D4341', description: 'SRP LR quadrant', cost: 420 }, { id: 'tp-002-d', procedureCode: 'D4341', description: 'SRP LL quadrant', cost: 420 }], patient: pt(4) },
  { id: 'tp-003', patientId: 'pat-007', title: 'Two-surface restoration #28 + prophy', status: 'presented', totalCost: 625, createdDate: '2026-04-01', acceptedDate: null, items: [{ id: 'tp-003-a', procedureCode: 'D1110', description: 'Adult prophylaxis', cost: 115 }, { id: 'tp-003-b', procedureCode: 'D2391', description: 'Composite #28 DO', cost: 230 }, { id: 'tp-003-c', procedureCode: 'D2392', description: 'Composite #30 MO', cost: 280 }], patient: pt(6) },
  { id: 'tp-004', patientId: 'pat-002', title: 'Implant placement #19', status: 'presented', totalCost: 4200, createdDate: '2026-04-08', acceptedDate: null, items: [{ id: 'tp-004-a', procedureCode: 'D6010', description: 'Surgical implant #19', cost: 2200 }, { id: 'tp-004-b', procedureCode: 'D6057', description: 'Abutment', cost: 800 }, { id: 'tp-004-c', procedureCode: 'D6058', description: 'Implant crown', cost: 1200 }], patient: pt(1) },
  { id: 'tp-005', patientId: 'pat-011', title: 'Periodontal maintenance sequence', status: 'declined', totalCost: 960, createdDate: '2026-02-18', acceptedDate: null, items: [{ id: 'tp-005-a', procedureCode: 'D4910', description: 'Perio maintenance (quarterly x 4)', cost: 960 }], patient: pt(10) },
];

// ─── Communications ───────────────────────────────────────────────────────────

const COMMUNICATIONS = [
  { id: 'cmm-001', patientId: 'pat-001', channel: 'sms', direction: 'outbound', subject: null, body: 'Hi Margaret — confirming your appointment on April 28 at 2pm. Reply C to confirm or R to reschedule.', timestamp: '2026-04-20T14:30:00Z', status: 'delivered', patient: pt(0) },
  { id: 'cmm-002', patientId: 'pat-001', channel: 'sms', direction: 'inbound', subject: null, body: 'C', timestamp: '2026-04-20T14:33:00Z', status: 'received', patient: pt(0) },
  { id: 'cmm-003', patientId: 'pat-004', channel: 'email', direction: 'outbound', subject: 'Balance reminder', body: 'Hi Thomas, your outstanding balance of $1,840 is now 38 days past due. Please contact us to arrange payment.', timestamp: '2026-04-10T09:00:00Z', status: 'opened', patient: pt(3) },
  { id: 'cmm-004', patientId: 'pat-007', channel: 'phone', direction: 'outbound', subject: 'Pre-auth follow-up', body: 'Left voicemail — called regarding denied claim on 03/15 exam, need to discuss coverage lapse.', timestamp: '2026-04-12T11:15:00Z', status: 'logged', patient: pt(6) },
  { id: 'cmm-005', patientId: 'pat-005', channel: 'sms', direction: 'outbound', subject: null, body: 'Hi Linda — just a reminder your crown seat appointment is tomorrow at 10am. Please arrive 10 minutes early.', timestamp: '2026-04-19T16:00:00Z', status: 'delivered', patient: pt(4) },
  { id: 'cmm-006', patientId: 'pat-008', channel: 'portal', direction: 'inbound', subject: 'Question about x-rays', body: 'Do I need a new set of x-rays at my appointment next week? My last ones were in October.', timestamp: '2026-04-15T20:10:00Z', status: 'unread', patient: pt(7) },
  { id: 'cmm-007', patientId: 'pat-010', channel: 'email', direction: 'outbound', subject: 'Thanks for visiting us', body: 'Hi Carlos, thanks for visiting Summit Demo Practice today. If you have any questions about your treatment plan, just reply to this email.', timestamp: '2026-04-12T17:30:00Z', status: 'opened', patient: pt(9) },
  { id: 'cmm-008', patientId: 'pat-011', channel: 'sms', direction: 'outbound', subject: null, body: 'Hi Emily — your balance of $1,450 is 52 days past due. We offer payment plans — please call us at (312) 555-0100.', timestamp: '2026-04-01T10:00:00Z', status: 'delivered', patient: pt(10) },
];

// ─── Pre-Auth ─────────────────────────────────────────────────────────────────

const PREAUTHS = [
  { id: 'pa-001', patientId: 'pat-002', insurancePlanId: 'plan-002', procedureCodes: 'D6010,D6057,D6058', estimatedAmount: 4200, narrative: 'Implant placement #19 — tooth extracted 2023, bone graft healed, ridge adequate per CBCT.', status: 'approved', submittedDate: '2026-04-01', approvedDate: '2026-04-08', approvedAmount: 3800, denialReason: null, patient: pt(1) },
  { id: 'pa-002', patientId: 'pat-005', insurancePlanId: 'plan-005', procedureCodes: 'D2750,D2950', estimatedAmount: 1500, narrative: 'Crown with buildup #14, remaining coronal structure less than 40%.', status: 'pending', submittedDate: '2026-04-10', approvedDate: null, approvedAmount: null, denialReason: null, patient: pt(4) },
  { id: 'pa-003', patientId: 'pat-011', insurancePlanId: 'plan-005', procedureCodes: 'D4341,D4341,D4910', estimatedAmount: 1260, narrative: 'SRP 2 quadrants + perio maintenance, generalized 5-7mm pocketing.', status: 'approved', submittedDate: '2026-02-15', approvedDate: '2026-02-22', approvedAmount: 1100, denialReason: null, patient: pt(10) },
  { id: 'pa-004', patientId: 'pat-007', insurancePlanId: 'plan-007', procedureCodes: 'D7140,D7210', estimatedAmount: 600, narrative: 'Extraction #32 impacted wisdom tooth.', status: 'denied', submittedDate: '2026-03-20', approvedDate: '2026-03-28', approvedAmount: 0, denialReason: 'Coverage lapsed at time of submission — member not in eligibility file.', patient: pt(6) },
];

// ─── Payment Plans ────────────────────────────────────────────────────────────

const PAYMENT_PLANS = [
  { id: 'pmp-001', patientId: 'pat-002', totalAmount: 4200, downPayment: 800, remainingAmount: 3400, monthlyPayment: 340, startDate: '2026-05-01', interestRate: 0, status: 'active', installmentsPaid: 0, installmentsTotal: 10, patient: pt(1) },
  { id: 'pmp-002', patientId: 'pat-005', totalAmount: 1680, downPayment: 200, remainingAmount: 1480, monthlyPayment: 185, startDate: '2026-03-01', interestRate: 0, status: 'active', installmentsPaid: 2, installmentsTotal: 8, patient: pt(4) },
  { id: 'pmp-003', patientId: 'pat-011', totalAmount: 1450, downPayment: 0, remainingAmount: 1450, monthlyPayment: 145, startDate: '2026-05-15', interestRate: 0, status: 'pending', installmentsPaid: 0, installmentsTotal: 10, patient: pt(10) },
];

// ─── Forms ────────────────────────────────────────────────────────────────────

const FORMS = [
  { id: 'frm-001', patientId: 'pat-010', formType: 'medical_history', status: 'completed', createdDate: '2026-04-10', submittedDate: '2026-04-11', reviewedBy: 'Dr. Mitchell', reviewedDate: '2026-04-12', patient: pt(9) },
  { id: 'frm-002', patientId: 'pat-003', formType: 'consent_perio', status: 'pending', createdDate: '2026-04-18', submittedDate: null, reviewedBy: null, reviewedDate: null, patient: pt(2) },
  { id: 'frm-003', patientId: 'pat-008', formType: 'intake', status: 'sent', createdDate: '2026-04-19', submittedDate: null, reviewedBy: null, reviewedDate: null, patient: pt(7) },
  { id: 'frm-004', patientId: 'pat-012', formType: 'medical_history', status: 'completed', createdDate: '2026-02-20', submittedDate: '2026-02-28', reviewedBy: 'Dr. Mitchell', reviewedDate: '2026-03-01', patient: pt(11) },
  { id: 'frm-005', patientId: 'pat-002', formType: 'consent_implant', status: 'pending', createdDate: '2026-04-09', submittedDate: null, reviewedBy: null, reviewedDate: null, patient: pt(1) },
  { id: 'frm-006', patientId: 'pat-005', formType: 'consent_crown', status: 'completed', createdDate: '2026-03-20', submittedDate: '2026-03-22', reviewedBy: 'Dr. Mitchell', reviewedDate: '2026-03-22', patient: pt(4) },
];

// ─── Follow-Ups ───────────────────────────────────────────────────────────────

const FOLLOWUPS = [
  { id: 'fu-001', patientId: 'pat-002', appointmentId: 'appt-002', type: 'post_srp', dueDate: '2026-04-12', status: 'completed', sentDate: '2026-04-10', completedDate: '2026-04-12', patientResponse: 'Doing well, no sensitivity.', patient: pt(1) },
  { id: 'fu-002', patientId: 'pat-005', appointmentId: 'appt-005', type: 'post_crown_prep', dueDate: '2026-04-17', status: 'sent', sentDate: '2026-04-15', completedDate: null, patientResponse: null, patient: pt(4) },
  { id: 'fu-003', patientId: 'pat-007', appointmentId: 'appt-007', type: 'post_restoration', dueDate: '2026-04-02', status: 'responded', sentDate: '2026-03-29', completedDate: null, patientResponse: 'Mild sensitivity on cold. Improving day by day.', patient: pt(6) },
  { id: 'fu-004', patientId: 'pat-010', appointmentId: 'appt-010', type: 'new_patient_welcome', dueDate: '2026-04-15', status: 'completed', sentDate: '2026-04-13', completedDate: '2026-04-14', patientResponse: 'Thanks — really appreciated the thorough exam.', patient: pt(9) },
  { id: 'fu-005', patientId: 'pat-011', appointmentId: 'appt-011', type: 'post_srp', dueDate: '2026-02-15', status: 'pending', sentDate: null, completedDate: null, patientResponse: null, patient: pt(10) },
];

// ─── Referrals ────────────────────────────────────────────────────────────────

const REFERRALS = [
  { id: 'ref-001', patientId: 'pat-002', specialistType: 'oral_surgeon', specialistName: 'Dr. Amanda Chen — Chicago Oral Surgery', reason: 'Surgical implant placement #19', status: 'scheduled', createdDate: '2026-04-08', sentDate: '2026-04-09', scheduledDate: '2026-05-12', reportReceivedDate: null, patient: pt(1) },
  { id: 'ref-002', patientId: 'pat-006', specialistType: 'endodontist', specialistName: 'Dr. Michael Torres — Lakeshore Endo', reason: 'RCT #30, complex anatomy per CBCT', status: 'completed', createdDate: '2026-02-10', sentDate: '2026-02-10', scheduledDate: '2026-02-24', reportReceivedDate: '2026-03-05', patient: pt(5) },
  { id: 'ref-003', patientId: 'pat-011', specialistType: 'periodontist', specialistName: 'Dr. Sarah Jefferson — Midwest Perio', reason: 'Advanced generalized periodontitis, surgical therapy eval', status: 'sent', createdDate: '2026-04-01', sentDate: '2026-04-02', scheduledDate: null, reportReceivedDate: null, patient: pt(10) },
  { id: 'ref-004', patientId: 'pat-008', specialistType: 'orthodontist', specialistName: 'Dr. Lisa Park — Northside Orthodontics', reason: 'Ortho consult — Class II div 1', status: 'created', createdDate: '2026-04-19', sentDate: null, scheduledDate: null, reportReceivedDate: null, patient: pt(7) },
];

// ─── Inventory ────────────────────────────────────────────────────────────────

const INVENTORY = [
  { id: 'inv-001', name: 'Nitrile Exam Gloves (M)', category: 'ppe', currentStock: 5, unit: 'box', reorderPoint: 15, maxStock: 40, unitCost: 12, vendor: 'McKesson', lastOrderedDate: '2026-03-25' },
  { id: 'inv-002', name: 'Composite Resin A2', category: 'restorative', currentStock: 8, unit: 'syringe', reorderPoint: 10, maxStock: 30, unitCost: 45, vendor: 'Henry Schein', lastOrderedDate: '2026-03-10' },
  { id: 'inv-003', name: 'Anesthetic Carpules', category: 'surgical', currentStock: 12, unit: 'box', reorderPoint: 20, maxStock: 50, unitCost: 3.25, vendor: 'Patterson Dental', lastOrderedDate: '2026-03-18' },
  { id: 'inv-004', name: 'Surgical Sutures 4-0', category: 'surgical', currentStock: 3, unit: 'pack', reorderPoint: 6, maxStock: 20, unitCost: 28, vendor: 'Patterson Dental', lastOrderedDate: '2026-02-20' },
  { id: 'inv-005', name: 'Prophy Paste', category: 'preventive', currentStock: 14, unit: 'cup', reorderPoint: 10, maxStock: 30, unitCost: 0.65, vendor: 'Henry Schein', lastOrderedDate: '2026-04-02' },
  { id: 'inv-006', name: 'Prophy Angles', category: 'preventive', currentStock: 20, unit: 'unit', reorderPoint: 15, maxStock: 50, unitCost: 0.40, vendor: 'Henry Schein', lastOrderedDate: '2026-04-02' },
  { id: 'inv-007', name: 'Fluoride Varnish', category: 'preventive', currentStock: 120, unit: 'unit dose', reorderPoint: 40, maxStock: 200, unitCost: 1.20, vendor: 'McKesson', lastOrderedDate: '2026-03-15' },
  { id: 'inv-008', name: 'Gauze Pads', category: 'surgical', currentStock: 30, unit: 'box', reorderPoint: 20, maxStock: 60, unitCost: 8.50, vendor: 'McKesson', lastOrderedDate: '2026-03-20' },
  { id: 'inv-009', name: 'Impression Material', category: 'restorative', currentStock: 10, unit: 'cartridge', reorderPoint: 8, maxStock: 25, unitCost: 22, vendor: 'Patterson Dental', lastOrderedDate: '2026-04-05' },
  { id: 'inv-010', name: 'Bonding Agent', category: 'restorative', currentStock: 6, unit: 'bottle', reorderPoint: 5, maxStock: 15, unitCost: 38, vendor: 'Henry Schein', lastOrderedDate: '2026-03-28' },
];

function buildMockPriceResults(query: string) {
  const suppliers = [
    { name: 'Henry Schein', domain: 'henryschein.com' },
    { name: 'Patterson Dental', domain: 'pattersondental.com' },
    { name: 'Amazon Business', domain: 'amazon.com' },
    { name: 'Net32 Dental', domain: 'net32.com' },
    { name: 'Darby Dental', domain: 'darbydental.com' },
    { name: 'Benco Dental', domain: 'benco.com' },
    { name: 'Dental City', domain: 'dentalcity.com' },
    { name: 'Safco Dental Supply', domain: 'safcodental.com' },
  ];
  const seed = query.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const basePrice = 5 + (seed % 200);

  return suppliers
    .map((supplier, index) => {
      const variance = 0.7 + ((seed * (index + 1)) % 60) / 100;
      const price = Math.round(basePrice * variance * 100) / 100;
      return {
        supplier: supplier.name,
        title: `${query} - ${supplier.name}`,
        price,
        originalPrice: index % 3 === 0 ? Math.round(price * 1.2 * 100) / 100 : undefined,
        url: `https://www.${supplier.domain}/search?q=${encodeURIComponent(query)}`,
        shipping: index % 2 === 0 ? 'Free shipping' : `$${(4.99 + index).toFixed(2)} shipping`,
        rating: 3.5 + ((seed + index) % 15) / 10,
        reviews: 10 + ((seed * index) % 500),
        inStock: index !== 5,
      };
    })
    .sort((a, b) => a.price - b.price);
}

function buildMockPriceSearch(query: string, item?: Record<string, unknown>) {
  const results = buildMockPriceResults(query);
  const cheapestPrice = results.length > 0 ? results[0].price : null;
  const averagePrice = results.length > 0
    ? Math.round((results.reduce((sum, result) => sum + result.price, 0) / results.length) * 100) / 100
    : null;

  return {
    item: item
      ? {
          id: String(item.id ?? ''),
          name: String(item.name ?? query),
          currentUnitCost: Number(item.unitCost ?? 0),
          supplier: String(item.vendor ?? item.supplier ?? ''),
        }
      : undefined,
    query,
    resultCount: results.length,
    cheapestPrice,
    averagePrice,
    potentialSavings: item && cheapestPrice !== null
      ? Math.round((Number(item.unitCost ?? 0) - cheapestPrice) * 100) / 100
      : undefined,
    results,
  };
}

// ─── Clinical Notes ───────────────────────────────────────────────────────────

const NOTES = [
  { id: 'note-001', patientId: 'pat-001', appointmentId: 'appt-001', status: 'approved', createdDate: '2026-03-15', approvedDate: '2026-03-15', approvedBy: 'Dr. Mitchell', transcript: 'Adult prophy. Bitewings. No caries noted. Light gingivitis upper anteriors.', subjective: 'Patient reports no sensitivity or pain. No changes in medical history.', objective: 'Probing depths 2-3mm generalized. Light plaque accumulation. BOP minimal.', assessment: 'Generally healthy with localized gingivitis.', plan: 'Routine prophy completed. 6-month recall.', patient: pt(0) },
  { id: 'note-002', patientId: 'pat-002', appointmentId: 'appt-002', status: 'approved', createdDate: '2026-04-05', approvedDate: '2026-04-05', approvedBy: 'Dr. Mitchell', transcript: 'SRP lower arch, two quadrants. Arestin two sites.', subjective: 'Reports heavy bleeding when flossing, bad taste.', objective: 'Probing depths 4-7mm lower arch. BOP 72%. Class I furcation #19, #30.', assessment: 'Generalized severe chronic periodontitis.', plan: 'SRP LR and LL completed today. Arestin at 4 sites >6mm. 4-week reevaluation.', patient: pt(1) },
  { id: 'note-003', patientId: 'pat-005', appointmentId: 'appt-005', status: 'pending', createdDate: '2026-04-14', approvedDate: null, approvedBy: null, transcript: 'Crown prep tooth 3, PFM.', subjective: 'Patient doing well, no symptoms.', objective: 'Pre-op radiograph: secondary caries under existing composite #3 MOD.', assessment: 'Tooth #3 needs full-coverage restoration.', plan: 'Crown prep completed, temporary placed. Permanent delivery in 3 weeks.', patient: pt(4) },
  { id: 'note-004', patientId: 'pat-007', appointmentId: 'appt-007', status: 'approved', createdDate: '2026-03-28', approvedDate: '2026-03-28', approvedBy: 'Dr. Mitchell', transcript: 'Two composite restorations, tooth 28 and 30.', subjective: 'Cold sensitivity on right side.', objective: 'Caries #28 DO and #30 MO, radiographically confirmed.', assessment: 'Interproximal caries both teeth.', plan: 'Composite restorations placed. Follow-up in 2 weeks if symptoms persist.', patient: pt(6) },
  { id: 'note-005', patientId: 'pat-010', appointmentId: 'appt-010', status: 'pending', createdDate: '2026-04-12', approvedDate: null, approvedBy: null, transcript: 'New patient comprehensive exam.', subjective: 'New patient, last visit 3 years ago, no pain.', objective: 'FMX taken. Light generalized calculus. No active caries.', assessment: 'Generally healthy new patient.', plan: 'Adult prophy today. 6-month recall.', patient: pt(9) },
];

// ─── Perio ────────────────────────────────────────────────────────────────────

function buildPerioPocketDepths(maxDepth: number): Record<string, number[]> {
  const depths: Record<string, number[]> = {};
  for (let tooth = 1; tooth <= 32; tooth++) {
    const base = tooth % 5 === 0 ? Math.max(4, maxDepth - 1) : tooth % 3 === 0 ? 4 : 3;
    depths[String(tooth)] = Array.from({ length: 6 }, (_, site) => {
      if (site === 1 && tooth % 8 === 0) return maxDepth;
      if (site === 4 && tooth % 6 === 0) return Math.max(4, maxDepth - 2);
      return base;
    });
  }
  return depths;
}

const PERIO_EXAMS = [
  {
    id: 'pex-001',
    patientId: 'pat-011',
    providerId: 'prov-demo',
    examDate: '2026-02-10',
    pocketDepths: JSON.stringify(buildPerioPocketDepths(8)),
    bleeding: JSON.stringify({}),
    recession: JSON.stringify({}),
    notes: 'Stage III Grade C periodontal findings. Generalized bleeding on probing with multiple posterior sites 6mm or greater.',
    avgPocketDepth: 5.4,
    maxPocketDepth: 8,
    bopPercentage: 89,
    classification: 'Stage III Grade C',
    patient: pt(10),
    provider: { id: 'prov-demo', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS' },
  },
  {
    id: 'pex-002',
    patientId: 'pat-002',
    providerId: 'prov-demo',
    examDate: '2026-04-05',
    pocketDepths: JSON.stringify(buildPerioPocketDepths(7)),
    bleeding: JSON.stringify({}),
    recession: JSON.stringify({}),
    notes: 'Stage II Grade B periodontal findings. Localized posterior pocketing with moderate bleeding on probing.',
    avgPocketDepth: 4.8,
    maxPocketDepth: 7,
    bopPercentage: 72,
    classification: 'Stage II Grade B',
    patient: pt(1),
    provider: { id: 'prov-demo', firstName: 'Sarah', lastName: 'Mitchell', title: 'DDS' },
  },
];

// ─── Activity ─────────────────────────────────────────────────────────────────

const ACTIVITY = [
  { id: 'act-001', action: 'approve_note', entityType: 'ClinicalNote', entityId: 'note-001', description: 'Clinical note approved for Margaret Harrington', userId: 'demo-user', timestamp: '2026-04-20T14:05:00Z' },
  { id: 'act-002', action: 'submit_claim', entityType: 'InsuranceClaim', entityId: 'claim-004', description: 'Claim submitted for Patricia Monroe to Cigna Dental', userId: 'demo-user', timestamp: '2026-04-20T13:42:00Z' },
  { id: 'act-003', action: 'send_statement', entityType: 'Balance', entityId: 'bal-002', description: 'Statement sent to Thomas Brennan', userId: 'demo-user', timestamp: '2026-04-20T11:20:00Z' },
  { id: 'act-004', action: 'create_treatment_plan', entityType: 'TreatmentPlan', entityId: 'tp-004', description: 'Treatment plan created for Robert Kessler — Implant #19', userId: 'demo-user', timestamp: '2026-04-20T09:15:00Z' },
  { id: 'act-005', action: 'verify_insurance', entityType: 'InsurancePlan', entityId: 'plan-006', description: 'Insurance verified for David Nguyen — Delta Dental', userId: 'demo-user', timestamp: '2026-04-19T16:50:00Z' },
  { id: 'act-006', action: 'send_recall', entityType: 'RecallTask', entityId: 'rcl-003', description: 'Recall reminder sent to Thomas Brennan', userId: 'demo-user', timestamp: '2026-04-19T15:10:00Z' },
  { id: 'act-007', action: 'approve_preauth', entityType: 'PreAuthorization', entityId: 'pa-001', description: 'Pre-auth approved for Robert Kessler — Implant #19 ($3,800)', userId: 'demo-user', timestamp: '2026-04-08T10:22:00Z' },
  { id: 'act-008', action: 'complete_followup', entityType: 'FollowUp', entityId: 'fu-001', description: 'Follow-up completed for Robert Kessler — post-SRP check', userId: 'demo-user', timestamp: '2026-04-12T13:05:00Z' },
];

// ─── Patient Scores ───────────────────────────────────────────────────────────

const PATIENT_SCORES = PATIENTS.map((p, i) => ({
  patientId: p.id,
  patientName: `${p.firstName} ${p.lastName}`,
  attendance: [86, 58, 77, 42, 91, 74, 35, 88, 69, 83, 46, 79][i] || 72,
  financial: [78, 92, 68, 51, 84, 88, 39, 80, 73, 77, 44, 86][i] || 75,
  engagement: [70, 84, 62, 45, 89, 71, 32, 85, 64, 81, 41, 76][i] || 70,
  treatmentCommitment: [82, 76, 64, 40, 93, 79, 36, 91, 67, 74, 43, 82][i] || 70,
  composite: [79, 78, 68, 45, 89, 78, 36, 86, 68, 79, 44, 81][i] || 72,
  alerts: ([45, 36, 44].includes([79, 78, 68, 45, 89, 78, 36, 86, 68, 79, 44, 81][i] || 72))
    ? [
        { type: 'front_desk_warning', severity: 'warning', message: 'Confirm appointment and review balance before seating.', score: 'Low reliability' },
      ]
    : [],
  calculatedAt: '2026-04-20T12:00:00Z',
  patient: pt(i),
}));

const MORNING_HUDDLE = {
  id: 'mh-demo',
  date: new Date().toISOString().split('T')[0],
  generatedAt: new Date().toISOString(),
  reviewedAt: null,
  reviewedBy: null,
  summary: {
    totalPatients: 6,
    expectedProduction: 8450,
    newPatients: 1,
    patientsWithBalances: 2,
    totalCollectible: 2325,
    highRiskNoShows: 1,
  },
  patients: [
    {
      patientId: 'pat-001', firstName: 'Margaret', lastName: 'Harrington',
      appointmentTime: '08:30', appointmentType: 'Crown seat', provider: 'Dr. Mitchell',
      duration: 60, isNewPatient: false, flags: [], outstandingBalance: 420,
      insuranceStatus: 'verified', noShowRate: 0.08, pendingTreatmentValue: 0,
    },
    {
      patientId: 'pat-002', firstName: 'Robert', lastName: 'Kessler',
      appointmentTime: '10:00', appointmentType: 'Implant consult', provider: 'Dr. Patel',
      duration: 90, isNewPatient: false,
      flags: [{ type: 'treatment', severity: 'warning', message: 'Discuss pending implant plan', action: 'Review plan' }],
      outstandingBalance: 0, insuranceStatus: 'near max', noShowRate: 0.18, pendingTreatmentValue: 4200,
    },
    {
      patientId: 'pat-010', firstName: 'Carlos', lastName: 'Ramirez',
      appointmentTime: '14:30', appointmentType: 'New patient exam', provider: 'Dr. Mitchell',
      duration: 60, isNewPatient: true,
      flags: [{ type: 'clinical', severity: 'info', message: 'New patient intake forms complete' }],
      outstandingBalance: 0, insuranceStatus: 'verified', noShowRate: 0.12, pendingTreatmentValue: 0,
    },
  ],
  alerts: [
    {
      id: 'mha-1', type: 'financial', severity: 'warning', patientName: 'Margaret Harrington',
      patientId: 'pat-001', message: 'Outstanding balance due before seating.', action: 'Collect balance',
    },
  ],
  opportunities: [
    {
      id: 'mho-1', type: 'treatment', patientName: 'Robert Kessler', patientId: 'pat-002',
      title: 'Implant plan follow-up', value: 4200, description: 'Review financing and answer remaining questions.',
    },
  ],
};

const FEE_SCHEDULES = [
  { id: 'fs-standard', name: 'Standard UCR', type: 'standard', payerName: null, effectiveDate: '2026-01-01', entryCount: 4 },
];

const FEE_SCHEDULE_DETAIL = {
  id: 'fs-standard',
  name: 'Standard UCR',
  type: 'standard',
  payerName: null,
  entries: [
    { id: 'fee-1', scheduleId: 'fs-standard', code: 'D1110', description: 'Adult prophylaxis', category: 'Preventive', feeAmount: 145, ppoAllowedFee: 105, annualVolume: 420, ucrPercentile: 55, writeOff: 40, annualRevenue: 44100, annualWriteOff: 16800 },
    { id: 'fee-2', scheduleId: 'fs-standard', code: 'D2740', description: 'Porcelain crown', category: 'Restorative', feeAmount: 1425, ppoAllowedFee: 980, annualVolume: 96, ucrPercentile: 48, writeOff: 445, annualRevenue: 94080, annualWriteOff: 42720 },
    { id: 'fee-3', scheduleId: 'fs-standard', code: 'D4341', description: 'SRP per quadrant', category: 'Perio', feeAmount: 430, ppoAllowedFee: 330, annualVolume: 130, ucrPercentile: 62, writeOff: 100, annualRevenue: 42900, annualWriteOff: 13000 },
    { id: 'fee-4', scheduleId: 'fs-standard', code: 'D2392', description: 'Two-surface composite', category: 'Restorative', feeAmount: 285, ppoAllowedFee: 210, annualVolume: 260, ucrPercentile: 51, writeOff: 75, annualRevenue: 54600, annualWriteOff: 19500 },
  ],
};

const WRITE_OFF_ANALYSIS = {
  byPayer: [{ payerName: 'Demo PPO', totalWriteOff: 92020, procedureCount: 4 }],
  details: FEE_SCHEDULE_DETAIL.entries.map((entry) => ({
    code: entry.code,
    description: entry.description,
    category: entry.category,
    standardFee: entry.feeAmount,
    ppoAllowedFee: entry.ppoAllowedFee ?? entry.feeAmount,
    writeOffPerUnit: entry.writeOff ?? 0,
    annualVolume: entry.annualVolume,
    annualWriteOff: entry.annualWriteOff ?? 0,
    payerName: 'Demo PPO',
  })),
};

const FEE_OPTIMIZATION_REPORT = {
  id: 'fee-report-demo',
  scheduleId: FEE_SCHEDULE_DETAIL.id,
  scheduleName: FEE_SCHEDULE_DETAIL.name,
  generatedAt: new Date().toISOString(),
  totalAnnualRevenue: FEE_SCHEDULE_DETAIL.entries.reduce((sum, entry) => sum + (entry.annualRevenue ?? 0), 0),
  totalAnnualWriteOff: FEE_SCHEDULE_DETAIL.entries.reduce((sum, entry) => sum + (entry.annualWriteOff ?? 0), 0),
  proceduresBelowP50: FEE_SCHEDULE_DETAIL.entries.filter((entry) => (entry.ucrPercentile ?? 0) < 50).length,
  revenueOpportunity: 84250,
  modeledRevenue: [
    { percentile: 50, revenue: 246900, uplift: 11220 },
    { percentile: 60, revenue: 264500, uplift: 28820 },
    { percentile: 75, revenue: 320750, uplift: 85070 },
    { percentile: 85, revenue: 356400, uplift: 120720 },
    { percentile: 90, revenue: 374920, uplift: 139240 },
  ],
  entryAnalysis: FEE_SCHEDULE_DETAIL.entries.map((entry) => ({
    code: entry.code,
    description: entry.description,
    currentFee: entry.ppoAllowedFee ?? entry.feeAmount,
    ucrPercentile: entry.ucrPercentile ?? 50,
    feeAtP50: Math.round(entry.feeAmount * 1.08),
    feeAtP75: Math.round(entry.feeAmount * 1.22),
    feeAtP90: Math.round(entry.feeAmount * 1.34),
    annualVolume: entry.annualVolume,
    upliftAtP75: Math.max(0, Math.round((entry.feeAmount * 1.22 - (entry.ppoAllowedFee ?? entry.feeAmount)) * entry.annualVolume)),
    writeOff: entry.annualWriteOff ?? 0,
    flag: (entry.ucrPercentile ?? 50) < 50
      ? 'undercharging'
      : (entry.ucrPercentile ?? 50) < 75
        ? 'competitive'
        : 'premium',
  })),
};

const FEE_RENEGOTIATION_BRIEF = {
  id: 'brief-demo',
  scheduleId: FEE_SCHEDULE_DETAIL.id,
  scheduleName: FEE_SCHEDULE_DETAIL.name,
  generatedAt: new Date().toISOString(),
  payerName: 'Demo PPO',
  procedureCount: FEE_SCHEDULE_DETAIL.entries.length,
  totalAnnualImpact: 84250,
  text: [
    'PPO FEE RENEGOTIATION BRIEF',
    '',
    'Payer: Demo PPO',
    'Schedule: Standard UCR',
    'Analysis: 4 high-volume procedures reviewed against current UCR benchmarks.',
    '',
    'The practice is absorbing material write-offs on preventive, restorative, and periodontal procedures. A targeted reimbursement adjustment toward the 75th percentile would reduce annual write-offs while keeping fees within market norms.',
    '',
    'Recommended next step: request updated allowed fees for D1110, D2740, D4341, and D2392 with supporting utilization and market-position data attached.',
  ].join('\n'),
};

const COMPLIANCE_TASKS = [
  { id: 'ct-1', title: 'HIPAA risk assessment', category: 'hipaa', description: 'Annual privacy and security review.', frequency: 'Annual', lastCompleted: '2025-06-15', nextDue: '2026-06-15', status: 'due_soon', assignee: 'Office Manager', notes: 'Review access logs and vendor list.', evidence: 'Prior assessment PDF', priority: 'high' },
  { id: 'ct-2', title: 'OSHA bloodborne pathogen training', category: 'osha', description: 'Staff training renewal.', frequency: 'Annual', lastCompleted: '2025-04-10', nextDue: '2026-04-10', status: 'overdue', assignee: 'Clinical Lead', notes: 'Schedule makeup session.', evidence: 'Training roster', priority: 'critical' },
  { id: 'ct-3', title: 'Sterilizer spore test logs', category: 'infection_control', description: 'Verify weekly biological monitoring.', frequency: 'Weekly', lastCompleted: '2026-04-20', nextDue: '2026-04-27', status: 'compliant', assignee: 'Back Office', notes: '', evidence: 'Logbook', priority: 'medium' },
  { id: 'ct-4', title: 'State license renewal checklist', category: 'state_regulatory', description: 'Prepare provider renewal documents.', frequency: 'Biennial', lastCompleted: null, nextDue: '2026-08-01', status: 'not_started', assignee: 'Admin', notes: '', evidence: '', priority: 'medium' },
];

const COMPLIANCE_TRAINING = [
  { id: 'tr-1', staffName: 'Sarah Mitchell', staffRole: 'DDS', trainingType: 'HIPAA Privacy', completedDate: '2026-01-08', expiryDate: '2027-01-08', certificateRef: 'HIPAA-2026-01', status: 'current' },
  { id: 'tr-2', staffName: 'Jamie Foster', staffRole: 'Assistant', trainingType: 'OSHA BBP', completedDate: '2025-04-10', expiryDate: '2026-04-10', certificateRef: 'OSHA-2025-04', status: 'expired' },
];

const COMPLIANCE_ALERTS = [
  { id: 'ca-1', type: 'task', title: 'OSHA bloodborne pathogen training', category: 'osha', dueDate: '2026-04-10', daysUntilDue: -28, urgency: '30_days', assignee: 'Clinical Lead' },
  { id: 'ca-2', type: 'training', title: 'Jamie Foster - OSHA BBP', category: 'training', dueDate: '2026-04-10', daysUntilDue: -28, urgency: '30_days', assignee: 'Jamie Foster' },
];

const COMPLIANCE_DASHBOARD = {
  overallScore: 78,
  categoryScores: { hipaa: 86, osha: 62, infection_control: 94, state_regulatory: 70 },
  totalTasks: COMPLIANCE_TASKS.length,
  compliantCount: 1,
  dueSoonCount: 1,
  overdueCount: 1,
  notStartedCount: 1,
  expiringTrainingCount: 0,
  expiredTrainingCount: 1,
  recentAudits: [],
};

const COMPLIANCE_AUDITS = [
  {
    id: 'audit-1',
    type: 'readiness',
    generatedAt: '2026-04-20T12:00:00Z',
    overallScore: 78,
    categoryScores: COMPLIANCE_DASHBOARD.categoryScores,
    sections: [
      {
        category: 'OSHA',
        tasks: COMPLIANCE_TASKS.filter((task) => task.category === 'osha').map((task) => ({
          title: task.title,
          status: task.status,
          lastCompleted: task.lastCompleted,
          nextDue: task.nextDue,
          evidence: task.evidence,
          priority: task.priority,
        })),
        score: 62,
      },
    ],
  },
];

// ─── Settings / Status ────────────────────────────────────────────────────────

const SETTINGS = {
  mode: 'demo' as const,
  openDental: { serverUrl: '', developerKey: '', customerKey: '' },
  ollama: { url: '', model: '', enabled: false },
  whisper: { modelPath: '', enabled: false },
  office: { name: 'Summit Demo Practice', locations: ['Chicago Main'], timezone: 'America/Chicago' },
  modules: { aiNotes: true, insurance: true, billing: true, recall: true },
};

const SYSTEM_STATUS = { mode: 'demo' as const, openDentalConnected: false, ollamaAvailable: false };

// ─── URL → Mock lookup ────────────────────────────────────────────────────────

type Mock = unknown;

const EXACT: Record<string, Mock> = {
  '/patients': PATIENTS,
  '/dashboard/stats': DASHBOARD_STATS,
  '/insurance/plans': INSURANCE_PLANS,
  '/insurance/claims': INSURANCE_CLAIMS,
  '/billing/balances': BALANCES,
  '/recall/tasks': RECALL_TASKS,
  '/treatment-plans': TREATMENT_PLANS,
  '/communications': COMMUNICATIONS,
  '/preauth': PREAUTHS,
  '/payment-plans': PAYMENT_PLANS,
  '/forms': FORMS,
  '/followups': FOLLOWUPS,
  '/referrals': REFERRALS,
  '/inventory': INVENTORY,
  '/inventory/alerts': INVENTORY.filter((item) => item.currentStock <= item.reorderPoint),
  '/notes': NOTES,
  '/perio/exams': PERIO_EXAMS,
  '/perio': PERIO_EXAMS,
  '/scores/patients': PATIENT_SCORES,
  '/scores': PATIENT_SCORES,
  '/scores/alerts': PATIENT_SCORES.filter((score) => score.alerts.length > 0),
  '/morning-huddle/today': MORNING_HUDDLE,
  [`/morning-huddle/${MORNING_HUDDLE.date}`]: MORNING_HUDDLE,
  '/fee-schedules': FEE_SCHEDULES,
  '/fee-schedules/fs-standard': FEE_SCHEDULE_DETAIL,
  '/fee-schedules/write-off-analysis': WRITE_OFF_ANALYSIS,
  '/fee-schedules/fs-standard/analyze': FEE_SCHEDULE_DETAIL,
  '/fee-schedules/fs-standard/optimize': FEE_OPTIMIZATION_REPORT,
  '/fee-schedules/fs-standard/renegotiation-brief': FEE_RENEGOTIATION_BRIEF,
  '/compliance/dashboard': COMPLIANCE_DASHBOARD,
  '/compliance/tasks': COMPLIANCE_TASKS,
  '/compliance/training': COMPLIANCE_TRAINING,
  '/compliance/expiry-alerts': COMPLIANCE_ALERTS,
  '/compliance/audits': COMPLIANCE_AUDITS,
  '/compliance/audit/full': COMPLIANCE_AUDITS[0],
  '/compliance/audit/hipaa': { ...COMPLIANCE_AUDITS[0], id: 'audit-hipaa-demo', type: 'hipaa' },
  '/compliance/audit/osha': { ...COMPLIANCE_AUDITS[0], id: 'audit-osha-demo', type: 'osha' },
  '/compliance/audit/infection_control': { ...COMPLIANCE_AUDITS[0], id: 'audit-infection-control-demo', type: 'infection_control' },
  '/activity': ACTIVITY,
  '/settings': SETTINGS,
  '/settings/status': SYSTEM_STATUS,
};

// Pages that ship their own richer internal mocks — just unblock with []
const EMPTY_ARRAY_PATHS = [
  '/procurement', '/claim-scrubber', '/churn', '/nurture',
  '/decision-support',
  '/reports', '/appointments',
];

const EMPTY_OBJECT_PATHS = [
  '/procurement/dashboard', '/claim-scrubber/stats', '/churn/dashboard',
  '/reports/production', '/reports/collections', '/reports/case-acceptance',
  '/reports/hygiene', '/reports/aging-ar',
];

/**
 * Look up a mock response for the given URL path. Returns `undefined`
 * if there's no mock (caller should keep the original error).
 */
export function getMockForPath(path: string): Mock | undefined {
  // Strip baseURL and query string
  const rawPath = path.replace(/^.*\/api\/v1/, '');
  const [p, queryString = ''] = rawPath.split('?');
  if (p === undefined) return undefined;

  // Exact match first
  if (p in EXACT) return EXACT[p];

  // GET /patients/:id, /insurance/plans/:id, etc. → return first item of collection
  const segments = p.split('/').filter(Boolean);
  if (p === '/inventory/price-search') {
    const query = new URLSearchParams(queryString).get('q')?.trim() || 'dental supplies';
    return buildMockPriceSearch(query);
  }
  if (segments[0] === 'inventory' && segments[1] === 'price-search' && segments[2]) {
    const item = INVENTORY.find((inventoryItem) => inventoryItem.id === segments[2]);
    return buildMockPriceSearch(String(item?.name ?? 'dental supplies'), item);
  }

  if (segments.length >= 2) {
    const collectionKey = '/' + segments.slice(0, -1).join('/');
    const last = segments[segments.length - 1]!;
    if (collectionKey in EXACT && !/^(stats|status|generate|recent|today|overview|alerts|bulk|parse|confirm|send|submit|sync|switch-mode|test-connection)$/.test(last)) {
      const collection = EXACT[collectionKey];
      if (Array.isArray(collection)) {
        const match = collection.find((item: Record<string, unknown>) => item.id === last);
        if (match) return match;
        return collection[0];
      }
    }
  }

  if (p.startsWith('/compliance/tasks/') && p.endsWith('/complete')) {
    const taskId = segments[2];
    const task = COMPLIANCE_TASKS.find((item) => item.id === taskId) ?? COMPLIANCE_TASKS[0];
    return {
      ...task,
      status: 'compliant',
      lastCompleted: new Date().toISOString().split('T')[0],
      nextDue: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    };
  }

  if (p.startsWith('/recall/tasks/') && segments.length === 4) {
    const taskId = segments[2];
    const action = segments[3];
    const task = RECALL_TASKS.find((item) => item.id === taskId) ?? RECALL_TASKS[0];
    const today = new Date().toISOString().split('T')[0];

    if (action === 'send-text' || action === 'send-email' || action === 'contact') {
      return {
        success: true,
        task: {
          ...task,
          status: 'contacted',
          contactAttempts: Number(task.contactAttempts ?? 0) + 1,
          lastContactDate: today,
        },
      };
    }

    if (action === 'schedule') {
      return {
        ...task,
        status: 'scheduled',
        lastContactDate: task.lastContactDate ?? today,
      };
    }
  }

  if (p.startsWith('/fee-schedules/') && p.endsWith('/analyze')) return FEE_SCHEDULE_DETAIL;
  if (p.startsWith('/fee-schedules/') && p.endsWith('/optimize')) return FEE_OPTIMIZATION_REPORT;
  if (p.startsWith('/fee-schedules/') && p.endsWith('/renegotiation-brief')) return FEE_RENEGOTIATION_BRIEF;

  // Prefix matches for pages that supply their own mocks
  for (const prefix of EMPTY_OBJECT_PATHS) {
    if (p === prefix || p.startsWith(prefix + '/')) return {};
  }
  for (const prefix of EMPTY_ARRAY_PATHS) {
    if (p === prefix || p.startsWith(prefix + '/')) return [];
  }

  return undefined;
}
