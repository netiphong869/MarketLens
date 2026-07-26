# MarketLens Project Rules

## Code

- TypeScript strict, small focused modules, pure engine functions
- Validate external boundaries with Zod
- Server routes are thin; orchestration belongs in services
- Provider-specific payloads never reach UI directly
- No `any` without a documented boundary reason

## Tests

- New behavior follows red-green-refactor
- Bug fixes require a regression test
- Do not mock the unit under test
- Required release commands must be run, not inferred

## API and security

- No browser-to-provider calls
- Timeout and bounded retry; never retry 401/403/confirmed 404/429
- Safe errors only; no stack, path, secret header, or credential leakage
- No secret in source, logs, bundle, report, or Git history

## AI

- Structured facts in, deterministic Summary out; Gemini เรียบเรียงได้เฉพาะ Verdict 2–3 ประโยค
- Unknown/changed/invented numbers, schema mismatch หรือ meaning mismatch trigger deterministic fallback
- No personal account/portfolio data is sent to Gemini

## Git and release

- Local repository only in this phase
- No remote, push, GitHub or Vercel action
- Do not set/change Git credentials automatically
- Phase commits are attempted only if identity already exists
