export type PolicyKind = "STANDARD" | "STRICT" | "CUSTOM";

export type ProjectInput = {
  name: string;
  description: string;
  github_url: string;
  website_url: string;
  docs_url: string;
  announcement_url: string;
  policy_kind: PolicyKind;
  custom_policy: string;
  succession_note: string;
};

const MAX = {
  name: 80,
  description: 500,
  url: 256,
  custom_policy: 800,
  succession_note: 400,
};

export function validateHttpsUrl(value: string, required = false): string {
  const text = value.trim();
  if (!text) return required ? "This URL is required." : "";
  if (text.length > MAX.url) return `Use ${MAX.url} characters or fewer.`;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") return "Use an HTTPS URL.";
    if (url.username || url.password || url.port) return "URLs with credentials or explicit ports are not supported.";
    const hostname = url.hostname.toLowerCase();
    if (
      !hostname ||
      hostname.includes(":") ||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      /^\d+$/.test(hostname) ||
      /^0x[0-9a-f]+$/i.test(hostname)
    ) return "Use a public hostname, not an IP literal.";
    if (hostname.split(".").length < 2 || /^(localhost|.*\.(local|internal))$/i.test(hostname)) {
      return "Use a public hostname.";
    }
    return "";
  } catch {
    return "Enter a valid URL.";
  }
}

export function validateGithubUrl(value: string): string {
  const error = validateHttpsUrl(value, true);
  if (error) return error;
  try {
    const url = new URL(value.trim());
    if (url.hostname.toLowerCase() !== "github.com" && url.hostname.toLowerCase() !== "www.github.com") {
      return "Use a repository URL on github.com.";
    }
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length >= 2 ? "" : "Enter a GitHub repository URL.";
  } catch {
    return "Enter a valid GitHub repository URL.";
  }
}

export function validateProjectInput(input: ProjectInput): Partial<Record<keyof ProjectInput, string>> {
  const errors: Partial<Record<keyof ProjectInput, string>> = {};
  if (!input.name.trim()) errors.name = "Project name is required.";
  else if (input.name.trim().length > MAX.name) errors.name = `Use ${MAX.name} characters or fewer.`;
  if (!input.description.trim()) errors.description = "Description is required.";
  else if (input.description.trim().length > MAX.description) errors.description = `Use ${MAX.description} characters or fewer.`;
  const githubError = validateGithubUrl(input.github_url);
  if (githubError) errors.github_url = githubError;
  for (const field of ["website_url", "docs_url", "announcement_url"] as const) {
    const error = validateHttpsUrl(input[field]);
    if (error) errors[field] = error;
  }
  if (input.policy_kind === "CUSTOM" && !input.custom_policy.trim()) errors.custom_policy = "Custom policy text is required.";
  if (input.custom_policy.trim().length > MAX.custom_policy) errors.custom_policy = `Use ${MAX.custom_policy} characters or fewer.`;
  if (input.succession_note.trim().length > MAX.succession_note) errors.succession_note = `Use ${MAX.succession_note} characters or fewer.`;
  return errors;
}
