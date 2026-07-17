import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search as SearchIcon } from "lucide-react";

import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { searchArticles } from "@/api/misc";
import { ArticleFeedCard } from "@/components/feed/feed-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = React.useState(initialQ);
  const [submitted, setSubmitted] = React.useState(initialQ);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => searchArticles({ q: submitted, limit: 30 }),
    enabled: submitted.trim().length > 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(q);
  };

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "搜索", href: "/search" },
        ]}
      />
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">搜索</h1>
      <form onSubmit={submit} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索文章…"
            className="pl-8"
          />
        </div>
        <Button type="submit">搜索</Button>
      </form>

      {!submitted.trim() ? (
        <p className="py-20 text-center text-muted-foreground">请输入关键词搜索文章。</p>
      ) : isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> 搜索中…
        </div>
      ) : error ? (
        <p className="py-20 text-center text-destructive">搜索失败：{error.message}</p>
      ) : data && data.hits.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            共 {data.total} 条结果
          </p>
          {data.hits.map((a) => (
            <ArticleFeedCard key={a.id} article={a} />
          ))}
        </div>
      ) : (
        <p className="py-20 text-center text-muted-foreground">未找到相关文章。</p>
      )}
    </Container>
  );
}
