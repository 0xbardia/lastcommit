# HISTORICAL / SUPERSEDED ARTIFACT — LastCommit

This directory is retained as audit and deployment history. Its source snapshots, addresses, and transaction records are not the current production deployment. See the root `README.md` and `docs/genlayer-studio-verification.md` for current values.

Proof of Abandonment protocol for open-source and Web3 projects.

LastCommit determines when a project is truly abandoned — and proves what should happen next.

GenLayer is required because the verdict is semantic: bot commits, a live website, or a quiet-but-maintained repository are evidence, not automatic outcomes.

## V1 scope

1. Register project
2. Define abandonment policy (STANDARD / STRICT / CUSTOM)
3. Start abandonment review
4. GenLayer semantic evaluation
5. Permanent public proof
6. Succession-eligible state

V1 does not transfer ownership, treasury, or tokens.

## Architecture

Frontend (Next.js) → API integration layer → GenLayer client → LastCommitRegistry Intelligent Contract

The contract is the source of truth. There is no application database of verdicts.

## Local setup

```bash
cd lastcommit
cp .env.example .env
npm install
npm run dev
```

## Commands

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — production server
- `npm run typecheck`
- `npm test` — validation unit tests
- `npm run test:e2e` — Playwright (requires a built app on :3000)

## Environment

See `.env.example`. After Studio deployment, set `NEXT_PUBLIC_LASTCOMMIT_CONTRACT_ADDRESS`.

Never commit private keys.

## Contract

`contracts/LastCommitRegistry.py`

Deploy in [GenLayer Studio](https://studio.genlayer.com/contracts).

## Limitations

- Studio deployment requires interactive wallet / auth (BLOCKED_EXTERNAL from this environment).
- Writes need a connected GenLayer account and fee estimate on fee-charging networks.
- V1 succession is eligibility only.
