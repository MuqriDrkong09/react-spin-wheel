import { expect, test } from '@playwright/test';

import { clearAppData, forceRandomSequence, openApp } from './helpers/app';

test.describe('Not found page', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0]);
    await clearAppData(page);
  });

  test('shows a recovery path back to the dashboard', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/this-route-does-not-exist');

    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
    await expect(page.getByText('The page you are looking for does not exist yet.')).toBeVisible();

    await page.getByRole('button', { name: 'Back to dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  });

  test('still boots the app shell for unknown routes', async ({ page }) => {
    await openApp(page);
    await page.goto('/missing-page');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Page not found', level: 1 })).toBeVisible();
  });
});
