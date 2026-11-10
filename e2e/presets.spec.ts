import { expect, test } from '@playwright/test';

import { clearAppData, forceRandomSequence, goToDashboard, goToNav, openApp } from './helpers/app';

test.describe('Presets', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0]);
    await clearAppData(page);
    await openApp(page);
    await goToNav(page, 'Presets');
  });

  test('lists built-in presets and previews nested food options', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Food/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Movie/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Workout/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Team/ })).toBeVisible();

    await page.getByRole('button', { name: 'Preview Food' }).click();
    const dialog = page.getByRole('dialog', { name: 'Preview Food' });
    await expect(dialog.getByText('Chicken Pepperoni')).toBeVisible();
    await expect(dialog.getByText('Beef Pepperoni')).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('creates a wheel from a preset and opens spin', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Food from preset' }).click();
    await expect(page.getByRole('heading', { name: 'Spin', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeEnabled();

    await goToDashboard(page);
    await expect(page.getByRole('heading', { name: 'Food', level: 3 })).toBeVisible();
  });

  test('opens a preset copy in the editor when modifying', async ({ page }) => {
    await page.getByRole('button', { name: 'Modify Food' }).click();
    await expect(page.getByRole('heading', { name: 'Wheel editor', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Pizza', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Chicken Pepperoni', exact: true })).toBeVisible();
  });
});
