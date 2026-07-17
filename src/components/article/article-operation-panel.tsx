import * as React from "react";
import {
  ClipboardCheck,
  ClipboardCopy,
  History,
  SquareArrowOutUpRight,
  SquareCheckBig,
} from "lucide-react";

import { ABSOLUTE_DATE_FORMATTER, formatRelativeTime } from "@/lib/time";
import { useClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import StatRow from "@/components/operation-panel/stat-row";
import { QueueJobButton } from "@/components/operation-panel/queue-job-button";
import { enqueueArticleRefresh } from "@/api/task";

export function ArticleOperationPanel({
  article,
  onOpenWayback,
}: {
  article: {
    lid: string;
    content: string | null;
    replyCount: number;
    snapshotsCount: number;
    capturedAt: Date;
    lastSeenAt: Date;
  };
  onOpenWayback: () => void;
}) {
  const { copy: copyLink, copied: copiedLink } = useClipboard();
  const { copy: copySnapshotLink, copied: copiedSnapshotLink } = useClipboard();
  const { copy: copyBodyMarkdown, copied: copiedBodyMarkdown } = useClipboard();

  const originalLink = `https://www.luogu.com.cn/article/${article.lid}`;
  const archiveLink = `https://luogu.store/a/${article.lid}`;
  const archiveSnapshotLink = `https://luogu.store/a/${article.lid}@${article.capturedAt.getTime().toString(36)}`;
  const bodyMarkdown = article.content ?? "";

  const triggerRefresh = React.useCallback(
    () => enqueueArticleRefresh(article.lid),
    [article.lid],
  );

  return (
    <div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">文章操作</h2>
        <p className="text-sm text-muted-foreground">
          快速查看文章及其快照的属性，并进行相关操作。
        </p>
      </div>

      <dl className="mt-6 space-y-3 text-sm text-foreground">
        <StatRow label="当前评论" value={`${article.replyCount.toLocaleString("zh-CN")} 条`} />
        <StatRow label="当前快照" value={`${article.snapshotsCount.toLocaleString("zh-CN")} 份`} />
        <StatRow
          label="快照标识符"
          value={`@${article.capturedAt.getTime().toString(36)}`}
        />
        <StatRow
          label="此快照首次捕获于"
          value={ABSOLUTE_DATE_FORMATTER.format(article.capturedAt)}
          hint={formatRelativeTime(article.capturedAt)}
        />
        <StatRow
          label="此快照最后确认于"
          value={ABSOLUTE_DATE_FORMATTER.format(article.lastSeenAt)}
          hint={formatRelativeTime(article.lastSeenAt)}
        />
      </dl>

      <div className="mt-6 grid gap-2">
        <Button asChild className="justify-start gap-2 rounded-2xl py-2">
          <a href={originalLink} target="_blank" rel="noreferrer noopener">
            <SquareArrowOutUpRight className="size-4" /> 查看原文
          </a>
        </Button>
        <Button
          variant="outline"
          className="justify-start gap-2 rounded-2xl py-2"
          type="button"
          onClick={onOpenWayback}
        >
          <History className="size-4" /> 时光机
        </Button>
        <QueueJobButton onTrigger={triggerRefresh} idleText="更新文章" />
        <Button
          variant="outline"
          className="cursor-pointer justify-start gap-2 rounded-2xl py-2"
          type="button"
          onClick={() => copyLink(archiveLink)}
          aria-live="polite"
        >
          {copiedLink ? (
            <SquareCheckBig className="size-4" />
          ) : (
            <SquareArrowOutUpRight className="size-4" />
          )}
          复制链接
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer justify-start gap-2 rounded-2xl py-2"
          type="button"
          onClick={() => copySnapshotLink(archiveSnapshotLink)}
          aria-live="polite"
        >
          {copiedSnapshotLink ? (
            <SquareCheckBig className="size-4" />
          ) : (
            <SquareArrowOutUpRight className="size-4" />
          )}
          复制快照链接
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer justify-start gap-2 rounded-2xl py-2"
          type="button"
          onClick={() => copyBodyMarkdown(bodyMarkdown)}
          aria-live="polite"
        >
          {copiedBodyMarkdown ? (
            <ClipboardCheck className="size-4" />
          ) : (
            <ClipboardCopy className="size-4" />
          )}
          复制正文 Markdown
        </Button>
      </div>
    </div>
  );
}
