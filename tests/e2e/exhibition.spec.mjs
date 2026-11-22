import { test, expect } from '@playwright/test';

test('all six exhibition roles open and can return to selection', async ({ page }) => {
  for (const name of ['Sarah Kakande','Robert Okello','Grace Atim','Executive Oversight','Esther Namuli','Daniel Ocen']) {
    await page.goto('/showcase');
    await expect(page.getByRole('note')).toContainText('Simulated operational data');
    await page.getByRole('button', { name: new RegExp(name) }).click();
    await expect(page.locator('.sidebar')).toBeVisible();
    await page.getByRole('button', { name: 'Change Role' }).click();
    await expect(page.getByRole('heading', { name: 'Who are you today?' })).toBeVisible();
  }
});

test('fallback briefing identifies its simulated provenance', async ({ request }) => {
  const response = await request.post('/api/briefing', { data: { focus: 'red' } });
  expect(response.ok()).toBeTruthy();
  const result = await response.json();
  expect(result.is_simulated).toBe(true);
  expect(result.briefing).toContain('SIMULATED OPERATIONAL DATA');
  expect(result.briefing).toContain('RECOMMENDATIONS');
});

test('default landing and dashboard make no external requests', async ({ page }) => {
  const origins = new Set();
  const allowedOrigin = new URL(process.env.BASE_URL || 'http://127.0.0.1:3000').origin;
  page.on('request', r => { if (/^https?:/.test(r.url()) && new URL(r.url()).origin !== allowedOrigin) origins.add(new URL(r.url()).origin); });
  await page.goto('/showcase');
  await page.getByRole('button', { name: /Sarah Kakande/ }).click();
  await expect(page.locator('.sidebar')).toBeVisible();
  expect([...origins]).toEqual([]);
});
