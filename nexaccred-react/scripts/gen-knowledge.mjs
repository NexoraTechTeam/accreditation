#!/usr/bin/env node
/**
 * Generates src/widget/knowledge.generated.js from the app's own source of
 * truth — src/data/roles.js (NAV, PARENT_NAV, ROLES) and
 * src/screenRegistry.jsx (which routes are actually implemented) — so
 * navigation/role/screen questions never go stale the way a hand-written
 * list would (docs/ai-assistant-widget-rollout-plan.md Fase 2b).
 *
 * Text-regex parsing on purpose, not a JS/JSX AST: these two files are the
 * only inputs, their shape is stable object/array literals, and a full
 * parser dependency is not worth it for two files. Run: node scripts/gen-knowledge.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rolesSrc = readFileSync(path.join(ROOT, 'src/data/roles.js'), 'utf8');
const registrySrc = readFileSync(path.join(ROOT, 'src/screenRegistry.jsx'), 'utf8');

// --- parse roles.js -------------------------------------------------------

function parseNav(src) {
  const block = src.match(/export const NAV = \[([\s\S]*?)\n\];/)[1];
  const items = [];
  for (const m of block.matchAll(/\{\s*(?:group: '([^']+)')?[^}]*?(?:key: '([^']+)')?[^}]*\}/g)) {
    if (m[1]) { items.push({ type: 'group', label: m[1] }); continue; }
    if (!m[2]) continue;
    const entry = m[0];
    const label = (entry.match(/label: '([^']+)'/) || [])[1] || m[2];
    items.push({
      type: 'item',
      key: m[2],
      label,
      synced: /synced:\s*true/.test(entry),
      ai: /ai:\s*true/.test(entry),
    });
  }
  return items;
}

function parseHiddenKeys(src) {
  const m = src.match(/export const HIDDEN_NAV_KEYS = \[([^\]]*)\]/);
  return m ? [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : [];
}

function parseRoles(src) {
  const block = src.match(/export const ROLES = \{([\s\S]*?)\n\};/)[1];
  // Split into one chunk per top-level role entry (`headKey: { ... },` at
  // 2-space indent) rather than one mega-regex — a single regex with
  // several optional groups separated by lazy `[\s\S]*?` silently skips
  // the optional groups whenever skipping still lets the rest match, which
  // is exactly what happened here on first pass (routes: [...] came back
  // empty for every role except `head`, the one role WITHOUT a routes
  // array). Block-splitting avoids that class of bug entirely.
  const starts = [...block.matchAll(/^  \w+: \{\n/gm)].map((m) => m.index);
  const roles = [];
  for (let i = 0; i < starts.length; i++) {
    const chunk = block.slice(starts[i], starts[i + 1] ?? block.length);
    const id = (chunk.match(/id: '([^']+)'/) || [])[1];
    const name = (chunk.match(/name: '([^']+)'/) || [])[1];
    const title = (chunk.match(/title: '([^']+)'/) || [])[1];
    if (!id || !name || !title) continue;
    const all = /\ball: true\b/.test(chunk);
    const routesRaw = (chunk.match(/routes: \[([^\]]*)\]/) || [])[1];
    const routes = routesRaw ? [...routesRaw.matchAll(/'([^']+)'/g)].map((x) => x[1]) : null;
    roles.push({ id, name, title, all, routes });
  }
  return roles;
}

const navRaw = parseNav(rolesSrc);
const hiddenKeys = new Set(parseHiddenKeys(rolesSrc));
const roles = parseRoles(rolesSrc);

if (navRaw.filter((i) => i.type === 'item').length === 0 || roles.length === 0) {
  console.error('gen-knowledge: parsed 0 nav items or 0 roles — roles.js shape probably changed, refusing to emit a broken KB');
  process.exit(1);
}

// --- parse screenRegistry.jsx: which routes are actually implemented ------

const implementedCases = new Set(
  [...registrySrc.matchAll(/case '([^']+)':/g)].map((m) => m[1])
);
const tableConfigBlock = registrySrc.match(/function tableConfigs\(ctx\) \{([\s\S]*)\n\}/)[1];
const tableConfigs = {};
// Hyphenated keys are quoted in the source ('evidence-repository': {...});
// plain identifier keys are not (standards: {...}) — match both.
for (const m of tableConfigBlock.matchAll(/^\s{4}'?([a-zA-Z-]+)'?: \{([\s\S]*?)\n\s{4}\},/gm)) {
  const [, key, body] = m;
  const title = (body.match(/title: '([^']+)'/) || [])[1];
  const sub = (body.match(/sub: '([^']+)'/) || [])[1];
  tableConfigs[key] = { title, sub };
}
const implementedTable = new Set(Object.keys(tableConfigs));

// --- build generated rules --------------------------------------------------

const navItems = navRaw.filter((i) => i.type === 'item');
let currentGroup = null;
const groups = [];
for (const entry of navRaw) {
  if (entry.type === 'group') { currentGroup = { label: entry.label, items: [] }; groups.push(currentGroup); continue; }
  if (!currentGroup) { currentGroup = { label: '(ungrouped)', items: [] }; groups.push(currentGroup); }
  currentGroup.items.push(entry);
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

const rules = [];

// A. nav overview
rules.push({
  id: 'gen-nav-overview',
  // Bare 'menu'/'modul'/'fitur' alongside the phrases: a reviewer asking
  // "Ada menu/modul apa saja?" broke every phrase here (the words are not
  // contiguous) and scored 0 — the same orientation gap found in academy
  // 2026-09-19. A persona/screen-qualified question still outscores this one.
  match: ['menu apa saja', 'ada menu apa', 'daftar menu', 'semua menu', 'nav apa saja',
    'all menu', 'list of menu', 'apa saja route', 'menu', 'modul', 'module',
    'fitur', 'feature', 'navigasi', 'sitemap', 'halaman apa saja'],
  classification: 'ANSWERED_FROM_SOURCE',
  sources: ['CODE'],
  answerText: `${navItems.length} nav item dalam ${groups.length} grup (sumber: src/data/roles.js#NAV): ` +
    groups.map((g) => `${g.label} (${g.items.map((i) => i.label).join(', ')})`).join(' · ') +
    (hiddenKeys.size ? `. Disembunyikan dari sidebar tapi route tetap terdaftar: ${[...hiddenKeys].join(', ')}.` : ''),
});

// B. per-role access
for (const role of roles) {
  const routeList = role.all ? navItems.map((i) => i.key) : (role.routes || []);
  rules.push({
    id: `gen-role-routes-${role.id}`,
    match: [role.id, role.title.toLowerCase(), `sebagai ${role.title.toLowerCase()}`, `akses ${role.id}`],
    classification: 'ANSWERED_FROM_SOURCE',
    sources: ['CODE'],
    answerText: `${role.title} (${role.name}) punya akses ke ${routeList.length} route` +
      (role.all ? ' — semua (all: true di roles.js).' : `: ${routeList.join(', ')}.`) +
      ` (sumber: src/data/roles.js#ROLES.${role.id})`,
  });
}

// C. per-screen implementation status + description
for (const item of navItems) {
  const inCase = implementedCases.has(item.key);
  const inTable = implementedTable.has(item.key);
  const implemented = inCase || inTable;
  const desc = tableConfigs[item.key]?.sub
    || (implemented ? `Layar "${item.label}" ter-render lewat ${inCase ? 'case eksplisit' : 'tableConfigs generik'} di screenRegistry.jsx.` : null);
  rules.push({
    id: `gen-screen-${item.key}`,
    match: [item.key.replace(/-/g, ' '), item.label.toLowerCase(), `layar ${item.label.toLowerCase()}`],
    classification: implemented ? 'ANSWERED_FROM_SOURCE' : 'ANSWERED_FROM_SOURCE',
    sources: ['CODE'],
    answerText: implemented
      ? `${desc || `Layar "${item.label}" real, terdaftar di screenRegistry.jsx.`}` +
        (item.synced ? ' Data disinkronkan dari Platform Audit (flag synced).' : '') +
        (item.ai ? ' Ditandai fitur AI (flag ai) — advisory, bukan keputusan compliance (FR-10).' : '')
      : `Route "${item.key}" (${item.label}) ada di menu tapi TIDAK punya implementasi di screenRegistry.jsx — "not implemented in this prototype" saat dibuka. Ini gap nyata, bukan asumsi widget.`,
  });
}

// --- emit -------------------------------------------------------------

const header = `/**
 * AUTO-GENERATED by scripts/gen-knowledge.mjs from src/data/roles.js +
 * src/screenRegistry.jsx — do not hand-edit. Re-run \`npm run gen:knowledge\`
 * after either source file changes.
 *
 * Manual KB (src/widget/knowledge.js) wins over this file on any tie or
 * higher score — this exists to fill navigation/role/screen questions that
 * the manual 26-intent KB leaves empty, not to compete with it.
 */
`;

const body = `export const GENERATED_RULES = [\n${rules.map((r) => `  {\n` +
  `    id: '${r.id}',\n` +
  `    match: [${r.match.map((k) => `'${esc(k)}'`).join(', ')}],\n` +
  `    classification: '${r.classification}',\n` +
  `    sources: [${r.sources.map((s) => `'${s}'`).join(', ')}],\n` +
  `    answer: () => \`${esc(r.answerText)}\`,\n` +
  `  },\n`).join('')}];\n`;

writeFileSync(path.join(ROOT, 'src/widget/knowledge.generated.js'), header + '\n' + body);
console.log(`gen-knowledge: wrote ${rules.length} rules (1 nav overview, ${roles.length} role, ${navItems.length} screen) to src/widget/knowledge.generated.js`);
