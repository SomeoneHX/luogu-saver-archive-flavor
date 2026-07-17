import { useQuery } from "@tanstack/react-query";

import { getArticleComments } from "@/api/misc";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentCard } from "@/components/comments/comment-card";

export function ArticleComments({ articleId, articleAuthorId }: { articleId: string; articleAuthorId?: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["article-comments", articleId],
    queryFn: () => getArticleComments(articleId),
  });

  const comments = data?.comments ?? [];

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-foreground">评论</h2>
      <p className="text-sm text-muted-foreground">
        共 {comments.length.toLocaleString("zh-CN")} 条已保存评论
        {data?.commentsStale ? "（后台抓取中…）" : ""}。
      </p>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">加载评论失败：{error.message}</p>
      ) : comments.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          你似乎来到了没有知识的荒原。
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {comments.map((c) => {
            const author =
              "name" in c.author
                ? {
                    id: c.author.id,
                    name: c.author.name,
                    color: c.author.color,
                    ccfLevel: c.author.ccfLevel,
                    xcpcLevel: c.author.xcpcLevel,
                  }
                : { id: c.author.id, name: `用户${c.author.id}`, color: "Gray" as const };
            return (
              <li key={c.id}>
                <CommentCard
                  comment={{
                    id: Number(c.id),
                    articleId,
                    time: new Date(Number(c.time) * 1000),
                    content: c.content,
                    author,
                  }}
                  isFromArticleAuthor={
                    articleAuthorId != null && author.id === articleAuthorId
                  }
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
