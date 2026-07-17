import { ClipboardCheck, ClipboardCopy } from "lucide-react";

import { formatRelativeTime } from "@/lib/time";
import { useClipboard } from "@/hooks/use-clipboard";
import UserInlineLink, { type UserBasicInfo } from "@/components/user/user-inline-link";

import Markdown from "../markdown/markdown";
import MetaItem from "../meta/meta-item";
import { Badge } from "../ui/badge";

export type ArticleComment = {
  id: number;
  articleId: string;
  time: Date;
  content: string;
  author: UserBasicInfo;
};

export type CommentCardProps = {
  comment: ArticleComment;
  isFromArticleAuthor?: boolean;
  isPinned?: boolean;
  maxHeight?: number;
};

export function CommentCard({
  comment,
  isFromArticleAuthor = false,
  isPinned = false,
  maxHeight,
}: CommentCardProps) {
  const { copy, copied } = useClipboard();

  return (
    <article
      className=""
      id={`comment-${comment.id}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <UserInlineLink user={comment.author} />
          {isFromArticleAuthor && (
            <Badge
              className="text-inverse bg-pink-500 dark:bg-pink-400"
              size="md"
            >
              作者
            </Badge>
          )}
          {isPinned && (
            <Badge
              className="bg-amber-500/80 text-amber-950 dark:text-amber-100"
              size="md"
            >
              置顶
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <MetaItem>{formatRelativeTime(comment.time)}</MetaItem>
        </div>
      </header>
      <div className="comment-card group/comment-card relative mt-1.5 rounded-2xl border border-muted/75 bg-muted/75">
        <div
          className="m-3 leading-relaxed sm:m-3.5"
          style={{
            maxHeight: maxHeight,
            overflow: maxHeight ? "auto" : "visible",
          }}
        >
          <Markdown compact>{comment.content}</Markdown>
        </div>
        <span className="comment-card-footer pointer-events-none absolute -bottom-4 left-1 z-1 opacity-0 transition-opacity duration-150 group-focus-within/comment-card:pointer-events-auto group-focus-within/comment-card:opacity-100 group-hover/comment-card:pointer-events-auto group-hover/comment-card:opacity-100 sm:left-1.5">
          <button
            className="relative top-0 inline-flex cursor-pointer items-center gap-1 rounded-full bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground shadow ring-1 ring-border backdrop-blur-xs transition-[color,top] duration-200 select-none hover:-top-0.25 hover:text-foreground"
            onClick={() => copy(comment.content)}
            aria-live="polite"
          >
            {copied ? (
              <ClipboardCheck className="inline-block size-3.5" />
            ) : (
              <ClipboardCopy className="inline-block size-3.5" />
            )}
            复制&thinsp;Markdown
          </button>
        </span>
        <span className="comment-card-footer pointer-events-none absolute right-1 -bottom-4 rounded-full bg-background/50 px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 shadow ring-1 ring-border backdrop-blur-xs transition-opacity duration-150 group-focus-within/comment-card:pointer-events-auto group-focus-within/comment-card:opacity-100 group-hover/comment-card:pointer-events-auto group-hover/comment-card:opacity-100 sm:right-1.5">
          {`#comment-${comment.id}`}
        </span>
      </div>
    </article>
  );
}
