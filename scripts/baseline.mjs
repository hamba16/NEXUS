import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = process.env.AUDIT_OUTPUT || 'docs/release/baseline';
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const requests = new Set();
const errors = [];
page.on('request', r => { if (!r.url().startsWith(base)) requests.add(new URL(r.url()).origin); });
page.on('pageerror', e => errors.push(e.message));
const results = [];
async function capture(name) {
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  results.push({ screen: name, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.length })), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
  await writeFile(`${output}/metrics.json`, JSON.stringify({ context: 'Local production build; automated checks only', results, externalOrigins: [...requests], errors }, null, 2));
}
await page.goto(base, { waitUntil: 'networkidle' });
await capture('landing');
for (const [i,role] of ['secretariat','mda','field','convener','oversight','anchor'].entries()) {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('button').nth(i).click();
  await page.locator('.sidebar').waitFor();
  const tabs = await page.locator('.nav-item').count();
  for (let j=0; j<tabs; j++) {
    await page.locator('.nav-item').nth(j).click();
    await page.waitForTimeout(250);
    await capture(`${role}-${j}`);
  }
}
await page.goto(base, { waitUntil: 'networkidle' });
await page.setViewportSize({ width: 375, height: 812 });
await capture('landing-mobile');
await browser.close();
console.log(`Captured ${results.length} screens; ${results.reduce((n,r)=>n+r.violations.length,0)} rule violations. See ${output}/metrics.json`);
