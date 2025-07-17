import { Page } from '@playwright/test';

export const authHelper = {
  async loginAsTestAdmin(page: Page) {
    await page.goto('/api/auth/test-admin');
  },
};
