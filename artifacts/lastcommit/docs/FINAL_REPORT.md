# HISTORICAL / SUPERSEDED — LastCommit final report

This report records an earlier deployment and is retained for audit history only. Do not use its contract address or claims as current release evidence.

Project status: READY (contract deployed + all public Read methods verified)

Architecture: TanStack Start app → server functions → genlayer-js → LastCommitRegistry on Studionet

Contract file: `contracts/LastCommitRegistry.py` (copy: `artifacts/lastcommit/contracts/LastCommitRegistry.py`)

## Contract methods

Writes: register_project, update_project, start_review
Reads: get_project_count, get_project, get_review_count, get_review, get_latest_review, get_project_status, get_project_reviews, is_succession_eligible

## Security fixes in this pass

- Private-host check no longer treats public 104.x as 10.x
- 172.16–31 and 127/0 ranges blocked
- Unknown IDs return zero address, not the caller
- LLM output JSON extracted even with fences
- ABANDONED coerced to INSUFFICIENT_EVIDENCE when no sources loaded
- Review history append-only; policy snapshotted at review time

## Studio deployment

Network: studionet
Address: 0x7c44585fedFF74B85A75e1F1BD34c2B582e4a21c
Deploy tx: 0x9d9f2a3bb1f853f81fee2db2340a3074086900970e4dab2195a01585ebbf46f8
Schema compile: SUCCESS

## Read methods

All PASS on empty/unknown IDs and after register_project (project #1 Nova Protocol, status UNREVIEWED, succession false). Evidence: docs/read-methods-results.json

## Writes exercised

register_project SUCCESS (tx 0xf90e4c18cb1a3018182425c2fe5ec622a22468a42756274ac9afd497237f5b82)

## Frontend routes

/ landing
/app explorer (live contract)
/projects/new register write
/projects/$id project + start review
/proof/$reviewId public proof
/docs

## Backend

Thin createServerFn integration. No verdict database. Studio RPC rate limit (30/min) is handled with cache + empty-state, not mocked verdicts.

## Known limitations

- Hosted Studio rate-limits burst reads
- start_review is a long consensus/LLM transaction
- V1 succession is eligibility only
