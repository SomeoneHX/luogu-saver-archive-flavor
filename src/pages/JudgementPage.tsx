import * as React from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Gavel, Loader2, Reply, SquareArrowOutUpRight, SquareCheckBig } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import UserInlineLink, { type UserBasicInfo } from "@/components/user/user-inline-link";
import { Button } from "@/components/ui/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { ABSOLUTE_DATE_FORMATTER, formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { getPermissionNames } from "@/lib/judgement";
import { getJudgementStats, getJudgements } from "@/api/judgement";
import type { ApiJudgementRecord } from "@/types/api";

const PAGE_SIZE = 30;

const TONE_STYLES = {
  green: {
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    cardClass: "border-emerald-500/40 shadow-emerald-500/15 bg-emerald-500/2",
    titleClass: "text-emerald-600 dark:text-emerald-200",
    bodyClass: "text-emerald-600/80 dark:text-emerald-200/80",
  },
  yellow: {
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    cardClass: "border-amber-500/40 shadow-amber-500/15 bg-amber-500/2",
    titleClass: "text-amber-600 dark:text-amber-200",
    bodyClass: "text-amber-600/80 dark:text-amber-200/80",
  },
  red: {
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-300",
    cardClass: "border-red-500/40 shadow-red-500/15 bg-red-500/2",
    titleClass: "text-red-600 dark:text-red-200",
    bodyClass: "text-red-600/80 dark:text-red-200/80",
  },
} as const;

type Tone = keyof typeof TONE_STYLES;

function resolveTone(entry: ApiJudgementRecord): Tone {
  const hasAdded = (entry.added_permission ?? 0) > 0;
  const hasRevoked = (entry.revoked_permission ?? 0) > 0;
  if (hasAdded && hasRevoked) return "yellow";
  if (hasAdded) return "green";
  return "red";
}

function toUserBasicInfo(user: ApiJudgementRecord["user"]): UserBasicInfo {
  return {
    id: user.uid,
    name: user.name,
    color: user.color,
    ccfLevel: user.ccfLevel,
    xcpcLevel: user.xcpcLevel,
  };
}

function OstrakonCard({
  entry,
  collapsedUsers,
}: {
  entry: ApiJudgementRecord;
  collapsedUsers?: UserBasicInfo[];
}) {
  const createdAt = new Date(entry.time * 1000);
  const relative = formatRelativeTime(createdAt);
  const style = TONE_STYLES[resolveTone(entry)];
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-4.5 text-card-foreground shadow-sm transition duration-200 hover:shadow-lg",
        style.cardClass,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <span className="inline-flex gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                style.badgeClass,
              )}
            >
              <Gavel className="size-3.5" aria-hidden />
              陶片放逐
            </span>
            <span className={cn("font-medium", style.titleClass)}>
              {entry.reason?.trim() || "没道理，就这样。"}
            </span>
          </span>
        </div>
        <time className={cn("text-xs", style.bodyClass)} dateTime={entry.created_at}>
          {ABSOLUTE_DATE_FORMATTER.format(createdAt)}
        </time>
        <time className={cn("text-xs", style.bodyClass)} dateTime={entry.created_at}>
          {relative}
        </time>
      </div>

      <div className="mt-2.5 space-y-3">
        <p className="leading-7">
          <UserInlineLink
            user={toUserBasicInfo(entry.user)}
            avatar
            compact
            className="me-2 align-bottom"
          />
          {collapsedUsers && collapsedUsers.length > 0
            ? collapsedUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <UserInlineLink
                    user={user}
                    avatar
                    compact
                    className="me-2 align-bottom"
                  />
                </React.Fragment>
              ))
            : null}
        </p>
        {entry.added_permission || entry.revoked_permission ? (
          <div className={cn("text-base", style.bodyClass)}>
            <ul>
              {getPermissionNames(entry.added_permission).map((name) => (
                <li key={`add-${name}`}>
                  授予{" "}
                  <code className={cn("font-medium", style.titleClass)}>{name}</code>{" "}
                  权限
                </li>
              ))}
              {getPermissionNames(entry.revoked_permission).map((name) => (
                <li key={`rev-${name}`}>
                  撤销{" "}
                  <code className={cn("font-medium", style.titleClass)}>{name}</code>{" "}
                  权限
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function OperationPanel({ stat }: { stat: { totalRecords: number; totalFetches: number; totalPages: number } }) {
  const { copy: copyLink, copied: copiedLink } = useClipboard();
  const originalLink = "https://www.luogu.com.cn/judgement";
  const archiveLink = "https://luogu.store/judgement";

  return (
    <div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">陶片放逐操作</h2>
      </div>

      <dl className="mt-6 space-y-3 text-sm text-foreground">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">已保存记录</dt>
          <dd>{stat.totalRecords.toLocaleString("zh-CN")} 条</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">总抓取次数</dt>
          <dd>{stat.totalFetches.toLocaleString("zh-CN")} 次</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">记录页数</dt>
          <dd>{stat.totalPages.toLocaleString("zh-CN")} 页</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-2">
        <Button
          className="justify-start gap-2 rounded-2xl py-2"
          onClick={() => window.open(originalLink, "_blank", "noreferrer,noopener")}
        >
          <Reply className="size-4" aria-hidden="true" /> 查看原页面
        </Button>
        <Button
          variant="outline"
          className="cursor-pointer justify-start gap-2 rounded-2xl py-2"
          type="button"
          onClick={() => copyLink(archiveLink)}
          aria-live="polite"
        >
          {copiedLink ? (
            <SquareCheckBig className="size-4" aria-hidden="true" />
          ) : (
            <SquareArrowOutUpRight className="size-4" aria-hidden="true" />
          )}
          复制链接
        </Button>
      </div>
    </div>
  );
}

export default function JudgementPage() {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const statsQuery = useQuery({
    queryKey: ["judgement-stats"],
    queryFn: () => getJudgementStats(),
    staleTime: 5 * 60 * 1000,
  });

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
    queryKey: ["ostraka"],
    queryFn: ({ pageParam }) =>
      getJudgements({ page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1 as number,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.totalPages ? allPages.length + 1 : undefined,
  });

  const entries = React.useMemo<ApiJudgementRecord[]>(
    () => (data ? data.pages.flatMap((p) => p.records) : []),
    [data],
  );

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

  const collapsedEntries = React.useMemo(() => {
    const collapsed: { entry: ApiJudgementRecord; collapsedUsers: UserBasicInfo[] }[] = [];
    let last: ApiJudgementRecord | null = null;
    for (const entry of entries) {
      if (
        last !== null &&
        entry.reason === last.reason &&
        entry.added_permission === last.added_permission &&
        entry.revoked_permission === last.revoked_permission
      ) {
        collapsed.at(-1)!.collapsedUsers.push(toUserBasicInfo(entry.user));
      } else {
        collapsed.push({ entry, collapsedUsers: [] });
        last = entry;
      }
    }
    return collapsed;
  }, [entries]);

  const stat = statsQuery.data
    ? {
        totalRecords: statsQuery.data.totalRecords ?? 0,
        totalFetches: statsQuery.data.totalFetches ?? 0,
        totalPages: data?.pages[0]?.totalPages ?? 1,
      }
    : { totalRecords: 0, totalFetches: 0, totalPages: 1 };

  const showLoading = isPending && entries.length === 0;
  const isEmpty = !isPending && entries.length === 0;
  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "加载失败"
    : null;

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "陶片放逐", href: "/judgement" },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,8fr)_minmax(0,3.5fr)] xl:grid-cols-[minmax(0,8fr)_minmax(0,3fr)] 2xl:grid-cols-[minmax(0,3fr)_minmax(0,8fr)_minmax(0,3fr)]">
        <aside className="hidden 2xl:flex 2xl:flex-col 2xl:gap-4">
          <header className="sticky top-24.25 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">陶片放逐</h1>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              陶片放逐制，是古代雅典城邦的一项政治制度，由雅典政治家克里斯提尼于公元前&thinsp;510&thinsp;年创立。
            </p>
          </header>
        </aside>

        <main className="order-1 flex flex-col gap-8 2xl:order-2">
          <div className="block 2xl:hidden">
            <header className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">陶片放逐</h1>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                陶片放逐制，是古代雅典城邦的一项政治制度，由雅典政治家克里斯提尼于公元前&thinsp;510&thinsp;年创立。
              </p>
            </header>
          </div>

          <section className="space-y-5">
            {showLoading ? (
              <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin" aria-hidden />
                正在加载陶片放逐
              </div>
            ) : isEmpty ? (
              <div className="rounded-3xl border border-dashed border-border/60 px-6 py-16 text-center text-sm text-muted-foreground">
                暂无陶片记录。
              </div>
            ) : (
              <div className="space-y-5">
                {collapsedEntries.map(({ entry, collapsedUsers }) => (
                  <OstrakonCard
                    key={entry.id}
                    entry={entry}
                    collapsedUsers={collapsedUsers}
                  />
                ))}
              </div>
            )}

            <div
              ref={sentinelRef}
              className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  <span>载入更多放逐记录…</span>
                </>
              ) : hasNextPage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  加载更多
                </Button>
              ) : (
                <span>已经是最早的记录了</span>
              )}
              {errorMessage ? (
                <div className="flex flex-col items-center gap-2 text-xs text-destructive">
                  <span>{errorMessage}</span>
                  <Button variant="outline" size="sm" onClick={() => void refetch()}>
                    重试
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        </main>

        <aside className="order-2 hidden lg:order-2 lg:block 2xl:order-3">
          <div className="sticky top-24.25">
            {statsQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> 加载统计…
              </div>
            ) : (
              <OperationPanel stat={stat} />
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
