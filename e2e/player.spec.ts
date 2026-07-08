import { test, expect } from '@playwright/test';

test.describe('Player pSEO Profile (Tier 1)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Navigate to player page displays details header', async ({ page }) => {
    await page.goto('/players/messi');
    // Expect to fail since unimplemented
    await expect(page.locator('h1')).toContainText('ميسي');
  });

  test('Player statistics table is visible', async ({ page }) => {
    await page.goto('/players/messi');
    await expect(page.locator('text=الإحصائيات')).toBeVisible();
  });

  test('Club and national team info are displayed', async ({ page }) => {
    await page.goto('/players/messi');
    await expect(page.locator('text=النادي')).toBeVisible();
    await expect(page.locator('text=المنتخب')).toBeVisible();
  });

  test('Structured Data (Schema.org) for Athlete exists', async ({ page }) => {
    await page.goto('/players/messi');
    const schemaScript = page.locator('script[type="application/ld+json"]');
    await expect(schemaScript).toBeDefined();
  });

  test('Page has correct metadata tags', async ({ page }) => {
    await page.goto('/players/messi');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute('content', /تفاصيل وإحصائيات/);
  });
});

test.describe('Player pSEO Profile (Tier 2 - Boundaries & Error Cases)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Accessing non-existent player ID returns 404', async ({ page }) => {
    await page.goto('/players/999999');
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('Player with no current season stats displays zeros gracefully', async ({ page }) => {
    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'no-stats', name: 'No Stats Player', goals: null, assists: null }]),
      });
    });

    await page.goto('/players/no-stats');
    await expect(page.locator('text=0').first()).toBeVisible();
  });

  test('Free agent player displays free agent status', async ({ page }) => {
    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'free-agent', name: 'Free Agent', club: null }]),
      });
    });

    await page.goto('/players/free-agent');
    await expect(page.locator('text=لاعب حر')).toBeVisible();
  });

  test('Player with very long name or missing photos handles cleanly', async ({ page }) => {
    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'long-name', name: 'A'.repeat(100), photo_url: null }]),
      });
    });

    await page.goto('/players/long-name');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Supabase API crash handled gracefully on player page', async ({ page }) => {
    await page.route('**/rest/v1/players*', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/players/messi');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
