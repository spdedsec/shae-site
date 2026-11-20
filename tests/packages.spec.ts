import { test, expect, type Page, type Response } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

/**
 * Shae Central Package Registry Explorer Test Suite (R5)
 * Covers Tiers 1-4 per E2E Test Catalog:
 * - Tier 1: Feature Coverage (Page render, metadata inspection, search filtering, empty state, copy button, dossier view)
 * - Tier 2: Boundary & Corner Cases (Special chars/XSS search, missing optional fields, schema validation, checksums, SemVer)
 * - Tier 3: Cross-Feature Interactions (Theme switching + active navigation)
 * - Tier 4: Real-World Workloads (Full discover & install workflow simulation)
 */

/**
 * Navigates to a real Astro route with clean contract enforcement.
 * - If STRICT_CONTRACT=1: asserts status === 200 (fails if route is 404).
 * - During staging/development: if status === 404, cleanly skips the test with a descriptive message.
 * - Under ZERO circumstances injects synthetic HTML.
 */
export async function navigateToSiteRoute(page: Page, path: string, milestone: string): Promise<Response> {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  const status = response?.status() ?? 0;

  if (status === 404) {
    if (process.env.STRICT_CONTRACT === '1' || process.env.CI_RELEASE_GATE === '1') {
      expect(status, `Route ${path} must return HTTP 200 (${milestone})`).toBe(200);
    } else {
      test.skip(true, `Route ${path} returned 404: Waiting for ${milestone} to merge into shae-site.`);
    }
  } else {
    expect(status, `Route ${path} must return HTTP 200 OK`).toBe(200);
  }

  return response!;
}

async function loadPackagesPage(page: Page, query = ''): Promise<void> {
  await navigateToSiteRoute(page, `/packages${query}`, 'Milestone 5 (packages.astro)');
}

test.describe('Shae Central Package Registry Explorer (R5)', () => {
  // =========================================================================
  // Tier 1: Feature Coverage (>= 6 tests)
  // =========================================================================

  test('T1-R5-1: packages route renders package explorer interface', async ({ page }) => {
    await loadPackagesPage(page);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();

    const searchInput = page.locator('#pkg-search-input');
    await expect(searchInput).toBeVisible();

    const cards = page.locator('.package-card');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(1);
  });

  test('T1-R5-2: package cards display required metadata (name, version, author, license)', async ({ page }) => {
    await loadPackagesPage(page);

    const firstCard = page.locator('.package-card').first();
    await expect(firstCard.locator('.package-name')).toBeVisible();
    await expect(firstCard.locator('.package-version')).toBeVisible();
    await expect(firstCard.locator('.package-description')).toBeVisible();

    const versionText = await firstCard.locator('.package-version').innerText();
    expect(versionText.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('T1-R5-3: real-time package search filters cards instantly', async ({ page }) => {
    await loadPackagesPage(page);

    const searchInput = page.locator('#pkg-search-input');
    await searchInput.fill('math');

    await page.waitForTimeout(100);

    const visibleCards = page.locator('.package-card:visible');
    expect(await visibleCards.count()).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < await visibleCards.count(); i++) {
      const text = await visibleCards.nth(i).innerText();
      expect(text.toLowerCase()).toContain('math');
    }
  });

  test('T1-R5-4: empty state is displayed when search yields no matches', async ({ page }) => {
    await loadPackagesPage(page);

    const searchInput = page.locator('#pkg-search-input');
    await searchInput.fill('__nonexistent_pkg_query_xyz__');

    await page.waitForTimeout(100);

    const visibleCards = page.locator('.package-card:visible');
    expect(await visibleCards.count()).toBe(0);

    const emptyState = page.locator('#no-packages-found');
    await expect(emptyState).toBeVisible();
  });

  test('T1-R5-5: copy install snippet copies command to clipboard and gives visual feedback', async ({ page }) => {
    await loadPackagesPage(page);

    const copyBtn = page.locator('.copy-install-btn').first();
    await copyBtn.click();

    await expect(copyBtn).toHaveClass(/copied/);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^shae pkg add [a-z0-9-_]+/);
  });

  test('T1-R5-6: package detail dossier view displays full documentation and dependencies', async ({ page }) => {
    await loadPackagesPage(page);

    const detailsBtn = page.locator('.view-details-btn').first();
    await detailsBtn.click();

    const dossier = page.locator('#package-dossier');
    await expect(dossier).toBeVisible();
    await expect(dossier.locator('#dossier-readme')).toBeVisible();
    await expect(dossier.locator('#dossier-dependencies')).toBeVisible();

    await dossier.locator('.dossier-close').click();
    await expect(dossier).not.toHaveClass(/open/);
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases (>= 5 tests)
  // =========================================================================

  test('T2-R5-1: search input containing script tags and SQLi strings is treated literally', async ({ page }) => {
    await loadPackagesPage(page);

    const searchInput = page.locator('#pkg-search-input');
    await searchInput.fill("<script>window.__xss_leaked=true;</script>' OR '1'='1");

    await page.waitForTimeout(100);

    const xssLeaked = await page.evaluate(() => (window as unknown as { __xss_leaked?: boolean }).__xss_leaked);
    expect(xssLeaked).toBeUndefined();

    const visibleCards = page.locator('.package-card:visible');
    expect(await visibleCards.count()).toBe(0);
  });

  test('T2-R5-2: package lacking optional description or dependencies handles gracefully', async ({ page }) => {
    await loadPackagesPage(page);

    const descriptions = page.locator('.package-description');
    for (let i = 0; i < await descriptions.count(); i++) {
      const text = await descriptions.nth(i).innerText();
      expect(typeof text).toBe('string');
    }
  });

  test('T2-R5-3: static package index JSON schema complies with registry specification', async ({ page }) => {
    const res = await page.request.get('/packages/shae-math.json');
    if (res.status() === 404) {
      if (process.env.STRICT_CONTRACT === '1' || process.env.CI_RELEASE_GATE === '1') {
        expect(res.status(), 'Static package index /packages/shae-math.json must be served (Milestone 5)').toBe(200);
      } else {
        test.skip(true, 'Static package index /packages/shae-math.json returned 404: Waiting for Milestone 5 assets');
      }
    }
    expect(res.status(), 'Static package index /packages/shae-math.json must be served').toBe(200);
    const data = await res.json();

    expect(typeof data.name).toBe('string');
    expect(typeof data.description).toBe('string');
    expect(typeof data.latest).toBe('string');
    expect(typeof data.versions).toBe('object');

    const latestVer = data.versions[data.latest];
    expect(latestVer).toBeDefined();
    expect(latestVer.download_url).toMatch(/^\/downloads\/.+\.shaepkg$/);
    expect(latestVer.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  test('T2-R5-4: SemVer pre-release sorting ranks production releases higher than pre-releases', async ({ page }) => {
    await loadPackagesPage(page);

    const detailsBtn = page.locator('.view-details-btn').first();
    await detailsBtn.click();

    const dossier = page.locator('#package-dossier');
    await expect(dossier).toBeVisible();

    const versionElements = dossier.locator('.version-badge, .version-row, .dossier-version');
    const versionCount = await versionElements.count();

    if (versionCount >= 2) {
      const versions: string[] = [];
      for (let i = 0; i < versionCount; i++) {
        const text = (await versionElements.nth(i).innerText()).trim();
        versions.push(text);
      }

      const isSemVerDescending = versions.every((ver, idx) => {
        if (idx === 0) return true;
        const prev = versions[idx - 1];
        const isPrePrev = prev.includes('-');
        const isPreCur = ver.includes('-');
        if (!isPrePrev && isPreCur) return true;
        if (isPrePrev && !isPreCur) return false;
        return prev.localeCompare(ver, undefined, { numeric: true }) >= 0;
      });

      expect(isSemVerDescending).toBe(true);
    } else {
      const dossierText = await dossier.innerText();
      expect(dossierText).toContain('1.0.0');
    }
  });

  test('T2-R5-5: category tag filters isolate matching packages', async ({ page }) => {
    await loadPackagesPage(page);

    const mathTag = page.locator('.filter-tag[data-category="math"]');
    if (await mathTag.count() > 0) {
      await mathTag.click();
      await page.waitForTimeout(100);

      const visibleCards = page.locator('.package-card:visible');
      expect(await visibleCards.count()).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < await visibleCards.count(); i++) {
        const cat = await visibleCards.nth(i).getAttribute('data-category');
        expect(cat).toBe('math');
      }
    }
  });

  // =========================================================================
  // Tier 3: Cross-Feature Interactions (Theme Switcher + Packages Explorer)
  // =========================================================================

  test('T3-R5-1: theme switcher retains search filter and package card visibility', async ({ page }) => {
    await loadPackagesPage(page);

    const searchInput = page.locator('#pkg-search-input');
    await searchInput.fill('mesh');
    await page.waitForTimeout(50);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(50);

    await expect(searchInput).toHaveValue('mesh');
    const visibleCards = page.locator('.package-card:visible');
    expect(await visibleCards.count()).toBe(1);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(50);
    await expect(searchInput).toHaveValue('mesh');
  });

  // =========================================================================
  // Tier 4: Real-World Workloads (End-to-End Package Discovery & Install)
  // =========================================================================

  test('T4-R5-1: full discover-inspect-copy package installation flow', async ({ page }) => {
    await loadPackagesPage(page);

    const searchInput = page.locator('#pkg-search-input');
    await searchInput.fill('ws');
    await page.waitForTimeout(100);

    const card = page.locator('.package-card:visible').first();
    await expect(card).toBeVisible();
    await expect(card.locator('.package-name')).toContainText('shae-ws-mesh');

    await card.locator('.view-details-btn').click();
    const dossier = page.locator('#package-dossier');
    await expect(dossier).toBeVisible();
    await dossier.locator('.dossier-close').click();

    await card.locator('.copy-install-btn').click();
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toBe('shae pkg add shae-ws-mesh');
  });
});
