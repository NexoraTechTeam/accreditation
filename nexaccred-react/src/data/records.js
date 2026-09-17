import { ev } from './schemes';

export const initialStandards = [
  { name: 'ISO/IEC 17021-1:2015', type: 'Accreditation Standard', desc: 'Requirements for bodies providing audit and certification of management systems', clauses: '47', schemes: '5', status: ev('Active') },
  { name: 'ISO/IEC 17020:2012', type: 'Accreditation Standard', desc: 'Requirements for bodies performing inspection', clauses: '38', schemes: '0', status: ev('Active') },
  { name: 'ISO/IEC 17024:2012', type: 'Accreditation Standard', desc: 'General requirements for bodies operating certification of persons', clauses: '35', schemes: '0', status: ev('Active') },
  { name: 'ISO/IEC 17065:2012', type: 'Accreditation Standard', desc: 'Requirements for bodies certifying products, processes and services', clauses: '41', schemes: '0', status: ev('Active') },
  { name: 'ISO/IEC 17029:2019', type: 'Accreditation Standard', desc: 'General principles for validation and verification bodies', clauses: '29', schemes: '1', status: ev('Active') },
  { name: 'ISO/IEC 27006-1:2024', type: 'Supporting Requirement', desc: 'Requirements for ISMS certification bodies', clauses: '22', schemes: '1', status: ev('Active') },
  { name: 'ISO/IEC 27006-2:2021', type: 'Supporting Requirement', desc: 'Requirements for PIMS certification bodies', clauses: '19', schemes: '1', status: ev('Active') },
  { name: 'ISO 14065:2020', type: 'Supporting Requirement', desc: 'Requirements for GHG validation and verification bodies', clauses: '17', schemes: '1', status: ev('Active') },
];

export const initialRequirements = [
  { ref: 'REQ-17021-5.2', clause: '5.2', std: 'ISO/IEC 17021-1', text: 'Impartiality — risks to impartiality identified on an ongoing basis', type: 'Impartiality', mand: 'Mandatory', status: ev('Partially Compliant') },
  { ref: 'REQ-17021-7.2.3', clause: '7.2.3', std: 'ISO/IEC 17021-1', text: 'Competence of personnel involved in the certification activity', type: 'Competence', mand: 'Mandatory', status: ev('Non-Compliant') },
  { ref: 'REQ-27006-9.4.4', clause: '9.4.4', std: 'ISO/IEC 27006-1', text: 'Stage 2 audit confirms ISMS implementation and monitoring evidence', type: 'Operational', mand: 'Mandatory', status: ev('Partially Compliant') },
  { ref: 'REQ-17021-9.3', clause: '9.3', std: 'ISO/IEC 17021-1', text: 'Management review conducted at planned intervals', type: 'Review', mand: 'Mandatory', status: ev('Compliant') },
  { ref: 'REQ-27701-8.4', clause: '8.4', std: 'ISO/IEC 27006-2', text: 'Privacy risk assessment records maintained for each client cycle', type: 'Record', mand: 'Mandatory', status: ev('Non-Compliant') },
  { ref: 'REQ-14064-6.1', clause: '6.1', std: 'ISO 14065', text: 'Technical reviewers hold current authorization for the relevant GHG sector', type: 'Competence', mand: 'Mandatory', status: ev('Partially Compliant') },
  { ref: 'REQ-17021-8.5', clause: '8.5', std: 'ISO/IEC 17021-1', text: 'Complaints and appeals handled per a documented process', type: 'Process', mand: 'Mandatory', status: ev('Compliant') },
  { ref: 'REQ-17065-7.1', clause: '7.1', std: 'ISO/IEC 17065', text: 'Certification scheme requirements documented before operation', type: 'Policy', mand: 'Optional', status: ev('Not Applicable') },
];

export const complianceRows = [
  { ref: 'REQ-17021-5.2', Document: ev('Verified'), Record: ev('Partial'), Operational: ev('Verified'), Personnel: ev('N/A'), System: ev('Verified') },
  { ref: 'REQ-17021-7.2.3', Document: ev('Verified'), Record: ev('Missing'), Operational: ev('N/A'), Personnel: ev('Expired'), System: ev('Verified') },
  { ref: 'REQ-27006-9.4.4', Document: ev('Verified'), Record: ev('Partial'), Operational: ev('Partial'), Personnel: ev('N/A'), System: ev('Verified') },
  { ref: 'REQ-17021-9.3', Document: ev('Verified'), Record: ev('Verified'), Operational: ev('N/A'), Personnel: ev('N/A'), System: ev('Verified') },
  { ref: 'REQ-27701-8.4', Document: ev('N/A'), Record: ev('Missing'), Operational: ev('Missing'), Personnel: ev('N/A'), System: ev('Partial') },
  { ref: 'REQ-14064-6.1', Document: ev('Verified'), Record: ev('Partial'), Operational: ev('Verified'), Personnel: ev('Expired'), System: ev('Verified') },
];

/**
 * Personnel & competence, client certification status, audit execution, technical review
 * and certification decisions are all READ-ONLY, synced from Platform Audit (design
 * principle P6). Platform Audit is the record-level system of truth for every one of
 * these domains, so NexAccred never re-renders its row-level tabulation — that would just
 * be a slower, stale mirror of a screen the user already has. Instead every one of these
 * modules surfaces the thing Platform Audit does NOT compute: aggregate exposure, coverage
 * and risk *for accreditation readiness* — counted total and per scheme, so a gap is
 * visible before an Accreditation Body assessor finds it.
 */

/* ---- Personnel & Competence ------------------------------------------------------- */
/* Role-qualification headcount per scheme — a person with 2 scheme quals counts twice,
   matching how Platform Audit itself counts qualification records, not people. Validator
   / Verifier are the ISO/IEC 17029 + ISO 14065 roles for the one validation & verification
   scheme (ISO 14064-1) — every management-system scheme reads 0 there, which is itself
   informative (confirms scope, not a blank cell). */
export const auditorRoleByScheme = [
  { scheme: 'ISO 9001', leadAuditors: 9, auditors: 16, validators: 0, verifiers: 0, inQualification: 2 },
  { scheme: 'ISO 14001', leadAuditors: 6, auditors: 11, validators: 0, verifiers: 0, inQualification: 1 },
  { scheme: 'ISO 27001', leadAuditors: 5, auditors: 9, validators: 0, verifiers: 0, inQualification: 1 },
  { scheme: 'ISO 27701', leadAuditors: 1, auditors: 3, validators: 0, verifiers: 0, inQualification: 1 },
  { scheme: 'ISO 14064-1', leadAuditors: 0, auditors: 0, validators: 3, verifiers: 4, inQualification: 1 },
];

/* Review & decision-stage roles — same per-scheme shape, separated from the audit-execution
   roles above because they sit at a different stage of the certification pipeline. */
export const reviewDecisionRolesByScheme = [
  { scheme: 'ISO 9001', technicalReviewers: 4, applicationReviewers: 5, decisionMakers: 3 },
  { scheme: 'ISO 14001', technicalReviewers: 3, applicationReviewers: 4, decisionMakers: 2 },
  { scheme: 'ISO 27001', technicalReviewers: 4, applicationReviewers: 4, decisionMakers: 2 },
  { scheme: 'ISO 27701', technicalReviewers: 2, applicationReviewers: 2, decisionMakers: 1 },
  { scheme: 'ISO 14064-1', technicalReviewers: 2, applicationReviewers: 2, decisionMakers: 1 },
];

/* When, not just who — recalibration and witness re-assessment are both time-bound
   obligations, so exposure is read off a due-date horizon rather than a single count. */
export const calibrationDueSchedule = [
  { window: 'Overdue', calibration: 3, witness: 1 },
  { window: 'Due in 30 days', calibration: 4, witness: 2 },
  { window: 'Due in 60 days', calibration: 5, witness: 2 },
  { window: 'Due in 90 days', calibration: 3, witness: 1 },
];

/* Rolling-90-day mandays demand vs. qualified auditor capacity — the calculation behind
   "if 3 more clients book Stage 2 next month, do we actually have the auditors?" */
export const mandaysCapacityByScheme = [
  { scheme: 'ISO 9001', mandaysRequired: 620, mandaysAvailable: 705, availableAuditors: 14, risk: ev('Sufficient') },
  { scheme: 'ISO 14001', mandaysRequired: 410, mandaysAvailable: 430, availableAuditors: 9, risk: ev('Sufficient') },
  { scheme: 'ISO 27001', mandaysRequired: 480, mandaysAvailable: 410, availableAuditors: 7, risk: ev('Tight') },
  { scheme: 'ISO 27701', mandaysRequired: 140, mandaysAvailable: 95, availableAuditors: 2, risk: ev('Shortfall') },
  { scheme: 'ISO 14064-1', mandaysRequired: 95, mandaysAvailable: 120, availableAuditors: 4, risk: ev('Sufficient') },
];

/* needCalibration/witnessNeeded = overdue + due within 30 days — the near-term, actionable
   slice of calibrationDueSchedule above; the 60/90-day columns are for forward planning. */
export const auditorRiskSummary = { needCalibration: 7, auditLogShortfall: 4, witnessNeeded: 3 };

/* Highlights, not the roster — the full list of who lives in Platform Audit. */
export const auditorRiskFlags = [
  { t: 'D. Kwon — lead auditor calibration overdue', m: 'ISO 27701 · Recalibration due every 24 months · 41 days overdue', sev: 'red' },
  { t: 'ISO 27701 — single point of failure', m: 'Only 1 fully eligible lead auditor covers the entire scheme', sev: 'red' },
  { t: 'T. Reyes — audit log below minimum', m: 'ISO 27001 · 2 of 4 required audits completed this cycle', sev: 'orange' },
  { t: 'S. Okafor — audit log below minimum', m: 'ISO 27001 (Cloud Security) · 1 of 4 required audits completed this cycle', sev: 'orange' },
  { t: 'A. Farouk — calibration due soon', m: 'ISO 14064-1 · Authorization expires in 9 days', sev: 'yellow' },
];

/* ---- Clients ------------------------------------------------------------------------ */
export const clientsByScheme = [
  { scheme: 'ISO 9001', certifiedClients: 61, certificates: 64, active: 58, withdrawn: 4, transferredOut: 2, expiringSoon: 6 },
  { scheme: 'ISO 14001', certifiedClients: 36, certificates: 38, active: 33, withdrawn: 3, transferredOut: 2, expiringSoon: 4 },
  { scheme: 'ISO 27001', certifiedClients: 39, certificates: 41, active: 35, withdrawn: 4, transferredOut: 2, expiringSoon: 7 },
  { scheme: 'ISO 27701', certifiedClients: 13, certificates: 14, active: 11, withdrawn: 2, transferredOut: 1, expiringSoon: 2 },
  { scheme: 'ISO 14064-1', certifiedClients: 9, certificates: 9, active: 8, withdrawn: 1, transferredOut: 0, expiringSoon: 1 },
];

/* ---- Audits (Platform Audit is system of record for scheduling & execution) --------- */
export const auditsByScheme = [
  { scheme: 'ISO 9001', totalAudits: 210, mandays: 620, new: 18, surveillance: 165, recertification: 27, transferredIn: 3 },
  { scheme: 'ISO 14001', totalAudits: 142, mandays: 410, new: 11, surveillance: 112, recertification: 19, transferredIn: 2 },
  { scheme: 'ISO 27001', totalAudits: 156, mandays: 480, new: 22, surveillance: 108, recertification: 26, transferredIn: 5 },
  { scheme: 'ISO 27701', totalAudits: 34, mandays: 140, new: 14, surveillance: 17, recertification: 3, transferredIn: 1 },
  { scheme: 'ISO 14064-1', totalAudits: 28, mandays: 95, new: 6, surveillance: 19, recertification: 3, transferredIn: 0 },
];

/* ---- Technical Review ----------------------------------------------------------------*/
export const techReviewByScheme = [
  { scheme: 'ISO 9001', reviewed: 205, approved: 178, approvedWithNotes: 22, rejected: 5 },
  { scheme: 'ISO 14001', reviewed: 138, approved: 119, approvedWithNotes: 15, rejected: 4 },
  { scheme: 'ISO 27001', reviewed: 149, approved: 112, approvedWithNotes: 27, rejected: 10 },
  { scheme: 'ISO 27701', reviewed: 32, approved: 19, approvedWithNotes: 9, rejected: 4 },
  { scheme: 'ISO 14064-1', reviewed: 27, approved: 22, approvedWithNotes: 4, rejected: 1 },
];

export const topTechnicalReviewers = [
  { name: 'L. Bianchi', reviewed: 187, approvedWithNotes: 21, rejected: 6 },
  { name: 'S. Okafor', reviewed: 142, approvedWithNotes: 24, rejected: 9 },
  { name: 'A. Farouk', reviewed: 96, approvedWithNotes: 11, rejected: 3 },
  { name: 'Maria Santos', reviewed: 74, approvedWithNotes: 8, rejected: 2 },
];

export const trTurnaround = { avgDays: 3.4, slaTargetDays: 5, withinSlaPct: 92 };

/* ---- Certification Decisions ----------------------------------------------------------*/
export const decisionsByScheme = [
  { scheme: 'ISO 9001', total: 178, certify: 18, maintain: 152, suspend: 5, withdraw: 3 },
  { scheme: 'ISO 14001', total: 119, certify: 11, maintain: 102, suspend: 4, withdraw: 2 },
  { scheme: 'ISO 27001', total: 112, certify: 22, maintain: 78, suspend: 8, withdraw: 4 },
  { scheme: 'ISO 27701', total: 19, certify: 14, maintain: 3, suspend: 2, withdraw: 0 },
  { scheme: 'ISO 14064-1', total: 22, certify: 6, maintain: 15, suspend: 1, withdraw: 0 },
];

export const topDecisionMakers = [
  { name: 'L. Bianchi', decisions: 312, suspend: 14, withdraw: 6 },
  { name: 'Joan Marsh', decisions: 138, suspend: 6, withdraw: 3 },
];

/* Avg turnaround per scheme, technical review sign-off → decision recorded. Matches the
   existing RISK-27001-007 signal (ISO 27001 trending above the 30-day target). Turnaround
   is a rate, not a count, so it is not scaled by period below. */
export const decisionTurnaroundByScheme = [
  { scheme: 'ISO 9001', avgDays: 18, targetDays: 30 },
  { scheme: 'ISO 14001', avgDays: 21, targetDays: 30 },
  { scheme: 'ISO 27001', avgDays: 34, targetDays: 30 },
  { scheme: 'ISO 27701', avgDays: 24, targetDays: 30 },
  { scheme: 'ISO 14064-1', avgDays: 16, targetDays: 30 },
];

/* ---- Time-based trend: Month-to-Date / This Year / Last Year / Year Before ------------
   Audits, Technical Review and Certification Decisions are all operational counts, so a
   single snapshot hides the thing that actually signals risk — is this scheme's volume
   growing, flat, or slipping. Same per-scheme shape, scaled by a realistic period factor,
   so switching the period filter re-reads every stat and table on the screen together.
   ISO 27701 only went live within the last 12 months (see RISK-27701-005 in the Risk
   Dashboard), so its own factor stays near zero before that instead of following the rest
   of the portfolio's curve. "This Year" is year-to-date through the app's current date
   (10 August 2026) — about 7.5 months — which is also why Month-to-Date reads as roughly
   1/7.5 of it. */
const PERIOD_FACTOR = { mtd: 0.11, thisYear: 1, lastYear: 0.83, yearBefore: 0.62 };
const NEW_SCHEME_PERIOD_FACTOR = { mtd: 0.11, thisYear: 1, lastYear: 0.35, yearBefore: 0.02 };

function byPeriod(rows, keys) {
  const build = (period) => rows.map((r) => {
    const f = (r.scheme === 'ISO 27701' ? NEW_SCHEME_PERIOD_FACTOR : PERIOD_FACTOR)[period];
    const out = { scheme: r.scheme };
    keys.forEach((k) => { out[k] = Math.max(0, Math.round(r[k] * f)); });
    return out;
  });
  return { mtd: build('mtd'), thisYear: rows, lastYear: build('lastYear'), yearBefore: build('yearBefore') };
}

function scaleLeaderboard(rows, keys) {
  const build = (period) => rows.map((r) => {
    const out = { name: r.name };
    keys.forEach((k) => { out[k] = Math.max(0, Math.round(r[k] * PERIOD_FACTOR[period])); });
    return out;
  });
  return { mtd: build('mtd'), thisYear: rows, lastYear: build('lastYear'), yearBefore: build('yearBefore') };
}

export const PERIODS = [
  { key: 'mtd', label: 'This Month' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'lastYear', label: 'Last Year' },
  { key: 'yearBefore', label: 'Year Before' },
];

export const auditsByPeriod = byPeriod(
  auditsByScheme,
  ['totalAudits', 'mandays', 'new', 'surveillance', 'recertification', 'transferredIn'],
);
export const techReviewByPeriod = byPeriod(
  techReviewByScheme,
  ['reviewed', 'approved', 'approvedWithNotes', 'rejected'],
);
export const decisionsByPeriod = byPeriod(
  decisionsByScheme,
  ['total', 'certify', 'maintain', 'suspend', 'withdraw'],
);

export const topTechnicalReviewersByPeriod = scaleLeaderboard(
  topTechnicalReviewers,
  ['reviewed', 'approvedWithNotes', 'rejected'],
);
export const topDecisionMakersByPeriod = scaleLeaderboard(
  topDecisionMakers,
  ['decisions', 'suspend', 'withdraw'],
);

export const initialDocRows = [
  { name: 'Certification Procedure — Management Systems', type: 'Procedure', version: 'v6.2', owner: 'Joan Marsh', status: ev('Active'), reviewed: '2026-05-02' },
  { name: 'Impartiality Policy', type: 'Policy', version: 'v3.0', owner: 'Joan Marsh', status: ev('Active'), reviewed: '2026-02-11' },
  { name: 'Auditor Competence Criteria — ISO 27701', type: 'Work Instruction', version: 'v1.1', owner: 'Technical Manager', status: ev('Active'), reviewed: '2026-06-20' },
  { name: 'Client Manual', type: 'Manual', version: 'v4.4', owner: 'Certification Manager', status: ev('Active'), reviewed: '2026-01-30' },
];

/**
 * What documents SHOULD exist — deliberately separate from what DOES exist (initialDocRows).
 * A library that only lists what you have can never tell you what you're missing.
 */
export const initialRequiredDocTypes = [
  { name: 'Certification Procedure', appliesTo: 'All Schemes', status: ev('Verified') },
  { name: 'Impartiality Policy', appliesTo: 'All Schemes', status: ev('Verified') },
  { name: 'Client Manual', appliesTo: 'All Schemes', status: ev('Verified') },
  { name: 'Auditor Competence Criteria', appliesTo: 'ISO 27701', status: ev('Verified') },
  { name: 'Witness Assessment Procedure', appliesTo: 'All Schemes', status: ev('Missing') },
  { name: 'Complaints & Appeals Procedure', appliesTo: 'All Schemes', status: ev('Missing') },
];

export const evidenceRows = [
  { id: 'EV-2026-3301', ref: 'REQ-27701-8.4', type: 'Record Evidence', status: ev('Missing'), scheme: 'ISO 27701', uploaded: '—' },
  { id: 'EV-2026-3298', ref: 'REQ-27006-9.4.4', type: 'Operational Evidence', status: ev('Partial'), scheme: 'ISO 27001', uploaded: '2026-08-08' },
  { id: 'EV-2026-3290', ref: 'REQ-17021-9.3', type: 'Record Evidence', status: ev('Verified'), scheme: 'ISO 27001', uploaded: '2026-07-30' },
  { id: 'EV-2026-3287', ref: 'REQ-14064-6.1', type: 'Personnel Evidence', status: ev('Expired'), scheme: 'ISO 14064-1', uploaded: '2025-08-19' },
];

export const formsRows = [
  { name: 'Application Form — Certification', type: 'Form', owner: 'Certification Manager', used: '142 times', status: ev('Active') },
  { name: 'Stage 1 Audit Plan Template', type: 'Template', owner: 'Technical Manager', used: '89 times', status: ev('Active') },
  { name: 'Witness Assessment Form', type: 'Form', owner: 'Technical Manager', used: '23 times', status: ev('Active') },
];

export const recordsRows = [
  { name: 'Management Review Minutes — Q2 2026', type: 'Record', owner: 'Joan Marsh', status: ev('Partial'), date: '2026-06-30' },
  { name: 'Training Record — S. Okafor, Cloud Security', type: 'Record', owner: 'HR', status: ev('Expired'), date: '2025-08-06' },
  { name: 'Complaints Register 2026', type: 'Record', owner: 'Certification Manager', status: ev('Verified'), date: '2026-08-01' },
];

export const internalAssessRows = [
  { id: 'IA-2026-006', scope: 'ISO 27001 full scheme', auditor: 'M. Santos (Internal)', date: '2026-07-18', findings: '2', status: ev('Closed') },
  { id: 'IA-2026-005', scope: 'Impartiality & Personnel', auditor: 'M. Santos (Internal)', date: '2026-06-02', findings: '1', status: ev('Closed') },
  { id: 'IA-2026-007', scope: 'ISO 27701 full scheme', auditor: 'M. Santos (Internal)', date: '2026-08-22', findings: '—', status: ev('At Risk') },
];

export const abAssessRows = [
  { id: 'AB-2025-014', type: 'Surveillance', scheme: 'ISO 27001', date: '2025-09-10', result: ev('Minor NC'), report: 'View' },
  { id: 'AB-2024-009', type: 'Initial', scheme: 'ISO 27701', date: '2024-11-04', result: ev('Pass'), report: 'View' },
  { id: 'AB-2024-002', type: 'Surveillance', scheme: 'ISO 9001', date: '2024-03-19', result: ev('Pass'), report: 'View' },
];

export const findingsRows = [
  { id: 'FND-2026-031', source: 'Internal Audit', ref: 'REQ-17021-5.2', scheme: 'ISO 27001', classification: 'Major NC', status: ev('Open'), owner: 'T. Reyes', due: '2026-08-20' },
  { id: 'FND-2025-118', source: 'AB Assessment', ref: 'REQ-17021-9.3', scheme: 'ISO 27001', classification: 'Minor NC', status: ev('Open'), owner: 'Joan Marsh', due: '2026-08-21' },
  { id: 'FND-2026-027', source: 'Internal Audit', ref: 'REQ-27701-8.4', scheme: 'ISO 27701', classification: 'Major NC', status: ev('Open'), owner: 'D. Kwon', due: '2026-08-25' },
  { id: 'FND-2026-019', source: 'Internal Audit', ref: 'REQ-17021-8.3', scheme: 'ISO 9001', classification: 'Minor NC', status: ev('Closed'), owner: 'Maria Santos', due: '2026-07-10' },
];

/**
 * Declared at assignment time, in Platform Audit — every auditor confirms, per audit, whether
 * they've consulted for or been employed by the client being audited within the last 2 years.
 * NexAccred is where the Impartiality Committee reviews what got declared. `category`
 * distinguishes External / non-organic auditors, whose conflict exposure runs materially
 * higher than organic (in-house) auditors — see impartialityByAuditorCategory below.
 */
export const impartialityRows = [
  { id: 'IMP-2026-011', person: 'T. Reyes', category: 'External', client: 'Northwind Logistics', type: 'Prior Consulting (<2 yrs)', status: ev('Closed'), reviewer: 'Impartiality Committee' },
  { id: 'IMP-2026-014', person: 'D. Kwon', category: 'Organic', client: 'Bank ABC', type: 'Family Relationship Declared', status: ev('Open'), reviewer: 'Impartiality Committee' },
  { id: 'IMP-2026-017', person: 'S. Okafor', category: 'External', client: 'Vantage Pharma', type: 'Prior Employment (<2 yrs)', status: ev('Open'), reviewer: 'Impartiality Committee' },
  { id: 'IMP-2026-016', person: 'A. Farouk', category: 'External', client: 'GreenFields Agri', type: 'Prior Consulting (<2 yrs)', status: ev('Closed'), reviewer: 'Impartiality Committee' },
  { id: 'IMP-2026-013', person: 'Maria Santos', category: 'Organic', client: 'Solara Energy', type: 'Prior Employment (3+ yrs ago)', status: ev('Closed'), reviewer: 'Impartiality Committee' },
];

export const impartialityByType = [
  { type: 'Prior Employment at Client (<2 yrs)', declared: 4, open: 1 },
  { type: 'Prior Consulting to Client (<2 yrs)', declared: 6, open: 2 },
  { type: 'Family / Personal Relationship', declared: 2, open: 1 },
  { type: 'Financial Interest Declared', declared: 1, open: 0 },
];

/* The risk signal the raw case list alone doesn't show: External / non-organic auditors
   declare a conflict far more often per assignment than organic (in-house) auditors do —
   the safeguard (second reviewer, closer witness cadence) should weight toward that pool. */
export const impartialityByAuditorCategory = [
  { category: 'External / Non-Organic Auditor', assignments: 210, declarations: 11, ratePer100: 5.2 },
  { category: 'Organic / Internal Auditor', assignments: 360, declarations: 3, ratePer100: 0.8 },
];

export const riskRows = [
  { id: 'RISK-27701-001', category: 'Competence Risk', desc: 'Single point of failure — only 1 eligible lead auditor', scheme: 'ISO 27701', likelihood: 'High', impact: ev('Overdue'), status: ev('Open') },
  { id: 'RISK-27001-004', category: 'Operational Risk', desc: 'Auditor pool concentration — 68% of Stage 2 on 2 auditors', scheme: 'ISO 27001', likelihood: 'Medium', impact: ev('At Risk'), status: ev('Open') },
  { id: 'RISK-27001-007', category: 'Operational Risk', desc: 'Certification decision turnaround above 30-day target', scheme: 'ISO 27001', likelihood: 'Medium', impact: ev('At Risk'), status: ev('Open') },
  { id: 'RISK-14001-003', category: 'Competence Risk', desc: 'Single point of failure — sector 14 lead auditor', scheme: 'ISO 14001', likelihood: 'Low', impact: ev('At Risk'), status: ev('Open') },
];

export const assessmentPackRows = [
  { ref: 'REQ-17021-5.2', topic: 'Impartiality', items: '6', status: ev('Partial'), updated: '2026-08-09' },
  { ref: 'REQ-17021-7.2.3', topic: 'Personnel Competence', items: '9', status: ev('Missing'), updated: '2026-08-01' },
  { ref: 'REQ-27006-9.4.4', topic: 'Stage 2 Audit Evidence', items: '11', status: ev('Partial'), updated: '2026-08-08' },
  { ref: 'REQ-17021-9.3', topic: 'Management Review', items: '4', status: ev('Verified'), updated: '2026-06-30' },
];

export const complianceReportRows = [
  { name: 'Q2 2026 Compliance Report', scope: 'All schemes', period: 'Apr–Jun 2026', generated: '2026-07-02', format: 'PDF', status: ev('Active') },
  { name: 'ISO 27701 Deep Dive', scope: 'ISO 27701', period: 'As of 2026-08-10', generated: 'today', format: 'PDF', status: ev('Active') },
];

export const workflowRows = [
  { name: 'Finding → CAPA Closure', trigger: 'Finding raised', steps: '6', owner: 'Joan Marsh', status: ev('Active') },
  { name: 'Certification Decision Approval', trigger: 'Technical review complete', steps: '3', owner: 'L. Bianchi', status: ev('Active') },
  { name: 'New Scheme Activation', trigger: 'Configuration submitted', steps: '10', owner: 'System Administrator', status: ev('Active') },
  { name: 'Competence Renewal Reminder', trigger: '45 days before expiry', steps: '2', owner: 'HR', status: ev('Active') },
];

export const notificationsRows = [
  { rule: 'Readiness Drop Alert', trigger: 'Score falls >2% in 24h', channel: 'Email + In-app', recipients: 'Head of Accreditation, Top Mgmt', status: ev('Active') },
  { rule: 'Competence Expiry', trigger: '14 days before expiry', channel: 'Email', recipients: 'Certification Manager, personnel', status: ev('Active') },
  { rule: 'CAPA Overdue', trigger: 'Due date passed', channel: 'In-app', recipients: 'CAPA owner, Quality Manager', status: ev('Active') },
  { rule: 'Assessment Countdown', trigger: '45 / 30 / 14 / 7 days before AB visit', channel: 'Email', recipients: 'Head of Accreditation', status: ev('Active') },
];

export const auditTrailRows = [
  { ts: '2026-08-10 09:12', user: 'Joan Marsh', action: 'Updated', entity: 'CAPA-2026-014', ref: 'CAPA-2026-014' },
  { ts: '2026-08-10 08:41', user: 'System', action: 'Recalculated readiness', entity: 'ISO 27701', ref: 'SCHEME-27701' },
  { ts: '2026-08-09 17:40', user: 'T. Reyes', action: 'Uploaded evidence', entity: 'Stage 2 report draft', ref: 'EV-2026-3298' },
  { ts: '2026-08-09 11:05', user: 'R. Alvi', action: 'Modified role', entity: 'Technical Reviewer', ref: 'ROLE-006' },
  { ts: '2026-08-08 15:22', user: 'D. Kwon', action: 'Competence expired (system)', entity: 'D. Kwon — Lead Auditor', ref: 'PERS-0014' },
];

export const usersRows = [
  { name: 'Joan Marsh', email: 'joan.marsh@nexaccred.io', role: 'Head of Accreditation', status: ev('Active'), login: '2026-08-10 09:12' },
  { name: 'T. Reyes', email: 't.reyes@nexaccred.io', role: 'Lead Auditor', status: ev('Active'), login: '2026-08-09 17:40' },
  { name: 'S. Okafor', email: 's.okafor@nexaccred.io', role: 'Technical Reviewer', status: ev('Active'), login: '2026-08-08 11:05' },
  { name: 'D. Kwon', email: 'd.kwon@nexaccred.io', role: 'Lead Auditor', status: ev('Active'), login: '2026-07-22 14:00' },
  { name: 'L. Bianchi', email: 'l.bianchi@nexaccred.io', role: 'Certification Decision Maker', status: ev('Active'), login: '2026-08-10 08:02' },
  { name: 'A. Farouk', email: 'a.farouk@nexaccred.io', role: 'Technical Expert', status: ev('Active'), login: '2026-08-07 16:20' },
  { name: 'Maria Santos', email: 'm.santos@nexaccred.io', role: 'Internal Auditor', status: ev('Active'), login: '2026-08-06 10:15' },
  { name: 'R. Alvi', email: 'r.alvi@nexaccred.io', role: 'System Administrator', status: ev('Active'), login: '2026-08-10 07:50' },
  { name: 'K. Devi', email: 'k.devi@nexaccred.io', role: 'Impartiality Committee', status: ev('Active'), login: '2026-06-11 09:30' },
  { name: 'Rahayu Ningsih', email: 'rahayu.ningsih@nexaccred.io', role: 'Accreditation Staff', status: ev('Active'), login: '2026-08-10 08:20' },
  { name: 'Helda Mutiara', email: 'helda.mutiara@nexaccred.io', role: 'Document Controller', status: ev('Active'), login: '2026-08-09 15:45' },
];

const perm = (label) => {
  const c = {
    'No Access': { bg: 'bg-status-grayBg', ink: 'text-status-gray' },
    View: { bg: 'bg-brand-50', ink: 'text-brand-700' },
    Edit: { bg: 'bg-status-orangeBg', ink: 'text-status-orange' },
    Approve: { bg: 'bg-status-greenBg', ink: 'text-status-green' },
  }[label];
  return { label, ...c };
};

/**
 * Permission is composed per entity-domain, never hard-wired per screen — so a new role
 * is a data record, not a code change.
 *
 * The System Administrator row is the critical one: NO ACCESS across every business
 * domain. Deciding what a clause requires is a conformity-assessment judgement owned by
 * the Head of Accreditation, not by IT. See 05-RBAC-Separation-of-Duties.md.
 */
export const rolesRows = [
  { role: 'Top Management', desc: 'Executive oversight of readiness and risk, not configuration', p1: perm('View'), p2: perm('View'), p3: perm('View'), p4: perm('View'), p5: perm('View'), p6: perm('No Access') },
  { role: 'Head of Accreditation', desc: "Owns readiness end-to-end — this system's primary user", p1: perm('Edit'), p2: perm('Edit'), p3: perm('Edit'), p4: perm('Approve'), p5: perm('Edit'), p6: perm('View') },
  { role: 'Accreditation Staff', desc: 'Day-to-day scheme admin, evidence uploads, task follow-through', p1: perm('Edit'), p2: perm('Edit'), p3: perm('View'), p4: perm('View'), p5: perm('View'), p6: perm('No Access') },
  { role: 'Document Controller', desc: 'Owns the document library, evidence repository, assessment pack', p1: perm('View'), p2: perm('Edit'), p3: perm('No Access'), p4: perm('No Access'), p5: perm('View'), p6: perm('No Access') },
  { role: 'Certification Manager', desc: 'Owns certification lifecycle and client scheduling', p1: perm('View'), p2: perm('Edit'), p3: perm('View'), p4: perm('View'), p5: perm('View'), p6: perm('No Access') },
  { role: 'Technical Manager', desc: 'Owns scheme technical rules and competence criteria', p1: perm('Edit'), p2: perm('View'), p3: perm('Edit'), p4: perm('View'), p5: perm('View'), p6: perm('View') },
  { role: 'Lead Auditor / Auditor', desc: 'Executes assigned audits, uploads evidence', p1: perm('View'), p2: perm('Edit'), p3: perm('View'), p4: perm('View'), p5: perm('No Access'), p6: perm('No Access') },
  { role: 'Technical Reviewer / Decision Maker', desc: 'Independent review and the decision record', p1: perm('View'), p2: perm('View'), p3: perm('View'), p4: perm('View'), p5: perm('No Access'), p6: perm('No Access') },
  { role: 'Internal Auditor', desc: 'Raises findings against the same requirement graph AB assessors use', p1: perm('View'), p2: perm('View'), p3: perm('No Access'), p4: perm('Edit'), p5: perm('View'), p6: perm('No Access') },
  { role: 'Impartiality Committee', desc: 'Conflict declarations and impartiality review', p1: perm('No Access'), p2: perm('No Access'), p3: perm('No Access'), p4: perm('Edit'), p5: perm('View'), p6: perm('No Access') },
  { role: 'System Administrator', desc: "Not a super admin — infrastructure only. Zero access to accreditation bodies, schemes, standards, or requirements.", p1: perm('No Access'), p2: perm('No Access'), p3: perm('No Access'), p4: perm('No Access'), p5: perm('No Access'), p6: perm('Approve') },
];

/* Per-scheme slice of each pipeline stage — synced from Platform Audit */
export const workloadByScheme = {
  'Application Review': { iso9001: 298, iso14001: 187, iso27001: 156, iso27701: 71, iso14064: 34 },
  Scheduling: { iso9001: 52, iso14001: 38, iso27001: 41, iso27701: 15, iso14064: 8 },
  Audit: { iso9001: 0, iso14001: 0, iso27001: 0, iso27701: 0, iso14064: 0 },
  'Technical Review': { iso9001: 0, iso14001: 0, iso27001: 0, iso27701: 0, iso14064: 0 },
  'Certificate Issuance': { iso9001: 0, iso14001: 0, iso27001: 0, iso27701: 0, iso14064: 0 },
};

export const workloadCurrentByScheme = {
  'Application Review': { iso9001: 266, iso14001: 166, iso27001: 138, iso27701: 63, iso14064: 31 },
};

export const initialTasks = [
  { id: 'TASK-001', title: 'Renew lead auditor competence — ISO 27701 privacy information management', scheme: 'iso27701', ref: 'REQ-27701-7.2.3', assignee: 'D. Kwon', due: '2026-08-14', status: 'In Progress', priority: 'Critical' },
  { id: 'TASK-002', title: 'Upload Q2 privacy risk assessment records — 3 client files', scheme: 'iso27701', ref: 'REQ-27701-8.4', assignee: 'D. Kwon', due: '2026-08-15', status: 'Not Started', priority: 'Critical' },
  { id: 'TASK-003', title: 'Close CAPA-2026-014 — impartiality safeguard root cause', scheme: 'iso27001', ref: 'CAPA-2026-014', assignee: 'T. Reyes', due: '2026-08-06', status: 'In Progress', priority: 'Critical' },
  { id: 'TASK-004', title: 'Upload Stage 2 audit report — Northwind Logistics', scheme: 'iso27001', ref: 'REQ-27006-9.4.4', assignee: 'T. Reyes', due: '2026-08-12', status: 'Not Started', priority: 'High' },
  { id: 'TASK-005', title: 'File witnessed assessment record for newly authorized auditor', scheme: 'iso27001', ref: 'REQ-17021-7.2.8', assignee: 'S. Okafor', due: '2026-08-13', status: 'Not Started', priority: 'High' },
  { id: 'TASK-006', title: 'Get Q2 management review minutes signed off', scheme: 'iso27001', ref: 'REQ-17021-9.3', assignee: 'Joan Marsh', due: '2026-08-18', status: 'In Progress', priority: 'Medium' },
  { id: 'TASK-007', title: 'Renew technical reviewer authorization — GHG quantification scope', scheme: 'iso14064', ref: 'REQ-14064-6.1', assignee: 'A. Farouk', due: '2026-08-19', status: 'Not Started', priority: 'High' },
  { id: 'TASK-008', title: 'Correct sampling plan inconsistency across sector codes', scheme: 'iso27001', ref: 'FND-2026-031', assignee: 'T. Reyes', due: '2026-08-22', status: 'In Progress', priority: 'Medium' },
  { id: 'TASK-009', title: 'Verify effectiveness of prior AB surveillance finding', scheme: 'iso27001', ref: 'FND-2025-118', assignee: 'Joan Marsh', due: '2026-08-21', status: 'Not Started', priority: 'Medium' },
  { id: 'TASK-010', title: 'Update legal compliance register for 2 client files', scheme: 'iso14001', ref: 'REQ-17021-8.3', assignee: 'Maria Santos', due: '2026-08-05', status: 'Not Started', priority: 'Medium' },
  { id: 'TASK-011', title: 'Sign off Solara Energy surveillance report', scheme: 'iso9001', ref: 'REQ-17021-9.2', assignee: 'L. Bianchi', due: '2026-08-16', status: 'Not Started', priority: 'Low' },
  { id: 'TASK-012', title: 'Mitigate single-point-of-failure risk — ISO 27701 lead auditor', scheme: 'iso27701', ref: 'RISK-27701-001', assignee: 'Joan Marsh', due: '2026-08-28', status: 'Not Started', priority: 'High' },
  { id: 'TASK-013', title: 'Address auditor pool concentration on ISO 27001 Stage 2 audits', scheme: 'iso27001', ref: 'RISK-27001-004', assignee: 'R. Alvi', due: '2026-09-01', status: 'Not Started', priority: 'Medium' },
  { id: 'TASK-014', title: 'Resolve PII inventory review inconsistency across client files', scheme: 'iso27701', ref: 'FND-2026-027', assignee: 'D. Kwon', due: '2026-08-09', status: 'Done', priority: 'Medium' },
  { id: 'TASK-015', title: 'Close document control nonconformity from internal audit', scheme: 'iso9001', ref: 'FND-2026-019', assignee: 'Maria Santos', due: '2026-07-28', status: 'Done', priority: 'Low' },
];
