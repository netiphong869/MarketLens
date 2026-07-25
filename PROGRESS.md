# MarketLens Progress

Last updated: 2026-07-25 (Asia/Bangkok)

| Workstream | Status | Evidence |
|---|---|---|
| Live provider baseline | Completed | Preview env 6 names SET; Twelve Data works; Finnhub 401; SEC ~3.75 MB; Gemini model 404; Stooq HTML challenge |
| Finnhub auth hardening | Completed locally | `X-Finnhub-Token` regression test |
| Gemini model discovery | Completed locally | discovery, stable Flash selection, model 404 and hallucinated-number fallback tests |
| SEC Company Facts boundary | Completed locally | >1 MB success, >6 MiB reject, JSON/content/redirect checks |
| Coverage and horizon truthfulness | Completed locally | Q=85 explanation, module coverage, nullable unavailable scores, Partial/Insufficient horizons |
| Stooq validation | Completed locally | real response identified as HTML challenge; parser rejects unusable backup |
| Dependency triage | In progress | Next.js 16.2.11 installed; 11 High package nodes remain from 2 root advisory chains |
| Local verification | Completed | lint, typecheck, 30 Vitest files/68 tests, scanner 4/4, E2E 4/4, build, secret scan |
| Live Preview verification | Pending | ต้อง Commit/Push และ Deploy Preview หลังเอกสารพร้อม |

## Local verification 2026-07-25

- `npm run verify`: exit 0
- Vitest: 30 files / 68 tests
- Secret scanner regression: 4/4
- Playwright: 4/4 mobile + desktop
- Production build: Next.js 16.2.11 passed
- Secret scan: 136 current files, 3 commits, 382 history blobs
- Working branch: `main`
- Production deployment: not performed
