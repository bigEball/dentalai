# Subprocessor and Vendor Checklist

Use this checklist before enabling any production office deployment or module that may process PHI, patient contact information, payment data, insurance data, clinical data, audio, transcripts, images, or support files.

## 1. Customer-Specific Vendor Inventory

Customer: **[Dental Practice Legal Name]**  
Office: **[Office Address]**  
Deployment date: **[Date]**  
Prepared by: **[Name]**

| Vendor/System | Purpose | Data Types | PHI? | BAA Required? | BAA Signed? | Notes |
|---|---|---|---:|---:|---:|---|
| DentalAI / [Vendor] | Software/services | Patient, clinical, billing, insurance | Yes | Yes | [ ] | |
| Open Dental | Practice management | Dental record, billing, claims | Yes | Customer/Open Dental | [ ] | |
| OpenAI / Anthropic / other AI provider | AI processing | Transcripts, notes, prompts | [ ] | [ ] | [ ] | Disable PHI unless BAA in place |
| Ollama/local model | Local AI | Transcripts, notes | Yes/local | N/A vendor if fully local | [ ] | Verify no telemetry |
| Twilio / SMS provider | Text messaging | Contact info, message content | [ ] | [ ] | [ ] | |
| SendGrid / email provider | Email | Contact info, message content | [ ] | [ ] | [ ] | |
| Clearinghouse | Claims/eligibility | Insurance, claims | Yes | [ ] | [ ] | |
| Payment processor | Payments | Payment data, balances | [ ] | [ ] | [ ] | Check PCI and HIPAA posture |
| Cloud hosting | Hosting/storage | Application data | [ ] | [ ] | [ ] | |
| Error logging/monitoring | Logs | Possible PHI | [ ] | [ ] | [ ] | Scrub PHI or disable |
| Analytics | Usage analytics | Possible identifiers | [ ] | [ ] | [ ] | Avoid PHI |
| Remote support tool | Support access | Screen/PHI possible | [ ] | [ ] | [ ] | |
| Backup provider | Backup | Database/files | [ ] | [ ] | [ ] | |

## 2. Module Readiness

### Core App

- [ ] MSA signed.
- [ ] BAA signed.
- [ ] Security Addendum signed.
- [ ] Implementation SOW signed.
- [ ] Customer technical contact identified.
- [ ] Customer privacy/security contact identified.
- [ ] Minimum technical requirements confirmed.
- [ ] Customer backup confirmed.

### Open Dental

- [ ] Open Dental Integration Authorization signed.
- [ ] API access approved by Customer.
- [ ] API permissions documented.
- [ ] Delete permissions disabled unless expressly approved.
- [ ] Write-back actions documented.
- [ ] API keys stored securely.
- [ ] Credential rotation/disable process documented.

### AI Notes / Audio

- [ ] AI Clinical Use Addendum signed.
- [ ] Patient Recording and AI Consent approved by counsel/practice.
- [ ] Staff Recording and AI Policy adopted.
- [ ] Audio retention configured.
- [ ] Transcript retention configured.
- [ ] Human review workflow enabled.
- [ ] Cloud AI disabled unless BAA/vendor approval complete.

### Patient Communications

- [ ] Patient Communications Addendum signed.
- [ ] SMS/email vendor reviewed.
- [ ] BAA signed if required.
- [ ] Patient communication consent language approved.
- [ ] Opt-out workflow tested.
- [ ] Templates approved by Customer.
- [ ] Automated sending disabled until approved.

### Billing and Insurance

- [ ] Billing and Insurance Addendum signed.
- [ ] Clearinghouse/payer terms reviewed.
- [ ] BAA signed if required.
- [ ] Claim review workflow enabled.
- [ ] Estimates labeled as estimates.
- [ ] User permissions limited to authorized billing staff.

### Payments

- [ ] Payment processor reviewed.
- [ ] PCI responsibilities reviewed.
- [ ] Refund/dispute process documented.
- [ ] Payment communications reviewed.
- [ ] Stored payment data minimized.

## 3. Data Flow Review

For each enabled module, document:

- Data source.
- Data destination.
- Whether PHI is included.
- Whether data leaves Customer's local network.
- Whether data is encrypted in transit.
- Whether data is encrypted at rest.
- Retention period.
- Deletion process.
- Support access process.

## 4. Go/No-Go Decision

- [ ] Approved for production.
- [ ] Approved for pilot only.
- [ ] Not approved.

Conditions or open items:

1. **[Item]**
2. **[Item]**
3. **[Item]**

Approver: ___________________________  
Title: ______________________________  
Date: _______________________________
