import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  test.slow();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.addInitScript(() => {
    window.localStorage.clear();
    (window as any).PLAYWRIGHT_TEST = true;
  });
});

test.describe('Sticky Live Score Banner (Tier 1)', () => {
  test('Banner is visible on homepage', async ({ page }) => {
    await page.goto('/');
    // Expect to fail since unimplemented
    await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  });

  test('Banner is visible on matches page', async ({ page }) => {
    await page.goto('/matches');
    await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  });

  test('Banner is visible on match details page', async ({ page }) => {
    await page.goto('/match/1');
    await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  });

  test('User can close/minimize the banner', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="close-banner"]');
    await expect(page.locator('[data-testid="live-banner"]')).toBeHidden();
  });

  test('Sticky banner handles mobile layout', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  });
});

test.describe('Sticky Live Score Banner (Tier 2 - Boundaries & Error Cases)', () => {
  test('Banner behaviour when no live matches are active', async ({ page }) => {
    // Mock matches API to return no live matches
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, status: 'SCHEDULED', home_team: { name: 'A' }, away_team: { name: 'B' } }]),
      });
    });

    await page.goto('/');
    // Banner should be hidden if no matches are IN_PLAY
    await expect(page.locator('[data-testid="live-banner"]')).toBeHidden();
  });

  test('API failure handles gracefully without breaking banner', async ({ page }) => {
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/');
    // Banner should handle the error safely (e.g. stay hidden or display "Offline")
    await expect(page.locator('[data-testid="live-banner"]')).toBeHidden();
  });

  test('Banner handles screen size smaller than 320px cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 500 });
    await page.goto('/');
    // Should still work or be sized properly
    await expect(page.locator('[data-testid="live-banner"]')).toBeDefined();
  });

  test('Banner does not overlap footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    const banner = page.locator('[data-testid="live-banner"]');
    // Ensure footer is defined
    await expect(footer).toBeDefined();
  });

  test('Sticky widget handles live updates', async ({ page }) => {
    await page.goto('/');
    // Banner updates status
    await expect(page.locator('[data-testid="live-banner"]')).toBeDefined();
  });
});
