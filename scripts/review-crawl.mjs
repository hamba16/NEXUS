import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = process.env.REVIEW_ORIGIN || 'https://nexus-one-self.vercel.app';
const output = process.env.REVIEW_OUTPUT || 'artifacts/review/batch-0';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const results = [];
const paths = ['/', '/showcase', '/context', '/data-audit.html', '/design'];
for (const [index, path] of paths.entries()) {
  const errors = [];
  const failures = [];
  const onError = error => errors.push(error.message);
  const onResponse = response => { if (response.status() >= 400) failures.push({ path: new URL(response.url()).pathname, status: response.status() }); };
  page.on('pageerror', onError); page.on('response', onResponse);
  try {
    const response = await page.goto(origin + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3500);
    const record = { path, status: response?.status(), title: await page.title(), text: await page.locator('body').innerText(), links: await page.locator('a[href]').evaluateAll(elements => elements.map(a => a.getAttribute('href'))), errors, failures };
    results.push(record);
    await page.screenshot({ path: `${output}/screen-${index}.png`, fullPage: true });
    console.log(JSON.stringify({ path, status: record.status, title: record.title, errors: errors.length, failures: failures.length }));
  } catch (error) {
    results.push({ path, error: error.message });
    console.log(JSON.stringify({ path, error: error.message }));
  } finally { page.off('pageerror', onError); page.off('response', onResponse); }
}
// Deliberately omit /neon/status: inspection found that its GET performs storage writes.
for (const path of ['/backend/healthz', '/backend/profiles', '/backend/directives', '/backend/context', '/backend/reports']) {
  try {
    const response = await context.request.get(origin + path, { timeout: 15000 });
    results.push({ path, status: response.status(), contentType: response.headers()['content-type'] });
    console.log(JSON.stringify({ path, status: response.status() }));
  } catch (error) { results.push({ path, error: error.message }); }
}
await writeFile(`${output}/crawl.json`, JSON.stringify({ date: '2026-11-23', origin, results }, null, 2));
await browser.close();
