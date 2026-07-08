# E2E Test Infra: Yalla Shoot New

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Match List & Ticker | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 2 | World Cup Hub | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 3 | Player pSEO Profile | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 4 | Team pSEO Profile | ORIGINAL_REQUEST | 5 | 5 | ✓ |
| 5 | Sticky Live Score Banner | ORIGINAL_REQUEST | 5 | 5 | ✓ |

## Test Architecture
- Test runner: Playwright (configured in `playwright.config.ts` running against `npm run dev` or production build)
- Test case format: Playwright TypeScript spec files located under `/e2e/`
- Directory layout:
  - `/e2e/match-list.spec.ts`
  - `/e2e/world-cup.spec.ts`
  - `/e2e/player.spec.ts`
  - `/e2e/team.spec.ts`
  - `/e2e/banner.spec.ts`
  - `/e2e/cross-feature.spec.ts`
  - `/e2e/real-world.spec.ts`
- Mocking: Intercepts Supabase REST API requests `**/rest/v1/**` and mocks the database queries dynamically.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Standard User Homepage & Match List Browsing | Match List, Live Score Ticker | Low |
| 2 | Admin Adds Match and User Views Live Feed | Admin Auth, Match Addition, Match List | Medium |
| 3 | User Navigates from World Cup Hub to League Details | World Cup Hub, Match Details, League Standings | Medium |
| 4 | User Views Player Profile through Team Roster | Team pSEO, Player pSEO, Squad Roster | Medium |
| 5 | User Dismisses Sticky Score Banner Across Pages | Sticky Live Score Banner, Page Navigation | Medium |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios
