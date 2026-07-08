# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: real-world.spec.ts >> Real-World Workloads (Tier 4) >> World Cup tournament day user scenario
- Location: e2e\real-world.spec.ts:30:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/world-cup
Call log:
  - navigating to "http://localhost:3000/world-cup", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Real-World Workloads (Tier 4)', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     test.slow();
  6   |     await page.addInitScript(() => {
  7   |       (window as any).PLAYWRIGHT_TEST = true;
  8   |     });
  9   |   });
  10  | 
  11  |   test('Realistic user browsing journey', async ({ page }) => {
  12  |     // 1. Visit homepage
  13  |     await page.goto('/');
  14  |     await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
  15  |     
  16  |     // 2. Click on a match details page
  17  |     await page.click('text="ليفربول"');
  18  |     await page.waitForURL('**/match/1');
  19  |     await expect(page.locator('text=دوري أبطال أوروبا').first()).toBeVisible();
  20  | 
  21  |     // 3. Go to a team page (from match details)
  22  |     await page.click('[data-testid="team-link-home"]');
  23  |     await page.waitForURL('**/teams/*');
  24  | 
  25  |     // 4. Click on a player in squad to go to player page
  26  |     await page.click('[data-testid="player-link"]');
  27  |     await page.waitForURL('**/players/*');
  28  |   });
  29  | 
  30  |   test('World Cup tournament day user scenario', async ({ page }) => {
  31  |     // 1. Go to World Cup Hub
> 32  |     await page.goto('/world-cup');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/world-cup
  33  |     await expect(page.locator('h1')).toContainText('كأس العالم');
  34  | 
  35  |     // 2. Toggle standings tab
  36  |     await page.click('text=جدول الترتيب');
  37  |     await expect(page.locator('[data-testid="standings-table"]')).toBeVisible();
  38  | 
  39  |     // 3. Toggle scorers tab
  40  |     await page.click('text=الهدافين');
  41  |     await expect(page.locator('[data-testid="scorers-list"]')).toBeVisible();
  42  | 
  43  |     // 4. Select a match from World Cup matches list
  44  |     await page.click('[data-testid="wc-match-card"]');
  45  |     await page.waitForURL('**/match/*');
  46  |   });
  47  | 
  48  |   test('Fast pacing navigation stress test', async ({ page }) => {
  49  |     test.slow();
  50  |     // Rapidly navigate between pages to ensure stability and no memory leaks/errors
  51  |     await page.goto('/');
  52  |     await page.goto('/matches');
  53  |     await page.goto('/match/1');
  54  |     await page.goto('/world-cup');
  55  |     await page.goto('/');
  56  |     await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
  57  |   });
  58  | 
  59  |   test('Real-time live match event simulation', async ({ page }) => {
  60  |     // Simulating multiple realtime score updates
  61  |     let score = { home: 0, away: 0 };
  62  |     await page.route('**/rest/v1/matches*', async (route) => {
  63  |       await route.fulfill({
  64  |         status: 200,
  65  |         contentType: 'application/json',
  66  |         body: JSON.stringify([{
  67  |           id: 1,
  68  |           status: 'IN_PLAY',
  69  |           home_score: score.home,
  70  |           away_score: score.away,
  71  |           home_team: { name: 'Liverpool FC' },
  72  |           away_team: { name: 'Arsenal FC' }
  73  |         }]),
  74  |       });
  75  |     });
  76  | 
  77  |     await page.goto('/');
  78  |     // Verify that the teams are displayed
  79  |     await expect(page.locator('text="ليفربول"').first()).toBeVisible();
  80  |     await expect(page.locator('text="أرسنال"').first()).toBeVisible();
  81  | 
  82  |     // Update score to 1-0
  83  |     score = { home: 1, away: 0 };
  84  |     await page.reload(); // Trigger data fetch
  85  |     await expect(page.locator('text="1 - 0"')).toBeVisible();
  86  | 
  87  |     // Update score to 1-1
  88  |     score = { home: 1, away: 1 };
  89  |     await page.reload(); // Trigger data fetch
  90  |     await expect(page.locator('text="1 - 1"')).toBeVisible();
  91  |   });
  92  | 
  93  |   test('RTL responsiveness and mobile navigation test', async ({ page }) => {
  94  |     await page.setViewportSize({ width: 360, height: 800 });
  95  |     await page.goto('/matches');
  96  |     
  97  |     // Check dir="rtl" on html element
  98  |     const dirAttr = await page.getAttribute('html', 'dir');
  99  |     expect(dirAttr).toBe('rtl');
  100 | 
  101 |     // Click on date slider to navigate
  102 |     await page.click('text=اليوم التالي');
  103 |     // Page is responsive and loads without error
  104 |     await expect(page.locator('h1')).toContainText('جدول المباريات');
  105 |   });
  106 | });
  107 | 
```