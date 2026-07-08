# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: banner.spec.ts >> Sticky Live Score Banner (Tier 1) >> User can close/minimize the banner
- Location: e2e\banner.spec.ts:29:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Call log:
  - navigating to "http://localhost:3000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   test.slow();
  5  |   page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  6  |   await page.addInitScript(() => {
  7  |     window.localStorage.clear();
  8  |     (window as any).PLAYWRIGHT_TEST = true;
  9  |   });
  10 | });
  11 | 
  12 | test.describe('Sticky Live Score Banner (Tier 1)', () => {
  13 |   test('Banner is visible on homepage', async ({ page }) => {
  14 |     await page.goto('/');
  15 |     // Expect to fail since unimplemented
  16 |     await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('Banner is visible on matches page', async ({ page }) => {
  20 |     await page.goto('/matches');
  21 |     await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  22 |   });
  23 | 
  24 |   test('Banner is visible on match details page', async ({ page }) => {
  25 |     await page.goto('/match/1');
  26 |     await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  27 |   });
  28 | 
  29 |   test('User can close/minimize the banner', async ({ page }) => {
> 30 |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
  31 |     await page.click('[data-testid="close-banner"]');
  32 |     await expect(page.locator('[data-testid="live-banner"]')).toBeHidden();
  33 |   });
  34 | 
  35 |   test('Sticky banner handles mobile layout', async ({ page }) => {
  36 |     // Set viewport to mobile size
  37 |     await page.setViewportSize({ width: 375, height: 667 });
  38 |     await page.goto('/');
  39 |     await expect(page.locator('[data-testid="live-banner"]')).toBeVisible();
  40 |   });
  41 | });
  42 | 
  43 | test.describe('Sticky Live Score Banner (Tier 2 - Boundaries & Error Cases)', () => {
  44 |   test('Banner behaviour when no live matches are active', async ({ page }) => {
  45 |     // Mock matches API to return no live matches
  46 |     await page.route('**/rest/v1/matches*', async (route) => {
  47 |       await route.fulfill({
  48 |         status: 200,
  49 |         contentType: 'application/json',
  50 |         body: JSON.stringify([{ id: 1, status: 'SCHEDULED', home_team: { name: 'A' }, away_team: { name: 'B' } }]),
  51 |       });
  52 |     });
  53 | 
  54 |     await page.goto('/');
  55 |     // Banner should be hidden if no matches are IN_PLAY
  56 |     await expect(page.locator('[data-testid="live-banner"]')).toBeHidden();
  57 |   });
  58 | 
  59 |   test('API failure handles gracefully without breaking banner', async ({ page }) => {
  60 |     await page.route('**/rest/v1/matches*', async (route) => {
  61 |       await route.fulfill({ status: 500 });
  62 |     });
  63 | 
  64 |     await page.goto('/');
  65 |     // Banner should handle the error safely (e.g. stay hidden or display "Offline")
  66 |     await expect(page.locator('[data-testid="live-banner"]')).toBeHidden();
  67 |   });
  68 | 
  69 |   test('Banner handles screen size smaller than 320px cleanly', async ({ page }) => {
  70 |     await page.setViewportSize({ width: 280, height: 500 });
  71 |     await page.goto('/');
  72 |     // Should still work or be sized properly
  73 |     await expect(page.locator('[data-testid="live-banner"]')).toBeDefined();
  74 |   });
  75 | 
  76 |   test('Banner does not overlap footer', async ({ page }) => {
  77 |     await page.goto('/');
  78 |     const footer = page.locator('footer');
  79 |     const banner = page.locator('[data-testid="live-banner"]');
  80 |     // Ensure footer is defined
  81 |     await expect(footer).toBeDefined();
  82 |   });
  83 | 
  84 |   test('Sticky widget handles live updates', async ({ page }) => {
  85 |     await page.goto('/');
  86 |     // Banner updates status
  87 |     await expect(page.locator('[data-testid="live-banner"]')).toBeDefined();
  88 |   });
  89 | });
  90 | 
```