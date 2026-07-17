import {
  CalendarClock,
  MessageCircle,
  Star,
  ThumbsUp,
} from "lucide-react";

import type { ApiArticle } from "@/types/api";
import { getCategoryInfo } from "@/lib/category-info";

import FeedCardTemplate from "./feed-card-template";

export function ArticleFeedCard({
  article,
  href,
}: {
  article: ApiArticle;
  href?: string;
}) {
  const categoryName =
    typeof article.category === "number"
      ? getCategoryInfo(article.category).name
      : null;
  const summary = article.summary?.trim() || "";
  const metrics = [
    article.upvote ? { icon: ThumbsUp, children: `${article.upvote} 赞同` } : null,
    article.favorCount ? { icon: Star, children: `${article.favorCount} 收藏` } : null,
    article.viewCount ? { icon: CalendarClock, children: `浏览 ${article.viewCount}` } : null,
    {
      icon: MessageCircle,
      children: `更新于 ${new Date(article.updatedAt).toLocaleDateString("zh-CN")}`,
    },
  ].filter((m): m is NonNullable<typeof m> => m !== null);
  return (
    <FeedCardTemplate
      href={href ?? `/a/${article.id}`}
      kind="article"
      time={new Date(article.updatedAt)}
      metaTags={categoryName ? [categoryName] : undefined}
      title={article.title}
      content={summary || article.content?.replace(/[#>*`\[\]()\-]/g, "").slice(0, 200) || ""}
      contentMaxLines={summary ? undefined : 4}
      tags={article.tags?.length ? article.tags : undefined}
      metrics={metrics}
      user={article.author}
    />
  );
}
