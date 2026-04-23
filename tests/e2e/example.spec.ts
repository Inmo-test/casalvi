import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // Note: Adjust this expected title to matches actual app title
    await expect(page).toHaveTitle(/Casalvi/);
});
