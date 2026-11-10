import { expect, test } from '@playwright/test';

import { clearAppData, forceRandomSequence, goToNav, openApp } from './helpers/app';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('toggles sound and celebration preferences and keeps them after refresh', async ({ page }) => {
    await goToNav(page, 'Settings');

    await expect(page.getByRole('switch', { name: 'Enable sound' })).toBeChecked();
    await expect(page.getByRole('switch', { name: 'Celebration effects' })).toBeChecked();

    await page.getByRole('switch', { name: 'Tick sounds' }).click();
    await expect(page.getByRole('switch', { name: 'Tick sounds' })).not.toBeChecked();

    await page.getByRole('switch', { name: 'Enable sound' }).click();
    await expect(page.getByRole('switch', { name: 'Enable sound' })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Spin sounds' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Preview sounds' })).toBeDisabled();

    await page.getByRole('switch', { name: 'Celebration effects' }).click();
    await expect(page.getByRole('switch', { name: 'Celebration effects' })).not.toBeChecked();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Enable sound' })).not.toBeChecked();
    await expect(page.getByRole('switch', { name: 'Celebration effects' })).not.toBeChecked();
  });
});
