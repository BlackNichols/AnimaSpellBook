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

test('adding an individual spell from /spelllist with no spellbooks creates default active spellbook and adds it to default section', async ({ page }) => {
  await page.goto('/spelllist');
  await expect(page.locator('[data-testid^="add-spell-"]').first()).toBeVisible();
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.getByLabel('Spellbook name')).toHaveValue('Spellbook 1');
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Default section');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);
});

test('adding all filtered spells from /spelllist snapshots displayed results and adds to default section (creating spellbook when none exists)', async ({ page }) => {
  await page.goto('/spelllist?q=Create%20Light');
  await expect(page.locator('.spell-row').first()).toBeVisible();
  const displayedCount = await page.locator('.spell-row').count();
  expect(displayedCount).toBeGreaterThan(0);
  await page.getByTestId('add-all-filtered').click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.getByLabel('Spellbook name')).toHaveValue('Spellbook 1');
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Default section');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(displayedCount);
});

test('creating first named section in editor converts default section in place preserving spells', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);

  const answers = ['Combat', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();

  await expect(page.locator('.spellbook-section')).toHaveCount(1);
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Combat');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);
});

test('adding a spell from /spelllist when named sections exist prompts for target section and adds to chosen existing section', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').nth(0).click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);

  const answers = ['Combat', 'last', 'Utility', 'last', '2'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section')).toHaveCount(1);
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section')).toHaveCount(2);

  await page.getByRole('button', { name: 'Back to spell list' }).click();
  await expect(page).toHaveURL(/\/spelllist$/);
  await page.locator('[data-testid^="add-spell-"]').nth(1).click();

  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  const sections = page.locator('.spellbook-section');
  await expect(sections.nth(0).locator('.spellbook-spell-item')).toHaveCount(1);
  await expect(sections.nth(1).locator('.spellbook-spell-item')).toHaveCount(1);
});

test('renaming a named section from spellbook editor updates its header while keeping spells', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);

  const answers = ['Combat', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Combat');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);

  page.removeAllListeners('dialog');
  page.once('dialog', (d) => d.accept('Battle'));
  await page.getByRole('button', { name: 'Rename section' }).first().click();

  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Battle');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);
});

test('clearing a named section removes only its spells and leaves the empty section visible', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);

  const answers = ['Combat', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Combat');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);

  page.removeAllListeners('dialog');
  await page.getByRole('button', { name: 'Clear section' }).first().click();

  await expect(page.locator('.spellbook-section')).toHaveCount(1);
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Combat');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(0);
  await expect(page.locator('.spellbook-section')).toContainText('No spells in this section.');
});

test('reordering a named section by 1-based position updates section order', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);

  const answers = ['Combat', 'last', 'Utility', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section-title').nth(0)).toHaveText('Combat');
  await expect(page.locator('.spellbook-section-title').nth(1)).toHaveText('Utility');

  page.removeAllListeners('dialog');
  page.once('dialog', (d) => d.accept('1'));
  await page.getByRole('button', { name: 'Section position' }).nth(1).click();

  await expect(page.locator('.spellbook-section-title').nth(0)).toHaveText('Utility');
  await expect(page.locator('.spellbook-section-title').nth(1)).toHaveText('Combat');
});

test('deleting a non-last named section can move its spells to a chosen existing section', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);

  const answers = ['Combat', 'last', 'Utility', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section')).toHaveCount(2);
  await expect(page.locator('.spellbook-section').nth(0).locator('.spellbook-spell-item')).toHaveCount(1);

  page.removeAllListeners('dialog');
  page.once('dialog', (d) => {
    void d.accept(); // confirm: move spells
    page.once('dialog', (d2) => void d2.accept('2')); // target section number
  });
  await page.getByRole('button', { name: 'Delete section' }).first().click();

  await expect(page.locator('.spellbook-section')).toHaveCount(1);
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Default section');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);
});

test('deleting the only named section from editor converts it back to default unnamed section preserving its spells', async ({ page }) => {
  await page.goto('/spelllist');
  await page.locator('[data-testid^="add-spell-"]').first().click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);

  const answers = ['Combat', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Combat');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);

  page.removeAllListeners('dialog');
  await page.getByRole('button', { name: 'Delete section' }).first().click();

  await expect(page.locator('.spellbook-section')).toHaveCount(1);
  await expect(page.locator('.spellbook-section-title').first()).toHaveText('Default section');
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);
});

test('reordering a spell within a section by 1-based position updates spell order', async ({ page }) => {
  await page.goto('/spelllist');
  await expect(page.locator('[data-testid^="add-spell-"]').first()).toBeVisible();
  await page.locator('[data-testid^="add-spell-"]').nth(0).click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Back to spell list' }).click();
  await page.locator('[data-testid^="add-spell-"]').nth(1).click();
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(2);

  const items = page.locator('.spellbook-spell-item');
  const first = (await items.nth(0).textContent()) ?? '';
  const second = (await items.nth(1).textContent()) ?? '';

  page.once('dialog', (d) => d.accept('1'));
  await page.getByRole('button', { name: 'Spell position' }).nth(1).click();

  await expect(items.nth(0)).toHaveText(second);
  await expect(items.nth(1)).toHaveText(first);
});

test('moving a single spell to another existing section appends it to end of target and removes it from source', async ({ page }) => {
  await page.goto('/spelllist');
  await expect(page.locator('[data-testid^="add-spell-"]').first()).toBeVisible();
  await page.locator('[data-testid^="add-spell-"]').nth(0).click();
  await expect(page).toHaveURL(/\/spellbooks\/[^/]+$/);
  await page.getByRole('button', { name: 'Back to spell list' }).click();
  await page.locator('[data-testid^="add-spell-"]').nth(1).click();
  await expect(page.locator('.spellbook-spell-item')).toHaveCount(2);

  const answers = ['Alpha', 'last', 'Beta', 'last'];
  page.on('dialog', (d) => d.accept(answers.shift() ?? ''));
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section')).toHaveCount(1);
  await page.getByTestId('add-section').click();
  await expect(page.locator('.spellbook-section')).toHaveCount(2);

  const alpha = page.locator('.spellbook-section').nth(0);
  const beta = page.locator('.spellbook-section').nth(1);
  const first = (await alpha.locator('.spellbook-spell-item .spellbook-spell-name').nth(0).textContent()) ?? '';
  const second = (await alpha.locator('.spellbook-spell-item .spellbook-spell-name').nth(1).textContent()) ?? '';

  page.removeAllListeners('dialog');
  page.once('dialog', (d) => d.accept('2'));
  await alpha.getByRole('button', { name: 'Move spell' }).nth(0).click();

  await expect(alpha.locator('.spellbook-spell-item')).toHaveCount(1);
  await expect(alpha.locator('.spellbook-spell-item .spellbook-spell-name').nth(0)).toHaveText(second);
  await expect(beta.locator('.spellbook-spell-item')).toHaveCount(1);
  await expect(beta.locator('.spellbook-spell-item .spellbook-spell-name').nth(0)).toHaveText(first);
});
