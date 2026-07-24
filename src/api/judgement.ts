import type {
  ApiJudgementLogs,
  ApiJudgementRecord,
  ApiJudgementStats,
} from "@/types/api";

const JUDGEMENT_API_BASE =
  import.meta.env.VITE_JUDGEMENT_API_URL || "https://jdmt.luogu.me";

interface JudgementEnvelope<T> {
  code: number;
  message?: string;
  data: T;
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
  if (json?.code !== 200 || !json.data) {
    throw new Error(json?.message || `请求失败（${res.status}）`);
  }
  return json.data;
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
  return fetchJudgement<{
    items: ApiJudgementRecord[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>(`/judgement${buildQuery(params)}`).then((res) => ({
    records: res.items,
    page: res.pagination.page,
    limit: res.pagination.limit,
    total: res.pagination.total,
    totalPages: res.pagination.totalPages,
  }));
}

export function getJudgementStats(): Promise<ApiJudgementStats> {
  return fetchJudgement<{
    totalJudgements: number;
    totalFetchLogs: number;
  }>("/judgement/stats").then((raw) => ({
    totalRecords: raw.totalJudgements,
    totalFetches: raw.totalFetchLogs,
  }));
}

export function getJudgementLogs(page = 1, limit = 50) {
  return fetchJudgement<ApiJudgementLogs>(
    `/judgement/logs?page=${page}&limit=${limit}`,
  );
}
