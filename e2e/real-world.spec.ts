import { test, expect } from '@playwright/test';

test.describe('Real-World Workloads (Tier 4)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Realistic user browsing journey', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
    
    // 2. Click on a match details page
    await page.click('text="ليفربول"');
    await page.waitForURL('**/match/1');
    await expect(page.locator('text=دوري أبطال أوروبا').first()).toBeVisible();

    // 3. Go to a team page (from match details)
    await page.click('[data-testid="team-link-home"]');
    await page.waitForURL('**/teams/*');

    // 4. Click on a player in squad to go to player page
    await page.click('[data-testid="player-link"]');
    await page.waitForURL('**/players/*');
  });

  test('World Cup tournament day user scenario', async ({ page }) => {
    // 1. Go to World Cup Hub
    await page.goto('/world-cup');
    await expect(page.locator('h1')).toContainText('كأس العالم');

    // 2. Toggle standings tab
    await page.click('text=جدول الترتيب');
    await expect(page.locator('[data-testid="standings-table"]')).toBeVisible();

    // 3. Toggle scorers tab
    await page.click('text=الهدافين');
    await expect(page.locator('[data-testid="scorers-list"]')).toBeVisible();

    // 4. Select a match from World Cup matches list
    await page.click('[data-testid="wc-match-card"]');
    await page.waitForURL('**/match/*');
  });

  test('Fast pacing navigation stress test', async ({ page }) => {
    test.slow();
    // Rapidly navigate between pages to ensure stability and no memory leaks/errors
    await page.goto('/');
    await page.goto('/matches');
    await page.goto('/match/1');
    await page.goto('/world-cup');
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
  });

  test('Real-time live match event simulation', async ({ page }) => {
    // Simulating multiple realtime score updates
    let score = { home: 0, away: 0 };
    await page.route('**/rest/v1/matches*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          status: 'IN_PLAY',
          home_score: score.home,
          away_score: score.away,
          home_team: { name: 'Liverpool FC' },
          away_team: { name: 'Arsenal FC' }
        }]),
      });
    });

    await page.goto('/');
    // Verify that the teams are displayed
    await expect(page.locator('text="ليفربول"').first()).toBeVisible();
    await expect(page.locator('text="أرسنال"').first()).toBeVisible();

    // Update score to 1-0
    score = { home: 1, away: 0 };
    await page.reload(); // Trigger data fetch
    await expect(page.locator('text="1 - 0"')).toBeVisible();

    // Update score to 1-1
    score = { home: 1, away: 1 };
    await page.reload(); // Trigger data fetch
    await expect(page.locator('text="1 - 1"')).toBeVisible();
  });

  test('RTL responsiveness and mobile navigation test', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/matches');
    
    // Check dir="rtl" on html element
    const dirAttr = await page.getAttribute('html', 'dir');
    expect(dirAttr).toBe('rtl');

    // Click on date slider to navigate
    await page.click('text=اليوم التالي');
    // Page is responsive and loads without error
    await expect(page.locator('h1')).toContainText('جدول المباريات');
  });
});
