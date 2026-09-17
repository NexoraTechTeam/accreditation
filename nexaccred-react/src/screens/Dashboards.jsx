import React from 'react';
import ReadinessGauge from '../components/ReadinessGauge';
import SchemeCard from '../components/SchemeCard';
import {
  Card,
  CardHead,
  DataTable,
  GapList,
  StatRow,
  Button,
  Note,
  Badge,
  PlusIcon,
  SparkleIcon,
  LinkIcon,
} from '../components/ui';
import { fmtDate, taskStatus, taskDueLabel } from '../lib/format';
import {
  findingsRows,
  internalAssessRows,
  impartialityRows,
  evidenceRows,
  recordsRows,
  assessmentPackRows,
  auditTrailRows,
  usersRows,
  rolesRows,
} from '../data/records';

/* =================================================================== */
/* HEAD OF ACCREDITATION — the executive view                          */
/* =================================================================== */
export function DashboardHead({ ctx, onNavigate }) {
  const { schemes, schemeOrder, abName, overall, upcoming, thresholds, accreditationBodies } = ctx;

  const nextUp = upcoming.find((u) => u.date);
  const nextScheme = nextUp ? schemes[nextUp.key] : null;
  const activeSchemes = schemeOrder.filter((k) => schemes[k].badge !== 'draft');
  const criticalTotal = activeSchemes.reduce((a, k) => a + schemes[k].tabs.critical.length, 0);
  const majorTotal = activeSchemes.reduce((a, k) => a + schemes[k].tabs.risks.length, 0);

  const whyNotReady = [
    { t: 'Lead auditor competence expired — privacy information management', m: 'REQ-27701-7.2.3 · ISO 27701 · Expired 12 days ago', sev: 'red' },
    { t: 'Risk assessment records missing for Q2 client review cycle', m: 'REQ-27701-8.4 · ISO 27701 · 3 client files affected', sev: 'red' },
    { t: 'CAPA overdue on internal audit finding — impartiality safeguard review', m: 'CAPA-2026-014 · ISO 27001 · Overdue 6 days', sev: 'orange' },
    { t: 'Technical reviewer authorization expiring — GHG quantification scope', m: 'REQ-14064-6.1 · ISO 14064-1 · Expires in 9 days', sev: 'orange' },
  ];

  const fixFirst = [
    { n: '01', t: 'Renew lead auditor competence for the ISO 27701 privacy scope', i: '+6% readiness', w: 'clears the only critical gap blocking ISO 27701' },
    { n: '02', t: 'Upload Q2 risk assessment records for the 3 affected client files', i: '+4% readiness', w: 'removes the last missing-evidence blocker' },
    { n: '03', t: 'Close CAPA-2026-014 — impartiality safeguard root cause is 6 days overdue', i: '+2% readiness', w: 'stops ISO 27001 sliding further before the visit' },
    { n: '04', t: 'Reassign or renew the GHG quantification technical reviewer', i: '+1% readiness', w: 'prevents a second competence expiry' },
  ];

  return (
    <>
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Executive Dashboard</h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Monday, 10 August 2026 · Last recalculated 6 minutes ago
          </p>
        </div>
        <p className="max-w-[260px] text-right text-[12.5px] italic text-ink-faint">
          "If the Accreditation Body comes tomorrow, are we ready?"
        </p>
      </div>

      {/* Hero: gauge + headline counts */}
      <div className="mb-4 grid grid-cols-1 overflow-hidden rounded-xl border border-edge bg-white lg:grid-cols-[300px_1px_1fr]">
        <div className="flex flex-col items-center px-5 pb-2.5 pt-5">
          <div className="mb-1.5 self-start text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Overall Readiness
          </div>
          <ReadinessGauge score={overall.score} band={overall.band} thresholds={thresholds} />
          <p className="mt-2 text-center text-[11.5px] text-ink-faint">
            Across <b className="text-ink-muted">{schemeOrder.length}</b> schemes ·{' '}
            <b className="text-ink-muted">{accreditationBodies.length}</b> accreditation bodies ·{' '}
            <span
              onClick={() => onNavigate('readiness-methodology')}
              className="cursor-pointer font-medium text-brand-700 hover:underline"
            >
              how this is calculated →
            </span>
          </p>
        </div>
        <div className="hidden bg-edge lg:block" />
        <div className="grid grid-cols-2 lg:grid-cols-5">
          {[
            { n: criticalTotal, l: 'Critical Issues', d: `across ${activeSchemes.length} schemes`, c: 'text-status-red', r: 'tasks' },
            { n: majorTotal, l: 'Major Issues', d: 'high risks, all schemes', c: 'text-status-orange', r: 'tasks' },
            { n: 3, l: 'Overdue Actions', d: '2 >5 days late', c: 'text-status-orange', r: 'tasks' },
            { n: 7, l: 'Expiring Evidence', d: 'within 30 days', c: 'text-status-yellow', r: 'evidence-repository' },
            { n: 2, l: 'Competence Risks', d: '1 expired', c: 'text-status-yellow', r: 'personnel-competence' },
          ].map((s, i) => (
            <div
              key={i}
              onClick={() => onNavigate(s.r)}
              className="cursor-pointer border-b border-r border-edge px-4 py-5 last:border-r-0 hover:bg-surface-subtle"
            >
              <div className={`text-[26px] font-bold ${s.c}`}>{s.n}</div>
              <div className="mt-1 text-xs font-medium text-ink-muted">{s.l}</div>
              <div className="text-[11px] text-ink-faint">{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHead title="Accreditation Scope" action="Manage scope →" onAction={() => onNavigate('accreditation-scope')} />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {schemeOrder.map((k) => (
              <SchemeCard key={k} schemeKey={k} ctx={ctx} onNavigate={onNavigate} />
            ))}
          </div>
        </Card>

        <Card>
          <CardHead title="Next Accreditation Assessment" action="Full schedule →" onAction={() => onNavigate('ab-assessment')} />
          <div className="mb-3.5 flex flex-wrap gap-2.5">
            <span className="rounded-lg border border-edge bg-surface-subtle px-2.5 py-1.5 text-[11.5px] text-ink-muted">
              Type: <b className="text-ink">{nextUp?.type || '—'}</b>
            </span>
            <span className="rounded-lg border border-edge bg-surface-subtle px-2.5 py-1.5 text-[11.5px] text-ink-muted">
              Scheme: <b className="text-ink">{nextScheme?.name || '—'}</b>
            </span>
            <span className="rounded-lg border border-edge bg-surface-subtle px-2.5 py-1.5 text-[11.5px] text-ink-muted">
              AB: <b className="text-ink">{nextScheme ? abName(nextScheme.ab) : '—'}</b>
            </span>
          </div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-[40px] font-extrabold leading-none tracking-tight text-brand-700">
              {nextUp?.days ?? '—'}
            </span>
            <span className="text-[13px] font-medium text-ink-muted">days remaining</span>
          </div>
          <p className="mb-4 text-[12.5px] text-ink-muted">
            {nextUp ? `Scheduled ${fmtDate(nextUp.date)}` : 'No assessment scheduled'}
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {[
              { n: nextUp?.score != null ? `${nextUp.score}%` : '—', l: 'Assessment Readiness', c: '' },
              { n: nextScheme?.tabs.critical.length ?? 0, l: 'Critical Gaps', c: 'text-status-red' },
              { n: nextScheme?.tabs.risks.length ?? 0, l: 'High Risks', c: 'text-status-orange' },
              { n: 1, l: 'Open CAPA', c: '' },
            ].map((k, i) => (
              <div key={i} className="rounded-lg border border-edge px-3 py-2.5">
                <div className={`text-lg font-bold ${k.c}`}>{k.n}</div>
                <div className="mt-px text-[11px] text-ink-faint">{k.l}</div>
              </div>
            ))}
          </div>
          <Button variant="primary" className="w-full justify-center" onClick={() => onNavigate('assessment-prep', nextUp?.key)}>
            <PlusIcon className="h-3.5 w-3.5" /> Prepare for Assessment
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Why aren't we ready?" action="All issues →" onAction={() => onNavigate('scheme-detail', 'iso27701')} />
          <GapList items={whyNotReady} />
        </Card>
        <Card>
          <CardHead title="What should we fix first?" action="Open task board →" onAction={() => onNavigate('tasks')} />
          <div className="flex flex-col gap-3">
            {fixFirst.map((f) => (
              <div key={f.n} className="flex gap-3">
                <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700">
                  {f.n}
                </div>
                <div>
                  <div className="mb-0.5 text-[13px] font-medium">{f.t}</div>
                  <div className="text-[11.5px] font-semibold text-status-green">
                    {f.i} <span className="font-normal text-ink-faint">· {f.w}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex items-start gap-2 rounded-lg border border-ai-100 bg-ai-50 p-3 text-xs text-ai-700">
            <SparkleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <b>AI Readiness Advisor:</b> ranked by readiness-score impact and days-to-assessment.
              Every item links to its source requirement — this doesn't make the compliance
              decision, it points you to what will.
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

/* =================================================================== */
/* INTERNAL AUDITOR                                                    */
/* =================================================================== */
export function DashboardAuditor({ onNavigate }) {
  const mine = findingsRows.filter((f) => f.source === 'Internal Audit');
  const open = mine.filter((f) => f.status.label !== 'Closed').length;
  const closed = mine.filter((f) => f.status.label === 'Closed').length;

  return (
    <>
      <DashHeader title="Internal Audit Dashboard" who="Maria Santos · Internal Auditor" />
      <StatRow
        items={[
          { n: open, l: 'Open Findings (mine)', color: 'text-status-orange' },
          { n: closed, l: 'Closed This Cycle', color: 'text-status-green' },
          { n: internalAssessRows.filter((r) => r.status.label !== 'Closed').length, l: 'Internal Assessments Scheduled', color: 'text-status-yellow' },
          { n: new Set(mine.map((f) => f.scheme)).size, l: 'Schemes Covered' },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="My Findings" action="All findings →" onAction={() => onNavigate('findings')} />
          <DataTable
            columns={[
              { key: 'id', label: 'ID', type: 'mono' },
              { key: 'ref', label: 'Requirement', type: 'mono' },
              { key: 'scheme', label: 'Scheme' },
              { key: 'status', label: 'Status', type: 'badge' },
              { key: 'due', label: 'Due', type: 'mono' },
            ]}
            rows={mine}
          />
        </Card>
        <Card>
          <CardHead title="Internal Assessment Calendar" action="Full calendar →" onAction={() => onNavigate('internal-assessment')} />
          <DataTable
            columns={[
              { key: 'id', label: 'ID', type: 'mono' },
              { key: 'scope', label: 'Scope' },
              { key: 'date', label: 'Date', type: 'mono' },
              { key: 'status', label: 'Status', type: 'badge' },
            ]}
            rows={internalAssessRows}
          />
        </Card>
      </div>
      <Card className="mt-4">
        <CardHead title="Quick Actions" />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => onNavigate('gap-analysis')}>Run Gap Analysis</Button>
          <Button onClick={() => onNavigate('capa')}>Review CAPA</Button>
          <Button onClick={() => onNavigate('risk')}>Review Risk Register</Button>
        </div>
      </Card>
    </>
  );
}

/* =================================================================== */
/* IMPARTIALITY COMMITTEE — the most restricted role, by design        */
/* =================================================================== */
export function DashboardImpartiality({ onNavigate }) {
  const open = impartialityRows.filter((r) => r.status.label === 'Open').length;
  const closed = impartialityRows.filter((r) => r.status.label === 'Closed').length;

  return (
    <>
      <DashHeader title="Impartiality Committee Dashboard" who="K. Devi · Impartiality Committee" />
      <StatRow
        items={[
          { n: open, l: 'Open Declarations', color: 'text-status-orange' },
          { n: closed, l: 'Resolved This Quarter', color: 'text-status-green' },
          { n: 0, l: 'Escalated to Committee Vote' },
          { n: 1, l: 'Impartiality Safeguard CAPA Open', color: 'text-status-red' },
        ]}
      />
      <Card className="mb-4">
        <CardHead title="Declarations Needing Review" action="All declarations →" onAction={() => onNavigate('impartiality')} />
        <DataTable
          columns={[
            { key: 'id', label: 'ID', type: 'mono' },
            { key: 'person', label: 'Personnel' },
            { key: 'client', label: 'Client' },
            { key: 'type', label: 'Conflict Type' },
            { key: 'status', label: 'Status', type: 'badge' },
          ]}
          rows={impartialityRows}
        />
      </Card>
      <Card>
        <CardHead title="Impartiality Safeguard Watch" />
        <GapList
          items={[
            {
              t: 'Impartiality safeguard corrective action overdue — CAPA-2026-014',
              m: 'REQ-17021-5.2 · ISO 27001 · Overdue 6 days · Owner: T. Reyes',
              sev: 'red',
            },
          ]}
        />
      </Card>
    </>
  );
}

/* =================================================================== */
/* ACCREDITATION STAFF                                                 */
/* =================================================================== */
export function DashboardStaff({ ctx, onNavigate }) {
  const { schemes, schemeOrder, tasks, abName } = ctx;
  const drafts = schemeOrder.filter((k) => schemes[k].badge === 'draft');
  const openTasks = tasks
    .map((t) => ({ ...t, computed: taskStatus(t) }))
    .filter((t) => t.computed.label !== 'Done')
    .sort((a, b) => new Date(a.due) - new Date(b.due))
    .slice(0, 6);

  return (
    <>
      <DashHeader title="Accreditation Staff Dashboard" who="Rahayu Ningsih · Accreditation Staff" />
      <StatRow
        items={[
          { n: openTasks.length, l: 'Open Tasks (top of queue)' },
          { n: drafts.length, l: 'Schemes In Setup', color: 'text-status-yellow' },
          { n: 746, l: 'Application Review Backlog' },
          { n: 154, l: 'Scheduling Queue' },
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Open Tasks — nearest due first" action="Full task board →" onAction={() => onNavigate('tasks')} />
          <DataTable
            columns={[
              { key: 'title', label: 'Task' },
              { key: 'due', label: 'Due' },
              { key: 'status', label: 'Status', type: 'badge' },
            ]}
            rows={openTasks.map((t) => ({ title: t.title, due: taskDueLabel(t), status: t.computed }))}
          />
        </Card>
        <Card>
          <CardHead title="Schemes In Setup" action="Accreditation Scope →" onAction={() => onNavigate('accreditation-scope')} />
          {drafts.length ? (
            <GapList
              items={drafts.map((k) => ({
                t: schemes[k].name,
                m: `${abName(schemes[k].ab)} · Continue the configuration wizard`,
                sev: 'yellow',
              }))}
            />
          ) : (
            <div className="py-6 text-center text-[12.5px] text-ink-faint">
              No schemes currently mid-setup.
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

/* =================================================================== */
/* DOCUMENT CONTROLLER                                                 */
/* =================================================================== */
export function DashboardDocControl({ onNavigate }) {
  const needsAttention = evidenceRows.filter(
    (e) => e.status.label === 'Missing' || e.status.label === 'Expired'
  );
  const pendingRecords = recordsRows.filter((r) => r.status.label !== 'Verified');
  const packIncomplete = assessmentPackRows.filter((p) => p.status.label !== 'Verified');

  return (
    <>
      <DashHeader title="Document Controller Dashboard" who="Helda Mutiara · Document Controller" />
      <StatRow
        items={[
          { n: 10, l: 'Documents & Records Active' },
          { n: needsAttention.length, l: 'Evidence Missing / Expired', color: 'text-status-red' },
          { n: pendingRecords.length, l: 'Records Pending Verification', color: 'text-status-yellow' },
          { n: `${packIncomplete.length}/${assessmentPackRows.length}`, l: 'Assessment Pack Items Incomplete' },
        ]}
      />
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHead title="Evidence Needing Attention" action="Full repository →" onAction={() => onNavigate('evidence-repository')} />
          <DataTable
            columns={[
              { key: 'id', label: 'ID', type: 'mono' },
              { key: 'ref', label: 'Requirement', type: 'mono' },
              { key: 'status', label: 'Status', type: 'badge' },
              { key: 'scheme', label: 'Scheme' },
            ]}
            rows={needsAttention}
          />
        </Card>
        <Card>
          <CardHead title="Records Pending Verification" action="All records →" onAction={() => onNavigate('records')} />
          <DataTable
            columns={[
              { key: 'name', label: 'Record' },
              { key: 'owner', label: 'Owner' },
              { key: 'status', label: 'Status', type: 'badge' },
            ]}
            rows={pendingRecords}
          />
        </Card>
      </div>
      <Card>
        <CardHead title="Assessment Pack Completeness" action="Open evidence pack →" onAction={() => onNavigate('assessment-pack')} />
        <DataTable
          columns={[
            { key: 'ref', label: 'Requirement', type: 'mono' },
            { key: 'topic', label: 'Topic' },
            { key: 'items', label: 'Items' },
            { key: 'status', label: 'Status', type: 'badge' },
          ]}
          rows={assessmentPackRows}
        />
      </Card>
    </>
  );
}

/* =================================================================== */
/* SYSTEM ADMINISTRATOR — deliberately has no readiness content        */
/* =================================================================== */
export function DashboardAdmin({ onNavigate }) {
  const activeUsers = usersRows.filter((u) => u.status.label === 'Active').length;

  return (
    <>
      <DashHeader title="System Administrator Dashboard" who="R. Alvi · System Administrator" />
      <Note>
        <b>This is not a super admin account.</b> Per the Roles matrix, System Administrator has
        no access to Accreditation Bodies, Schemes, Standards, Requirements, Evidence, Personnel,
        Findings/CAPA/Risk, or Reporting — every one of those is the Head of Accreditation's call,
        not IT's. This account only manages who can log in, what they're allowed to touch, and
        what external systems are connected.
      </Note>
      <StatRow
        items={[
          { n: usersRows.length, l: 'Total User Accounts' },
          { n: activeUsers, l: 'Active', color: 'text-status-green' },
          { n: 4, l: 'Data Domains Synced (Platform Audit)' },
          { n: rolesRows.length, l: 'Roles Configured' },
        ]}
      />
      <div className="mb-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHead title="Recent Audit Trail" action="Full trail →" onAction={() => onNavigate('audit-trail')} />
          <DataTable
            columns={[
              { key: 'ts', label: 'Timestamp', type: 'mono' },
              { key: 'user', label: 'User' },
              { key: 'action', label: 'Action' },
              { key: 'entity', label: 'Entity' },
            ]}
            rows={auditTrailRows}
          />
        </Card>
        <Card>
          <CardHead title="Integration Status" action="Manage →" onAction={() => onNavigate('integrations')} />
          <div className="mb-3.5 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-brand-50 text-brand-700">
              <LinkIcon className="h-[18px] w-[18px]" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">Platform Audit</div>
              <div className="text-xs text-ink-muted">Connected · 4 data domains synced</div>
            </div>
            <Badge level="green">Connected</Badge>
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            Application & Certification Lifecycle, Audit Execution, Technical Review, and
            Personnel Competency all sync from here.
          </p>
        </Card>
      </div>
      <Card>
        <CardHead title="Quick Actions" />
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => onNavigate('users')}>Manage Users</Button>
          <Button onClick={() => onNavigate('roles')}>Manage Roles</Button>
          <Button onClick={() => onNavigate('workflow')}>Workflow Config</Button>
          <Button onClick={() => onNavigate('integrations')}>Integrations</Button>
        </div>
      </Card>
    </>
  );
}

function DashHeader({ title, who }) {
  return (
    <div className="mb-5">
      <h1 className="text-[22px] font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1 text-[13px] text-ink-muted">Signed in as {who}</p>
    </div>
  );
}
