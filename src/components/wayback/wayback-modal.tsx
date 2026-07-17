import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";

import { ABSOLUTE_DATE_FORMATTER, formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type WaybackBadge = {
  key: string;
  label: string;
  className?: string;
};

export type WaybackTimelineItem = {
  snapshotId: string;
  title: string;
  capturedAt: string;
  lastSeenAt?: string | null;
  badges?: WaybackBadge[];
  meta?: React.ReactNode[];
};

export type WaybackFetchResult<T extends WaybackTimelineItem> = {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
};

export type WaybackDataSource<T extends WaybackTimelineItem> = {
  key: readonly unknown[] | string;
  fetchPage: (params: {
    cursor?: string | null;
  }) => Promise<WaybackFetchResult<T>>;
};

export function WaybackModal<T extends WaybackTimelineItem>({
  dataSource,
  header,
  emptyMessage = "暂无快照记录。",
  loadingMessage = "正在加载历史快照…",
  errorMessage = "加载失败",
  onSelectSnapshot,
}: {
  dataSource: WaybackDataSource<T>;
  header?: { title: string; description?: string };
  emptyMessage?: React.ReactNode;
  loadingMessage?: React.ReactNode;
  errorMessage?: React.ReactNode;
  onSelectSnapshot?: (item: T) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const openHash = "#wayback";

  React.useEffect(() => {
    const handleHash = () => setIsOpen(window.location.hash === openHash);
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const close = React.useCallback(() => {
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", base);
    setIsOpen(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, isOpen]);

  React.useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  const keyParts = React.useMemo(
    () => (Array.isArray(dataSource.key) ? dataSource.key : [dataSource.key]),
    [dataSource.key],
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["wayback", ...keyParts],
    queryFn: ({ pageParam }) =>
      dataSource.fetchPage({ cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) =>
      last.hasMore && last.nextCursor ? last.nextCursor : undefined,
    enabled: isOpen,
    staleTime: 0,
  });

  const timelineItems = React.useMemo(
    () => (data ? data.pages.flatMap((p) => p.items) : []),
    [data],
  );
  const activeSnapshotId = timelineItems[0]?.snapshotId ?? null;

  const handleSelect = (item: T) => {
    close();
    onSelectSnapshot?.(item);
  };

  if (!isOpen) return null;

  const timelineContent = (() => {
    if (isPending)
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> {loadingMessage}
        </div>
      );
    if (isError)
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-destructive/90">
          <p>{error instanceof Error ? error.message : errorMessage}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            重试
          </Button>
        </div>
      );
    if (timelineItems.length === 0)
      return (
        <div className="flex h-full flex-col items-center justify-center text-sm text-muted-foreground/80">
          {emptyMessage}
        </div>
      );
    return (
      <ol className="relative space-y-6">
        {timelineItems.map((item) => {
          const capturedAt = new Date(item.capturedAt);
          const isActive = activeSnapshotId === item.snapshotId;
          return (
            <li key={item.snapshotId} className="relative">
              <button
                type="button"
                className={cn(
                  "group border bg-card/70 text-left transition-all hover:bg-muted",
                  "w-full rounded-3xl border-border/70 px-5 py-4 backdrop-blur-sm",
                  isActive && "bg-muted",
                )}
                onClick={() => handleSelect(item)}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <time
                      className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                      dateTime={item.capturedAt}
                    >
                      {ABSOLUTE_DATE_FORMATTER.format(capturedAt)} ·{" "}
                      {formatRelativeTime(capturedAt)}
                    </time>
                    {item.badges?.map((b) => (
                      <Badge
                        key={b.key}
                        className={cn(
                          "bg-muted/70 text-muted-foreground border border-border/50",
                          b.className,
                        )}
                      >
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                  {isActive ? (
                    <Badge className="bg-primary/15 text-primary">当前查看</Badge>
                  ) : null}
                </div>
                {item.title && (
                  <p className="mt-3 text-base leading-relaxed font-semibold text-foreground">
                    {item.title}
                  </p>
                )}
                {item.meta?.map((m, i) => (
                  <div
                    key={i}
                    className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/90"
                  >
                    {m}
                  </div>
                ))}
              </button>
            </li>
          );
        })}
      </ol>
    );
  })();

  const headerTitle = header?.title ?? "时光机";
  const headerDescription = header?.description ?? "翻阅历史快照，观察内容的演变。";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm sm:p-8"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="时光机"
        className="relative flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative flex items-start gap-3 border-b border-border/70 px-6 py-5">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              {headerTitle}
            </h2>
            {headerDescription && (
              <p className="text-sm text-muted-foreground">{headerDescription}</p>
            )}
          </div>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon-sm"
            className="absolute top-4 right-4 rounded-full"
            onClick={close}
          >
            <X className="size-4" />
            <span className="sr-only">关闭时光机</span>
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          {timelineContent}
        </div>
        {hasNextPage ? (
          <div className="flex items-center justify-center border-t border-border/70 bg-background/95 px-6 py-4">
            <Button
              variant="outline"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
              className="rounded-xl"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> 加载中…
                </>
              ) : (
                "加载更多"
              )}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
