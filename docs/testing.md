# Testing

## Gates

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npx playwright test --config=playwright.config.ts`

Contract tests include schema compilation, ownership/ID invariants, structured-output and configuration-version source assertions, and live Studionet certification through `scripts/final-certification.mjs`.

The live certification record covers empty/unknown reads, wallet-bound registration, unauthorized update, ACTIVE review, ABANDONED succession, update-after-abandonment, adversarial prompt-injection evidence, duplicate source normalization, and history pagination. Browser tests are read-only and do not submit transactions.
