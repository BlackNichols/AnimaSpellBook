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
