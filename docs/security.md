# Security notes

## Implemented controls

- User writes are wallet-signed; the server does not create production signers for application writes.
- Owner checks and expected-version checks protect project updates.
- Review requests require expected configuration/latest-review state and a deterministic 900-second per-project cooldown, limiting duplicate and stale transitions while leaving third-party initiation public.
- Contract IDs are returned by the transaction and are not inferred from mutable global counts/latest state.
- Finalized receipts are checked for successful execution, not merely finalization.
- Route IDs are validated before RPC calls. SDK errors are normalized before reaching user-facing UI.
- External evidence is explicitly untrusted data. Protocol rules, registered policy, and evidence are separated in the evaluation prompt.
- Structured verdict dimensions are bounded enums and bounded text fields.

## URL / SSRF boundary

The contract and form validator require HTTPS hostnames, reject credentials, ports, unsafe schemes, local names, and direct IP literals including alternate numeric forms. Exact normalized duplicates do not count independently.

GenLayer’s renderer performs DNS resolution and follows its own fetch/redirect behavior. The application cannot prove or control every redirect target or DNS rebinding event with the current supported contract API. That renderer/network boundary remains a known limitation and is not represented as complete SSRF prevention.

## Operational limitations

`start_review` is intentionally public. Contract state prevents stale/duplicate effective transitions, but network-level request throttling and Studio capacity remain external operational controls. No secrets are included in public Vite configuration. CSP was evaluated but not added at the application layer because the platform injector and wallet/RPC connectivity require third-party origins; Nginx was left unchanged.
