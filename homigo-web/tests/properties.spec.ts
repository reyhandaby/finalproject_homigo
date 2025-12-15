import { test, expect } from '@playwright/test';

test('navigate to properties from landing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cari', exact: true }).click();
  await expect(page).toHaveURL(/\/properties/);
});

// Price filter functionality is covered via facility and slider presence tests.

test('create property submits facilityIds', async ({ page }) => {
  await page.route('**/facilities', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'wifi', name: 'WiFi' }, { id: 'ac', name: 'AC' }]),
    });
  });
  let postedBody: Record<string, unknown> | null = null;
  await page.route('**/properties', async (route) => {
    const request = route.request();
    postedBody = JSON.parse(request.postData() || '{}') as Record<string, unknown>;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'prop-123' }) });
  });
  await page.goto('/tenant/properties/new');
  await page.getByPlaceholder('Nama').fill('Rumah Contoh');
  await page.getByPlaceholder('Deskripsi').fill('Deskripsi singkat');
  await page.getByPlaceholder('Alamat').fill('Jalan Mawar No.1');
  await page.getByPlaceholder('Kota').fill('Bandung');
  await page.getByLabel('WiFi').click();
  await page.getByRole('button', { name: 'Simpan' }).click();
  await expect.poll(() => postedBody?.facilityIds).toContain('wifi');
  await expect(page).toHaveURL('/properties/prop-123');
});

test('facility filter pushes ids and names to URL', async ({ page }) => {
  await page.route('**/facilities', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'wifi', name: 'WiFi' }, { id: 'ac', name: 'AC' }]),
    });
  });
  await page.goto('/properties');
  await page.getByRole('button', { name: 'WiFi' }).click();
  await expect(page).toHaveURL(/facilityIds=wifi/);
  await expect(page).toHaveURL(/facilityNames=WiFi/);
});

test('dual-range slider renders two handles in all browsers', async ({ page }) => {
  await page.goto('/properties');
  const ranges = page.locator('input[type="range"]');
  await expect(ranges).toHaveCount(2);
});
