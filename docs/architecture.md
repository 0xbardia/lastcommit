# Architecture

The application is a TanStack Start/Nitro app using `genlayer-js` against the current GenLayer Studionet contract.

## Data flow

- Server functions perform signer-free, bounded contract reads and normalize SDK errors into safe product states.
- Browser writes use an EIP-1193 wallet/provider. The connected address is the contract sender and project owner; private keys are never serialized or sent to the server.
- Client storage contains only pending-transaction recovery metadata. It is not treated as contract state.
- Five-second server-process caching reduces repeated reads; successful browser writes request cache invalidation.
- Explorer reads use contract-backed pages of at most 20 project IDs. Project history uses the contract’s bounded pagination method.

## Contract source of truth

Current address: `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c`.

Projects, reviews, policy snapshots, configuration versions, verdicts, and succession state are stored on-chain. Historical reviews are immutable; current eligibility checks the latest review against the current configuration version.
