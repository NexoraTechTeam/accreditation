# Product Requirements Document — NexAccred

**Product:** NexAccred — AI-Powered Accreditation Compliance & Readiness Platform
**Version:** 1.0
**Status:** Draft for review
**Tagline:** *"If the Accreditation Body comes tomorrow, are we ready?"*

---

## 1. Problem Statement

Conformity Assessment Bodies (CABs) — especially Certification Bodies — hold accreditation from one or more Accreditation Bodies (KAN, UKAS, ANAB, JAS-ANZ, etc.). Losing or suspending that accreditation is an existential risk: it invalidates every certificate the CAB has issued under that scope.

Yet most CABs cannot answer a simple question on any given day: **"If the AB assessor arrived tomorrow, would we pass?"**

The reasons are structural, not a matter of effort:

| Problem | Consequence |
|---|---|
| Compliance evidence is scattered across shared drives, email, and spreadsheets | Nobody knows what's missing until the assessor asks |
| Readiness is assessed *reactively*, weeks before a scheduled visit | Gaps surface too late to fix properly |
| A document existing is treated as proof of compliance | Expired, unapproved, or unimplemented documents pass unnoticed |
| Auditor competence expiry is tracked manually | A scheme silently becomes non-compliant when its only qualified lead auditor lapses |
| Adding a new scheme or standard requires a developer | The system lags behind the accreditation reality it's meant to model |
| Witness audit obligations are tracked in someone's head | A mandatory AB requirement goes unmet until the visit itself |

**NexAccred exists to answer one question continuously, not periodically.**

---

## 2. Product Positioning

NexAccred is **not**:
- a document management system
- an ISO checklist
- a generic audit management tool
- a compliance dashboard

NexAccred **is** a readiness engine that connects the full accreditation chain:

```
Requirement → Scheme → Process → Personnel → Competence → Document →
Evidence → Implementation → Assessment → Finding → CAPA → Risk → Readiness
```

### Differentiator

Every competitor can tell you what documents you have. NexAccred tells you **whether you would pass, why not, and what to fix first** — recalculated continuously, with every claim traceable to a specific requirement and piece of evidence.

---

## 3. Target Users

### Primary market
Conformity Assessment Bodies accredited (or seeking accreditation) under ISO/IEC 17021-1, 17020, 17024, 17065, 17029.

### User personas

| Persona | Primary need | Success looks like |
|---|---|---|
| **Head of Accreditation** (primary user) | Own readiness end-to-end across all schemes and ABs | Can answer "are we ready" in under 60 seconds, any day |
| **Accreditation Staff** | Execute the day-to-day scheme admin and task follow-through | Knows exactly what to do next, in priority order |
| **Internal Auditor** | Raise findings against the same requirement graph the AB uses | Internal audit predicts AB findings instead of missing them |
| **Impartiality Committee** | Review conflict declarations independently | Sees only impartiality matters — no noise, no undue access |
| **Document Controller** | Ensure required documents and evidence exist and are current | Knows what *should* exist, not just what does |
| **System Administrator** | Manage access, roles, and integrations | Zero access to compliance content — separation of duties enforced |
| **Top Management** | Executive oversight of accreditation risk | One number, one color, one sentence on risk |

---

## 4. Core Design Principles

### P1 — Configuration-driven, never hard-coded
Standards and schemes are **data objects**, not application modules. There is no "ISO 27001 module." The same engine serves ISO 9001, 27001, 27701, 14064, and any future scheme.

**Acceptance test:** A Head of Accreditation can add a new Accreditation Body, standard, scheme, and requirement without a developer, a deployment, or a support ticket.

### P2 — Evidence-based compliance
A requirement is never marked compliant simply because a document exists. The chain is:

```
Requirement → Control → Implementation → Evidence → Evaluation → Effectiveness → Compliance
```

Evidence is judged on **availability, validity, completeness, authenticity, recency, approval status, and effectiveness** — not existence.

### P3 — Readiness is computed, never stored
Readiness has no independent existence in the database. It is the traversal result of the requirement graph at query time. This is why "why aren't we ready" is always answerable — the system walks the graph backward from the failing node.

### P4 — Blocking rules over averages
A high weighted score must never hide a critical gap. Blocking rules can only push a readiness band **down**, never up.

### P5 — Separation of duties
Who defines the **rules** (Head of Accreditation) is distinct from who manages **system access** (System Administrator). The administrator has zero authority over requirement content.

### P6 — Don't duplicate the system of record
Operational certification activity lives in **Platform Audit**; personnel competency lives in **AIHCM**. NexAccred consumes both read-only. Screens sourced from either system are clearly marked with which system and never editable in NexAccred.

### P7 — Guide by intent, not by clause
Users should not need to know which ISO clause to check. The system asks "what do you want to achieve?" — *prepare for AB assessment, check readiness, find missing evidence, review competence*.

---

## 5. Functional Requirements

### FR-1 — Accreditation Body Management
| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Register multiple Accreditation Bodies (KAN, UKAS, ANAB, etc.) via UI without code change | Must |
| FR-1.2 | One AB covers many schemes; each scheme belongs to exactly one AB | Must |
| FR-1.3 | Track accreditation number, country, accredited-since date, status per AB | Must |
| FR-1.4 | View all schemes under a given AB with their individual readiness | Must |

### FR-2 — Standards & Requirement Engine
| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Maintain a configurable library of accreditation standards and supporting requirements | Must |
| FR-2.2 | Add a new standard via UI (name/version, type, clause count, description, issuer) | Must |
| FR-2.3 | Add a requirement via UI (standard, clause, type, text, mandatory flag, initial status) | Must |
| FR-2.4 | Requirement types: Policy, Process, Personnel, Competence, Impartiality, Resource, Operational, Record, Evidence, Monitoring, Review, Effectiveness | Must |
| FR-2.5 | Requirement ownership belongs to Head of Accreditation, **not** System Administrator | Must |
| FR-2.6 | Support effective date and superseded/expiry date per requirement | Should |
| FR-2.7 | Applicability rules — which schemes/roles a requirement applies to | Should |

### FR-3 — Scheme Engine
| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | A scheme combines a primary accreditation standard + supporting standards + IAF/AB rules | Must |
| FR-3.2 | Two-step scheme creation: **Register** (creates a visible Draft) then **Configure** (10-step wizard) | Must |
| FR-3.3 | Draft schemes are visible in scope with no computed readiness score | Must |
| FR-3.4 | Scheme activation requires no deployment | Must |
| FR-3.5 | Scheme configuration defines competence criteria, technical areas, evidence and assessment requirements | Must |

### FR-4 — Compliance & Evidence Engine
| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | Compliance matrix: requirement × evidence category (Document, Record, Operational, Personnel, System) | Must |
| FR-4.2 | Compliance statuses: Not Assessed, Compliant, Partially Compliant, Non-Compliant, Not Applicable | Must |
| FR-4.3 | Evidence statuses: Verified, Partially Verified, Pending Verification, Missing, Expired | Must |
| FR-4.4 | Configure **required document types** per scheme, distinct from documents that actually exist | Must |
| FR-4.5 | Flag gaps between required and actual documents | Must |

### FR-5 — Readiness Engine *(core differentiator)*
| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Compute readiness across 8 pillars: Requirements, Evidence, Personnel, Competence, Operations, Documentation, Assurance, CAPA | Must |
| FR-5.2 | Pillar weights configurable via UI; no hard-coded weighting | Must |
| FR-5.3 | Band thresholds configurable (default: Ready ≥90, Risks ≥75, Not Yet Ready ≥60, Not Ready <60) | Must |
| FR-5.4 | Blocking rules cap the band downward only | Must |
| FR-5.5 | Explain *why* a band differs from the raw weighted score, in plain language | Must |
| FR-5.6 | Recalculate on every load — never serve a stored snapshot | Must |
| FR-5.7 | Dedicated Methodology screen documenting and exposing the calculation | Must |

**Blocking rules (v1):**

| Rule | Effect |
|---|---|
| 1 unresolved critical gap | Cap at *Ready with Risks* |
| 2+ unresolved critical gaps | Cap at *Not Yet Ready* |
| Competence pillar < 60% | Cap at *Not Yet Ready* |
| Outstanding witness audits with <30 days to AB visit | Cap at *Not Yet Ready* |

### FR-6 — Assessment Management
| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | Track next AB assessment per scheme (type + date), across all ABs | Must |
| FR-6.2 | Upcoming schedule sorted nearest-first, including draft schemes as "not yet scheduled" | Must |
| FR-6.3 | Assessment types: Initial, Surveillance, Reassessment, Scope Extension, Witness, Extraordinary | Must |
| FR-6.4 | Assessment Preparation wizard generating gaps, risks, missing evidence, expired competence, open CAPA | Must |
| FR-6.5 | Assessment Evidence Pack organized by requirement (internal navigation tool, not auto-exposure of confidential docs) | Must |

### FR-7 — Witness Audit Tracking
| ID | Requirement | Priority |
|---|---|---|
| FR-7.1 | Track witness audits required vs completed, per scheme, per cycle | Must |
| FR-7.2 | Record each witness event: auditor witnessed, AB assessor, date, result | Must |
| FR-7.3 | Witness results: Pass, Minor NC, Major NC, Scheduled, Outstanding | Must |
| FR-7.4 | Outstanding witnesses surface first and feed the readiness blocking rules | Must |

### FR-8 — Task Management
| ID | Requirement | Priority |
|---|---|---|
| FR-8.1 | Every readiness gap, risk, and finding resolves to a task with an owner and due date | Must |
| FR-8.2 | Task status: Not Started, In Progress, Done — with *Overdue* computed from due date, never stored | Must |
| FR-8.3 | Filter by All / Open / Overdue / Done | Must |
| FR-8.4 | Task links back to its source scheme and requirement | Must |

### FR-9 — Findings, CAPA & Risk
| ID | Requirement | Priority |
|---|---|---|
| FR-9.1 | Findings from: Internal Audit, AB Assessment, Witness, Complaint, Appeal, Impartiality Review, Management Review | Must |
| FR-9.2 | CAPA workflow: Correction → Root Cause → Corrective Action → Verification → Effectiveness → Closure | Must |
| FR-9.3 | Risk categories: Accreditation, Scheme, Competence, Operational, Documentation, Evidence, Assessment | Must |
| FR-9.4 | Every finding links to requirement, scheme, evidence, and CAPA | Must |

### FR-10 — AI Layer
| ID | Requirement | Priority |
|---|---|---|
| FR-10.1 | AI operates on the structured compliance graph, not as a generic chatbot | Must |
| FR-10.2 | Every AI answer cites its source requirement, document, or evidence record | Must |
| FR-10.3 | AI functions: Accreditation Assistant, Gap Analysis, Assessment Simulator, Evidence Finder, Impact Analysis, Readiness Advisor, Change Assistant | Must |
| FR-10.4 | AI **must not** make formal accreditation compliance decisions — advisory only, clearly labelled | Must |
| FR-10.5 | AI-sourced content visually distinct (violet accent) from system-of-record data | Should |

### FR-11 — Role-Based Experience
| ID | Requirement | Priority |
|---|---|---|
| FR-11.1 | Navigation filtered per role — each role sees only relevant modules | Must |
| FR-11.2 | Each role has a purpose-built dashboard, not a trimmed copy of one dashboard | Must |
| FR-11.3 | Permissions composed per entity-type, not hard-wired per screen | Must |
| FR-11.4 | New roles composable via Administration without code change | Must |
| FR-11.5 | System Administrator has **no access** to accreditation bodies, schemes, standards, requirements, evidence, personnel, findings, or reporting | Must |

### FR-12 — External System Integration (Platform Audit & AIHCM)
| ID | Requirement | Priority |
|---|---|---|
| FR-12.1 | Consume read-only from **Platform Audit**: Application & Certification Lifecycle, Audit Execution, Technical Review, Certification Decisions | Must |
| FR-12.1a | Consume read-only from **AIHCM**: Personnel Competency (employee identity + competency level; CAB-specific authorization/expiry is NexAccred's own record — see Data Model §1.5, §2.7a) | Must |
| FR-12.2 | Screens sourced from either system are clearly marked with which system, sync status, and last-sync time | Must |
| FR-12.3 | Workload viewable per scheme (e.g. of 746 applications in review, how many are ISO 27001) | Must |
| FR-12.4 | NexAccred never duplicates application review, scheduling, technical review, certificate issuance (Platform Audit), or competency management (AIHCM) | Must |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Readiness recalculation for a 5-scheme portfolio must complete within 2s on page load |
| **Usability** | Head of Accreditation can identify the single highest-priority issue within 60 seconds of login |
| **Auditability** | Every state-changing action recorded in an immutable audit trail (who, what, when, which entity) |
| **Security** | Role-based access enforced server-side, not only in UI |
| **Configurability** | Adding a standard, scheme, AB, requirement, or document type requires zero code change |
| **Traceability** | Every readiness claim traceable to a requirement and evidence record |
| **Responsiveness** | Desktop-first, responsive down to tablet |
| **Tech target** | React, Next.js, TypeScript, Tailwind CSS — reusable components |

---

## 7. Success Metrics

| Metric | Baseline | Target |
|---|---|---|
| Time to answer "are we ready?" | Days (manual compilation) | < 60 seconds |
| Gaps discovered *before* AB visit vs during | Reactive | > 90% found in advance |
| Time to add a new scheme | Weeks (developer cycle) | < 1 hour, no developer |
| Competence lapses reaching an AB assessment | Unknown until visit | Zero |
| Witness audit obligations missed | Tracked manually | Zero |
| AB findings that internal audit failed to predict | High | Declining quarter-over-quarter |

---

## 8. Out of Scope (v1)

- Application review, audit scheduling, technical review, certificate issuance → **Platform Audit**
- Auditor/lead auditor/technical reviewer competency management → **AIHCM**
- Client-facing portal
- Financial/billing management
- Mobile native apps

---

## 9. Key Assumptions & Risks

| Assumption | Risk if wrong | Mitigation |
|---|---|---|
| Platform Audit exposes a stable read API for its 4 domains | Operational pillars can't be computed | No live Platform Audit app exists yet — consume via a stub adapter now, define the real contract when it does; degrade gracefully with "data unavailable" |
| AIHCM's API stays stable as NexAccred integrates against it | Personnel competence pillar breaks silently | AIHCM is a real, actively developed sibling app (confirmed contract in Data Model §1.5) — pin the adapter to its DTO shapes, not assumptions, and re-verify after each AIHCM wave |
| Pillar weights are meaningful to CAB management | Readiness score seen as arbitrary | Methodology screen makes the calculation fully transparent and editable |
| Head of Accreditation is willing to own requirement configuration | Content goes stale | Onboarding includes configuration handover; audit trail shows staleness |
| One AB per scheme | Multi-AB schemes unsupported | Confirm with target CABs; model allows extension |

---

## 10. Release Phasing

**Phase 1 — Foundation**
AB/Standard/Scheme/Requirement configuration · Compliance matrix · Document & evidence repository · Role-based access

**Phase 2 — Readiness Engine**
8-pillar computation · Blocking rules · Methodology configuration · Dashboard · Drill-down

**Phase 3 — Assessment & Assurance**
Assessment schedule · Witness tracking · Preparation wizard · Evidence pack · Findings/CAPA/Risk · Tasks

**Phase 4 — Integration & Intelligence**
AIHCM sync (real API, available now) · Platform Audit sync (stub until Platform Audit ships an API) · AI assistant, gap analysis, simulator, impact analysis · Reporting & analytics
