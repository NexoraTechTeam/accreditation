# Business Process Documentation — NexAccred

**Version:** 1.0

This document describes the operating processes NexAccred supports, who owns each step, and where the boundary with Platform Audit and AIHCM sits.

---

## 0. System Boundary

```mermaid
flowchart LR
    subgraph PA["PLATFORM AUDIT — system of record<br/>(not yet built — stub adapter today)"]
        direction TB
        PA1["Application Review"]
        PA2["Audit Scheduling"]
        PA3["Audit Execution"]
        PA4["Technical Review"]
        PA5["Certificate Issuance"]
    end

    subgraph HCM["AIHCM — system of record<br/>(real, running sibling app)"]
        direction TB
        HCM1["Employee Identity"]
        HCM2["Competency &amp; Skills"]
    end

    subgraph NX["NEXACCRED — readiness engine"]
        direction TB
        NX1["Requirement &amp; Scheme Config"]
        NX2["Evidence &amp; Compliance"]
        NX3["Readiness Computation"]
        NX4["Assessment &amp; Witness"]
        NX5["Findings / CAPA / Risk"]
        NX6["Tasks"]
        NX7["Auditor Authorization<br/>(scope + expiry, NexAccred-owned)"]
    end

    PA -->|"read-only sync<br/>4 domains"| NX
    HCM -->|"read-only sync<br/>REST + JWT"| NX
    NX -.->|"never writes back"| PA
    NX -.->|"never writes back"| HCM

    style PA fill:#EFF6FF,stroke:#2563EB
    style HCM fill:#ECFDF5,stroke:#059669
    style NX fill:#F5F1FE,stroke:#7C3AED
```

**Rule:** NexAccred never duplicates or writes to Platform Audit or AIHCM. Operational execution and personnel/competency data stay there; readiness judgement — including CAB-specific auditor authorization and its expiry — happens here.

---

## BP-1 — Onboarding a New Accreditation Scheme

**Owner:** Head of Accreditation
**Trigger:** CAB decides to pursue accreditation for a new scheme
**Critical property:** completes with **zero developer involvement**

```mermaid
flowchart TD
    A["Business decision:<br/>pursue new scheme"] --> B{"Accreditation Body<br/>already registered?"}
    B -->|No| C["Register Accreditation Body<br/>name, country, accreditation no."]
    B -->|Yes| D
    C --> D{"Required standards<br/>already in library?"}
    D -->|No| E["Add Standard<br/>version, type, clauses, issuer"]
    D -->|Yes| F
    E --> F["STEP 1 — Register Scheme<br/>name, AB, conformity type,<br/>primary standard"]
    F --> G["Scheme visible as DRAFT<br/>no readiness score computed"]
    G --> H["STEP 2 — Configure Scheme<br/>10-step wizard"]
    H --> H1["Supporting standards"]
    H1 --> H2["IAF / AB rules"]
    H2 --> H3["Competence criteria<br/>(links to AIHCM)"]
    H3 --> H4["Applicable processes"]
    H4 --> H5["Evidence requirements"]
    H5 --> H6["Assessment requirements"]
    H6 --> I["Add Requirements<br/>clause by clause"]
    I --> J["Define required document types"]
    J --> K["Activate Scheme"]
    K --> L["Readiness computed live<br/>appears in Accreditation Scope"]

    style G fill:#F1F5F9,stroke:#64748B
    style L fill:#ECFDF5,stroke:#059669
```

**Why two steps?** Registering creates a real, visible Draft record immediately. Dropping someone into a 10-step wizard with nothing saved is how configuration gets abandoned halfway with no trace.

---

## BP-2 — Continuous Readiness Monitoring

**Owner:** Head of Accreditation (monitors), all roles (feed)
**Trigger:** continuous — every page load recalculates
**Frequency:** real-time

```mermaid
flowchart TD
    subgraph INPUTS["Inputs — change continuously"]
        I1["Evidence uploaded / expired"]
        I2["Competence renewed / lapsed<br/>(AIHCM)"]
        I3["Finding raised / closed"]
        I4["CAPA progressed / overdue"]
        I5["Witness completed / outstanding"]
        I6["Document reviewed / stale"]
    end

    INPUTS --> P["8 Pillar Scores<br/>Requirements · Evidence · Personnel · Competence<br/>Operations · Documentation · Assurance · CAPA"]
    P --> W["STEP 1 — Weighted raw score<br/>using configurable weights"]
    W --> RB["Raw band"]
    RB --> BR{"STEP 2 —<br/>Blocking rules"}

    BR -->|"1 critical gap"| C1["Cap: Ready with Risks"]
    BR -->|"2+ critical gaps"| C2["Cap: Not Yet Ready"]
    BR -->|"Competence &lt; 60%"| C3["Cap: Not Yet Ready"]
    BR -->|"Witness outstanding<br/>&lt; 30 days to visit"| C4["Cap: Not Yet Ready"]
    BR -->|"none triggered"| C0["Raw band stands"]

    C0 --> F["FINAL BAND + explanation"]
    C1 --> F
    C2 --> F
    C3 --> F
    C4 --> F

    F --> O1["Dashboard gauge"]
    F --> O2["Scope cards"]
    F --> O3["Readiness strip"]
    F --> O4["Why aren't we ready?"]
    F --> O5["What should we fix first?"]

    style BR fill:#FFF7ED,stroke:#C2410C
    style F fill:#ECFDF5,stroke:#059669
```

**Key property:** a blocking rule can only push a band **down**. A 90% weighted score with an open critical gap reads *Ready with Risks*, never *Ready*.

---

## BP-3 — Preparing for an Accreditation Body Assessment

**Owner:** Head of Accreditation
**Trigger:** scheduled AB visit approaching (45 / 30 / 14 / 7-day notifications)

```mermaid
flowchart TD
    A["AB assessment scheduled"] --> B["Countdown appears<br/>dashboard + readiness strip"]
    B --> C["Open Assessment Preparation"]
    C --> D["Select type, scheme, date"]
    D --> E["System compiles automatically"]

    E --> E1["Assessment readiness score"]
    E --> E2["Critical gaps"]
    E --> E3["High risks"]
    E --> E4["Missing evidence"]
    E --> E5["Expired competence"]
    E --> E6["Open CAPA"]
    E --> E7["Previous AB findings"]
    E --> E8["Outstanding witness audits"]

    E1 & E2 & E3 & E4 & E5 & E6 & E7 & E8 --> F["Create Preparation Plan"]
    F --> G["Tasks generated<br/>owner + due date each"]
    G --> H["Assemble Evidence Pack<br/>organised by requirement"]
    H --> I{"All critical gaps<br/>closed before visit?"}
    I -->|No| J["Escalate to management<br/>consider deferral request"]
    I -->|Yes| K["AB Assessment held"]
    K --> L["Findings recorded"]
    L --> M["→ BP-4 CAPA cycle"]

    style J fill:#FEF2F2,stroke:#DC2626
    style K fill:#ECFDF5,stroke:#059669
```

**Note on the Evidence Pack:** an internal preparation and navigation tool. It does *not* automatically expose confidential documents — it indexes what exists per requirement so the team can navigate quickly during the visit.

---

## BP-4 — Finding → CAPA → Closure

**Owner:** finding owner (execution), Head of Accreditation (approval)
**Trigger:** finding raised from any source

```mermaid
flowchart LR
    A["Finding raised"] --> B["Classification<br/>Major NC / Minor NC /<br/>Observation / OFI"]
    B --> C["Correction<br/>immediate fix"]
    C --> D["Root Cause Analysis"]
    D --> E["Corrective Action<br/>prevent recurrence"]
    E --> F["Evidence of action"]
    F --> G["Verification"]
    G --> H{"Effective?"}
    H -->|No| D
    H -->|Yes| I["Closure"]
    I --> J["Requirement compliance<br/>re-evaluated"]
    J --> K["Readiness recalculated"]

    style H fill:#FFFBEB,stroke:#B45309
    style K fill:#ECFDF5,stroke:#059669
```

**Finding sources:** Internal Audit · AB Assessment · Witness Assessment · Complaint · Appeal · Impartiality Review · Management Review · Internal Monitoring

Every finding links to requirement, scheme, assessment, evidence, and CAPA — so closing it demonstrably moves the readiness score.

---

## BP-5 — Witness Audit Cycle

**Owner:** Head of Accreditation
**Trigger:** accreditation cycle begins, or AB requires additional witnessing

```mermaid
flowchart TD
    A["Cycle starts —<br/>AB sets required witness count"] --> B["Witness obligations<br/>registered per scheme"]
    B --> C["Status: Outstanding"]
    C --> D["Schedule witness with AB"]
    D --> E["Status: Scheduled"]
    E --> F["AB assessor observes<br/>live audit"]
    F --> G{"Result"}
    G -->|Pass| H["Completed count +1"]
    G -->|Minor NC| I["→ BP-4 CAPA"]
    G -->|Major NC| I
    I --> H
    H --> J{"Required count met?"}
    J -->|Yes| K["Cycle satisfied"]
    J -->|No| C

    C -.->|"if &lt; 30 days<br/>to AB visit"| L["BLOCKING RULE<br/>caps scheme at<br/>Not Yet Ready"]

    style L fill:#FFF7ED,stroke:#C2410C
    style K fill:#ECFDF5,stroke:#059669
```

Witness audits are a common cause of surprise findings because they are tracked informally. Modelling them as a cycle with an explicit outstanding count makes the obligation visible before it becomes a problem.

---

## BP-6 — Requirement Change Management

**Owner:** Head of Accreditation
**Trigger:** standard revised, IAF document updated, or AB issues a new rule

```mermaid
flowchart TD
    A["Standard revision published"] --> B["Add new Standard Version"]
    B --> C["AI Impact Analysis"]
    C --> D["System identifies:<br/>affected schemes ·<br/>affected requirements ·<br/>client files in scope ·<br/>personnel needing re-authorisation"]
    D --> E["Review scoped change list"]
    E --> F["Add / amend requirements"]
    F --> G["Update evidence requirements"]
    G --> H["Mark old requirements superseded<br/>(retain for audit history)"]
    H --> I["Tasks generated for gaps"]
    I --> J["Compliance re-assessed"]
    J --> K["Readiness recalculated"]

    style C fill:#F5F1FE,stroke:#7C3AED
    style K fill:#ECFDF5,stroke:#059669
```

**Why this matters:** without impact analysis, a standard revision means re-reading the entire standard. With it, the team gets a scoped action list.

---

## BP-7 — Document Control

**Owner:** Document Controller

```mermaid
flowchart TD
    A["Head of Accreditation defines<br/>REQUIRED document types<br/>per scheme"] --> B["System compares against<br/>documents that ACTUALLY exist"]
    B --> C{"Match found?"}
    C -->|No| D["Status: Missing<br/>visible gap"]
    C -->|Yes| E{"Current &amp; approved?"}
    E -->|No| F["Status: Expired / Pending"]
    E -->|Yes| G["Status: Verified"]

    D --> H["Task assigned<br/>to Document Controller"]
    F --> H
    H --> I["Document created / reviewed / approved"]
    I --> B

    G --> J["Feeds Documentation pillar"]
    J --> K["Readiness recalculated"]

    style D fill:#FEF2F2,stroke:#DC2626
    style G fill:#ECFDF5,stroke:#059669
```

The separation between "what should exist" and "what does exist" is the entire point. A library that only lists what you have can never tell you what you're missing.

---

## BP-8 — Role-Based Daily Operation

```mermaid
flowchart TD
    L["Login"] --> R{"Role"}

    R -->|Head of Accreditation| H["Full dashboard<br/>readiness gauge, all schemes,<br/>why not ready, fix first"]
    R -->|Accreditation Staff| S["Task queue, schemes in setup,<br/>workload snapshot"]
    R -->|Internal Auditor| A["My findings, internal<br/>assessment calendar"]
    R -->|Impartiality Committee| I["Declarations for review,<br/>impartiality safeguard watch"]
    R -->|Document Controller| D["Evidence needing attention,<br/>records pending, pack completeness"]
    R -->|System Administrator| SA["Users, roles, integrations,<br/>audit trail — no compliance content"]

    H & S & A & I & D --> T["Act on tasks →<br/>evidence, findings, CAPA update"]
    T --> RC["Readiness recalculated"]
    RC --> H

    SA --> AC["Access &amp; integration changes only"]

    style SA fill:#F1F5F9,stroke:#64748B
    style RC fill:#ECFDF5,stroke:#059669
```

Every operational role feeds the readiness loop. System Administrator sits deliberately outside it.

---

## Process Ownership Summary

| Process | Owner | Contributors | Consumes from Platform Audit | Consumes from AIHCM |
|---|---|---|---|---|
| BP-1 Scheme onboarding | Head of Accreditation | Accreditation Staff | — | Competence criteria |
| BP-2 Readiness monitoring | Head of Accreditation | All operational roles | Operations pillar | Competence pillar |
| BP-3 Assessment preparation | Head of Accreditation | Doc Controller, Staff | Audit execution records | — |
| BP-4 Finding → CAPA | Finding owner | Internal Auditor, Head of Accreditation | Audit findings | — |
| BP-5 Witness cycle | Head of Accreditation | Certification Manager | Audit schedule | Auditor identity |
| BP-6 Requirement change | Head of Accreditation | Technical Manager | — | — |
| BP-7 Document control | Document Controller | Head of Accreditation | — | — |
| BP-8 Daily operation | All roles | — | Workload | Competency |
