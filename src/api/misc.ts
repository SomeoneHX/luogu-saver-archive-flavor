import { fetchApi } from "./client";
import type { ApiCommentsResponse, ApiUser, ApiArticle, ApiSearchResult, ApiPaste } from "@/types/api";

export function getArticleComments(id: string) {
  return fetchApi<ApiCommentsResponse>(`/article/comments/${id}`);
}

export function getUser(id: string) {
  return fetchApi<ApiUser>(`/user/query/${id}`);
}

export function searchArticles(opts: {
  q?: string;
  page?: number;
  limit?: number;
  category?: number;
  authorId?: number;
} = {}) {
  const params = new URLSearchParams();
  if (opts.q) params.set("q", opts.q);
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.category) params.set("category", String(opts.category));
  if (opts.authorId) params.set("authorId", String(opts.authorId));
  return fetchApi<ApiSearchResult>(`/search/articles?${params.toString()}`);
}

export function getPlaza(count = 10, exclude?: string[]) {
  const params = new URLSearchParams();
  params.set("count", String(count));
  if (exclude && exclude.length) params.set("exclude", exclude.join(","));
  return fetchApi<ApiArticle[]>(`/plaza/get?${params.toString()}`);
}

export function getPaste(id: string) {
  return fetchApi<ApiPaste>(`/paste/query/${id}`);
}

export function getPasteCount() {
  return fetchApi<{ count: number }>(`/paste/count`);
}
