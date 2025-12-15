import { test, expect } from '@playwright/test';

test('register unified page renders', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Daftar' })).toBeVisible();
  await expect(page.getByLabel('User')).toBeVisible();
  await expect(page.getByLabel('Tenant')).toBeVisible();
});

test('login unified page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await expect(page.getByLabel('User')).toBeVisible();
  await expect(page.getByLabel('Tenant')).toBeVisible();
});

test('tenant login flow redirects to dashboard', async ({ page }) => {
  await page.route('http://localhost:4000/auth/login', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'test-token', role: 'TENANT' }) });
  });
  await page.route('http://localhost:4000/bookings/tenant', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.goto('/login');
  await page.getByLabel('Tenant').check();
  await page.getByPlaceholder('Email').fill('tenant@example.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/tenant\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
