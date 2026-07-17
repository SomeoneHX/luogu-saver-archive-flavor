import { Calendar } from "lucide-react";

import { ABSOLUTE_DATE_FORMATTER } from "@/lib/time";
import MetaItem from "@/components/meta/meta-item";
import { UserInlineLink, type UserBasicInfo } from "@/components/user/user-inline-link";

function PasteMetaRow({
  paste,
  compact = false,
  className,
}: {
  paste: {
    time: Date;
    author: UserBasicInfo;
  };
  compact?: boolean;
  className?: string;
}) {
  const publishedAt = ABSOLUTE_DATE_FORMATTER.format(paste.time);

  const metaItems = (
    <MetaItem icon={Calendar} compact={compact}>
      <time dateTime={paste.time.toISOString()}>{publishedAt}</time>
    </MetaItem>
  );

  const baseClass =
    "flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-sm";
  const wrapperClass = `${baseClass}${compact ? "" : " w-full"}${className ? ` ${className}` : ""}`;

  return (
    <div className={wrapperClass}>
      {compact ? (
        <>
          <UserInlineLink user={paste.author} />
          {metaItems}
        </>
      ) : (
        <>
          <div className="shrink-0">
            <UserInlineLink user={paste.author} />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-right">
            {metaItems}
          </div>
        </>
      )}
    </div>
  );
}

export default PasteMetaRow;
