/**
 * Readiness Widget — evidence store (framework-agnostic, vanilla JS).
 *
 * Auditability comes from STORED EVENTS + HUMAN DECISIONS, never from AI
 * opinion (docs/widget-readiness-ai-assistant.md §6). Everything the widget
 * records lands in localStorage under a versioned key so a review session
 * survives refresh and stays attributable to one prototype version.
 *
 * Stored shapes:
 * - session  { id, project, environment, prototypeVersion, reviewer, startedAt }
 * - messages [{ id, from: 'reviewer'|'assistant', text, sources[], classification, route, screen, at }]
 * - findings [{ id, question, aiResponse, sources[], classification, severity,
 *               status, route, screen, param, prototypeVersion, reviewer,
 *               owner, decision, decidedBy, decidedAt, resultingVersion, at }]
 * - events   [{ id, type, actor, payload, at }]
 * - signoff  { status: PENDING|APPROVED|APPROVED_WITH_EXCEPTIONS|REJECTED,
 *               version, by, role, note, at }
 *
 * Finding status lifecycle (human-only transitions):
 *   open → accepted | rejected | superseded
 * AI may SUGGEST a status; only a human writes it.
 */

const PREFIX = 'nexreadiness';

const hasStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const uid = (p) =>
  `${p}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

const now = () => new Date().toISOString();

export const FINDING_STATUSES = ['open', 'accepted', 'rejected', 'superseded'];
export const SIGNOFF_STATUSES = [
  'PENDING',
  'APPROVED',
  'APPROVED_WITH_EXCEPTIONS',
  'REJECTED',
];
export const SEVERITIES = ['blocker', 'major', 'minor', 'info'];

/**
 * Mandatory review areas (mirrors the reference prototype's gate checklist).
 * Gate passes only at 100% coverage AND zero open blockers.
 */
export const CHECK_AREAS = [
  ['roleAccess', 'Role selection & persona access', 'Sign-in persona, role switching, initial access boundaries.'],
  ['readinessFormula', 'Readiness score & calculation', 'Formula, weighting, data source, refresh, explainability.'],
  ['scope', 'Accreditation scope statuses', 'Scheme/body mappings, thresholds, trends, drill-down.'],
  ['nextAssessment', 'Next assessment rules', 'Schedule, countdown, threshold, reminders, escalation.'],
  ['criticalIssues', 'Critical/Major issues', 'Severity rules, ownership, due dates, blocking behavior.'],
  ['personnel', 'Personnel & competence', 'Competency evidence, expiry, qualification, risk.'],
  ['evidence', 'Documents & evidence', 'Source docs, completeness, versioning, traceability.'],
  ['permissions', 'RBAC & segregation of duties', 'Menu/action permissions, impartiality independence.'],
  ['edgeStates', 'Empty/error/edge states', 'No-data, stale data, API failure, expired evidence.'],
];
const DEFAULT_CHECKS = Object.fromEntries(CHECK_AREAS.map(([k]) => [k, false]));

export function createStore(project, { environment = 'review', prototypeVersion = 'unspecified' } = {}) {
  const key = (part) => `${PREFIX}:${project}:${part}`;
  const listeners = new Set();
  // In-memory mirror: source of truth when localStorage is unavailable
  // (Node tests, private mode) and write-through cache otherwise.
  const mem = { session: null, messages: [], findings: [], events: [], signoff: { status: 'PENDING' }, checks: { ...DEFAULT_CHECKS } };
  // Cached snapshot: useSyncExternalStore INFINITE-LOOPS (blank page) if
  // getSnapshot() returns a new object on every call — hence this cache,
  // invalidated only on write.
  let cache = null;
  const notify = () => listeners.forEach((fn) => { try { fn(); } catch { /* noop */ } });

  // Hydrate memory once from localStorage (previous tab sessions);
  // after that, memory is freshest — every write updates both.
  let hydrated = false;
  const hydrate = () => {
    if (hydrated || !hasStorage()) return;
    hydrated = true;
    for (const part of Object.keys(mem)) {
      try {
        const raw = window.localStorage.getItem(key(part));
        if (raw) mem[part] = JSON.parse(raw);
      } catch { /* keep memory default */ }
    }
  };

  const read = (part, fallback) => {
    hydrate();
    return mem[part] ?? fallback;
  };
  const write = (part, value) => {
    mem[part] = value;
    if (hasStorage()) {
      try { window.localStorage.setItem(key(part), JSON.stringify(value)); } catch { /* quota */ }
    }
    cache = null;
    notify();
  };

  const getSession = () => read('session', null);
  const getMessages = () => read('messages', []);
  const getFindings = () => read('findings', []);
  const getEvents = () => read('events', []);
  const getSignoff = () => read('signoff', { status: 'PENDING' });
  const getChecks = () => ({ ...DEFAULT_CHECKS, ...read('checks', {}) });

  /** Gate math (reference parity): coverage 100% + zero OPEN blockers. */
  const readiness = () => {
    const checks = getChecks();
    const vals = Object.values(checks);
    const done = vals.filter(Boolean).length;
    const blockers = getFindings().filter((f) => f.blocking && f.status === 'open').length;
    const percent = Math.round((done / vals.length) * 100);
    return { done, total: vals.length, percent, blockers, ready: percent === 100 && blockers === 0 };
  };

  const appendEvent = (type, actor, payload = {}) => {
    const events = getEvents();
    events.push({ id: uid('ev'), type, actor, payload, at: now() });
    write('events', events);
  };

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot() {
      if (!cache) {
        cache = {
          session: getSession(),
          messages: getMessages(),
          findings: getFindings(),
          events: getEvents(),
          signoff: getSignoff(),
          checks: getChecks(),
          gate: readiness(),
        };
      }
      return cache;
    },

    startSession(reviewer) {
      let session = getSession();
      if (!session) {
        session = {
          id: uid('rs'),
          project,
          environment,
          prototypeVersion,
          reviewer,
          startedAt: now(),
        };
        write('session', session);
        appendEvent('session.started', reviewer?.name || 'unknown', {
          role: reviewer?.role,
          prototypeVersion,
        });
      }
      return getSession();
    },

    trackRoute(route, screen, reviewer) {
      appendEvent('route.viewed', reviewer?.name || 'unknown', { route, screen });
    },

    addMessage({ from, text, sources = [], classification = null, route = null, screen = null, reviewer = null }) {
      const messages = getMessages();
      const msg = {
        id: uid('m'), from, text, sources, classification,
        route, screen, reviewer: reviewer?.name || null, at: now(),
      };
      messages.push(msg);
      write('messages', messages);
      appendEvent(from === 'reviewer' ? 'question.asked' : 'answer.given', reviewer?.name || 'unknown', {
        classification, route, screen, messageId: msg.id,
      });
      return msg;
    },

    addFinding(finding) {
      const findings = getFindings();
      const n = findings.length + 1;
      const item = {
        id: `F-${String(n).padStart(3, '0')}`,
        title: '',
        status: 'open',
        severity: 'major',
        blocking: false,
        owner: '',
        decision: '',
        decidedBy: '',
        decidedAt: null,
        resultingVersion: '',
        at: now(),
        ...finding,
      };
      findings.push(item);
      write('findings', findings);
      appendEvent('finding.recorded', finding?.reviewer || 'unknown', {
        findingId: item.id, classification: item.classification, severity: item.severity,
        blocking: item.blocking,
      });
      return item;
    },

    setCheck(areaKey, value, reviewer) {
      const checks = { ...getChecks(), [areaKey]: !!value };
      write('checks', checks);
      appendEvent('reviewarea.checked', reviewer || 'unknown', { area: areaKey, value: !!value });
      return checks;
    },

    /** Human triage — the ONLY writer of finding decisions. */
    decideFinding(id, { status, decision, decidedBy, resultingVersion = '' }) {
      if (!FINDING_STATUSES.includes(status)) throw new Error(`unknown status: ${status}`);
      const findings = getFindings().map((f) =>
        f.id === id
          ? { ...f, status, decision, decidedBy, decidedAt: now(), resultingVersion }
          : f
      );
      write('findings', findings);
      appendEvent('finding.decided', decidedBy || 'unknown', { findingId: id, status, decision });
      return findings.find((f) => f.id === id);
    },

    /**
     * Explicit human sign-off against ONE prototype version.
     * Refuses with { ok:false } unless the gate passes — the widget never
     * lets a click quietly approve an unready baseline.
     */
    signOff({ status, by, role, note = '', version }) {
      if (!SIGNOFF_STATUSES.includes(status)) throw new Error(`unknown signoff: ${status}`);
      const gate = readiness();
      if (!gate.ready) {
        return { ok: false, gate, reason: `coverage ${gate.percent}%, ${gate.blockers} open blocker(s)` };
      }
      const record = { status, by, role, note, version, at: now() };
      write('signoff', record);
      appendEvent('baseline.signoff', by || 'unknown', { status, version, role, note });
      return { ok: true, record, gate };
    },

    readiness,

    /** Clear all evidence (review reset). Human-initiated only. */
    reset(reviewedBy) {
      for (const part of Object.keys(mem)) {
        if (hasStorage()) {
          try { window.localStorage.removeItem(key(part)); } catch { /* noop */ }
        }
      }
      mem.session = null;
      mem.messages = [];
      mem.findings = [];
      mem.events = [];
      mem.signoff = { status: 'PENDING' };
      mem.checks = { ...DEFAULT_CHECKS };
      cache = null;
      notify();
      appendEvent('session.reset', reviewedBy || 'unknown', {});
    },

    exportSession() {      return {
        exportedAt: now(),
        project,
        environment,
        prototypeVersion,
        session: getSession(),
        messages: getMessages(),
        findings: getFindings(),
        events: getEvents(),
        signoff: getSignoff(),
        checks: getChecks(),
        gate: readiness(),
      };
    },
  };
}
