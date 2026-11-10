import { expect, test } from '@playwright/test';

import {
  clearAppData,
  createDinnerWheel,
  forceRandomSequence,
  mobileNavButton,
  openApp,
  openMobileNav,
} from './helpers/app';

test.describe('Theme and mobile layout', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0]);
    await clearAppData(page);
  });

  test('switches to dark mode and keeps it after refresh', async ({ page }) => {
    await openApp(page);

    await page.getByRole('button', { name: 'Choose color mode' }).click();
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    await expect
      .poll(async () => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .toBe('rgb(11, 18, 32)');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
      .toBe('rgb(11, 18, 32)');
  });

  test('uses a mobile navigation drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);

    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await openMobileNav(page);
    await (await mobileNavButton(page, 'History')).click();
    await expect(page.getByRole('heading', { name: 'History', level: 1 })).toBeVisible();

    await openMobileNav(page);
    await (await mobileNavButton(page, 'Dashboard')).click();
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Create Wheel', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Create wheel', level: 1 })).toBeVisible();
  });

  test('keeps the dinner wheel flow usable on a phone-sized screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await createDinnerWheel(page, 'Mobile Dinner');

    await expect(page.getByRole('heading', { name: 'Wheel editor', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add child to Pizza', exact: true })).toBeVisible();

    await openMobileNav(page);
    await (await mobileNavButton(page, 'Dashboard')).click();
    await expect(page.getByRole('heading', { name: 'Mobile Dinner', level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Mobile Dinner', exact: true })).toBeVisible();
  });
});
