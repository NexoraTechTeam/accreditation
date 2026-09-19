/**
 * Readiness Widget — accreditation's own app config (rollout plan Fase 3):
 * the per-app values that widget/core/* is generic over. Academy/service-
 * desk each get their own copy of this file — never widget/core/.
 *
 * PROTOTYPE_VERSION identifies the exact review surface a finding belongs
 * to. Bump the suffix every time the prototype under review changes in a
 * way that could invalidate prior answers (new screens, changed rules,
 * reworded flows). Findings are forever tied to the version they were
 * recorded against — never rewritten onto a newer version.
 */
export const PROJECT_ID = 'nexaccred';
export const PROTOTYPE_VERSION = '1.0.0-pilot.1';
export const WIDGET_VERSION = '0.1.0';

// The ops-level published app name (matches ops/prototypes/refresh.sh and
// the nginx /accreditation/ location) — NOT the same namespace as
// PROJECT_ID, which is the widget's own localStorage/context identifier.
// The feedback collector groups NDJSON by this name.
export const FEEDBACK_APP = 'accreditation';

// {label, question} objects, not bare strings: ReadinessWidget.jsx used to
// pick each quick prompt's icon by `question.startsWith('Apa saja')` —
// reword the question and the icon silently went stale (rollout plan
// §3.2). The label now carries its own icon explicitly.
export const QUICK_PROMPTS = [
  { label: '🧭 Guide my review', question: 'Apa saja yang harus saya review di layar ini?' },
  { label: '🔍 Validate formula', question: 'Bagaimana readiness dihitung?' },
  { label: '🧪 Test edge case', question: 'Apa yang terjadi jika critical issue masih terbuka saat assessment dekat?' },
  { label: '✅ Check readiness', question: 'Apakah versi ini sudah siap untuk E2E development?' },
];

// Screen labels (moved here from contextAdapter.js so both the context adapter
// and the Node-run guidance gate read ONE source; app-specific, belongs in
// config, not core).
export const SCREEN_LABELS = {
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

// Fase 6 — screen-aware review guidance. Keys mirror core/store.js CHECK_AREAS.
// For each mandatory review area: the screen(s) where it is verified, and a
// prompt the knowledge base can actually answer. guidance.smoke.mjs asserts
// every route is a real screen and every prompt resolves ANSWERED_FROM_SOURCE,
// so a suggestion never sends the reviewer to a dead screen or a non-answer.
export const AREA_GUIDE = {
  roleAccess:       { routes: ['dashboard'], prompt: { label: '🧭 Peran & akses', question: 'Sebagai persona ini, area review apa yang jadi tugas saya?' } },
  readinessFormula: { routes: ['readiness', 'readiness-methodology', 'dashboard'], prompt: { label: '🔢 Formula readiness', question: 'Bagaimana readiness dihitung dan dari bobot apa?' } },
  scope:            { routes: ['accreditation-scope', 'schemes', 'scheme-detail'], prompt: { label: '🗂️ Scope & scheme', question: 'Apa arti status dan scope pada scheme accreditation ini?' } },
  nextAssessment:   { routes: ['ab-assessment', 'dashboard'], prompt: { label: '📅 Assessment', question: 'Apa yang harus disiapkan sebelum assessment visit berikutnya?' } },
  criticalIssues:   { routes: ['scheme-detail', 'dashboard'], prompt: { label: '⛔ Critical issue', question: 'Apa aturan blocking untuk critical issue yang masih terbuka?' } },
  personnel:        { routes: ['personnel-competence'], prompt: { label: '👥 Personel', question: 'Bagaimana kompetensi dan otorisasi auditor personel dinilai?' } },
  evidence:         { routes: ['document-library', 'scheme-detail'], prompt: { label: '📚 Evidence', question: 'Bagaimana status compliance evidence dihitung dan ditelusuri?' } },
  permissions:      { routes: ['dashboard-impartiality', 'dashboard'], prompt: { label: '🔐 RBAC', question: 'Siapa saja yang punya hak akses di matriks izin (RBAC)?' } },
  edgeStates:       { routes: ['dashboard'], prompt: { label: '🧪 Edge state', question: 'Bagaimana layar menangani kondisi kosong, error, atau data stale (edge state)?' } },
};
