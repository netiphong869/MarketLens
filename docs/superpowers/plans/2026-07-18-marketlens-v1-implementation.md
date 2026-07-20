# MarketLens V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally verified, mobile-first MarketLens PWA that analyzes ordinary US-listed companies in clearly labeled mock mode, supports secure server-only provider adapters for later real API keys, and produces transparent deterministic scores with a safe Thai summary fallback.

**Architecture:** Use a modular Next.js App Router application. Client components communicate only with MarketLens route handlers; route handlers orchestrate provider adapters, normalization, quality validation, deterministic scoring, and Gemini/template summarization. Domain contracts and pure engine functions stay independent of React and network code so they can be tested exhaustively.

**Tech Stack:** Next.js 16.2.10, React 19.2.x, TypeScript strict mode, CSS Modules/global design tokens, Zod, Lightweight Charts, Lucide React, Vitest, React Testing Library, Playwright, ESLint, Prettier, local Git.

## Global Constraints

- Work only inside `D:\Projects\MarketLens`.
- Do not add a Git remote, push to GitHub, run Vercel commands, or deploy.
- Do not use or commit real API keys; mock mode is the default.
- All provider credentials are server-only and may not use `NEXT_PUBLIC_` names.
- Gemini may only rewrite structured facts; deterministic code owns every number and score.
- Missing values remain unavailable and are never replaced with zero.
- V1 full fundamental scoring supports ordinary US operating companies only.
- Ten successful new analyses are permitted per Asia/Bangkok calendar day; repeated symbols within five minutes use cache.
- The light visual theme is mandatory; V1 has no dark mode.
- Every completed phase runs its specified checks and updates `PROGRESS.md`.
- Local phase commits are attempted only when Git identity already exists; global/local credentials are not changed automatically.

---

## File map

### Project and documentation

- `package.json`: scripts and pinned dependencies.
- `next.config.ts`: security headers and build configuration.
- `tsconfig.json`: strict TypeScript and import aliases.
- `.env.example`: environment variable names without values.
- `AGENTS.md`: repository-level agent rules.
- `MASTER_SPEC.md`, `UI_GUIDELINES.md`, `CALCULATION_ENGINE.md`, `DESIGN_SYSTEM.md`, `PROJECT_RULES.md`, `ARCHITECTURE.md`: durable product and engineering contracts.
- `PROGRESS.md`: phase log and verification evidence.
- `MANUAL_TEST_CHECKLIST.md`: manual mobile, desktop, PWA, security, and accessibility checks.

### Domain and engine

- `src/types/market.ts`: normalized quote, candle, profile, financial, event, and market-context types.
- `src/types/analysis.ts`: score, reason, scenario, quality, risk, summary, and final-response types.
- `src/engine/common/numbers.ts`: finite-number guards, clamping, weighted averages, and safe division.
- `src/engine/technical/indicators.ts`: EMA, RSI, MACD, ATR, Bollinger, OBV, and ADX.
- `src/engine/technical/support-resistance.ts`: swing zones and ATR-scaled consolidation.
- `src/engine/technical/score.ts`: per-timeframe technical scoring and 40/30/20/10 aggregation.
- `src/engine/fundamental/score.ts`: growth, profitability, leverage, ROIC/WACC, valuation, and direction scoring.
- `src/engine/market/score.ts`: benchmark and sector relative-strength scoring.
- `src/engine/news/score.ts`: authority, recency, relevance, duplicate, and severity scoring.
- `src/engine/risk/score.ts`: risk factors and capped penalty.
- `src/engine/quality/score.ts`: quality score and hard-stop gate.
- `src/engine/scoring/horizons.ts`: short/medium/long final scores.
- `src/engine/analyze.ts`: pure orchestration producing an auditable analysis result.

### Server/provider layer

- `src/lib/env/server.ts`: Zod-validated server environment.
- `src/lib/errors/app-error.ts`: stable codes and safe error payloads.
- `src/lib/api/http.ts`: timeout, response limits, bounded retries, and redaction.
- `src/lib/cache/ttl-cache.ts`: five-minute cache abstraction.
- `src/lib/usage/daily-limit.ts`: Bangkok-day usage counter abstraction and documented in-memory/cookie limitations.
- `src/providers/contracts.ts`: provider interfaces.
- `src/providers/mock/provider.ts`: deterministic labeled mock data.
- `src/providers/twelve-data/provider.ts`, `src/providers/sec-edgar/provider.ts`, `src/providers/finnhub/provider.ts`, `src/providers/stooq/provider.ts`: provider adapters.
- `src/providers/gemini/provider.ts`: structured Gemini request and schema validation.
- `src/providers/gemini/template.ts`: deterministic Thai fallback.
- `src/services/analysis-service.ts`: provider orchestration, quality gate, scoring, summary, cache, and usage commit.
- `src/app/api/health/route.ts`, `src/app/api/search/route.ts`, `src/app/api/analyze/route.ts`: sanitized server routes.

### UI and PWA

- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`: shell, metadata, route entry, and design tokens.
- `src/components/ui/*`: cards, badges, buttons, score ring, loading, errors, empty states.
- `src/components/layout/*`: header, page shell, and bottom navigation.
- `src/components/market/*`: market pulse and API status.
- `src/components/stock/*`: search, profile, score overview, fundamentals, and risk.
- `src/components/chart/stock-chart.tsx`: dynamically loaded Lightweight Charts surface.
- `src/components/analysis/*`: summary and scenario cards.
- `src/features/analysis/analysis-dashboard.tsx`: client state machine and five-tab experience.
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/*`: installable PWA assets and offline shell.

### Tests and release reports

- `src/**/*.test.ts`, `src/**/*.test.tsx`: focused unit/component tests colocated with code.
- `tests/integration/*.test.ts`: routes, providers, cache, limits, and summary safety.
- `tests/e2e/marketlens.spec.ts`: critical mobile/desktop flow.
- `scripts/secret-scan.mjs`: repository and tracked-file secret checks.
- `FINAL_AUDIT.md`, `TEST_REPORT.md`, `SECURITY_REPORT.md`, `DEPLOYMENT_READINESS.md`: truthful final evidence.

---

### Task 1: Foundation, contracts, and executable test harness

**Phase:** 1

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `.prettierrc.json`, `.gitignore`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/lib/env/server.ts`, `src/lib/errors/app-error.ts`
- Create: `src/types/market.ts`, `src/types/analysis.ts`
- Create: `src/test/setup.ts`, `vitest.config.ts`, `playwright.config.ts`
- Create/update: all required specification documents and `PROGRESS.md`
- Test: `src/lib/env/server.test.ts`, `src/lib/errors/app-error.test.ts`

**Interfaces:**
- Produces `getServerEnv(): ServerEnv` with optional provider keys and required defaults.
- Produces `AppError`, `toSafeErrorResponse(error)`, and `AppErrorCode`.
- Produces normalized domain types consumed by all later tasks.

- [ ] **Step 1: Scaffold the application and install exact dependencies**

Run:

```powershell
npx create-next-app@16.2.10 . --typescript --eslint --app --src-dir --import-alias "@/*" --use-npm --no-tailwind --yes
npm install zod lightweight-charts lucide-react
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test prettier eslint-config-prettier
```

Expected: `package-lock.json` is created and `npm install` exits 0.

- [ ] **Step 2: Write failing environment and safe-error tests**

```ts
it("defaults to mock mode without real keys", () => {
  const env = parseServerEnv({});
  expect(env.MOCK_DATA_MODE).toBe(true);
});

it("does not expose internal causes", () => {
  const error = new AppError("INTERNAL_ERROR", "safe", 500, new Error("secret path"));
  expect(JSON.stringify(toSafeErrorResponse(error))).not.toContain("secret path");
});
```

- [ ] **Step 3: Run focused tests and verify red state**

Run: `npm test -- src/lib/env/server.test.ts src/lib/errors/app-error.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 4: Implement the minimum strict contracts and safe environment parser**

Implement boolean coercion for `MOCK_DATA_MODE`, numeric defaults for usage/cache settings, server-only module guards, the stable error-code union from the design spec, and a response serializer that returns only `{ error: { code, message, retryable } }`.

- [ ] **Step 5: Run Phase 1 verification**

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 6: Update progress and create the local phase commit when identity exists**

```powershell
git add .
git commit -m "phase-1: foundation and project documentation"
```

If Git identity is missing, record the exact error in `PROGRESS.md` and leave the changes uncommitted without configuring credentials.

---

### Task 2: MarketLens design system and accessible component primitives

**Phase:** 2

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/ui/card.tsx`, `badge.tsx`, `button.tsx`, `score-ring.tsx`, `score-bar.tsx`, `risk-meter.tsx`, `skeleton.tsx`, `empty-state.tsx`, `error-state.tsx`
- Create: `src/components/layout/app-shell.tsx`, `header.tsx`, `bottom-navigation.tsx`
- Create: `src/components/brand/marketlens-logo.tsx`
- Create: `src/app/design-system/page.tsx`
- Test: `src/components/ui/score-ring.test.tsx`, `src/components/layout/bottom-navigation.test.tsx`

**Interfaces:**
- Produces `ScoreRing({ score, label, level, size })` with text and accessible value semantics.
- Produces `BottomNavigation({ activeTab, onChange })` for the five approved sections.
- Produces shared light-theme tokens consumed by all application UI.

- [ ] **Step 1: Write failing accessibility tests**

```tsx
render(<ScoreRing score={72} label="เทคนิค" level="แข็งแรง" />);
expect(screen.getByRole("meter", { name: "เทคนิค" })).toHaveAttribute("aria-valuenow", "72");
expect(screen.getByText("แข็งแรง")).toBeVisible();
```

- [ ] **Step 2: Run the component tests and verify red state**

Run: `npm test -- src/components/ui/score-ring.test.tsx src/components/layout/bottom-navigation.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement tokens and components**

Use CSS custom properties for the approved white/navy/green/gold/orange/red/gray palette, 18–20px card radius, restrained shadows, 44px touch targets, visible focus, and `prefers-reduced-motion`. Implement the logo as an original SVG lens enclosing simple candlesticks.

- [ ] **Step 4: Build the design-system showcase**

Render every state: positive, neutral, warning, risk, unavailable, loading, empty, error, mock, and API status. Ensure no black background, glassmorphism, neon, robot, or crypto imagery is present.

- [ ] **Step 5: Verify and record Phase 2**

Run: `npm run lint && npm run typecheck && npm test && npm run build`

Expected: all checks pass; update `PROGRESS.md`; attempt commit `phase-2: implement MarketLens design system` only if identity exists.

---

### Task 3: Complete mock-driven application UI

**Phase:** 3

**Files:**
- Create: `src/providers/mock/fixtures.ts`
- Create: `src/features/analysis/analysis-dashboard.tsx`, `analysis-state.ts`
- Create: `src/components/market/market-pulse.tsx`, `api-status.tsx`
- Create: `src/components/stock/stock-search.tsx`, `company-profile-card.tsx`, `overview-panel.tsx`, `fundamentals-panel.tsx`, `risk-panel.tsx`
- Create: `src/components/chart/stock-chart.tsx`, `indicator-panel.tsx`
- Create: `src/components/analysis/summary-panel.tsx`, `scenario-card.tsx`, `disclaimer.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/features/analysis/analysis-dashboard.test.tsx`
- E2E: `tests/e2e/marketlens.spec.ts`

**Interfaces:**
- Consumes normalized `AnalysisResponse` fixtures.
- Produces a home/search state and result state with five bottom-nav panels.
- `StockSearch` calls `onAnalyze(symbol: string)` only after ticker normalization.

- [ ] **Step 1: Write failing dashboard tests**

Test the initial search, visible `ข้อมูลจำลอง` badge, successful mock result, five accessible tabs, and score/risk labels.

- [ ] **Step 2: Verify the tests fail for missing UI**

Run: `npm test -- src/features/analysis/analysis-dashboard.test.tsx`

Expected: FAIL because the dashboard does not exist.

- [ ] **Step 3: Implement the mobile-first dashboard state machine**

States are `idle | validating | loading | success | partial | error`. The progress list reflects actual completed async steps, never a timed fake percentage. The search button remains disabled while loading.

- [ ] **Step 4: Implement the five result panels**

Use varied editorial card layouts, visible timestamps and sources, explicit unavailable states, and no investment-command language. Dynamically import the chart to keep the initial client bundle small.

- [ ] **Step 5: Add critical E2E smoke flow in mock mode**

```ts
test("analyzes a ticker and navigates all result sections", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("ชื่อย่อหุ้น").fill("FN");
  await page.getByRole("button", { name: "วิเคราะห์" }).click();
  await expect(page.getByText("ข้อมูลจำลอง")).toBeVisible();
  for (const tab of ["ภาพรวม", "กราฟ", "พื้นฐาน", "ความเสี่ยง", "สรุป"]) {
    await page.getByRole("tab", { name: tab }).click();
  }
});
```

- [ ] **Step 6: Verify and record Phase 3**

Run: `npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build`

Expected: all checks pass at mobile and desktop project viewports; update progress; attempt the specified local commit.

---

### Task 4: Secure providers, routes, cache, and usage control

**Phase:** 4

**Files:**
- Create: `src/providers/contracts.ts`
- Create: `src/lib/api/http.ts`, `src/lib/cache/ttl-cache.ts`, `src/lib/usage/daily-limit.ts`, `src/lib/validation/symbol.ts`
- Create: provider adapter files listed in the file map
- Create: `src/services/analysis-service.ts`
- Create: `src/app/api/health/route.ts`, `src/app/api/search/route.ts`, `src/app/api/analyze/route.ts`
- Test: `src/lib/api/http.test.ts`, `src/lib/cache/ttl-cache.test.ts`, `src/lib/usage/daily-limit.test.ts`
- Integration: `tests/integration/analyze-route.test.ts`, `tests/integration/provider-errors.test.ts`

**Interfaces:**
- `MarketDataProvider.getQuote(symbol)`, `getCandles(symbol, timeframe)`, `getMarketContext(symbol)`.
- `FundamentalsProvider.getCompanyData(symbol)`.
- `NewsProvider.getEvents(symbol, range)`.
- `SummaryProvider.summarize(input)`.
- `analyzeSymbol(symbol, context): Promise<AnalysisResponse>`.

- [ ] **Step 1: Write failing cache, limit, and route tests**

Cover five-minute cache hits, Bangkok-date rollover, successful-analysis-only usage increments, symbol allowlist, 429 no-retry, network retry cap, safe route errors, and no secret fields in responses.

- [ ] **Step 2: Run focused tests to verify red state**

Run: `npm test -- src/lib tests/integration`

Expected: FAIL because provider and orchestration modules are missing.

- [ ] **Step 3: Implement shared HTTP safety**

Use `AbortSignal.timeout`, a two-attempt maximum only for eligible network/5xx failures, response-size checks from `content-length` plus body length, sanitized provider error mapping, and header redaction.

- [ ] **Step 4: Implement providers and normalized contracts**

Real adapters activate only when their server key is present and mock mode is false. SEC sends `SEC_USER_AGENT`. Stooq responses are labeled backup/delayed. Mock provider is deterministic for repeatable tests.

- [ ] **Step 5: Implement routes and service orchestration**

Validate request bodies with Zod, check cache and usage before provider calls, increment usage only after a successful response, attach timestamps/source mode, and return a sanitized partial response when optional providers fail.

- [ ] **Step 6: Verify no secret reaches browser code**

Run `npm run build`, then scan `.next/static` and route responses for environment variable values/names that indicate accidental secret bundling.

- [ ] **Step 7: Verify and record Phase 4**

Run: `npm run lint && npm run typecheck && npm test && npm run build`

Expected: all checks pass; update progress; attempt the specified local commit.

---

### Task 5: Transparent deterministic calculation engine

**Phase:** 5

**Files:**
- Create every `src/engine/**` file listed in the file map
- Create colocated tests for numbers, indicators, support/resistance, each score module, horizons, and analysis orchestration
- Modify: `src/services/analysis-service.ts` to call the engine
- Update: `CALCULATION_ENGINE.md` with exact implemented thresholds and worked examples

**Interfaces:**
- `calculateIndicators(candles): IndicatorSeries`.
- `scoreTechnical(timeframes): ScoreResult`.
- `scoreFundamentals(data): ScoreResult | UnsupportedScore`.
- `scoreMarket(context): ScoreResult`.
- `scoreNews(events, now): ScoreResult`.
- `scoreRisk(input): RiskScoreResult`.
- `scoreQuality(input): QualityResult`.
- `calculateHorizons({ technical, market, fundamental, events, risk }): HorizonScores`.
- `analyzeNormalizedDataset(dataset): AnalysisCoreResult`.

- [ ] **Step 1: Write failing numerical-safety tests**

```ts
expect(safeDivide(10, 0)).toBeNull();
expect(clampScore(Number.NaN)).toBe(0);
expect(clampScore(120)).toBe(100);
```

- [ ] **Step 2: Write failing indicator fixtures**

Use a small hand-calculated constant series and a deterministic rising/falling series. Assert finite results, warm-up `null` values, no look-ahead use, and closed-bar-only confirmed scoring.

- [ ] **Step 3: Implement common math and indicators minimally**

Use pure functions and return unavailable values rather than zero for insufficient lookback. Do not access time, network, or React state from engine files.

- [ ] **Step 4: Write failing score-module tests**

Cover bullish, bearish, neutral, negative earnings, high debt, dilution, low liquidity, near earnings, missing peer data, low quality, unsupported security, risk caps, and multi-timeframe 40/30/20/10 weighting.

- [ ] **Step 5: Implement scoring modules and audit reasons**

Every module returns `{ score, availableWeight, reasons, warnings, breakdown }`. Missing optional metrics renormalize only within documented caps; missing critical metrics suspend that component. No function returns `NaN` or `Infinity`.

- [ ] **Step 6: Implement quality gate and horizon scores**

Use the approved risk deductions of 0/3/8/15/25 and clamp final scores. `Q < 60` returns a stopped result with missing/conflicting evidence instead of entry/exit scenarios.

- [ ] **Step 7: Run engine coverage and full verification**

Run:

```powershell
npm run test:coverage
npm run lint
npm run typecheck
npm run build
```

Expected: engine statements/branches/functions/lines meet the configured high threshold and all scores remain finite and bounded.

- [ ] **Step 8: Record Phase 5**

Update progress and attempt commit `phase-5: implement transparent stock calculation engine`.

---

### Task 6: Safe Gemini summary and deterministic Thai fallback

**Phase:** 6

**Files:**
- Create: `src/providers/gemini/schema.ts`, `prompt.ts`, `provider.ts`, `numeric-validation.ts`, `template.ts`
- Modify: `src/services/analysis-service.ts`
- Test: colocated Gemini/fallback tests and `tests/integration/summary-fallback.test.ts`

**Interfaces:**
- `buildSummaryPrompt(input): GeminiPromptPayload` contains structured facts only.
- `validateSummaryNumbers(output, input): ValidationResult` rejects untraceable numeric tokens.
- `buildThaiTemplateSummary(input): AnalysisSummary` always succeeds for valid analysis input.
- `createSummary(input): Promise<{ summary; source: "gemini" | "template" }>`.

- [ ] **Step 1: Write failing safety tests**

Test missing key, timeout, 429, invalid JSON, extra number, changed score, changed price zone, and a valid narrative containing only allowed numbers.

- [ ] **Step 2: Verify red state**

Run: `npm test -- src/providers/gemini tests/integration/summary-fallback.test.ts`

Expected: FAIL because the summary modules are missing.

- [ ] **Step 3: Implement schema, prompt, and numeric traceability**

Prompt instructions forbid new facts and directive buy/sell language. Parse output with Zod. Normalize Thai/Arabic number punctuation before comparing every numeric token with a canonical allowlist derived from structured input.

- [ ] **Step 4: Implement the deterministic Thai template**

Generate overview, strengths, weaknesses, watch items, three scenarios, data limitations, and disclaimer directly from reason codes and supplied metrics.

- [ ] **Step 5: Integrate graceful fallback and verify server-only usage**

Gemini failures never fail `/api/analyze`; they attach a safe warning and `summarySource: "template"`.

- [ ] **Step 6: Verify and record Phase 6**

Run: `npm run lint && npm run typecheck && npm test && npm run build`

Expected: all checks pass; update progress; attempt the specified local commit.

---

### Task 7: Installable PWA and truthful offline behavior

**Phase:** 7

**Files:**
- Create: `src/app/manifest.ts`, `src/app/offline/page.tsx`, `src/components/pwa/service-worker-registration.tsx`
- Create: `public/sw.js`, `public/icons/icon-192.svg`, `public/icons/icon-512.svg`, `public/apple-touch-icon.svg`
- Modify: `src/app/layout.tsx`, `src/features/analysis/analysis-dashboard.tsx`
- Test: `src/components/pwa/service-worker-registration.test.tsx`, `tests/e2e/pwa.spec.ts`

**Interfaces:**
- Service worker caches versioned static shell resources only plus explicitly stored last-result responses carrying original timestamps.
- Offline UI always displays `ออฟไลน์` and the last-update time.

- [ ] **Step 1: Write failing manifest/offline tests**

Assert standalone display, light background/theme colors, required icon sizes, service-worker registration, offline route, and stale-data label.

- [ ] **Step 2: Verify red state**

Run: `npm test -- src/components/pwa && npm run test:e2e -- tests/e2e/pwa.spec.ts`

Expected: FAIL because PWA files do not exist.

- [ ] **Step 3: Implement manifest, icons, registration, and offline shell**

Version the cache, remove old caches on activate, use network-first for navigation, never silently cache third-party calls, and preserve response timestamps for any last-result cache.

- [ ] **Step 4: Verify installability and stale labeling**

Run build and Playwright tests with a registered service worker. Confirm offline content never says real-time.

- [ ] **Step 5: Record Phase 7**

Update progress and attempt commit `phase-7: enable secure MarketLens progressive web app`.

---

### Task 8: Full QA, accessibility, security, and secret scanning

**Phase:** 8

**Files:**
- Create: `scripts/secret-scan.mjs`
- Expand: unit/component/integration/E2E tests
- Modify: `package.json`, `playwright.config.ts`, `MANUAL_TEST_CHECKLIST.md`
- Create: `TEST_REPORT.md`

**Interfaces:**
- Scripts: `lint`, `typecheck`, `test`, `test:coverage`, `test:e2e`, `build`, `secret:scan`, `verify`.

- [ ] **Step 1: Write the secret scanner test fixtures and failing scan test**

The scanner rejects private-key blocks, common live-key prefixes, non-example `.env*` files, and suspicious assignments while allowing `.env.example` with blank values.

- [ ] **Step 2: Implement the secret scanner without printing secret values**

Output only file path, line number, and rule name. Scan source/docs/config and `git ls-files` when available; ignore generated dependency/build folders.

- [ ] **Step 3: Expand test matrices**

Add mobile and desktop viewports, keyboard navigation, visible mock/stale/partial labels, daily limit, cache, 429, low quality, unsupported type, Gemini fallback, route sanitization, and reduced-motion checks.

- [ ] **Step 4: Run the complete verification suite**

Run:

```powershell
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run test:e2e
npm run build
npm run secret:scan
```

Expected: all exit 0. Record exact test counts and commands in `TEST_REPORT.md`.

- [ ] **Step 5: Record Phase 8**

Update progress and attempt commit `phase-8: complete automated testing and quality assurance`.

---

### Task 9: Performance, security, and final local release audit

**Phase:** 9

**Files:**
- Modify: `next.config.ts`, heavy client components, cache/request orchestration, and docs as evidence requires
- Create: `FINAL_AUDIT.md`, `SECURITY_REPORT.md`, `DEPLOYMENT_READINESS.md`
- Final update: `PROGRESS.md`, `README.md`

**Interfaces:**
- No new product behavior; this task verifies and tightens existing boundaries.

- [ ] **Step 1: Audit client/server boundaries and bundle output**

Inspect `.next/static`, route chunks, and source maps for key names/values and server-only imports. Confirm chart code is dynamically loaded and no duplicate analysis request occurs on a single submit.

- [ ] **Step 2: Add and verify security headers**

Configure CSP compatible with self-hosted application code, `X-Content-Type-Options: nosniff`, strict referrer policy, restricted permissions policy, frame protection, and an appropriate HSTS note for future HTTPS deployment.

- [ ] **Step 3: Review dependencies and document actionable risk**

Run `npm audit --omit=dev` and `npm outdated`. Apply only compatible non-breaking fixes that pass the full suite. Record unresolved advisories honestly.

- [ ] **Step 4: Run final verification from a clean production build**

Run:

```powershell
npm run verify
git diff --check
git status --short --branch
git remote -v
git log --oneline --decorate -10
```

Expected: verification exits 0; `git remote -v` is empty; reports contain actual evidence.

- [ ] **Step 5: Write final audit reports**

`DEPLOYMENT_READINESS.md` must state that real Twelve Data, SEC, Finnhub, Stooq, and Gemini integrations still require live-key/provider-contract validation before production. It must list required environment variables and preview-only future steps without running them.

- [ ] **Step 6: Record Phase 9 and attempt the final local commit**

Update `PROGRESS.md` and attempt commit `phase-9: complete performance security and local release audit` only if Git identity already exists.

---

## Plan self-review

- Spec coverage: every design section maps to Tasks 1–9.
- Placeholders: no `TBD`, deferred implementation phrase, or undefined neighboring interface remains.
- Type consistency: provider, engine, summary, service, and UI interface names are stable throughout the plan.
- Scope: the nine phases form one locally testable V1; real-key validation and deployment remain explicitly outside authorization.
- TDD: each behavior-bearing task begins with a failing focused test and records red/green verification.
- Safety: Git identity is never changed automatically; no remote/push/deploy action appears in an executable step.
