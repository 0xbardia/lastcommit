# GenLayer Studio verification

Status: CURRENT DEPLOYMENT VERIFIED

- Network: `studionet`
- RPC: `https://studio.genlayer.com/api`
- Chain ID: `61999`
- Contract: `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c`
- Deployment transaction: `0x78baecf7507373723849e4c5da8c3c2a288810999396ae54f75cc8bbfbab114c`
- Source SHA-256: `bc59c88ce310133beeedcefed0021d9b8d247f114a0ddc9a798382c8f4dbe06c`
- Schema compile: SUCCESS

The deployment record is machine-readable at [`artifacts/lastcommit/docs/final-repair-deploy-result.json`](../artifacts/lastcommit/docs/final-repair-deploy-result.json). The earlier repaired candidates are superseded; they are not used by the application.

## Certified cases

The final certification record is [`artifacts/lastcommit/docs/final-certification.json`](../artifacts/lastcommit/docs/final-certification.json). It records the real wallet-signed transactions, returned IDs, receipt execution checks, read values, authorization failure, configuration-version transition, history reads, and adversarial evidence result.

Certified records:

- Project 1 / review 1: ACTIVE. Registration `0xc31bed920384ec6dee3c5d302e6f1e39b813b0ace5c829da2fb06778dec4d6b9`; review `0x1fca884bc8d198d34ac15d4181a7cc19cea1d6746d4310bad58e59b7e9bfb47e`.
- Project 4 / reviews 4 and 5: ABANDONED, succession true before and after a configuration update. Registration `0x5ebb69793193b81366a83d5b80259ddea4588a746cc62c5d26be1f0d93367650`; review `0x0cc25ff161ac3d3e8cf162a3261412467d924ba4482c1427d0906343275a1caf`; update `0xefc283341cc247f35c523be7a297e8b66cdecd6b1056b541a5e5a6e2c0d5a2e8`; re-review `0x2f06011709a9d958c5e628ad5483d720c4f7a277c1acdaf6eb4f4557629cbcd2`.
- Project 5 / review 6: INSUFFICIENT_EVIDENCE under prompt-injection and duplicate-source conditions. Registration `0x6fe84df4e130396f823d816d2aa375bf87c9c0e5205cb0b3a1f5d69e7797fa9c`; review `0x636071e39d5ef6fd607a8f99c491083aef24d4b3b43caad699bffa7eb7a95e6d`.

## Read/write model

`register_project`, `update_project`, and `start_review` return their resulting IDs/version values. Reads include bounded review-history pagination. Finalized receipts are accepted only when the current SDK result is a successful return; a quorum-short-circuited idle leader is not mistaken for a contract execution failure.

Historical deployment evidence remains available under `artifacts/lastcommit/` and is explicitly superseded where it names an old address.
