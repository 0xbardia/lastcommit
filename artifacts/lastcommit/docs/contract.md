# Contract

File: `contracts/LastCommitRegistry.py`

Depends: `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`

## Storage

- projects: TreeMap[u256, Project]
- reviews: TreeMap[u256, Review]
- project_review_ids: TreeMap[u256, DynArray[u256]]
- project_count, review_count: u256

## Writes

- register_project(...)
- update_project(...) — owner only
- start_review(project_id) — fetches evidence in a nondet block, LLM JSON verdict via prompt_non_comparative, stores immutable review snapshot

## Reads

- get_project_count
- get_project
- get_review_count
- get_review
- get_latest_review
- get_project_status
- get_project_reviews(offset, limit)
- is_succession_eligible

Unknown IDs return empty records / UNKNOWN / false. Reads do not mutate state.

ABANDONED is the only verdict that sets succession_eligible.
