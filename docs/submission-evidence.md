# LastCommit submission evidence

## Current deployment

- Network: GenLayer Studionet (`61999`)
- Contract: `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c`
- Deployment transaction: `0x78baecf7507373723849e4c5da8c3c2a288810999396ae54f75cc8bbfbab114c`
- Source SHA-256: `bc59c88ce310133beeedcefed0021d9b8d247f114a0ddc9a798382c8f4dbe06c`

## Certification record

[`artifacts/lastcommit/docs/final-certification.json`](../artifacts/lastcommit/docs/final-certification.json) reports `PASS` and is the source of truth for the certification assertions and final read values.

Required cases are recorded there:

- wallet-bound registration and unauthorized update rejection;
- ACTIVE review;
- ABANDONED review and current succession eligibility;
- update-after-abandonment invalidation and new `config_version` review;
- prompt-injection / insufficient-evidence review;
- unknown/empty reads and bounded review-history pagination.

Final state: 5 registered certification projects and 6 finalized reviews (project 3 is the earlier registered adversarial fixture whose transient submission was retried). Project 1 is ACTIVE, project 4 is ABANDONED with current succession eligibility after its configuration-bound re-review, and project 5 is INSUFFICIENT_EVIDENCE with succession false.

The former address `0x9A5036CB16166071979c94DE8eB571dA295f2719` and all earlier transaction records are historical/superseded evidence only.
