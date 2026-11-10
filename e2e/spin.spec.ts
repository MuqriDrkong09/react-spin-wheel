import { expect, test } from '@playwright/test';

import {
  addPizzaChildren,
  clearAppData,
  createDinnerWheel,
  forceRandomSequence,
  goToDashboard,
  openApp,
  openWheel,
  spinUntilWinner,
} from './helpers/app';

test.describe('Spin screen', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0, 0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('spins again from a leaf winner dialog', async ({ page }) => {
    await createDinnerWheel(page, 'Spin Wheel');
    await goToDashboard(page);
    await openWheel(page, 'Spin Wheel');

    await spinUntilWinner(page);
    const dialog = page.getByRole('dialog', { name: '🎉 Winner!' });
    await expect(dialog.getByText('Pizza', { exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Spin Again' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Spin Again' }).click();
    await expect(page.getByRole('dialog', { name: '🎉 Winner!' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: '🎉 Winner!' }).getByText('Pizza', { exact: true })).toBeVisible();
  });

  test('closes a branch winner dialog and keeps the wheel ready', async ({ page }) => {
    await createDinnerWheel(page, 'Branch Wheel');
    await addPizzaChildren(page);
    await goToDashboard(page);
    await openWheel(page, 'Branch Wheel');

    await spinUntilWinner(page);
    const dialog = page.getByRole('dialog', { name: '🎉 Winner!' });
    await expect(dialog.getByRole('button', { name: 'Spin Child' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('dialog', { name: '🎉 Winner!' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeEnabled();
  });

  test('finishes a leaf winner and can start a new selection', async ({ page }) => {
    await createDinnerWheel(page, 'Finish Wheel');
    await goToDashboard(page);
    await openWheel(page, 'Finish Wheel');

    await spinUntilWinner(page);
    await page.getByRole('dialog', { name: '🎉 Winner!' }).getByRole('button', { name: 'Finish' }).click();

    const finalResult = page.getByRole('region', { name: '🎉 Final result' });
    await expect(finalResult.getByText('Finish Wheel')).toBeVisible();
    await expect(finalResult.getByText('Pizza', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Start New Selection' }).click();
    await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeEnabled();
    await expect(page.getByRole('region', { name: '🎉 Final result' })).toHaveCount(0);
  });
});
