import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LASTCOMMIT_CONTRACT, LASTCOMMIT_SITE_URL } from "@/lib/contract-config";
import { listProjects, type ProjectView } from "@/lib/lastcommit";
import { VerdictBadge } from "@/components/verdict-badge";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "LastCommit Explorer" },
      { name: "description", content: "Explore contract-backed LastCommit project records and their latest semantic state." },
      { property: "og:title", content: "LastCommit Explorer" },
      { property: "og:description", content: "Explore contract-backed LastCommit project records and their latest semantic state." },
      { property: "og:url", content: `${LASTCOMMIT_SITE_URL}/app` },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `${LASTCOMMIT_SITE_URL}/og.svg` },
      { name: "twitter:title", content: "LastCommit Explorer" },
      { name: "twitter:description", content: "Explore contract-backed LastCommit project records and their latest semantic state." },
    ],
    links: [{ rel: "canonical", href: `${LASTCOMMIT_SITE_URL}/app` }],
  }),
  loader: () => listProjects({ data: { offset: 0, limit: 20 } }),
  component: AppPage,
});

type PageData = Awaited<ReturnType<typeof listProjects>>;

function AppPage() {
  const initial = Route.useLoaderData();
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<PageData>(initial);
  const [loading, setLoading] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    if (page === 0 && retryToken === 0) return;
    let active = true;
    setLoading(true);
    void listProjects({ data: { offset: page * 20, limit: 20 } }).then((next) => {
      if (active) setPageData(next);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [page, retryToken]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return pageData.projects.filter((project) => {
      const matchesStatus = status === "ALL" || project.latest_verdict === status;
      const matchesQuery = !needle || `${project.name} ${project.description} ${project.project_id}`.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [pageData.projects, query, status]);
  const totalPages = Math.max(1, Math.ceil(pageData.count / 20));
  const error = pageData.error;

  function changePage(next: number) {
    const target = Math.min(Math.max(0, next), totalPages - 1);
    setPage(target);
    if (target === 0) setPageData(initial);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">Explorer</p>
          <h1 className="mt-2 text-4xl font-medium">Registered projects</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Contract-backed project records and their latest semantic state. {pageData.count} project{pageData.count === 1 ? "" : "s"} on chain.
          </p>
        </div>
        <Link to="/projects/new" className="inline-flex min-h-11 items-center bg-paper px-4 text-bg no-underline">Register project</Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-3 border-y border-line py-4">
        <label className="grid min-w-52 flex-1 gap-1 text-xs text-muted" htmlFor="project-search">
          Search loaded projects
          <input id="project-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, description, ID" className="min-h-10 border border-line bg-bg px-3 text-ink" />
        </label>
        <label className="grid min-w-44 gap-1 text-xs text-muted" htmlFor="project-status">
          Status
          <select id="project-status" value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-10 border border-line bg-bg px-3 text-ink">
            <option value="ALL">All statuses</option>
            <option value="UNREVIEWED">Unreviewed</option>
            <option value="ACTIVE">Active</option>
            <option value="DORMANT">Dormant</option>
            <option value="ABANDONED">Abandoned</option>
            <option value="INSUFFICIENT_EVIDENCE">Insufficient evidence</option>
          </select>
        </label>
      </div>
      <p className="mt-4 break-all font-mono text-xs text-muted">Current contract: {LASTCOMMIT_CONTRACT}</p>
      {error ? (
        <section className="mt-6 border border-amber/50 bg-surface p-5" role="alert">
          <h2 className="font-medium">{error.code === "RATE_LIMITED" ? "Studio is busy" : "Explorer unavailable"}</h2>
          <p className="mt-2 text-sm text-muted">{error.message}</p>
          <button type="button" onClick={() => setRetryToken((value) => value + 1)} className="mt-4 min-h-10 border border-line px-3 font-mono text-xs text-paper">Retry current page</button>
        </section>
      ) : null}
      {loading ? <p className="mt-8 font-mono text-xs text-muted" aria-live="polite">Loading page {page + 1}…</p> : null}
      <ul className="mt-8 grid gap-3" aria-live="polite">
        {!loading && visible.length === 0 ? (
          <li className="border border-line bg-surface p-6 text-muted">{pageData.projects.length === 0 ? "No projects are registered on this page." : "No loaded projects match that search or status."}</li>
        ) : (
          visible.map((project) => <ProjectRow key={project.project_id} project={project} />)
        )}
      </ul>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="font-mono text-xs text-muted">Page {page + 1} of {totalPages}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => changePage(page - 1)} disabled={page === 0 || loading} className="min-h-10 border border-line px-3 font-mono text-xs text-paper disabled:opacity-40">Previous</button>
          <button type="button" onClick={() => changePage(page + 1)} disabled={page >= totalPages - 1 || loading} className="min-h-10 border border-line px-3 font-mono text-xs text-paper disabled:opacity-40">Next</button>
        </div>
      </div>
    </main>
  );
}

function ProjectRow({ project }: { project: ProjectView }) {
  return (
    <li className="border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/projects/$id" params={{ id: String(project.project_id) }} className="text-xl text-paper no-underline hover:underline">{project.name}</Link>
          <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>
        </div>
        <VerdictBadge verdict={project.latest_verdict} />
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted">
        <span>#{project.project_id}</span>
        <span>Config v{project.config_version}</span>
        <span>{project.created_review_count} review{project.created_review_count === 1 ? "" : "s"}</span>
        {project.succession_eligible ? <span className="text-moss">Succession eligible</span> : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/projects/$id" params={{ id: String(project.project_id) }} className="font-mono text-xs text-paper underline underline-offset-4">View project</Link>
        {project.latest_review_id > 0 ? <Link to="/proof/$reviewId" params={{ reviewId: String(project.latest_review_id) }} className="font-mono text-xs text-paper underline underline-offset-4">Latest proof</Link> : null}
      </div>
    </li>
  );
}
