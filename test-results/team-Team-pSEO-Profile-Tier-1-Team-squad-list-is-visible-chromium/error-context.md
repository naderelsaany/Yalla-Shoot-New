# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: team.spec.ts >> Team pSEO Profile (Tier 1) >> Team squad list is visible
- Location: e2e\team.spec.ts:17:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/teams/ahly
Call log:
  - navigating to "http://localhost:3000/teams/ahly", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Team pSEO Profile (Tier 1)', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     test.slow();
  6   |     await page.addInitScript(() => {
  7   |       (window as any).PLAYWRIGHT_TEST = true;
  8   |     });
  9   |   });
  10  | 
  11  |   test('Navigate to team page displays team name and info', async ({ page }) => {
  12  |     await page.goto('/teams/ahly');
  13  |     // Expect to fail since unimplemented
  14  |     await expect(page.locator('h1')).toContainText('الأهلي');
  15  |   });
  16  | 
  17  |   test('Team squad list is visible', async ({ page }) => {
> 18  |     await page.goto('/teams/ahly');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/teams/ahly
  19  |     await expect(page.locator('text=قائمة اللاعبين')).toBeVisible();
  20  |   });
  21  | 
  22  |   test('Team standings position is visible', async ({ page }) => {
  23  |     await page.goto('/teams/ahly');
  24  |     await expect(page.locator('text=الترتيب')).toBeVisible();
  25  |   });
  26  | 
  27  |   test('Team logo is displayed', async ({ page }) => {
  28  |     await page.goto('/teams/ahly');
  29  |     await expect(page.locator('img[alt*="شعار"]')).toBeVisible();
  30  |   });
  31  | 
  32  |   test('Structured Data for SportsTeam exists', async ({ page }) => {
  33  |     await page.goto('/teams/ahly');
  34  |     const schemaScript = page.locator('script[type="application/ld+json"]');
  35  |     await expect(schemaScript).toBeDefined();
  36  |   });
  37  | });
  38  | 
  39  | test.describe('Team pSEO Profile (Tier 2 - Boundaries & Error Cases)', () => {
  40  |   test.beforeEach(async ({ page }) => {
  41  |     test.slow();
  42  |     await page.addInitScript(() => {
  43  |       (window as any).PLAYWRIGHT_TEST = true;
  44  |     });
  45  |   });
  46  | 
  47  |   test('Accessing non-existent team ID returns 404', async ({ page }) => {
  48  |     await page.goto('/teams/999999');
  49  |     await expect(page.locator('text=404')).toBeVisible();
  50  |   });
  51  | 
  52  |   test('Team with no players registered displays empty squad message', async ({ page }) => {
  53  |     await page.route('**/rest/v1/teams*', async (route) => {
  54  |       await route.fulfill({
  55  |         status: 200,
  56  |         contentType: 'application/json',
  57  |         body: JSON.stringify([{ id: 'no-players', name: 'No Players Club', logo_url: 'https://example.com/logo.png' }]),
  58  |       });
  59  |     });
  60  | 
  61  |     await page.goto('/teams/no-players');
  62  |     await expect(page.locator('text=لا يوجد لاعبين مسجلين حالياً')).toBeVisible();
  63  |   });
  64  | 
  65  |   test('Team not participating in any active league handles gracefully', async ({ page }) => {
  66  |     await page.route('**/rest/v1/teams*', async (route) => {
  67  |       await route.fulfill({
  68  |         status: 200,
  69  |         contentType: 'application/json',
  70  |         body: JSON.stringify([{ id: 'no-league', name: 'Friendly Club', league_id: null }]),
  71  |       });
  72  |     });
  73  | 
  74  |     await page.goto('/teams/no-league');
  75  |     await expect(page.locator('text=لا يشارك في بطولة رسمية')).toBeVisible();
  76  |   });
  77  | 
  78  |   test('Team without logo displays fallback team name or default logo', async ({ page }) => {
  79  |     await page.route('**/rest/v1/teams*', async (route) => {
  80  |       await route.fulfill({
  81  |         status: 200,
  82  |         contentType: 'application/json',
  83  |         body: JSON.stringify([{ id: 'no-logo', name: 'No Logo Club', logo_url: null }]),
  84  |       });
  85  |     });
  86  | 
  87  |     await page.goto('/teams/no-logo');
  88  |     await expect(page.locator('h1')).toBeVisible();
  89  |   });
  90  | 
  91  |   test('Supabase API crash handled gracefully on team page', async ({ page }) => {
  92  |     await page.route('**/rest/v1/teams*', async (route) => {
  93  |       await route.fulfill({ status: 500 });
  94  |     });
  95  | 
  96  |     await page.goto('/teams/ahly');
  97  |     await expect(page.locator('text=404')).toBeVisible();
  98  |   });
  99  | });
  100 | 
```