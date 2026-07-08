import { test, expect } from '@playwright/test';

test.describe('World Cup Hub (Tier 1)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Navigate to /world-cup displays World Cup Hub header', async ({ page }) => {
    await page.goto('/world-cup');
    // Expecting to fail on unimplemented page with 404 or missing title
    const header = page.locator('h1');
    await expect(header).toContainText('كأس العالم');
  });

  test('World Cup standings section is visible', async ({ page }) => {
    await page.goto('/world-cup');
    const standings = page.locator('text=جدول الترتيب');
    await expect(standings).toBeVisible();
  });

  test('World Cup top scorers section is visible', async ({ page }) => {
    await page.goto('/world-cup');
    const scorers = page.locator('text=الهدافين').first();
    await expect(scorers).toBeVisible();
  });

  test('World Cup matches list is visible', async ({ page }) => {
    await page.goto('/world-cup');
    const matches = page.locator('text=المباريات').first();
    await expect(matches).toBeVisible();
  });

  test('Breadcrumbs exist and are correct', async ({ page }) => {
    await page.goto('/world-cup');
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('الرئيسية');
  });
});

test.describe('World Cup Hub (Tier 2 - Boundaries & Error Cases)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Empty state handled for standings', async ({ page }) => {
    // Route standings query to return empty data
    await page.route('**/rest/v1/standings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/world-cup');
    const emptyState = page.locator('text=لا يوجد ترتيب متاح حالياً');
    await expect(emptyState).toBeVisible();
  });

  test('API failure handling during fetch does not crash page', async ({ page }) => {
    await page.route('**/rest/v1/standings*', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/world-cup');
    const header = page.locator('h1');
    await expect(header).toContainText('كأس العالم');
  });

  test('Accessing invalid league ID shows 404', async ({ page }) => {
    await page.goto('/leagues/invalid-league-id');
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('Standings display correctly with missing team logo', async ({ page }) => {
    await page.route('**/rest/v1/standings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { team_id: 1, team_name: 'Argentina', logo_url: null, points: 9 }
        ]),
      });
    });

    await page.goto('/world-cup');
    await expect(page.locator('text=Argentina')).toBeVisible();
  });

  test('Out of bounds parameters on matches filter handles gracefully', async ({ page }) => {
    await page.goto('/world-cup?group=Z'); // Z is invalid group
    const header = page.locator('h1');
    await expect(header).toContainText('كأس العالم');
  });
});
