import React, { useState } from 'react';
import SchemeCard from '../components/SchemeCard';
import {
  Badge, Button, Card, CardHead, DataTable, FilterChips, Note, PageHead, SectionLabel,
  StatRow, Toolbar, inputClass,
} from '../components/ui';
import {
  BAND_LABEL, BAND_TEXT, barColor, computeReadiness,
} from '../lib/readiness';
import { PILLARS } from '../data/schemes';
import { daysUntil, fmtDate, initials, taskDueLabel, taskStatus } from '../lib/format';
import { abAssessRows } from '../data/records';

/* ------------------------------------------------------------------ */
/* Readiness overview                                                  */
/* ------------------------------------------------------------------ */
export function Readiness({ ctx, onNavigate }) {
  const { schemes, schemeOrder, weights, thresholds } = ctx;
  const active = schemeOrder.filter((k) => schemes[k].badge !== 'draft');
  // Reads the SAME backend-fetched value the always-visible ReadinessStrip
  // shows (App.jsx's ctx.overall, from GET /readiness/overall) rather than
  // recomputing locally — otherwise clicking "View full readiness" from the
  // strip could show a different headline number than the strip just did.
  const overall = ctx.overall;
  const avg = {};
  PILLARS.forEach((p) => {
    avg[p] = Math.round(active.reduce((a, k) => a + schemes[k].pillars[p], 0) / active.length);
  });

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Readiness' }]}
        title="Accreditation Readiness"
        sub="The readiness engine — computed live from Requirement → Evidence → Personnel → Findings → Risk, never stored as a static field."
        actions={<Button onClick={() => onNavigate('readiness-methodology')}>How this is calculated →</Button>}
        onNavigate={onNavigate}
      />
      <Note>
        Portfolio readiness right now:{' '}
        <b>{overall.score}% — {BAND_LABEL[overall.band]}</b>, averaged across {active.length}{' '}
        active schemes. Every number below is recalculated on load — nothing here is a stored
        snapshot.
      </Note>
      <SectionLabel>By Scheme</SectionLabel>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {schemeOrder.map((k) => (
          <SchemeCard key={k} schemeKey={k} ctx={ctx} onNavigate={onNavigate} />
        ))}
      </div>
      <SectionLabel>By Pillar — All Active Schemes (weighted average)</SectionLabel>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <div key={p} className="rounded-[10px] border border-edge bg-white p-3.5">
            <div className="mb-2 text-[12.5px] font-semibold text-ink-muted">{p}</div>
            <div className="mb-1.5 text-[22px] font-extrabold" style={{ color: barColor(avg[p]) }}>
              {avg[p]}%
            </div>
            <div className="h-1.5 overflow-hidden rounded-sm bg-surface-subtle">
              <div className="h-full rounded-sm" style={{ width: `${avg[p]}%`, background: barColor(avg[p]) }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Readiness Methodology — the calculation, exposed and editable       */
/* ------------------------------------------------------------------ */
export function ReadinessMethodology({ ctx, onNavigate }) {
  const { schemes, schemeOrder, weights, thresholds, setWeights, setThresholds } = ctx;
  const [draftW, setDraftW] = useState(weights);
  const [draftT, setDraftT] = useState(thresholds);

  const weightSum = PILLARS.reduce((a, p) => a + Number(draftW[p] || 0), 0);
  const active = schemeOrder.filter((k) => schemes[k].badge !== 'draft');

  const trig = (fn) => active.filter(fn).map((k) => schemes[k].name);
  const ruleRows = [
    { rule: '1 critical gap', condition: 'Caps the band at "Ready with Risks", even if the raw score reads "Ready"', triggered: trig((k) => schemes[k].tabs.critical.length === 1).join(', ') || 'None currently' },
    { rule: '2+ critical gaps', condition: 'Caps the band at "Not Yet Ready"', triggered: trig((k) => schemes[k].tabs.critical.length >= 2).join(', ') || 'None currently' },
    { rule: 'Competence pillar below 60%', condition: 'Caps at "Not Yet Ready" — competence gaps are structural, not cosmetic', triggered: trig((k) => schemes[k].pillars.Competence < 60).join(', ') || 'None currently' },
    {
      rule: 'Witness audits outstanding, <30 days to AB visit',
      condition: 'Caps at "Not Yet Ready" — running out of runway on a mandatory AB requirement',
      triggered:
        trig((k) => {
          const s = schemes[k];
          if (!s.witness || !s.nextAssessment) return false;
          const out = s.witness.required - s.witness.completed;
          const d = daysUntil(s.nextAssessment.date);
          return out > 0 && d >= 0 && d < 30;
        }).join(', ') || 'None currently',
    },
  ];

  const auditRows = active.map((k) => {
    const r = computeReadiness(k, schemes, weights, thresholds);
    return {
      scheme: schemes[k].name,
      raw: `${r.rawScore}% (${BAND_LABEL[r.rawBand]})`,
      final: { level: r.band, label: `${r.score}% — ${BAND_LABEL[r.band]}` },
      reasons: r.reasons.length ? r.reasons.join('; ') : 'No cap applied — raw score stands',
      __nav: ['scheme-detail', k],
    };
  });

  // Worked example uses whichever scheme currently demonstrates a cap most clearly.
  const exKey = 'iso27001';
  const es = schemes[exKey];
  const er = computeReadiness(exKey, schemes, weights, thresholds);

  const apply = () => {
    setWeights({ ...draftW });
    setThresholds({ ...draftT });
  };

  return (
    <>
      <PageHead
        crumbs={[
          { label: 'Dashboard', route: 'dashboard' },
          { label: 'Readiness', route: 'readiness' },
          { label: 'Methodology' },
        ]}
        title="Readiness Methodology"
        sub="How the score and the colour are actually calculated — and why they can differ."
        onNavigate={onNavigate}
      />
      <Note>
        <b>Two steps, always in this order:</b> (1) every pillar score is multiplied by its weight
        and summed into a raw score, which maps to a raw band. (2) A small set of blocking rules
        can only push that band <b>down</b> — never up. This means a high weighted score never
        quietly hides a critical gap, an incomplete witness cycle, or a collapsed competence pillar.
      </Note>

      <div className="mb-3 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-[14.5px] font-bold">Step 1 — Pillar Weights</h2>
            <span className={`text-xs font-bold ${weightSum === 100 ? 'text-status-green' : 'text-status-red'}`}>
              Sum: {weightSum}%{weightSum === 100 ? ' ✓' : ' — should total 100%'}
            </span>
          </div>
          {PILLARS.map((p) => (
            <div key={p} className="mb-3 grid grid-cols-[130px_1fr_64px] items-center gap-3">
              <div className="text-[13px] text-ink-muted">{p}</div>
              <div className="h-2 overflow-hidden rounded-sm bg-surface-subtle">
                <div className="h-full rounded-sm bg-brand-700" style={{ width: `${draftW[p]}%` }} />
              </div>
              <input
                type="number"
                min="0"
                max="100"
                value={draftW[p]}
                onChange={(e) => setDraftW({ ...draftW, [p]: Number(e.target.value) })}
                className={`${inputClass} px-2 py-1 text-[12.5px]`}
              />
            </div>
          ))}
          <p className="text-[11.5px] text-ink-faint">
            Weights are config, not code — change any value and every scheme on every screen
            recalculates.
          </p>
        </Card>

        <Card>
          <CardHead title="Step 2 — Band Thresholds" />
          {[
            ['ready', '"Ready" — minimum raw score'],
            ['risks', '"Ready with Risks" — minimum raw score'],
            ['notYetReady', '"Not Yet Ready" — minimum raw score'],
          ].map(([k, label]) => (
            <div key={k} className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">{label}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={draftT[k]}
                onChange={(e) => setDraftT({ ...draftT, [k]: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          ))}
          <p className="text-[11.5px] text-ink-faint">
            Anything below the last threshold reads "Not Ready."
          </p>
        </Card>
      </div>

      <Button variant="primary" onClick={apply} className="mb-2">
        Recalculate All Schemes
      </Button>
      <p className="mb-6 text-[11.5px] text-ink-faint">
        This updates the live config — the Dashboard gauge, every scope card, every scheme detail
        page, and the AB Assessment schedule all reread it immediately.
      </p>

      <SectionLabel>Blocking Rules — currently in effect</SectionLabel>
      <DataTable
        columns={[
          { key: 'rule', label: 'Rule' },
          { key: 'condition', label: 'What it does' },
          { key: 'triggered', label: 'Triggered For' },
        ]}
        rows={ruleRows}
      />

      <SectionLabel>Worked Example — {es.name}</SectionLabel>
      <Card>
        <p className="mb-3.5 text-[13px] text-ink-muted">
          Every pillar score is multiplied by its weight and summed:
        </p>
        <DataTable
          columns={[
            { key: 'pillar', label: 'Pillar' },
            { key: 'score', label: 'Score' },
            { key: 'weight', label: 'Weight' },
            { key: 'contribution', label: 'Contribution' },
          ]}
          rows={PILLARS.map((p) => ({
            pillar: p,
            score: `${es.pillars[p]}%`,
            weight: `${weights[p]}%`,
            contribution: `${(Math.round(es.pillars[p] * weights[p]) / 100).toFixed(1)} pts`,
          }))}
        />
        <div className="mt-3.5 border-t border-edge pt-3.5 text-[13.5px] leading-loose text-ink-muted">
          <div><b className="text-ink">Raw score:</b> {er.rawScore}% → raw band = <b>{BAND_LABEL[er.rawBand]}</b></div>
          <div>
            <b className="text-ink">Blocking check:</b>{' '}
            {er.reasons.length ? er.reasons.join('; ') : 'no rule triggered — raw band stands'}
          </div>
          <div>
            <b className="text-ink">Final:</b>{' '}
            <span className={`font-bold ${BAND_TEXT[er.band]}`}>
              {er.score}% — {BAND_LABEL[er.band]}
            </span>
          </div>
        </div>
      </Card>

      <SectionLabel>All Schemes — Full Audit Trail</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'raw', label: 'Raw Weighted Score' },
          { key: 'final', label: 'Final Band', type: 'badge' },
          { key: 'reasons', label: 'Why' },
        ]}
        rows={auditRows}
        onRowClick={onNavigate}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */
export function Tasks({ ctx, onNavigate, filter = 'all', onFilter }) {
  const { tasks, schemes } = ctx;
  const withStatus = tasks.map((t) => ({ ...t, computed: taskStatus(t) }));
  const counts = {
    all: tasks.length,
    open: withStatus.filter((t) => t.computed.label !== 'Done').length,
    overdue: withStatus.filter((t) => t.computed.label === 'Overdue').length,
    done: withStatus.filter((t) => t.computed.label === 'Done').length,
  };
  const dueThisWeek = withStatus.filter(
    (t) => t.computed.label !== 'Done' && daysUntil(t.due) >= 0 && daysUntil(t.due) <= 7
  ).length;

  const filtered = withStatus
    .filter((t) => {
      if (filter === 'overdue') return t.computed.label === 'Overdue';
      if (filter === 'done') return t.computed.label === 'Done';
      if (filter === 'open') return t.computed.label !== 'Done';
      return true;
    })
    .sort((a, b) => new Date(a.due) - new Date(b.due));

  const PRIORITY = {
    Critical: 'bg-status-redBg text-status-red',
    High: 'bg-status-orangeBg text-status-orange',
    Medium: 'bg-status-yellowBg text-status-yellow',
    Low: 'bg-status-grayBg text-status-gray',
  };

  const rows = filtered.map((t) => ({
    title: t.title,
    scheme: schemes[t.scheme]?.name || '—',
    assignee: (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
          {initials(t.assignee)}
        </div>
        {t.assignee}
      </div>
    ),
    due: taskDueLabel(t),
    priority: (
      <span className={`inline-block rounded px-2 py-0.5 text-2xs font-bold uppercase tracking-wide ${PRIORITY[t.priority]}`}>
        {t.priority}
      </span>
    ),
    status: t.computed,
    __nav: schemes[t.scheme] ? ['scheme-detail', t.scheme] : null,
  }));

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Tasks' }]}
        title="Tasks"
        sub="Every open item behind a readiness gap, risk, or finding — who owns it, when it's due, and whether it's slipping."
        onNavigate={onNavigate}
      />
      <StatRow
        items={[
          { n: counts.open, l: 'Open Tasks' },
          { n: counts.overdue, l: 'Overdue', color: 'text-status-red' },
          { n: dueThisWeek, l: 'Due This Week', color: 'text-status-yellow' },
          { n: counts.done, l: 'Completed', color: 'text-status-green' },
        ]}
      />
      <FilterChips
        options={[
          { key: 'all', label: `All (${counts.all})` },
          { key: 'open', label: `Open (${counts.open})` },
          { key: 'overdue', label: `Overdue (${counts.overdue})` },
          { key: 'done', label: `Done (${counts.done})` },
        ]}
        active={filter}
        onChange={onFilter}
      />
      <Toolbar placeholder="Search tasks…" />
      <DataTable
        columns={[
          { key: 'title', label: 'Task' },
          { key: 'scheme', label: 'Scheme' },
          { key: 'assignee', label: 'Assignee', type: 'node' },
          { key: 'due', label: 'Due' },
          { key: 'priority', label: 'Priority', type: 'node' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        rows={rows}
        onRowClick={onNavigate}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* AB Assessment — schedule + witness audit tracking                   */
/* ------------------------------------------------------------------ */
export function ABAssessment({ ctx, onNavigate }) {
  const { schemes, schemeOrder, abName, upcoming } = ctx;

  const scheduleRows = upcoming.map((u) => {
    if (!u.date)
      return {
        scheme: u.name, ab: abName(u.ab), type: '—', date: 'Not yet scheduled',
        days: 'Setup in progress', status: { level: 'gray', label: 'Inactive' },
        __nav: ['scheme-wizard', u.key],
      };
    return {
      scheme: u.name, ab: abName(u.ab), type: u.type, date: fmtDate(u.date),
      days: u.days < 0 ? `${Math.abs(u.days)}d overdue` : `${u.days} days`,
      status: { level: u.badge, label: BAND_LABEL[u.badge] },
      __nav: ['scheme-detail', u.key],
    };
  });

  const witnessSchemes = schemeOrder.filter((k) => schemes[k].badge !== 'draft' && schemes[k].witness);
  const witnessSummary = witnessSchemes.map((k) => {
    const s = schemes[k];
    const w = s.witness;
    const pct = Math.round((w.completed / w.required) * 100);
    const outstanding = w.required - w.completed;
    return {
      scheme: s.name,
      ab: abName(s.ab),
      progress: (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-surface-subtle">
            <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: barColor(pct) }} />
          </div>
          <span className="text-xs">{w.completed}/{w.required}</span>
        </div>
      ),
      status:
        outstanding === 0
          ? { level: 'green', label: 'Closed' }
          : outstanding === w.required
          ? { level: 'red', label: 'Non-Compliant' }
          : { level: 'yellow', label: 'Partially Compliant' },
      __nav: ['scheme-detail', k],
    };
  });

  // Outstanding events first — they're the ones that become findings.
  const events = [];
  witnessSchemes.forEach((k) =>
    schemes[k].witness.events.forEach((e) =>
      events.push({
        scheme: schemes[k].name,
        auditor: e.auditor,
        assessor: e.assessor,
        date: e.date === 'Not yet scheduled' ? e.date : fmtDate(e.date),
        result: {
          level: { Pass: 'green', 'Minor NC': 'yellow', 'Major NC': 'orange', Scheduled: 'gray', Outstanding: 'red' }[e.result],
          label: e.result,
        },
        __nav: ['scheme-detail', k],
      })
    )
  );
  events.sort((a, b) => (a.result.label === 'Outstanding' ? 0 : 1) - (b.result.label === 'Outstanding' ? 0 : 1));

  const totalReq = witnessSchemes.reduce((a, k) => a + schemes[k].witness.required, 0);
  const totalDone = witnessSchemes.reduce((a, k) => a + schemes[k].witness.completed, 0);

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'AB Assessment' }]}
        title="AB Assessment"
        sub="Every scheme's next Accreditation Body visit, nearest first — across every Accreditation Body, including schemes still being registered."
        onNavigate={onNavigate}
      />
      <SectionLabel className="!mt-0">Upcoming Schedule</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'ab', label: 'Accreditation Body' },
          { key: 'type', label: 'Assessment Type' },
          { key: 'date', label: 'Scheduled Date' },
          { key: 'days', label: 'Countdown' },
          { key: 'status', label: 'Readiness', type: 'badge' },
        ]}
        rows={scheduleRows}
        onRowClick={onNavigate}
      />

      <SectionLabel>Witness Audits</SectionLabel>
      <Note>
        Every accreditation scheme requires the AB to periodically <b>witness</b> a live audit —
        observing an auditor in the field to verify competence and process quality. This tracks how
        many witnesses each scheme needs this cycle, how many are done, and the result.
      </Note>
      <StatRow
        items={[
          { n: totalReq, l: 'Witnesses Required (cycle)' },
          { n: totalDone, l: 'Completed', color: 'text-status-green' },
          { n: totalReq - totalDone, l: 'Outstanding', color: totalReq - totalDone > 0 ? 'text-status-red' : 'text-status-green' },
          { n: `${witnessSchemes.filter((k) => schemes[k].witness.completed >= schemes[k].witness.required).length}/${witnessSchemes.length}`, l: 'Schemes Fully Witnessed' },
        ]}
      />
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'ab', label: 'Accreditation Body' },
          { key: 'progress', label: 'Required / Completed', type: 'node' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        rows={witnessSummary}
        onRowClick={onNavigate}
      />

      <SectionLabel>Witness Events</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'auditor', label: 'Auditor Witnessed' },
          { key: 'assessor', label: 'AB Assessor' },
          { key: 'date', label: 'Date' },
          { key: 'result', label: 'Result', type: 'badge' },
        ]}
        rows={events}
        onRowClick={onNavigate}
      />

      <SectionLabel>Past AB Visits</SectionLabel>
      <DataTable
        columns={[
          { key: 'id', label: 'ID', type: 'mono' },
          { key: 'type', label: 'Type' },
          { key: 'scheme', label: 'Scheme' },
          { key: 'date', label: 'Date', type: 'mono' },
          { key: 'result', label: 'Result', type: 'badge' },
        ]}
        rows={abAssessRows}
      />
    </>
  );
}
