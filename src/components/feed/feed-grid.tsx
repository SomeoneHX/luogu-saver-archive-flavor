import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { getPlaza } from "@/api/misc";
import { getJudgements } from "@/api/judgement";
import type { ApiArticle, ApiJudgementRecord } from "@/types/api";
import { Button } from "@/components/ui/button";
import { ArticleFeedCard } from "./feed-card";
import { JudgementFeedCard } from "./judgement-feed-card";
import { useResponsiveColumnCount } from "./use-responsive-column-count";

const ARTICLE_PAGE_SIZE = 20;
const JUDGEMENT_PAGE_SIZE = 20;

type FeedItem =
  | { kind: "article"; id: string; article: ApiArticle }
  | { kind: "judgement"; id: string; record: ApiJudgementRecord };

interface PageParam {
  articleExclude: string[];
  judgementPage: number;
}

interface FeedPageData {
  articleItems: FeedItem[];
  judgementItems: FeedItem[];
  articleExclude: string[];
  judgementPage: number;
  hasMoreArticles: boolean;
  hasMoreJudgements: boolean;
}

function interleave<T, U>(a: T[], b: U[]): (T | U)[] {
  const out: (T | U)[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
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
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    initialPageParam: { articleExclude: [], judgementPage: 1 } as PageParam,
    queryFn: async ({ pageParam }) => {
      const [articles, judgements] = await Promise.all([
        getPlaza(ARTICLE_PAGE_SIZE, pageParam.articleExclude),
        getJudgements({
          page: pageParam.judgementPage,
          limit: JUDGEMENT_PAGE_SIZE,
        }),
      ]);

      const articleItems: FeedItem[] = articles.map((a) => ({
        kind: "article" as const,
        id: a.id,
        article: a,
      }));
      const judgementItems: FeedItem[] = judgements.records.map((j) => ({
        kind: "judgement" as const,
        id: `j-${j.id}`,
        record: j,
      }));

      const articleExclude = [...pageParam.articleExclude, ...articles.map((a) => a.id)];
      const judgementPage = pageParam.judgementPage + 1;

      return {
        articleItems,
        judgementItems,
        articleExclude,
        judgementPage,
        hasMoreArticles: articles.length >= ARTICLE_PAGE_SIZE,
        hasMoreJudgements: judgementPage <= judgements.totalPages,
      } satisfies FeedPageData;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMoreArticles || lastPage.hasMoreJudgements
        ? { articleExclude: lastPage.articleExclude, judgementPage: lastPage.judgementPage }
        : undefined,
  });

  const items = React.useMemo<FeedItem[]>(() => {
    const articleItems: FeedItem[] = [];
    const judgementItems: FeedItem[] = [];
    for (const page of data?.pages ?? []) {
      articleItems.push(...page.articleItems);
      judgementItems.push(...page.judgementItems);
    }
    return interleave(articleItems, judgementItems) as FeedItem[];
  }, [data]);

  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "加载失败"
    : null;

  const columns = React.useMemo(() => {
    const bucketCount = Math.max(1, columnCount);
    const buckets: FeedItem[][] = Array.from({ length: bucketCount }, () => []);
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
        <p>加载失败：{errorMessage ?? "未知错误"}</p>
        <Button className="mt-4" onClick={() => void refetch()}>
          重试
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-20 text-center text-muted-foreground">暂无内容。</p>;
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
            {bucket.map((item) =>
              item.kind === "article" ? (
                <ArticleFeedCard key={item.id} article={item.article} />
              ) : (
                <JudgementFeedCard key={item.id} record={item.record} />
              ),
            )}
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
