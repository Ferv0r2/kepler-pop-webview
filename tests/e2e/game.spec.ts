import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await authHelper.loginAsTestAdmin(page);
  });

  test('should start a casual mode game', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Casual').click();
    await expect(page).toHaveURL('/game?mode=casual');
    await expect(page.getByText('Score')).toBeVisible();
  });

  test('should match tiles and update score', async ({ page }) => {
    await page.goto('/game?mode=casual');
    // This is a placeholder for actual tile matching logic
    // which would require more complex selectors and actions.
    await expect(page.locator('.game-grid')).toBeVisible();
  });

  test('should show game over and update score', async ({ page }) => {
    await page.goto('/game?mode=casual');
    // This is a placeholder for game completion logic.
    await expect(page.getByText('Game Over')).toBeVisible();
    await expect(page.getByText('Final Score')).toBeVisible();
  });

  test('should open settings and exit game', async ({ page }) => {
    await page.goto('/game?mode=casual');
    await page.getByTestId('settings-button').click();
    await expect(page.getByText('Sound')).toBeVisible();
    await page.getByText('Exit Game').click();
    await expect(page).toHaveURL('/');
  });
});
