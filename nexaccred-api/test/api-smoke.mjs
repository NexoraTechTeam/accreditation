/**
 * API smoke probe (TDD RED→GREEN for "Could not reach the NexAccred API").
 *
 * Asserts the exact user-visible contract behind the login screen:
 *   1. GET /health  → { status: 'ok' }   (API process reachable)
 *   2. POST /auth/login (seeded Head user) → { accessToken, user }
 *      (DB migrated + seeded, auth + RBAC wiring alive)
 *
 * Run:  node test/api-smoke.mjs [baseUrl]
 * Exit 0 = GREEN, non-zero = RED (message explains which layer is down).
 */
const BASE = process.argv[2] || process.env.NEXACCRED_API_URL || 'http://localhost:3001';
const HEAD_EMAIL = 'joan.marsh@nexaccred.io';
const HEAD_PASSWORD = 'NexAccred123!';

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

try {
  const h = await fetch(`${BASE}/health`);
  const body = await h.json().catch(() => null);
  check('GET /health reachable + status ok', h.ok && body?.status === 'ok', `HTTP ${h.status}`);
} catch (e) {
  check('GET /health reachable + status ok', false, `API down at ${BASE} (${e.cause?.code || e.message}) — is it running?`);
}

try {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: HEAD_EMAIL, password: HEAD_PASSWORD }),
  });
  const body = await r.json().catch(() => null);
  check(
    'POST /auth/login returns accessToken',
    r.ok && typeof body?.accessToken === 'string' && body.accessToken.length > 10,
    `HTTP ${r.status}${body?.message ? `: ${body.message}` : ''}`
  );
} catch (e) {
  check('POST /auth/login returns accessToken', false, `${e.cause?.code || e.message}`);
}

console.log(failures === 0 ? '\nGREEN — API + DB + auth all live' : `\nRED — ${failures} failing check(s)`);
process.exit(failures === 0 ? 0 : 1);
