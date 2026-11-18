import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', name: 'overview' },
  { path: '/docs', name: 'docs' },
  { path: '/features', name: 'features' },
  { path: '/benchmarks', name: 'benchmarks' },
  { path: '/download', name: 'download' },
  { path: '/tour', name: 'tour' },
  { path: '/repl', name: 'repl' },
];

for (const route of routes) {
  test(`${route.name} renders with one h1 and no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto(route.path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('footer.site-footer')).toBeVisible();
    await expect(page).toHaveTitle(/Shae/i);

    expect(errors).toEqual([]);
  });

  test(`${route.name} has no page-level horizontal overflow`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });
}

test('active nav state matches the current route', async ({ page }) => {
  await page.goto('/docs', { waitUntil: 'networkidle' });
  const active = page.locator('.nav-links .nav-item.active');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', '/docs');
  await expect(active).toHaveAttribute('aria-current', 'page');
});

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const skip = page.locator('.skip-link');
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
