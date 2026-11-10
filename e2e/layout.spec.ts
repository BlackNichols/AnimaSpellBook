import { test, expect } from '@playwright/test';

test('filter panel remains visible while scrolling the spell list', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('#filter-panel');
  await expect(panel).toBeVisible();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(100);

  await expect(panel).toBeVisible();
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeLessThan(120);
});

test('filter panel fills viewport height below header', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const panel = page.locator('#filter-panel');
  const box = await panel.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(viewport.height - box!.y - 2);
});

test('search box sits directly below the header with no gap', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  const header = page.locator('.header');
  const search = page.locator('.search-box');
  const h = await header.boundingBox();
  const s = await search.boundingBox();
  expect(h).not.toBeNull();
  expect(s).not.toBeNull();
  expect(Math.abs(s!.y - (h!.y + h!.height))).toBeLessThan(2);
});
