/**
 * Seed data for the NexAccred prototype.
 *
 * In production every collection here is backed by a table (see 03-Data-Model.md) and
 * loaded through an API. Nothing in this file is hard-coded business logic — schemes,
 * standards and requirements are *configuration*, editable in-app by the Head of
 * Accreditation without a code change. That is core design principle P1.
 */

export const ev = (label) => {
  const level =
    {
      Verified: 'green',
      Partial: 'yellow',
      Missing: 'red',
      Expired: 'orange',
      'N/A': 'gray',
      Compliant: 'green',
      'Partially Compliant': 'yellow',
      'Non-Compliant': 'red',
      'Not Applicable': 'gray',
      'Not Assessed': 'gray',
      Eligible: 'green',
      Conditional: 'yellow',
      'Not Eligible': 'red',
      '—': 'gray',
      Active: 'green',
      Inactive: 'gray',
      Suspended: 'red',
      Open: 'orange',
      Closed: 'green',
      'On Track': 'green',
      'At Risk': 'yellow',
      Overdue: 'red',
      Pass: 'green',
      'Minor NC': 'yellow',
      'Major NC': 'orange',
      Scheduled: 'gray',
      Outstanding: 'red',
      Sufficient: 'green',
      Tight: 'yellow',
      Shortfall: 'red',
    }[label] || 'gray';
  return { level, label };
};

/* ---------------------------------------------------------------- */
/* Accreditation Bodies — a CAB may hold accreditation from several  */
/* ---------------------------------------------------------------- */
export const initialAccreditationBodies = [
  {
    id: 'kan',
    name: 'KAN',
    full: 'Komite Akreditasi Nasional',
    country: 'Indonesia',
    number: 'KAN-LSSM-045-IDN',
    since: '14 March 2019',
    status: ev('Active'),
  },
  {
    id: 'ukas',
    name: 'UKAS',
    full: 'United Kingdom Accreditation Service',
    country: 'United Kingdom',
    number: 'UKAS-CB-0056',
    since: '02 June 2021',
    status: ev('Active'),
  },
  {
    id: 'anab',
    name: 'ANAB',
    full: 'ANSI National Accreditation Board',
    country: 'United States',
    number: 'ANAB-CB-1122',
    since: '19 November 2023',
    status: ev('Active'),
  },
];

export const PILLARS = [
  'Requirements',
  'Evidence',
  'Personnel',
  'Competence',
  'Operations',
  'Documentation',
  'Assurance',
  'CAPA',
];

/* ---------------------------------------------------------------- */
/* Schemes                                                           */
/* `badge: 'draft'` marks a registered-but-unconfigured scheme —      */
/* visible in scope, but with no readiness score computed.            */
/* ---------------------------------------------------------------- */
export const initialSchemes = {
  iso9001: {
    name: 'ISO 9001',
    full: 'Quality Management Systems',
    ab: 'kan',
    nextAssessment: { type: 'Surveillance', date: '2026-11-20' },
    witness: {
      required: 2,
      completed: 2,
      events: [
        { auditor: 'Maria Santos', date: '2025-11-12', assessor: 'Rina Wulandari (KAN)', result: 'Pass' },
        { auditor: 'L. Bianchi', date: '2026-02-20', assessor: 'Rina Wulandari (KAN)', result: 'Pass' },
      ],
    },
    stds: ['ISO/IEC 17021-1:2015'],
    clients: 64,
    badge: 'active',
    trend: '▲ 1% since last week',
    pillars: { Requirements: 97, Evidence: 96, Personnel: 95, Competence: 96, Operations: 97, Documentation: 98, Assurance: 95, CAPA: 97 },
    tabs: {
      critical: [],
      risks: [{ t: 'Two client files nearing 3-year recertification window simultaneously', m: 'RISK-9001-002 · Operational Risk · Opened 20 days ago', sev: 'yellow' }],
      evidence: [{ t: 'Surveillance report — Solara Energy pending final sign-off', m: 'REQ-17021-9.2 · Operational Evidence · Due in 5 days', sev: 'yellow' }],
      competence: [],
      findings: [{ t: 'Internal audit — minor nonconformity on document control', m: 'FND-2026-019 · Internal Audit · Correction closed, verification scheduled', sev: 'yellow' }],
    },
  },
  iso14001: {
    name: 'ISO 14001',
    full: 'Environmental Management Systems',
    ab: 'kan',
    nextAssessment: { type: 'Surveillance', date: '2026-10-05' },
    witness: {
      required: 2,
      completed: 2,
      events: [
        { auditor: 'Maria Santos', date: '2025-10-08', assessor: 'Rina Wulandari (KAN)', result: 'Pass' },
        { auditor: 'T. Reyes', date: '2026-01-15', assessor: 'Rina Wulandari (KAN)', result: 'Pass' },
      ],
    },
    stds: ['ISO/IEC 17021-1:2015'],
    clients: 38,
    badge: 'active',
    trend: '— since last week',
    pillars: { Requirements: 95, Evidence: 91, Personnel: 94, Competence: 93, Operations: 92, Documentation: 96, Assurance: 93, CAPA: 92 },
    tabs: {
      critical: [],
      risks: [{ t: 'Single point of failure — only 1 authorized lead auditor for sector 14', m: 'RISK-14001-003 · Competence Risk · Opened 30 days ago', sev: 'orange' }],
      evidence: [{ t: 'Legal compliance register update overdue for 2 client files', m: 'REQ-17021-8.3 · Record Evidence · Overdue 4 days', sev: 'yellow' }],
      competence: [],
      findings: [],
    },
  },
  iso27001: {
    name: 'ISO 27001',
    full: 'Information Security Management Systems',
    ab: 'kan',
    nextAssessment: { type: 'Surveillance', date: '2026-09-13' },
    witness: {
      required: 3,
      completed: 2,
      events: [
        { auditor: 'T. Reyes', date: '2025-09-10', assessor: 'Budi Santoso (KAN)', result: 'Minor NC' },
        { auditor: 'S. Okafor', date: '2026-03-05', assessor: 'Budi Santoso (KAN)', result: 'Pass' },
        { auditor: 'Newly authorized auditor (unassigned)', date: 'Not yet scheduled', assessor: 'KAN', result: 'Outstanding' },
      ],
    },
    stds: ['ISO/IEC 17021-1:2015', 'ISO/IEC 27006-1:2024'],
    clients: 41,
    badge: 'active',
    trend: '▼ 3% since last week',
    pillars: { Requirements: 94, Evidence: 82, Personnel: 91, Competence: 88, Operations: 91, Documentation: 95, Assurance: 92, CAPA: 87 },
    tabs: {
      critical: [{ t: 'Impartiality safeguard corrective action overdue — CAPA-2026-014', m: 'REQ-17021-5.2 · Clause 5.2 Impartiality · Overdue 6 days · Owner: T. Reyes', sev: 'red' }],
      risks: [
        { t: 'Auditor pool concentration risk — 68% of Stage 2 audits assigned to 2 auditors', m: 'RISK-27001-004 · Operational Risk · Opened 14 days ago', sev: 'orange' },
        { t: 'Certification decision turnaround trending above 30-day target', m: 'RISK-27001-007 · Operational Risk · Avg. 34 days, last 6 decisions', sev: 'orange' },
      ],
      evidence: [
        { t: 'Stage 2 audit report — Northwind Logistics not yet uploaded', m: 'REQ-27006-9.4.4 · Operational Evidence · Due in 2 days', sev: 'orange' },
        { t: 'Witnessed assessment record missing for 1 of 3 newly authorized auditors', m: 'REQ-17021-7.2.8 · Personnel Evidence · Outstanding 9 days', sev: 'orange' },
        { t: 'Management review minutes for Q2 pending final approval signature', m: 'REQ-17021-9.3 · Record Evidence · Pending Verification', sev: 'yellow' },
      ],
      competence: [{ t: 'Technical reviewer authorization — cloud security technical area — expired', m: 'REQ-27006-6.1 · S. Okafor · Expired 4 days ago', sev: 'yellow' }],
      findings: [
        { t: 'Internal audit finding — sampling plan not consistently applied across sector codes', m: 'FND-2026-031 · Internal Audit · Correction in progress', sev: 'orange' },
        { t: 'Prior AB surveillance finding — root cause verified, effectiveness check pending', m: 'FND-2025-118 · AB Assessment · Verification due in 11 days', sev: 'yellow' },
      ],
    },
  },
  iso27701: {
    name: 'ISO 27701',
    full: 'Privacy Information Management Systems',
    ab: 'ukas',
    nextAssessment: { type: 'Initial', date: '2026-08-25' },
    witness: {
      required: 2,
      completed: 0,
      events: [
        { auditor: 'D. Kwon', date: '2026-09-05', assessor: 'James Harrington (UKAS)', result: 'Scheduled' },
        { auditor: 'Not yet assigned', date: 'Not yet scheduled', assessor: 'UKAS', result: 'Outstanding' },
      ],
    },
    stds: ['ISO/IEC 17021-1:2015', 'ISO/IEC 27006-2:2021'],
    clients: 14,
    badge: 'active',
    trend: '▼ 5% since last week',
    pillars: { Requirements: 82, Evidence: 58, Personnel: 74, Competence: 52, Operations: 71, Documentation: 79, Assurance: 70, CAPA: 68 },
    tabs: {
      critical: [
        { t: 'Lead auditor competence expired — privacy information management', m: 'REQ-27701-7.2.3 · Clause 7.2 Competence · Expired 12 days ago · Owner: D. Kwon', sev: 'red' },
        { t: 'Privacy risk assessment records missing for Q2 client review cycle', m: 'REQ-27701-8.4 · Record Evidence · 3 client files affected', sev: 'red' },
      ],
      risks: [
        { t: 'Scheme has only 1 fully eligible lead auditor — single point of failure', m: 'RISK-27701-001 · Competence Risk · Opened 18 days ago', sev: 'orange' },
        { t: 'Newest scheme — under 12 months of operational evidence accumulated', m: 'RISK-27701-005 · Documentation Risk · Structural', sev: 'yellow' },
      ],
      evidence: [
        { t: 'Privacy risk assessment — Bank ABC cycle', m: 'REQ-27701-8.4 · Record Evidence · Missing', sev: 'red' },
        { t: 'Privacy risk assessment — 2 additional client files', m: 'REQ-27701-8.4 · Record Evidence · Missing', sev: 'red' },
        { t: 'DPIA review sign-off pending', m: 'REQ-27701-8.2 · Record Evidence · Pending Verification', sev: 'yellow' },
      ],
      competence: [{ t: 'Lead auditor — privacy information management — expired', m: 'D. Kwon · Expired 12 days ago', sev: 'red' }],
      findings: [{ t: 'Internal audit — inconsistent PII inventory review across client files', m: 'FND-2026-027 · Internal Audit · Root cause pending', sev: 'orange' }],
    },
  },
  iso14064: {
    name: 'ISO 14064-1',
    full: 'Greenhouse Gas Quantification & Verification',
    ab: 'anab',
    nextAssessment: { type: 'Surveillance', date: '2026-12-01' },
    witness: {
      required: 2,
      completed: 1,
      events: [
        { auditor: 'A. Farouk', date: '2025-12-01', assessor: 'Laura Chen (ANAB)', result: 'Pass' },
        { auditor: 'Not yet assigned', date: 'Not yet scheduled', assessor: 'ANAB', result: 'Outstanding' },
      ],
    },
    stds: ['ISO/IEC 17029:2019', 'ISO 14065:2020'],
    clients: 9,
    badge: 'active',
    trend: '▲ 2% since last week',
    pillars: { Requirements: 90, Evidence: 81, Personnel: 86, Competence: 78, Operations: 87, Documentation: 88, Assurance: 85, CAPA: 84 },
    tabs: {
      critical: [],
      risks: [{ t: 'Technical reviewer authorization expiring — GHG quantification scope', m: 'REQ-14064-6.1 · Competence Risk · Expires in 9 days', sev: 'orange' }],
      evidence: [{ t: 'Verification statement — GreenFields Agri pending template update', m: 'REQ-17029-7.4 · Document Evidence · In progress', sev: 'yellow' }],
      competence: [{ t: 'Technical reviewer — GHG sector 3 — authorization expiring', m: 'A. Farouk · Expires in 9 days', sev: 'yellow' }],
      findings: [],
    },
  },
};

export const initialSchemeOrder = ['iso9001', 'iso14001', 'iso27001', 'iso27701', 'iso14064'];
