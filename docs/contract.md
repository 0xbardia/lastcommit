# Contract notes

Current deployment: `0x8F1DEEB53214F25341aB3C153d4164dF73DD392c` on GenLayer Studionet.

## Writes

- `register_project` validates bounded metadata and returns the new project ID. Ownership is `gl.message.sender_address`.
- `update_project` is owner-only, requires the expected current configuration version, increments that version, resets current verdict/eligibility, and preserves historical reviews.
- `start_review` requires expected configuration/latest-review values, deduplicates registered sources, collects evidence through GenLayer nondeterminism, validates the returned manifest, and returns the new review ID.

## Evidence invariants

The collector—not the semantic model—produces `loaded_source_count`. The validator checks the declared count against the collector’s returned `sources[].loaded` records. A complete bounded JSON result is required; malformed output, missing fields, invalid enums, or zero loaded sources fail closed to `INSUFFICIENT_EVIDENCE`.

URLs are HTTPS-only, reject credentials, explicit ports, direct IP literals, local hostnames, unsafe schemes, and invalid GitHub repository hosts. Identical normalized URLs are stored once across evidence categories.

## History and eligibility

Review IDs are stored in a composite-key `TreeMap` with bounded reads through `get_project_reviews(project_id, offset, limit)`. The current implementation reserves indices below 1,000,000 per project. A deterministic 900-second per-project cooldown follows each finalized review; an owner configuration update resets that cooldown while also invalidating the old result as current. `is_succession_eligible` requires the latest review to be `ABANDONED` and its configuration version to match the project.

## Public reads

`get_project_count`, `get_project`, `get_project_status`, `get_review_count`, `get_review`, `get_latest_review`, `get_project_review_count`, `get_project_reviews`, and `is_succession_eligible`.
