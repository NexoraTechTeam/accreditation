const { chromium } = require('playwright');

const ACCRED_URL = 'http://localhost:5173';
const ACADEMY_URL = 'http://127.0.0.1:4173/lsp-unified-app.html';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  let pass = 0, fail = 0;

  const ok = (label) => { pass++; console.log(`  ✅ ${label}`); };
  const fail_ = (label, err) => { fail++; console.log(`  ❌ ${label}: ${err.message || err}`); };

  // Helper: login and return page
  async function loginAccred() {
    const page = await context.newPage();
    await page.goto(ACCRED_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.locator('text=Sign in as Head of Accreditation').first().click({ timeout: 5000 });
    await page.waitForTimeout(3000);
    return page;
  }

  // ========================================================================
  // ACCREDITATION TESTS
  // ========================================================================
  console.log('\n🔷 Accreditation (NexAccred) Tests\n');

  // 1. Login screen renders
  try {
    const page = await context.newPage();
    await page.goto(ACCRED_URL, { waitUntil: 'networkidle', timeout: 15000 });
    const body = await page.textContent('body');
    if (body.includes('NEXACCRED') && body.includes('Sign in as')) {
      ok('Login screen renders with role cards');
    } else {
      fail_('Login screen renders', 'NEXACCRED/Sign in as not found');
    }
    await page.close();
  } catch (e) { fail_('Login screen renders', e); }

  // 2. Login as Head
  let accredPage;
  try {
    accredPage = await loginAccred();
    const body = await accredPage.textContent('body');
    if (body.includes('Dashboard') || body.includes('Readiness') || body.includes('Scheme')) {
      ok('Login as Head → Dashboard');
    } else {
      fail_('Login as Head', 'No dashboard content');
    }
  } catch (e) { fail_('Login as Head', e); }

  // 3. Schemes table shows API data
  if (accredPage) {
    try {
      const schemesNav = await accredPage.locator('nav >> text=Schemes, [class*=nav] >> text=Schemes, aside >> text=Schemes').first();
      if (await schemesNav.isVisible({ timeout: 3000 }).catch(() => false)) {
        await schemesNav.click();
      } else {
        // Fallback: click any "Schemes" text in sidebar
        await accredPage.locator('text=Schemes').first().click({ timeout: 3000 });
      }
      await accredPage.waitForTimeout(2000);
      const body = await accredPage.textContent('body');
      if (body.includes('ISO 9001') || body.includes('ISO 14001') || body.includes('Scheme Management')) {
        ok('Schemes table shows API data');
      } else {
        fail_('Schemes table', 'No ISO schemes visible');
      }
    } catch (e) { fail_('Schemes table', e); }
  }

  // 4. Readiness score
  if (accredPage) {
    try {
      const body = await accredPage.textContent('body');
      if (body.match(/\d+%/)) {
        ok('Readiness score visible');
      } else {
        fail_('Readiness score', 'No percentage');
      }
    } catch (e) { fail_('Readiness score', e); }
  }

  // 5. Screenshot dashboard
  if (accredPage) {
    try {
      await accredPage.screenshot({ path: '/tmp/accred-dashboard.png', fullPage: false });
      ok('Dashboard screenshot saved');
    } catch (e) { fail_('Dashboard screenshot', e); }
  }

  if (accredPage) await accredPage.close();

  // ========================================================================
  // ACADEMY TESTS
  // ========================================================================
  console.log('\n🔷 Academy (DeAcademy) Tests\n');

  try {
    const page = await context.newPage();
    await page.goto(ACADEMY_URL, { waitUntil: 'networkidle', timeout: 15000 });
    const body = await page.textContent('body');
    if (body.includes('DeAcademy') || body.includes('Training') || body.includes('Login')) {
      ok('Academy loads');
    } else {
      fail_('Academy loads', 'No expected content');
    }
    await page.close();
  } catch (e) { fail_('Academy loads', e); }

  try {
    const page = await context.newPage();
    await page.goto(ACADEMY_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    const roles = ['participant', 'operator', 'admin', 'tutor', 'corporate'];
    const found = roles.filter(r => body.toLowerCase().includes(r));
    if (found.length >= 2) ok(`Role cards: ${found.join(', ')}`);
    else fail_('Role cards', `Found: ${found.join(', ')}`);
    await page.close();
  } catch (e) { fail_('Role cards', e); }

  try {
    const page = await context.newPage();
    await page.goto(ACADEMY_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Training') || body.includes('Course') || body.includes('Catalog')) ok('Training content visible');
    else fail_('Training content', 'Not found');
    await page.close();
  } catch (e) { fail_('Training content', e); }

  try {
    const page = await context.newPage();
    await page.goto(ACADEMY_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    if (body.includes('Certification') || body.includes('Exam') || body.includes('Question')) ok('Certification content visible');
    else fail_('Certification content', 'Not found');
    await page.close();
  } catch (e) { fail_('Certification content', e); }

  try {
    const page = await context.newPage();
    await page.goto(ACADEMY_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/academy-landing.png', fullPage: false });
    ok('Academy screenshot saved');
    await page.close();
  } catch (e) { fail_('Academy screenshot', e); }

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Results: ${pass} passed, ${fail} failed, ${pass + fail} total`);
  console.log(`${'='.repeat(50)}\n`);

  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
