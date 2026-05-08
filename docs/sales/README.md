# Sales Enablement Documents

Sales material is split between internal playbooks, customer-facing collateral, generated PDFs, and rendering scripts.

## Contents

| Folder | Contents |
| --- | --- |
| [playbooks](playbooks/README.md) | Internal Summit AI Services sales playbooks. |
| [collateral](collateral/README.md) | Customer-facing office collateral. |
| [dist](dist/) | Generated PDF versions of sales collateral. |

## PDF Generation

Run these from the repo root:

```bash
npm run docs:sales:playbook
npm run docs:sales:leavebehind
```

The sales playbook renderer reads `docs/sales/playbooks/summit-sales-playbook/source.md` by default and writes to `docs/sales/dist/`.
