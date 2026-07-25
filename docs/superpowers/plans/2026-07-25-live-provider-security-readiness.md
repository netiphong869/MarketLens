# Live Provider Stabilization and Security Readiness Implementation Plan

> Execute with systematic debugging, strict TDD, and verification before completion.

**Goal:** Stabilize MarketLens live providers and make scoring/coverage truthful on Vercel Preview without exposing secrets or deploying Production.

**Architecture:** Provider-specific boundary adapters validate external responses before normalization. SEC gets a dedicated bounded JSON reader because Company Facts is intentionally larger than the shared HTTP client cap. Analysis exposes module coverage and horizon availability separately from deterministic scores.

**Tech Stack:** Next.js App Router, TypeScript strict, Zod, Vitest, Playwright, Vercel CLI.

---

## Task 1: Capture provider and dependency baseline

- Record clean Git state, Preview env SET/UNSET, current deployment, audit JSON and dry-run.
- Verify Stooq real response schema and official provider authentication/model contracts.
- Do not modify source code.

## Task 2: Gemini discovery with regression tests

- Add failing tests for model discovery, stable Flash selection, model 404 fallback and invented-number fallback.
- Implement discovery against Models API and select only a returned model supporting `generateContent`.
- Preserve template fallback for every failure mode.

## Task 3: Secure SEC Company Facts reader

- Add failing tests for a valid response larger than 1 MB, response larger than the SEC-specific cap, wrong host, wrong content type and redirects.
- Implement exact host/protocol allowlist, redirect denial, timeout, streamed decompressed-size cap and JSON validation.
- Project only required US-GAAP concepts before normalization.

## Task 4: Provider truthfulness

- Add Finnhub test proving credentials are sent in `X-Finnhub-Token`, not in the URL.
- Add Stooq tests for a real CSV and an HTML challenge.
- Mark unusable Stooq response unavailable and keep it out of provider-ready status.

## Task 5: Coverage, Quality and horizon semantics

- Add failing engine tests for missing fundamentals/news/market and partial coverage.
- Add explicit module coverage to analysis responses.
- Do not emit neutral numeric scores for unavailable market/news.
- Compute fundamental coverage from available weighted fields.
- Emit `available`, `partial` or `insufficient` horizon results, with no score when inputs are insufficient.
- Update UI, fixtures and calculation documentation.

## Task 6: Dependency security update

- Upgrade Next.js and `eslint-config-next` to 16.2.11 only.
- Reinstall lockfile and rerun audit.
- Classify all remaining findings by advisory, dependency path, prod/dev and realistic exploitability.

## Task 7: Full verification and release

- Run lint, typecheck, unit/integration tests, E2E desktop/mobile, build, secret scan and npm audit.
- Update audit/readiness documents.
- Commit and push main only when required verification passes.
- Deploy Vercel Preview only.
- Validate health, AAPL/MSFT/LITE, Gemini/fallback, fundamentals, coverage, browser console and runtime logs.
- Confirm no Production deployment and no GitHub Auto Deployment.
