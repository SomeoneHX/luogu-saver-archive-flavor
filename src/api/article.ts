import { fetchApi } from "./client";
import type { ApiArticle } from "@/types/api";

export function getArticle(id: string) {
  return fetchApi<ApiArticle>(`/article/query/${id}`);
}

export function getRecentArticles(opts: {
  count?: number;
  updatedAfter?: Date;
  truncatedCount?: number;
} = {}) {
  const params = new URLSearchParams();
  if (opts.count) params.set("count", String(opts.count));
  if (opts.updatedAfter)
    params.set("updated_after", opts.updatedAfter.toISOString());
  if (opts.truncatedCount)
    params.set("truncated_count", String(opts.truncatedCount));
  return fetchApi<ApiArticle[]>(`/article/recent?${params.toString()}`);
}

export function getRelevantArticles(id: string) {
  return fetchApi<ApiArticle[]>(`/article/relevant/${id}`);
}

export function getArticleHistory(id: string) {
  return fetchApi<
    { id: number; articleId: string; version: number; title: string; content: string; createdAt: string }[]
  >(`/article/history/${id}`);
}

export function getArticleCount() {
  return fetchApi<{ count: number }>(`/article/count`);
}
