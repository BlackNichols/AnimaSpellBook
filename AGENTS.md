# Project Rules

- **Regression tests for reported issues:** When the user reports a bug or issue, add a test (unit, integration, or E2E as appropriate per `documentation/technical/TESTING.md`) that reproduces/prevents the regression as part of the fix. Prefer the smallest layer that can reliably catch it; use Playwright E2E for browser/first-paint/URL-load behavior that jsdom integration cannot verify.
- Follow `documentation/technical/TESTING.md` and run `npm test -- --run && npm run lint && npm run build` for changes; run `npm run e2e` for UI/flow changes when browsers are installed.
