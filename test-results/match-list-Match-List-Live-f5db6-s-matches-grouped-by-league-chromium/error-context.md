# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: match-list.spec.ts >> Match List & Live Score Ticker (Tier 1) >> Matches page displays matches grouped by league
- Location: e2e\match-list.spec.ts:70:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/matches
Call log:
  - navigating to "http://localhost:3000/matches", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Helper to mock Supabase responses
  4   | const mockMatches = [
  5   |   {
  6   |     id: '1',
  7   |     match_date: new Date().toISOString(),
  8   |     status: 'IN_PLAY',
  9   |     home_score: 2,
  10  |     away_score: 1,
  11  |     home_team: { name: 'Liverpool FC', logo_url: 'https://example.com/liverpool.png' },
  12  |     away_team: { name: 'Arsenal FC', logo_url: 'https://example.com/arsenal.png' },
  13  |     league: { name: 'UEFA Champions League' }
  14  |   },
  15  |   {
  16  |     id: '2',
  17  |     match_date: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
  18  |     status: 'SCHEDULED',
  19  |     home_score: 0,
  20  |     away_score: 0,
  21  |     home_team: { name: 'Real Madrid CF', logo_url: 'https://example.com/madrid.png' },
  22  |     away_team: { name: 'FC Barcelona', logo_url: 'https://example.com/barca.png' },
  23  |     league: { name: 'Primera Division' }
  24  |   }
  25  | ];
  26  | 
  27  | test.describe('Match List & Live Score Ticker (Tier 1)', () => {
  28  |   test.beforeEach(async ({ page }) => {
  29  |     test.slow();
  30  |     // Set window-level flag for frontend mock client
  31  |     await page.addInitScript(() => {
  32  |       (window as any).PLAYWRIGHT_TEST = true;
  33  |     });
  34  | 
  35  |     // Route Supabase requests
  36  |     await page.route('**/rest/v1/matches*', async (route) => {
  37  |       const url = route.request().url();
  38  |       if (url.includes('id=eq.1')) {
  39  |         await route.fulfill({
  40  |           status: 200,
  41  |           contentType: 'application/json',
  42  |           body: JSON.stringify([mockMatches[0]]),
  43  |         });
  44  |       } else if (url.includes('id=eq.2')) {
  45  |         await route.fulfill({
  46  |           status: 200,
  47  |           contentType: 'application/json',
  48  |           body: JSON.stringify([mockMatches[1]]),
  49  |         });
  50  |       } else {
  51  |         await route.fulfill({
  52  |           status: 200,
  53  |           contentType: 'application/json',
  54  |           headers: { 'content-range': '0-1/2' },
  55  |           body: JSON.stringify(mockMatches),
  56  |         });
  57  |       }
  58  |     });
  59  |   });
  60  | 
  61  |   test('Homepage displays list of matches', async ({ page }) => {
  62  |     await page.goto('/');
  63  |     // Check main title
  64  |     await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
  65  |     // Check match card elements
  66  |     await expect(page.locator('text="ليفربول"')).toBeVisible();
  67  |     await expect(page.locator('text="أرسنال"')).toBeVisible();
  68  |   });
  69  | 
  70  |   test('Matches page displays matches grouped by league', async ({ page }) => {
> 71  |     await page.goto('/matches');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/matches
  72  |     // Check breadcrumbs and headers
  73  |     await expect(page.locator('h1')).toContainText('جدول المباريات');
  74  |     await expect(page.locator('text="دوري أبطال أوروبا"').first()).toBeVisible();
  75  |   });
  76  | 
  77  |   test('Match details page displays teams, score, and status info', async ({ page }) => {
  78  |     await page.goto('/match/1');
  79  |     // Check teams names
  80  |     await expect(page.locator('text="ليفربول"')).toBeVisible();
  81  |     await expect(page.locator('text="أرسنال"')).toBeVisible();
  82  |     // Check score
  83  |     await expect(page.locator('text=2').first()).toBeVisible();
  84  |     await expect(page.locator('text=1').first()).toBeVisible();
  85  |     // Check Live status text
  86  |     await expect(page.locator('text=مباشر الآن')).toBeVisible();
  87  |   });
  88  | 
  89  |   test('Clicking on a match card redirects to details page', async ({ page }) => {
  90  |     await page.goto('/');
  91  |     // Click on Liverpool vs Arsenal card
  92  |     await page.click('text="ليفربول"');
  93  |     await page.waitForURL('**/match/1');
  94  |     await expect(page.locator('text="دوري أبطال أوروبا"').first()).toBeVisible();
  95  |   });
  96  | 
  97  |   test('Live score ticker displays matches', async ({ page }) => {
  98  |     await page.goto('/');
  99  |     // Expect ticker elements to exist
  100 |     await expect(page.locator('.animate-pulse').first()).toBeVisible();
  101 |     await expect(page.locator('text="ليفربول"')).toBeVisible();
  102 |   });
  103 | });
  104 | 
  105 | test.describe('Match List & Live Score Ticker (Tier 2 - Boundaries & Error Cases)', () => {
  106 |   test.beforeEach(async ({ page }) => {
  107 |     test.slow();
  108 |     await page.addInitScript(() => {
  109 |       (window as any).PLAYWRIGHT_TEST = true;
  110 |     });
  111 |   });
  112 | 
  113 |   test('Empty state when no matches exist on selected date in matches page', async ({ page }) => {
  114 |     await page.route('**/rest/v1/matches*', async (route) => {
  115 |       await route.fulfill({
  116 |         status: 200,
  117 |         contentType: 'application/json',
  118 |         headers: { 'content-range': '0-0/0' },
  119 |         body: JSON.stringify([]),
  120 |       });
  121 |     });
  122 | 
  123 |     await page.goto('/matches?date=2026-12-31');
  124 |     await expect(page.locator('text=لا توجد مباريات متاحة في هذا اليوم')).toBeVisible();
  125 |   });
  126 | 
  127 |   test('API failure handling keeps page stable', async ({ page }) => {
  128 |     await page.route('**/rest/v1/matches*', async (route) => {
  129 |       await route.fulfill({
  130 |         status: 500,
  131 |         contentType: 'application/json',
  132 |         body: JSON.stringify({ error: 'Internal Server Error' }),
  133 |       });
  134 |     });
  135 | 
  136 |     await page.goto('/');
  137 |     // Page should still load header/footer and not crash
  138 |     await expect(page.locator('h1')).toContainText('تابع مباريات اليوم');
  139 |   });
  140 | 
  141 |   test('Navigation to non-existent match details page triggers 404', async ({ page }) => {
  142 |     await page.route('**/rest/v1/matches*', async (route) => {
  143 |       await route.fulfill({
  144 |         status: 200,
  145 |         contentType: 'application/json',
  146 |         body: JSON.stringify([]),
  147 |       });
  148 |     });
  149 | 
  150 |     await page.goto('/match/999999');
  151 |     // Check that standard Next.js 404 page is displayed
  152 |     await expect(page.locator('text=404')).toBeVisible();
  153 |   });
  154 | 
  155 |   test('Invalid date in query parameter falls back gracefully', async ({ page }) => {
  156 |     await page.route('**/rest/v1/matches*', async (route) => {
  157 |       await route.fulfill({
  158 |         status: 200,
  159 |         contentType: 'application/json',
  160 |         headers: { 'content-range': '0-1/2' },
  161 |         body: JSON.stringify(mockMatches),
  162 |       });
  163 |     });
  164 | 
  165 |     await page.goto('/matches?date=not-a-date');
  166 |     // Page should fall back and load the match list or empty message without throwing error
  167 |     await expect(page.locator('h1')).toContainText('جدول المباريات');
  168 |   });
  169 | 
  170 |   test('Out of bounds page parameter shows empty state correctly', async ({ page }) => {
  171 |     await page.route('**/rest/v1/matches*', async (route) => {
```