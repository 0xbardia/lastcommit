# Security Policy

## Reporting

Do not open a public GitHub issue for a vulnerability before it has been disclosed privately.

Use GitHub’s private vulnerability reporting on this repository if it is enabled:

https://github.com/0xbardia/lastcommit/security/advisories/new

If that form is unavailable, contact the repository maintainers privately through an approved GitHub maintainer channel. Do not paste private keys, seed phrases, or production credentials into public issues.

No separate security email is published for this project.

## Supported version

The supported application and contract are the current production deployment:

- App: https://lastcommit.bydx.fun
- Contract: `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c`
- Network: GenLayer Studionet (chain ID `61999`)

Superseded Studionet addresses are historical only.

## Scope

In scope:

- Wallet-signed writes and owner checks
- Evidence URL validation and fail-closed review handling
- Leakage of private keys or server secrets
- Incorrect verdict / succession eligibility relative to registered policy and stored snapshots

Out of scope / known boundaries:

- GenLayer renderer DNS, redirects, and network capacity
- Network-level throttling of public `start_review`
- External GitHub/ownership/token transfer (not implemented)
- Issues that require mutating Studionet from unsolicited third-party scripts
