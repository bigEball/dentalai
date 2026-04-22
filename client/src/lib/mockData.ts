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
 * mock fallbacks (Procurement, Claim Review, Churn, Scheduling, etc.)
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
  { id: 'rcl-001', patientId: 'pat-001', type: 'hygiene', dueDate: '2026-05-10', lastVisit: '2025-11-10', status: 'pending', contactedDate: null, scheduledDate: null, patient: pt(0) },
  { id: 'rcl-002', patientId: 'pat-003', type: 'hygiene', dueDate: '2026-04-28', lastVisit: '2025-10-28', status: 'pending', contactedDate: null, scheduledDate: null, patient: pt(2) },
  { id: 'rcl-003', patientId: 'pat-004', type: 'perio', dueDate: '2026-04-15', lastVisit: '2026-01-15', status: 'contacted', contactedDate: '2026-04-12', scheduledDate: null, patient: pt(3) },
  { id: 'rcl-004', patientId: 'pat-008', type: 'hygiene', dueDate: '2026-04-20', lastVisit: '2025-10-20', status: 'scheduled', contactedDate: '2026-04-10', scheduledDate: '2026-05-02', patient: pt(7) },
  { id: 'rcl-005', patientId: 'pat-009', type: 'hygiene', dueDate: '2026-05-05', lastVisit: '2025-11-05', status: 'pending', contactedDate: null, scheduledDate: null, patient: pt(8) },
  { id: 'rcl-006', patientId: 'pat-011', type: 'perio', dueDate: '2026-05-12', lastVisit: '2026-02-12', status: 'pending', contactedDate: null, scheduledDate: null, patient: pt(10) },
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
  { id: 'cmm-007', patientId: 'pat-010', channel: 'email', direction: 'outbound', subject: 'Thanks for visiting us', body: 'Hi Carlos, thanks for visiting Summit Dental today. If you have any questions about your treatment plan, just reply to this email.', timestamp: '2026-04-12T17:30:00Z', status: 'opened', patient: pt(9) },
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

// ─── Clinical Notes ───────────────────────────────────────────────────────────

const NOTES = [
  { id: 'note-001', patientId: 'pat-001', appointmentId: 'appt-001', status: 'approved', createdDate: '2026-03-15', approvedDate: '2026-03-15', approvedBy: 'Dr. Mitchell', transcript: 'Adult prophy. Bitewings. No caries noted. Light gingivitis upper anteriors.', subjective: 'Patient reports no sensitivity or pain. No changes in medical history.', objective: 'Probing depths 2-3mm generalized. Light plaque accumulation. BOP minimal.', assessment: 'Generally healthy with localized gingivitis.', plan: 'Routine prophy completed. 6-month recall.', patient: pt(0) },
  { id: 'note-002', patientId: 'pat-002', appointmentId: 'appt-002', status: 'approved', createdDate: '2026-04-05', approvedDate: '2026-04-05', approvedBy: 'Dr. Mitchell', transcript: 'SRP lower arch, two quadrants. Arestin two sites.', subjective: 'Reports heavy bleeding when flossing, bad taste.', objective: 'Probing depths 4-7mm lower arch. BOP 72%. Class I furcation #19, #30.', assessment: 'Generalized severe chronic periodontitis.', plan: 'SRP LR and LL completed today. Arestin at 4 sites >6mm. 4-week reevaluation.', patient: pt(1) },
  { id: 'note-003', patientId: 'pat-005', appointmentId: 'appt-005', status: 'pending', createdDate: '2026-04-14', approvedDate: null, approvedBy: null, transcript: 'Crown prep tooth 3, PFM.', subjective: 'Patient doing well, no symptoms.', objective: 'Pre-op radiograph: secondary caries under existing composite #3 MOD.', assessment: 'Tooth #3 needs full-coverage restoration.', plan: 'Crown prep completed, temporary placed. Permanent delivery in 3 weeks.', patient: pt(4) },
  { id: 'note-004', patientId: 'pat-007', appointmentId: 'appt-007', status: 'approved', createdDate: '2026-03-28', approvedDate: '2026-03-28', approvedBy: 'Dr. Mitchell', transcript: 'Two composite restorations, tooth 28 and 30.', subjective: 'Cold sensitivity on right side.', objective: 'Caries #28 DO and #30 MO, radiographically confirmed.', assessment: 'Interproximal caries both teeth.', plan: 'Composite restorations placed. Follow-up in 2 weeks if symptoms persist.', patient: pt(6) },
  { id: 'note-005', patientId: 'pat-010', appointmentId: 'appt-010', status: 'pending', createdDate: '2026-04-12', approvedDate: null, approvedBy: null, transcript: 'New patient comprehensive exam.', subjective: 'New patient, last visit 3 years ago, no pain.', objective: 'FMX taken. Light generalized calculus. No active caries.', assessment: 'Generally healthy new patient.', plan: 'Adult prophy today. 6-month recall.', patient: pt(9) },
];

// ─── Perio ────────────────────────────────────────────────────────────────────

const PERIO_EXAMS = [
  { id: 'pex-001', patientId: 'pat-011', examDate: '2026-02-10', avgPocketDepth: 5.4, maxPocketDepth: 8, bopPercentage: 89, classification: 'Stage III Grade C', patient: pt(10) },
  { id: 'pex-002', patientId: 'pat-002', examDate: '2026-04-05', avgPocketDepth: 4.8, maxPocketDepth: 7, bopPercentage: 72, classification: 'Stage II Grade B', patient: pt(1) },
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
  riskScore: [72, 15, 28, 84, 42, 35, 91, 18, 55, 22, 88, 20][i] || 30,
  churnRisk: [0.42, 0.08, 0.12, 0.68, 0.25, 0.18, 0.79, 0.10, 0.38, 0.14, 0.72, 0.11][i] || 0.15,
  lifetimeValue: [8200, 12500, 4800, 5200, 18400, 15200, 3100, 9800, 6200, 7500, 4900, 8900][i] || 5000,
  lastUpdate: '2026-04-20',
  patient: pt(i),
}));

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
  '/notes': NOTES,
  '/perio/exams': PERIO_EXAMS,
  '/perio': PERIO_EXAMS,
  '/scores/patients': PATIENT_SCORES,
  '/scores': PATIENT_SCORES,
  '/activity': ACTIVITY,
  '/settings': SETTINGS,
  '/settings/status': SYSTEM_STATUS,
};

// Pages that ship their own richer internal mocks — just unblock with []
const EMPTY_ARRAY_PATHS = [
  '/procurement', '/claim-scrubber', '/churn', '/nurture', '/scheduling',
  '/compliance', '/decision-support', '/fee-schedules', '/morning-huddle',
  '/reports', '/appointments',
];

const EMPTY_OBJECT_PATHS = [
  '/procurement/dashboard', '/claim-scrubber/stats', '/churn/dashboard',
  '/scheduling/dashboard', '/scheduling/utilization', '/morning-huddle/today',
  '/reports/production', '/reports/collections', '/reports/case-acceptance',
  '/reports/hygiene', '/reports/aging-ar',
];

/**
 * Look up a mock response for the given URL path. Returns `undefined`
 * if there's no mock (caller should keep the original error).
 */
export function getMockForPath(path: string): Mock | undefined {
  // Strip baseURL and query string
  const p = path.replace(/^.*\/api\/v1/, '').split('?')[0];
  if (p === undefined) return undefined;

  // Exact match first
  if (p in EXACT) return EXACT[p];

  // GET /patients/:id, /insurance/plans/:id, etc. → return first item of collection
  const segments = p.split('/').filter(Boolean);
  if (segments.length >= 2) {
    const collectionKey = '/' + segments.slice(0, -1).join('/');
    const last = segments[segments.length - 1]!;
    if (collectionKey in EXACT && !/^(stats|status|generate|recent|today|overview)$/.test(last)) {
      const collection = EXACT[collectionKey];
      if (Array.isArray(collection)) {
        const match = collection.find((item: Record<string, unknown>) => item.id === last);
        if (match) return match;
        return collection[0];
      }
    }
  }

  // Prefix matches for pages that supply their own mocks
  for (const prefix of EMPTY_OBJECT_PATHS) {
    if (p === prefix || p.startsWith(prefix + '/')) return {};
  }
  for (const prefix of EMPTY_ARRAY_PATHS) {
    if (p === prefix || p.startsWith(prefix + '/')) return [];
  }

  return undefined;
}
