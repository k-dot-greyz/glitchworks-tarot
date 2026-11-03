// Screenshots + network/a11y checks for the PR decision surface.
// Usage: npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort &
//        node scripts/pr-surface-screens.mjs <outDir>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const OUT = process.argv[2] || 'screenshots';
fs.mkdirSync(OUT, { recursive: true });
const origin = new URL(BASE).origin;
const report = {
  base: BASE,
  requests: [],
  foreign: [],
  consoleErrors: [],
  minFontPx: {},
  checks: {},
};

const track = (page, tag) => {
  page.on('request', (req) => {
    const u = req.url();
    report.requests.push(`${tag} ${req.method()} ${u.slice(0, 120)}`);
    if (!u.startsWith('data:') && !u.startsWith('blob:') && new URL(u).origin !== origin)
      report.foreign.push(`${tag} ${u}`);
  });
  page.on('console', (m) => m.type() === 'error' && report.consoleErrors.push(`${tag} ${m.text()}`));
  page.on('pageerror', (e) => report.consoleErrors.push(`${tag} pageerror ${e.message}`));
};

const minFont = (page, selector) =>
  page.evaluate((sel) => {
    let min = Infinity;
    let where = '';
    for (const root of document.querySelectorAll(sel)) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        if (el.closest('.sr-only')) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < min) {
          min = px;
          where = n.textContent.trim().slice(0, 40);
        }
      }
    }
    return { min, where };
  }, selector);

const browser = await chromium.launch({ headless: true });

// (a) desktop 1280x800
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  track(page, 'desktop');
  await page.goto(`${BASE}/?view=prs`, { waitUntil: 'networkidle' });
  await page.getByTestId('pr-spread').waitFor();
  report.checks.headerText = await page.locator('#pr-spread-title + p').textContent();
  await page.screenshot({ path: path.join(OUT, 'a-desktop-1280x800.png') });
  await page.screenshot({
    path: path.join(OUT, 'a-desktop-1280x800-full.png'),
    fullPage: true,
  });
  report.minFontPx.desktopSpread = await minFont(page, '[data-testid="pr-spread"]');

  // nav entry reachable from the default view too
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.getByTestId('aether-nav-prs').click();
  await page.getByTestId('pr-spread').waitFor({ timeout: 5000 });
  report.checks.navEntryOpensSpread = await page.getByTestId('pr-spread').isVisible();

  // (c) modal for one sidecar, opened by keyboard: #142 (stacked draft) → stack sidecar
  await page.getByTestId('pr-select-142').click();
  await page.getByTestId('pr-sidecar-stack').focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  report.checks.modalFocusOnClose = await page
    .getByTestId('pr-modal-close')
    .evaluate((el) => el === document.activeElement);
  report.checks.modalRefs = await page.getByTestId('pr-modal-ref').evaluateAll((as) => as.map((a) => a.href));
  await page.screenshot({
    path: path.join(OUT, 'c-modal-sidecar-stack-142.png'),
  });
  report.minFontPx.modal = await minFont(page, '[role="dialog"]');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  report.checks.focusTrappedAfter12Tabs = await page.evaluate(
    () => !!document.activeElement.closest('[role="dialog"]'),
  );
  await page.keyboard.press('Escape');
  report.checks.escCloses = (await page.getByRole('dialog').count()) === 0;
  report.checks.focusReturnedToCard = await page
    .getByTestId('pr-sidecar-stack')
    .evaluate((el) => el === document.activeElement);

  // extra: central card modal for #147 (NOT YET)
  await page.getByTestId('pr-select-147').click();
  await page.getByTestId('pr-central-card').click();
  await page.getByRole('dialog').waitFor();
  await page.screenshot({ path: path.join(OUT, 'c2-modal-central-147.png') });
  await page.keyboard.press('Escape');
  await ctx.close();
}

// (b) phone 390x844
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  track(page, 'phone');
  await page.goto(`${BASE}/?view=prs`, { waitUntil: 'networkidle' });
  await page.getByTestId('pr-spread').waitFor();
  await page.screenshot({ path: path.join(OUT, 'b-phone-390x844.png') });
  await page.screenshot({
    path: path.join(OUT, 'b-phone-390x844-full.png'),
    fullPage: true,
  });
  report.minFontPx.phoneSpread = await minFont(page, '[data-testid="pr-spread"]');
  report.checks.phoneHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  await ctx.close();
}

await browser.close();
report.totalRequests = report.requests.length;
fs.writeFileSync(path.join(OUT, 'network-and-a11y-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, requests: undefined }, null, 2));
process.exit(report.foreign.length ? 1 : 0);
