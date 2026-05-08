# Security and Data Protection Addendum

This Security and Data Protection Addendum (**Addendum**) supplements the Master Services Agreement and Business Associate Agreement between **[Vendor Legal Name]** (**Vendor**) and **[Dental Practice Legal Name]** (**Customer**).

## 1. Shared Security Model

Security is a shared responsibility.

Vendor is responsible for safeguards within the Services and Vendor-controlled systems. Customer is responsible for safeguards within Customer-controlled workstations, servers, Open Dental environment, user accounts, network, backups, physical office, and staff workflows.

## 2. Vendor Safeguards

Vendor will maintain a written information security program appropriate to the nature of the Services and the sensitivity of Customer Data, including PHI.

Vendor safeguards will include:

- Access controls for Vendor systems.
- Unique accounts for Vendor personnel with access to production systems.
- Least-privilege access.
- Authentication controls, including MFA where reasonably available for administrative access.
- Encryption in transit for internet-accessible services.
- Encryption at rest for Vendor-controlled systems storing PHI, where technically feasible.
- Audit logging for material PHI access and administrative activity where supported.
- Secure development practices.
- Vulnerability management for Vendor-controlled software and infrastructure.
- Incident response procedures.
- Workforce confidentiality obligations.
- Workforce security training.
- Subcontractor review for vendors that may handle PHI.

## 3. Customer Safeguards

Customer will maintain safeguards for its office environment, including:

- Unique user accounts for each workforce member.
- Role-based access according to job duties.
- Prompt user deactivation after termination or role change.
- Strong passwords and MFA where available.
- Screen lock and session timeout.
- Disk encryption for devices storing PHI.
- Current operating system and browser updates.
- Endpoint protection.
- Firewall and network protections.
- Secure Wi-Fi configuration.
- Physical access controls for servers and workstations.
- Secure disposal of media containing PHI.
- Current, tested backups for Customer-controlled systems.
- HIPAA security risk analysis and risk management process.

## 4. Local Installation Requirements

If the Services are installed locally, Customer is responsible for:

- Providing a secure workstation or server.
- Restricting local administrator access.
- Preventing shared accounts.
- Protecting local databases, logs, exports, audio, transcripts, and attachments.
- Maintaining backups for data stored locally.
- Not exposing local services to the public internet unless approved in writing by Vendor and secured appropriately.

## 5. Remote Support

Vendor may provide remote support only through approved support channels. Customer must avoid sending PHI through ordinary email, unsecured chat, or unapproved file transfer tools.

If screen sharing is used, Customer should minimize PHI visible on screen unless PHI access is necessary for support and covered by the Business Associate Agreement.

Vendor support personnel will access Customer systems only as reasonably necessary to provide support, troubleshoot, implement, or secure the Services.

## 6. Credentials and API Keys

Customer and Vendor will protect credentials, tokens, and API keys.

Customer will:

- Use unique credentials where possible.
- Avoid sharing credentials between users.
- Store API keys securely.
- Promptly rotate or disable credentials suspected of compromise.
- Disable Open Dental or third-party access when no longer needed.

Vendor will not ask Customer to send passwords, API keys, or secrets through unsecured channels.

## 7. Audit Logs

Where supported by the Services and enabled modules, Vendor will maintain logs of material system activity, which may include:

- User login/logout.
- PHI access.
- Record creation, update, approval, deletion, or export.
- AI note generation and approval.
- Open Dental sync events.
- Administrative setting changes.
- Patient communication events.

Log retention period: **[Insert period]** unless a different period is required by law, the Business Associate Agreement, or technical constraints.

## 8. Backups and Disaster Recovery

Vendor will maintain backup and recovery procedures for Vendor-controlled systems.

Customer is responsible for backup and recovery of Customer-controlled systems, including Open Dental databases, local DentalAI installations, local exports, local audio/transcript storage, and office workstations unless Vendor expressly agrees otherwise in a statement of work.

Customer should test backups regularly.

## 9. Data Retention and Deletion

Default retention settings:

- Audio recordings: **[Delete after transcription verification / retain for X days / not enabled]**.
- Transcripts: **[Retain as part of clinical documentation workflow / delete after note approval / X days]**.
- AI draft notes: **[Retain until approved/deleted / X days]**.
- Approved notes: retained according to Customer's record retention policy and applicable law.
- Audit logs: **[X years/months]**.
- Support files containing PHI: **[X days]** unless needed for legal or security purposes.

Customer is responsible for configuring retention settings consistent with its legal and professional obligations.

## 10. Incident Response

Each Party will promptly notify the other of suspected security incidents affecting the Services or Customer Data.

Business Associate breach notification obligations are governed by the Business Associate Agreement.

The Parties will reasonably cooperate to investigate, contain, mitigate, and remediate security incidents.

## 11. Vulnerability Reporting

Customer may report suspected vulnerabilities to **[security email]**. Vendor will review reports in good faith and prioritize remediation based on risk.

Customer will not perform penetration testing, vulnerability scanning, load testing, reverse engineering, or security testing of Vendor systems without prior written authorization.

## 12. Subprocessors

Vendor will maintain a list of material subprocessors that may process Customer Data or PHI. Vendor will ensure subprocessors that handle PHI are bound by written obligations consistent with HIPAA where required.

## 13. No Absolute Security

No system can be guaranteed completely secure. Vendor does not warrant that the Services or Customer environment will be immune from unauthorized access, malware, ransomware, third-party attacks, user error, or configuration mistakes.

## 14. Signatures

**Vendor:** [Vendor Legal Name]  
By: ___________________________  
Date: _________________________

**Customer:** [Dental Practice Legal Name]  
By: ___________________________  
Date: _________________________
