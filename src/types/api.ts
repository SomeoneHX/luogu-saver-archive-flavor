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
