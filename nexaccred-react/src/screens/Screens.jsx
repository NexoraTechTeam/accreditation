import React, { useState } from 'react';
import {
  Badge, Button, Card, CardHead, DataTable, FilterChips, FormField, GapList,
  IntegrationBanner, Note, PageHead, SectionLabel, StatRow, Toolbar, inputClass, SparkleIcon,
} from '../components/ui';
import { ev } from '../data/schemes';
import {
  workloadByScheme, workloadCurrentByScheme,
  auditorRoleByScheme, reviewDecisionRolesByScheme, calibrationDueSchedule,
  mandaysCapacityByScheme, auditorRiskSummary, auditorRiskFlags,
  clientsByScheme,
  PERIODS, auditsByPeriod, techReviewByPeriod, decisionsByPeriod,
  topTechnicalReviewersByPeriod, topDecisionMakersByPeriod,
  trTurnaround, decisionTurnaroundByScheme,
  impartialityRows, impartialityByType, impartialityByAuditorCategory,
} from '../data/records';

/* ================================================================== */
/* CERTIFICATION ACTIVITIES — synced workload, filterable per scheme  */
/* ================================================================== */
const STAGE_DEFS = [
  { name: 'Application Review', color: '#2563EB', unit: 'tasks', max: 1500, rows: ['In progress / Open', 'Approved', 'Approved with No Findings', 'Reject'] },
  { name: 'Scheduling', color: '#0D9488', unit: 'schedule entries', max: 300, rows: ['Booked', 'In progress', 'CL Sent', 'Confirmed'] },
  { name: 'Audit', color: '#EA580C', unit: 'tasks', max: 3, rows: ['Open', 'In progress', 'Done'] },
  { name: 'Technical Review', color: '#7C3AED', unit: 'tasks', max: 3, rows: ['Open', 'In progress', 'Done'] },
  { name: 'Certificate Issuance', color: '#EA580C', unit: 'tasks', max: 3, rows: ['Open', 'In progress', 'Done'] },
];

const ASSIGNEES = {
  'Application Review': { list: [['anwar.siregar@cbqaglobal.com', 428], ['helda.mutiara@cbqaglobal.com', 37], ['e.martiansyah@cbqaglobal.com', 32], ['aulia.rakhman@cbqaglobal.com', 31]], more: 18 },
  Scheduling: { list: [['hendra.fachrurozy@cbqaglobal.com', 358], ['satrio.sandyakala@cbqaglobal.com', 161], ['rahayu.ningsih@cbqaglobal.com', 110], ['helda.mutiara@cbqaglobal.com', 37]], more: 13 },
  Audit: { list: [], more: 0 },
  'Technical Review': { list: [], more: 0 },
  'Certificate Issuance': { list: [], more: 0 },
};

export function CertificationActivities({ ctx, onNavigate }) {
  const { schemes, schemeOrder } = ctx;
  const [filter, setFilter] = useState('all');
  const active = schemeOrder.filter((k) => schemes[k].badge !== 'draft');

  const stages = STAGE_DEFS.map((d) => {
    const by = workloadByScheme[d.name];
    const total = filter === 'all' ? Object.values(by).reduce((a, b) => a + b, 0) : by[filter] || 0;
    const cur = workloadCurrentByScheme[d.name];
    const current = cur ? (filter === 'all' ? Object.values(cur).reduce((a, b) => a + b, 0) : cur[filter] || 0) : 0;
    return { ...d, total, current, ...ASSIGNEES[d.name] };
  });

  const matrixRows = active.map((k) => {
    const row = { scheme: schemes[k].name };
    let total = 0;
    STAGE_DEFS.forEach((d) => {
      const v = workloadByScheme[d.name][k] || 0;
      row[d.name] = v;
      total += v;
    });
    row.total = total;
    row.__nav = ['certification-activities', k];
    return row;
  });

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Certification Activities' }]}
        title="Certification Activities"
        sub="Application through certificate issuance — the lifecycle every certification passes through."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Application review, audit scheduling, and certificate issuance" />
      <FilterChips
        options={[{ key: 'all', label: 'All Schemes' }, ...active.map((k) => ({ key: k, label: schemes[k].name }))]}
        active={filter}
        onChange={setFilter}
      />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="text-[17px] font-extrabold">
          Insight Audit Process workload{filter !== 'all' ? ` — ${schemes[filter].name}` : ''}
        </h2>
        <div className="flex gap-2">
          <span className="rounded-lg border border-edge bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-ink-muted">
            {stages.reduce((a, s) => a + s.current, 0)} projects in stage distribution
          </span>
          <span className="rounded-lg border border-edge bg-surface-subtle px-3 py-1.5 text-xs font-semibold text-ink-muted">
            0 completed
          </span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {stages.map((s) => (
          <div key={s.name} className="rounded-xl border border-edge bg-white p-4" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="mb-1 flex items-center justify-between gap-1.5">
              <h3 className="text-[13.5px] font-bold leading-tight">{s.name}</h3>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            </div>
            <div className="mb-2.5 text-[11.5px] text-ink-faint">{s.total} {s.unit}</div>
            <span className="mb-3.5 inline-block rounded-md bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-ink-muted">
              <b style={{ color: s.color }}>{s.current}</b> current-stage projects
            </span>
            <div className="mb-3.5">
              {s.rows.map((label, i) => {
                const v = i === 0 ? s.total : 0;
                return (
                  <div key={label} className="mb-2">
                    <div className="mb-1 text-[11px] font-medium text-ink-muted">{label}</div>
                    <div className="relative h-[18px] overflow-hidden rounded bg-surface-subtle">
                      <div className="h-full rounded" style={{ width: `${s.max ? Math.min(100, (v / s.max) * 100) : 0}%`, background: `${s.color}33` }} />
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-2xs font-bold" style={{ color: s.color }}>{v}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-edge pt-3">
              <div className="mb-2 text-2xs font-bold uppercase tracking-wide text-ink-faint">Assigned</div>
              {filter !== 'all' ? (
                <p className="text-[11.5px] italic text-ink-faint">
                  Assignee breakdown isn't split by scheme in Platform Audit — see the "All Schemes" view.
                </p>
              ) : s.list.length ? (
                <>
                  {s.list.map(([e, c]) => (
                    <span key={e} className="mr-1 mb-1 inline-block break-all rounded bg-surface-subtle px-2 py-1 text-2xs text-brand-700">
                      {e} <b className="text-ink-muted">({c})</b>
                    </span>
                  ))}
                  {s.more > 0 && <div className="text-[11px] font-bold text-brand-700">+{s.more}</div>}
                </>
              ) : (
                <p className="text-[11.5px] italic text-ink-faint">No task assignee</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Workload by Scheme — where the risk actually sits</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          ...STAGE_DEFS.map((d) => ({ key: d.name, label: d.name })),
          { key: 'total', label: 'Total' },
        ]}
        rows={matrixRows}
      />
    </>
  );
}

/* ================================================================== */
/* PERSONNEL & COMPETENCE — with the synced Competency Mapping card   */
/* ================================================================== */
export function PersonnelCompetence({ ctx, onNavigate }) {
  const dist = [
    ['Lead Auditor', 99], ['Application Reviewer', 97], ['Scheduler / Operation', 96],
    ['Technical Reviewer', 82], ['Auditor', 81], ['Certification Authority', 81],
  ];
  const max = Math.max(...dist.map((d) => d[1]));

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Personnel & Competence' }]}
        title="Personnel & Competence"
        sub="Competence is not employee data — it is eligibility, computed per scheme, per client, per scope."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Auditor, lead auditor, and technical reviewer competency" />

      <div className="mb-5 rounded-2xl border border-edge bg-white p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ai-50 text-ai-700">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
              <path d="M10 3 2 7l8 4 8-4-8-4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M5 9v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V9" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <h3 className="flex-1 text-[16.5px] font-extrabold">Competency Mapping</h3>
        </div>
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['740', 'Total Imported', 'bg-surface-subtle text-ink'],
            ['704', 'Matched', 'bg-status-greenBg text-status-green'],
            ['36', 'Auto-created', 'bg-brand-50 text-brand-700'],
            ['0', 'Unmatched', 'bg-status-orangeBg text-status-orange'],
          ].map(([n, l, cls]) => (
            <div key={l} className={`rounded-[10px] px-4 py-3.5 ${cls.split(' ')[0]}`}>
              <div className={`text-xl font-extrabold ${cls.split(' ')[1]}`}>{n}</div>
              <div className="text-[11.5px] text-ink-muted">{l}</div>
            </div>
          ))}
        </div>
        <div className="mb-4 text-sm font-bold text-ink-muted">Personnel Qualification Distribution</div>
        {dist.map(([label, v]) => (
          <div key={label} className="mb-3 grid grid-cols-[170px_1fr_30px] items-center gap-3.5">
            <div className="text-[13px] font-medium text-ink-muted">{label}</div>
            <div className="h-2 overflow-hidden rounded bg-surface-subtle">
              <div className="h-full rounded bg-ai-700" style={{ width: `${(v / max) * 100}%` }} />
            </div>
            <div className="text-right text-[13px] font-bold text-ai-700">{v}</div>
          </div>
        ))}
      </div>

      <StatRow
        items={[
          { n: 34, l: 'Total Personnel' },
          { n: 19, l: 'Active Auditors' },
          { n: 5, l: 'Expiring Authorizations', color: 'text-status-yellow' },
          { n: 3, l: 'Pending Witness Assessments' },
        ]}
      />

      <SectionLabel className="!mt-0">Audit & Verification Roles by Scheme</SectionLabel>
      <p className="mb-3 -mt-1.5 text-[12.5px] text-ink-muted">
        Validator / Verifier are the ISO/IEC 17029 roles for the validation & verification
        scheme — a 0 there confirms scope, it isn't a missing cell.
      </p>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'leadAuditors', label: 'Lead Auditors' },
          { key: 'auditors', label: 'Auditors' },
          { key: 'validators', label: 'Validators' },
          { key: 'verifiers', label: 'Verifiers' },
          { key: 'inQualification', label: 'In Qualification' },
        ]}
        rows={auditorRoleByScheme}
      />

      <SectionLabel>Review & Decision Roles by Scheme</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'technicalReviewers', label: 'Technical Reviewers' },
          { key: 'applicationReviewers', label: 'Application Reviewers' },
          { key: 'decisionMakers', label: 'Certification Decision Makers' },
        ]}
        rows={reviewDecisionRolesByScheme}
      />

      <SectionLabel>Mandays Sufficiency & Competency Risk</SectionLabel>
      <p className="mb-3 -mt-1.5 text-[12.5px] text-ink-muted">
        Qualified auditor mandays available over the next 90 days against what the current
        booked and forecast workload requires — the earliest warning a scheme is short on
        people, not just short on evidence.
      </p>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'mandaysRequired', label: 'Mandays Required (90d)' },
          { key: 'mandaysAvailable', label: 'Mandays Available' },
          { key: 'availableAuditors', label: 'Available Auditors' },
          { key: 'risk', label: 'Competency Risk', type: 'badge' },
        ]}
        rows={mandaysCapacityByScheme}
      />

      <SectionLabel>Calibration & Witness Due Schedule</SectionLabel>
      <p className="mb-3 -mt-1.5 text-[12.5px] text-ink-muted">
        When personnel need recalibration or a fresh witness assessment, not just how many —
        so re-authorization can be scheduled ahead of an expiry rather than reacted to.
      </p>
      <StatRow
        items={[
          { n: auditorRiskSummary.needCalibration, l: 'Calibration Due ≤30 Days', color: 'text-status-orange' },
          { n: auditorRiskSummary.witnessNeeded, l: 'Witness Due ≤30 Days', color: 'text-status-orange' },
          { n: auditorRiskSummary.auditLogShortfall, l: 'Below Minimum Audit Log', color: 'text-status-orange' },
        ]}
      />
      <DataTable
        columns={[
          { key: 'window', label: 'Due Window' },
          { key: 'calibration', label: 'Calibration Due' },
          { key: 'witness', label: 'Witness Assessment Due' },
        ]}
        rows={calibrationDueSchedule}
      />
      <SectionLabel>Flagged Individuals</SectionLabel>
      <Card>
        <GapList items={auditorRiskFlags} empty="No calibration or audit-log gaps right now." />
      </Card>
    </>
  );
}

const sumBy = (rows, keys) =>
  rows.reduce((acc, r) => {
    keys.forEach((k) => { acc[k] = (acc[k] || 0) + r[k]; });
    return acc;
  }, {});

/* ================================================================== */
/* CLIENTS — certificate status by scheme, not a client-by-client list */
/* ================================================================== */
export function ClientPortfolio({ onNavigate }) {
  const t = sumBy(clientsByScheme, ['certifiedClients', 'certificates', 'active', 'withdrawn', 'transferredOut', 'expiringSoon']);
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Operation' }, { label: 'Clients' }]}
        title="Clients"
        sub="The client file and certificate record live in Platform Audit — this is the accreditation-scope exposure they add up to."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Client certification status and certificate lifecycle" />
      <StatRow
        items={[
          { n: t.certifiedClients, l: 'Certified Clients' },
          { n: t.certificates, l: 'Certificates Issued' },
          { n: t.active, l: 'Active', color: 'text-status-green' },
          { n: t.expiringSoon, l: 'Expiring Soon', color: 'text-status-yellow' },
        ]}
      />
      <SectionLabel className="!mt-0">Certificate Status by Scheme</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'certifiedClients', label: 'Certified Clients' },
          { key: 'certificates', label: 'Certificates' },
          { key: 'active', label: 'Active' },
          { key: 'withdrawn', label: 'Withdrawn' },
          { key: 'transferredOut', label: 'Transferred to Other CB' },
          { key: 'expiringSoon', label: 'Expiring Soon' },
        ]}
        rows={clientsByScheme}
      />
      <Note>
        {t.transferredOut} client{t.transferredOut === 1 ? '' : 's'} moved to another CB in the
        current period, {t.withdrawn} withdrew outright. Individual client files and full
        certificate history stay in Platform Audit — this view is scoped to what changes
        accreditation exposure.
      </Note>
    </>
  );
}

/* ================================================================== */
/* AUDITS — volume, mandays and mix by scheme, not an audit log        */
/* ================================================================== */
const deltaPct = (curr, prev) => (prev ? Math.round(((curr - prev) / prev) * 100) : null);

function TrendNote({ curr, prev, label }) {
  const pct = deltaPct(curr, prev);
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <p className={`mb-4 -mt-2 text-[12px] font-medium ${up ? 'text-status-green' : 'text-status-red'}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs last year — {label}
    </p>
  );
}

export function AuditOperations({ onNavigate }) {
  const [period, setPeriod] = useState('thisYear');
  const rows = auditsByPeriod[period];
  const t = sumBy(rows, ['totalAudits', 'mandays', 'new', 'surveillance', 'recertification', 'transferredIn']);
  const lastYearTotal = sumBy(auditsByPeriod.lastYear, ['totalAudits']).totalAudits;
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Operation' }, { label: 'Audits' }]}
        title="Audits"
        sub="Scheduling and execution happen in Platform Audit — this is the volume and mandays load behind accreditation risk, readable by period so a shift in pace shows up as risk, not just a number."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Audit scheduling and execution" />
      <FilterChips options={PERIODS} active={period} onChange={setPeriod} />
      <StatRow
        items={[
          { n: t.totalAudits, l: 'Total Audits' },
          { n: t.mandays, l: 'Total Mandays' },
          { n: t.recertification, l: 'Recertification' },
          { n: t.transferredIn, l: 'Transferred In from Other CB', color: 'text-brand-700' },
        ]}
      />
      <TrendNote curr={sumBy(auditsByPeriod.thisYear, ['totalAudits']).totalAudits} prev={lastYearTotal} label="audit volume, full-year pace" />
      <SectionLabel className="!mt-0">Audit Volume by Scheme & Type</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'totalAudits', label: 'Total Audits' },
          { key: 'mandays', label: 'Mandays' },
          { key: 'new', label: 'New' },
          { key: 'surveillance', label: 'Surveillance' },
          { key: 'recertification', label: 'Recertification' },
          { key: 'transferredIn', label: 'Transferred In' },
        ]}
        rows={rows}
      />
    </>
  );
}

/* ================================================================== */
/* TECHNICAL REVIEW — outcome mix & reviewer leaderboard               */
/* ================================================================== */
export function TechnicalReviewAnalytics({ onNavigate }) {
  const [period, setPeriod] = useState('thisYear');
  const rows = techReviewByPeriod[period];
  const t = sumBy(rows, ['reviewed', 'approved', 'approvedWithNotes', 'rejected']);
  const lastYearTotal = sumBy(techReviewByPeriod.lastYear, ['reviewed']).reviewed;
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Operation' }, { label: 'Technical Review' }]}
        title="Technical Review"
        sub="Assignment and sign-off happen in Platform Audit — the analysis that matters here is quality signal: how often review sends work back, who is carrying the load, and whether that's shifting period over period."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Technical review assignment and sign-off" />
      <FilterChips options={PERIODS} active={period} onChange={setPeriod} />
      <StatRow
        items={[
          { n: t.reviewed, l: 'Total Reviewed' },
          { n: t.approvedWithNotes, l: 'Approved with Notes', color: 'text-status-yellow' },
          { n: t.rejected, l: 'Rejected', color: 'text-status-red' },
          { n: `${trTurnaround.withinSlaPct}%`, l: `Within ${trTurnaround.slaTargetDays}-day SLA (avg ${trTurnaround.avgDays}d)` },
        ]}
      />
      <TrendNote curr={sumBy(techReviewByPeriod.thisYear, ['reviewed']).reviewed} prev={lastYearTotal} label="review volume, full-year pace" />
      <SectionLabel className="!mt-0">Outcome by Scheme</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'approved', label: 'Approved' },
          { key: 'approvedWithNotes', label: 'Approved with Notes' },
          { key: 'rejected', label: 'Rejected' },
        ]}
        rows={rows}
      />
      <SectionLabel>Top Technical Reviewers</SectionLabel>
      <DataTable
        columns={[
          { key: 'name', label: 'Reviewer' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'approvedWithNotes', label: 'Approved with Notes' },
          { key: 'rejected', label: 'Rejected' },
        ]}
        rows={topTechnicalReviewersByPeriod[period]}
      />
    </>
  );
}

/* ================================================================== */
/* CERTIFICATION DECISIONS — mix, decision makers, turnaround vs target*/
/* ================================================================== */
export function CertificationDecisionAnalytics({ onNavigate }) {
  const [period, setPeriod] = useState('thisYear');
  const rows = decisionsByPeriod[period];
  const t = sumBy(rows, ['total', 'certify', 'maintain', 'suspend', 'withdraw']);
  const lastYearTotal = sumBy(decisionsByPeriod.lastYear, ['total']).total;
  const overTarget = decisionTurnaroundByScheme.filter((s) => s.avgDays > s.targetDays);
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Operation' }, { label: 'Certification Decisions' }]}
        title="Certification Decisions"
        sub="The decision record lives in Platform Audit — here it's decision mix, who is deciding, and whether turnaround holds to target, by period so a shift reads as risk."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Certification decisions and certificate issuance" />
      <FilterChips options={PERIODS} active={period} onChange={setPeriod} />
      <StatRow
        items={[
          { n: t.total, l: 'Total Decisions' },
          { n: t.certify, l: 'Certify', color: 'text-status-green' },
          { n: t.suspend, l: 'Suspend', color: 'text-status-orange' },
          { n: t.withdraw, l: 'Withdraw', color: 'text-status-red' },
        ]}
      />
      <TrendNote curr={sumBy(decisionsByPeriod.thisYear, ['total']).total} prev={lastYearTotal} label="decision volume, full-year pace" />
      <SectionLabel className="!mt-0">Decision Mix by Scheme</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'total', label: 'Total' },
          { key: 'certify', label: 'Certify' },
          { key: 'maintain', label: 'Maintain' },
          { key: 'suspend', label: 'Suspend' },
          { key: 'withdraw', label: 'Withdraw' },
        ]}
        rows={rows}
      />
      <SectionLabel>Top Certification Decision Makers</SectionLabel>
      <DataTable
        columns={[
          { key: 'name', label: 'Decision Maker' },
          { key: 'decisions', label: 'Decisions' },
          { key: 'suspend', label: 'Suspend' },
          { key: 'withdraw', label: 'Withdraw' },
        ]}
        rows={topDecisionMakersByPeriod[period]}
      />
      <SectionLabel>Decision Turnaround vs. Target</SectionLabel>
      <DataTable
        columns={[
          { key: 'scheme', label: 'Scheme' },
          { key: 'avgDays', label: 'Avg. Days' },
          { key: 'targetDays', label: 'Target' },
        ]}
        rows={decisionTurnaroundByScheme}
      />
      {overTarget.length > 0 && (
        <Note tone="orange">
          {overTarget.map((s) => s.scheme).join(', ')} averaging above the {overTarget[0].targetDays}-day
          decision turnaround target — see RISK-27001-007 in the Risk Dashboard.
        </Note>
      )}
    </>
  );
}

/* ================================================================== */
/* IMPARTIALITY — conflict declarations, incl. prior employment /      */
/* prior consulting, and why external auditors carry more of it        */
/* ================================================================== */
export function ImpartialityReview({ onNavigate }) {
  const open = impartialityRows.filter((r) => r.status.label === 'Open').length;
  const closed = impartialityRows.filter((r) => r.status.label === 'Closed').length;
  const priorEmployment = impartialityByType.find((t) => t.type.startsWith('Prior Employment'));
  const priorConsulting = impartialityByType.find((t) => t.type.startsWith('Prior Consulting'));
  const [external, organic] = impartialityByAuditorCategory;
  const riskMultiple = (external.ratePer100 / organic.ratePer100).toFixed(1);

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Assurance' }, { label: 'Impartiality' }]}
        title="Impartiality"
        sub="Prior employment and prior consulting are declared by the auditor at assignment time, in Platform Audit — this is where the committee reviews what got declared and whether it clears the audit to proceed."
        onNavigate={onNavigate}
      />
      <IntegrationBanner domain="Auditor conflict-of-interest declarations, captured at assignment" />
      <StatRow
        items={[
          { n: open, l: 'Open Declarations', color: 'text-status-orange' },
          { n: closed, l: 'Resolved', color: 'text-status-green' },
          { n: priorEmployment?.declared ?? 0, l: 'Prior Employment Cases' },
          { n: priorConsulting?.declared ?? 0, l: 'Prior Consulting Cases' },
        ]}
      />

      <SectionLabel className="!mt-0">Declarations by Conflict Type</SectionLabel>
      <DataTable
        columns={[
          { key: 'type', label: 'Conflict Type' },
          { key: 'declared', label: 'Total Declared' },
          { key: 'open', label: 'Still Open' },
        ]}
        rows={impartialityByType}
      />

      <SectionLabel>Declaration Rate by Auditor Category</SectionLabel>
      <p className="mb-3 -mt-1.5 text-[12.5px] text-ink-muted">
        External / non-organic auditors carry materially more conflict exposure per
        assignment than organic (in-house) auditors — the reason a second reviewer or
        closer witness cadence matters more for that pool specifically.
      </p>
      <DataTable
        columns={[
          { key: 'category', label: 'Auditor Category' },
          { key: 'assignments', label: 'Audit Assignments' },
          { key: 'declarations', label: 'Conflict Declarations' },
          { key: 'ratePer100', label: 'Declarations / 100 Assignments' },
        ]}
        rows={impartialityByAuditorCategory}
      />
      <Note tone="orange">
        External auditors declare a conflict roughly <b>{riskMultiple}×</b> more often per
        assignment than organic auditors — treat that pool as the priority safeguard target,
        not an equal-weight sample.
      </Note>

      <SectionLabel>Declared Cases</SectionLabel>
      <DataTable
        columns={[
          { key: 'id', label: 'ID', type: 'mono' },
          { key: 'person', label: 'Personnel' },
          { key: 'category', label: 'Category' },
          { key: 'client', label: 'Client' },
          { key: 'type', label: 'Conflict Type' },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'reviewer', label: 'Reviewed By' },
        ]}
        rows={impartialityRows}
      />
    </>
  );
}

/* ================================================================== */
/* DOCUMENT LIBRARY — required types vs actual documents              */
/* ================================================================== */
export function DocumentLibrary({ ctx, onNavigate }) {
  const { requiredDocTypes, docRows } = ctx;
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Document Library' }]}
        title="Document Library"
        sub="What documents should exist, configured — not what a developer assumed once and never revisited."
        onNavigate={onNavigate}
      />
      <SectionLabel className="!mt-0">Required Document Types</SectionLabel>
      <div className="mb-3 flex justify-end">
        <Button variant="primary" onClick={() => onNavigate('doctype-register')}>
          + Add Required Document Type
        </Button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Document Type' },
          { key: 'appliesTo', label: 'Applies To' },
          { key: 'owner', label: 'Owner' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        rows={requiredDocTypes.map((d) => ({ ...d, owner: 'Document Controller' }))}
      />
      <SectionLabel>Document Library — what actually exists</SectionLabel>
      <Toolbar placeholder="Search documents…" />
      <DataTable
        columns={[
          { key: 'name', label: 'Document' },
          { key: 'type', label: 'Type' },
          { key: 'version', label: 'Version', type: 'mono' },
          { key: 'owner', label: 'Owner' },
          { key: 'status', label: 'Status', type: 'badge' },
          { key: 'reviewed', label: 'Last Reviewed', type: 'mono' },
        ]}
        rows={docRows}
      />
    </>
  );
}

/* ================================================================== */
/* CONFIGURATION FORMS — owned by the Head of Accreditation, not IT   */
/* ================================================================== */
export function RequirementRegister({ ctx, onNavigate }) {
  const { standards, addRequirement } = ctx;
  const [form, setForm] = useState({
    std: standards[0]?.name || '', clause: '', text: '', type: 'Policy',
    mand: 'Mandatory', status: 'Not Assessed',
  });
  const types = ['Policy', 'Process', 'Personnel', 'Competence', 'Impartiality', 'Resource', 'Operational', 'Record', 'Evidence', 'Monitoring', 'Review', 'Effectiveness'];

  const submit = () => {
    const m = form.std.match(/\d+(-\d+)?/);
    addRequirement({
      ref: `REQ-${m ? m[0] : 'NEW'}-${form.clause || '0'}`,
      clause: form.clause || '0',
      std: form.std,
      text: form.text || 'Untitled requirement',
      type: form.type,
      mand: form.mand,
      status: ev(form.status),
    });
    onNavigate('requirements');
  };

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Requirements', route: 'requirements' }, { label: 'Add Requirement' }]}
        title="Add Requirement"
        sub="The atomic unit the readiness engine traverses. Owned by the Head of Accreditation — no code change, no developer ticket."
        onNavigate={onNavigate}
      />
      <Card className="max-w-2xl">
        <FormField label="Standard">
          <select className={inputClass} value={form.std} onChange={(e) => setForm({ ...form, std: e.target.value })}>
            {standards.map((s) => <option key={s.name}>{s.name}</option>)}
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Clause">
            <input className={inputClass} placeholder="e.g. 7.2.3" value={form.clause} onChange={(e) => setForm({ ...form, clause: e.target.value })} />
          </FormField>
          <FormField label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Requirement text">
          <textarea className={`${inputClass} min-h-[80px]`} placeholder="What the clause actually requires" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Mandatory?">
            <select className={inputClass} value={form.mand} onChange={(e) => setForm({ ...form, mand: e.target.value })}>
              <option>Mandatory</option><option>Optional</option>
            </select>
          </FormField>
          <FormField label="Initial status">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['Not Assessed', 'Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Applicable'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <Button variant="primary" onClick={submit}>Add Requirement</Button>
      </Card>
    </>
  );
}

export function StandardRegister({ ctx, onNavigate }) {
  const { addStandard } = ctx;
  const [form, setForm] = useState({ name: '', type: 'Accreditation Standard', clauses: '', desc: '' });
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Standards', route: 'standards' }, { label: 'Add Standard' }]}
        title="Add Standard"
        sub="What the requirement engine needs to know about a standard before any clause can be linked to it."
        onNavigate={onNavigate}
      />
      <Card className="max-w-2xl">
        <FormField label="Standard name & version">
          <input className={inputClass} placeholder="e.g. ISO/IEC 17024:2012" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Accreditation Standard</option><option>Supporting Requirement</option>
            </select>
          </FormField>
          <FormField label="Number of clauses">
            <input type="number" className={inputClass} placeholder="e.g. 35" value={form.clauses} onChange={(e) => setForm({ ...form, clauses: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className={`${inputClass} min-h-[80px]`} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} />
        </FormField>
        <Button
          variant="primary"
          onClick={() => {
            addStandard({
              name: form.name || 'Untitled Standard', type: form.type,
              desc: form.desc || 'No description provided yet.',
              clauses: form.clauses || '0', schemes: '0', status: ev('Active'),
            });
            onNavigate('standards');
          }}
        >
          Add Standard
        </Button>
      </Card>
    </>
  );
}

export function AbRegister({ ctx, onNavigate }) {
  const { addAccreditationBody } = ctx;
  const [form, setForm] = useState({ name: '', full: '', country: '', number: '' });
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Accreditation Bodies', route: 'accreditation-profile' }, { label: 'Add Accreditation Body' }]}
        title="Add Accreditation Body"
        sub="Register a new Accreditation Body so schemes can be linked to it — no code change required."
        onNavigate={onNavigate}
      />
      <Card className="max-w-2xl">
        <FormField label="Short name"><input className={inputClass} placeholder="e.g. JAS-ANZ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FormField>
        <FormField label="Full name"><input className={inputClass} placeholder="e.g. Joint Accreditation System of Australia and New Zealand" value={form.full} onChange={(e) => setForm({ ...form, full: e.target.value })} /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Country"><input className={inputClass} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></FormField>
          <FormField label="Accreditation number"><input className={inputClass} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></FormField>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            addAccreditationBody({
              id: `ab_${Date.now()}`, name: form.name || 'Untitled AB', full: form.full,
              country: form.country || '—', number: form.number || '—',
              since: 'Just added', status: ev('Active'),
            });
            onNavigate('accreditation-profile');
          }}
        >
          Add Accreditation Body
        </Button>
      </Card>
    </>
  );
}

export function DocTypeRegister({ ctx, onNavigate }) {
  const { schemes, schemeOrder, addRequiredDocType } = ctx;
  const options = ['All Schemes', ...schemeOrder.filter((k) => schemes[k].badge !== 'draft').map((k) => schemes[k].name)];
  const [form, setForm] = useState({ name: '', appliesTo: 'All Schemes' });
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Document Library', route: 'document-library' }, { label: 'Add Required Document Type' }]}
        title="Add Required Document Type"
        sub="Define what should exist — the Document Controller tracks fulfillment against this list, not the other way around."
        onNavigate={onNavigate}
      />
      <Card className="max-w-2xl">
        <FormField label="Document type name">
          <input className={inputClass} placeholder="e.g. Complaints & Appeals Procedure" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <FormField label="Applies to">
          <select className={inputClass} value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </FormField>
        <Button
          variant="primary"
          onClick={() => {
            addRequiredDocType({ name: form.name || 'Untitled Document Type', appliesTo: form.appliesTo, status: ev('Missing') });
            onNavigate('document-library');
          }}
        >
          Add Required Document Type
        </Button>
      </Card>
    </>
  );
}

export function SchemeRegister({ ctx, onNavigate }) {
  const { accreditationBodies, standards, addScheme } = ctx;
  const accStds = standards.filter((s) => s.type === 'Accreditation Standard');
  const [form, setForm] = useState({
    name: '', ab: accreditationBodies[0]?.id || '', type: 'Certification', std: accStds[0]?.name || '',
  });
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Accreditation Scope', route: 'accreditation-scope' }, { label: 'Register New Scheme' }]}
        title="Register New Accreditation Scheme"
        sub="Step 1 of 2 — register the basics so the scheme exists and is visible. The full requirement, evidence, and competence configuration happens next."
        onNavigate={onNavigate}
      />
      <Card className="max-w-2xl">
        <FormField label="Scheme name">
          <input className={inputClass} placeholder="e.g. ISO 45001 — Occupational Health & Safety" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Accreditation Body" hint={<span onClick={() => onNavigate('ab-register')} className="cursor-pointer font-medium text-brand-700 hover:underline">+ Register a new Accreditation Body first</span>}>
            <select className={inputClass} value={form.ab} onChange={(e) => setForm({ ...form, ab: e.target.value })}>
              {accreditationBodies.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.full}</option>)}
            </select>
          </FormField>
          <FormField label="Conformity assessment type">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Certification</option><option>Verification</option><option>Validation</option><option>Inspection</option>
            </select>
          </FormField>
        </div>
        <FormField
          label="Primary accreditation standard"
          hint={<>Don't see it? <span onClick={() => onNavigate('standard-register')} className="cursor-pointer font-medium text-brand-700 hover:underline">Add a new standard</span> first.</>}
        >
          <select className={inputClass} value={form.std} onChange={(e) => setForm({ ...form, std: e.target.value })}>
            {accStds.map((s) => <option key={s.name}>{s.name}</option>)}
          </select>
        </FormField>
        <Button
          variant="primary"
          onClick={() => {
            const id = `scheme_${Date.now()}`;
            addScheme(id, {
              name: form.name || 'Untitled Scheme', full: `${form.type} scheme`, ab: form.ab,
              stds: [form.std], clients: 0, badge: 'draft', trend: '',
              pillars: Object.fromEntries(['Requirements', 'Evidence', 'Personnel', 'Competence', 'Operations', 'Documentation', 'Assurance', 'CAPA'].map((p) => [p, 0])),
              tabs: { critical: [], risks: [], evidence: [], competence: [], findings: [] },
            });
            onNavigate('scheme-wizard', id);
          }}
        >
          Register Scheme →
        </Button>
      </Card>
    </>
  );
}

export function SchemeWizard({ schemeKey, ctx, onNavigate }) {
  const { schemes, abName, activateScheme } = ctx;
  const s = schemeKey && schemes[schemeKey] ? schemes[schemeKey] : null;
  const steps = [
    ['Scheme Name', `Name the scheme exactly as it will appear across the platform.${s ? ` — done: "${s.name}"` : ''}`],
    ['Conformity Assessment Type', 'Certification, verification, validation, or inspection.'],
    ['Primary Accreditation Standard', `The standard this scheme is assessed against.${s ? ` — done: ${s.stds[0]}` : ''}`],
    ['Supporting Standards', 'Attach supporting requirement sources, e.g. ISO/IEC 27006-1.'],
    ['IAF / AB Requirements', `Link IAF mandatory documents and ${s ? abName(s.ab) : 'AB'}-specific rules.`],
    ['Competence Criteria', 'Sourced from Platform Audit — link technical area codes rather than re-entering qualifications.'],
    ['Applicable Processes', 'Which lifecycle processes apply. These run in Platform Audit; this tells the readiness engine what is in scope.'],
    ['Evidence Requirements', 'What evidence types and freshness rules count as proof.'],
    ['Assessment Requirements', 'Assessment types, sampling rules, and witness requirements.'],
    ['Activate Scheme', 'Publish. It appears in Accreditation Scope with a live readiness score — no deployment required.'],
  ];
  const done = 3;

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Accreditation Scope', route: 'accreditation-scope' }, { label: s ? s.name : 'Add Scheme' }]}
        title={s ? `Configure ${s.name}` : 'Add New Accreditation Scheme'}
        sub="Step 2 of 2 — a configuration workflow. Activating a scheme here requires no source-code change or deployment."
        onNavigate={onNavigate}
      />
      {s && (
        <Note>
          <b>{s.name}</b> is registered under {abName(s.ab)} and saved as a draft — it already
          appears in Accreditation Scope. Finish the steps below, then activate it to start
          computing a live readiness score.
        </Note>
      )}
      <Card className="mb-4">
        {steps.map(([t, d], i) => (
          <div key={t} className="relative flex gap-3.5 pb-5 last:pb-0">
            {i < steps.length - 1 && <div className="absolute bottom-0 left-[13px] top-7 w-px bg-edge" />}
            <div className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${i < done ? 'border-status-green bg-status-green text-white' : 'border-brand-100 bg-brand-50 text-brand-700'}`}>
              {i < done ? '✓' : i + 1}
            </div>
            <div className="pt-0.5">
              <div className="mb-0.5 text-[13.5px] font-semibold">{t}</div>
              <div className="text-[12.5px] leading-relaxed text-ink-muted">{d}</div>
            </div>
          </div>
        ))}
      </Card>
      <Button variant="primary" onClick={() => s && activateScheme(schemeKey)}>
        Activate Scheme
      </Button>
    </>
  );
}

/* ================================================================== */
/* AI SCREENS — violet-accented, always source-cited                  */
/* ================================================================== */
export function AIScreen({ title, sub, question, answer, sources, disclaimer, crumb, onNavigate }) {
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: crumb }]}
        title={title}
        sub={sub}
        onNavigate={onNavigate}
      />
      <div className="overflow-hidden rounded-xl border border-edge bg-white">
        <div className="flex min-h-[220px] flex-col gap-4 p-5">
          <div className="max-w-[65%] self-end rounded-xl rounded-br-sm bg-brand-700 px-3.5 py-2.5 text-[13.5px] text-white">
            {question}
          </div>
          <div className="thread-h ml-1 w-10 self-start" />
          <div className="max-w-[80%] self-start rounded-xl rounded-bl-sm border border-ai-100 bg-ai-50 px-4 py-3.5 text-[13.5px] leading-relaxed">
            {answer}
            {sources && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="w-full text-2xs font-semibold uppercase tracking-wide text-ai-700">Sourced from</span>
                {sources.map((s) => (
                  <span key={s} className="rounded border border-ai-100 bg-white px-2 py-0.5 text-2xs font-medium text-ai-700">{s}</span>
                ))}
              </div>
            )}
            {disclaimer && <div className="mt-2 text-[11px] italic text-ink-faint">{disclaimer}</div>}
          </div>
        </div>
        <div className="flex gap-2 border-t border-edge p-3.5">
          <div className={`${inputClass} flex-1 text-ink-faint`}>Ask about a requirement, scheme, or clause…</div>
          <Button variant="primary">Ask</Button>
        </div>
      </div>
    </>
  );
}

/* ================================================================== */
/* GENERIC TABLE SCREEN                                               */
/* ================================================================== */
export function TableScreen({ config, onNavigate }) {
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, ...(config.crumb || []), { label: config.title }]}
        title={config.title}
        sub={config.sub}
        actions={config.action && <Button variant="primary" onClick={() => onNavigate(config.action.route)}>{config.action.label}</Button>}
        onNavigate={onNavigate}
      />
      {config.synced && <IntegrationBanner domain={config.synced} />}
      {config.note && <Note>{config.note}</Note>}
      <Toolbar />
      <DataTable columns={config.cols} rows={config.rows} onRowClick={onNavigate} />
    </>
  );
}

/* ================================================================== */
/* INTEGRATIONS                                                       */
/* ================================================================== */
export function Integrations({ onNavigate }) {
  const domains = [
    { name: 'Application & Certification Lifecycle', desc: 'Application review, contract review, audit scheduling, certification decisions, certificate issuance.', synced: 8, status: ev('Active') },
    { name: 'Audit Execution', desc: 'Stage 1/Stage 2 audit records, findings raised during audits, audit reports.', synced: 41, status: ev('Active') },
    { name: 'Technical Review', desc: 'Independent technical review assignment and sign-off before decision.', synced: 3, status: ev('Active') },
    { name: 'Personnel Competency', desc: 'Auditor, lead auditor, technical reviewer qualification, training, authorization records.', synced: 34, status: ev('Active') },
  ];
  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard', route: 'dashboard' }, { label: 'Integrations' }]}
        title="Integrations"
        sub="NexAccred computes accreditation readiness. Platform Audit is the system of record for operational certification activity and personnel competency — this is the boundary between the two."
        onNavigate={onNavigate}
      />
      <Card className="mb-5 flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
          <svg viewBox="0 0 16 16" className="h-5 w-5" fill="none">
            <path d="M6.5 9.5 9.5 6.5M6 4.5 7.5 3a2.5 2.5 0 0 1 3.5 3.5L9.5 8M10 11.5 8.5 13A2.5 2.5 0 0 1 5 9.5L6.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[15px] font-bold">Platform Audit</div>
          <div className="text-[12.5px] text-ink-muted">Connected · 4 data domains synced · Last full sync 12 minutes ago</div>
        </div>
        <Badge level="green">Connected</Badge>
        <Button>Sync Now</Button>
      </Card>
      <SectionLabel className="!mt-0">Synced Data Domains</SectionLabel>
      <DataTable
        columns={[
          { key: 'name', label: 'Domain' },
          { key: 'desc', label: 'Covers' },
          { key: 'synced', label: 'Records Synced' },
          { key: 'status', label: 'Status', type: 'badge' },
        ]}
        rows={domains}
      />
      <Note>
        <b>Design principle:</b> NexAccred does not duplicate application review, audit scheduling,
        technical review, certificate issuance, or auditor competency — Platform Audit already does
        this comprehensively. Those screens here are read-only, clearly marked, and exist only so
        the readiness engine has something to point to when it explains a gap.
      </Note>
    </>
  );
}
