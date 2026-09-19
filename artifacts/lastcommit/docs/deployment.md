# Deployment

1. Open https://studio.genlayer.com/contracts
2. Paste `contracts/LastCommitRegistry.py`
3. Deploy with no constructor arguments
4. Copy address into `.env` as NEXT_PUBLIC_LASTCOMMIT_CONTRACT_ADDRESS
5. Call every public read method (empty state first)
6. register_project, then re-run reads
7. start_review, then verify get_review / get_latest_review / is_succession_eligible
