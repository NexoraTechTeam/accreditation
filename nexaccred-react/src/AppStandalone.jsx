import React, { useState } from 'react';
import { Sidebar, TopBar, ReadinessStrip } from './components/layout';
import { ROLES } from './data/roles';
import {
  initialAccreditationBodies, initialSchemes, initialSchemeOrder, PILLARS,
} from './data/schemes';
import * as D from './data/records';
import {
  DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, computeOverallReadiness, getUpcomingAssessments,
} from './lib/readiness';
import { renderScreen } from './screenRegistry';

import LoginStandalone from './screens/LoginStandalone';
import { ReadinessWidget, buildContext, PROJECT_ID } from './widget';

/**
 * UI/UX REVIEW BUILD — bundled by vite.config.standalone.js into one
 * self-contained HTML file (npm run build:standalone) for handing to
 * external reviewers who have no backend to run. NOT the live app: that's
 * src/App.jsx, which authenticates for real against nexaccred-api and
 * fetches real readiness data — see its own file comment.
 *
 * Every screen component and all sample data here is the exact same source
 * the live app uses (data/schemes.js, data/records.js, screens/*, screenRegistry.js)
 * — only session handling and the readiness numbers are local instead of
 * fetched, so what a reviewer sees is faithful to the real UI, not a
 * separate mockup that can drift from it.
 *
 * Deliberately kept in sync with one real, RBAC-relevant behavior: which
 * roles see the readiness strip at all. The live app derives that from the
 * backend's JWT-embedded permissions (src/api/permissions.js); this build
 * has no backend to ask, so REQUIREMENTS_ACCESS below is a hand-copied
 * mirror of 05-RBAC-Separation-of-Duties.md §2's Requirements column for
 * the 6 roles this prototype implements. If that matrix changes, update
 * both this map and nexaccred-api/prisma/seed.ts's ROLE_PERMISSIONS.
 */
const REQUIREMENTS_ACCESS = {
  head: true, // Edit
  auditor: true, // View
  impartiality: false, // NoAccess
  staff: true, // Edit
  doccontrol: true, // View
  admin: false, // NoAccess
};

export default function AppStandalone() {
  const [roleId, setRoleId] = useState(null);
  const [route, setRoute] = useState('dashboard');
  const [param, setParam] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');

  const [accreditationBodies, setAccreditationBodies] = useState(initialAccreditationBodies);
  const [schemes, setSchemes] = useState(initialSchemes);
  const [schemeOrder, setSchemeOrder] = useState(initialSchemeOrder);
  const [standards, setStandards] = useState(D.initialStandards);
  const [requirements, setRequirements] = useState(D.initialRequirements);
  const [docRows, setDocRows] = useState(D.initialDocRows);
  const [requiredDocTypes, setRequiredDocTypes] = useState(D.initialRequiredDocTypes);
  const [tasks] = useState(D.initialTasks);

  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);

  const role = roleId ? ROLES[roleId] : null;
  const canViewReadiness = roleId ? REQUIREMENTS_ACCESS[roleId] : false;

  const abName = (id) => accreditationBodies.find((a) => a.id === id)?.name || '—';

  const overall = computeOverallReadiness(schemes, schemeOrder, weights, thresholds);
  const upcoming = getUpcomingAssessments(schemes, schemeOrder, weights, thresholds);

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
        <LoginStandalone
          onSelectRole={(id) => {
            setRoleId(id);
            navigate(ROLES[id].dashboard);
          }}
        />
        <ReadinessWidget
          project={PROJECT_ID}
          context={buildContext({ environment: 'review-standalone', role: null, route: 'login' })}
        />
      </>
    );
  }

  const activeSchemes = schemeOrder.filter((k) => schemes[k].badge !== 'draft');
  const criticalTotal = activeSchemes.reduce((a, k) => a + schemes[k].tabs.critical.length, 0);
  const nextUp = upcoming.find((u) => u.date);

  /* Requirement Readiness AI Assistant (experiment, Phase 1) — same widget
   * as the live app; reviewer identity comes from the local role picker
   * (no backend session in the standalone review build). */
  const readinessCtx = buildContext({ environment: 'review-standalone', role, route, param, weights });

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        route={route}
        onNavigate={navigate}
        onSwitchRole={() => setRoleId(null)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onNavigate={navigate} />
        {canViewReadiness && (
          <ReadinessStrip
            overall={overall}
            nextUp={nextUp}
            criticalTotal={criticalTotal}
            onNavigate={navigate}
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
