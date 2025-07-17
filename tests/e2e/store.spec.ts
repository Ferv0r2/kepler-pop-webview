import { test, expect } from '@playwright/test';

import { authHelper } from '../helpers/auth-helper';

test.describe('Store and Items', () => {
  test.beforeEach(async ({ page }) => {
    await authHelper.loginAsTestAdmin(page);
  });

  test('should display items in the store', async ({ page }) => {
    await page.goto('/store');
    await expect(page.getByText('Energy')).toBeVisible();
    await expect(page.getByText('Gems')).toBeVisible();
  });

  test('should simulate a purchase flow', async ({ page }) => {
    await page.goto('/store');
    await page.getByTestId('buy-energy-button').click();
    await expect(page.getByText('Purchase Successful')).toBeVisible();
  });

  test('should check the energy system', async ({ page }) => {
    await page.goto('/');
    const initialEnergy = await page.getByTestId('energy-display').textContent();
    await page.goto('/game?mode=casual');
    // Play a bit to consume energy
    await page.goto('/');
    const finalEnergy = await page.getByTestId('energy-display').textContent();
    expect(Number(finalEnergy)).toBeLessThan(Number(initialEnergy));
  });
});
