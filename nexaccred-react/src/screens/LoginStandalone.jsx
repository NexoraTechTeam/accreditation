import React from 'react';
import { ROLES } from '../data/roles';
import { NavIcon } from '../components/icons';

/**
 * UI/UX review build ONLY — used by src/AppStandalone.jsx, bundled into the
 * single-file HTML handed to external reviewers (see
 * vite.config.standalone.js). Same visual design as the real Login.jsx, but
 * role selection is instant local state instead of a POST /auth/login call —
 * a reviewer opening this file has no backend to authenticate against.
 *
 * This file is NOT used by the live app (src/App.jsx still imports the real
 * Login.jsx) — keeping them separate means a reviewer-facing UI shortcut can
 * never silently regress the real authenticated login flow.
 */
export default function LoginStandalone({ onSelectRole }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-subtle via-brand-50 to-ai-50 px-6 py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-9 text-center">
          <div className="mx-auto mb-4 h-11 w-11 rounded-xl bg-gradient-to-br from-brand-700 to-ai-700" />
          <h1 className="text-[27px] font-extrabold tracking-tight">NEXACCRED</h1>
          <p className="mt-1.5 text-[13.5px] italic text-ink-faint">
            "If the Accreditation Body comes tomorrow, are we ready?"
          </p>
        </div>

        <p className="mb-7 text-center text-[13.5px] text-ink-muted">
          Choose who's signing in — the app, nav, and dashboard tailor themselves to the role.
        </p>

        <div className="grid gap-3.5 md:grid-cols-3">
          {Object.values(ROLES).map((r) => (
            <div
              key={r.id}
              onClick={() => onSelectRole(r.id)}
              className="cursor-pointer rounded-2xl border border-edge bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-700 hover:shadow-lg hover:shadow-brand-700/10"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                <NavIcon name={r.icon} className="h-[18px] w-[18px]" />
              </div>
              <h3 className="text-[14.5px] font-bold">{r.title}</h3>
              <div className="mb-2.5 text-[11.5px] text-ink-faint">{r.name}</div>
              <p className="mb-4 min-h-[52px] text-xs leading-relaxed text-ink-muted">{r.desc}</p>
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                Sign in as {r.title}
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-7 text-center text-xs text-ink-faint">
          UI/UX review build — sample data, works fully offline. Switch roles anytime from the sidebar.
        </p>
      </div>
    </div>
  );
}
