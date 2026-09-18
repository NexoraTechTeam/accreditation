import React from 'react';
import { NAV, PARENT_NAV, HIDDEN_NAV_KEYS } from '../data/roles';
import { NavIcon } from './icons';
import { BAND_LABEL } from '../lib/readiness';
import { SearchIcon, SparkleIcon } from './ui';

/* ------------------------------------------------------------------ */
/* Sidebar — nav is filtered per role, and group headers only render   */
/* when at least one item under them survives the filter.              */
/* ------------------------------------------------------------------ */
export function Sidebar({ role, route, onNavigate, onSwitchRole }) {
  const activeKey = PARENT_NAV[route] || route;

  const items = [];
  let pendingGroup = null;
  NAV.forEach((item) => {
    if (item.group) {
      pendingGroup = item.group;
      return;
    }
    const visible =
      (role.all || role.routes.includes(item.key)) && !HIDDEN_NAV_KEYS.includes(item.key);
    if (!visible) return;
    if (pendingGroup) {
      items.push({ group: pendingGroup });
      pendingGroup = null;
    }
    items.push(item);
  });

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-edge bg-white pb-4 pt-4">
      <div
        onClick={() => onNavigate(role.dashboard)}
        className="mb-2.5 cursor-pointer border-b border-edge px-4 pb-4"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 shrink-0 rounded-lg bg-gradient-to-br from-brand-700 to-ai-700" />
          <span className="text-[15.5px] font-extrabold tracking-tight">NEXACCRED</span>
        </div>
        <div className="mt-2 text-[11px] italic leading-snug text-ink-faint">
          "If the Accreditation Body comes tomorrow, are we ready?"
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5">
        {items.map((item, i) =>
          item.group ? (
            <div
              key={`g${i}`}
              className="px-2.5 pb-1.5 pt-4 text-2xs font-bold uppercase tracking-[0.07em] text-ink-faint"
            >
              {item.group}
            </div>
          ) : (
            <div
              key={item.key}
              onClick={() => onNavigate(item.key === 'dashboard' ? role.dashboard : item.key)}
              className={`mb-px flex cursor-pointer items-center gap-2.5 rounded-lg border-l-2 px-2.5 py-1.5 text-[13px] transition ${
                activeKey === item.key
                  ? item.ai
                    ? 'border-ai-700 bg-ai-50 font-semibold text-ai-700'
                    : 'border-brand-700 bg-brand-50 font-semibold text-brand-700'
                  : 'border-transparent text-ink-muted hover:bg-surface-subtle hover:text-ink'
              }`}
            >
              <NavIcon name={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.synced && (
                <span
                  title="Synced from Platform Audit"
                  className="h-[5px] w-[5px] shrink-0 rounded-full bg-brand-600 opacity-70"
                />
              )}
            </div>
          )
        )}
      </nav>

      <div
        onClick={onSwitchRole}
        title="Switch role"
        className="mt-2.5 flex cursor-pointer items-center gap-2.5 border-t border-edge px-4 pt-3.5"
      >
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-ai-700 text-[11px] font-semibold text-white">
          {role.initials}
        </div>
        <div className="text-xs">
          <b className="block font-semibold">{role.name}</b>
          <span className="text-[11px] text-ink-faint">{role.title}</span>
        </div>
        <svg viewBox="0 0 16 16" className="ml-auto h-3 w-3 shrink-0 text-ink-faint" fill="none">
          <path d="M5 3 10 8 5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </aside>
  );
}

export function TopBar({ onNavigate }) {
  return (
    <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-edge bg-white/85 px-6 backdrop-blur">
      <div className="flex max-w-md flex-1 items-center gap-2 rounded-[10px] border border-transparent bg-surface-subtle px-3 py-2.5 text-[13px] text-ink-faint transition hover:border-edge-strong hover:bg-white">
        <SearchIcon className="h-3.5 w-3.5 shrink-0" />
        Search requirements, evidence, personnel, findings…
      </div>
      <div className="flex cursor-pointer items-center gap-2 rounded-[9px] border border-edge px-3 py-2 text-[13px]">
        Scope: <b className="font-semibold">All Accreditations</b>
      </div>
      <div className="flex-1" />
      {/* Ask AI hidden: superseded by the floating AI Assistant widget
          (src/widget/) — kept mounted=false instead of deleted so the
          ai-assistant route stays reachable; remove entirely once the
          widget rollout is confirmed. */}
      <div
        onClick={() => onNavigate('ai-assistant')}
        className="hidden cursor-pointer items-center gap-1.5 rounded-lg border border-ai-100 bg-ai-50 px-3 py-2 text-[12.5px] font-semibold text-ai-700"
      >
        <SparkleIcon className="h-3.5 w-3.5" />
        Ask AI
      </div>
    </div>
  );
}

const STRIP_BORDER = {
  green: 'border-l-status-green',
  yellow: 'border-l-status-yellow',
  orange: 'border-l-status-orange',
  red: 'border-l-status-red',
};
const STRIP_DOT = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  orange: 'bg-status-orange',
  red: 'bg-status-red',
};

/**
 * Always-visible readiness strip. The core answer to the product's central question
 * should never be more than a glance away, from any screen.
 *
 * `overall` is now fetched from nexaccred-api's readiness engine
 * (GET /readiness/overall) rather than recomputed client-side — see App.jsx.
 * `loading`/`error` cover the fetch's own lifecycle so this bar never
 * silently renders stale or wrong data while the request is in flight.
 */
export function ReadinessStrip({ overall, nextUp, criticalTotal, onNavigate, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2.5 border-b border-l-[3px] border-edge border-l-transparent bg-surface-subtle px-6 py-2 text-[12.5px] text-ink-faint">
        Loading readiness…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2.5 border-b border-l-[3px] border-edge border-l-status-red bg-surface-subtle px-6 py-2 text-[12.5px] text-ink-muted">
        <span className="h-2 w-2 rounded-full bg-status-red" />
        Readiness unavailable — {error.body?.message || error.message}
      </div>
    );
  }
  return (
    <div
      className={`flex items-center gap-2.5 border-b border-l-[3px] border-edge bg-surface-subtle px-6 py-2 text-[12.5px] text-ink-muted ${STRIP_BORDER[overall.band]}`}
    >
      <span className={`h-2 w-2 rounded-full ${STRIP_DOT[overall.band]}`} />
      Overall Accreditation Readiness:{' '}
      <b className="font-bold text-ink">
        {overall.score}% — {BAND_LABEL[overall.band].toUpperCase()}
      </b>
      <span className="text-ink-faint">·</span>
      Next AB assessment in{' '}
      <b className="font-bold text-ink">
        {nextUp ? `${nextUp.days} days (${nextUp.name})` : 'not scheduled'}
      </b>
      <span className="text-ink-faint">·</span>
      <span>
        {criticalTotal} critical issue{criticalTotal === 1 ? '' : 's'} open
      </span>
      <span
        onClick={() => onNavigate('readiness')}
        className="ml-auto cursor-pointer font-semibold text-brand-700 hover:underline"
      >
        View full readiness →
      </span>
    </div>
  );
}
