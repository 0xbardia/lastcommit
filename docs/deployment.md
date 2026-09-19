# Deployment

## Current target

- Node: `22.23.2`
- Network: GenLayer Studionet (`61999`)
- Contract: `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c`
- Public URL: `https://lastcommit.bydx.fun`
- PM2 process: `lastcommit`
- Local bind: `127.0.0.1:4123` (Nginx terminates TLS for `lastcommit.bydx.fun`)

Build with `npm run build`, which produces the Nitro/Vercel output and runs the existing migration hook. The production process serves that output with `srvx` on port `4123`. Reload the existing `lastcommit` PM2 process after a successful build. Do not create a second process.

Only `VITE_` public values belong in build-time configuration. Private deploy keys, if used for an administrative deployment task, stay outside the browser and are never logged.

The deployment transaction and source hash are recorded in [`docs/genlayer-studio-verification.md`](genlayer-studio-verification.md) and the machine-readable deployment artifact.
