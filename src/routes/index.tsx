import { createFileRoute, Link } from "@tanstack/react-router";
import { FEATURED_PROOF_ID, LASTCOMMIT_SITE_URL } from "@/lib/contract-config";
import { VerdictBadge } from "@/components/verdict-badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LastCommit — Proof of Abandonment" },
      { name: "description", content: "Proof of Abandonment for open-source and Web3 projects." },
      { property: "og:title", content: "LastCommit — Proof of Abandonment" },
      { property: "og:description", content: "Proof of Abandonment for open-source and Web3 projects." },
      { property: "og:url", content: LASTCOMMIT_SITE_URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${LASTCOMMIT_SITE_URL}/og.svg` },
      { name: "twitter:title", content: "LastCommit — Proof of Abandonment" },
      { name: "twitter:description", content: "Proof of Abandonment for open-source and Web3 projects." },
    ],
    links: [{ rel: "canonical", href: LASTCOMMIT_SITE_URL }],
  }),
  component: Home,
});

function Home() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">Protocol forensics</p>
        <h1 className="mt-3 max-w-3xl text-5xl leading-[0.95] font-medium sm:text-7xl">When maintenance stops, proof begins.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">LastCommit uses GenLayer consensus to determine when meaningful development and stewardship have actually ended. A last commit is a signal; a proof is a policy-bound, evidence-backed result.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link to="/app" className="inline-flex min-h-11 items-center bg-paper px-5 text-bg no-underline">Explore projects</Link><Link to="/docs" className="inline-flex min-h-11 items-center border border-line px-5 text-paper no-underline">Read the protocol</Link></div>
      </section>

      <section className="border-y border-line" aria-labelledby="problem-heading">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[1fr_1.4fr] md:items-start"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">The false signal</p><h2 id="problem-heading" className="mt-2 text-3xl font-medium">Last commit ≠ abandonment.</h2></div><p className="max-w-2xl text-lg leading-8 text-muted">A repository can show 42 recent commits: 38 dependency bots, 3 cosmetic edits, 1 documentation tweak, and 0 meaningful releases. Activity is not stewardship. LastCommit asks whether the project still has credible human continuation under its registered policy.</p></div>
      </section>

      <section className="border-b border-line" aria-labelledby="flow-heading">
        <div className="mx-auto max-w-5xl px-4 py-14"><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">From signal to proof</p><h2 id="flow-heading" className="mt-2 text-3xl font-medium">A review you can follow.</h2><div className="mt-8 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">{["Registered policy", "Public evidence", "Semantic review", "GenLayer consensus", "Onchain verdict", "Succession check"].map((step, index) => <div key={step} className="bg-surface p-4"><span className="font-mono text-xs text-muted">0{index + 1}</span><h3 className="mt-8 text-base font-medium">{step}</h3></div>)}</div></div>
      </section>

      {FEATURED_PROOF_ID > 0 ? <section className="border-b border-line" aria-labelledby="proof-heading"><div className="mx-auto max-w-5xl px-4 py-14"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">A real protocol output</p><h2 id="proof-heading" className="mt-2 text-3xl font-medium">Read the proof, not the pitch.</h2></div><Link to="/proof/$reviewId" params={{ reviewId: String(FEATURED_PROOF_ID) }} className="font-mono text-xs text-paper underline underline-offset-4">Open certified proof</Link></div><div className="mt-6 border border-paper/30 bg-surface p-6"><div className="flex flex-wrap items-center gap-3"><VerdictBadge verdict="ABANDONED" /><span className="font-mono text-xs text-muted">GenLayer finalized</span></div><p className="mt-4 max-w-2xl text-lg leading-8 text-muted">This proof records the evaluated configuration, evidence sources, semantic dimensions, and whether succession eligibility is current.</p></div></div></section> : null}

      <section className="border-b border-line" aria-labelledby="genlayer-heading">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-[0.8fr_1.2fr]"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Why GenLayer</p><h2 id="genlayer-heading" className="mt-2 text-3xl font-medium">The verdict cannot come from a private backend.</h2></div><div className="grid gap-4 text-sm leading-6 text-muted sm:grid-cols-2"><p className="border-l border-rust pl-4">GenLayer brings web evidence access and semantic reasoning into an intelligent contract.</p><p className="border-l border-rust pl-4">Consensus validates the evaluation and persists the result where anyone can inspect it.</p><p className="border-l border-rust pl-4">External content is evidence, never an instruction source. Registered policy defines the test.</p><p className="border-l border-rust pl-4">The output is eligibility for succession—not an automatic transfer of assets or ownership.</p></div></div>
      </section>

      <section className="border-b border-line" aria-labelledby="verdict-heading"><div className="mx-auto max-w-5xl px-4 py-14"><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">The vocabulary</p><h2 id="verdict-heading" className="mt-2 text-3xl font-medium">Four honest outcomes.</h2><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["ACTIVE", "DORMANT", "ABANDONED", "INSUFFICIENT_EVIDENCE"].map((verdict) => <article key={verdict} className="border border-line bg-surface p-4"><VerdictBadge verdict={verdict} /><p className="mt-4 text-sm leading-6 text-muted">{verdict === "ACTIVE" ? "Meaningful work or stewardship continues." : verdict === "DORMANT" ? "Activity is low, but abandonment is not proven." : verdict === "ABANDONED" ? "The registered policy finds meaningful continuation has ceased." : "The available evidence cannot support a reliable conclusion."}</p></article>)}</div></div></section>

      <section><div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-6 px-4 py-14"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Start with the record</p><h2 className="mt-2 text-3xl font-medium">Inspect a project. Follow its history.</h2></div><div className="flex gap-3"><Link to="/app" className="inline-flex min-h-11 items-center bg-paper px-5 text-bg no-underline">Open explorer</Link><Link to="/projects/new" className="inline-flex min-h-11 items-center border border-line px-5 text-paper no-underline">Register project</Link></div></div></section>
    </main>
  );
}
