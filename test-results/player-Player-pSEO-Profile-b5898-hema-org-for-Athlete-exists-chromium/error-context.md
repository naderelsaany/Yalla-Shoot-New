# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: player.spec.ts >> Player pSEO Profile (Tier 1) >> Structured Data (Schema.org) for Athlete exists
- Location: e2e\player.spec.ts:28:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/players/messi
Call log:
  - navigating to "http://localhost:3000/players/messi", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Player pSEO Profile (Tier 1)', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     test.slow();
  6   |     await page.addInitScript(() => {
  7   |       (window as any).PLAYWRIGHT_TEST = true;
  8   |     });
  9   |   });
  10  | 
  11  |   test('Navigate to player page displays details header', async ({ page }) => {
  12  |     await page.goto('/players/messi');
  13  |     // Expect to fail since unimplemented
  14  |     await expect(page.locator('h1')).toContainText('ميسي');
  15  |   });
  16  | 
  17  |   test('Player statistics table is visible', async ({ page }) => {
  18  |     await page.goto('/players/messi');
  19  |     await expect(page.locator('text=الإحصائيات')).toBeVisible();
  20  |   });
  21  | 
  22  |   test('Club and national team info are displayed', async ({ page }) => {
  23  |     await page.goto('/players/messi');
  24  |     await expect(page.locator('text=النادي')).toBeVisible();
  25  |     await expect(page.locator('text=المنتخب')).toBeVisible();
  26  |   });
  27  | 
  28  |   test('Structured Data (Schema.org) for Athlete exists', async ({ page }) => {
> 29  |     await page.goto('/players/messi');
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/players/messi
  30  |     const schemaScript = page.locator('script[type="application/ld+json"]');
  31  |     await expect(schemaScript).toBeDefined();
  32  |   });
  33  | 
  34  |   test('Page has correct metadata tags', async ({ page }) => {
  35  |     await page.goto('/players/messi');
  36  |     const description = page.locator('meta[name="description"]');
  37  |     await expect(description).toHaveAttribute('content', /تفاصيل وإحصائيات/);
  38  |   });
  39  | });
  40  | 
  41  | test.describe('Player pSEO Profile (Tier 2 - Boundaries & Error Cases)', () => {
  42  |   test.beforeEach(async ({ page }) => {
  43  |     test.slow();
  44  |     await page.addInitScript(() => {
  45  |       (window as any).PLAYWRIGHT_TEST = true;
  46  |     });
  47  |   });
  48  | 
  49  |   test('Accessing non-existent player ID returns 404', async ({ page }) => {
  50  |     await page.goto('/players/999999');
  51  |     await expect(page.locator('text=404')).toBeVisible();
  52  |   });
  53  | 
  54  |   test('Player with no current season stats displays zeros gracefully', async ({ page }) => {
  55  |     await page.route('**/rest/v1/players*', async (route) => {
  56  |       await route.fulfill({
  57  |         status: 200,
  58  |         contentType: 'application/json',
  59  |         body: JSON.stringify([{ id: 'no-stats', name: 'No Stats Player', goals: null, assists: null }]),
  60  |       });
  61  |     });
  62  | 
  63  |     await page.goto('/players/no-stats');
  64  |     await expect(page.locator('text=0').first()).toBeVisible();
  65  |   });
  66  | 
  67  |   test('Free agent player displays free agent status', async ({ page }) => {
  68  |     await page.route('**/rest/v1/players*', async (route) => {
  69  |       await route.fulfill({
  70  |         status: 200,
  71  |         contentType: 'application/json',
  72  |         body: JSON.stringify([{ id: 'free-agent', name: 'Free Agent', club: null }]),
  73  |       });
  74  |     });
  75  | 
  76  |     await page.goto('/players/free-agent');
  77  |     await expect(page.locator('text=لاعب حر')).toBeVisible();
  78  |   });
  79  | 
  80  |   test('Player with very long name or missing photos handles cleanly', async ({ page }) => {
  81  |     await page.route('**/rest/v1/players*', async (route) => {
  82  |       await route.fulfill({
  83  |         status: 200,
  84  |         contentType: 'application/json',
  85  |         body: JSON.stringify([{ id: 'long-name', name: 'A'.repeat(100), photo_url: null }]),
  86  |       });
  87  |     });
  88  | 
  89  |     await page.goto('/players/long-name');
  90  |     await expect(page.locator('h1')).toBeVisible();
  91  |   });
  92  | 
  93  |   test('Supabase API crash handled gracefully on player page', async ({ page }) => {
  94  |     await page.route('**/rest/v1/players*', async (route) => {
  95  |       await route.fulfill({ status: 500 });
  96  |     });
  97  | 
  98  |     await page.goto('/players/messi');
  99  |     await expect(page.locator('text=404')).toBeVisible();
  100 |   });
  101 | });
  102 | 
```