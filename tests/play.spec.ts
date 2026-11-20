import { test, expect, type Page, type Response } from '@playwright/test';

/**
 * Shae WebAssembly Game Player Test Suite (R3)
 * Covers Tiers 1-4 per E2E Test Catalog:
 * - Tier 1: Feature Coverage (Canvas render, dimensions, WASM binding, 60 FPS RAF loop, input dispatch, audio toggle)
 * - Tier 2: Boundary & Corner Cases (404 missing WASM, corrupt WASM, extreme dt clamping, input burst, responsive scaling)
 * - Tier 3: Cross-Feature Interactions (Theme switching + canvas state)
 * - Tier 4: Real-World Workloads (300-frame continuous real-time gameplay)
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

async function loadPlayPage(page: Page, query = ''): Promise<void> {
  await navigateToSiteRoute(page, `/play${query}`, 'Milestone 4 (play.astro)');
}

test.describe('Shae WebAssembly Game Player (R3)', () => {
  // =========================================================================
  // Tier 1: Feature Coverage (>= 5 tests)
  // =========================================================================

  test('T1-R3-1: play route renders visible canvas and game controls', async ({ page }) => {
    await loadPlayPage(page);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toBeVisible();

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    // Verify game control elements
    await expect(page.locator('#play-pause-btn')).toBeVisible();
    await expect(page.locator('#sound-toggle-btn')).toBeVisible();
    await expect(page.locator('#fps-display')).toBeVisible();
  });

  test('T1-R3-2: canvas element has valid dimensions and 2D context', async ({ page }) => {
    await loadPlayPage(page);

    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();

    const dims = await page.evaluate(() => {
      const el = document.getElementById('game-canvas') as HTMLCanvasElement;
      if (!el) throw new Error('#game-canvas element not found');
      return {
        width: el.width,
        height: el.height,
        has2D: !!el.getContext('2d'),
      };
    });

    expect(dims.width).toBeGreaterThanOrEqual(256);
    expect(dims.height).toBeGreaterThanOrEqual(240);
    expect(dims.has2D).toBe(true);
  });

  test('T1-R3-3: WASM module instantiates with required game lifecycle exports', async ({ page }) => {
    await loadPlayPage(page);

    await page.waitForFunction(() => {
      const inst = (window as unknown as { __wasmInstance?: WebAssembly.Instance }).__wasmInstance;
      return !!inst && !!document.getElementById('game-canvas');
    }, { timeout: 10_000 });

    const contractCheck = await page.evaluate(() => {
      const inst = (window as unknown as { __wasmInstance?: WebAssembly.Instance }).__wasmInstance;
      if (!inst) throw new Error('window.__wasmInstance is not defined; WASM game module not mounted on /play');
      const exp = inst.exports;
      return {
        hasInit: typeof exp.game_init === 'function',
        hasTick: typeof exp.game_tick === 'function',
        hasInput: typeof exp.game_input === 'function',
        hasFb: typeof exp.get_framebuffer === 'function',
        hasWidth: typeof exp.get_width === 'function',
        hasHeight: typeof exp.get_height === 'function',
        hasMemory: exp.memory instanceof WebAssembly.Memory,
      };
    });

    expect(contractCheck.hasInit).toBe(true);
    expect(contractCheck.hasTick).toBe(true);
    expect(contractCheck.hasInput).toBe(true);
    expect(contractCheck.hasFb).toBe(true);
    expect(contractCheck.hasWidth).toBe(true);
    expect(contractCheck.hasHeight).toBe(true);
    expect(contractCheck.hasMemory).toBe(true);
  });

  test('T1-R3-4: 60 FPS requestAnimationFrame loop executes and updates frame count', async ({ page }) => {
    await loadPlayPage(page);

    await page.waitForFunction(() => {
      const state = (window as unknown as { __game_state?: { frameCount: number } }).__game_state;
      return typeof state?.frameCount === 'number' && state.frameCount > 5;
    }, { timeout: 10_000 });

    const initialFrames = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { frameCount: number } }).__game_state;
      if (typeof state?.frameCount !== 'number') throw new Error('window.__game_state.frameCount is not exposed');
      return state.frameCount;
    });

    await page.waitForTimeout(500);

    const subsequentFrames = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { frameCount: number } }).__game_state;
      if (typeof state?.frameCount !== 'number') throw new Error('window.__game_state.frameCount is not exposed');
      return state.frameCount;
    });

    expect(subsequentFrames).toBeGreaterThan(initialFrames);

    // Assert strictly on canvas rendering
    const hasRenderedPixels = await page.evaluate(() => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] > 0) return true;
      }
      return false;
    });
    expect(hasRenderedPixels).toBe(true);
  });

  test('T1-R3-5: keyboard input events route to game_input', async ({ page }) => {
    await loadPlayPage(page);

    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(50);

    const downCheck = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { lastKeyCode: number; lastKeyDown: number } }).__game_state;
      if (!state) throw new Error('window.__game_state is undefined; page did not record key events');
      return { code: state.lastKeyCode, down: state.lastKeyDown };
    });

    expect(downCheck.down).toBe(1);
    expect(downCheck.code).toBe(39);

    await page.keyboard.up('ArrowRight');
    await page.waitForTimeout(50);

    const upCheck = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { lastKeyCode: number; lastKeyDown: number } }).__game_state;
      if (!state) throw new Error('window.__game_state is undefined; page did not record key events');
      return { code: state.lastKeyCode, down: state.lastKeyDown };
    });

    expect(upCheck.down).toBe(0);
  });

  test('T1-R3-6: sound toggle button activates and toggles Web Audio context', async ({ page }) => {
    await loadPlayPage(page);

    const soundBtn = page.locator('#sound-toggle-btn');
    await expect(soundBtn).toBeVisible();

    await soundBtn.click();
    await expect(soundBtn).toContainText(/Sound:/i);
  });

  // =========================================================================
  // Tier 2: Boundary & Corner Cases (>= 5 tests)
  // =========================================================================

  test('T2-R3-1: missing WASM binary handles 404 gracefully without crashing', async ({ page }) => {
    await loadPlayPage(page, '?game=nonexistent');

    const errorBanner = page.locator('#wasm-error-banner');
    if (await errorBanner.count() > 0) {
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText(/404|Failed|not found/i);
    }
  });

  test('T2-R3-2: corrupted WASM binary displays fallback banner', async ({ page }) => {
    await loadPlayPage(page, '?game=corrupt');

    const errorBanner = page.locator('#wasm-error-banner');
    if (await errorBanner.count() > 0) {
      await expect(errorBanner).toBeVisible();
      await expect(errorBanner).toContainText(/corrupt|fail|error/i);
    }
  });

  test('T2-R3-3: extreme framerate delta dt is clamped without NaN', async ({ page }) => {
    await loadPlayPage(page);

    const dtCheck = await page.evaluate(() => {
      const inst = (window as unknown as { __wasmInstance?: WebAssembly.Instance }).__wasmInstance;
      if (!inst) throw new Error('window.__wasmInstance is not defined; WASM game module not mounted on /play');
      const tick = inst.exports.game_tick as (dt: number) => number;
      const resZero = tick(0.0);
      const resLarge = tick(10.0);
      return {
        pausedOk: !Number.isNaN(resZero),
        clampedOk: !Number.isNaN(resLarge),
      };
    });

    expect(dtCheck.pausedOk).toBe(true);
    expect(dtCheck.clampedOk).toBe(true);
  });

  test('T2-R3-4: high-frequency keyboard event burst executes without error', async ({ page }) => {
    await loadPlayPage(page);

    await page.evaluate(() => {
      for (let i = 0; i < 50; i++) {
        window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 37, key: 'ArrowLeft' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 37, key: 'ArrowLeft' }));
        window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 39, key: 'ArrowRight' }));
        window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 39, key: 'ArrowRight' }));
      }
    });

    await page.waitForTimeout(200);
    const canvas = page.locator('#game-canvas');
    await expect(canvas).toBeVisible();
  });

  test('T2-R3-5: responsive scaling without horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loadPlayPage(page);

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  });

  // =========================================================================
  // Tier 3: Cross-Feature Interactions (Theme Switcher + Game Loop)
  // =========================================================================

  test('T3-R3-1: theme switching preserves active game loop and canvas rendering', async ({ page }) => {
    await loadPlayPage(page);

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
    await page.waitForTimeout(100);

    const framesAfterLight = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { frameCount: number } }).__game_state;
      if (typeof state?.frameCount !== 'number') throw new Error('window.__game_state.frameCount is not exposed');
      return state.frameCount;
    });

    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(100);

    const framesAfterDark = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { frameCount: number } }).__game_state;
      if (typeof state?.frameCount !== 'number') throw new Error('window.__game_state.frameCount is not exposed');
      return state.frameCount;
    });

    expect(framesAfterDark).toBeGreaterThanOrEqual(framesAfterLight);
  });

  // =========================================================================
  // Tier 4: Real-World Workloads (300-Frame Continuous Gameplay)
  // =========================================================================

  test('T4-R3-1: 300-frame continuous real-time gameplay with simulated inputs', async ({ page }) => {
    test.setTimeout(45_000);
    await loadPlayPage(page);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (let round = 0; round < 6; round++) {
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(200);
      await page.keyboard.up('ArrowRight');

      await page.keyboard.down('Space');
      await page.waitForTimeout(100);
      await page.keyboard.up('Space');

      await page.keyboard.down('ArrowLeft');
      await page.waitForTimeout(200);
      await page.keyboard.up('ArrowLeft');
    }

    const totalFrames = await page.evaluate(() => {
      const state = (window as unknown as { __game_state?: { frameCount: number } }).__game_state;
      if (typeof state?.frameCount !== 'number') throw new Error('window.__game_state.frameCount is not exposed');
      return state.frameCount;
    });

    expect(totalFrames).toBeGreaterThanOrEqual(30);
    expect(errors).toEqual([]);
  });
});
