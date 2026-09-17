import React from 'react';
import { Badge } from './ui';
import { BAND_LABEL, barColor, computeReadiness } from '../lib/readiness';

/**
 * Scheme card used on the Dashboard, Accreditation Scope, and Readiness screens.
 * Draft schemes render distinctly — dashed border, no score — because showing 0%
 * would misrepresent a scheme that simply isn't configured yet.
 */
export default function SchemeCard({ schemeKey, ctx, onNavigate }) {
  const { schemes, abName, weights, thresholds } = ctx;
  const s = schemes[schemeKey];

  if (s.badge === 'draft') {
    return (
      <div
        onClick={() => onNavigate('scheme-wizard', schemeKey)}
        className="cursor-pointer rounded-[9px] border border-dashed border-edge bg-surface-subtle p-3.5 transition hover:border-edge-strong"
      >
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="text-[13.5px] font-semibold">{s.name}</span>
            <span className="mt-px block text-2xs text-ink-faint">
              {abName(s.ab)} · {s.stds[0] || 'Standard not yet set'}
            </span>
          </div>
          <Badge level="gray">Draft</Badge>
        </div>
        <p className="mb-2.5 text-[11.5px] leading-relaxed text-ink-faint">
          Registered — configuration in progress. Requirements, evidence, and personnel links
          aren't wired yet, so no readiness score is computed.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-ink-faint">Setup in progress</span>
          <span className="text-[11.5px] font-medium text-brand-700">Continue setup →</span>
        </div>
      </div>
    );
  }

  const r = computeReadiness(schemeKey, schemes, weights, thresholds);
  const trendClass = s.trend.includes('▼')
    ? 'text-status-red'
    : s.trend.includes('▲')
    ? 'text-status-green'
    : 'text-ink-faint';

  return (
    <div
      onClick={() => onNavigate('scheme-detail', schemeKey)}
      className="cursor-pointer rounded-[9px] border border-edge bg-white p-3.5 transition hover:-translate-y-px hover:border-edge-strong"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[13.5px] font-semibold">{s.name}</span>
          <span className="mt-px block truncate text-2xs text-ink-faint">
            {abName(s.ab)} · {s.stds[0]}
          </span>
        </div>
        <Badge level={r.band}>{BAND_LABEL[r.band]}</Badge>
      </div>
      <div className="mb-1.5 h-1.5 overflow-hidden rounded-sm bg-surface-subtle">
        <div
          className="h-full rounded-sm transition-all"
          style={{ width: `${r.score}%`, background: barColor(r.score) }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold">{r.score}%</span>
        <span className={`text-[11px] ${trendClass}`}>
          {s.trend.replace('since last week', 'wk')}
        </span>
      </div>
    </div>
  );
}
