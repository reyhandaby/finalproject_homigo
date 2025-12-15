import { test, expect } from '@playwright/test';

test('landing loads and has search inputs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Temukan tempat menginap')).toBeVisible();
  await expect(page.getByLabel('Kota')).toBeVisible();
  await expect(page.getByLabel('Check-in')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cari', exact: true })).toBeVisible();
});
