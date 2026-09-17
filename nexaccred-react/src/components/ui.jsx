import React from 'react';
import { barColor } from '../lib/readiness';

/* ------------------------------------------------------------------ */
/* Status badge — the single source of truth for status colour in the  */
/* app. Every status anywhere routes through here.                     */
/* ------------------------------------------------------------------ */
const BADGE_STYLES = {
  green: 'bg-status-greenBg text-status-green',
  yellow: 'bg-status-yellowBg text-status-yellow',
  orange: 'bg-status-orangeBg text-status-orange',
  red: 'bg-status-redBg text-status-red',
  gray: 'bg-status-grayBg text-status-gray',
};
const DOT_STYLES = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  orange: 'bg-status-orange',
  red: 'bg-status-red',
  gray: 'bg-status-gray',
};

export function Badge({ level = 'gray', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold whitespace-nowrap ${BADGE_STYLES[level]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[level]}`} />
      {children}
    </span>
  );
}

export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-edge bg-surface p-5 ${
        onClick ? 'cursor-pointer transition hover:border-edge-strong' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHead({ title, action, onAction }) {
  return (
    <div className="mb-3.5 flex items-center justify-between">
      <h2 className="text-[14.5px] font-bold">{title}</h2>
      {action && (
        <span
          onClick={onAction}
          className="cursor-pointer text-xs font-medium text-brand-700 hover:underline"
        >
          {action}
        </span>
      )}
    </div>
  );
}

export function SectionLabel({ children, className = '' }) {
  return (
    <div
      className={`mb-2.5 mt-6 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHead({ crumbs = [], title, sub, actions, onNavigate }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-5">
      <div>
        {crumbs.length > 0 && (
          <div className="mb-1.5 text-xs text-ink-faint">
            {crumbs.map((c, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1 opacity-60">/</span>}
                {c.route ? (
                  <span
                    className="cursor-pointer hover:text-brand-700"
                    onClick={() => onNavigate?.(c.route)}
                  >
                    {c.label}
                  </span>
                ) : (
                  <span className="text-ink-muted">{c.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
        {title && <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>}
        {sub && <p className="mt-1 max-w-2xl text-[13px] text-ink-muted">{sub}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Button({ variant = 'ghost', children, onClick, className = '' }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12.5px] cursor-pointer transition';
  const styles = {
    primary: 'bg-brand-700 font-semibold text-white hover:bg-brand-600',
    ghost:
      'border border-edge bg-white font-medium text-ink-muted hover:border-edge-strong hover:text-ink',
  };
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* DataTable — column-driven so every list screen shares one component */
/* ------------------------------------------------------------------ */
export function DataTable({ columns, rows, onRowClick }) {
  const renderCell = (col, row) => {
    const v = row[col.key];
    switch (col.type) {
      case 'badge':
        return <Badge level={v.level}>{v.label}</Badge>;
      case 'mono':
        return <span className="text-xs text-ink-muted">{v}</span>;
      case 'bar':
        if (v == null)
          return <span className="text-xs text-ink-faint">Setup in progress</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-sm bg-surface-subtle">
              <div
                className="h-full rounded-sm"
                style={{ width: `${v}%`, background: barColor(v) }}
              />
            </div>
            <span className="w-8 text-xs">{v}%</span>
          </div>
        );
      case 'perm':
        return (
          <span
            className={`inline-block rounded px-2 py-0.5 text-2xs font-semibold ${v.bg} ${v.ink}`}
          >
            {v.label}
          </span>
        );
      case 'node':
        return v;
      default:
        return v;
    }
  };

  return (
    <div className="overflow-auto rounded-xl border border-edge bg-surface">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className="whitespace-nowrap border-b border-edge bg-surface-subtle px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint first:pl-4 last:pr-4"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => row.__nav && onRowClick?.(row.__nav[0], row.__nav[1])}
              className={`border-b border-edge last:border-0 ${
                row.__nav ? 'cursor-pointer hover:bg-surface-subtle' : ''
              }`}
            >
              {columns.map((c) => (
                <td key={c.key} className="px-3.5 py-2.5 align-middle first:pl-4 last:pr-4">
                  {renderCell(c, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Toolbar({ placeholder = 'Search…' }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <div className="flex max-w-xs flex-1 items-center gap-1.5 rounded-lg border border-edge bg-white px-2.5 py-2 text-[12.5px] text-ink-faint">
        <SearchIcon className="h-3.5 w-3.5" />
        {placeholder}
      </div>
      <div className="cursor-pointer rounded-lg border border-edge bg-white px-2.5 py-2 text-[12.5px] text-ink-muted">
        Filter ▾
      </div>
      <div className="cursor-pointer rounded-lg border border-edge bg-white px-2.5 py-2 text-[12.5px] text-ink-muted">
        Sort ▾
      </div>
    </div>
  );
}

export function StatRow({ items }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={i}
          onClick={it.onClick}
          className={`rounded-xl border border-edge bg-white px-4 py-3.5 ${
            it.onClick ? 'cursor-pointer hover:border-edge-strong' : ''
          }`}
        >
          <div className={`text-2xl font-extrabold ${it.color || ''}`}>{it.n}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">{it.l}</div>
          {it.delta && <div className="text-[11px] text-ink-faint">{it.delta}</div>}
        </div>
      ))}
    </div>
  );
}

const SEV_BAR = {
  red: 'bg-status-red',
  orange: 'bg-status-orange',
  yellow: 'bg-status-yellow',
};

/** The one shape used for every gap, risk, finding and issue list in the app. */
export function GapList({ items, empty = 'Nothing here right now.' }) {
  if (!items?.length)
    return <div className="py-6 text-center text-[12.5px] text-ink-faint">{empty}</div>;
  return (
    <div>
      {items.map((i, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3.5 border-b border-edge py-3 last:border-0"
        >
          <div className={`min-h-[34px] w-1 shrink-0 self-stretch rounded ${SEV_BAR[i.sev]}`} />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 text-[13.5px] font-medium">{i.t}</div>
            <div className="text-[11.5px] text-ink-faint">{i.m}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilterChips({ options, active, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
            active === o.key
              ? 'border-brand-700 bg-brand-700 text-white'
              : 'border-edge bg-white text-ink-muted hover:border-edge-strong hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap border-b border-edge px-4">
      {tabs.map((t) => (
        <div
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`mr-6 flex cursor-pointer items-center gap-1.5 border-b-2 py-3.5 text-[13px] ${
            active === t.key
              ? 'border-brand-700 font-semibold text-ink'
              : 'border-transparent font-medium text-ink-faint'
          }`}
        >
          {t.label}
          <span className="rounded-full bg-surface-subtle px-1.5 text-2xs text-ink-muted">
            {t.count}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Marks a screen whose data is owned by an external system of record. */
export function IntegrationBanner({ domain }) {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-muted">
      <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
      <div>
        <b className="text-brand-700">Synced from Platform Audit.</b> {domain} is the system
        of record over there — NexAccred consumes it read-only so the readiness engine can
        reference it. <span className="text-ink-faint">Last synced 12 minutes ago</span>
      </div>
      <span className="ml-auto shrink-0 cursor-pointer font-semibold text-brand-700 hover:underline">
        Open in Platform Audit ↗
      </span>
    </div>
  );
}

export function Note({ children, tone = 'brand' }) {
  const tones = {
    brand: 'border-brand-100 bg-brand-50',
    orange: 'border-status-orangeBg bg-status-orangeBg',
    ai: 'border-ai-100 bg-ai-50',
  };
  return (
    <div
      className={`mb-4 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-muted ${tones[tone]}`}
    >
      {children}
    </div>
  );
}

export function FormField({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</label>
      {children}
      {hint && <div className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">{hint}</div>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-edge bg-white px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-brand-700 focus:ring-[3px] focus:ring-brand-50';

/* ---------------------------- icons ---------------------------- */
export const SearchIcon = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

export const LinkIcon = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path
      d="M6.5 9.5 9.5 6.5M6 4.5 7.5 3a2.5 2.5 0 0 1 3.5 3.5L9.5 8M10 11.5 8.5 13A2.5 2.5 0 0 1 5 9.5L6.5 8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export const PlusIcon = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const SparkleIcon = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path
      d="M8 1.5c-2.2 0-4 1.7-4 4 0 1.5.8 2.5 1.5 3.3.4.5.7 1 .7 1.7v.5h3.6v-.5c0-.7.3-1.2.7-1.7.7-.8 1.5-1.8 1.5-3.3 0-2.3-1.8-4-4-4Z"
      stroke="currentColor"
      strokeWidth="1.3"
    />
  </svg>
);
