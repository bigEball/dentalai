import React, { useState } from 'react';
import {
  Shield,
  Lock,
  FileText,
  Mic,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Scale,
  Building2,
  Stethoscope,
  DollarSign,
  Users,
  Eye,
  HardDrive,
  ClipboardList,
  BadgeAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'compliant' | 'in_progress' | 'action_needed' | 'info';
  label: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    compliant: 'bg-green-50 text-green-700 border-green-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    action_needed: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  const icons = {
    compliant: <CheckCircle2 size={12} />,
    in_progress: <AlertTriangle size={12} />,
    action_needed: <XCircle size={12} />,
    info: <Eye size={12} />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {label}
    </span>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  status: StatusBadgeProps['status'];
  statusLabel: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ icon, title, status, statusLabel, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center gap-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <StatusBadge status={status} label={statusLabel} />
        {open ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-6 pb-5 border-t border-gray-50">
          <div className="pt-4 text-sm text-gray-600 leading-relaxed space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-start gap-2">
      {met ? (
        <CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <span className={met ? 'text-gray-600' : 'text-gray-900 font-medium'}>{text}</span>
    </div>
  );
}

function LawTable({ rows }: { rows: { state: string; statute: string; type: string }[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-100">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="px-3 py-2 text-left font-semibold text-gray-500">State</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500">Statute</th>
            <th className="px-3 py-2 text-left font-semibold text-gray-500">Consent Type</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.state} className="border-b border-gray-50">
              <td className="px-3 py-1.5 font-medium text-gray-900">{r.state}</td>
              <td className="px-3 py-1.5 text-gray-500 font-mono">{r.statute}</td>
              <td className="px-3 py-1.5">
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${r.type === 'All-Party' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                  {r.type}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TWO_PARTY_STATES = [
  { state: 'California', statute: 'Cal. Penal Code 632', type: 'All-Party' },
  { state: 'Connecticut', statute: 'Conn. Gen. Stat. 52-570d', type: 'All-Party' },
  { state: 'Delaware', statute: 'Del. Code tit. 11, 2402', type: 'All-Party' },
  { state: 'Florida', statute: 'Fla. Stat. 934.03', type: 'All-Party' },
  { state: 'Illinois', statute: '720 ILCS 5/14-1', type: 'All-Party' },
  { state: 'Maryland', statute: 'Md. Code 10-402', type: 'All-Party' },
  { state: 'Massachusetts', statute: 'Mass. Gen. Laws ch. 272, 99', type: 'All-Party' },
  { state: 'Montana', statute: 'Mont. Code Ann. 45-8-213', type: 'All-Party' },
  { state: 'Nevada', statute: 'Nev. Rev. Stat. 200.620', type: 'All-Party' },
  { state: 'New Hampshire', statute: 'N.H. Rev. Stat. 570-A:2', type: 'All-Party' },
  { state: 'Oregon', statute: 'Or. Rev. Stat. 165.540', type: 'All-Party' },
  { state: 'Pennsylvania', statute: '18 Pa.C.S. 5703', type: 'All-Party' },
  { state: 'Washington', statute: 'Wash. Rev. Code 9.73.030', type: 'All-Party' },
];

const PENALTY_TIERS = [
  { tier: 'Tier 1', culpability: 'Lack of knowledge', min: '$145', max: '$73,011', cap: '$2.19M' },
  { tier: 'Tier 2', culpability: 'Reasonable cause', min: '$1,461', max: '$73,011', cap: '$2.19M' },
  { tier: 'Tier 3', culpability: 'Willful neglect (corrected)', min: '$14,602', max: '$73,011', cap: '$2.19M' },
  { tier: 'Tier 4', culpability: 'Willful neglect (not corrected)', min: '$73,011', max: '$2.19M', cap: '$2.19M' },
];

export default function CompliancePage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-xl font-semibold text-gray-900">Compliance & Legal</h1>
        </div>
        <p className="text-sm text-gray-500">
          Regulatory requirements, HIPAA obligations, and legal considerations for operating Smart Dental AI
        </p>
      </div>

      {/* Summary Banner */}
      <div className="card p-5 mb-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-3">
          <BadgeAlert size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Important Disclaimer</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              This page summarizes legal and regulatory research for informational purposes only. It is <strong>not legal advice</strong>.
              You must engage qualified healthcare regulatory counsel before selling or deploying this software in a production environment.
              Budget $15,000–$50,000 for initial compliance setup with a healthcare attorney.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">

        {/* ─── 1. HIPAA ─── */}
        <Section
          icon={<Lock size={20} />}
          title="HIPAA Compliance"
          status="action_needed"
          statusLabel="Action Needed"
          defaultOpen
        >
          <p>
            <strong>Smart Dental AI is a HIPAA Business Associate.</strong> Under 45 CFR 160.103, any entity that
            creates, receives, maintains, or transmits Protected Health Information (PHI) on behalf of a covered entity
            (the dental office) is a Business Associate. Our software processes PHI at every stage — audio recordings,
            transcripts, SOAP notes, and patient data written to Open Dental.
          </p>

          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-1">Running locally does NOT exempt you from HIPAA.</p>
            <p className="text-xs text-amber-700">
              There is no special exemption for on-premises software. The same Privacy Rule, Security Rule, and Breach
              Notification Rule apply whether PHI is processed locally or in the cloud. However, local processing
              reduces attack surface by eliminating cloud transmission and third-party storage risks.
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Business Associate Agreement (BAA)</h4>
          <p>
            A BAA must be executed with every dental office customer before they install the software.
            A separate BAA is needed with Open Dental for API access. The BAA must specify permitted uses of PHI,
            safeguard obligations, breach reporting requirements (within 60 days), and data destruction at termination.
          </p>

          <h4 className="font-semibold text-gray-900 pt-2">Required Technical Safeguards (45 CFR 164.312)</h4>
          <div className="space-y-1.5">
            <Requirement met={false} text="Unique user IDs — every person gets their own login (not a shared demo account)" />
            <Requirement met={false} text="Automatic logoff — session timeout after 15 minutes of inactivity" />
            <Requirement met={false} text="Encryption at rest — AES-256 encryption for all stored PHI (use SQLCipher)" />
            <Requirement met={true} text="Audit controls — activity logging for PHI access and modifications" />
            <Requirement met={false} text="Multi-factor authentication — required under proposed 2026 rule update" />
            <Requirement met={true} text="Integrity controls — immutable note approval workflow prevents tampering" />
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Required Administrative Safeguards (45 CFR 164.308)</h4>
          <div className="space-y-1.5">
            <Requirement met={false} text="Documented risk analysis — assess all threats to PHI in the software" />
            <Requirement met={false} text="Designated security officer — someone responsible for HIPAA compliance" />
            <Requirement met={false} text="Security awareness training — document that your team understands HIPAA" />
            <Requirement met={false} text="Incident response plan — what happens if there's a breach" />
            <Requirement met={false} text="Contingency/backup plan — data backup and recovery procedures" />
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Audio Recordings and PHI</h4>
          <p>
            Audio recordings of clinical encounters are classified as PHI the moment identifiable speech is captured.
            Best practice: <strong>delete raw audio immediately after successful transcription verification</strong>.
            Retain the transcript and generated notes as part of the clinical record. Document the retention and
            deletion policy. Compliance documentation must be retained for 6 years.
          </p>

          <h4 className="font-semibold text-gray-900 pt-2">HIPAA Penalty Tiers (2026)</h4>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Tier</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Culpability</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Min/Violation</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Max/Violation</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-500">Annual Cap</th>
                </tr>
              </thead>
              <tbody>
                {PENALTY_TIERS.map((t) => (
                  <tr key={t.tier} className="border-b border-gray-50">
                    <td className="px-3 py-1.5 font-medium text-gray-900">{t.tier}</td>
                    <td className="px-3 py-1.5 text-gray-600">{t.culpability}</td>
                    <td className="px-3 py-1.5 text-gray-600">{t.min}</td>
                    <td className="px-3 py-1.5 text-gray-600">{t.max}</td>
                    <td className="px-3 py-1.5 font-medium text-red-600">{t.cap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500">
            Criminal penalties: up to $250,000 and 10 years imprisonment for intentional violations.
            HHS OCR confirmed Phase 3 compliance audits are underway as of March 2025.
          </p>
        </Section>

        {/* ─── 2. Recording Consent ─── */}
        <Section
          icon={<Mic size={20} />}
          title="Recording Consent Laws"
          status="action_needed"
          statusLabel="High Risk"
        >
          <p>
            <strong>This is the highest-risk legal area.</strong> State wiretapping and eavesdropping laws govern
            audio recording of conversations. A dental appointment is considered a private conversation where patients
            have a reasonable expectation of privacy.
          </p>

          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs font-semibold text-red-800 mb-1">13 states require ALL-PARTY consent.</p>
            <p className="text-xs text-red-700">
              In these states, the patient, dentist, AND every staff member present must explicitly consent to
              recording. Violations are criminal offenses — felony charges in some states (CA, FL, IL, MA, PA).
              Federal wiretap law (18 U.S.C. 2511) is one-party consent, but state laws override when stricter.
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">All-Party Consent States</h4>
          <LawTable rows={TWO_PARTY_STATES} />
          <p className="text-xs text-gray-500 mt-2">
            The remaining 37 states + DC are <strong>one-party consent</strong> — the dentist's consent (by operating
            the software) satisfies the legal requirement. However, HIPAA best practices still recommend informing
            the patient.
          </p>

          <h4 className="font-semibold text-gray-900 pt-2">Required Consent Workflow</h4>
          <div className="space-y-1.5">
            <Requirement met={false} text="Written consent form in patient intake paperwork (state-specific templates)" />
            <Requirement met={false} text="Visible signage in treatment rooms that audio recording is in use" />
            <Requirement met={false} text="Option for patients to opt out of recording" />
            <Requirement met={false} text="Consent from all staff members present (hygienists, assistants)" />
            <Requirement met={false} text="In-app consent confirmation before each recording session" />
            <Requirement met={false} text="Immediate audio deletion after transcription (don't store raw audio)" />
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Recommended Consent Language</h4>
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600 italic">
            "This dental office uses an AI-assisted documentation system that records audio during your appointment
            to generate clinical notes. The recording is processed locally on our in-office computer and is not sent
            to any external service. Audio is deleted immediately after your clinical note is generated. You may opt
            out at any time. Do you consent to this recording?"
          </div>
        </Section>

        {/* ─── 3. FDA ─── */}
        <Section
          icon={<Stethoscope size={20} />}
          title="FDA Regulation"
          status="compliant"
          statusLabel="Likely Exempt"
        >
          <p>
            <strong>SOAP note generation is likely NOT FDA-regulated</strong> as long as it remains strictly a
            documentation tool that captures what the dentist already said. The 21st Century Cures Act (Section 3060)
            exempts Clinical Decision Support (CDS) software that meets four criteria — including that a licensed
            professional makes the final clinical decision.
          </p>

          <div className="space-y-1.5">
            <Requirement met={true} text="Documentation tool, not diagnostic — captures dentist's own clinical observations" />
            <Requirement met={true} text="Dentist must review and approve every note before it enters the chart" />
            <Requirement met={true} text="No autonomous treatment recommendations or diagnostic conclusions" />
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Required Disclaimers</h4>
          <div className="space-y-1.5">
            <Requirement met={true} text="'AI-generated notes are drafts requiring clinician review and approval'" />
            <Requirement met={true} text="'Not a medical device — documentation assistance tool only'" />
          </div>
        </Section>

        {/* ─── 4. State Dental Boards ─── */}
        <Section
          icon={<Building2 size={20} />}
          title="State Dental Board Requirements"
          status="compliant"
          statusLabel="Aligned"
        >
          <p>
            State dental boards set documentation standards for clinical records. The universal requirement:
            <strong> a licensed dentist must review, verify, and sign off on all clinical notes</strong> before
            they become part of the patient record. AI can assist in drafting, but cannot be the final author.
          </p>

          <div className="space-y-1.5">
            <Requirement met={true} text="Mandatory dentist review and approval workflow before notes enter the chart" />
            <Requirement met={true} text="Notes identify the rendering provider (not the AI system)" />
            <Requirement met={true} text="Full edit capability — dentist can modify any part of the generated note" />
            <Requirement met={true} text="Audit trail showing who approved the note and when" />
          </div>

          <p>
            The ADA has published guidance encouraging responsible AI use in dentistry while emphasizing that
            AI tools should augment — not replace — clinical judgment. Your approve-before-chart workflow
            satisfies this standard.
          </p>
        </Section>

        {/* ─── 5. Malpractice & Liability ─── */}
        <Section
          icon={<Scale size={20} />}
          title="Malpractice & Liability"
          status="info"
          statusLabel="Uncharted Territory"
        >
          <p>
            <strong>No malpractice cases involving AI-generated clinical documentation have been litigated yet.</strong>{' '}
            This is uncharted territory. The key question: if an AI-generated note contains an error that leads to
            patient harm, who is liable?
          </p>

          <h4 className="font-semibold text-gray-900 pt-2">Liability Landscape</h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">The Dentist</p>
              <p className="text-xs text-gray-600">
                Bears primary liability. By reviewing and approving the note, the dentist takes clinical
                responsibility for its accuracy. This is your strongest liability shield — the mandatory
                approval workflow makes the dentist the "learned intermediary."
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">The Software Company (You)</p>
              <p className="text-xs text-gray-600">
                Could face product liability claims if the software systematically produces dangerous errors.
                Mitigate with: EULA liability limitations, warranty disclaimers, mandatory review workflow,
                errors and omissions (E&O) insurance, and professional liability insurance.
              </p>
            </div>
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Protective Measures</h4>
          <div className="space-y-1.5">
            <Requirement met={true} text="Mandatory dentist review before any note enters patient record" />
            <Requirement met={false} text="EULA with liability limitations and warranty disclaimers" />
            <Requirement met={false} text="Errors & Omissions (E&O) insurance for the company" />
            <Requirement met={false} text="Professional liability / cyber liability insurance" />
          </div>
        </Section>

        {/* ─── 6. Insurance & Billing ─── */}
        <Section
          icon={<DollarSign size={20} />}
          title="Insurance & Billing Compliance"
          status="compliant"
          statusLabel="Aligned"
        >
          <p>
            The <strong>False Claims Act (31 U.S.C. 3729)</strong> imposes treble damages plus $11,000+ per false
            claim submitted to government insurance programs. If AI generates inaccurate procedure codes or claim
            narratives, both the dental office and potentially the software company face liability.
          </p>

          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs font-semibold text-green-800 mb-1">Your current workflow is correct.</p>
            <p className="text-xs text-green-700">
              Smart Dental AI's claim workflow requires human verification at every step: draft claim → review
              by staff → manual submission. Claims are never auto-submitted. This is the right architecture.
            </p>
          </div>

          <h4 className="font-semibold text-gray-900 pt-2">Requirements</h4>
          <div className="space-y-1.5">
            <Requirement met={true} text="Claims are drafted as suggestions, never auto-submitted" />
            <Requirement met={true} text="Human review required before any claim submission" />
            <Requirement met={true} text="Claim narratives are editable before submission" />
            <Requirement met={false} text="Disclaimer that AI-suggested codes require verification by billing staff" />
          </div>

          <p className="text-xs text-gray-500">
            Anti-Kickback Statute and Stark Law are generally not applicable to software tools that don't involve
            referrals or financial relationships between providers. However, consult legal counsel to confirm.
          </p>
        </Section>

        {/* ─── 7. Data Privacy ─── */}
        <Section
          icon={<HardDrive size={20} />}
          title="Data Privacy Beyond HIPAA"
          status="info"
          statusLabel="Varies by State"
        >
          <p>
            Several state privacy laws layer additional requirements on top of HIPAA:
          </p>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">California (CCPA/CPRA)</p>
              <p className="text-xs text-gray-600">
                HIPAA-covered health data is largely exempt from CCPA. However, employee data and marketing data
                may still be covered. If you process data of California residents outside the treatment
                relationship, CCPA may apply.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">Children's Data (COPPA)</p>
              <p className="text-xs text-gray-600">
                If treating minors (pediatric dentistry), parental consent is required for collecting data from
                children under 13. HIPAA generally preempts COPPA for covered health data, but consult counsel.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">State Health Privacy Laws</p>
              <p className="text-xs text-gray-600">
                Texas, New York, and several other states have health privacy laws that add requirements beyond
                HIPAA, including stricter breach notification timelines and additional patient rights.
              </p>
            </div>
          </div>
        </Section>

        {/* ─── 8. Emerging AI Regulation ─── */}
        <Section
          icon={<Eye size={20} />}
          title="Emerging AI Regulation"
          status="info"
          statusLabel="Monitor"
        >
          <p>
            The AI regulatory landscape is evolving rapidly. Key developments to monitor:
          </p>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">Colorado AI Act (SB 24-205)</p>
              <p className="text-xs text-gray-600">
                Effective February 2026. Requires developers of "high-risk AI systems" to provide documentation
                about capabilities, limitations, and known risks. Healthcare AI may qualify as high-risk.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">White House AI Executive Order (Oct 2023)</p>
              <p className="text-xs text-gray-600">
                Directs HHS to develop AI safety standards for healthcare. NIST AI Risk Management Framework
                provides voluntary guidelines. No binding requirements yet, but signals the direction of regulation.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-900">ADA Position on AI in Dentistry</p>
              <p className="text-xs text-gray-600">
                The American Dental Association encourages responsible AI adoption and emphasizes that AI should
                augment clinical judgment, not replace it. No binding regulations from ADA, but their guidance
                influences state dental boards.
              </p>
            </div>
          </div>
        </Section>

        {/* ─── 9. Pre-Launch Checklist ─── */}
        <Section
          icon={<ClipboardList size={20} />}
          title="Pre-Launch Compliance Checklist"
          status="action_needed"
          statusLabel="12 Items Remaining"
          defaultOpen
        >
          <p>
            These items must be completed before selling Smart Dental AI to any dental office:
          </p>

          <h4 className="font-semibold text-gray-900 pt-1">Legal Documents</h4>
          <div className="space-y-1.5">
            <Requirement met={false} text="Business Associate Agreement (BAA) template — drafted by healthcare attorney" />
            <Requirement met={false} text="End User License Agreement (EULA) with liability limitations" />
            <Requirement met={false} text="State-specific recording consent form templates" />
            <Requirement met={false} text="Written HIPAA risk analysis document" />
            <Requirement met={false} text="Incident response plan" />
            <Requirement met={false} text="Data retention and deletion policy" />
          </div>

          <h4 className="font-semibold text-gray-900 pt-3">Technical Requirements</h4>
          <div className="space-y-1.5">
            <Requirement met={false} text="Database encryption at rest (SQLCipher or AES-256)" />
            <Requirement met={false} text="Real user accounts with unique IDs (replace shared demo login)" />
            <Requirement met={false} text="Session timeout / automatic logoff (15 min)" />
            <Requirement met={true} text="PHI audit logging (activity logs for access and modifications)" />
            <Requirement met={false} text="Secure audio file deletion after transcription" />
            <Requirement met={false} text="Multi-factor authentication" />
          </div>

          <h4 className="font-semibold text-gray-900 pt-3">Business Requirements</h4>
          <div className="space-y-1.5">
            <Requirement met={false} text="Healthcare regulatory attorney engagement ($15K–$50K budget)" />
            <Requirement met={false} text="Errors & Omissions (E&O) insurance policy" />
            <Requirement met={false} text="Cyber liability insurance policy" />
            <Requirement met={false} text="BAA executed with Open Dental" />
            <Requirement met={false} text="Designated HIPAA security officer" />
          </div>

          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 mt-3">
            <p className="text-xs font-semibold text-indigo-800 mb-1">What you CAN do now without legal risk:</p>
            <p className="text-xs text-indigo-700">
              Develop and test the software using simulated/demo data. Internal testing with fake patient data does
              not trigger HIPAA obligations. The compliance requirements activate when you process real patient
              health information in a production dental office.
            </p>
          </div>
        </Section>

      </div>

      <p className="mt-6 text-xs text-gray-400 text-center pb-4">
        Last updated: April 2026. This summary is for informational purposes only and does not constitute legal advice.
        Consult qualified healthcare regulatory counsel before making compliance decisions.
      </p>
    </div>
  );
}
