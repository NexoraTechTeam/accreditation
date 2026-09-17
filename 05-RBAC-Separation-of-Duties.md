# RBAC & Separation of Duties Specification — NexAccred

**Version:** 1.0

This document exists as a standalone deliverable because separation of duties is an **accreditation requirement in its own right**, not merely a technical access-control concern. ISO/IEC 17021-1 requires that impartiality be safeguarded and that decisions be made by competent, appropriately authorised personnel. A permission model that lets the wrong person change the rules is itself a nonconformity waiting to be found.

---

## 1. Design Model

Permissions are composed as **entity domain × access level**, never hard-wired per screen. A new role is therefore a data record, not a code change.

### Entity domains

| Domain | Covers |
|---|---|
| `Requirements` | Accreditation Bodies, Standards, Schemes, Requirements, Compliance |
| `Evidence` | Documents, Evidence Repository, Forms, Records, Required Document Types |
| `Personnel` | Personnel & Competence, Competence Matrix *(read-only from AIHCM; auditor authorization/expiry is NexAccred-owned)* |
| `FindingsCAPA` | Findings, CAPA, Risk, Impartiality, Internal & AB Assessment |
| `Reporting` | Compliance Report, Assessment Pack, Management Report, Analytics |
| `Administration` | Users, Roles, Organization, Workflow, Notifications, Integrations, Audit Trail |

### Access levels

`NoAccess` < `View` < `Edit` < `Approve`

---

## 2. The Permission Matrix

| Role | Requirements | Evidence | Personnel | Findings/CAPA | Reporting | Administration |
|---|---|---|---|---|---|---|
| Top Management | View | View | View | View | View | No Access |
| **Head of Accreditation** | **Edit** | Edit | Edit | Approve | Edit | View |
| Accreditation Staff | Edit | Edit | View | View | View | No Access |
| Document Controller | View | Edit | No Access | No Access | View | No Access |
| Certification Manager | View | Edit | View | View | View | No Access |
| Technical Manager | Edit | View | Edit | View | View | View |
| Lead Auditor / Auditor | View | Edit | View | View | No Access | No Access |
| Technical Reviewer / Decision Maker | View | View | View | View | No Access | No Access |
| Internal Auditor | View | View | No Access | Edit | View | No Access |
| Impartiality Committee | No Access | No Access | No Access | Edit | View | No Access |
| **System Administrator** | **No Access** | **No Access** | **No Access** | **No Access** | **No Access** | **Approve** |

---

## 3. The Two Critical Boundaries

### 3.1 Business content ≠ system administration

**The System Administrator is not a super-admin.**

| Question | Owner |
|---|---|
| Which Accreditation Bodies do we hold accreditation from? | Head of Accreditation |
| Which schemes do we operate, against which standards? | Head of Accreditation |
| What does clause 7.2.3 actually require of us? | Head of Accreditation |
| What counts as acceptable evidence? | Head of Accreditation |
| How is readiness weighted? | Head of Accreditation |
| **Who can log into the system?** | System Administrator |
| **What is each role permitted to touch?** | System Administrator |
| **Which external systems are connected?** | System Administrator |

**Rationale.** Deciding that ISO/IEC 27006-1 clause 9.4.4 applies to your ISO 27001 scheme is a conformity-assessment judgement requiring domain competence. An IT administrator has neither the competence nor the authority to make it. Conversely, the Head of Accreditation should not be provisioning accounts.

If a single role could do both, an administrator could quietly weaken a requirement, lower a readiness weight, or delete an inconvenient standard — and the audit trail would show it as routine configuration. That is precisely the impartiality risk accreditation exists to prevent.

**Deliberate consequence:** there is no role in NexAccred that can do everything. This is a feature.

### 3.2 Assurance independence

The **Internal Auditor** and **Impartiality Committee** hold `Edit` on `FindingsCAPA` but cannot alter the requirements they audit against (`View` and `NoAccess` respectively on `Requirements`).

An internal auditor who could edit a requirement could make a finding disappear by redefining the rule. Read-only access to the requirement graph is what makes internal audit meaningful — they assess against the *same* graph an AB assessor will use.

The **Impartiality Committee** is the most restricted role in the system by design: `NoAccess` to Requirements, Evidence, and Personnel. Its independence depends on it having no operational stake in what it reviews.

---

## 4. Role-Based UX

Permissions drive navigation and dashboards, not just API authorisation.

| Role | Nav items | Dashboard focus |
|---|---|---|
| Head of Accreditation | 41 | Readiness gauge, all schemes, why-not-ready, fix-first |
| Accreditation Staff | 25 | Task queue, schemes in setup, workload snapshot |
| Internal Auditor | 14 | My findings, internal assessment calendar |
| Document Controller | 9 | Evidence needing attention, records pending, pack completeness |
| System Administrator | 8 | Users, roles, integrations, audit trail |
| Impartiality Committee | 5 | Declarations for review, impartiality safeguard watch |

**Each dashboard is purpose-built, not a trimmed copy.** The Impartiality Committee dashboard is not the executive dashboard with widgets removed — it shows declarations and the impartiality safeguard CAPA, and nothing else.

The System Administrator dashboard deliberately has **no readiness gauge and no task board**, and states why on screen. An empty-looking dashboard invites a support ticket; an explained one communicates the security model.

---

## 5. Enforcement Requirements

> **Implementation note.** In the current prototype, role filtering is applied at the UI layer only — navigation and dashboards are tailored per role, but a user who knows a route name could still reach it. This is acceptable for a prototype and **must not ship to production**.

| Requirement | Priority |
|---|---|
| Every API endpoint validates `role_permission` server-side before returning or mutating data | Must |
| UI filtering is treated as convenience only, never as a security boundary | Must |
| Permission checks evaluate entity domain + access level, not role name (so new roles work without code) | Must |
| Every permission change is written to the immutable audit trail with actor, timestamp, before/after | Must |
| Readiness config changes (weights, thresholds) are audit-trailed — they change every score in the portfolio | Must |
| A role cannot grant itself a permission it does not hold | Must |
| Session role is re-validated server-side on every request, never trusted from the client | Must |

---

## 6. Extension Guidance

New roles are expected. Compose them from the matrix rather than requesting code:

| Prospective role | Suggested composition |
|---|---|
| Sector Scheme Owner | Requirements: Edit (scoped to owned schemes) · Evidence: View · Findings: View |
| External Consultant | Requirements: View · Evidence: View · everything else: No Access · time-boxed |
| Client Contact *(future portal)* | All domains: No Access · separate client-scoped model, not this matrix |
| Regional Accreditation Manager | Head of Accreditation composition, scoped to one Accreditation Body |

**Scoping caveat.** The current matrix grants access by *domain*, not by *record*. "Edit requirements, but only for schemes I own" requires row-level scoping, which is a v2 extension. Until then, scheme-level ownership should be handled by convention and audit trail rather than assumed to be enforced.
