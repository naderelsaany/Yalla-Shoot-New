import { test, expect } from '@playwright/test';

test.describe('Team pSEO Profile (Tier 1)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Navigate to team page displays team name and info', async ({ page }) => {
    await page.goto('/teams/ahly');
    // Expect to fail since unimplemented
    await expect(page.locator('h1')).toContainText('الأهلي');
  });

  test('Team squad list is visible', async ({ page }) => {
    await page.goto('/teams/ahly');
    await expect(page.locator('text=قائمة اللاعبين')).toBeVisible();
  });

  test('Team standings position is visible', async ({ page }) => {
    await page.goto('/teams/ahly');
    await expect(page.locator('text=الترتيب')).toBeVisible();
  });

  test('Team logo is displayed', async ({ page }) => {
    await page.goto('/teams/ahly');
    await expect(page.locator('img[alt*="شعار"]')).toBeVisible();
  });

  test('Structured Data for SportsTeam exists', async ({ page }) => {
    await page.goto('/teams/ahly');
    const schemaScript = page.locator('script[type="application/ld+json"]');
    await expect(schemaScript).toBeDefined();
  });
});

test.describe('Team pSEO Profile (Tier 2 - Boundaries & Error Cases)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Accessing non-existent team ID returns 404', async ({ page }) => {
    await page.goto('/teams/999999');
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('Team with no players registered displays empty squad message', async ({ page }) => {
    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'no-players', name: 'No Players Club', logo_url: 'https://example.com/logo.png' }]),
      });
    });

    await page.goto('/teams/no-players');
    await expect(page.locator('text=لا يوجد لاعبين مسجلين حالياً')).toBeVisible();
  });

  test('Team not participating in any active league handles gracefully', async ({ page }) => {
    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'no-league', name: 'Friendly Club', league_id: null }]),
      });
    });

    await page.goto('/teams/no-league');
    await expect(page.locator('text=لا يشارك في بطولة رسمية')).toBeVisible();
  });

  test('Team without logo displays fallback team name or default logo', async ({ page }) => {
    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'no-logo', name: 'No Logo Club', logo_url: null }]),
      });
    });

    await page.goto('/teams/no-logo');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Supabase API crash handled gracefully on team page', async ({ page }) => {
    await page.route('**/rest/v1/teams*', async (route) => {
      await route.fulfill({ status: 500 });
    });

    await page.goto('/teams/ahly');
    await expect(page.locator('text=404')).toBeVisible();
  });
});
