# GenLayer Studio verification

Status: DEPLOYED (final source)

Network: studionet
RPC: https://studio.genlayer.com/api
Chain ID: 61999
Contract: `0x9A5036CB16166071979c94DE8eB571dA295f2719`
Deploy tx: `0x13f2c9165c4f45f3ce27ab1e28ad8886347a883a2fe80dc7838bf69bebb74545`
Schema compile: SUCCESS

Supersedes `0x7c44585fedFF74B85A75e1F1BD34c2B582e4a21c` after DynArray instantiation fix.

## Writes
- register_project Nova SUCCESS `0x229d6e0ac5bded330b43203a43a80264fea5bddfe20a98f1eb030374fad72d47`
- start_review #1 SUCCESS `0xac7440bd1cd038434aba0ab65b1faa233273e01d679773dbdfb008b412eec22d` ACTIVE
- register_project Helios Archive SUCCESS `0x82488310f507c894184d08e5e37d9f9da93b3bf5a9211bde4d20e5c1aae19ee9`
- start_review #2 SUCCESS persisted review_id 2 ABANDONED succession true
- register_project injection SUCCESS `0xcf164d688a0f5ecd22cb53151003ef7d4c7e2f7d8bd8d1c531b0956455f65100`
- start_review #3 SUCCESS `0x1277ab722a6fa646047234bb2970035c25d6c61aade9e633cd06c814b4d77ad4` INSUFFICIENT_EVIDENCE

## Reads
get_project_count 3 PASS
get_review_count 3 PASS
get_project 1 ACTIVE / 2 ABANDONED PASS
get_review 1 ACTIVE / 2 ABANDONED / 3 INSUFFICIENT_EVIDENCE PASS
get_latest_review matching PASS
get_project_status matching PASS
get_project_reviews(2)=[2] PASS
is_succession_eligible false/true/false PASS
unknown IDs safe PASS
