import { test, expect } from '@playwright/test';

test('filter sections match URL params on initial load without blink', async ({ page }) => {
  await page.goto('/?maintenance=daily&paths=Fire&levelMax=50');

  const panel = page.locator('#filter-panel');
  const section = (name: string) =>
    panel.locator('section.filter-section').filter({ has: page.getByRole('button', { name, exact: true }) });

  await expect(section('Category & Path').locator('.filter-section-body')).toBeVisible();
  await expect(section('Level').locator('.filter-section-body')).toBeVisible();
  await expect(section('Maintenance').locator('.filter-section-body')).toBeVisible();

  await expect(section('Action').locator('.filter-section-body')).toBeHidden();
  await expect(section('Types').locator('.filter-section-body')).toBeHidden();
  await expect(section('Area of Effect').locator('.filter-section-body')).toBeHidden();
  await expect(section('Zeon Cost').locator('.filter-section-body')).toBeHidden();
  await expect(section('Min Intelligence').locator('.filter-section-body')).toBeHidden();
});

test('filter sections toggle open and closed on click', async ({ page }) => {
  await page.goto('/?maintenance=daily');
  const panel = page.locator('#filter-panel');
  const section = (name: string) =>
    panel.locator('section.filter-section').filter({ has: page.getByRole('button', { name, exact: true }) });

  const maintenanceBtn = section('Maintenance').getByRole('button', { name: 'Maintenance', exact: true });
  await expect(section('Maintenance').locator('.filter-section-body')).toBeVisible();
  await expect(maintenanceBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(section('Maintenance').locator('.filter-section-chevron')).toHaveText('▾');
  await maintenanceBtn.click();
  await expect(section('Maintenance').locator('.filter-section-body')).toBeHidden();
  await expect(maintenanceBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(section('Maintenance').locator('.filter-section-chevron')).toHaveText('▸');
  await maintenanceBtn.click();
  await expect(section('Maintenance').locator('.filter-section-body')).toBeVisible();
  await expect(maintenanceBtn).toHaveAttribute('aria-expanded', 'true');

  const actionBtn = section('Action').getByRole('button', { name: 'Action', exact: true });
  await expect(section('Action').locator('.filter-section-body')).toBeHidden();
  await expect(actionBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(section('Action').locator('.filter-section-chevron')).toHaveText('▸');
  await actionBtn.click();
  await expect(section('Action').locator('.filter-section-body')).toBeVisible();
  await expect(actionBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(section('Action').locator('.filter-section-chevron')).toHaveText('▾');
});

test('inactive filter sections start minimized on clean load', async ({ page }) => {
  await page.goto('/');
  const bodies = page.locator('#filter-panel .filter-section-body');
  await expect(bodies).toHaveCount(8);
  for (let i = 0; i < 8; i++) {
    await expect(bodies.nth(i)).toBeHidden();
  }
});
