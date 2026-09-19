# Architecture

Single Intelligent Contract: LastCommitRegistry.

Frontend: Next.js App Router.

Backend: Next.js route handlers only. No PostgreSQL. No Redis.

Reads and writes target the contract. Validation of URLs and field bounds happens both client-side and server-side and again in the contract.
