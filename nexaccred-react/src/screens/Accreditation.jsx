import React, { useState } from 'react';
import SchemeCard from '../components/SchemeCard';
import {
  Badge, Button, Card, DataTable, GapList, Note, PageHead, SectionLabel, Tabs, PlusIcon,
} from '../components/ui';
import { BAND_LABEL, BAND_TEXT, barColor, computeReadiness } from '../lib/readiness';
import { PILLARS } from '../data/schemes';

/* ------------------------------------------------------------------ */
/* Scheme detail — the readiness drill-down                            */
/* ------------------------------------------------------------------ */
export function SchemeDetail({ schemeKey, ctx, onNavigate }) {
  const { schemes, abName, weights, thresholds } = ctx;
  const key = schemes[schemeKey] ? schemeKey : 'iso27001';
  const s = schemes[key];
  const r = computeReadiness(key, schemes, weights, thresholds);
  const [tab, setTab] = useState('critical');

  const t = s.tabs;
  const tabs = [
    { key: 'critical', label: 'Critical Gaps', count: t.critical.length },
    { key: 'risks', label: 'High Risks', count: t.risks.length },
    { key: 'evidence', label: 'Missing Evidence', count: t.evidence.length },
    { key: 'competence', label: 'Expired Competence', count: t.competence.length },
    { key: 'findings', label: 'Open Findings', count: t.findings.length },
  ];

  // Each pillar jumps to the tab that explains its score.
  const pillarTab = (p) =>
    p === 'Evidence' ? 'evidence'
      : p === 'Competence' ? 'competence'
      : p === 'Assurance' || p === 'CAPA' ? 'findings'
      : 'critical';

  const witnessOk = s.witness && s.witness.completed >= s.witness.required;

  return (
    <>
      <PageHead
        crumbs={[
          { label: 'Dashboard', route: 'dashboard' },
          { label: 'Accreditation Scope', route: 'accreditation-scope' },
          { label: s.name },
        ]}
        onNavigate={onNavigate}
      />
      <div className="mb-5 flex items-start justify-between gap-6">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{s.name} Certification Scheme</h1>
            <Badge level={r.band}>{BAND_LABEL[r.band]}</Badge>
          </div>
          <p className="text-[13px] text-ink-muted">
            {s.full} · {s.clients} active client certifications
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {s.stds.map((x) => (
              <span key={x} className="rounded border border-edge bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">
                {x}
              </span>
            ))}
            <span className="rounded border border-edge bg-surface-subtle px-2 py-0.5 text-[11px] text-ink-muted">
              {abName(s.ab)}
            </span>
            {s.witness && (
              <span
                onClick={() => onNavigate('ab-assessment')}
                className={`cursor-pointer rounded border px-2 py-0.5 text-[11px] ${
                  witnessOk
                    ? 'border-status-greenBg text-status-green'
                    : 'border-status-orangeBg text-status-orange'
                }`}
              >
                Witness Audits: {s.witness.completed}/{s.witness.required}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-[42px] font-extrabold leading-none tracking-tight ${BAND_TEXT[r.band]}`}>
            {r.score}%
          </div>
          <div className={`mt-1 text-[11.5px] ${s.trend.includes('▼') ? 'text-status-red' : 'text-ink-faint'}`}>
            {s.trend}
          </div>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <Button onClick={() => onNavigate('compliance')}>Open Compliance Matrix</Button>
        <Button variant="primary" onClick={() => onNavigate('assessment-prep', key)}>
          <PlusIcon className="h-3.5 w-3.5" /> Prepare for Assessment
        </Button>
      </div>

      {/* The explanation that makes a capped band defensible rather than mysterious. */}
      {r.reasons.length > 0 && (
        <Note tone="orange">
          <b className="text-status-orange">Why this band, not "{BAND_LABEL[r.rawBand]}"?</b> The
          weighted score alone would read {r.rawScore}% ({BAND_LABEL[r.rawBand]}), but{' '}
          {r.reasons.length > 1 ? 'these rules cap' : 'this rule caps'} it lower:{' '}
          {r.reasons.join('; ')}.{' '}
          <span
            onClick={() => onNavigate('readiness-methodology')}
            className="cursor-pointer font-medium text-brand-700 hover:underline"
          >
            See the full methodology →
          </span>
        </Note>
      )}

      <SectionLabel>
        Readiness by Pillar{' '}
        <span className="font-normal normal-case tracking-normal text-ink-faint">
          — weighted {r.rawScore}% raw ·{' '}
          <span
            onClick={() => onNavigate('readiness-methodology')}
            className="cursor-pointer text-brand-700 hover:underline"
          >
            edit weights →
          </span>
        </span>
      </SectionLabel>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {PILLARS.map((p) => {
          const v = s.pillars[p];
          return (
            <div
              key={p}
              onClick={() => setTab(pillarTab(p))}
              className="cursor-pointer rounded-[10px] border border-edge bg-white p-3.5 transition hover:-translate-y-px hover:border-edge-strong"
            >
              <div className="mb-2 text-[12.5px] font-semibold text-ink-muted">
                {p}{' '}
                <span className="font-normal text-ink-faint">· {weights[p]}%wt</span>
              </div>
              <div className="mb-1.5 text-[22px] font-extrabold" style={{ color: barColor(v) }}>
                {v}%
              </div>
              <div className="h-1.5 overflow-hidden rounded-sm bg-surface-subtle">
                <div className="h-full rounded-sm" style={{ width: `${v}%`, background: barColor(v) }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-edge bg-white">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div className="px-4 pb-2 pt-1.5">
          <GapList items={t[tab]} />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Accreditation Scope — grouped by Accreditation Body                 */
/* ------------------------------------------------------------------ */
export function AccreditationScope({ ctx, onNavigate }) {
  const { schemes, schemeOrder, accreditationBodies } = ctx;
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Accreditation Scope' }]}
        title="Accreditation Scope"
        sub="Every certification, verification, or validation scheme this CAB holds or is pursuing, across every Accreditation Body — each one a live, computed readiness score."
        actions={
          <Button variant="primary" onClick={() => onNavigate('scheme-register')}>
            + Add New Accreditation Scheme
          </Button>
        }
        onNavigate={onNavigate}
      />
      {accreditationBodies.map((ab) => {
        const list = schemeOrder.filter((k) => schemes[k].ab === ab.id);
        if (!list.length) return null;
        return (
          <div key={ab.id}>
            <SectionLabel className="flex items-center gap-2">
              {ab.name}
              <span className="font-normal normal-case tracking-normal text-ink-faint">
                — {ab.full}
              </span>
              <span
                onClick={() => onNavigate('ab-detail', ab.id)}
                className="ml-auto cursor-pointer text-[11.5px] font-medium text-brand-700 hover:underline"
              >
                View accreditation →
              </span>
            </SectionLabel>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((k) => (
                <SchemeCard key={k} schemeKey={k} ctx={ctx} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Accreditation Bodies list + detail                                  */
/* ------------------------------------------------------------------ */
export function AccreditationBodies({ ctx, onNavigate }) {
  const { accreditationBodies, schemes, schemeOrder } = ctx;
  const rows = accreditationBodies.map((a) => ({
    name: `${a.name} — ${a.full}`,
    country: a.country,
    number: a.number,
    schemes: schemeOrder.filter((k) => schemes[k].ab === a.id).map((k) => schemes[k].name).join(', ') || 'None yet',
    status: a.status,
    __nav: ['ab-detail', a.id],
  }));
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Accreditation Bodies' }]}
        title="Accreditation Bodies"
        sub="Every Accreditation Body this CAB holds accreditation from. One AB can cover several schemes; adding a new AB never requires a code change."
        actions={<Button variant="primary" onClick={() => onNavigate('ab-register')}>+ Add Accreditation Body</Button>}
        onNavigate={onNavigate}
      />
      <DataTable
        columns={[
          { key: 'name', label: 'Accreditation Body' },
          { key: 'country', label: 'Country' },
          { key: 'number', label: 'Accreditation Number', type: 'mono' },
          { key: 'schemes', label: 'Schemes Covered' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        rows={rows}
        onRowClick={onNavigate}
      />
    </>
  );
}

export function AbDetail({ abId, ctx, onNavigate }) {
  const { accreditationBodies, schemes, schemeOrder } = ctx;
  const a = accreditationBodies.find((x) => x.id === abId) || accreditationBodies[0];
  const list = schemeOrder.filter((k) => schemes[k].ab === a.id);
  return (
    <>
      <PageHead
        crumbs={[
          { label: 'Dashboard', route: 'dashboard' },
          { label: 'Accreditation Bodies', route: 'accreditation-profile' },
          { label: a.name },
        ]}
        title={`${a.name} — ${a.full}`}
        actions={<Button variant="primary" onClick={() => onNavigate('scheme-register')}>+ Add Scheme Under This AB</Button>}
        onNavigate={onNavigate}
      />
      <Card className="mb-4">
        {[
          ['Country', a.country],
          ['Accreditation Number', a.number],
          ['Accredited Since', a.since],
          ['Schemes Covered', list.length ? String(list.length) : 'None registered yet'],
        ].map(([k, v]) => (
          <div key={k} className="flex border-b border-edge py-2.5 last:border-0">
            <div className="w-56 shrink-0 text-[12.5px] text-ink-faint">{k}</div>
            <div className="text-[13.5px]">{v}</div>
          </div>
        ))}
      </Card>
      <SectionLabel>Schemes Under {a.name}</SectionLabel>
      {list.length ? (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((k) => (
            <SchemeCard key={k} schemeKey={k} ctx={ctx} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-[12.5px] text-ink-faint">
          No schemes registered under this Accreditation Body yet.
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Scheme management table                                             */
/* ------------------------------------------------------------------ */
export function SchemesTable({ ctx, onNavigate }) {
  const { schemes, schemeOrder, abName, weights, thresholds } = ctx;
  const rows = schemeOrder.map((k) => {
    const s = schemes[k];
    const r = computeReadiness(k, schemes, weights, thresholds);
    return {
      name: s.name,
      ab: abName(s.ab),
      std: s.stds[0] || '—',
      clients: s.clients,
      score: r.score,
      status: s.badge === 'draft' ? { level: 'gray', label: 'Inactive' } : { level: 'green', label: 'Active' },
      __nav: [s.badge === 'draft' ? 'scheme-wizard' : 'scheme-detail', k],
    };
  });
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Schemes' }]}
        title="Scheme Management"
        sub="Certification, verification, and validation schemes — each a configuration object linking a scheme to its Accreditation Body and standards."
        actions={<Button variant="primary" onClick={() => onNavigate('scheme-register')}>+ Add New Accreditation Scheme</Button>}
        onNavigate={onNavigate}
      />
      <DataTable
        columns={[
          { key: 'name', label: 'Scheme' },
          { key: 'ab', label: 'Accreditation Body' },
          { key: 'std', label: 'Primary Standard', type: 'mono' },
          { key: 'clients', label: 'Clients' },
          { key: 'score', label: 'Readiness', type: 'bar' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        rows={rows}
        onRowClick={onNavigate}
      />
    </>
  );
}
