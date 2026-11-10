import { expect, test } from '@playwright/test';

import { clearAppData, forceRandomSequence, goToNav, openApp } from './helpers/app';

test.describe('Main navigation', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('opens every primary destination from the sidebar', async ({ page }) => {
    const destinations: Array<{ label: string; heading: string }> = [
      { label: 'Wheels', heading: 'Wheels' },
      { label: 'Editor', heading: 'Wheel editor' },
      { label: 'Spin', heading: 'Spin' },
      { label: 'History', heading: 'History' },
      { label: 'Statistics', heading: 'Statistics' },
      { label: 'Presets', heading: 'Presets' },
      { label: 'Generator', heading: 'Random generator' },
      { label: 'Settings', heading: 'Settings' },
      { label: 'Dashboard', heading: 'Dashboard' },
    ];

    for (const destination of destinations) {
      await goToNav(page, destination.label, destination.heading);
      await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: destination.label, exact: true })).toBeVisible();
    }
  });
});
