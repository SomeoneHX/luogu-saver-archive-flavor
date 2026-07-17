import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Flame, Loader2 } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { getPlaza } from "@/api/misc";
import { ArticleFeedCard } from "@/components/feed/feed-card";
import { withBase } from "@/lib/utils";

const BATCH_SIZE = 20;
const SIDEBAR_COUNT = 10;

const rankColors = ["text-yellow-400", "text-gray-400", "text-amber-700"];

export default function ExplorePage() {
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isPending,
  } = useInfiniteQuery({
    queryKey: ["explore"],
    queryFn: ({ pageParam }) =>
      getPlaza(BATCH_SIZE, pageParam as string[] | undefined),
    initialPageParam: undefined as string[] | undefined,
    getNextPageParam: (_lastPage, allPages) =>
      allPages.flatMap((p) => p.map((a) => a.id)),
  });

  const allItems = React.useMemo(
    () => (data ? data.pages.flatMap((p) => p) : []),
    [data],
  );
  const hotItems = React.useMemo(
    () => allItems.slice(0, SIDEBAR_COUNT),
    [allItems],
  );

  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "加载失败"
    : null;

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (records) => {
        if (records[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "探索", href: "/explore" },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,3.5fr)] xl:grid-cols-[minmax(0,8fr)_minmax(0,3fr)] 2xl:grid-cols-[minmax(0,3fr)_minmax(0,8fr)_minmax(0,3fr)]">
        <aside className="hidden 2xl:flex 2xl:flex-col"></aside>

        <main className="order-1 flex flex-col gap-8 2xl:order-2">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">探索</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              基于热度推荐的文章存档。
            </p>
          </div>

          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" /> 加载中…
            </div>
          ) : isError ? (
            <p className="py-20 text-center text-destructive">
              加载失败：{errorMessage}
            </p>
          ) : allItems.length === 0 ? (
            <p className="py-20 text-center text-muted-foreground">暂无推荐内容。</p>
          ) : (
            <>
              <div className="space-y-4">
                {allItems.map((a) => (
                  <ArticleFeedCard key={a.id} article={a} />
                ))}
              </div>

              <div
                ref={sentinelRef}
                className="flex min-h-12 items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
                aria-hidden
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>加载更多推荐…</span>
                  </>
                ) : hasNextPage ? (
                  <span>下滑加载更多</span>
                ) : null}
                {errorMessage ? (
                  <span className="text-xs text-destructive">{errorMessage}</span>
                ) : null}
              </div>
            </>
          )}
        </main>

        <aside className="order-2 hidden lg:order-2 lg:block 2xl:order-3">
          <div className="sticky top-24.25">
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <Flame className="size-5 text-amber-500" aria-hidden /> 热门文章
            </h3>
            <ol className="mt-4 list-none space-y-4">
              {isPending ? (
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> 加载中…
                </li>
              ) : (
                hotItems.map((a, index) => (
                  <li className="block" key={a.id}>
                    <a
                      href={withBase(`/a/${a.id}`)}
                      className="inline-flex w-full items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-muted/50"
                    >
                      <span
                        className={
                          index < rankColors.length
                            ? "w-6 select-none font-bold " + rankColors[index]
                            : "w-6 select-none text-muted-foreground"
                        }
                      >
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate text-sm text-foreground">
                        {a.title}
                      </span>
                      <span
                        className="font-mono text-xs text-muted-foreground"
                        title="赞同数"
                      >
                        {a.upvote ?? 0}
                      </span>
                    </a>
                  </li>
                ))
              )}
            </ol>
          </div>
        </aside>
      </div>
    </Container>
  );
}
