# Data Model Specification — NexAccred

**Version:** 1.0
**Companion:** `02-ERD-NexAccred.mermaid`

---

## 1. Modelling Principles

### 1.1 Two chains meeting at Requirement

**Definition chain** — what compliance *means*:
```
Requirement Source → Standard → Standard Version → Clause → Requirement
  → Applicability Rule → Compliance Criteria → Evidence Requirement
```

**Proof & consequence chain** — what compliance *is, in practice*:
```
Requirement → Scheme → Process → Personnel → Competence → Document → Evidence
  → Implementation → Assessment → Finding → CAPA → Risk → Readiness
```

### 1.2 Readiness is a computed leaf, not a column

`Readiness` **does not exist as a stored table.** There is no `scheme.readiness_score` column. It is derived at query time from `SCHEME_PILLAR_SCORE` + `READINESS_CONFIG` + blocking-rule evaluation against live gap/witness/competence data.

**Why this matters:** a stored score goes stale silently. A computed one cannot. It also makes "why aren't we ready" answerable by construction — the engine walks the graph backward from the failing node rather than looking up a cached verdict.

`SCHEME_PILLAR_SCORE` *is* stored, because pillar scores are themselves aggregations over evidence and findings that are expensive to recompute per request. They carry `calculated_at` so staleness is visible.

### 1.3 Configuration vs. content ownership

| Layer | Owner role | Tables |
|---|---|---|
| **System configuration** | System Administrator | `USER`, `ROLE`, `ROLE_PERMISSION`, `EXTERNAL_SYSTEM`, `EXTERNAL_SYNC_LOG`, workflow, notifications |
| **Business/domain content** | Head of Accreditation | `ACCREDITATION_BODY`, `STANDARD`, `SCHEME`, `REQUIREMENT`, `REQUIRED_DOCUMENT_TYPE`, `READINESS_CONFIG`, `AUDITOR_AUTHORIZATION` |

This split is enforced in `ROLE_PERMISSION`, not in application code — see §4.

### 1.4 Read-only external domains — two systems, not one

Five domains are owned by **two separate external systems** and mirrored read-only. Both are referenced by opaque `*_ref` identifiers rather than foreign keys into local tables, so NexAccred never becomes a second source of truth for either:

| System | Domain | Referenced as | Contract |
|---|---|---|---|
| **Platform Audit** | Application & Certification Lifecycle | workload aggregates per scheme | Not built yet — no live app exists for Platform Audit today. Consumed via a stub adapter (`PlatformAuditStubGateway`) returning realistic sample data, swappable for a real HTTP adapter once Platform Audit exposes an API. |
| **Platform Audit** | Audit Execution | `assessment.external_audit_ref` | Same as above |
| **Platform Audit** | Technical Review | review queue aggregates | Same as above |
| **Platform Audit** | Certification Decisions | decision/issuance aggregates | Same as above |
| **AIHCM** | Personnel Competency | `witness_event.auditor_ref`, `impartiality_declaration.personnel_ref`, `auditor_authorization.personnel_ref` | **Real system**, already running as a sibling project (`08 - AIHCM`, Java 21/Spring Boot 3). Consumed live over REST — see §1.5. |

**Why AIHCM instead of Platform Audit for Personnel Competency:** AIHCM is the org's actual system of record for people/competency data (Wave 5 Skills module). Earlier drafts of this document attributed Personnel Competency to Platform Audit; that was a placeholder before AIHCM existed as a real system. This is now corrected everywhere in the doc set (PRD §7/§8/§9, Business Process §0/BP-1/BP-2, RBAC §2).

### 1.5 AIHCM integration contract (as of AIHCM Wave 5)

Confirmed by reading AIHCM's own backend source, not assumed:

| | |
|---|---|
| Base URL (local dev) | `http://localhost:8080` |
| Auth | `POST /api/v1/auth/login` with `{ tenantCode, email, password }` → `{ accessToken, expiresInMinutes, userId, tenantId, email }`. Send `Authorization: Bearer <accessToken>` on every call after. Tenant is resolved server-side from the JWT — **no tenant header**. |
| List a person's competencies | `GET /api/v1/competencies/employees/{employeeId}` → `EmployeeCompetency[]`: `{ id, employeeId, competencyId, level: BEGINNER\|INTERMEDIATE\|ADVANCED\|EXPERT, selfAssessed, assessedByUserId, assessedAt }` |
| Competency catalog | `GET /api/v1/competencies` → `Competency[]`: `{ id, code, name, description, category }` |
| Look up a person | `GET /api/v1/employees/{employeeId}` → `EmployeeProfileView`: `{ employeeId, employeeNumber, fullName, status, joinDate, positionName, jobLevelCode, orgUnitName, managerEmployeeId }` (no email on this view) |

**Known gap, by design, not a bug to route around:** AIHCM's `EmployeeCompetency` has **no expiry field and no certification/authorization entity** — it tracks one current proficiency *level*, not a time-bound *authorization to act as lead auditor against standard X*. That is genuinely NexAccred's own domain concern (a CAB-specific accreditation judgement), not something to force into AIHCM's generic HCM schema. This is why `AUDITOR_AUTHORIZATION` (§2) is a **NexAccred-owned table**, not a mirror: it references `personnel_ref` (AIHCM's `employeeId`) for identity, but the scheme scope, standard, role, and expiry are NexAccred's own record.

---

## 2. Core Entities

### 2.1 ACCREDITATION_BODY

A CAB may hold accreditation from several ABs simultaneously. One AB covers many schemes; each scheme belongs to exactly one AB.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `short_name` | varchar(32) | "KAN", "UKAS", "ANAB" |
| `full_name` | varchar(255) | |
| `country` | varchar(64) | |
| `accreditation_number` | varchar(64) | e.g. `KAN-LSSM-045-IDN` |
| `accredited_since` | date | |
| `status` | enum | `active`, `suspended`, `withdrawn` |

### 2.2 STANDARD / STANDARD_VERSION / CLAUSE

Standards are versioned because requirements change between editions, and a CAB may be mid-transition between two versions.

`STANDARD.type` distinguishes:
- **Accreditation Standard** — ISO/IEC 17021-1, 17020, 17024, 17065, 17029
- **Supporting Requirement** — ISO/IEC 27006-1, 27006-2, ISO 14065, IAF Mandatory Documents

### 2.3 REQUIREMENT

The atomic unit the readiness engine traverses.

| Column | Type | Notes |
|---|---|---|
| `ref_code` | varchar(64) UK | Human-facing, e.g. `REQ-17021-5.2` |
| `clause_id` | uuid FK | |
| `requirement_text` | text | What the clause demands |
| `requirement_type` | enum | Policy, Process, Personnel, Competence, Impartiality, Resource, Operational, Record, Evidence, Monitoring, Review, Effectiveness |
| `mandatory` | boolean | |
| `effective_date` / `expiry_date` | date | Supports superseded requirements |

**Ownership constraint:** write access requires `ROLE_PERMISSION` where `entity_domain = 'Requirements'` and `access_level IN ('Edit','Approve')`. System Administrator holds `NoAccess` — enforced server-side.

### 2.4 SCHEME

| Column | Type | Notes |
|---|---|---|
| `accreditation_body_id` | uuid FK | Exactly one AB |
| `conformity_type` | enum | Certification, Verification, Validation, Inspection |
| `lifecycle_status` | enum | `draft` (registered, configuration incomplete), `active`, `suspended` |

**Draft state is deliberate.** A newly registered scheme is immediately visible in Accreditation Scope with `lifecycle_status = 'draft'` and **no computed readiness** — because its requirements and evidence aren't wired yet. Showing 0% would be misleading; showing nothing would hide work in progress.

`SCHEME_STANDARD` is the join table carrying `is_primary` — a scheme has exactly one primary accreditation standard plus N supporting standards.

### 2.5 COMPLIANCE_RECORD & EVIDENCE

One `COMPLIANCE_RECORD` per (requirement × scheme) pair — the same requirement can be compliant for ISO 9001 and non-compliant for ISO 27701.

`EVIDENCE.evidence_category` maps to the five columns of the Compliance Matrix UI:

| Category | Examples |
|---|---|
| Document | Policy, Procedure, Work Instruction, Manual |
| Record | Training record, audit record, evaluation, minutes |
| Operational | Audit report, certification decision, client file, witness assessment |
| Personnel | CV, qualification, experience, training, authorization |
| System | Approval log, audit trail, system records |

**Evidence attributes drive status, not existence:**

```
evidence_status = f(availability, validity, completeness,
                    authenticity, recency, approval_status, effectiveness)
```

Statuses: `Verified`, `PartiallyVerified`, `PendingVerification`, `Missing`, `Expired`.

### 2.6 REQUIRED_DOCUMENT_TYPE vs DOCUMENT

Deliberately separate tables answering two different questions:

| Table | Question |
|---|---|
| `REQUIRED_DOCUMENT_TYPE` | What documents **should** exist? |
| `DOCUMENT` | What documents **do** exist? |

`fulfillment_status` on the former is derived by matching against the latter. A required type with no matching document reads `Missing` — visible as a gap rather than an unnoticed absence.

`scheme_id` nullable: `NULL` means "applies to all schemes."

### 2.7 WITNESS_CYCLE & WITNESS_EVENT

Accreditation Bodies require periodic witnessing of live audits. Modelled as a cycle (how many required, how many done) plus individual events.

`WITNESS_EVENT.result`: `Pass`, `MinorNC`, `MajorNC`, `Scheduled` (booked, not yet held), `Outstanding` (not scheduled — the risk state).

**Feeds a readiness blocking rule:** outstanding witnesses with <30 days to the next AB visit cap the scheme at *Not Yet Ready*.

### 2.7a AUDITOR_AUTHORIZATION

NexAccred-owned, not a mirror. Records that a specific person (identified only by `personnel_ref`, AIHCM's `employeeId`) is authorized to act as lead auditor / auditor / technical expert / witness **against a specific scheme and standard**, with its own expiry.

This is deliberately separate from AIHCM's `EmployeeCompetency` (a general proficiency level with no expiry): CAB-specific accreditation authorization is a conformity-assessment judgement the Head of Accreditation owns, not an HR record. `WITNESS_EVENT.auditor_ref` and the readiness engine's competence pillar read this table, not AIHCM directly.

### 2.8 TASK

Every readiness gap must resolve to something a named person does by a real date.

**`Overdue` is not a stored status.** It is computed: `status != 'Done' AND due_date < today`. A stored overdue flag would require a nightly job and would be wrong between runs.

`source_ref` is a polymorphic pointer to the originating requirement, finding, CAPA, or risk — so a task always traces back to why it exists.

### 2.9 READINESS_CONFIG

Makes the readiness calculation configuration rather than code.

| Column | Default |
|---|---|
| `weight_pct` per pillar | Requirements 20, Evidence 15, Personnel 10, Competence 15, Operations 10, Documentation 10, Assurance 10, CAPA 10 |
| `threshold_ready` | 90 |
| `threshold_risks` | 75 |
| `threshold_not_yet_ready` | 60 |

Editable by Head of Accreditation. Changes are audit-trailed via `updated_by` / `updated_at` — a shifted weight changes every score in the portfolio and must be attributable.

---

## 3. The Readiness Calculation

### Step 1 — Weighted raw score

```
raw_score = Σ (pillar_score × pillar_weight) / Σ (pillar_weight) × 100
raw_band  = band_for(raw_score)   // using READINESS_CONFIG thresholds
```

Normalising by the weight sum keeps the result correct even if configured weights don't total exactly 100.

### Step 2 — Blocking rules (downward only)

```
final_band = raw_band
for each rule in blocking_rules:
    if rule.triggers(scheme):
        final_band = min(final_band, rule.cap)   // by band rank
        reasons.append(rule.explanation)
```

| Rule | Condition | Cap |
|---|---|---|
| R1 | 1 unresolved critical gap | Ready with Risks |
| R2 | ≥2 unresolved critical gaps | Not Yet Ready |
| R3 | Competence pillar < 60% | Not Yet Ready |
| R4 | Outstanding witnesses AND days-to-assessment < 30 | Not Yet Ready |

**A rule can never raise a band.** This is the guarantee that a strong weighted average cannot mask a critical failure.

### Step 3 — Portfolio roll-up

```
overall_score = mean(computeReadiness(s).score for s in active_schemes)
```

Draft schemes are excluded — they have no meaningful score to average.

### Band definitions

| Band | Default range | Meaning |
|---|---|---|
| 🟢 Ready | ≥ 90 | Would pass an assessment tomorrow |
| 🟡 Ready with Risks | 75–89 | Would likely pass, with findings |
| 🟠 Not Yet Ready | 60–74 | Material gaps; assessment would go badly |
| 🔴 Not Ready | < 60 | Should not host an assessment |

---

## 4. Permission Model

Permissions are composed **per entity domain × access level**, never hard-wired per screen. This is what allows a new role to be created in Administration without code.

**Entity domains:** `Requirements`, `Evidence`, `Personnel`, `FindingsCAPA`, `Reporting`, `Administration`
**Access levels:** `NoAccess` < `View` < `Edit` < `Approve`

### Separation of duties (critical)

| Role | Requirements | Evidence | Personnel | Findings/CAPA | Reporting | Admin |
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

**System Administrator is not a super-admin.** It manages who can log in and what they may touch — it has zero authority over accreditation content. Adding an Accreditation Body, scheme, standard, or requirement is a business decision requiring domain expertise, and belongs to the Head of Accreditation.

---

## 5. Referential Integrity & Retention

| Concern | Rule |
|---|---|
| Deleting a standard | Blocked if any scheme references it — deactivate instead |
| Deleting a requirement | Blocked if compliance records or findings exist — supersede via `expiry_date` |
| Deleting a scheme | Blocked if active client certifications exist |
| Superseding a standard version | New version created; old marked `superseded_date`; existing compliance records retained for audit history |
| Audit trail | Append-only, never updated or deleted |
| Evidence retention | Retained for at least one full accreditation cycle beyond expiry |

---

## 6. Indexing Notes

| Index | Rationale |
|---|---|
| `requirement(ref_code)` unique | Human-facing lookup from every screen |
| `compliance_record(scheme_id, requirement_id)` unique composite | Enforces one record per pair; drives the matrix |
| `evidence(compliance_record_id, evidence_status)` | Gap queries filter on status constantly |
| `task(assignee_user_id, status, due_date)` | Powers the per-role task board and overdue computation |
| `finding(scheme_id, status)` | Feeds pillar scores and blocking rules |
| `witness_event(witness_cycle_id, result)` | Outstanding-witness blocking rule |
| `audit_trail(occurred_at DESC)` | Trail is read newest-first |
| `scheme_pillar_score(scheme_id, calculated_at DESC)` | Latest pillar snapshot per scheme |
