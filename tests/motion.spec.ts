import { test, expect } from '@playwright/test';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('content is visible and animations are disabled', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    await expect(page.locator('.hero-actions')).toBeVisible();

    const styles = await page.evaluate(() => {
      const hero = document.querySelector('.hero-title');
      const animated = document.querySelector('.animate-fade-up');
      return {
        heroOpacity: hero ? getComputedStyle(hero).opacity : null,
        animationDuration: animated ? getComputedStyle(animated).animationDuration : null,
        progressDisplay: getComputedStyle(document.documentElement, '::after').display,
      };
    });

    expect(styles.heroOpacity).toBe('1');
    expect(['0.001ms', '0s']).toContain(styles.animationDuration);
    expect(styles.progressDisplay).toBe('none');
  });

  test('no route overflows horizontally with reduced motion', async ({ page }) => {
    for (const route of ['/', '/docs', '/features', '/benchmarks', '/download', '/tour', '/repl']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(metrics.scrollWidth, route).toBeLessThanOrEqual(metrics.clientWidth + 1);
    }
  });
});
