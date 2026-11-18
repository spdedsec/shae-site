/* eslint-disable no-console */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/docs', '/features', '/benchmarks', '/download', '/tour', '/repl'];
const base = process.env.BASE_URL ?? 'http://localhost:4321';
const browser = await chromium.launch();
const width = Number(process.env.A11Y_WIDTH ?? 1440);
const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
const page = await context.newPage();

let total = 0;
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  if (!results.violations.length) {
    console.log(`\n${route}  ✓ clean`);
    continue;
  }
  console.log(`\n${route}  ${results.violations.length} violations`);
  for (const v of results.violations) {
    total++;
    console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
    for (const node of v.nodes) {
      console.log(`    ${node.target.join(' ')}`);
      const msg = (node.failureSummary ?? '').split('\n').filter(Boolean).slice(-1)[0];
      if (msg) console.log(`      ${msg}`);
    }
  }
}

console.log(`\nTotal violations: ${total}`);
await browser.close();
process.exit(total ? 1 : 0);
