# LastCommit

LastCommit is a GenLayer-powered Proof of Abandonment protocol for open-source and Web3 projects.

## The problem

Open-source and Web3 projects stall. A repository still exists. A website still loads. Bots still open pull requests. A “last commit” date still ticks. None of that is a verdict that maintainers have abandoned the work, or that succession is justified.

LastCommit records a public, policy-bound evaluation of registered evidence. It does not scrape the world on its own and then declare a winner. A project owner registers sources and a policy. Reviewers (including the public `start_review` path) ask GenLayer to collect those sources and return a structured verdict.

## What it evaluates

Registered HTTPS evidence — typically repository activity, documentation, and project URLs — is collected and judged against a registered policy (`STANDARD`, `STRICT`, or a bounded `CUSTOM` policy). Superficial activity is not automatically “alive,” and silence is not automatically “dead.”

A last commit is evidence, not abandonment.

## Verdicts

| Verdict | Meaning |
| --- | --- |
| `ACTIVE` | Evidence supports ongoing meaningful development, maintenance, or stewardship. |
| `DORMANT` | Evidence supports stalled but not abandoned status. |
| `ABANDONED` | Evidence supports the registered abandonment policy. |
| `INSUFFICIENT_EVIDENCE` | Sources failed to load, were empty, or the structured result could not be validated. Zero successfully loaded sources always fail closed here. |

`UNREVIEWED` / `UNKNOWN` are UI states for projects that have no usable on-chain review yet, not additional protocol verdicts.

## Succession eligibility

An `ABANDONED` review can make succession eligible only while its stored `config_version` matches the current project configuration. Updating sources or policy keeps the historical review but drops current succession authority until a new review completes.

V1 proves eligibility. It does not transfer GitHub ownership, tokens, treasuries, or any external asset.

## Why GenLayer is required

Abandonment is a semantic judgment over messy public evidence, not a single on-chain number. GenLayer Intelligent Contracts can fetch registered URLs and reach consensus on a structured manifest. A conventional EVM contract cannot perform that evaluation without an off-chain oracle the protocol would then have to trust blindly.

## Architecture

TanStack Start + Nitro frontend → server-side read functions → `genlayer-js` → `LastCommitRegistry` Intelligent Contract.

- Reads use a signer-free GenLayer client.
- Writes use the connected EIP-1193 wallet. Private keys never enter the server.
- The contract is the source of truth. There is no verdict database.

See [docs/architecture.md](docs/architecture.md) and [docs/contract.md](docs/contract.md).

## Production

| | |
| --- | --- |
| Application | https://lastcommit.bydx.fun |
| Contract | `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c` |
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| Deployment transaction | `0x78baecf7507373723849e4c5da8c3c2a288810999396ae54f75cc8bbfbab114c` |
| Contract source | [contracts/LastCommitRegistry.py](contracts/LastCommitRegistry.py) |
| Source SHA-256 | `bc59c88ce310133beeedcefed0021d9b8d247f114a0ddc9a798382c8f4dbe06c` |

The previous deployment `0x9A5036CB16166071979c94DE8eB571dA295f2719` is superseded. It may appear only in clearly marked historical evidence under `artifacts/lastcommit/docs/`. Do not copy it into runtime config.

## Local setup

Node `22.23.2` is the supported runtime.

```bash
npm ci
cp .env.example .env
npm run dev
```

## Environment

See [`.env.example`](.env.example). Public RPC, network, hostname, and contract address are expected. Never add a private key to Vite/`VITE_` variables.

## Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Optional read-only Playwright checks:

```bash
npx playwright test --config=playwright.config.ts
```

Do not run `scripts/deploy-lastcommit.mjs` or `scripts/final-certification.mjs` unless you intend to deploy or mutate Studionet.

## Tests

Unit and source tests live in `scripts/*.test.mjs` and `src/lib/**/*.test.ts`. Contract-source assertions live in `scripts/contract-invariants.test.mjs` and related files. They do not write to chain.

Live Studionet certification is recorded in [docs/genlayer-studio-verification.md](docs/genlayer-studio-verification.md) and [docs/submission-evidence.md](docs/submission-evidence.md). Those writes are historical; do not replay them casually.

## Contract architecture

`LastCommitRegistry` stores projects, bounded evidence URLs, policy snapshots, configuration versions, reviews, and succession eligibility. Reviews are immutable. `start_review` is public but gated by expected version/latest-review checks and a 900-second per-project cooldown.

Details: [docs/contract.md](docs/contract.md).

## Repository structure

```text
contracts/LastCommitRegistry.py   Intelligent Contract source
src/                              TanStack Start application
docs/                             Product, architecture, security, deployment
scripts/                          Dev, lint/test helpers, operational tools
tests/                            Additional validation and Playwright specs
artifacts/lastcommit/docs/        Historical certification evidence
```

## Known V1 limitations

- Evidence URLs are HTTPS hostnames without credentials, ports, or IP literals. GenLayer’s renderer still owns DNS and redirects, so DNS rebinding / redirect-target policy is a renderer assumption.
- `start_review` is public; chain state blocks stale/duplicate effective transitions, but network throttling is an operator concern.
- No automatic transfer of external ownership or assets.

## License

LastCommit is licensed under the [MIT License](LICENSE). Copyright (c) 2026 0xbardia.

## Security

See [SECURITY.md](SECURITY.md) and [docs/security.md](docs/security.md).
