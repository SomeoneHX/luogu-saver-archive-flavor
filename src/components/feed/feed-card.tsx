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
      metrics={[
        { icon: ThumbsUp, children: `${article.upvote ?? 0} 赞同` },
        { icon: Star, children: `${article.favorCount ?? 0} 收藏` },
        {
          icon: CalendarClock,
          children: `浏览 ${article.viewCount ?? 0}`,
        },
        {
          icon: MessageCircle,
          children: `更新于 ${new Date(article.updatedAt).toLocaleDateString("zh-CN")}`,
        },
      ]}
      user={article.author}
    />
  );
}
