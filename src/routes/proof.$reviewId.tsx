import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getReview } from "@/lib/lastcommit";
import { LASTCOMMIT_CONTRACT, LASTCOMMIT_NETWORK, LASTCOMMIT_SITE_URL } from "@/lib/contract-config";
import { VerdictBadge } from "@/components/verdict-badge";

export const Route = createFileRoute("/proof/$reviewId")({
  loader: ({ params }) => getReview({ data: { id: params.reviewId } }),
  head: ({ params }) => {
    const url = `${LASTCOMMIT_SITE_URL}/proof/${encodeURIComponent(params.reviewId)}`;
    return {
      meta: [
        { title: `LastCommit Proof #${params.reviewId}` },
        { name: "description", content: "Proof of Abandonment and project succession eligibility, verified by LastCommit on GenLayer." },
        { property: "og:title", content: `LastCommit Proof #${params.reviewId}` },
        { property: "og:description", content: "Proof of Abandonment and project succession eligibility, verified by LastCommit on GenLayer." },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { property: "og:image", content: `${LASTCOMMIT_SITE_URL}/og.svg` },
        { name: "twitter:title", content: `LastCommit Proof #${params.reviewId}` },
        { name: "twitter:description", content: "Proof of Abandonment and project succession eligibility, verified by LastCommit on GenLayer." },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: ProofPage,
});

function sourceRows(review: { github_url: string; website_url: string; docs_url: string; announcement_url: string }) {
  return [
    ["GitHub", review.github_url],
    ["Website", review.website_url],
    ["Docs / governance", review.docs_url],
    ["Announcement", review.announcement_url],
  ] as const;
}

function CopyValue({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }
  return <button type="button" onClick={() => void copy()} className="min-h-8 shrink-0 border border-line px-2 font-mono text-[10px] text-paper">{copied ? "Copied" : label}</button>;
}

function ProofPage() {
  const data = Route.useLoaderData();
  const { reviewId } = Route.useParams();
  if (data.error) return <ProofError reviewId={reviewId} message={data.error.message} code={data.error.code} />;
  const { review, project, currentReviewMatches } = data;
  const historicalOnly = !currentReviewMatches;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">LastCommit proof</p>
          <p className="mt-2 font-mono text-xs text-muted">Immutable review artifact · #{review.review_id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs text-muted">GenLayer {LASTCOMMIT_NETWORK}</span><CopyValue value={`${LASTCOMMIT_SITE_URL}/proof/${reviewId}`} label="Copy proof link" /></div>
      </div>
      <article className="mt-6 border border-paper/40 bg-surface p-5 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Final verdict</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-medium sm:text-6xl">{review.verdict}</h1>
          <VerdictBadge verdict={review.verdict} />
        </div>
        <p className="mt-5 max-w-3xl text-xl leading-8 text-paper">{review.summary || "No summary was recorded."}</p>
        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {review.verdict === "ABANDONED" && review.succession_eligible && currentReviewMatches ? <span className="border border-moss px-3 py-2 font-mono text-xs tracking-wide text-moss">SUCCESSION ELIGIBLE</span> : null}
          {historicalOnly ? <span className="border border-amber/50 px-3 py-2 font-mono text-xs tracking-wide text-amber">HISTORICAL REVIEW SNAPSHOT</span> : <span className="font-mono text-xs text-muted">Finalized by GenLayer</span>}
        </div>
      </article>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Project identity</p>
          <h2 className="mt-2 text-2xl font-medium">{project.name || `Project ${review.project_id}`}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{project.description || "No project description was recorded."}</p>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Project ID</dt><dd className="mt-1 font-mono">#{review.project_id}</dd></div>
            <div><dt className="text-muted">Owner</dt><dd className="mt-1 break-all font-mono text-xs">{project.owner || "—"}</dd></div>
            <div><dt className="text-muted">Review requester</dt><dd className="mt-1 break-all font-mono text-xs">{review.requester || "—"}</dd></div>
            <div><dt className="text-muted">Reviewed configuration</dt><dd className="mt-1 font-mono">v{review.config_version}</dd></div>
          </dl>
        </div>
        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Verification</p>
          <dl className="mt-4 grid gap-3 text-sm">
            <VerificationRow label="Contract" value={LASTCOMMIT_CONTRACT} copy />
            <VerificationRow label="Network" value={`GenLayer ${LASTCOMMIT_NETWORK}`} />
            <VerificationRow label="Review" value={`#${review.review_id}`} copy />
            <VerificationRow label="Status" value={review.status || "FINAL"} />
            <VerificationRow label="Loaded sources" value={`${review.loaded_source_count}`} />
            {!historicalOnly && project.last_review_timestamp > 0 ? <VerificationRow label="Recorded at" value={new Date(project.last_review_timestamp * 1000).toISOString()} /> : null}
            <VerificationRow label="Transaction" value="Not stored in review state" />
          </dl>
        </div>
      </section>

      {historicalOnly ? (
        <section className="mt-6 border border-amber/50 bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber">Current configuration differs</p>
          <p className="mt-3 text-sm leading-6 text-muted">This proof remains a durable historical record of configuration v{review.config_version}. The current project is at configuration v{project.config_version}; this historical result does not establish current succession eligibility.</p>
        </section>
      ) : null}

      <section className="mt-6 border border-line bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Evidence</p><h2 className="mt-2 text-2xl font-medium">Registered sources</h2></div><span className="font-mono text-xs text-muted">{review.loaded_source_count} loaded</span></div>
        <ul className="mt-4 grid gap-2">
          {sourceRows(review).map(([label, url]) => <li key={label} className="flex flex-col gap-2 border-b border-line py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"><span className="text-sm text-muted">{label}</span>{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-xs text-paper underline underline-offset-4">{url}</a> : <span className="font-mono text-xs text-muted">Not registered</span>}</li>)}
        </ul>
        <p className="mt-4 text-sm leading-6 text-muted">{review.evidence_summary || review.evaluated_sources || "The review did not record an evidence summary."}</p>
      </section>

      <section className="mt-6 border border-line bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Semantic dimensions</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Dimension label="Development" value={review.development_status} meaning="Meaningful project work" />
          <Dimension label="Maintenance" value={review.maintenance_status} meaning="Ongoing care and issue response" />
          <Dimension label="Infrastructure" value={review.infrastructure_status} meaning="Availability of public surfaces" />
          <Dimension label="Stewardship" value={review.stewardship_status} meaning="Credible human continuation" />
        </div>
      </section>

      <section className="mt-6 border border-line bg-surface p-5">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">Policy snapshot</p>
        <div className="mt-3 flex flex-wrap items-baseline gap-3"><h2 className="text-2xl font-medium">{review.policy_kind}</h2><span className="font-mono text-xs text-muted">configuration v{review.config_version}</span></div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{review.policy_text || "No policy snapshot was recorded."}</p>
        {review.succession_eligible && review.verdict === "ABANDONED" && currentReviewMatches ? <p className="mt-5 border-t border-line pt-4 text-sm text-moss">{project.succession_note || "Community maintainers may initiate a successor project."}</p> : null}
      </section>

      <div className="mt-8 flex flex-wrap gap-3"><Link to="/projects/$id" params={{ id: String(review.project_id) }} className="inline-flex min-h-10 items-center border border-line px-3 font-mono text-xs text-paper no-underline">View project</Link><Link to="/app" className="inline-flex min-h-10 items-center border border-line px-3 font-mono text-xs text-paper no-underline">Explore projects</Link></div>
    </main>
  );
}

function VerificationRow({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  return <div className="flex flex-col gap-2 border-b border-line pb-3 last:border-0 sm:flex-row sm:items-start sm:justify-between"><dt className="text-muted">{label}</dt><dd className="flex min-w-0 items-start gap-2 font-mono text-xs"><span className="break-all text-right">{value}</span>{copy ? <CopyValue value={value} /> : null}</dd></div>;
}

function Dimension({ label, value, meaning }: { label: string; value: string; meaning: string }) {
  return <article className="border border-line p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-medium">{label}</h3><span className="font-mono text-xs text-paper">{value || "UNKNOWN"}</span></div><p className="mt-2 text-sm text-muted">{meaning}</p></article>;
}

function ProofError({ reviewId, code, message }: { reviewId: string; code: string; message: string }) {
  const title = code === "NOT_FOUND" ? "Proof not found" : code === "INVALID_INPUT" ? "Invalid proof ID" : code === "RATE_LIMITED" ? "Proof temporarily unavailable" : "Proof unavailable";
  return <main className="mx-auto max-w-5xl px-4 py-12"><p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">LastCommit proof · {reviewId}</p><h1 className="mt-3 text-4xl font-medium">{title}</h1><p className="mt-3 max-w-xl text-muted">{message}</p><Link to="/app" className="mt-6 inline-flex min-h-11 items-center border border-line px-4 text-paper no-underline">Back to explorer</Link></main>;
}
