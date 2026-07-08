# Project: Yalla Shoot New
# Scope: Project Orchestration

## Architecture
- Next.js 16 (App Router) + TailwindCSS v4 + Supabase PostgreSQL
- Components layout:
  - `src/app`: Page routes
  - `src/components`: UI components (Header, Footer, LiveMatchesList, LiveScoreTicker, MatchCard, TeamLogo, etc.)
  - `src/lib`: Helper libraries (supabase client, translations)
- Data sourcing:
  - Supabase database holds matches, standings, leagues, teams, match_events, and news.

## Parallel Tracks & Sub-orchestrators
| Track | Name | Sub-orchestrator Work Directory | Conv ID | Status |
|-------|------|---------------------------------|---------|--------|
| T1 | E2E Testing Track | `.agents/sub_orch_e2e` | `e7ba7d22-4469-4f9c-bfdd-9cc4229b009c` | DONE |
| T2 | Implementation Track | `.agents/sub_orch_impl` | `95d79147-6f48-424f-819a-6b877b8bd9b8` | IN_PROGRESS |

## Milestones Details (Implementation)
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Codebase Audit & Build Stabilization (M1) | Scan and fix compilation, TS, Next.js build errors. Ensure `npm run build succeeds. | none | DONE |
| 2 | World Cup Hub & Widget (M2) | World Cup standings, matches, top scorers pages and sticky live score banner/widget. | M1 | IN_PROGRESS |
| 3 | Advanced SEO & Programmatic SEO (M3) | Structured Schema.org, dynamic OG, metadata, player & team pSEO routes. | M1 | IN_PROGRESS |
| 4 | Final E2E Validation & Hardening (M4) | Integration, E2E test runs, adversarial testing (Tier 5), and Forensic Audit. | M2, M3, T1 | PLANNED |


## Interface Contracts
### Supabase Client ↔ Next.js Pages
- Supabase credentials retrieved from environment variables.
- Dynamic data fetched during ISR/SSR. Realtime subscription or Polling fallback.

## Code Layout
- `src/app/`: Next.js pages and API routes
- `src/components/`: Shared UI components
- `src/lib/`: Database and utility functions
- `public/`: Static images, icons, and assets
