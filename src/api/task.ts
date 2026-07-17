import { fetchApi } from "./client";

export type TaskType = "save" | "delete" | "judge" | "scrape";

export type TaskTarget = "article" | "discuss" | "paste" | "judgement" | "profile" | "comments";

export async function createTask(type: TaskType, payload: Record<string, unknown>) {
  return fetchApi<{ taskId: string }>(`/task/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
}

export function enqueueArticleRefresh(lid: string) {
  return fetchApi<{ workflowId: string }>(
    `/workflow/create/template/article-save-pipeline`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId: lid }),
    },
  );
}

export function enqueueDiscussionRefresh(id: number) {
  return createTask("save", { target: "discuss", targetId: id });
}

export function enqueuePasteRefresh(id: string) {
  return createTask("save", { target: "paste", targetId: id });
}

export function enqueueJudgementRefresh() {
  return createTask("save", { target: "judgement" });
}

export function enqueueCommentsRefresh(lid: string) {
  return createTask("save", { target: "comments", targetId: lid });
}

export function enqueueProfileRefresh(uid: number) {
  return fetchApi<{ taskId: string }>(`/user/${uid}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
