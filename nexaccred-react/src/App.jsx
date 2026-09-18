import React, { useEffect, useMemo, useState } from 'react';
import { Sidebar, TopBar, ReadinessStrip } from './components/layout';
import { ROLES, ROLE_NAME_TO_ID } from './data/roles';
import {
  initialAccreditationBodies, initialSchemes, initialSchemeOrder, PILLARS,
} from './data/schemes';
import * as D from './data/records';
import {
  DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS,
} from './lib/readiness';
import { getStoredUser, setUnauthorizedHandler } from './api/client';
import { logout } from './api/auth';
import { hasPermission } from './api/permissions';
import { useFetch } from './hooks/useFetch';
import { renderScreen } from './screenRegistry';
import { ReadinessWidget, buildContext, PROJECT_ID } from './widget';

import Login from './screens/Login';

export default function App() {
  /* --- session ---
   * roleId is now derived from a real backend session (JWT in localStorage,
   * see src/api/client.js), restored on mount so a page refresh doesn't
   * bounce an authenticated user back to the login screen. */
  const storedUser = getStoredUser();
  const [roleId, setRoleId] = useState(
    storedUser ? ROLE_NAME_TO_ID[storedUser.roleName] ?? null : null
  );
  // Holds the backend's `user.permissions` (Requirements/Evidence/Personnel/
  // FindingsCAPA/Reporting/Administration → NoAccess|View|Edit|Approve) —
  // the same facts signed into the JWT itself. Used ONLY to decide whether
  // to render a gated section at all (src/api/permissions.js); the backend's
  // PermissionsGuard remains the actual enforcement.
  const [currentUser, setCurrentUser] = useState(storedUser);
  // Mirrors the fix in components/layout.jsx's Sidebar (the 'dashboard' nav
  // item resolves to role.dashboard, not the literal string) — on a restored
  // session the initial route needs the same resolution, or every role
  // lands on the Head's Executive Dashboard after a page refresh regardless
  // of who they are.
  const initialRoleId = storedUser ? ROLE_NAME_TO_ID[storedUser.roleName] ?? null : null;
  const [route, setRoute] = useState(initialRoleId ? ROLES[initialRoleId].dashboard : 'dashboard');
  const [param, setParam] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');

  useEffect(() => {
    // A 401 from any API call (expired/invalid token) drops the session —
    // registered once; see src/api/client.js's setUnauthorizedHandler.
    setUnauthorizedHandler(() => {
      logout();
      setCurrentUser(null);
      setRoleId(null);
    });
  }, []);

  /* --- domain state (would be server-backed in production) ---
   * Schemes/AccreditationBodies/Standards/Requirements/Documents/Tasks below
   * are still nexaccred-react's original local sample data — the rich
   * per-scheme narrative (tabs.critical, evidence bullets, witness detail)
   * hasn't been ported to the backend's normalized schema yet. What HAS
   * moved to the real backend is the thing the product is actually about:
   * the readiness SCORE itself (see `overall`/`upcoming` below) — computed
   * server-side by nexaccred-api's readiness engine from real seeded pillar
   * scores, witness cycles, and findings, not recomputed here. See
   * nexaccred-api/README.md "what's deliberately not built yet" for the
   * rest of the migration this leaves for later. */
  const [accreditationBodies, setAccreditationBodies] = useState(initialAccreditationBodies);
  const [schemes, setSchemes] = useState(initialSchemes);
  const [schemeOrder, setSchemeOrder] = useState(initialSchemeOrder);
  const [standards, setStandards] = useState(D.initialStandards);
  const [requirements, setRequirements] = useState(D.initialRequirements);
  const [docRows, setDocRows] = useState(D.initialDocRows);
  const [requiredDocTypes, setRequiredDocTypes] = useState(D.initialRequiredDocTypes);
  const [tasks] = useState(D.initialTasks);

  /* --- readiness configuration (editable in the Methodology screen) --- */
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const role = roleId ? ROLES[roleId] : null;

  const abName = (id) => accreditationBodies.find((a) => a.id === id)?.name || '—';

  /* Readiness lives under the Requirements RBAC domain on the backend
   * (SchemesController — see nexaccred-api README's "Bounded contexts"
   * table). A role with NoAccess there (Impartiality Committee, System
   * Administrator — RBAC §2) is not merely denied the number, it never sees
   * the readiness strip AT ALL: fetching it anyway just to catch the 403
   * would mean asking the backend for something this role has no business
   * requesting, and showing an error box in its place would still be
   * announcing "there IS a readiness score, you're just not allowed to see
   * it" — the RBAC doc's point about the Impartiality Committee having "no
   * operational stake in what it reviews" (§3.2) argues for silence, not a
   * visible-but-blocked widget. `canViewReadiness` decides render-at-all;
   * the fetch that follows can THEN fail for a genuinely operational reason
   * (backend down, 500) and the strip's existing error branch handles that
   * case for authorized users only. */
  const canViewReadiness = currentUser ? hasPermission(currentUser, 'Requirements', 'View') : false;

  /* Readiness now comes straight from nexaccred-api — GET /readiness/overall
   * and GET /readiness/upcoming-assessments — rather than being recomputed
   * from local state. Backed by the exact same algorithm (the engine was
   * ported 1:1 into the backend), but the backend's copy is now the single
   * source of truth: it reads live pillar scores, open critical findings,
   * and witness cycles from the database instead of this component's props. */
  const {
    data: overallData,
    loading: overallLoading,
    error: overallError,
  } = useFetch(role && canViewReadiness ? '/readiness/overall' : null);
  const { data: upcomingRaw } = useFetch(role && canViewReadiness ? '/readiness/upcoming-assessments' : null);

  const overall = overallData || { score: 0, band: 'red' };
  const upcoming = useMemo(
    () => (upcomingRaw || []).map((u) => ({ ...u, name: u.schemeName, days: u.daysUntil })),
    [upcomingRaw]
  );

  const navigate = (r, p = null) => {
    setRoute(r);
    setParam(p);
    if (r === 'tasks' && p) setTaskFilter(p);
    window.scrollTo(0, 0);
  };

  const ctx = {
    schemes, schemeOrder, accreditationBodies, standards, requirements, docRows,
    requiredDocTypes, tasks, abName, weights, thresholds, setWeights, setThresholds,
    overall, upcoming,
    addAccreditationBody: (ab) => setAccreditationBodies((p) => [...p, ab]),
    addStandard: (s) => setStandards((p) => [...p, s]),
    addRequirement: (r) => setRequirements((p) => [...p, r]),
    addRequiredDocType: (d) => setRequiredDocTypes((p) => [...p, d]),
    addScheme: (id, s) => {
      setSchemes((p) => ({ ...p, [id]: s }));
      setSchemeOrder((p) => [...p, id]);
    },
    activateScheme: (id) => {
      setSchemes((p) => ({
        ...p,
        [id]: {
          ...p[id],
          badge: 'active',
          trend: '— since last week',
          pillars: Object.fromEntries(PILLARS.map((x) => [x, 75])),
        },
      }));
      navigate('scheme-detail', id);
    },
  };

  if (!role) {
    return (
      <>
        <Login
          onAuthenticated={(id, user) => {
            setCurrentUser(user);
            setRoleId(id);
            navigate(ROLES[id].dashboard);
          }}
        />
        {/* Widget visible pre-login too (reviewer unattributed until sign-in),
            mirroring the reference prototype's always-on launcher. */}
        <ReadinessWidget
          project={PROJECT_ID}
          context={buildContext({ environment: 'review', role: null, route: 'login', currentUser })}
        />
      </>
    );
  }

  const activeSchemes = schemeOrder.filter((k) => schemes[k].badge !== 'draft');
  const criticalTotal = activeSchemes.reduce((a, k) => a + schemes[k].tabs.critical.length, 0);
  const nextUp = upcoming.find((u) => u.date);

  /* Requirement Readiness AI Assistant (experiment, Phase 1): floating
   * review widget. Host-context contract — project, env, prototype version,
   * route/screen, reviewer — rebuilt every render so Ask/Findings/Session
   * always reflect the screen under review. Evidence persists to
   * localStorage keyed by project; see src/widget/. */
  const readinessCtx = buildContext({ role, route, param, currentUser, weights });

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        route={route}
        onNavigate={navigate}
        onSwitchRole={() => {
          logout();
          setCurrentUser(null);
          setRoleId(null);
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onNavigate={navigate} />
        {canViewReadiness && (
          <ReadinessStrip
            overall={overall}
            nextUp={nextUp}
            criticalTotal={criticalTotal}
            onNavigate={navigate}
            loading={overallLoading}
            error={overallError}
          />
        )}
        <main className="max-w-[1360px] px-8 pb-16 pt-6">
          {renderScreen({ route, param, ctx, navigate, taskFilter, setTaskFilter })}
        </main>
      </div>
      <ReadinessWidget project={PROJECT_ID} context={readinessCtx} />
    </div>
  );
}
