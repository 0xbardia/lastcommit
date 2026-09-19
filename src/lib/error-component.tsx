import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent(_props: ErrorComponentProps) {
  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-bg text-ink"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">LastCommit</p>
      <h1 className="text-2xl font-medium">This page could not load</h1>
      <p className="max-w-md text-sm text-muted">GenLayer Studio may be unavailable, or the requested record may not exist.</p>
      <Link to="/app" className="mt-2 inline-flex min-h-10 items-center border border-line px-4 font-mono text-xs text-paper no-underline">Back to explorer</Link>
    </main>
  );
}
