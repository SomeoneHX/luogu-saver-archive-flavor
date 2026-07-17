import * as React from "react";
import { useParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { CalendarDays, Gavel, Loader2, Medal, Newspaper } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { getUser, searchArticles } from "@/api/misc";
import { getJudgements } from "@/api/judgement";
import { getPermissionNames } from "@/lib/judgement";
import { ABSOLUTE_DATE_FORMATTER, formatRelativeTime } from "@/lib/time";
import { cn, withBase } from "@/lib/utils";
import { USER_COLOR_CLASS } from "@/components/user/user-inline-link";
import { enqueueProfileRefresh } from "@/api/task";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundTemplate } from "@/components/error/not-found-template";
import { UserRoundX } from "lucide-react";
import Markdown from "@/components/markdown/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ApiJudgementRecord } from "@/types/api";

function UserInfoCard({ user }: { user: import("@/types/api").ApiUser }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <Avatar
          className={`size-14 ${USER_COLOR_CLASS[user.color]}`}
        >
          <AvatarImage
            src={`https://cdn.luogu.com.cn/upload/usericon/${user.id}.png`}
            alt={user.name}
          />
          <AvatarFallback className="text-xl font-bold">
            {user.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className={`text-xl font-semibold ${USER_COLOR_CLASS[user.color]}`}>
            {user.name}
            {user.ccfLevel ? <sup className="ml-1 text-sm">{user.ccfLevel}</sup> : null}
            {user.xcpcLevel ? <sup className="ml-0.5 text-xs">ICPC {user.xcpcLevel}</sup> : null}
          </p>
          {user.slogan ? (
            <p className="truncate text-sm text-muted-foreground">{user.slogan}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="size-4" />
          注册于 {ABSOLUTE_DATE_FORMATTER.format(new Date(user.createdAt))}
        </div>
        {user.prizes && user.prizes.length > 0 ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Medal className="size-4" />
            获得 {user.prizes.length} 项荣誉
          </div>
        ) : null}
      </dl>

      {user.introduction ? (
        <div className="mt-4 border-t pt-4">
          <Markdown>{user.introduction}</Markdown>
        </div>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => void enqueueProfileRefresh(user.id)}
      >
        更新资料
      </Button>
    </div>
  );
}

export default function UserPage() {
  const { id = "" } = useParams();
  const uid = Number.parseInt(id, 10);
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    enabled: !!id && !Number.isNaN(uid),
  });

  if (Number.isNaN(uid)) {
    return (
      <Container>
        <NotFoundTemplate Icon={UserRoundX} title="无效的用户 ID" />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-32 w-full" />
        </div>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container>
        <NotFoundTemplate
          Icon={UserRoundX}
          title="可恶！这位用户太神秘了！"
          hint="这位用户尚未收录或不存在。"
        />
      </Container>
    );
  }

  return (
    <div className="mx-auto w-full px-4 pt-8 pb-16 sm:px-6 lg:px-8">
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "用户" },
          { label: `@${user.name}`, href: `/u/${user.id}` },
        ]}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3.2fr)_minmax(0,8fr)] xl:grid-cols-[minmax(0,2.7fr)_minmax(0,8fr)]">
        <div className="space-y-4">
          <UserInfoCard user={user} />
        </div>
        <div>
          <UserTimeline userId={user.id} userName={user.name} />
        </div>
      </div>
    </div>
  );
}

type TimelineItem =
  | {
      kind: "article";
      id: string;
      createdAt: Date;
      title: string;
      summary?: string;
      upvote: number;
      favorCount: number;
      viewCount?: number;
    }
  | {
      kind: "judgement";
      id: string;
      createdAt: Date;
      reason: string;
      added: string[];
      revoked: string[];
    };

function resolveJudgementTone(entry: {
  added: string[];
  revoked: string[];
}): "green" | "yellow" | "red" {
  const hasAdded = entry.added.length > 0;
  const hasRevoked = entry.revoked.length > 0;
  if (hasAdded && hasRevoked) return "yellow";
  if (hasAdded) return "green";
  return "red";
}

const JUDGEMENT_STYLES = {
  green: {
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
    cardClass: "border-emerald-500/50 bg-emerald-500/5",
    titleClass: "text-emerald-600 dark:text-emerald-300",
    bodyClass: "text-emerald-600/80 dark:text-emerald-200/80",
  },
  yellow: {
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    dotClass: "bg-amber-500",
    cardClass: "border-amber-500/50 bg-amber-500/5",
    titleClass: "text-amber-600 dark:text-amber-300",
    bodyClass: "text-amber-600/80 dark:text-amber-200/80",
  },
  red: {
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-300",
    dotClass: "bg-red-500",
    cardClass: "border-red-500/50 bg-red-500/5",
    titleClass: "text-red-600 dark:text-red-300",
    bodyClass: "text-red-600/80 dark:text-red-200/80",
  },
} as const;

function UserTimeline({ userId, userName }: { userId: number; userName: string }) {
  const articles = useInfiniteQuery({
    queryKey: ["user-articles", userId],
    queryFn: ({ pageParam }) =>
      searchArticles({ authorId: userId, limit: 20, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const judgements = useInfiniteQuery({
    queryKey: ["user-judgements", userId],
    queryFn: ({ pageParam }) =>
      getJudgements({
        uid: userId,
        name: userName,
        page: pageParam as number,
        limit: 20,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      allPages.length < lastPage.totalPages ? allPages.length + 1 : undefined,
  });

  const items = React.useMemo<TimelineItem[]>(() => {
    const articleItems: TimelineItem[] = (articles.data?.pages ?? []).flatMap(
      (p) =>
        p.hits.map((a) => ({
          kind: "article" as const,
          id: a.id,
          createdAt: new Date(a.createdAt ?? a.updatedAt),
          title: a.title,
          summary: a.summary,
          upvote: a.upvote ?? 0,
          favorCount: a.favorCount ?? 0,
          viewCount: a.viewCount,
        })),
    );
    const judgementItems: TimelineItem[] = (
      judgements.data?.pages ?? []
    ).flatMap((p) =>
      p.records.map((j: ApiJudgementRecord) => ({
        kind: "judgement" as const,
        id: `j-${j.id}`,
        createdAt: new Date(j.created_at),
        reason: j.reason,
        added: getPermissionNames(j.added_permission),
        revoked: getPermissionNames(j.revoked_permission),
      })),
    );
    return [...articleItems, ...judgementItems].sort(
      (x, y) => y.createdAt.getTime() - x.createdAt.getTime(),
    );
  }, [articles.data, judgements.data]);

  const hasNextPage = articles.hasNextPage || judgements.hasNextPage;
  const isFetchingNextPage =
    articles.isFetchingNextPage || judgements.isFetchingNextPage;
  const errorMessage =
    (articles.isError
      ? articles.error instanceof Error
        ? articles.error.message
        : "文章加载失败"
      : null) ??
    (judgements.isError
      ? judgements.error instanceof Error
        ? judgements.error.message
        : "陶片加载失败"
      : null);

  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          if (articles.hasNextPage) void articles.fetchNextPage();
          if (judgements.hasNextPage) void judgements.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    articles.fetchNextPage,
    articles.hasNextPage,
    judgements.fetchNextPage,
    judgements.hasNextPage,
    isFetchingNextPage,
  ]);

  if (articles.isPending && judgements.isPending)
    return <p className="text-sm text-muted-foreground">加载中…</p>;
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">该用户暂无已收录的动态。</p>;

  return (
    <section>
      <header className="mb-6">
        <h3 className="text-lg font-semibold">时间线</h3>
        <p className="text-sm text-muted-foreground">
          最近的文章与社区记录
        </p>
      </header>

      <ol className="space-y-6 pl-4">
        {items.map((item) => {
          const createdAt = item.createdAt;
          if (item.kind === "article") {
            return (
              <li key={item.id} className="relative">
                <span
                  aria-hidden
                  className="absolute top-1.5 -left-[15px] inline-flex size-3 items-center justify-center rounded-full border-2 border-card bg-sky-500"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-300">
                    <Newspaper className="size-3.5" aria-hidden /> 发布文章
                  </span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={createdAt.toISOString()}
                  >
                    {ABSOLUTE_DATE_FORMATTER.format(createdAt)} ·{" "}
                    {formatRelativeTime(createdAt)}
                  </time>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-sm">
                    <a
                      href={withBase(`/a/${item.id}`)}
                      className="text-base font-semibold text-foreground hover:underline"
                    >
                      {item.title}
                    </a>
                    {item.summary ? (
                      <p className="mt-2 wrap-anywhere text-muted-foreground">
                        {item.summary}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {item.viewCount != null ? (
                        <span>浏览 {item.viewCount.toLocaleString("zh-CN")}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          }

          const tone = resolveJudgementTone(item);
          const style = JUDGEMENT_STYLES[tone];
          return (
            <li key={item.id} className="relative">
              <span
                aria-hidden
                className={cn(
                  "absolute top-1.5 -left-[15px] inline-flex size-3 items-center justify-center rounded-full border-2 border-card",
                  style.dotClass,
                )}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    style.badgeClass,
                  )}
                >
                  <Gavel className="size-3.5" aria-hidden /> 陶片放逐
                </span>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={createdAt.toISOString()}
                >
                  {ABSOLUTE_DATE_FORMATTER.format(createdAt)} ·{" "}
                  {formatRelativeTime(createdAt)}
                </time>
              </div>
              <div className="mt-3 space-y-3">
                <div
                  className={cn(
                    "rounded-2xl border p-4 text-sm",
                    style.cardClass,
                  )}
                >
                  <div className={cn("text-base font-semibold", style.titleClass)}>
                    <ul>
                      {item.added.map((name) => (
                        <li key={`add-${name}`}>授予 <code>{name}</code> 权限</li>
                      ))}
                      {item.revoked.map((name) => (
                        <li key={`rev-${name}`}>撤销 <code>{name}</code> 权限</li>
                      ))}
                    </ul>
                  </div>
                  <p className={cn("mt-1", style.bodyClass)}>{item.reason}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        ref={sentinelRef}
        className="flex min-h-12 flex-col items-center gap-3 py-6 text-sm text-muted-foreground"
        aria-hidden
      >
        {isFetchingNextPage ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            <span>载入更多记录…</span>
          </>
        ) : hasNextPage ? (
          <span>下滑加载更多</span>
        ) : (
          <span>已经到最早的记录</span>
        )}
        {errorMessage ? (
          <span className="text-xs text-destructive">{errorMessage}</span>
        ) : null}
      </div>
    </section>
  );
}
