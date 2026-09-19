# Security

Threats addressed:

- Ownership spoofing: owner is tx sender; updates require owner match
- URL abuse: http(s) only, private hosts rejected, length bounded
- Prompt injection: evidence and policy wrapped in delimiters; instructions tell the model to ignore embedded commands; custom policy cannot override protocol rules
- Malformed LLM JSON: invalid verdict coerced to INSUFFICIENT_EVIDENCE
- Failed sources cannot become ABANDONED
- Historical reviews keep the policy snapshot from review time
- IDs increment monotonically
- Input length limits

Studio / RPC credentials must never ship in the client bundle as secrets. Public contract address is not a secret.
