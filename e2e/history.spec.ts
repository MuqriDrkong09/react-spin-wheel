import { expect, test } from '@playwright/test';

import {
  clearAppData,
  completeSimpleSpin,
  forceRandomSequence,
  goToDashboard,
  goToHistory,
  openApp,
} from './helpers/app';

test.describe('History', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0, 0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('shows an empty state before any spins', async ({ page }) => {
    await goToHistory(page);
    await expect(page.getByRole('heading', { name: 'No spin history yet', level: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear history' })).toHaveCount(0);
  });

  test('opens details, filters results, deletes one entry, and clears history', async ({ page }) => {
    await completeSimpleSpin(page, 'History Wheel');
    await goToHistory(page);

    await expect(page.getByText('Pizza')).toBeVisible();
    await expect(page.getByText('History Wheel')).toBeVisible();

    await page.getByRole('button', { name: 'View details: Pizza' }).click();
    const details = page.getByRole('dialog', { name: 'Spin result' });
    await expect(details.getByText('History Wheel')).toBeVisible();
    await expect(details.getByText('Pizza', { exact: true }).first()).toBeVisible();
    await details.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('textbox', { name: 'Search results' }).fill('noodles');
    await expect(page.getByRole('heading', { name: 'No matching results', level: 2 })).toBeVisible();

    await page.getByRole('textbox', { name: 'Search results' }).fill('');
    await expect(page.getByText('Pizza', { exact: true }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Delete result: Pizza' }).click();
    const deleteDialog = page.getByRole('dialog', { name: 'Delete result' });
    await deleteDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: 'No spin history yet', level: 2 })).toBeVisible();

    await goToDashboard(page);
    await completeSimpleSpin(page, 'Clearable Wheel');
    await goToHistory(page);
    await page.getByRole('button', { name: 'Clear history' }).click();
    const clearDialog = page.getByRole('dialog', { name: 'Clear history' });
    await clearDialog.getByRole('button', { name: 'Clear history' }).click();
    await expect(page.getByRole('heading', { name: 'No spin history yet', level: 2 })).toBeVisible();
  });
});
