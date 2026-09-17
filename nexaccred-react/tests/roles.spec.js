import { test, expect } from '@playwright/test';
import { ROLES, NAV } from '../src/data/roles.js';

/** Mirrors the filtering logic in components/layout.jsx Sidebar so the test
 *  doesn't hard-code an expected list that can drift from the source of truth. */
function expectedNavLabels(role) {
  const labels = [];
  for (const item of NAV) {
    if (item.group) continue;
    const visible = role.all || role.routes.includes(item.key);
    if (visible) labels.push(item.label);
  }
  return labels;
}

const ALL_LABELS = NAV.filter((i) => !i.group).map((i) => i.label);

/**
 * Readiness-strip visibility per role (Requirements RBAC domain: NoAccess
 * for Impartiality Committee and System Administrator per
 * 05-RBAC-Separation-of-Duties.md §2) is covered in its own dedicated file,
 * tests/readiness-visibility.spec.js — including the never-even-requested
 * assertion for NoAccess roles and the genuine-API-failure error state for
 * authorized roles. Nothing about the strip is asserted here to avoid two
 * files disagreeing about the same behavior.
 */
const DASHBOARD_TITLE = {
  head: 'Executive Dashboard',
  auditor: 'Internal Audit Dashboard',
  impartiality: 'Impartiality Committee Dashboard',
  staff: 'Accreditation Staff Dashboard',
  doccontrol: 'Document Controller Dashboard',
  admin: 'System Administrator Dashboard',
};

for (const role of Object.values(ROLES)) {
  test.describe(`Role: ${role.title}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.getByText(`Sign in as ${role.title}`, { exact: true }).click();
    });

    test('lands on the correct identity in the sidebar', async ({ page }) => {
      const aside = page.locator('aside');
      await expect(aside.getByText(role.name, { exact: true })).toBeVisible();
      await expect(aside.getByText(role.title, { exact: true })).toBeVisible();
    });

    test('sidebar nav matches the role allowlist exactly', async ({ page }) => {
      const nav = page.locator('aside nav');
      const expected = expectedNavLabels(role);

      for (const label of expected) {
        await expect(nav.getByText(label, { exact: true })).toBeVisible();
      }

      const forbidden = ALL_LABELS.filter((l) => !expected.includes(l));
      for (const label of forbidden) {
        await expect(nav.getByText(label, { exact: true })).toHaveCount(0);
      }
    });

    test('every visible nav item renders a real screen with no console errors', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
      });

      const nav = page.locator('aside nav');
      const expected = expectedNavLabels(role);

      for (const label of expected) {
        await nav.getByText(label, { exact: true }).click();
        await expect(page.locator('main')).not.toContainText('not implemented in this prototype');
      }

      // No filtering needed: a NoAccess role never issues the readiness
      // request in the first place (App.jsx's canViewReadiness gate — see
      // readiness-visibility.spec.js), so there's no expected 403 noise to
      // account for here anymore.
      expect(errors, `Unexpected console/page errors:\n${errors.join('\n')}`).toEqual([]);
    });

    test('sidebar "Dashboard" nav item always returns to this role\'s own dashboard', async ({ page }) => {
      // Regression test: the nav item's route key is the generic 'dashboard', but it must
      // resolve to role.dashboard, not always render the Head's Executive Dashboard.
      const nav = page.locator('aside nav');
      const nonDashboardLabel = expectedNavLabels(role).find((l) => l !== 'Dashboard');
      test.skip(!nonDashboardLabel, `${role.title} has no other route to navigate away to`);

      await nav.getByText(nonDashboardLabel, { exact: true }).click();
      await nav.getByText('Dashboard', { exact: true }).click();

      await expect(page.locator('main')).toContainText(DASHBOARD_TITLE[role.id]);
    });

    test('switch role returns to the login screen', async ({ page }) => {
      await page.locator('aside [title="Switch role"]').click();
      await expect(page.getByRole('heading', { name: 'NEXACCRED' })).toBeVisible();
      for (const r of Object.values(ROLES)) {
        await expect(page.getByText(`Sign in as ${r.title}`, { exact: true })).toBeVisible();
      }
    });
  });
}

test.describe('Login screen', () => {
  test('shows all 6 roles, no password field, and authenticates for real against nexaccred-api', async ({ page }) => {
    await page.goto('/');
    for (const role of Object.values(ROLES)) {
      await expect(page.getByText(role.title, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(role.name, { exact: true })).toBeVisible();
    }
    await expect(page.getByText('Signs in against the real nexaccred-api backend', { exact: false })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
  });

  test('shows a clear error and stays on the login screen if the backend rejects the login', async ({ page }) => {
    // Simulates the backend being unreachable/misconfigured — the seed
    // script hasn't run, credentials changed, etc. — rather than assuming
    // the happy path is the only one worth covering.
    await page.route('**/auth/login', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Invalid email or password' }) })
    );
    await page.goto('/');
    await page.getByText('Sign in as Head of Accreditation', { exact: true }).click();
    await expect(page.getByText('Login rejected by the server', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'NEXACCRED' })).toBeVisible();
  });
});
