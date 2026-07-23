# Project screenshots — checklist

`portfolio_data.yaml` references every filename below. Until a file exists, that
project falls back to a gradient placeholder — the site *looks* fine to you, but
every visitor sees a developer portfolio with no screenshots at all. This is the
single biggest conversion problem on the site.

## Specs

- **1200 × 630 px** (same ratio as the OG cover, so any of these can double as a
  social preview image)
- PNG, optimised
- **Sanitised**: blur or replace client names, real customer data, real pricing.
  The safest route is to rebuild the module in Odoo's demo database with dummy
  data and screenshot that.
- If confidentiality blocks a screenshot entirely, use a hand-drawn architecture
  diagram instead. A clean flow diagram of the Sage ↔ Odoo sync demonstrates
  engineering thinking *better* than a UI screenshot does.

## Files needed

### Client projects — priority order

| File | Project | Suggested shot |
|---|---|---|
| `odoo-employee-self-service-portal.png` | TTI Employee Portal | The portal landing view — OWL work, lead with it |
| `odoo-attendance-dashboard-owl.png` | TTI Attendance Dashboard | The OWL dashboard with aggregated data. Your strongest OWL evidence |
| `odoo-field-sales-person-module.png` | Field Sales Person | Rep/territory assignment, or the OWL field interface |
| `odoo-employee-loan-management.png` | TTI Loan Management | Loan request form + installment schedule |
| `odoo-sage-accounting-integration.png` | Sage Integration | Sync pipeline diagram, or the synced invoice list in Odoo Accounting |
| `odoo-mastercard-payment-provider.png` | Mastercard Payment Provider | Payment provider config screen + a completed transaction |
| `odoo-bom-versioning-manufacturing.png` | Silicon Signs ERP | The BOM comparison view — your most technically impressive screen |
| `odoo-16-to-17-hr-payroll-migration.png` | HRMS Bundle Migration | Before/after payroll structure, or the migration validation output |
| `odoo-metered-billing-ringfree-integration.png` | RingFree Integration | Usage → invoice flow, or the generated billing report |
| `odoo-sale-order-lifecycle-automation.png` | Tazah Sale Order Flow | The lifecycle stages on a sale order |
| `odoo-clinical-erp-biometric-attendance.png` | ClearPath Orthodontics | Doctor Portal, or the multi-branch attendance dashboard |
| `odoo-19-meta-ads-lead-sync.png` | Axis Marketing Management | Contract/licence renewal tracking, or the Meta lead sync |
| `odoo-operational-exception-reporting.png` | Fell ERP | A daily exception report |
| `odoo-18-enterprise-ui-customization.png` | Prime Global Imports ERP | The custom sidebar / home menu |

### University & personal projects — lower priority

| File | Project |
|---|---|
| `showroom-react-native-app.png` | Showroom Ecommerce (app + backend, shared image) |
| `idea-pitching-android-firebase.png` | Idea Pitching App |
| `pavobixbox-django-firebase.png` | PavoBixbox |
| `cv-maker-dotnet-mvc.png` | Simple CV Maker |

### Already generated

| File | Purpose |
|---|---|
| `og-cover.png` | Open Graph / social preview card. Regenerate if your headline stats change. |

## Note on alt text

Alt text is generated from `project.title` + `project.category` in `app.js`, so
improving project titles in the YAML improves alt text for free.
