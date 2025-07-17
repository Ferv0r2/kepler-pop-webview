import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('Main Page Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await authHelper.loginAsTestAdmin(page);
  });

  test('should load the main page and allow game mode selection', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Casual')).toBeVisible();
    await expect(page.getByText('Challenge')).toBeVisible();
    await page.getByText('Casual').click();
    await expect(page).toHaveURL('/game?mode=casual');
  });

  test('should navigate using the bottom navigation bar', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Store').click();
    await expect(page).toHaveURL('/store');
    await page.getByText('Play').click();
    await expect(page).toHaveURL('/');
    await page.getByText('Settings').click();
    await expect(page).toHaveURL('/settings');
  });

  test('should navigate to the leaderboard and display data', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Leaderboard').click();
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.getByText('Top Players')).toBeVisible();
  });
});
