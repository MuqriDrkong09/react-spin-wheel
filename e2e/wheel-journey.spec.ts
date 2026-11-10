import { expect, test } from '@playwright/test';

import {
  addPizzaChildren,
  clearAppData,
  createDinnerWheel,
  finishSelection,
  forceRandomSequence,
  goToDashboard,
  goToHistory,
  openApp,
  openWheel,
  spinUntilWinner,
} from './helpers/app';

test.describe('Dinner wheel journey', () => {
  test.beforeEach(async ({ page }) => {
    // Parent spin: Pizza. Child spin: Chicken Pepperoni.
    await forceRandomSequence(page, [0, 0, 0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('creates a hierarchical wheel, spins into children, saves history, and persists', async ({
    page,
  }) => {
    await createDinnerWheel(page, 'Dinner Wheel');
    await addPizzaChildren(page);

    await goToDashboard(page);
    await expect(page.getByRole('heading', { name: 'Dinner Wheel', level: 3 })).toBeVisible();
    await openWheel(page, 'Dinner Wheel');

    await spinUntilWinner(page);
    const winnerDialog = page.getByRole('dialog', { name: '🎉 Winner!' });
    await expect(winnerDialog.getByText('Pizza', { exact: true })).toBeVisible();
    await expect(winnerDialog.getByText('Additional data available')).toBeVisible();
    await expect(winnerDialog.getByRole('button', { name: 'Spin Child' })).toBeVisible();

    await winnerDialog.getByRole('button', { name: 'Spin Child' }).click();
    await expect(page.getByText('Children of Pizza')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeEnabled();

    await spinUntilWinner(page);
    const childWinnerDialog = page.getByRole('dialog', { name: '🎉 Winner!' });
    await expect(childWinnerDialog.getByText('Chicken Pepperoni', { exact: true })).toBeVisible();

    await finishSelection(page);
    const finalResult = page.getByRole('region', { name: '🎉 Final result' });
    await expect(finalResult.getByText('Dinner Wheel')).toBeVisible();
    await expect(finalResult.getByText('Chicken Pepperoni', { exact: true })).toBeVisible();
    await expect(finalResult.getByText('Pizza', { exact: true })).toBeVisible();

    await goToHistory(page);
    await expect(page.getByText('Pizza → Chicken Pepperoni')).toBeVisible();
    await expect(page.getByText('Dinner Wheel')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'History', level: 1 })).toBeVisible();
    await expect(page.getByText('Pizza → Chicken Pepperoni')).toBeVisible();

    await goToDashboard(page);
    await expect(page.getByRole('heading', { name: 'Dinner Wheel', level: 3 })).toBeVisible();
    await page.getByRole('button', { name: 'Edit Dinner Wheel', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Wheel editor', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Chicken Pepperoni', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Beef Pepperoni', exact: true })).toBeVisible();
  });
});
