# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cross-feature.spec.ts >> Cross-Feature Combinations (Tier 3) >> Clicking a team logo in match details redirects to team profile
- Location: e2e\cross-feature.spec.ts:27:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/match/1
Call log:
  - navigating to "http://localhost:3000/match/1", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Cross-Feature Combinations (Tier 3)', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     test.slow();
  6  |     await page.addInitScript(() => {
  7  |       (window as any).PLAYWRIGHT_TEST = true;
  8  |     });
  9  |   });
  10 | 
  11 |   test('Clicking a live match in the sticky banner redirects to match details page', async ({ page }) => {
  12 |     await page.goto('/');
  13 |     // Expect to fail since banner is not implemented
  14 |     await page.click('[data-testid="live-banner"] a');
  15 |     await page.waitForURL('**/match/*');
  16 |     await expect(page.locator('h1')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('Clicking a player in the match lineup redirects to player profile', async ({ page }) => {
  20 |     await page.goto('/match/1');
  21 |     // Click on player name in squad/lineup list
  22 |     await page.click('[data-testid="player-link"]');
  23 |     await page.waitForURL('**/players/*');
  24 |     await expect(page.locator('h1')).toBeVisible();
  25 |   });
  26 | 
  27 |   test('Clicking a team logo in match details redirects to team profile', async ({ page }) => {
> 28 |     await page.goto('/match/1');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/match/1
  29 |     // Click on team name/logo
  30 |     await page.click('[data-testid="team-link-home"]');
  31 |     await page.waitForURL('**/teams/*');
  32 |     await expect(page.locator('h1')).toBeVisible();
  33 |   });
  34 | 
  35 |   test('Simulated admin updates in database update homepage list and ticker simultaneously', async ({ page }) => {
  36 |     let currentScore = { home: 2, away: 1 };
  37 |     await page.route('**/rest/v1/matches*', async (route) => {
  38 |       if (route.request().method() !== 'GET') {
  39 |         await route.fallback();
  40 |         return;
  41 |       }
  42 |       await route.fulfill({
  43 |         status: 200,
  44 |         contentType: 'application/json',
  45 |         headers: {
  46 |           'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  47 |           'Pragma': 'no-cache',
  48 |           'Expires': '0',
  49 |         },
  50 |         body: JSON.stringify([{ id: 1, status: 'IN_PLAY', home_score: currentScore.home, away_score: currentScore.away, home_team: { name: 'Liverpool FC' }, away_team: { name: 'Arsenal FC' } }]),
  51 |       });
  52 |     });
  53 | 
  54 |     await page.goto('/');
  55 |     // Check initial score
  56 |     await expect(page.locator('text=2').first()).toBeVisible();
  57 |     
  58 |     // Update score to 3-1
  59 |     currentScore = { home: 3, away: 1 };
  60 |     // Trigger some event to force update or wait for polling
  61 |     await page.reload();
  62 |     // Check new score updated
  63 |     await expect(page.locator('text=3').first()).toBeVisible();
  64 |   });
  65 | 
  66 |   test('Clicking World Cup in navigation redirects to World Cup Hub while banner stays active', async ({ page }) => {
  67 |     await page.goto('/');
  68 |     // Click World Cup link
  69 |     await page.click('text=كأس العالم');
  70 |     await page.waitForURL('**/world-cup');
  71 |     // World Cup page loads
  72 |     await expect(page.locator('h1')).toContainText('كأس العالم');
  73 |     // Banner is still visible
  74 |     await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  75 |   });
  76 | });
  77 | 
```