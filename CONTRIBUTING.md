# Contributing to LastCommit

## Prerequisites

- Node.js `22.23.2` (see `package.json` `engines`)
- npm (bundled with Node 22)

## Local setup

```bash
npm ci
cp .env.example .env
npm run dev
```

`.env` is local-only. Copy names from `.env.example`. Never commit secrets or private keys.

Public Studionet values (contract address, chain ID, public RPC URL) may stay in `.env.example`. Wallet private keys must not.

## Gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Optional read-only browser checks:

```bash
npx playwright test --config=playwright.config.ts
```

Do not run write/certification scripts (`scripts/deploy-lastcommit.mjs`, `scripts/final-certification.mjs`) against Studionet unless you intend to mutate chain state.

## Expectations

- Match existing architecture: TanStack Start app, GenLayer contract as source of truth.
- Do not commit `.env`, keys, logs, or build caches.
- Keep the current Studionet contract address unless maintainers explicitly supersede it:
  `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c`
- Contract source changes require a new GenLayer deployment and verification. Do not treat a local Python edit as live protocol state.

## Scope

V1 proves abandonment eligibility. It does not transfer GitHub ownership, tokens, or treasuries.
