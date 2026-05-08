# Open Dental Integration Authorization

This Open Dental Integration Authorization (**Authorization**) is entered into by **[Dental Practice Legal Name]** (**Customer**) and **[Vendor Legal Name]** (**Vendor**) under the Master Services Agreement.

## 1. Purpose

Customer authorizes Vendor to assist with configuration and use of Open Dental API access for the purpose of providing DentalAI services selected by Customer.

## 2. Authorized Integration Method

The Parties will use the official Open Dental API or another Open Dental-supported integration method unless otherwise approved in writing by Customer after disclosure of risks.

Vendor will not write directly to Open Dental database tables except through an authorized method approved by Open Dental and Customer.

## 3. Customer Authorization

Customer authorizes Vendor to:

- Help Customer enable Open Dental API access.
- Generate, receive, configure, or use API credentials as necessary for the Services.
- Read Open Dental data for enabled modules.
- Create or update Open Dental records only if the applicable module and permission are expressly enabled.
- Troubleshoot API connectivity and sync issues.

Customer remains responsible for approving API permissions and deciding whether to enable, disable, or revoke Vendor access.

## 4. Minimum Necessary Permissions

API permissions must be limited to the minimum resources and actions necessary for enabled modules.

Approved permissions:

| Resource | Read | Create | Update | Delete | Purpose |
|---|---:|---:|---:|---:|---|
| Patients | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Appointments | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Providers | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Procedures | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Procedure codes | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Claims | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Insurance plans | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Recall | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Payments | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Documents/images | [ ] | [ ] | [ ] | [ ] | [Describe] |
| Other | [ ] | [ ] | [ ] | [ ] | [Describe] |

Delete permissions should remain disabled unless specifically required, documented, and approved by Customer.

## 5. API Keys and Credentials

Customer will not share credentials through unsecured channels. Vendor will store API keys and credentials using reasonable safeguards.

Customer should disable or rotate API keys:

- When Vendor access is no longer needed.
- Upon suspected compromise.
- Upon termination of the Services.
- Upon material personnel or configuration changes.

## 6. Data Accuracy

Open Dental remains the system of record unless otherwise agreed. Customer is responsible for validating data displayed, imported, synced, generated, or written by the Services.

Vendor is not responsible for errors caused by inaccurate source data, Open Dental configuration, permission limitations, API changes, third-party outages, or Customer/user actions.

## 7. Write-Back Controls

If write-back to Open Dental is enabled:

- Customer must identify which users may approve write-back actions.
- Clinical notes must be reviewed and approved by licensed dental professionals before finalization.
- Billing, claims, payments, and insurance updates must be reviewed by authorized Customer personnel.
- Vendor may implement logs, confirmations, or approval gates for write-back actions.

Approved write-back actions:

- [ ] Create draft clinical note.
- [ ] Update approved clinical note.
- [ ] Create appointment.
- [ ] Update appointment.
- [ ] Create task/recall item.
- [ ] Update claim status.
- [ ] Create payment.
- [ ] Other: **[Describe]**.

## 8. Support Access

Customer authorizes Vendor to access integration logs, sync status, and configuration information as needed to support the Open Dental integration. PHI access during support is governed by the Business Associate Agreement.

## 9. Termination of Access

Upon termination or Customer request, Vendor will stop using Customer's Open Dental API credentials. Customer is responsible for disabling or revoking credentials in Open Dental and related portals unless Vendor controls the credential and has agreed to revoke it.

## 10. Signatures

**Vendor:** [Vendor Legal Name]  
By: ___________________________  
Date: _________________________

**Customer:** [Dental Practice Legal Name]  
By: ___________________________  
Date: _________________________
