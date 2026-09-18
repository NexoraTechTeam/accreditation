/**
 * Readiness Widget — host context adapter.
 *
 * Minimum viable host-context contract (docs/widget-readiness-ai-assistant.md §4):
 *   project, environment, prototypeVersion, route, screen, param,
 *   reviewer { name, title, role }, state snapshot (optional,jaminan privasi:
 *   hanya ringkasan konfigurasi — tidak pernah seluruh domain data).
 */
import { PROJECT_ID, PROTOTYPE_VERSION } from './version';

const SCREEN_LABELS = {
  dashboard: 'Executive Dashboard',
  'dashboard-auditor': 'Auditor Dashboard',
  'dashboard-impartiality': 'Impartiality Dashboard',
  'dashboard-staff': 'Staff Dashboard',
  'dashboard-doccontrol': 'Document Controller Dashboard',
  'dashboard-admin': 'Admin Dashboard',
  tasks: 'Tasks',
  'accreditation-scope': 'Accreditation Scope',
  'accreditation-profile': 'Accreditation Bodies',
  'ab-detail': 'Accreditation Body Detail',
  schemes: 'Schemes Table',
  'scheme-detail': 'Scheme Detail',
  readiness: 'Readiness',
  'readiness-methodology': 'Readiness Methodology',
  'ab-assessment': 'AB Assessment',
  'certification-activities': 'Certification Activities',
  'personnel-competence': 'Personnel & Competence',
  'document-library': 'Document Library',
};

export function buildContext({ environment = 'review', role = null, route = 'dashboard', param = null, currentUser = null, weights = null } = {}) {
  const reviewer = role
    ? {
        name: currentUser?.name || currentUser?.email || role.name,
        title: role.title,
        role: role.id,
      }
    : { name: 'anonymous reviewer', title: 'Unknown', role: 'unknown' };
  return {
    project: PROJECT_ID,
    environment,
    prototypeVersion: PROTOTYPE_VERSION,
    route,
    screen: SCREEN_LABELS[route] || route,
    param,
    reviewer,
    // Config summary only — never the full domain dataset.
    weights: weights ? { ...weights } : null,
    at: new Date().toISOString(),
  };
}
