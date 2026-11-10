import { expect, test } from '@playwright/test';

import { clearAppData, forceRandomSequence, goToNav, openApp } from './helpers/app';

test.describe('Random generator', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0, 0, 0]);
    await clearAppData(page);
    await openApp(page);
    await goToNav(page, 'Generator', 'Random generator');
  });

  test('generates a random integer in range', async ({ page }) => {
    const form = page.getByRole('form', { name: 'Random number' });
    await form.getByLabel('Minimum').fill('5');
    await form.getByLabel('Maximum').fill('9');
    await form.getByRole('button', { name: 'Generate number' }).click();
    await expect(form.getByRole('status')).toHaveText('5');
  });

  test('generates a weighted item, name, and choice', async ({ page }) => {
    await page.getByRole('tab', { name: 'Random item' }).click();
    const itemForm = page.getByRole('form', { name: 'Random item' });
    await itemForm.getByRole('textbox', { name: 'Item 1' }).fill('Pizza');
    await itemForm.getByRole('spinbutton', { name: 'Weight 1' }).fill('1');
    await itemForm.getByRole('textbox', { name: 'Item 2' }).fill('Burger');
    await itemForm.getByRole('spinbutton', { name: 'Weight 2' }).fill('3');
    await itemForm.getByRole('button', { name: 'Generate item' }).click();
    await expect(itemForm.getByRole('status')).toHaveText('Pizza');

    await page.getByRole('tab', { name: 'Random name' }).click();
    const nameForm = page.getByRole('form', { name: 'Random name' });
    await nameForm.getByRole('button', { name: 'Generate name' }).click();
    await expect(nameForm.getByRole('status')).not.toHaveText('Generate to see a result.');

    await page.getByRole('tab', { name: 'Random choice' }).click();
    const choiceForm = page.getByRole('form', { name: 'Random choice' });
    await choiceForm.getByRole('button', { name: 'Generate choice' }).click();
    await expect(choiceForm.getByRole('status')).toHaveText('Yes');
  });

  test('generates teams from the default participant list', async ({ page }) => {
    await page.getByRole('tab', { name: 'Team generator' }).click();
    const teamForm = page.getByRole('form', { name: 'Team generator' });
    await teamForm.getByRole('button', { name: 'Generate teams' }).click();
    const result = teamForm.getByLabel('Generated teams');
    await expect(result).toContainText('Team A');
    await expect(result).toContainText('Team B');
  });
});
