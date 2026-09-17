# NexAccred — Documentation Package

**Product:** NexAccred — AI-Powered Accreditation Compliance & Readiness Platform
**Package version:** 1.0

---

## Contents

| # | Document | Audience | Purpose |
|---|---|---|---|
| 01 | **PRD** (`01-PRD-NexAccred.md`) | Product, engineering, stakeholders | Problem, positioning, personas, 12 functional requirement groups, NFRs, success metrics, phasing |
| 02 | **ERD** (`02-ERD-NexAccred.mermaid`) | Engineering, data architects | Entity-relationship diagram, 20+ entities with keys and cardinality |
| 03 | **Data Model** (`03-Data-Model-NexAccred.md`) | Engineering | Modelling principles, entity specs, readiness calculation, permission model, integrity rules, indexing |
| 04 | **Business Process** (`04-Business-Process-NexAccred.md`) | Operations, QA, implementation | 8 process flows with ownership and system boundary |
| 05 | **RBAC & Separation of Duties** (`05-RBAC-Separation-of-Duties.md`) | Security, compliance, engineering | Permission matrix, the two critical boundaries, enforcement requirements |
| — | **Product Presentation** (`NexAccred-Product-Presentation.pptx`) | Executives, prospects, internal buy-in | 12-slide product overview |
| — | **Working Prototype** (`nexaccred-app.html`) | All | Clickable prototype: 6 roles, ~45 screens, live readiness engine |

---

## How the documents relate

```
PRD (what & why)
 ├── Business Process (how it operates day to day)
 ├── Data Model + ERD (how it is structured)
 │     └── RBAC (who may touch what)
 ├── Presentation (how it is communicated)
 └── Prototype (what it feels like)
```

**Reading order by audience:**

- **Executive / stakeholder:** Presentation → PRD §1–4 → Prototype
- **Engineering:** PRD → Data Model → ERD → RBAC
- **Operations / QA:** Business Process → PRD §5 → Prototype
- **Security / compliance:** RBAC → Data Model §4 → PRD §6

---

## The five questions the product answers

Every major screen answers at least one:

1. **Are we ready?**
2. **Why are we not ready?**
3. **What evidence proves compliance?**
4. **What is the risk?**
5. **What should we fix first?**

---

## Core design principles (carried across all documents)

| # | Principle |
|---|---|
| P1 | Configuration-driven — no hard-coded standards or schemes |
| P2 | Evidence-based compliance — a document existing is not proof |
| P3 | Readiness is computed, never stored |
| P4 | Blocking rules over averages — a high score cannot hide a critical gap |
| P5 | Separation of duties — who defines the rules ≠ who manages access |
| P6 | Don't duplicate the system of record — Platform Audit owns operations, AIHCM owns personnel/competency |
| P7 | Guide by intent, not by clause |

---

## Known limitations of the current prototype

Stated explicitly so they are not mistaken for delivered capability:

| Limitation | Status |
|---|---|
| Role filtering is UI-layer only; no server-side enforcement | Must be built before production — see RBAC §5 |
| Configuration changes (weights, new requirements, new schemes) persist for the browser session only | Needs backend persistence |
| Platform Audit integration is represented with realistic sample data, not a live API | No live Platform Audit app exists yet — `nexaccred-api`'s `PlatformAuditStubGateway` is the swappable placeholder |
| AIHCM integration is real (`nexaccred-api`'s `AihcmHttpGateway`, built and verified against AIHCM's actual API — see Data Model §1.5), but only wired into the new backend, not yet into the `nexaccred-react` frontend prototype | Frontend still reads its own in-memory sample data; connecting it to `nexaccred-api` is separate follow-up work |
| Compliance Matrix does not auto-expand when a new requirement is added | By design — compliance records appear once evidence is assessed |
| Row-level scoping ("edit only my schemes") is not implemented | v2 extension — see RBAC §6 |
| Pillar scores are sample data, though the readiness calculation on top of them is fully live | Pillar aggregation logic to be built |

---

## Suggested next documents

Not produced in this package, but likely needed before build:

- **API Specification** — endpoint contracts, especially the Platform Audit integration (AIHCM's is already documented in Data Model §1.5, confirmed against its real source)
- **Test Plan** — acceptance criteria per functional requirement
- **Migration & Onboarding Plan** — how an existing CAB loads its current schemes, requirements, and evidence
- **UI Component Library Spec** — formalising the design system already used in the prototype
