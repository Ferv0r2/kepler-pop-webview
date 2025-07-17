import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('Authentication Flow', () => {
  test('should automatically log in as test-admin', async ({ page }) => {
    await authHelper.loginAsTestAdmin(page);
    await expect(page.getByText('Welcome, Test Admin')).toBeVisible();
  });

  test('should redirect to auth page when accessing protected route without authentication', async ({ page }) => {
    await page.goto('/game');
    await expect(page).toHaveURL('/auth');
  });

  test('should redirect to auth page after logging out', async ({ page }) => {
    await authHelper.loginAsTestAdmin(page);
    await page.getByText('Logout').click();
    await expect(page).toHaveURL('/auth');
  });
});
