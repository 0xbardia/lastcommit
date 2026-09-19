import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { WalletError, getPendingTransactions, startProjectReview, updateProject } from "@/lib/lastcommit-client";
import { getProject, type ProjectResult, type ProjectView, type ReviewView } from "@/lib/lastcommit";
import { validateProjectInput, type PolicyKind, type ProjectInput } from "@/lib/project-validation";
import { LASTCOMMIT_CONTRACT, LASTCOMMIT_NETWORK, LASTCOMMIT_SITE_URL } from "@/lib/contract-config";
import { useWallet } from "@/components/wallet";
import { VerdictBadge } from "@/components/verdict-badge";

export const Route = createFileRoute("/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `LastCommit Project #${params.id}` },
      { name: "description", content: "Inspect a contract-backed LastCommit project, its evidence, reviews, and succession state." },
      { property: "og:title", content: `LastCommit Project #${params.id}` },
      { property: "og:description", content: "Inspect a contract-backed LastCommit project, its evidence, reviews, and succession state." },
      { property: "og:url", content: `${LASTCOMMIT_SITE_URL}/projects/${encodeURIComponent(params.id)}` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${LASTCOMMIT_SITE_URL}/og.svg` },
      { name: "twitter:title", content: `LastCommit Project #${params.id}` },
      { name: "twitter:description", content: "Inspect a contract-backed LastCommit project, its evidence, reviews, and succession state." },
    ],
    links: [{ rel: "canonical", href: `${LASTCOMMIT_SITE_URL}/projects/${encodeURIComponent(params.id)}` }],
  }),
  loader: ({ params }) => getProject({ data: { id: params.id } }),
  component: ProjectPage,
});

function sourceRows(project: ProjectView) {
  return [
    ["GitHub", project.github_url],
    ["Website", project.website_url],
    ["Docs / governance", project.docs_url],
    ["Announcement", project.announcement_url],
  ] as const;
}

function SourceList({ project }: { project: ProjectView }) {
  return (
    <ul className="mt-4 grid gap-2">
      {sourceRows(project).map(([label, url]) => (
        <li key={label} className="flex flex-col gap-1 border-b border-line py-2 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <span className="text-muted">{label}</span>
          {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-xs text-paper underline underline-offset-4">{url}</a> : <span className="font-mono text-xs text-muted">Not registered</span>}
        </li>
      ))}
    </ul>
  );
}

function DimensionGrid({ review }: { review: ReviewView }) {
  const dimensions = [
    ["Development", review.development_status],
    ["Maintenance", review.maintenance_status],
    ["Infrastructure", review.infrastructure_status],
    ["Stewardship", review.stewardship_status],
  ];
  return (
    <dl className="mt-4 grid gap-2 sm:grid-cols-2">
      {dimensions.map(([label, value]) => (
        <div key={label} className="border border-line p-3">
          <dt className="text-sm text-muted">{label}</dt>
          <dd className="mt-2 font-mono text-sm text-paper">{value || "UNKNOWN"}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectPage() {
  const data = Route.useLoaderData() as ProjectResult;
  const { id } = Route.useParams();
  const router = useRouter();
  const { address, status: walletStatus } = useWallet();
  const [reviewPending, setReviewPending] = useState(false);
  const [phase, setPhase] = useState("");
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState(data.error?.message ?? "");
  const [editing, setEditing] = useState(false);
  const project = data.project;
  const missing = project.project_id === 0 || data.error?.code === "NOT_FOUND";
  const latest = data.latest;
  const hasReview = latest.review_id > 0;
  const currentReview = hasReview && data.currentReviewMatches;
  const pendingReview = getPendingTransactions().find((item) => item.projectId === project.project_id && item.method === "start_review");
  const isOwner = Boolean(address && project.owner && address.toLowerCase() === project.owner.toLowerCase());
  const effectiveEligibility = data.eligible && currentReview && latest.succession_eligible;
  const history = useMemo(() => [...data.history].reverse(), [data.history]);

  async function onReview() {
    if (reviewPending || missing) return;
    setError("");
    setReviewPending(true);
    setPhase(address ? "Awaiting wallet approval" : "Awaiting wallet");
    try {
      const result = await startProjectReview({
        projectId: project.project_id,
        expectedConfigVersion: project.config_version,
        expectedLatestReviewId: project.latest_review_id,
      }, (hash) => {
        setTxHash(hash);
        setPhase("Transaction submitted");
      });
      setTxHash(result.hash);
      setPhase("Finalized");
      await router.invalidate();
    } catch (value) {
      const transactionError = value instanceof WalletError ? value : null;
      if (transactionError?.hash) setTxHash(transactionError.hash);
      setError(value instanceof Error ? value.message : "Review failed.");
      setPhase(transactionError?.code === "RATE_LIMITED" || transactionError?.code === "TIMEOUT" ? "Pending recovery" : "");
    } finally {
      setReviewPending(false);
    }
  }

  if (missing) {
    const title = data.error?.code === "INVALID_INPUT"
      ? "Invalid project ID"
      : data.error?.code === "NOT_FOUND" || !data.error
        ? "Project not found"
        : "Project temporarily unavailable";
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">Project {id}</p>
        <h1 className="mt-3 text-4xl font-medium">{title}</h1>
        <p className="mt-3 max-w-xl text-muted">{data.error?.message ?? "This project is not registered on the current contract."}</p>
        <Link to="/app" className="mt-6 inline-flex min-h-11 items-center border border-line px-4 text-paper no-underline">Back to explorer</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">Project {project.project_id}</p>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl font-medium">{project.name}</h1>
          <p className="mt-3 max-w-2xl text-muted">{project.description}</p>
        </div>
        <VerdictBadge verdict={project.latest_verdict} />
      </div>

      <section className="mt-8 border border-line bg-surface p-5" aria-labelledby="current-project-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="current-project-heading" className="text-xl font-medium">Current project</h2>
          <span className="font-mono text-xs text-muted">Config v{project.config_version}</span>
        </div>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Owner</dt><dd className="mt-1 break-all font-mono text-xs">{project.owner}</dd></div>
          <div><dt className="text-muted">Connected wallet</dt><dd className="mt-1 break-all font-mono text-xs">{address || "Not connected"}</dd></div>
          <div><dt className="text-muted">Ownership</dt><dd className="mt-1">{isOwner ? "You can update this project." : "Read-only for this wallet."}</dd></div>
          <div><dt className="text-muted">Network</dt><dd className="mt-1 font-mono text-xs">GenLayer {LASTCOMMIT_NETWORK}</dd></div>
        </dl>
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="font-medium">Registered evidence</h3>
          <SourceList project={project} />
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="font-medium">Current policy</h3>
          <p className="mt-1 font-mono text-xs text-muted">{project.policy_kind} · configuration {project.config_version}</p>
          <p className="mt-3 text-sm leading-6 text-muted">{project.policy_text}</p>
        </div>
        {isOwner ? <ProjectEditor project={project} open={editing} onOpenChange={setEditing} onSaved={() => void router.invalidate()} onError={setError} onHash={setTxHash} /> : null}
      </section>

      <section className="mt-6 border border-line bg-surface p-5" aria-labelledby="latest-review-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="latest-review-heading" className="text-xl font-medium">Latest review</h2>
          {hasReview ? <span className="font-mono text-xs text-muted">Review #{latest.review_id}</span> : null}
        </div>
        {!hasReview ? (
          <p className="mt-3 text-muted">No review has been finalized for this project configuration.</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3"><VerdictBadge verdict={currentReview ? latest.verdict : "UNREVIEWED"} /><span className="font-mono text-xs text-muted">Reviewed config v{latest.config_version}</span></div>
            {!currentReview ? <p className="mt-4 border border-amber/50 px-3 py-3 text-sm text-amber">This is a historical review snapshot. The current project configuration changed after it was finalized.</p> : null}
            <DimensionGrid review={latest} />
            <p className="mt-4 text-sm leading-6 text-muted">{latest.summary || "No summary was recorded."}</p>
            {currentReview && effectiveEligibility ? <p className="mt-4 font-mono text-xs tracking-wide text-moss">SUCCESSION ELIGIBLE</p> : null}
            <Link to="/proof/$reviewId" params={{ reviewId: String(latest.review_id) }} className="mt-5 inline-flex min-h-10 items-center border border-line px-3 font-mono text-xs text-paper no-underline">Open proof artifact</Link>
          </>
        )}
      </section>

      <section className="mt-6 border border-line bg-surface p-5" aria-labelledby="review-history-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><h2 id="review-history-heading" className="text-xl font-medium">Review history</h2><span className="font-mono text-xs text-muted">{project.created_review_count} total</span></div>
        {history.length === 0 ? <p className="mt-3 text-sm text-muted">No historical reviews yet.</p> : (
          <ol className="mt-4 grid gap-2">
            {history.map((review) => (
              <li key={review.review_id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3">
                <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs text-muted">#{review.review_id}</span><VerdictBadge verdict={review.verdict} /><span className="font-mono text-xs text-muted">config v{review.config_version}</span></div>
                <Link to="/proof/$reviewId" params={{ reviewId: String(review.review_id) }} className="font-mono text-xs text-paper underline underline-offset-4">View proof</Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-6 border border-line bg-surface p-5" aria-labelledby="review-action-heading">
        <h2 id="review-action-heading" className="text-xl font-medium">Start a public review</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Your connected wallet signs this request. GenLayer will evaluate the registered evidence under current configuration v{project.config_version}; finalization may take several minutes. The transaction hash remains visible while it is pending.</p>
        {walletStatus === "wrong-network" ? <p className="mt-3 text-sm text-amber">Switch to GenLayer Studionet before signing.</p> : null}
        {pendingReview ? <p className="mt-3 break-all font-mono text-xs text-amber" role="status">Review transaction pending: {pendingReview.hash}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void onReview()} disabled={reviewPending || Boolean(pendingReview)} className="min-h-11 bg-paper px-4 text-bg disabled:opacity-60">{reviewPending ? phase || "Evaluating evidence…" : pendingReview ? "Review pending" : address ? "Start review" : "Connect wallet to review"}</button>{txHash ? <span className="flex max-w-full items-center break-all font-mono text-xs text-muted">tx {txHash}</span> : null}</div>
        {phase ? <p className="mt-3 font-mono text-xs text-amber" aria-live="polite">{phase}</p> : null}
        {error && error !== data.error?.message ? <p className="mt-3 text-sm text-abandon" role="alert">{error}</p> : null}
      </section>

      <p className="mt-6 break-all font-mono text-xs text-muted">Contract {LASTCOMMIT_CONTRACT}</p>
    </main>
  );
}

function ProjectEditor({ project, open, onOpenChange, onSaved, onError, onHash }: { project: ProjectView; open: boolean; onOpenChange: (open: boolean) => void; onSaved: () => void; onError: (message: string) => void; onHash: (hash: string) => void }) {
  const [pending, setPending] = useState(false);
  const [policyKind, setPolicyKind] = useState<PolicyKind>((project.policy_kind as PolicyKind) || "STANDARD");
  function readForm(form: HTMLFormElement): ProjectInput {
    const formData = new FormData(form);
    const value = (name: string) => String(formData.get(name) ?? "");
    return { name: value("name"), description: value("description"), github_url: value("github_url"), website_url: value("website_url"), docs_url: value("docs_url"), announcement_url: value("announcement_url"), policy_kind: value("policy_kind") as PolicyKind, custom_policy: value("custom_policy"), succession_note: value("succession_note") };
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = readForm(event.currentTarget);
    const errors = validateProjectInput(input);
    const first = Object.values(errors)[0];
    if (first) { onError(first); return; }
    setPending(true);
    onError("");
    try {
      await updateProject({ ...input, projectId: project.project_id, expectedConfigVersion: project.config_version }, onHash);
      onOpenChange(false);
      onSaved();
    } catch (value) {
      onError(value instanceof Error ? value.message : "Project update failed.");
    } finally {
      setPending(false);
    }
  }
  return (
    <details className="mt-5 border-t border-line pt-4" open={open} onToggle={(event) => onOpenChange(event.currentTarget.open)}>
      <summary className="cursor-pointer font-mono text-xs uppercase tracking-wide text-paper">Owner controls · update configuration</summary>
      <form className="mt-4 grid gap-3" onSubmit={submit} noValidate>
        <label className="grid gap-1 text-sm text-muted" htmlFor="edit-project-name">Name<input id="edit-project-name" name="name" defaultValue={project.name} maxLength={80} className="min-h-10 border border-line bg-bg px-3 text-ink" /></label>
        <label className="grid gap-1 text-sm text-muted" htmlFor="edit-project-description">Description<textarea id="edit-project-description" name="description" defaultValue={project.description} maxLength={500} rows={3} className="border border-line bg-bg px-3 py-2 text-ink" /></label>
        <label className="grid gap-1 text-sm text-muted" htmlFor="edit-project-github">GitHub repository<input id="edit-project-github" name="github_url" defaultValue={project.github_url} className="min-h-10 border border-line bg-bg px-3 text-ink" /></label>
        {(["website_url", "docs_url", "announcement_url"] as const).map((name) => <label key={name} className="grid gap-1 text-sm text-muted" htmlFor={`edit-project-${name}`}>{name.replace("_url", "")}<input id={`edit-project-${name}`} name={name} defaultValue={project[name]} className="min-h-10 border border-line bg-bg px-3 text-ink" /></label>)}
        <label className="grid gap-1 text-sm text-muted" htmlFor="edit-project-policy">Policy<select id="edit-project-policy" name="policy_kind" value={policyKind} onChange={(event) => setPolicyKind(event.target.value as PolicyKind)} className="min-h-10 border border-line bg-bg px-3 text-ink"><option value="STANDARD">STANDARD</option><option value="STRICT">STRICT</option><option value="CUSTOM">CUSTOM</option></select></label>
        <label className="grid gap-1 text-sm text-muted" htmlFor="edit-project-custom">Custom policy<textarea id="edit-project-custom" name="custom_policy" defaultValue={policyKind === "CUSTOM" ? project.policy_text : ""} maxLength={800} rows={3} className="border border-line bg-bg px-3 py-2 text-ink" /></label>
        <label className="grid gap-1 text-sm text-muted" htmlFor="edit-project-note">Succession note<input id="edit-project-note" name="succession_note" defaultValue={project.succession_note} maxLength={400} className="min-h-10 border border-line bg-bg px-3 text-ink" /></label>
        <button type="submit" disabled={pending} className="min-h-10 border border-line px-3 font-mono text-xs text-paper disabled:opacity-50">{pending ? "Submitting update…" : "Update project"}</button>
      </form>
    </details>
  );
}
