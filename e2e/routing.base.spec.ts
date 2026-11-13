import { test, expect } from '@playwright/test';

test.describe('routing under /AnimaSpellBook/ base', () => {
  test('deep-links and refreshes nested /spellbooks route with correct rendered view and assets', async ({
    page,
  }) => {
    await page.goto('./spellbooks');
    await expect(page).toHaveURL(/\/AnimaSpellBook\/spellbooks$/);
    await expect(page.getByRole('heading', { name: 'Spellbooks', exact: true })).toBeVisible();
    await expect(page.locator('#spell-search')).toHaveCount(0);
    await page.reload();
    await expect(page).toHaveURL(/\/AnimaSpellBook\/spellbooks$/);
    await expect(page.getByRole('heading', { name: 'Spellbooks', exact: true })).toBeVisible();
    await expect(page.locator('#app')).toBeVisible();
  });

  test('navigates to /spelllist under base path and preserves query params', async ({ page }) => {
    await page.goto('./spelllist?q=fire');
    await expect(page).toHaveURL(/\/AnimaSpellBook\/spelllist\?q=fire/);
    await expect(page.locator('#spell-search')).toHaveValue('fire');
  });
});
