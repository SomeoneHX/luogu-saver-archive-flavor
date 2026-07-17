import * as React from "react";
import {
  ClipboardCheck,
  ClipboardCopy,
  Reply,
  SquareArrowOutUpRight,
  SquareCheckBig,
} from "lucide-react";

import { ABSOLUTE_DATE_FORMATTER } from "@/lib/time";
import { useClipboard } from "@/hooks/use-clipboard";
import { Button } from "@/components/ui/button";
import { QueueJobButton } from "@/components/operation-panel/queue-job-button";
import { enqueuePasteRefresh } from "@/api/task";
import type { UserBasicInfo } from "@/components/user/user-inline-link";

export function PasteOperationPanel({
  paste,
  className,
}: {
  paste: {
    id: string;
    time: Date;
    content: string | null;
    author: UserBasicInfo;
  };
  className?: string;
}) {
  const { copy: copyLink, copied: copiedLink } = useClipboard();
  const { copy: copySnapshotLink, copied: copiedSnapshotLink } = useClipboard();
  const { copy: copySourceMarkdown, copied: copiedSourceMarkdown } = useClipboard();

  const originalLink = `https://www.luogu.com.cn/paste/${paste.id}`;
  const archiveLink = `/p/${paste.id}`;
  const archiveSnapshotLink = `/p/${paste.id}?snapshot=${paste.time.getTime().toString(36)}`;
  const sourceMarkdown = paste.content ?? "";

  const triggerRefresh = React.useCallback(
    () => enqueuePasteRefresh(paste.id),
    [paste.id],
  );

  return (
    <div className={className}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">云剪贴板操作</h2>
        <p className="text-sm text-muted-foreground">
          由 {paste.author.name} 于 {ABSOLUTE_DATE_FORMATTER.format(paste.time)} 创建。
        </p>
      </div>

      <div className="mt-6 grid gap-2">
        <Button asChild className="justify-start gap-2 rounded-2xl py-2">
          <a href={originalLink} target="_blank" rel="noreferrer noopener">
            <Reply className="size-4" /> 查看原剪贴板
          </a>
        </Button>
        <QueueJobButton onTrigger={triggerRefresh} idleText="更新云剪贴板" />
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
          onClick={() => copySourceMarkdown(sourceMarkdown)}
          aria-live="polite"
        >
          {copiedSourceMarkdown ? (
            <ClipboardCheck className="size-4" />
          ) : (
            <ClipboardCopy className="size-4" />
          )}
          复制 Markdown 源代码
        </Button>
      </div>
    </div>
  );
}
