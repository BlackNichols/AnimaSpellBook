import { test, expect } from '@playwright/test';

test('shows and hides spell details directly below clicked row', async ({ page }) => {
  await page.goto('/?maintenance=daily');
  const rows = page.locator('tr.spell-row');
  await expect(rows.first()).toBeVisible();

  const firstRow = rows.first();
  const detailRow = firstRow.locator('xpath=following-sibling::tr[1]');
  await expect(detailRow).toHaveClass(/spell-detail-row/);
  await expect(detailRow).toBeHidden();

  await firstRow.click();
  await expect(detailRow).toBeVisible();
  await expect(detailRow).toContainText('Initial');
  await expect(detailRow).toContainText('Zeon');
  await expect(detailRow.locator('.spell-detail-effect')).toHaveCount(0);
  await expect(detailRow).not.toContainText('Resistance:');
  await expect(detailRow.getByText('Daily maintenance', { exact: true })).toBeVisible();
  await expect(detailRow).not.toContainText('(daily)');

  await firstRow.click();
  await expect(detailRow).toBeHidden();
});
