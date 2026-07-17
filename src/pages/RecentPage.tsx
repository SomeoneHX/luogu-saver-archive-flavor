import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { getRecentArticles } from "@/api/article";
import type { ApiArticle } from "@/types/api";
import { ArticleFeedCard } from "@/components/feed/feed-card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 30;

export default function RecentPage() {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["recent"],
    queryFn: ({ pageParam }) =>
      getRecentArticles({
        count: PAGE_SIZE,
        updatedAfter: pageParam ?? undefined,
        truncatedCount: 400,
      }).then((items) => ({
        items,
        nextCursor:
          items.length > 0
            ? new Date(items[items.length - 1].updatedAt)
            : null,
      })),
    initialPageParam: null as Date | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const items = React.useMemo<ApiArticle[]>(
    () => (data ? data.pages.flatMap((p) => p.items) : []),
    [data],
  );

  React.useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "最近", href: "/recent" },
        ]}
      />
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">最近</h1>
      {isPending ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> 加载中…
        </div>
      ) : isError ? (
        <p className="py-20 text-center text-destructive">
          加载失败：{error?.message}
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <ArticleFeedCard key={a.id} article={a} />
          ))}
          <div ref={sentinelRef} className="h-4" />
          {isFetchingNextPage ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> 加载更多…
            </div>
          ) : hasNextPage ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void fetchNextPage()}>
                加载更多
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </Container>
  );
}
