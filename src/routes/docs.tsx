import { createFileRoute } from "@tanstack/react-router";
import { LASTCOMMIT_CHAIN_ID, LASTCOMMIT_CONTRACT, LASTCOMMIT_DEPLOY_TX, LASTCOMMIT_NETWORK, LASTCOMMIT_RPC, LASTCOMMIT_SITE_URL } from "@/lib/contract-config";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "LastCommit Docs" },
      { name: "description", content: "How LastCommit records evidence, GenLayer consensus, and Project Succession eligibility." },
      { property: "og:title", content: "LastCommit Docs" },
      { property: "og:description", content: "How LastCommit records evidence, GenLayer consensus, and Project Succession eligibility." },
      { property: "og:url", content: `${LASTCOMMIT_SITE_URL}/docs` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${LASTCOMMIT_SITE_URL}/og.svg` },
      { name: "twitter:title", content: "LastCommit Docs" },
      { name: "twitter:description", content: "How LastCommit records evidence, GenLayer consensus, and Project Succession eligibility." },
    ],
    links: [{ rel: "canonical", href: `${LASTCOMMIT_SITE_URL}/docs` }],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">Documentation</p>
      <h1 className="mt-2 text-4xl font-medium">Protocol notes</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">LastCommit creates Proof of Abandonment for open-source and Web3 projects. It evaluates registered public evidence against a registered policy and records the result through GenLayer consensus.</p>
      <section className="mt-8 border border-line bg-surface p-5"><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Current deployment</p><h2 className="mt-2 text-xl font-medium">GenLayer Studionet</h2><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-muted">Contract</dt><dd className="mt-1 break-all font-mono text-xs">{LASTCOMMIT_CONTRACT}</dd></div><div><dt className="text-muted">Network / chain</dt><dd className="mt-1 font-mono text-xs">{LASTCOMMIT_NETWORK} · {LASTCOMMIT_CHAIN_ID}</dd></div><div><dt className="text-muted">RPC</dt><dd className="mt-1 break-all font-mono text-xs">{LASTCOMMIT_RPC}</dd></div><div><dt className="text-muted">Deployment transaction</dt><dd className="mt-1 break-all font-mono text-xs">{LASTCOMMIT_DEPLOY_TX}</dd></div></dl></section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2"><article className="border border-line bg-surface p-5"><h2 className="text-xl font-medium">The review model</h2><ol className="mt-4 grid gap-3 text-sm leading-6 text-muted"><li><span className="font-mono text-rust">01</span> Register a project and its evidence sources.</li><li><span className="font-mono text-rust">02</span> Snapshot a policy and configuration version.</li><li><span className="font-mono text-rust">03</span> Fetch public evidence inside the intelligent contract.</li><li><span className="font-mono text-rust">04</span> Evaluate semantic dimensions through GenLayer consensus.</li><li><span className="font-mono text-rust">05</span> Publish an immutable review snapshot.</li></ol></article><article className="border border-line bg-surface p-5"><h2 className="text-xl font-medium">Verdicts</h2><dl className="mt-4 grid gap-3 text-sm leading-6"><div><dt className="font-mono text-paper">ACTIVE</dt><dd className="text-muted">Meaningful development or stewardship continues.</dd></div><div><dt className="font-mono text-paper">DORMANT</dt><dd className="text-muted">Activity is low, but abandonment is not proven.</dd></div><div><dt className="font-mono text-paper">ABANDONED</dt><dd className="text-muted">The registered policy finds meaningful continuation has ceased.</dd></div><div><dt className="font-mono text-paper">INSUFFICIENT_EVIDENCE</dt><dd className="text-muted">Evidence cannot support a reliable conclusion.</dd></div></dl></article></section>
      <section className="mt-6 border border-line bg-surface p-5"><h2 className="text-xl font-medium">Ownership and lifecycle</h2><p className="mt-3 text-sm leading-6 text-muted">Registration and project updates are signed by the connected EIP-1193 wallet. LastCommit never receives or stores a private key. Review requests are public, but they include the expected configuration and latest-review values so stale concurrent requests are rejected. The UI surfaces the transaction hash immediately, keeps pending metadata only as local recovery UX, and checks GenLayer execution results before showing success.</p></section>
      <section className="mt-6 border border-line bg-surface p-5"><h2 className="text-xl font-medium">Evidence boundary</h2><p className="mt-3 text-sm leading-6 text-muted">Source URLs must be HTTPS hostnames, GitHub evidence must point to github.com, and duplicate normalized URLs count once. Direct IP literals, credentials, explicit ports, unsafe schemes, local hostnames, and malformed hosts are rejected. GenLayer’s renderer still owns DNS resolution and redirect behavior; the contract documents that remaining trust boundary rather than claiming complete network-level SSRF prevention.</p></section>
      <section className="mt-6 border border-line bg-surface p-5"><h2 className="text-xl font-medium">Project Succession</h2><p className="mt-3 text-sm leading-6 text-muted">An ABANDONED review can make a project succession-eligible only when it matches the current configuration version. Updating a project invalidates current eligibility until a new review completes. LastCommit proves eligibility; it does not transfer external assets, ownership, or treasury.</p></section>
      <section className="mt-6 border border-line bg-surface p-5"><h2 className="text-xl font-medium">Public methods</h2><div className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><h3 className="font-mono text-xs uppercase text-muted">Reads</h3><p className="mt-2 font-mono text-xs leading-6 text-muted">get_project_count · get_project · get_project_status · get_review_count · get_review · get_latest_review · get_project_review_count · get_project_reviews · is_succession_eligible</p></div><div><h3 className="font-mono text-xs uppercase text-muted">Writes</h3><p className="mt-2 font-mono text-xs leading-6 text-muted">register_project · update_project · start_review</p></div></div></section>
    </main>
  );
}
