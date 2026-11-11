import { expect, test } from '@playwright/test';

import { clearAppData, createDinnerWheel, forceRandomSequence, goToDashboard, goToNav, openApp } from './helpers/app';

test.describe('Wheels page', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('shows the wheels page heading and description', async ({ page }) => {
    await goToNav(page, 'Wheels');
    await expect(page.getByRole('heading', { name: 'Wheels', level: 1 })).toBeVisible();
    await expect(
      page.getByText('Browse, organize, and open the wheels in your workspace.'),
    ).toBeVisible();
  });

  test('keeps created wheels available from the dashboard after visiting wheels', async ({ page }) => {
    await createDinnerWheel(page, 'Listed Wheel');
    await goToNav(page, 'Wheels');
    await goToDashboard(page);
    await expect(page.getByRole('heading', { name: 'Listed Wheel', level: 3 })).toBeVisible();
  });
});
