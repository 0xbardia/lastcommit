import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { WalletError, getPendingTransactions, registerProject } from "@/lib/lastcommit-client";
import { validateProjectInput, type PolicyKind, type ProjectInput } from "@/lib/project-validation";
import { useWallet } from "@/components/wallet";

export const Route = createFileRoute("/projects/new")({ component: RegisterPage });

const fields: Array<{ name: keyof ProjectInput; label: string; kind?: "textarea" | "select"; required?: boolean }> = [
  { name: "name", label: "Name", required: true },
  { name: "description", label: "Description", kind: "textarea", required: true },
  { name: "github_url", label: "GitHub repository", required: true },
  { name: "website_url", label: "Website URL" },
  { name: "docs_url", label: "Docs / governance URL" },
  { name: "announcement_url", label: "Announcement URL" },
  { name: "succession_note", label: "Succession note" },
];

function valuesFrom(form: HTMLFormElement): ProjectInput {
  const value = (name: keyof ProjectInput) => String(new FormData(form).get(name) ?? "");
  return {
    name: value("name"),
    description: value("description"),
    github_url: value("github_url"),
    website_url: value("website_url"),
    docs_url: value("docs_url"),
    announcement_url: value("announcement_url"),
    policy_kind: value("policy_kind") as PolicyKind,
    custom_policy: value("custom_policy"),
    succession_note: value("succession_note"),
  };
}

function RegisterPage() {
  const navigate = useNavigate();
  const { address, status: walletStatus } = useWallet();
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectInput, string>>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState("");
  const [txHash, setTxHash] = useState("");
  const [policyKind, setPolicyKind] = useState<PolicyKind>("STANDARD");
  const recovered = getPendingTransactions().find((item) => item.method === "register_project");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = valuesFrom(event.currentTarget);
    const nextErrors = validateProjectInput(input);
    setErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length > 0) return;
    setPending(true);
    setPhase(address ? "Awaiting wallet approval" : "Awaiting wallet");
    try {
      const result = await registerProject(input, (hash) => {
        setTxHash(hash);
        setPhase("Transaction submitted");
      });
      setPhase("Finalized");
      await navigate({ to: "/projects/$id", params: { id: String(result.id) } });
    } catch (value) {
      const transactionError = value instanceof WalletError ? value : null;
      if (transactionError?.hash) setTxHash(transactionError.hash);
      setError(value instanceof Error ? value.message : "Registration failed.");
      setPhase(transactionError?.code === "RATE_LIMITED" || transactionError?.code === "TIMEOUT" ? "Pending recovery" : "");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-rust">Register</p>
      <h1 className="mt-2 text-4xl font-medium">Register a project</h1>
      <p className="mt-3 max-w-xl text-muted">
        Register the evidence and policy LastCommit will evaluate. The project will be owned by the connected wallet.
      </p>
      <section className="mt-6 border border-line bg-surface p-4 text-sm" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Ownership</p>
        {address ? (
          <p className="mt-2 break-all text-muted">Connected wallet: <span className="font-mono text-paper">{address}</span></p>
        ) : (
          <p className="mt-2 text-muted">Connect a wallet on GenLayer Studionet before submitting. No private key enters LastCommit.</p>
        )}
        {walletStatus === "wrong-network" ? <p className="mt-2 text-amber">Switch the connected wallet to GenLayer Studionet.</p> : null}
      </section>
      {recovered ? (
        <p className="mt-4 border border-amber/50 px-4 py-3 text-sm text-amber" role="status">
          A registration transaction is still being tracked after a refresh: <span className="break-all font-mono text-xs">{recovered.hash}</span>
        </p>
      ) : null}
      <form className="mt-8 grid max-w-xl gap-4" onSubmit={onSubmit} noValidate>
        {fields.map((field) => {
          const message = errors[field.name];
          const id = `project-${field.name}`;
          const helpId = `${id}-error`;
          return (
            <label key={field.name} className="grid gap-1 text-sm text-muted" htmlFor={id}>
              {field.label}{field.required ? " *" : ""}
              {field.kind === "textarea" ? (
                <textarea id={id} name={field.name} required={field.required} maxLength={field.name === "description" ? 500 : undefined} rows={4} aria-invalid={Boolean(message)} aria-describedby={message ? helpId : undefined} className="border border-line bg-bg px-3 py-2 text-ink" />
              ) : (
                <input id={id} name={field.name} required={field.required} type={field.name.endsWith("url") ? "url" : "text"} maxLength={field.name === "name" ? 80 : field.name === "succession_note" ? 400 : 256} aria-invalid={Boolean(message)} aria-describedby={message ? helpId : undefined} className="min-h-11 border border-line bg-bg px-3 text-ink" />
              )}
              {message ? <span id={helpId} className="text-xs text-abandon">{message}</span> : null}
            </label>
          );
        })}
        <label className="grid gap-1 text-sm text-muted" htmlFor="project-policy-kind">
          Policy *
          <select id="project-policy-kind" name="policy_kind" value={policyKind} onChange={(event) => setPolicyKind(event.target.value as PolicyKind)} className="min-h-11 border border-line bg-bg px-3 text-ink">
            <option value="STANDARD">STANDARD</option>
            <option value="STRICT">STRICT</option>
            <option value="CUSTOM">CUSTOM</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm text-muted" htmlFor="project-custom-policy">
          Custom policy {policyKind === "CUSTOM" ? "*" : "(optional)"}
          <textarea id="project-custom-policy" name="custom_policy" maxLength={800} rows={3} aria-invalid={Boolean(errors.custom_policy)} aria-describedby={errors.custom_policy ? "project-custom-policy-error" : undefined} className="border border-line bg-bg px-3 py-2 text-ink" />
          {errors.custom_policy ? <span id="project-custom-policy-error" className="text-xs text-abandon">{errors.custom_policy}</span> : null}
        </label>
        <button type="submit" disabled={pending || Boolean(recovered)} className="min-h-11 bg-paper px-4 text-bg disabled:opacity-60">
          {pending ? phase || "Submitting…" : recovered ? "Registration pending" : address ? "Register with connected wallet" : "Connect wallet to register"}
        </button>
        {phase ? <p className="font-mono text-xs text-amber" aria-live="polite">{phase}</p> : null}
        {txHash ? <p className="break-all font-mono text-xs text-muted">Transaction: {txHash}</p> : null}
        {error ? <p role="alert" className="text-abandon">{error}</p> : null}
      </form>
    </main>
  );
}
