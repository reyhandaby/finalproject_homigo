import { test, expect } from '@playwright/test';

test('upload image on property edit page', async ({ page }) => {
  await page.route('**/properties/prop-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'prop-1', name: 'Rumah Uji', city: 'Bandung', images: [], facilities: [], seasonRates: [], rooms: [] }),
    });
  });
  let createdImage: { id?: string; url?: string } | null = null;
  await page.route('**/properties/prop-1/images', async (route) => {
    const body = { id: 'img-1', url: 'data:image/jpeg;base64,ZmFrZQ==' };
    createdImage = body;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('/tenant/properties/prop-1/edit');
  const fileInput = page.locator('input[type="file"][accept="image/*"]');
  await fileInput.setInputFiles({ name: 'test.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('test') });
  await fileInput.evaluate((el: HTMLInputElement) => el.dispatchEvent(new Event('change', { bubbles: true })));
  await expect.poll(() => createdImage?.id).toBe('img-1');
  await expect(page.locator('img[alt=""]').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hapus' }).first()).toBeVisible();
});
