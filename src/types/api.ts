export type UserColor =
  | "Gray"
  | "Blue"
  | "Green"
  | "Orange"
  | "Red"
  | "Purple"
  | "Cheater";

export interface ApiUser {
  id: number;
  name: string;
  color: UserColor;
  ccfLevel: number;
  xcpcLevel: number;
  slogan: string | null;
  introduction: string | null;
  renderedIntroduction: string | null;
  prizes: unknown[] | null;
  profileFetchedAt: string | null;
  profileStale: boolean;
  createdAt: string | number;
  updatedAt: string | number;
}

export interface ApiPaste {
  id: string;
  content?: string;
  renderedContent?: string;
  deleted?: boolean;
  deleteReason?: string;
  createdAt: string;
  updatedAt: string;
  author?: ApiUser;
}

export interface ApiArticle {
  id: string;
  title: string;
  content?: string;
  authorId?: number;
  category?: number;
  upvote?: number;
  favorCount?: number;
  solutionForPid?: string;
  priority: number;
  deleted?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt: string;
  deleteReason?: string;
  contentHash?: string;
  viewCount?: number;
  summary?: string;
  author?: ApiUser;
  renderedContent?: string;
}

export interface ApiArticleHistoryItem {
  id: number;
  articleId: string;
  version: number;
  title: string;
  content: string;
  createdAt: string;
}

export interface ApiCommentAuthor {
  id: number;
  name: string;
  color: UserColor;
  ccfLevel: number;
  xcpcLevel: number;
}

export interface ApiComment {
  id: string;
  content: string;
  time: string;
  author: ApiCommentAuthor | { id: number };
}

export interface ApiCommentsResponse {
  comments: ApiComment[];
  commentsStale: boolean;
  commentsFetchedAt: string | null;
}

export interface ApiSearchResult {
  hits: ApiArticle[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiJudgementUser {
  uid: number;
  avatar: string;
  name: string;
  slogan: string | null;
  badge: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  color: string;
  ccfLevel: number;
  xcpcLevel: number;
  background: string;
}

export interface ApiJudgementRecord {
  id: number;
  uid: number;
  name: string;
  reason: string;
  revoked_permission: number;
  added_permission: number;
  time: number;
  user: ApiJudgementUser;
  fetch_log_id: number;
  log_fetched_at: string;
  created_at: string;
}

export interface ApiJudgementPage {
  records: ApiJudgementRecord[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiJudgementStats {
  totalRecords: number;
  totalFetches: number;
}

export interface ApiJudgementLogs {
  logs: {
    id: number;
    fetchedAt: string;
    recordCount: number;
  }[];
  page: number;
  limit: number;
  total: number;
}

