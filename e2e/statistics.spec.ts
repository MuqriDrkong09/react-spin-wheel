import { expect, test } from '@playwright/test';

import {
  clearAppData,
  completeSimpleSpin,
  forceRandomSequence,
  goToNav,
  openApp,
} from './helpers/app';

test.describe('Statistics', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0, 0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('shows an empty state before any completed selections', async ({ page }) => {
    await goToNav(page, 'Statistics');
    await expect(page.getByRole('heading', { name: 'No statistics yet', level: 2 })).toBeVisible();
  });

  test('shows spin trends after finishing a selection', async ({ page }) => {
    await completeSimpleSpin(page, 'Stats Wheel');
    await goToNav(page, 'Statistics');

    await expect(page.getByText('Total spins')).toBeVisible();
    await expect(page.getByText('Unique winners')).toBeVisible();
    await expect(page.getByText('Total completed selections')).toBeVisible();
    await expect(page.getByText('Most selected parent')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Date range' })).toBeVisible();
    await expect(page.getByText('Pizza', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Daily activity')).toBeVisible();
    await expect(page.getByText('Weekly activity')).toBeVisible();
    await expect(page.getByText('Monthly activity')).toBeVisible();
    await expect(page.getByText('Winner distribution')).toBeVisible();
    await expect(page.getByText('Spins per wheel')).toBeVisible();
  });
});
