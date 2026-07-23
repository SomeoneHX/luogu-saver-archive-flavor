import type {
  ApiJudgementLogs,
  ApiJudgementRecord,
  ApiJudgementStats,
} from "@/types/api";

const JUDGEMENT_API_BASE =
  import.meta.env.VITE_JUDGEMENT_API_URL || "https://jdmt.luogu.me";

interface JudgementEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function fetchJudgement<T>(path: string): Promise<T> {
  const res = await fetch(`${JUDGEMENT_API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  let json: JudgementEnvelope<T> | null = null;
  try {
    json = (await res.json()) as JudgementEnvelope<T>;
  } catch {
    throw new Error(`请求失败（${res.status}）`);
  }
  if (!json?.success || !json.data) {
    throw new Error(json?.message || `请求失败（${res.status}）`);
  }
  return json.data;
}

async function fetchJudgementEnvelope<T>(path: string): Promise<T> {
  const res = await fetch(`${JUDGEMENT_API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  let json: T & JudgementEnvelope<unknown> | null = null;
  try {
    json = (await res.json()) as T & JudgementEnvelope<unknown>;
  } catch {
    throw new Error(`请求失败（${res.status}）`);
  }
  if (!json?.success) {
    throw new Error(json?.message || `请求失败（${res.status}）`);
  }
  return json;
}

export interface JudgementQuery {
  page?: number;
  limit?: number;
  uid?: number;
  name?: string;
  revPerm?: number[];
  addPerm?: number[];
  noPerm?: boolean;
}

function buildQuery(params: JudgementQuery): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set("page", String(params.page));
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.uid) sp.set("uid", String(params.uid));
  if (params.name) sp.set("name", params.name);
  if (params.revPerm?.length) sp.set("rev_perm", params.revPerm.join(","));
  if (params.addPerm?.length) sp.set("add_perm", params.addPerm.join(","));
  if (params.noPerm) sp.set("no_perm", "1");
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function getJudgements(params: JudgementQuery = {}) {
  return fetchJudgementEnvelope<{
    data: ApiJudgementRecord[];
    pagination: { page: number; limit: number; total: number; total_pages: number };
  }>(`/judgement${buildQuery(params)}`).then((res) => ({
    records: res.data,
    page: res.pagination.page,
    limit: res.pagination.limit,
    total: res.pagination.total,
    totalPages: res.pagination.total_pages,
  }));
}

export function getJudgementStats(): Promise<ApiJudgementStats> {
  return fetchJudgement<Record<string, number>>("/api/stats").then((raw) => ({
    totalRecords: raw.total_judgements ?? raw.totalRecords ?? raw.total ?? 0,
    totalFetches: raw.total_fetch_logs ?? raw.totalFetches ?? raw.fetches ?? 0,
  }));
}

export function getJudgementLogs(page = 1, limit = 50) {
  return fetchJudgement<ApiJudgementLogs>(
    `/api/logs?page=${page}&limit=${limit}`,
  );
}
