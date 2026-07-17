import { BadgeCheck, PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "../ui/badge";

export type UserColor =
  | "Gray"
  | "Blue"
  | "Green"
  | "Orange"
  | "Red"
  | "Purple"
  | "Cheater";

export type UserBasicInfo = {
  id: number;
  name: string;
  badge?: string | null;
  color: UserColor | string;
  ccfLevel?: number;
  xcpcLevel?: number;
};

export function ccfLevelToColor(level: number): string {
  if (level >= 8) return "orange";
  if (level >= 6) return "blue";
  if (level >= 3) return "green";
  return "cheater";
}

export function xcpcLevelToColor(level: number): string {
  if (level >= 8) return "orange";
  if (level >= 6) return "blue";
  if (level >= 3) return "green";
  return "cheater";
}

function colorKey(color: string): string {
  return `text-luogu-${color.toLowerCase()}`;
}

function bgColorKey(color: string): string {
  return `bg-luogu-${color.toLowerCase()}`;
}

export const USER_COLOR_CLASS: Record<string, string> = {
  Gray: "text-luogu-gray",
  Blue: "text-luogu-blue",
  Green: "text-luogu-green",
  Orange: "text-luogu-orange",
  Red: "text-luogu-red",
  Purple: "text-luogu-purple",
  Cheater: "text-luogu-cheater",
};

export function UserInlineLink({
  className,
  user,
  compact = false,
  avatar = true,
  nameColorOverride,
  preventPointerEvents = false,
  tabIndex,
}: {
  className?: string;
  user: UserBasicInfo;
  compact?: boolean;
  avatar?: boolean;
  nameColorOverride?: string;
  preventPointerEvents?: boolean;
  tabIndex?: number;
}) {
  return (
    <a
      href={`/u/${user.id}`}
      className={cn(
        "clear-markdown-style inline-flex items-center rounded-full transition-colors duration-200 hover:bg-primary/7",
        className,
        { "ps-0.25": !avatar },
        preventPointerEvents ? "pointer-events-none" : "pointer-events-auto",
      )}
      tabIndex={tabIndex}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        window.history.pushState({}, "", `/u/${user.id}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    >
      <UserInlineContent
        user={user}
        compact={compact}
        avatar={avatar}
        nameColorOverride={nameColorOverride}
      />
    </a>
  );
}

export default UserInlineLink;

export function UserInlineDisplay({
  user,
  compact = false,
  avatar = true,
  className,
  nameColorOverride,
}: {
  user: UserBasicInfo;
  compact?: boolean;
  avatar?: boolean;
  className?: string;
  nameColorOverride?: string;
}) {
  return (
    <span
      className={cn(
        "clear-markdown-style inline-flex items-center rounded-full",
        className,
      )}
    >
      <UserInlineContent
        user={user}
        compact={compact}
        avatar={avatar}
        noStartSpace={!avatar}
        nameColorOverride={nameColorOverride}
      />
    </span>
  );
}

function UserInlineContent({
  user,
  compact,
  avatar,
  noStartSpace = false,
  nameColorOverride,
}: {
  user: UserBasicInfo;
  compact: boolean;
  avatar: boolean;
  noStartSpace?: boolean;
  nameColorOverride?: string;
}) {
  const color = String(user.color);
  const displayBadge =
    user.badge ||
    (color.toLowerCase() === "purple"
      ? "管理员"
      : color.toLowerCase() === "cheater"
        ? "作弊者"
        : null);
  return (
    <>
      {avatar ? (
        <Avatar
          className={cn("bg-muted", compact ? "ms-0.5 size-5" : "size-6")}
        >
          <AvatarImage
            src={`https://cdn.luogu.com.cn/upload/usericon/${user.id}.png`}
            alt={user.name}
          />
          <AvatarFallback className="text-xs font-semibold">
            {user.name.slice(0, 1)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <span
        className={cn(
          "text-base font-medium",
          noStartSpace
            ? undefined
            : avatar
              ? compact
                ? "ms-1"
                : "ms-1.25"
              : "ms-0.75",
          displayBadge
            ? "me-1.25"
            : (user.ccfLevel ?? 0) !== 0
              ? "me-0.75"
              : (user.xcpcLevel ?? 0) !== 0
                ? "me-0.5"
                : compact
                  ? "me-1"
                  : "me-1.5",
          nameColorOverride ?? colorKey(color),
        )}
      >
        {user.name}
      </span>

      {displayBadge && (
        <Badge
          className={cn(
            "text-inverse",
            compact && "-ms-0.25",
            (user.xcpcLevel ?? 0) !== 0 && (user.ccfLevel ?? 0) === 0
              ? "me-0.5"
              : "me-0.75",
            bgColorKey(color),
          )}
        >
          {displayBadge}
        </Badge>
      )}

      {(user.ccfLevel ?? 0) !== 0 && (
        <BadgeCheck
          className={cn(
            "size-5",
            compact && "-ms-0.25",
            (user.xcpcLevel ?? 0) !== 0 ? "-me-0.25" : "me-0.5",
            colorKey(ccfLevelToColor(user.ccfLevel ?? 0)),
          )}
          strokeWidth={2}
        />
      )}

      {(user.xcpcLevel ?? 0) !== 0 && (
        <PartyPopper
          className={cn(
            "relative top-0.25 me-0.25 size-4.5",
            compact && "-ms-0.25",
            colorKey(xcpcLevelToColor(user.xcpcLevel ?? 0)),
          )}
          strokeWidth={2.2}
        />
      )}
    </>
  );
}
