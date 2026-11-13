import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/spelllist');
  await page.evaluate(() => localStorage.clear());
});

test('/spellbooks is reachable with empty state and create; /spelllist remains available', async ({ page }) => {
  await page.goto('/spellbooks');
  await expect(page).toHaveURL(/\/spellbooks$/);
  await expect(page.getByRole('heading', { name: 'Spellbooks' })).toBeVisible();
  await expect(page.getByTestId('spellbooks-empty')).toBeVisible();
  await expect(page.getByTestId('spellbook-create')).toBeVisible();
  await page.getByRole('button', { name: 'Back to spell list' }).first().click();
  await expect(page).toHaveURL(/\/spelllist$/);
});

test('create, rename, select/activate, and duplicate spellbooks with route transitions', async ({ page }) => {
  await page.goto('/spellbooks');
  await page.getByTestId('spellbook-create').click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.getByTestId('spellbook-editor')).toBeVisible();
  const nameInput = page.getByLabel('Spellbook name');
  await expect(nameInput).toHaveValue('Spellbook 1');

  await nameInput.fill('Alpha');
  await page.getByRole('button', { name: 'Save name' }).click();
  await page.getByRole('button', { name: 'Back to spellbooks' }).click();
  await expect(page).toHaveURL(/\/spellbooks$/);
  await expect(page.getByRole('link', { name: 'Alpha' })).toBeVisible();

  await page.getByRole('button', { name: 'Duplicate Alpha' }).click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.getByLabel('Spellbook name')).toHaveValue('Spellbook 2');
  await page.getByRole('button', { name: 'Back to spellbooks' }).click();
  await expect(page.getByRole('link', { name: 'Spellbook 2' })).toBeVisible();

  await page.getByRole('link', { name: 'Alpha' }).click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.getByLabel('Spellbook name')).toHaveValue('Alpha');
});

test('delete active spellbook navigates to /spellbooks empty; deep-link/refresh and unknown id redirect', async ({ page }) => {
  await page.goto('/spellbooks');
  await page.getByTestId('spellbook-create').click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  const editUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(editUrl);
  await expect(page.getByTestId('spellbook-editor')).toBeVisible();
  await expect(page.getByLabel('Spellbook name')).toHaveValue('Spellbook 1');

  await page.getByRole('button', { name: 'Delete spellbook' }).click();
  await expect(page).toHaveURL(/\/spellbooks$/);
  await expect(page.getByTestId('spellbooks-empty')).toBeVisible();

  await page.goto('/spellbooks/does-not-exist');
  await expect(page).toHaveURL(/\/spelllist$/);
});
