import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Medal } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { getUser, searchArticles } from "@/api/misc";
import { ABSOLUTE_DATE_FORMATTER } from "@/lib/time";
import { withBase } from "@/lib/utils";
import { USER_COLOR_CLASS } from "@/components/user/user-inline-link";
import { enqueueProfileRefresh } from "@/api/task";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundTemplate } from "@/components/error/not-found-template";
import { UserRoundX } from "lucide-react";
import Markdown from "@/components/markdown/markdown";

function UserInfoCard({ user }: { user: import("@/types/api").ApiUser }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div
          className={`grid size-14 place-items-center rounded-full text-xl font-bold text-white ${""}`}
        >
          <span className={USER_COLOR_CLASS[user.color]}>{user.name.slice(0, 1)}</span>
        </div>
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

      {user.profileStale ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void enqueueProfileRefresh(user.id)}
        >
          更新资料
        </Button>
      ) : null}
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
          <h2 className="mb-4 text-xl font-semibold">文章</h2>
          <UserArticles userId={user.id} />
        </div>
      </div>
    </div>
  );
}

function UserArticles({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["user-articles", userId],
    queryFn: () => searchArticles({ authorId: userId, limit: 30 }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">加载中…</p>;
  if (error)
    return <p className="text-sm text-destructive">加载失败：{error.message}</p>;
  if (!data || data.hits.length === 0)
    return <p className="text-sm text-muted-foreground">该用户暂无已收录文章。</p>;

  return (
    <div className="space-y-4">
      {data.hits.map((a) => (
        <a
          key={a.id}
          href={withBase(`/a/${a.id}`)}
          className="block rounded-xl border bg-card p-4 transition hover:shadow-md"
        >
          <p className="font-medium text-foreground">{a.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            更新于 {new Date(a.updatedAt).toLocaleDateString("zh-CN")} · {a.upvote ?? 0} 赞同
          </p>
        </a>
      ))}
    </div>
  );
}
