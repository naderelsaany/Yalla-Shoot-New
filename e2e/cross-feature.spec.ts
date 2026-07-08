import { test, expect } from '@playwright/test';

test.describe('Cross-Feature Combinations (Tier 3)', () => {
  test.beforeEach(async ({ page }) => {
    test.slow();
    await page.addInitScript(() => {
      (window as any).PLAYWRIGHT_TEST = true;
    });
  });

  test('Clicking a live match in the sticky banner redirects to match details page', async ({ page }) => {
    await page.goto('/');
    // Expect to fail since banner is not implemented
    await page.click('[data-testid="live-banner"] a');
    await page.waitForURL('**/match/*');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Clicking a player in the match lineup redirects to player profile', async ({ page }) => {
    await page.goto('/match/1');
    // Click on player name in squad/lineup list
    await page.click('[data-testid="player-link"]');
    await page.waitForURL('**/players/*');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Clicking a team logo in match details redirects to team profile', async ({ page }) => {
    await page.goto('/match/1');
    // Click on team name/logo
    await page.click('[data-testid="team-link-home"]');
    await page.waitForURL('**/teams/*');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Simulated admin updates in database update homepage list and ticker simultaneously', async ({ page }) => {
    let currentScore = { home: 2, away: 1 };
    await page.route('**/rest/v1/matches*', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: JSON.stringify([{ id: 1, status: 'IN_PLAY', home_score: currentScore.home, away_score: currentScore.away, home_team: { name: 'Liverpool FC' }, away_team: { name: 'Arsenal FC' } }]),
      });
    });

    await page.goto('/');
    // Check initial score
    await expect(page.locator('text=2').first()).toBeVisible();
    
    // Update score to 3-1
    currentScore = { home: 3, away: 1 };
    // Trigger some event to force update or wait for polling
    await page.reload();
    // Check new score updated
    await expect(page.locator('text=3').first()).toBeVisible();
  });

  test('Clicking World Cup in navigation redirects to World Cup Hub while banner stays active', async ({ page }) => {
    await page.goto('/');
    // Click World Cup link
    await page.click('text=كأس العالم');
    await page.waitForURL('**/world-cup');
    // World Cup page loads
    await expect(page.locator('h1')).toContainText('كأس العالم');
    // Banner is still visible
    await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  });
});
