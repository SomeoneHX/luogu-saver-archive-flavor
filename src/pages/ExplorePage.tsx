import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { getPlaza } from "@/api/misc";
import { ArticleFeedCard } from "@/components/feed/feed-card";

export default function ExplorePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["explore"],
    queryFn: () => getPlaza(20),
  });

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "探索", href: "/explore" },
        ]}
      />
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">探索</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        基于热度推荐的文章存档。
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> 加载中…
        </div>
      ) : error ? (
        <p className="py-20 text-center text-destructive">加载失败：{error.message}</p>
      ) : !data || data.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">暂无推荐内容。</p>
      ) : (
        <div className="space-y-4">
          {data.map((a) => (
            <ArticleFeedCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </Container>
  );
}
