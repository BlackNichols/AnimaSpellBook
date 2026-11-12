# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: routing.spec.ts >> preserves and restores list filter state across navigation away and back to /spelllist
- Location: e2e/routing.spec.ts:20:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Spellbooks' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Spellbooks' }) with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Spellbooks' })

```

```yaml
- banner:
  - button "Hide filters" [expanded]
  - heading "Anima Spellbook" [level=1]
- main:
  - complementary "Filters":
    - button "Clear filters"
    - button "Category & Path"
    - button "Level"
    - button "Action"
    - button "Types"
    - button "Area of Effect"
    - button "Zeon Cost"
    - button "Min Intelligence"
    - button "Maintenance" [expanded]
    - radiogroup "Maintenance":
      - radio "All"
      - text: All
      - radio "No maintenance"
      - text: No maintenance
      - radio "Has maintenance"
      - text: Has maintenance
      - radio "Daily only" [checked]
      - text: Daily only
  - text: Search spells
  - searchbox "Search spells": fire
  - text: 9 of 640 spells
  - table:
    - rowgroup:
      - row "Name Path Level Description":
        - columnheader "Name"
        - columnheader "Path"
        - columnheader "Level"
        - columnheader "Description"
    - rowgroup:
      - row "Create Fire Fire 2 Creates a fire with the given intensity. The flame itself is magical and does not require fuel. If placed upon a flammable material, the material will burn naturally even after the spell has dissipated.":
        - cell "Create Fire"
        - cell "Fire"
        - cell "2"
        - cell "Creates a fire with the given intensity. The flame itself is magical and does not require fuel. If placed upon a flammable material, the material will burn naturally even after the spell has dissipated."
    - rowgroup:
      - row "Fire Immunity Fire 10 Grants the caster or whomever they designate immunity to a number of heat intensities based on the level of the spell. When attacked from an attack based on fire the base damage is reduced by 5 per intensity the target is immune from. In addition, the immune character receives a +5 bonus to Resistances against fire based effects per intensity immunity.":
        - cell "Fire Immunity"
        - cell "Fire"
        - cell "10"
        - cell "Grants the caster or whomever they designate immunity to a number of heat intensities based on the level of the spell. When attacked from an attack based on fire the base damage is reduced by 5 per intensity the target is immune from. In addition, the immune character receives a +5 bonus to Resistances against fire based effects per intensity immunity."
    - rowgroup:
      - row:
        - cell "Fire Mine"
        - cell "Fire"
        - cell "40"
        - cell
    - rowgroup:
      - row "Lord of Fire Fire 96 The caster is able to control all heat within a large area. This dominion extends to control over planetary magma, allowing the caster to produce violent volcanic eruptions. All fire based creatures within the area must succeed an MR check or be dominated by the caster. Pass or fail, no subsequent check is allowed unless the base resistance values of the creature changes.":
        - cell "Lord of Fire"
        - cell "Fire"
        - cell "96"
        - cell "The caster is able to control all heat within a large area. This dominion extends to control over planetary magma, allowing the caster to produce violent volcanic eruptions. All fire based creatures within the area must succeed an MR check or be dominated by the caster. Pass or fail, no subsequent check is allowed unless the base resistance values of the creature changes."
    - rowgroup:
      - row "Immunity Creation 32 Permits the caster or the character designated by them to be immune to a number of intensities of a determined type, either Fire, Cold, or Electricity. If an attack is made using the type of energy to which the character is immune, each intensity of immunity reduces the base damage of the attack by 5 points. If a resistance check is required, each immunity provides a +5 bonus to such a check.":
        - cell "Immunity"
        - cell "Creation"
        - cell "32"
        - cell "Permits the caster or the character designated by them to be immune to a number of intensities of a determined type, either Fire, Cold, or Electricity. If an attack is made using the type of energy to which the character is immune, each intensity of immunity reduces the base damage of the attack by 5 points. If a resistance check is required, each immunity provides a +5 bonus to such a check."
    - rowgroup:
      - 'row "Create Ifreet Fire 82 Creates a seemingly live creature completely under the magician’s control. This entity is developed as a Being Between Worlds, subject to the elemental powers and limitations of Fire Elementals described in Anima: Beyond Fantasy - Chapter 26: Creation of Beings. The creature has a number of development points based on the level of the spell, and the elemental is created using the same rules as the spell Create Being in the path of creation."':
        - cell "Create Ifreet"
        - cell "Fire"
        - cell "82"
        - 'cell "Creates a seemingly live creature completely under the magician’s control. This entity is developed as a Being Between Worlds, subject to the elemental powers and limitations of Fire Elementals described in Anima: Beyond Fantasy - Chapter 26: Creation of Beings. The creature has a number of development points based on the level of the spell, and the elemental is created using the same rules as the spell Create Being in the path of creation."'
    - rowgroup:
      - row "Pyre Fire 86 Creates a large amount of fire intensities, which continue to burn even with no fuel to consume as long as the spell is maintained. If set upon flammable material, it will burn naturally after the spell has ended.":
        - cell "Pyre"
        - cell "Fire"
        - cell "86"
        - cell "Creates a large amount of fire intensities, which continue to burn even with no fuel to consume as long as the spell is maintained. If set upon flammable material, it will burn naturally after the spell has ended."
    - rowgroup:
      - row:
        - cell "Shield Area"
        - cell "Essence"
        - cell "66"
        - cell
    - rowgroup:
      - row "Alter Energy Free Access 40-50 The caster can transform intensities of any kind of elemental intensity into another, such as converting fire into electricity. If these intensities are magical or have their own presence (such as an elemental) they can resist with a successful MR check. This spell does not harm any elemental being affected, but does change it’s nature.":
        - cell "Alter Energy"
        - cell "Free Access"
        - cell "40-50"
        - cell "The caster can transform intensities of any kind of elemental intensity into another, such as converting fire into electricity. If these intensities are magical or have their own presence (such as an elemental) they can resist with a successful MR check. This spell does not harm any elemental being affected, but does change it’s nature."
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('"/" redirects to "/spelllist" preserving query params', async ({ page }) => {
  4  |   await page.goto('/?q=fire&maintenance=daily');
  5  |   await expect(page).toHaveURL(/\/spelllist\?q=fire&maintenance=daily/);
  6  |   await expect(page.locator('#spell-search')).toHaveValue('fire');
  7  |   await expect(page.locator('.stats-bar')).not.toContainText('of 0');
  8  | });
  9  | 
  10 | test('clear filters button resets search and filter params on /spelllist', async ({ page }) => {
  11 |   await page.goto('/spelllist?q=fire&maintenance=daily');
  12 |   await expect(page.locator('#spell-search')).toHaveValue('fire');
  13 |   const clear = page.getByRole('button', { name: 'Clear filters' });
  14 |   await expect(clear).toBeVisible();
  15 |   await clear.click();
  16 |   await expect(page).toHaveURL(/\/spelllist$/);
  17 |   await expect(page.locator('#spell-search')).toHaveValue('');
  18 | });
  19 | 
  20 | test('preserves and restores list filter state across navigation away and back to /spelllist', async ({ page }) => {
  21 |   await page.goto('/spelllist?q=fire&maintenance=daily');
  22 |   await expect(page.locator('#spell-search')).toHaveValue('fire');
  23 |   await page.getByRole('heading', { name: 'Spellbooks' }).waitFor({ state: 'detached' }).catch(() => {});
  24 |   await page.evaluate(() => (window as any).appRouter.navigate('/spellbooks'));
  25 |   await expect(page).toHaveURL(/\/spellbooks$/);
> 26 |   await expect(page.getByRole('heading', { name: 'Spellbooks' })).toBeVisible();
     |                                                                   ^ Error: expect(locator).toBeVisible() failed
  27 |   await expect(page.locator('#spell-search')).toHaveCount(0);
  28 |   await page.evaluate(() => (window as any).appRouter.navigate('/spelllist'));
  29 |   await expect(page).toHaveURL(/\/spelllist\?q=fire&maintenance=daily/);
  30 |   await expect(page.locator('#spell-search')).toHaveValue('fire');
  31 | });
  32 | 
  33 | test('deep-links and refreshes nested /spellbooks route with correct rendered view and assets', async ({ page }) => {
  34 |   await page.goto('/spellbooks');
  35 |   await expect(page).toHaveURL(/\/spellbooks$/);
  36 |   await expect(page.getByRole('heading', { name: 'Spellbooks', exact: true })).toBeVisible();
  37 |   await expect(page.locator('#spell-search')).toHaveCount(0);
  38 |   await page.reload();
  39 |   await expect(page).toHaveURL(/\/spellbooks$/);
  40 |   await expect(page.getByRole('heading', { name: 'Spellbooks', exact: true })).toBeVisible();
  41 |   await expect(page.locator('#app')).toBeVisible();
  42 | });
  43 | 
  44 | 
```