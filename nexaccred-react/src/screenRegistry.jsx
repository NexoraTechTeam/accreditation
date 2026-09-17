import React from 'react';
import * as D from './data/records';
import {
  DashboardHead, DashboardAuditor, DashboardImpartiality, DashboardStaff,
  DashboardDocControl, DashboardAdmin,
} from './screens/Dashboards';
import {
  SchemeDetail, AccreditationScope, AccreditationBodies, AbDetail, SchemesTable,
} from './screens/Accreditation';
import { Readiness, ReadinessMethodology, Tasks, ABAssessment } from './screens/ReadinessScreens';
import {
  CertificationActivities, PersonnelCompetence, DocumentLibrary, RequirementRegister,
  StandardRegister, AbRegister, DocTypeRegister, SchemeRegister, SchemeWizard,
  AIScreen, TableScreen, Integrations,
  ClientPortfolio, AuditOperations, TechnicalReviewAnalytics, CertificationDecisionAnalytics,
  ImpartialityReview,
} from './screens/Screens';

/**
 * The screen router: route key → component. Shared verbatim between
 * src/App.jsx (the live app, real backend) and src/AppStandalone.jsx (the
 * offline UI/UX review build) — extracted here specifically so those two
 * entry points can never drift apart on what a given route renders. Neither
 * file should redefine this; if a route's rendering needs to change, it
 * changes once, here, for both.
 */
export function renderScreen({ route, param, ctx, navigate, taskFilter, setTaskFilter }) {
  const t = tableConfigs(ctx);

  switch (route) {
    case 'dashboard': return <DashboardHead ctx={ctx} onNavigate={navigate} />;
    case 'dashboard-auditor': return <DashboardAuditor onNavigate={navigate} />;
    case 'dashboard-impartiality': return <DashboardImpartiality onNavigate={navigate} />;
    case 'dashboard-staff': return <DashboardStaff ctx={ctx} onNavigate={navigate} />;
    case 'dashboard-doccontrol': return <DashboardDocControl onNavigate={navigate} />;
    case 'dashboard-admin': return <DashboardAdmin onNavigate={navigate} />;

    case 'tasks':
      return (
        <Tasks
          ctx={ctx}
          onNavigate={navigate}
          filter={taskFilter}
          onFilter={(f) => { setTaskFilter(f); }}
        />
      );

    case 'accreditation-scope': return <AccreditationScope ctx={ctx} onNavigate={navigate} />;
    case 'accreditation-profile': return <AccreditationBodies ctx={ctx} onNavigate={navigate} />;
    case 'ab-detail': return <AbDetail abId={param} ctx={ctx} onNavigate={navigate} />;
    case 'schemes': return <SchemesTable ctx={ctx} onNavigate={navigate} />;
    case 'scheme-detail': return <SchemeDetail schemeKey={param} ctx={ctx} onNavigate={navigate} />;

    case 'readiness': return <Readiness ctx={ctx} onNavigate={navigate} />;
    case 'readiness-methodology': return <ReadinessMethodology ctx={ctx} onNavigate={navigate} />;
    case 'ab-assessment': return <ABAssessment ctx={ctx} onNavigate={navigate} />;

    case 'certification-activities': return <CertificationActivities ctx={ctx} onNavigate={navigate} />;
    case 'personnel-competence':
      return <PersonnelCompetence ctx={ctx} onNavigate={navigate} />;
    case 'document-library': return <DocumentLibrary ctx={ctx} onNavigate={navigate} />;
    case 'integrations': return <Integrations onNavigate={navigate} />;

    case 'clients': return <ClientPortfolio onNavigate={navigate} />;
    case 'audits': return <AuditOperations onNavigate={navigate} />;
    case 'technical-review': return <TechnicalReviewAnalytics onNavigate={navigate} />;
    case 'certification-decisions': return <CertificationDecisionAnalytics onNavigate={navigate} />;
    case 'impartiality': return <ImpartialityReview onNavigate={navigate} />;

    case 'scheme-register': return <SchemeRegister ctx={ctx} onNavigate={navigate} />;
    case 'scheme-wizard': return <SchemeWizard schemeKey={param} ctx={ctx} onNavigate={navigate} />;
    case 'standard-register': return <StandardRegister ctx={ctx} onNavigate={navigate} />;
    case 'requirement-register': return <RequirementRegister ctx={ctx} onNavigate={navigate} />;
    case 'doctype-register': return <DocTypeRegister ctx={ctx} onNavigate={navigate} />;

    case 'ai-assistant':
      return (
        <AIScreen
          crumb="AI Accreditation Assistant"
          title="AI Accreditation Assistant"
          sub="Works on top of the structured compliance graph — every answer traces back to a requirement, document, or evidence record."
          question="What are the requirements for ISO 27701 accreditation?"
          answer={
            <>
              ISO 27701 accreditation is built on <b>ISO/IEC 17021-1</b> as the primary accreditation
              standard, with <b>ISO/IEC 27006-2</b> layered on top as the scheme-specific supporting
              requirement. The scheme adds privacy-specific competence criteria for lead auditors, a
              mandatory privacy risk assessment record per client cycle, and DPIA review evidence.
              Right now this scheme is the weakest in your portfolio — mainly because the one auditor
              qualified against the competence criteria has an expired authorization.
            </>
          }
          sources={['REQ-27701-7.2.3', 'REQ-27701-8.4', 'ISO/IEC 27006-2:2021 §8']}
          onNavigate={navigate}
        />
      );
    case 'assessment-simulator':
      return (
        <AIScreen
          crumb="Assessment Simulator"
          title="AI Assessment Simulator"
          sub="A rehearsal, not a decision — the AI role-plays an Accreditation Body assessor against your live requirement graph."
          question="Act as an Accreditation Body assessor and assess our ISO 27001 certification process."
          answer={
            <>
              Reviewing your ISO 27001 scheme against ISO/IEC 17021-1 and 27006-1, I'd expect to raise
              a finding on Clause 5.2 — your impartiality corrective action (CAPA-2026-014) is now 6
              days past its committed closure date, which is exactly the kind of gap an assessor
              samples for. I'd also want to see the Stage 2 report for Northwind Logistics, and I'd
              ask about auditor concentration given two auditors carry 68% of your Stage 2 workload.
            </>
          }
          sources={['REQ-17021-5.2', 'CAPA-2026-014', 'RISK-27001-004']}
          disclaimer="Simulated output for rehearsal purposes only — it does not represent an actual Accreditation Body finding or decision."
          onNavigate={navigate}
        />
      );
    case 'gap-analysis':
      return (
        <AIScreen
          crumb="Gap Analysis"
          title="AI Gap Analysis"
          sub="Pick a scheme — the AI walks the requirement graph and returns exactly what is unresolved."
          question="Are we compliant with ISO 27701?"
          answer={
            <>
              No — 4 gaps are open. Two are critical: the lead auditor competence for privacy
              information management expired 12 days ago, and Q2 privacy risk assessment records are
              missing across 3 client files. Both block the scheme from rising above "Not Yet Ready"
              regardless of its other pillar scores.
            </>
          }
          sources={['REQ-27701-7.2.3', 'REQ-27701-8.4', 'REQ-27701-8.2']}
          onNavigate={navigate}
        />
      );
    case 'impact-analysis':
      return (
        <AIScreen
          crumb="Impact Analysis"
          title="AI Impact Analysis"
          sub="What breaks — and where — when a requirement, document, or standard changes."
          question="ISO/IEC 27006-1:2024 Amendment 1 updates the cloud security clause. What is affected?"
          answer={
            <>
              One scheme is affected (ISO 27001), through requirement REQ-27006-6.1. Twelve client
              files fall in scope, and one technical reviewer — S. Okafor — needs re-authorization
              against the new clause text before the next Stage 2 audit.
            </>
          }
          sources={['REQ-27006-6.1', 'ISO/IEC 27006-1:2024']}
          onNavigate={navigate}
        />
      );

    default:
      if (t[route]) return <TableScreen config={t[route]} onNavigate={navigate} />;
      return (
        <div className="py-16 text-center text-ink-faint">
          Screen "{route}" is not implemented in this prototype.
        </div>
      );
  }
}

/* Config-driven list screens — one component, many screens. */
function tableConfigs(ctx) {
  const S = (label) => [{ label }];
  return {
    standards: {
      crumb: S('Accreditation'), title: 'Standards Library',
      sub: 'The configurable library of accreditation standards and supporting requirements — adding one never requires a code change.',
      action: { label: '+ Add Standard', route: 'standard-register' },
      cols: [
        { key: 'name', label: 'Standard' }, { key: 'type', label: 'Type' },
        { key: 'desc', label: 'Description' }, { key: 'clauses', label: 'Clauses' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: ctx.standards,
    },
    requirements: {
      crumb: S('Accreditation'), title: 'Requirement Library',
      sub: 'The atomic requirement graph the readiness engine traverses — owned by the Head of Accreditation, not by the system administrator.',
      action: { label: '+ Add Requirement', route: 'requirement-register' },
      cols: [
        { key: 'ref', label: 'ID', type: 'mono' }, { key: 'std', label: 'Standard' },
        { key: 'clause', label: 'Clause', type: 'mono' }, { key: 'text', label: 'Requirement' },
        { key: 'type', label: 'Type' }, { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: ctx.requirements,
    },
    compliance: {
      crumb: S('Accreditation'), title: 'Compliance Matrix',
      sub: 'Requirement × evidence category — compliance is never inferred just because a document exists.',
      cols: [
        { key: 'ref', label: 'Requirement', type: 'mono' },
        { key: 'Document', label: 'Document', type: 'badge' },
        { key: 'Record', label: 'Record', type: 'badge' },
        { key: 'Operational', label: 'Operational', type: 'badge' },
        { key: 'Personnel', label: 'Personnel', type: 'badge' },
        { key: 'System', label: 'System', type: 'badge' },
      ],
      rows: D.complianceRows,
    },
    'evidence-repository': {
      crumb: S('Document & Evidence'), title: 'Evidence Repository',
      sub: 'Availability, validity, completeness, authenticity, recency — evidence is judged on all five.',
      cols: [
        { key: 'id', label: 'Evidence ID', type: 'mono' }, { key: 'ref', label: 'Requirement', type: 'mono' },
        { key: 'type', label: 'Type' }, { key: 'status', label: 'Status', type: 'badge' },
        { key: 'scheme', label: 'Scheme' }, { key: 'uploaded', label: 'Uploaded', type: 'mono' },
      ],
      rows: D.evidenceRows,
    },
    'forms-templates': {
      crumb: S('Document & Evidence'), title: 'Forms & Templates',
      cols: [
        { key: 'name', label: 'Name' }, { key: 'type', label: 'Type' },
        { key: 'owner', label: 'Owner' }, { key: 'used', label: 'Usage' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.formsRows,
    },
    records: {
      crumb: S('Document & Evidence'), title: 'Records',
      cols: [
        { key: 'name', label: 'Record' }, { key: 'type', label: 'Type' },
        { key: 'owner', label: 'Owner' }, { key: 'status', label: 'Status', type: 'badge' },
        { key: 'date', label: 'Date', type: 'mono' },
      ],
      rows: D.recordsRows,
    },
    'internal-assessment': {
      crumb: S('Assurance'), title: 'Internal Assessment',
      sub: 'Internal audits raise findings against the same requirement graph an AB assessor would use.',
      cols: [
        { key: 'id', label: 'ID', type: 'mono' }, { key: 'scope', label: 'Scope' },
        { key: 'auditor', label: 'Auditor' }, { key: 'date', label: 'Date', type: 'mono' },
        { key: 'findings', label: 'Findings' }, { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.internalAssessRows,
    },
    findings: {
      crumb: S('Assurance'), title: 'Findings',
      cols: [
        { key: 'id', label: 'ID', type: 'mono' }, { key: 'source', label: 'Source' },
        { key: 'ref', label: 'Requirement', type: 'mono' }, { key: 'scheme', label: 'Scheme' },
        { key: 'classification', label: 'Classification' },
        { key: 'status', label: 'Status', type: 'badge' }, { key: 'owner', label: 'Owner' },
      ],
      rows: D.findingsRows,
    },
    capa: {
      crumb: S('Assurance'), title: 'CAPA Management',
      sub: 'Finding → Root Cause → Correction → Corrective Action → Verification → Effectiveness → Closure.',
      cols: [
        { key: 'id', label: 'ID', type: 'mono' }, { key: 'ref', label: 'Requirement', type: 'mono' },
        { key: 'scheme', label: 'Scheme' }, { key: 'owner', label: 'Owner' },
        { key: 'due', label: 'Due', type: 'mono' }, { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.findingsRows,
    },
    risk: {
      crumb: S('Assurance'), title: 'Risk Dashboard',
      cols: [
        { key: 'id', label: 'ID', type: 'mono' }, { key: 'category', label: 'Category' },
        { key: 'desc', label: 'Description' }, { key: 'scheme', label: 'Scheme' },
        { key: 'likelihood', label: 'Likelihood' }, { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.riskRows,
    },
    'compliance-report': {
      crumb: S('Reporting'), title: 'Compliance Report',
      cols: [
        { key: 'name', label: 'Report' }, { key: 'scope', label: 'Scope' },
        { key: 'period', label: 'Period' }, { key: 'generated', label: 'Generated' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.complianceReportRows,
    },
    'assessment-pack': {
      crumb: S('Reporting'), title: 'Assessment Evidence Pack',
      sub: 'Evidence organized by requirement — an internal preparation and navigation tool, not a public export.',
      cols: [
        { key: 'ref', label: 'Requirement', type: 'mono' }, { key: 'topic', label: 'Topic' },
        { key: 'items', label: 'Evidence Items' }, { key: 'status', label: 'Status', type: 'badge' },
        { key: 'updated', label: 'Last Updated', type: 'mono' },
      ],
      rows: D.assessmentPackRows,
    },
    'management-report': {
      crumb: S('Reporting'), title: 'Management Report',
      cols: [
        { key: 'name', label: 'Report' }, { key: 'scope', label: 'Scope' },
        { key: 'period', label: 'Period' }, { key: 'generated', label: 'Generated' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.complianceReportRows,
    },
    analytics: {
      crumb: S('Reporting'), title: 'Analytics',
      cols: [
        { key: 'name', label: 'Report' }, { key: 'scope', label: 'Scope' },
        { key: 'period', label: 'Period' }, { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.complianceReportRows,
    },
    users: {
      crumb: S('Administration'), title: 'Users',
      sub: 'Accounts and their assigned role. Permissions themselves live in Roles.',
      cols: [
        { key: 'name', label: 'Name' }, { key: 'email', label: 'Email', type: 'mono' },
        { key: 'role', label: 'Role' }, { key: 'status', label: 'Status', type: 'badge' },
        { key: 'login', label: 'Last Login', type: 'mono' },
      ],
      rows: D.usersRows,
    },
    roles: {
      crumb: S('Administration'), title: 'Roles',
      sub: 'Permission is composed per entity-type, not hand-wired per screen — a new role can be built here without touching code.',
      cols: [
        { key: 'role', label: 'Role' }, { key: 'desc', label: 'Description' },
        { key: 'p1', label: 'Requirements', type: 'perm' }, { key: 'p2', label: 'Evidence', type: 'perm' },
        { key: 'p3', label: 'Personnel', type: 'perm' }, { key: 'p4', label: 'Findings/CAPA', type: 'perm' },
        { key: 'p5', label: 'Reporting', type: 'perm' }, { key: 'p6', label: 'Admin', type: 'perm' },
      ],
      rows: D.rolesRows,
    },
    organization: {
      crumb: S('Administration'), title: 'Organization',
      cols: [{ key: 'name', label: 'Accreditation Body' }, { key: 'country', label: 'Country' }, { key: 'number', label: 'Number', type: 'mono' }, { key: 'status', label: 'Status', type: 'badge' }],
      rows: ctx.accreditationBodies.map((a) => ({ name: `${a.name} — ${a.full}`, country: a.country, number: a.number, status: a.status })),
    },
    workflow: {
      crumb: S('Administration'), title: 'Workflow Configuration',
      cols: [
        { key: 'name', label: 'Workflow' }, { key: 'trigger', label: 'Trigger' },
        { key: 'steps', label: 'Steps' }, { key: 'owner', label: 'Owner' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.workflowRows,
    },
    notifications: {
      crumb: S('Administration'), title: 'Notifications',
      cols: [
        { key: 'rule', label: 'Rule' }, { key: 'trigger', label: 'Trigger Condition' },
        { key: 'channel', label: 'Channel' }, { key: 'recipients', label: 'Recipients' },
        { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: D.notificationsRows,
    },
    configuration: {
      crumb: S('Administration'), title: 'Configuration',
      sub: 'Accreditation Bodies, standards, and schemes are configuration objects, not application modules.',
      note: 'Owned by the Head of Accreditation. The System Administrator has no access to this screen.',
      action: { label: '+ Add New Accreditation Scheme', route: 'scheme-register' },
      cols: [
        { key: 'name', label: 'Standard' }, { key: 'type', label: 'Type' },
        { key: 'clauses', label: 'Clauses' }, { key: 'status', label: 'Status', type: 'badge' },
      ],
      rows: ctx.standards,
    },
    'audit-trail': {
      crumb: S('Administration'), title: 'Audit Trail',
      sub: 'Immutable log of every state-changing action in the system.',
      cols: [
        { key: 'ts', label: 'Timestamp', type: 'mono' }, { key: 'user', label: 'User' },
        { key: 'action', label: 'Action' }, { key: 'entity', label: 'Entity' },
        { key: 'ref', label: 'Reference', type: 'mono' },
      ],
      rows: D.auditTrailRows,
    },
  };
}
