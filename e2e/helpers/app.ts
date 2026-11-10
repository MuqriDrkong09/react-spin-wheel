import { expect, type Download, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export const STORAGE_KEY = 'spinflow.persisted';

export async function openApp(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
}

export async function clearAppData(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate((key) => {
    window.localStorage.removeItem(key);
  }, STORAGE_KEY);
}

export async function forceRandomSequence(page: Page, values: number[]): Promise<void> {
  await page.addInitScript((sequence) => {
    let index = 0;
    Math.random = () => {
      const value = sequence[Math.min(index, sequence.length - 1)] ?? 0;
      index += 1;
      return value;
    };
  }, values);
}

async function clickByAriaLabel(page: Page, label: string): Promise<void> {
  const locator = page.locator(`[aria-label="${label}"]`).first();
  await expect(locator).toBeVisible();
  await locator.evaluate((element: HTMLElement) => {
    element.click();
  });
}

export async function createDinnerWheel(page: Page, name = 'Dinner Wheel'): Promise<void> {
  await page.getByRole('button', { name: 'Create Wheel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create wheel', level: 1 })).toBeVisible();

  await page.getByLabel(/wheel name/i).fill(name);
  await page.getByRole('textbox', { name: /option 1/i }).fill('Pizza');
  await page.getByRole('button', { name: 'Add option' }).click();
  await page.getByRole('textbox', { name: /option 2/i }).fill('Burger');
  await page.getByRole('button', { name: 'Add option' }).click();
  await page.getByRole('textbox', { name: /option 3/i }).fill('Noodles');
  await page.getByRole('button', { name: 'Create wheel', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Wheel editor', level: 1 })).toBeVisible();
  await expect(page.getByRole('list', { name: `${name} tree` })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit Pizza', exact: true })).toBeVisible();
}

async function submitChildName(page: Page, name: string): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Add Child Data' });
  await expect(dialog).toBeVisible();
  const nameField = dialog.getByLabel(/child name/i);
  await nameField.fill(name);
  // RHF submit via Enter is more reliable than clicking the dialog button under the editor panel.
  await nameField.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: `Edit ${name}`, exact: true })).toBeVisible();
}

export async function addPizzaChildren(page: Page): Promise<void> {
  await clickByAriaLabel(page, 'Add child to Pizza');
  await submitChildName(page, 'Chicken Pepperoni');

  await clickByAriaLabel(page, 'Add child to Pizza');
  await submitChildName(page, 'Beef Pepperoni');
}

export async function editItemName(page: Page, from: string, to: string): Promise<void> {
  await clickByAriaLabel(page, `Edit ${from}`);
  const dialog = page.getByRole('dialog', { name: `Edit ${from}` });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name/i).fill(to);
  await dialog.getByRole('button', { name: 'Save item' }).click();
  await expect(page.getByRole('button', { name: `Edit ${to}`, exact: true })).toBeVisible();
}

export async function goToDashboard(page: Page): Promise<void> {
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Dashboard' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
}

export async function openWheel(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: `Open ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Spin', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spin the wheel' })).toBeEnabled();
}

export async function spinUntilWinner(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Spin the wheel' }).click();
  await expect(page.getByRole('dialog', { name: '🎉 Winner!' })).toBeVisible();
}

export async function finishSelection(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByRole('region', { name: '🎉 Final result' })).toBeVisible();
}

export async function goToNav(page: Page, label: string, heading = label): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: label, exact: true })
    .click();
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
}

export async function goToHistory(page: Page): Promise<void> {
  await goToNav(page, 'History');
}

export async function completeSimpleSpin(
  page: Page,
  wheelName = 'Dinner Wheel',
): Promise<void> {
  await createDinnerWheel(page, wheelName);
  await goToDashboard(page);
  await openWheel(page, wheelName);
  await spinUntilWinner(page);
  await finishSelection(page);
}

export async function openMobileNav(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Open navigation' }).click();
  // MUI temporary drawers are exposed as dialogs.
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Dashboard' })).toBeVisible();
}

export async function mobileNavButton(page: Page, name: string) {
  return page.getByRole('dialog').getByRole('button', { name });
}

export async function downloadText(download: Download): Promise<string> {
  const path = await download.path();
  if (!path) {
    throw new Error('Download path was not available');
  }
  return readFileSync(path, 'utf8');
}
