import { test, expect } from '@playwright/test';
import { ROLES } from '../src/data/roles.js';

/**
 * The readiness strip (components/layout.jsx's ReadinessStrip) is gated on
 * the backend's Requirements RBAC domain (nexaccred-api's SchemesController
 * requires at least View there for GET /readiness/*). Per
 * 05-RBAC-Separation-of-Duties.md §2, Impartiality Committee and System
 * Administrator hold NoAccess on Requirements; the other four roles hold at
 * least View.
 *
 * The product decision this file verifies (see App.jsx's `canViewReadiness`
 * comment): a NoAccess role must never see the strip AT ALL — not a score,
 * not an error box, nothing — and must never even issue the request, since
 * doing so and catching the resulting 403 would still be telling that role
 * "there is a number here, you're just blocked from it." The graceful
 * "Readiness unavailable" error state is reserved for an AUTHORIZED role
 * hitting a genuinely broken backend (down, 500, network failure) — that
 * case is also covered here, distinctly from the RBAC case.
 */
const AUTHORIZED_ROLES = ['head', 'auditor', 'staff', 'doccontrol']; // Requirements: Edit or View
const UNAUTHORIZED_ROLES = ['impartiality', 'admin']; // Requirements: NoAccess

async function loginAs(page, roleId) {
  await page.goto('/');
  await page.getByText(`Sign in as ${ROLES[roleId].title}`, { exact: true }).click();
}

for (const roleId of AUTHORIZED_ROLES) {
  const role = ROLES[roleId];

  test(`${role.title} (Requirements access): sees the readiness strip with real data`, async ({ page }) => {
    const readinessRequests = [];
    page.on('request', (req) => {
      if (req.url().includes('/readiness/')) readinessRequests.push(req.url());
    });

    await loginAs(page, roleId);

    const strip = page.locator('.border-l-\\[3px\\]').first();
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('Overall Accreditation Readiness:');
    await expect(strip).not.toContainText('Readiness unavailable');

    expect(readinessRequests.some((u) => u.includes('/readiness/overall'))).toBe(true);
  });

  test(`${role.title}: when the backend is genuinely unavailable, the strip shows a graceful error, not a crash`, async ({ page }) => {
    await page.route('**/readiness/overall', (route) => route.abort('connectionrefused'));

    await loginAs(page, roleId);

    const strip = page.locator('.border-l-\\[3px\\]').first();
    await expect(strip).toBeVisible();
    await expect(strip).toContainText('Readiness unavailable');
    // The rest of the app must still be usable — this is a partial-failure
    // error state, not a whole-page crash.
    await expect(page.locator('aside')).toBeVisible();
  });
}

for (const roleId of UNAUTHORIZED_ROLES) {
  const role = ROLES[roleId];

  test(`${role.title} (Requirements: NoAccess): never sees the readiness strip, and never requests it`, async ({ page }) => {
    const readinessRequests = [];
    page.on('request', (req) => {
      if (req.url().includes('/readiness/')) readinessRequests.push(req.url());
    });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loginAs(page, roleId);
    // Give any (unwanted) fetch a moment to fire before asserting it didn't.
    await page.waitForTimeout(500);

    const strip = page.locator('.border-l-\\[3px\\]');
    await expect(strip).toHaveCount(0);
    await expect(page.getByText('Readiness unavailable', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Overall Accreditation Readiness:', { exact: false })).toHaveCount(0);

    expect(readinessRequests, 'a NoAccess role must never request /readiness/* at all').toEqual([]);

    // No RBAC-403 noise either, since the request that would 403 was never made.
    const rbacNoise = consoleErrors.filter((e) => e.includes('readiness') && e.includes('403'));
    expect(rbacNoise).toEqual([]);
  });

  test(`${role.title}: the rest of their purpose-built dashboard still renders normally without the strip`, async ({ page }) => {
    await loginAs(page, roleId);
    await expect(page.locator('main')).toContainText(`${role.title} Dashboard`);
  });
}

test('a role that gains Requirements access mid-session would see the strip after their next login (documents the token-claims trade-off)', async ({ page }) => {
  // Not a live permission-change test (that's covered at the API level in
  // nexaccred-api's crud-modules.e2e-spec.ts self-escalation guard tests) —
  // this just documents, via the auditor role's already-granted View level,
  // that logging in fresh is what picks up current permissions, consistent
  // with application/auth/jwt-claims.ts's stated trade-off (permissions are
  // embedded at login time, not re-checked from the DB per request).
  await loginAs(page, 'auditor');
  const strip = page.locator('.border-l-\\[3px\\]').first();
  await expect(strip).toBeVisible();
  await expect(strip).toContainText('Overall Accreditation Readiness:');
});
