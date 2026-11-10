import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  addPizzaChildren,
  clearAppData,
  createDinnerWheel,
  downloadText,
  editItemName,
  forceRandomSequence,
  goToDashboard,
  openApp,
} from './helpers/app';

test.describe('Wheel management', () => {
  test.beforeEach(async ({ page }) => {
    await forceRandomSequence(page, [0, 0, 0, 0]);
    await clearAppData(page);
    await openApp(page);
  });

  test('edits an item name in the editor', async ({ page }) => {
    await createDinnerWheel(page, 'Rename Wheel');
    await editItemName(page, 'Pizza', 'Deep Dish');

    await expect(page.getByRole('alert')).toContainText('Deep Dish updated');
    await expect(page.getByRole('button', { name: 'Edit Deep Dish', exact: true })).toBeVisible();
  });

  test('deletes a wheel from the dashboard', async ({ page }) => {
    await createDinnerWheel(page, 'Delete Me');
    await goToDashboard(page);
    await expect(page.getByRole('heading', { name: 'Delete Me', level: 3 })).toBeVisible();

    await page.getByRole('button', { name: 'Delete Delete Me', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete wheel' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Delete Me', level: 3 })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No wheels yet', level: 2 })).toBeVisible();
  });

  test('exports a wheel and imports it again', async ({ page }) => {
    await createDinnerWheel(page, 'Export Wheel');
    await addPizzaChildren(page);
    await goToDashboard(page);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Export Wheel', exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('export-wheel.json');

    const exportedJson = await downloadText(download);
    expect(exportedJson).toContain('"name": "Export Wheel"');
    expect(exportedJson).toContain('"name": "Chicken Pepperoni"');
    expect(exportedJson).not.toContain('"id":');

    await page.getByRole('button', { name: 'Delete Export Wheel', exact: true }).click();
    await page.getByRole('dialog', { name: 'Delete wheel' }).getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'No wheels yet', level: 2 })).toBeVisible();

    const importPath = join(tmpdir(), `spinflow-export-${Date.now()}.json`);
    writeFileSync(importPath, exportedJson, 'utf8');

    await page.getByLabel('Choose wheel JSON file').setInputFiles(importPath);

    const importDialog = page.getByRole('dialog', { name: 'Import wheel' });
    await expect(importDialog).toBeVisible();
    await expect(importDialog.getByRole('textbox', { name: 'Wheel name' })).toHaveValue('Export Wheel');
    await importDialog.getByRole('button', { name: 'Import wheel' }).click();

    await expect(page.getByRole('alert')).toContainText('Imported Export Wheel');
    await expect(page.getByRole('heading', { name: 'Export Wheel', level: 3 })).toBeVisible();

    await page.getByRole('button', { name: 'Edit Export Wheel', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Edit Chicken Pepperoni', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit Beef Pepperoni', exact: true })).toBeVisible();
  });
});
