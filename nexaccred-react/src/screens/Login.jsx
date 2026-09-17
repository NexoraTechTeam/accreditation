import React, { useState } from 'react';
import { ROLES } from '../data/roles';
import { NavIcon } from '../components/icons';
import { loginAsRole } from '../api/auth';

/**
 * Prototype login. Rather than a password field that does nothing, this is an explicit
 * role picker — it makes the role-based UX the first thing a reviewer experiences.
 *
 * Behind that picker is now a REAL authenticated login against nexaccred-api
 * (POST /auth/login, using the demo credentials nexaccred-api/prisma/seed.ts
 * seeds for each role — see src/api/auth.js). The card click is real
 * authentication, not a local state toggle: a wrong/expired backend, or the
 * API being down, surfaces as a real error here instead of always "working."
 */
export default function Login({ onAuthenticated }) {
  const [pendingRoleId, setPendingRoleId] = useState(null);
  const [error, setError] = useState(null);

  const handleSelectRole = async (roleId) => {
    setError(null);
    setPendingRoleId(roleId);
    try {
      const user = await loginAsRole(roleId);
      onAuthenticated(roleId, user);
    } catch (err) {
      setError(
        err.status === 401
          ? 'Login rejected by the server — the seeded demo account may be missing. Run `npx ts-node prisma/seed.ts` in nexaccred-api.'
          : err.message || 'Could not sign in — is nexaccred-api running?',
      );
      setPendingRoleId(null);
    }
  };

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

        {error && (
          <div className="mx-auto mb-6 max-w-xl rounded-xl border border-status-redBg bg-status-redBg/40 px-4 py-3 text-center text-[13px] font-medium text-status-red">
            {error}
          </div>
        )}

        <div className="grid gap-3.5 md:grid-cols-3">
          {Object.values(ROLES).map((r) => {
            const isPending = pendingRoleId === r.id;
            return (
              <div
                key={r.id}
                onClick={() => !pendingRoleId && handleSelectRole(r.id)}
                aria-busy={isPending}
                className={`rounded-2xl border border-edge bg-white p-5 transition ${
                  pendingRoleId
                    ? 'cursor-default opacity-60'
                    : 'cursor-pointer hover:-translate-y-0.5 hover:border-brand-700 hover:shadow-lg hover:shadow-brand-700/10'
                }`}
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                  <NavIcon name={r.icon} className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-[14.5px] font-bold">{r.title}</h3>
                <div className="mb-2.5 text-[11.5px] text-ink-faint">{r.name}</div>
                <p className="mb-4 min-h-[52px] text-xs leading-relaxed text-ink-muted">{r.desc}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                  {isPending ? (
                    'Signing in…'
                  ) : (
                    <>
                      Sign in as {r.title}
                      <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-7 text-center text-xs text-ink-faint">
          Signs in against the real nexaccred-api backend, using the demo account seeded for each role.
        </p>
      </div>
    </div>
  );
}
