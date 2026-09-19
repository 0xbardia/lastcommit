import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LASTCOMMIT_CONTRACT } from "./contract-config";

export type ErrorCode =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "RPC_UNAVAILABLE"
  | "INVALID_INPUT"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";

export type SafeError = { code: ErrorCode; message: string };

export type ProjectView = {
  project_id: number;
  name: string;
  description: string;
  owner: string;
  github_url: string;
  website_url: string;
  docs_url: string;
  announcement_url: string;
  policy_kind: string;
  policy_text: string;
  config_version: number;
  succession_note: string;
  created_review_count: number;
  latest_review_id: number;
  last_review_timestamp: number;
  latest_verdict: string;
  succession_eligible: boolean;
};

export type ReviewView = {
  review_id: number;
  project_id: number;
  requester: string;
  verdict: string;
  summary: string;
  development_status: string;
  maintenance_status: string;
  infrastructure_status: string;
  stewardship_status: string;
  evidence_summary: string;
  evaluated_sources: string;
  loaded_source_count: number;
  policy_kind: string;
  policy_text: string;
  config_version: number;
  github_url: string;
  website_url: string;
  docs_url: string;
  announcement_url: string;
  succession_eligible: boolean;
  status: string;
};

export type ProjectResult = {
  project: ProjectView;
  status: string;
  eligible: boolean;
  latest: ReviewView;
  history: ReviewView[];
  reviewIds: number[];
  currentReviewMatches: boolean;
  error: SafeError | null;
};

export type ReviewResult = {
  review: ReviewView;
  project: ProjectView;
  currentReviewMatches: boolean;
  error: SafeError | null;
};

export const RATE_LIMIT_MESSAGE =
  "GenLayer Studio is temporarily rate limited. Try again shortly.";

const cache = new Map<string, { at: number; value: unknown }>();
const CACHE_MS = 20_000;
const MAX_ID = 1_000_000_000;
const MAX_PAGE_SIZE = 20;

function emptyProject(): ProjectView {
  return {
    project_id: 0,
    name: "",
    description: "",
    owner: "",
    github_url: "",
    website_url: "",
    docs_url: "",
    announcement_url: "",
    policy_kind: "",
    policy_text: "",
    config_version: 0,
    succession_note: "",
    created_review_count: 0,
    latest_review_id: 0,
    last_review_timestamp: 0,
    latest_verdict: "UNKNOWN",
    succession_eligible: false,
  };
}

function emptyReview(): ReviewView {
  return {
    review_id: 0,
    project_id: 0,
    requester: "",
    verdict: "",
    summary: "",
    development_status: "",
    maintenance_status: "",
    infrastructure_status: "",
    stewardship_status: "",
    evidence_summary: "",
    evaluated_sources: "",
    loaded_source_count: 0,
    policy_kind: "",
    policy_text: "",
    config_version: 0,
    github_url: "",
    website_url: "",
    docs_url: "",
    announcement_url: "",
    succession_eligible: false,
    status: "NONE",
  };
}

function toNum(value: unknown): number {
  const number =
    typeof value === "bigint"
      ? Number(value)
      : typeof value === "number"
        ? value
        : typeof value === "string" && value.trim() !== ""
          ? Number(value)
          : 0;
  return Number.isFinite(number) ? number : 0;
}

function asProject(raw: unknown): ProjectView {
  const value = (raw ?? {}) as Record<string, unknown>;
  return {
    project_id: toNum(value.project_id),
    name: String(value.name ?? ""),
    description: String(value.description ?? ""),
    owner: String(value.owner ?? ""),
    github_url: String(value.github_url ?? ""),
    website_url: String(value.website_url ?? ""),
    docs_url: String(value.docs_url ?? ""),
    announcement_url: String(value.announcement_url ?? ""),
    policy_kind: String(value.policy_kind ?? ""),
    policy_text: String(value.policy_text ?? ""),
    config_version: toNum(value.config_version ?? value.policy_version),
    succession_note: String(value.succession_note ?? ""),
    created_review_count: toNum(value.created_review_count),
    latest_review_id: toNum(value.latest_review_id),
    last_review_timestamp: toNum(value.last_review_timestamp),
    latest_verdict: String(value.latest_verdict ?? "UNKNOWN"),
    succession_eligible: Boolean(value.succession_eligible),
  };
}

function asReview(raw: unknown): ReviewView {
  const value = (raw ?? {}) as Record<string, unknown>;
  return {
    review_id: toNum(value.review_id),
    project_id: toNum(value.project_id),
    requester: String(value.requester ?? ""),
    verdict: String(value.verdict ?? ""),
    summary: String(value.summary ?? ""),
    development_status: String(value.development_status ?? ""),
    maintenance_status: String(value.maintenance_status ?? ""),
    infrastructure_status: String(value.infrastructure_status ?? ""),
    stewardship_status: String(value.stewardship_status ?? ""),
    evidence_summary: String(value.evidence_summary ?? ""),
    evaluated_sources: String(value.evaluated_sources ?? ""),
    loaded_source_count: toNum(value.loaded_source_count),
    policy_kind: String(value.policy_kind ?? ""),
    policy_text: String(value.policy_text ?? ""),
    config_version: toNum(value.config_version ?? value.policy_version),
    github_url: String(value.github_url ?? ""),
    website_url: String(value.website_url ?? ""),
    docs_url: String(value.docs_url ?? ""),
    announcement_url: String(value.announcement_url ?? ""),
    succession_eligible: Boolean(value.succession_eligible),
    status: String(value.status ?? ""),
  };
}

async function client() {
  const { createClient } = await import("genlayer-js");
  const { studionet } = await import("genlayer-js/chains");
  return createClient({ chain: studionet });
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isRateLimited(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  return message.includes("429") || message.includes("rate limit") || message.includes("too many requests");
}

function isTimeout(error: unknown): boolean {
  const message = errorText(error).toLowerCase();
  return message.includes("timeout") || message.includes("timed out") || message.includes("deadline");
}

function mapError(error: unknown, fallback: ErrorCode = "RPC_UNAVAILABLE"): SafeError {
  const message = errorText(error).toLowerCase();
  if (isRateLimited(error)) return { code: "RATE_LIMITED", message: RATE_LIMIT_MESSAGE };
  if (isTimeout(error)) return { code: "TIMEOUT", message: "GenLayer Studio took too long to respond. Try again." };
  if (message.includes("unknown project") || message.includes("unknown review") || message.includes("not found")) {
    return { code: "NOT_FOUND", message: "That record is not available on the current contract." };
  }
  if (message.includes("invalid") || message.includes("malformed") || message.includes("nan")) {
    return { code: "INVALID_INPUT", message: "The request could not be validated." };
  }
  return {
    code: fallback,
    message:
      fallback === "UNKNOWN_ERROR"
        ? "The contract returned an unexpected response."
        : "GenLayer Studio is unavailable right now. Try again shortly.",
  };
}

async function read(functionName: string, args: unknown[] = [], options: { fresh?: boolean } = {}) {
  const key = JSON.stringify([functionName, args]);
  if (!options.fresh) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  }
  const contractClient = await client();
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const value = await contractClient.readContract({
        address: LASTCOMMIT_CONTRACT,
        functionName,
        args: args as never,
      } as never);
      cache.set(key, { at: Date.now(), value });
      return value;
    } catch (error) {
      lastError = error;
      if (!isRateLimited(error) || attempt === 1) break;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastError;
}

async function readMany<T>(values: number[], readOne: (value: number) => Promise<T>): Promise<T[]> {
  const result: T[] = [];
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      result[index] = await readOne(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(4, values.length) }, () => worker()));
  return result;
}

function validId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= MAX_ID;
}

function parseId(value: unknown): number | null {
  const id = typeof value === "number" ? value : Number(value);
  return validId(id) ? id : null;
}

const idInput = z.object({ id: z.unknown() }).optional();
const listInput = z.object({ offset: z.unknown().optional(), limit: z.unknown().optional() }).optional();

function readIdInput(data: unknown): number | null {
  const parsed = idInput.safeParse(data);
  return parsed.success ? parseId(parsed.data?.id) : null;
}

function readPageInput(data: unknown): { offset: number; limit: number } {
  const parsed = listInput.safeParse(data);
  const offset = parsed.success ? Math.max(0, Math.floor(Number(parsed.data?.offset ?? 0))) : 0;
  const limit = parsed.success ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(parsed.data?.limit ?? MAX_PAGE_SIZE)))) : MAX_PAGE_SIZE;
  return { offset: Number.isFinite(offset) ? offset : 0, limit: Number.isFinite(limit) ? limit : MAX_PAGE_SIZE };
}

export const getHealth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [projects, reviews] = await Promise.all([read("get_project_count"), read("get_review_count")]);
    return {
      ok: true,
      contract: LASTCOMMIT_CONTRACT,
      project_count: toNum(projects),
      review_count: toNum(reviews),
      error: null as SafeError | null,
    };
  } catch (error) {
    return { ok: false, contract: LASTCOMMIT_CONTRACT, project_count: 0, review_count: 0, error: mapError(error) };
  }
});

export const invalidateLastCommitCache = createServerFn({ method: "POST" }).handler(() => {
  cache.clear();
  return { ok: true };
});

export const listProjects = createServerFn({ method: "GET" })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { offset, limit } = readPageInput(data);
    try {
      const count = toNum(await read("get_project_count"));
      const first = Math.min(offset, count);
      const ids = Array.from({ length: Math.min(limit, Math.max(0, count - first)) }, (_, index) => first + index + 1);
      const outcomes = await Promise.allSettled(ids.map((id) => read("get_project", [id])));
      const projects: ProjectView[] = [];
      let firstError: SafeError | null = null;
      outcomes.forEach((outcome) => {
        if (outcome.status === "fulfilled") {
          const project = asProject(outcome.value);
          if (project.project_id > 0) projects.push(project);
        } else if (!firstError) {
          firstError = mapError(outcome.reason);
        }
      });
      return { count, offset, limit, projects, error: firstError };
    } catch (error) {
      return { count: 0, offset, limit, projects: [] as ProjectView[], error: mapError(error) };
    }
  });

export const getProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ProjectResult> => {
    const id = readIdInput(data);
    if (id === null) {
      return {
        project: emptyProject(),
        status: "UNKNOWN",
        eligible: false,
        latest: emptyReview(),
        history: [],
        reviewIds: [],
        currentReviewMatches: false,
        error: { code: "INVALID_INPUT", message: "Project IDs must be positive integers." },
      };
    }
    try {
      const [projectRaw, latestRaw, eligibleRaw, reviewIdsRaw] = await Promise.all([
        read("get_project", [id]),
        read("get_latest_review", [id]),
        read("is_succession_eligible", [id]),
        read("get_project_reviews", [id, 0, MAX_PAGE_SIZE]),
      ]);
      const project = asProject(projectRaw);
      if (project.project_id === 0) {
        return {
          project: emptyProject(),
          status: "UNKNOWN",
          eligible: false,
          latest: emptyReview(),
          history: [],
          reviewIds: [],
          currentReviewMatches: false,
          error: { code: "NOT_FOUND", message: "That project is not registered on the current contract." },
        };
      }
      const latest = asReview(latestRaw);
      const reviewIds = Array.isArray(reviewIdsRaw) ? reviewIdsRaw.map(toNum).filter((reviewId) => reviewId > 0) : [];
      const history = await readMany(reviewIds, async (reviewId) => asReview(await read("get_review", [reviewId])));
      const currentReviewMatches =
        latest.review_id > 0 && latest.config_version === project.config_version && latest.project_id === project.project_id;
      return {
        project,
        status: project.latest_verdict,
        eligible: Boolean(eligibleRaw),
        latest,
        history,
        reviewIds,
        currentReviewMatches,
        error: null,
      };
    } catch (error) {
      return {
        project: emptyProject(),
        status: "UNKNOWN",
        eligible: false,
        latest: emptyReview(),
        history: [],
        reviewIds: [],
        currentReviewMatches: false,
        error: mapError(error),
      };
    }
  });

export const getReview = createServerFn({ method: "POST" })
  .validator((data: unknown) => data)
  .handler(async ({ data }): Promise<ReviewResult> => {
    const id = readIdInput(data);
    if (id === null) {
      return {
        review: emptyReview(),
        project: emptyProject(),
        currentReviewMatches: false,
        error: { code: "INVALID_INPUT", message: "Review IDs must be positive integers." },
      };
    }
    try {
      const review = asReview(await read("get_review", [id]));
      if (review.review_id === 0) {
        return {
          review: emptyReview(),
          project: emptyProject(),
          currentReviewMatches: false,
          error: { code: "NOT_FOUND", message: "That proof does not exist on the current contract." },
        };
      }
      const [project, eligible] = await Promise.all([
        read("get_project", [review.project_id]).then(asProject),
        read("is_succession_eligible", [review.project_id]),
      ]);
      const currentReviewMatches =
        project.project_id > 0 && review.config_version === project.config_version && project.latest_review_id === review.review_id;
      return {
        review: { ...review, succession_eligible: review.succession_eligible && Boolean(eligible) },
        project,
        currentReviewMatches,
        error: project.project_id > 0 ? null : { code: "NOT_FOUND", message: "The proof's project is not available." },
      };
    } catch (error) {
      return { review: emptyReview(), project: emptyProject(), currentReviewMatches: false, error: mapError(error) };
    }
  });
