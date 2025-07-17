import { test, expect } from '@playwright/test';

test.describe('Internationalization (i18n)', () => {
  test('should load pages in different locales', async ({ page }) => {
    await page.goto('/ko');
    await expect(page.getByText('환영합니다')).toBeVisible();
    await page.goto('/en');
    await expect(page.getByText('Welcome')).toBeVisible();
    await page.goto('/ja');
    await expect(page.getByText('ようこそ')).toBeVisible();
  });

  test('should display text in the correct language', async ({ page }) => {
    await page.goto('/ko/settings');
    await expect(page.getByText('설정')).toBeVisible();
    await page.goto('/en/settings');
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should handle URL routing for different locales', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Language' }).selectOption('ko');
    await expect(page).toHaveURL('/ko');
  });
});
