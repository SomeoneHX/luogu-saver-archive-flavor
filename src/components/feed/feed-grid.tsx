import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { getRecentArticles } from "@/api/article";
import type { ApiArticle } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ArticleFeedCard } from "./feed-card";
import { useResponsiveColumnCount } from "./use-responsive-column-count";

const PAGE_SIZE = 20;

interface FeedPage {
  items: ApiArticle[];
  nextCursor: Date | null;
}

async function fetchFeedPage(cursor: Date | null): Promise<FeedPage> {
  const items = await getRecentArticles({
    count: PAGE_SIZE,
    updatedAfter: cursor ?? undefined,
    truncatedCount: 400,
  });
  const sorted = [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const nextCursor =
    sorted.length > 0
      ? new Date(sorted[sorted.length - 1].updatedAt)
      : null;
  return { items: sorted, nextCursor };
}

export function FeedGrid() {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const columnCount = useResponsiveColumnCount();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    initialPageParam: null as Date | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = React.useMemo(
    () => (data ? data.pages.flatMap((p) => p.items) : []),
    [data],
  );

  const columns = React.useMemo(() => {
    const bucketCount = Math.max(1, columnCount);
    const buckets: ApiArticle[][] = Array.from({ length: bucketCount }, () => []);
    items.forEach((item, index) => {
      buckets[index % bucketCount].push(item);
    });
    return buckets;
  }, [items, columnCount]);

  React.useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        正在加载…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center text-destructive">
        <p>加载失败：{error?.message ?? "未知错误"}</p>
        <Button className="mt-4" onClick={() => void fetchNextPage()}>
          重试
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-20 text-center text-muted-foreground">暂无文章。</p>;
  }

  return (
    <div className="space-y-6">
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, columnCount)}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((bucket, i) => (
          <div key={i} className="flex flex-col gap-6">
            {bucket.map((article) => (
              <ArticleFeedCard key={article.id} article={article} />
            ))}
          </div>
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          加载更多…
        </div>
      ) : hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void fetchNextPage()}>
            加载更多
          </Button>
        </div>
      ) : null}
    </div>
  );
}
