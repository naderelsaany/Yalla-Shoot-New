import { test, expect } from '@playwright/test';

// Helper to mock Supabase responses
const mockMatches = [
  {
    id: '1',
    match_date: new Date().toISOString(),
    status: 'IN_PLAY',
    home_score: 2,
    away_score: 1,
    home_team: { name: 'Liverpool FC', logo_url: 'https://example.com/liverpool.png' },
    away_team: { name: 'Arsenal FC', logo_url: 'https://example.com/arsenal.png' },
    league: { name: 'UEFA Champions League' }
  },
  {
    id: '2',
    match_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
    status: 'SCHEDULED',
    home_score: 0,
    away_score: 0,
    home_team: { name: 'Real Madrid CF', logo_url: 'https://example.com/madrid.png' },
    away_team: { name: 'FC Barcelona', logo_url: 'https://example.com/barca.png' },
    league: { name: 'Primera Division' }
  }
];

test.describe('Match List & Live Score Ticker (Tier 1)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    // Set window-level flag for frontend mock client
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });

    // Route Supabase requests
    await page.route('**/rest/v1/matches*', async (route) => {
      const url = route.request().url();
      if (url.includes('id=eq.1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockMatches[0]]),
        });
      } else if (url.includes('id=eq.2')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockMatches[1]]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-1/2' },
          body: JSON.stringify(mockMatches),
        });
      }
    });
  });

  test('Homepage displays list of matches', async ({ page }) => {
    await page.goto('/');
    // Check main title
    await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
    // Check match card elements
    await expect(page.locator('text="ليفربول"')).toBeVisible();
    await expect(page.locator('text="أرسنال"')).toBeVisible();
  });

  test('Matches page displays matches grouped by league', async ({ page }) => {
    await page.goto('/matches');
    // Check breadcrumbs and headers
    await expect(page.locator('h1')).toContainText('جدول المباريات');
    await expect(page.locator('text="دوري أبطال أوروبا"').first()).toBeVisible();
  });

  test('Match details page displays teams, score, and status info', async ({ page }) => {
    await page.goto('/match/1');
    // Check teams names
    await expect(page.locator('text="ليفربول"')).toBeVisible();
    await expect(page.locator('text="أرسنال"')).toBeVisible();
    // Check score
    await expect(page.locator('text=2').first()).toBeVisible();
    await expect(page.locator('text=1').first()).toBeVisible();
    // Check Live status text
    await expect(page.locator('text=مباشر الآن')).toBeVisible();
  });

  test('Clicking on a match card redirects to details page', async ({ page }) => {
    await page.goto('/');
    // Click on Liverpool vs Arsenal card
    await page.click('text="ليفربول"');
    await page.waitForURL('**/match/1');
    await expect(page.locator('text="دوري أبطال أوروبا"').first()).toBeVisible();
  });

  test('Live score ticker displays matches', async ({ page }) => {
    await page.goto('/');
    // Expect ticker elements to exist
    await expect(page.locator('.animate-pulse').first()).toBeVisible();
    await expect(page.locator('text="ليفربول"')).toBeVisible();
  });
});

test.describe('Match List & Live Score Ticker (Tier 2 - Boundaries & Error Cases)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Empty state when no matches exist on selected date in matches page', async ({ page }) => {
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/0' },
        body: JSON.stringify([]),
      });
    });

    await page.goto('/matches?date=2026-12-31');
    await expect(page.locator('text=لا توجد مباريات متاحة في هذا اليوم')).toBeVisible();
  });

  test('API failure handling keeps page stable', async ({ page }) => {
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/');
    // Page should still load header/footer and not crash
    await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
  });

  test('Navigation to non-existent match details page triggers 404', async ({ page }) => {
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/match/999999');
    // Check that standard Next.js 404 page is displayed
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('Invalid date in query parameter falls back gracefully', async ({ page }) => {
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-1/2' },
        body: JSON.stringify(mockMatches),
      });
    });

    await page.goto('/matches?date=not-a-date');
    // Page should fall back and load the match list or empty message without throwing error
    await expect(page.locator('h1')).toContainText('جدول المباريات');
  });

  test('Out of bounds page parameter shows empty state correctly', async ({ page }) => {
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/0' },
        body: JSON.stringify([]),
      });
    });

    await page.goto('/matches?page=999');
    await expect(page.locator('text=لا توجد مباريات متاحة في هذا اليوم')).toBeVisible();
  });
});
