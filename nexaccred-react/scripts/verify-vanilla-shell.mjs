#!/usr/bin/env node
/**
 * Fase 3 gate (docs/ai-assistant-widget-rollout-plan.md): prove widget/core/
 * + rr-vanilla.js work against a fake host DOM shaped like academy's real
 * one — BEFORE academy's actual 92-test-guarded bundle is ever touched.
 * Academy no longer has a service-desk dry run ahead of it to catch a
 * core-level mistake cheaply, so this fixture is that cheap catch instead.
 *
 * Serves src/widget/ over a local static server (ES module imports need a
 * real origin, not file://) and drives it headless via Playwright.
 *
 * Run: node scripts/verify-vanilla-shell.mjs   (exit 0 = GREEN)
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WIDGET_DIR = path.join(ROOT, 'src/widget');

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript' };

const server = http.createServer(async (req, res) => {
  // Fake collector endpoint: this fixture tests shell mechanics, not
  // collector-outage behavior (that's the Fase 1 connectivity-loss drill,
  // run separately against the real nginx+collector path). A real 404 here
  // would test an artifact of this minimal static server, not the app.
  if (req.url === '/widget-feedback/collect' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ accepted: 1, duplicate: 0 }));
    return;
  }
  try {
    const filePath = path.join(WIDGET_DIR, decodeURIComponent(req.url.split('?')[0]));
    const body = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));

await page.goto(`http://127.0.0.1:${port}/core/__fixtures__/fake-host.html`, { waitUntil: 'networkidle' });
check('widget mounted without throwing', await page.evaluate(() => window.__mounted === true));

// Shell renders inside its own shadow root, not the light DOM — proves
// style isolation from the (fake) host page.
const shadowHostCount = await page.evaluate(() => {
  return [...document.body.children].filter((el) => el.shadowRoot).length;
});
check('widget attaches its own shadow root', shadowHostCount === 1);

const clickFab = () => page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  host.shadowRoot.querySelector('.fab').click();
});
const shadowText = () => page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  return host.shadowRoot.textContent;
});
const shadowQuery = (sel) => page.evaluateHandle((s) => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  return host.shadowRoot.querySelector(s);
}, sel);

await clickFab(); // open
check('identity gate shown on first open (no identity yet)', (await shadowText()).includes('Sebelum mulai'));

await (await shadowQuery('input')).evaluate((n) => { n.value = 'Fixture Reviewer'; n.dispatchEvent(new Event('input')); });
const inputs = await page.evaluateHandle(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  return [...host.shadowRoot.querySelectorAll('input')];
});
await page.evaluate((inputsHandle) => {
  inputsHandle[0].value = 'Fixture Reviewer';
  inputsHandle[1].value = 'fixture@example.com';
}, inputs);
await (await shadowQuery('button.primary')).click();
check('identity gate cleared after valid submission', !(await shadowText()).includes('Sebelum mulai'));

// Ask flow -> knowledge engine -> gate tab -> checklist -> sign-off refusal
await page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  const input = host.shadowRoot.querySelector('input');
  input.value = 'bagaimana readiness dihitung?';
  [...host.shadowRoot.querySelectorAll('button')].find((b) => b.textContent === 'Kirim').click();
});
check('question answered via the injected knowledge engine', (await shadowText()).includes('fake readiness answer'));

await page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  [...host.shadowRoot.querySelectorAll('button')].find((b) => b.textContent === 'Readiness').click();
});
check('gate starts unpassed', (await shadowText()).includes('GATE NOT PASSED'));

await page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  [...host.shadowRoot.querySelectorAll('button')].find((b) => b.textContent === 'Sign-off (APPROVED)').click();
});
check('sign-off refused while gate unpassed, with the exact reason format', /coverage \d+%, \d+ open blocker/.test(await shadowText()));

// One click at a time with a FRESH query each time — rr-vanilla.js re-
// renders (replaces) the DOM on every store change, same as a real user
// clicking checkboxes one at a time on the live page; batch-iterating a
// NodeList snapshotted before the first click races the re-render and
// clicks stale, detached nodes for every checkbox after the first.
for (let i = 0; i < 2; i++) {
  await page.evaluate(() => {
    const host = [...document.body.children].find((el) => el.shadowRoot);
    const cb = [...host.shadowRoot.querySelectorAll('input[type=checkbox]')].find((c) => !c.checked);
    if (cb) cb.click();
  });
}
check('checking both fake areas passes the gate', (await shadowText()).includes('GATE PASSED'));

await page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  [...host.shadowRoot.querySelectorAll('button')].find((b) => b.textContent === 'Sign-off (APPROVED)').click();
});
// Sign-off attributes to the CONTEXT reviewer (persona, "Dinda Pramesti" from
// the fake host's account button) -- not the separately-collected identity
// ("Fixture Reviewer"). Same split as accreditation's ReadinessTab: identity
// is who is really using the widget; reviewer/persona is who they're
// signing off as, and those are deliberately two different things.
check('sign-off succeeds once the gate passes', (await shadowText()).includes('APPROVED oleh Dinda Pramesti'));

// Trail tab + collector wiring (no real collector running here -> outbox
// stays queued, never thrown/logged -- exactly the failure mode academy
// will hit if the collector is briefly unreachable).
await page.evaluate(() => {
  const host = [...document.body.children].find((el) => el.shadowRoot);
  [...host.shadowRoot.querySelectorAll('button')].find((b) => b.textContent === 'Jejak saya').click();
});
check('trail tab shows the fixture identity', (await shadowText()).includes('fixture@example.com'));
check('unreachable collector queues silently (no console.error)', errors.length === 0, errors.join(' | '));

check('zero console/page errors across the whole run', errors.length === 0, errors.join(' | '));

console.log(failures === 0 ? '\nGREEN (vanilla shell fixture)' : `\nRED (vanilla shell fixture) — ${failures} failing`);
await browser.close();
server.close();
process.exit(failures === 0 ? 0 : 1);
