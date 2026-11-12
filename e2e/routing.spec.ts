import { test, expect } from '@playwright/test';

test('"/" redirects to "/spelllist" preserving query params', async ({ page }) => {
  await page.goto('/?q=fire&maintenance=daily');
  await expect(page).toHaveURL(/\/spelllist\?q=fire&maintenance=daily/);
  await expect(page.locator('#spell-search')).toHaveValue('fire');
  await expect(page.locator('.stats-bar')).not.toContainText('of 0');
});

test('clear filters button resets search and filter params on /spelllist', async ({ page }) => {
  await page.goto('/spelllist?q=fire&maintenance=daily');
  await expect(page.locator('#spell-search')).toHaveValue('fire');
  const clear = page.getByRole('button', { name: 'Clear filters' });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(page).toHaveURL(/\/spelllist$/);
  await expect(page.locator('#spell-search')).toHaveValue('');
});

test('preserves and restores list filter state across navigation away and back to /spelllist', async ({ page }) => {
  await page.goto('/spelllist?q=fire&maintenance=daily');
  await expect(page.locator('#spell-search')).toHaveValue('fire');
  await page.evaluate(() => (window as any).appRouter.navigate('/spellbooks'));
  await expect(page).toHaveURL(/\/spellbooks$/);
  await expect(page.getByRole('heading', { name: 'Spellbooks' })).toBeVisible();
  await expect(page.locator('#spell-search')).toHaveCount(0);
  await page.evaluate(() => (window as any).appRouter.navigate('/spelllist'));
  await expect(page).toHaveURL(/\/spelllist\?q=fire&maintenance=daily/);
  await expect(page.locator('#spell-search')).toHaveValue('fire');
});

test('deep-links and refreshes nested /spellbooks route with correct rendered view and assets', async ({ page }) => {
  await page.goto('/spellbooks');
  await expect(page).toHaveURL(/\/spellbooks$/);
  await expect(page.getByRole('heading', { name: 'Spellbooks', exact: true })).toBeVisible();
  await expect(page.locator('#spell-search')).toHaveCount(0);
  await page.reload();
  await expect(page).toHaveURL(/\/spellbooks$/);
  await expect(page.getByRole('heading', { name: 'Spellbooks', exact: true })).toBeVisible();
  await expect(page.locator('#app')).toBeVisible();
});

