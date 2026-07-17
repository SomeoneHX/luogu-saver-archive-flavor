import { CalendarDays, Swords, Tag, Users } from "lucide-react";

import { ABSOLUTE_DATE_FORMATTER } from "@/lib/time";
import { getCategoryInfo } from "@/lib/category-info";
import MetaItem from "@/components/meta/meta-item";
import { UserInlineLink, type UserBasicInfo } from "@/components/user/user-inline-link";

function ArticleMetaRow({
  article,
  compact = false,
  className,
}: {
  article: {
    time: Date;
    collection?: { id: number; name: string } | null;
    category: number;
    solutionFor?: { title: string; pid: string; difficulty: number | null } | null;
    author: UserBasicInfo;
    allRepliesCount?: number;
    allParticipantsCount?: number;
  };
  compact?: boolean;
  className?: string;
}) {
  const publishedAt = ABSOLUTE_DATE_FORMATTER.format(article.time);

  const metaItems = (
    <>
      <MetaItem icon={CalendarDays} compact={compact}>
        <time dateTime={article.time.toISOString()}>{publishedAt}</time>
      </MetaItem>
      {article.solutionFor ? (
        <MetaItem icon={Swords} compact={compact}>
          {article.solutionFor.pid}
        </MetaItem>
      ) : null}
      <MetaItem icon={Tag} compact={compact}>
        {getCategoryInfo(article.category).name}
      </MetaItem>
      {article.allParticipantsCount != null ? (
        <MetaItem icon={Users} compact={compact}>
          参与者&thinsp;{article.allParticipantsCount.toLocaleString("zh-CN")}
        </MetaItem>
      ) : null}
      {article.allRepliesCount != null ? (
        <MetaItem icon={Users} compact={compact}>
          已保存评论&thinsp;{article.allRepliesCount.toLocaleString("zh-CN")}
        </MetaItem>
      ) : null}
    </>
  );

  const baseClass =
    "flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm";
  const wrapperClass = `${baseClass}${compact ? "" : " w-full"}${className ? ` ${className}` : ""}`;

  return (
    <div className={wrapperClass}>
      {compact ? (
        <>
          <UserInlineLink user={article.author} />
          {metaItems}
        </>
      ) : (
        <>
          <div className="shrink-0">
            <UserInlineLink user={article.author} />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-right">
            {metaItems}
          </div>
        </>
      )}
    </div>
  );
}

export default ArticleMetaRow;
