/**
 * ROLES & NAVIGATION
 *
 * Each role sees a filtered nav (built from `routes`) and its own tailored dashboard.
 *
 * IMPORTANT: this is a UX-level filter, not an enforcement layer. The point is that a
 * Document Controller opens the app and sees a document-shaped app. In production every
 * API endpoint must independently validate role_permission server-side — see
 * 05-RBAC-Separation-of-Duties.md §5.
 */

export const ROLES = {
  head: {
    id: 'head',
    name: 'Joan Marsh',
    title: 'Head of Accreditation',
    initials: 'JM',
    icon: 'shield',
    desc: "Full oversight — every scheme, every gap, every deadline. This system's primary user.",
    all: true,
    dashboard: 'dashboard',
  },
  auditor: {
    id: 'auditor',
    name: 'Maria Santos',
    title: 'Internal Auditor',
    initials: 'MS',
    icon: 'circle',
    desc: 'Internal assessments, findings, and CAPA — the same requirement graph an AB assessor uses.',
    routes: ['dashboard', 'tasks', 'accreditation-scope', 'requirements', 'compliance', 'document-library', 'evidence-repository', 'internal-assessment', 'findings', 'capa', 'risk', 'impartiality', 'gap-analysis', 'readiness'],
    dashboard: 'dashboard-auditor',
  },
  impartiality: {
    id: 'impartiality',
    name: 'K. Devi',
    title: 'Impartiality Committee',
    initials: 'KD',
    icon: 'scale',
    desc: 'Conflict declarations and impartiality review — plus the same Operation visibility the Head of Accreditation has, since a conflict can only be judged against who actually did the work.',
    routes: [
      'dashboard', 'tasks', 'impartiality', 'findings', 'document-library',
      'certification-activities', 'personnel-competence', 'clients', 'audits', 'technical-review', 'certification-decisions',
    ],
    dashboard: 'dashboard-impartiality',
  },
  staff: {
    id: 'staff',
    name: 'Rahayu Ningsih',
    title: 'Accreditation Staff',
    initials: 'RN',
    icon: 'briefcase',
    desc: 'Day-to-day scheme admin, workload, and task follow-through for the Head of Accreditation.',
    routes: ['dashboard', 'tasks', 'accreditation-scope', 'standards', 'schemes', 'requirements', 'compliance', 'certification-activities', 'personnel-competence', 'clients', 'audits', 'technical-review', 'certification-decisions', 'document-library', 'evidence-repository', 'forms-templates', 'records', 'findings', 'capa', 'ai-assistant', 'gap-analysis', 'readiness', 'compliance-report', 'assessment-pack'],
    dashboard: 'dashboard-staff',
  },
  doccontrol: {
    id: 'doccontrol',
    name: 'Helda Mutiara',
    title: 'Document Controller',
    initials: 'HM',
    icon: 'file',
    desc: 'Document library, evidence repository, and assessment-pack completeness.',
    routes: ['dashboard', 'tasks', 'requirements', 'compliance', 'document-library', 'evidence-repository', 'forms-templates', 'records', 'assessment-pack'],
    dashboard: 'dashboard-doccontrol',
  },
  admin: {
    id: 'admin',
    name: 'R. Alvi',
    title: 'System Administrator',
    initials: 'RA',
    icon: 'gear',
    // Deliberately excludes every business/domain route. Adding an Accreditation Body or
    // requirement is a conformity-assessment judgement owned by the Head of Accreditation.
    desc: "User accounts, roles, workflow, and integrations only — zero access to accreditation bodies, schemes, standards, or requirements.",
    routes: ['dashboard', 'users', 'roles', 'organization', 'workflow', 'notifications', 'integrations', 'audit-trail'],
    dashboard: 'dashboard-admin',
  },
};

/** Reverse lookup for restoring a session from the backend's JWT — the
 *  backend only knows the role by its RBAC-doc title ("Head of
 *  Accreditation"), not by the frontend's short id ("head"). */
export const ROLE_NAME_TO_ID = Object.fromEntries(
  Object.entries(ROLES).map(([id, r]) => [r.title, id])
);

export const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'tasks', label: 'Tasks', icon: 'tasks' },
  { group: 'Accreditation' },
  { key: 'accreditation-profile', label: 'Accreditation Bodies', icon: 'shield' },
  { key: 'accreditation-scope', label: 'Accreditation Scope', icon: 'target' },
  { key: 'standards', label: 'Standards', icon: 'docLines' },
  { key: 'schemes', label: 'Schemes', icon: 'bookmark' },
  { key: 'requirements', label: 'Requirements', icon: 'table' },
  { key: 'compliance', label: 'Compliance', icon: 'check' },
  { group: 'Operation' },
  { key: 'certification-activities', label: 'Certification Activities', icon: 'briefcase', synced: true },
  { key: 'personnel-competence', label: 'Personnel & Competence', icon: 'people', synced: true },
  { key: 'clients', label: 'Clients', icon: 'building' },
  { key: 'audits', label: 'Audits', icon: 'clock', synced: true },
  { key: 'technical-review', label: 'Technical Review', icon: 'review', synced: true },
  { key: 'certification-decisions', label: 'Certification Decisions', icon: 'shield', synced: true },
  { group: 'Document & Evidence' },
  { key: 'document-library', label: 'Document Library', icon: 'file' },
  { key: 'evidence-repository', label: 'Evidence Repository', icon: 'archive' },
  { key: 'forms-templates', label: 'Forms & Templates', icon: 'form' },
  { key: 'records', label: 'Records', icon: 'list' },
  { group: 'Assurance' },
  { key: 'internal-assessment', label: 'Internal Assessment', icon: 'circle' },
  { key: 'ab-assessment', label: 'AB Assessment', icon: 'shield' },
  { key: 'findings', label: 'Findings', icon: 'flag' },
  { key: 'capa', label: 'CAPA', icon: 'check' },
  { key: 'risk', label: 'Risk', icon: 'triangle' },
  { key: 'impartiality', label: 'Impartiality', icon: 'scale' },
  { group: 'Intelligence' },
  { key: 'ai-assistant', label: 'AI Accreditation Assistant', icon: 'sparkle', ai: true },
  { key: 'gap-analysis', label: 'Gap Analysis', icon: 'dashed', ai: true },
  { key: 'assessment-simulator', label: 'Assessment Simulator', icon: 'sim', ai: true },
  { key: 'impact-analysis', label: 'Impact Analysis', icon: 'network', ai: true },
  { key: 'readiness', label: 'Readiness', icon: 'bars' },
  { group: 'Reporting' },
  { key: 'compliance-report', label: 'Compliance Report', icon: 'file' },
  { key: 'assessment-pack', label: 'Assessment Pack', icon: 'docLines' },
  { key: 'management-report', label: 'Management Report', icon: 'file' },
  { key: 'analytics', label: 'Analytics', icon: 'bars' },
  { group: 'Administration' },
  { key: 'users', label: 'Users', icon: 'people' },
  { key: 'roles', label: 'Roles', icon: 'key' },
  { key: 'organization', label: 'Organization', icon: 'shield' },
  { key: 'workflow', label: 'Workflow', icon: 'flow' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'configuration', label: 'Configuration', icon: 'gear' },
  { key: 'integrations', label: 'Integrations', icon: 'link' },
  { key: 'audit-trail', label: 'Audit Trail', icon: 'list' },
];

/** Sub-routes highlight their parent nav item. */
export const PARENT_NAV = {
  'scheme-detail': 'schemes',
  'scheme-wizard': 'schemes',
  'scheme-register': 'schemes',
  'assessment-prep': 'ab-assessment',
  'standard-register': 'standards',
  'requirement-register': 'requirements',
  'doctype-register': 'document-library',
  'ab-detail': 'accreditation-profile',
  'ab-register': 'accreditation-profile',
  'readiness-methodology': 'readiness',
  'dashboard-auditor': 'dashboard',
  'dashboard-impartiality': 'dashboard',
  'dashboard-staff': 'dashboard',
  'dashboard-doccontrol': 'dashboard',
  'dashboard-admin': 'dashboard',
};
