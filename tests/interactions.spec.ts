import { test, expect } from '@playwright/test';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

test('theme switcher applies and persists the selected theme', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  await page.selectOption('#theme-switcher', 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-switcher')).toHaveValue('dark');

  await page.selectOption('#theme-switcher', 'light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('code showcase tabs switch panels and support arrow keys', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const first = page.locator('[data-tab-target="jit-ssa"]');
  const second = page.locator('[data-tab-target="actor-reload"]');
  await expect(first).toHaveAttribute('aria-selected', 'true');

  await second.click();
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(first).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('#panel-actor-reload')).toBeVisible();

  await second.focus();
  await second.press('ArrowRight');
  await expect(page.locator('[data-tab-target="zero-copy"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
});

test('copy controls give visible feedback', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const copy = page.locator('#copy-quickstart-btn');
  await copy.click();
  await expect(copy).toHaveClass(/copied/);
  await expect(page.locator('#copy-btn-text')).toHaveText(/COPIED/);

  await page.goto('/download', { waitUntil: 'networkidle' });
  const downloadCopy = page.locator('.copy-cmd-btn').first();
  await downloadCopy.click();
  await expect(downloadCopy).toHaveClass(/copied/);
});

test('docs quick nav moves to the requested section', async ({ page }) => {
  await page.goto('/docs', { waitUntil: 'networkidle' });
  await page.locator('.quick-link[href="#cli-reference"]').click();
  await expect(page).toHaveURL(/#cli-reference$/);
  await expect(page.locator('#cli-reference')).toBeInViewport();
});

test('benchmark suite tabs filter the visible cards', async ({ page }) => {
  await page.goto('/benchmarks', { waitUntil: 'networkidle' });
  await page.locator('.tab-btn[data-target="buffer"]').click();
  await expect(page.locator('.suite-card[data-suite="buffer"]')).toBeVisible();
  await expect(page.locator('.suite-card[data-suite="fibonacci"]')).toBeHidden();
});

test('repl runs a sample and clears output', async ({ page }) => {
  await page.goto('/repl', { waitUntil: 'networkidle' });

  await page.selectOption('#sample-select', 'pipeline');
  await expect(page.locator('#code-editor')).toHaveValue(/raw_data/);

  await page.locator('#run-btn').click();
  await expect(page.locator('#terminal-output')).toContainText('Filtered & Doubled');

  await page.locator('#clear-btn').click();
  await expect(page.locator('#terminal-output')).toBeEmpty();
});

test('audio toggle exposes pressed state', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const button = page.locator('#toggle-audio-btn');
  const before = await button.getAttribute('aria-pressed');
  await button.click();
  await expect(button).not.toHaveAttribute('aria-pressed', before ?? 'true');
});
