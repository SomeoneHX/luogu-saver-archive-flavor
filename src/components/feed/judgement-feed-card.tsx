import type { ApiJudgementRecord } from "@/types/api";
import { getPermissionNames } from "@/lib/judgement";

import FeedCardTemplate from "./feed-card-template";

export function JudgementFeedCard({ record }: { record: ApiJudgementRecord }) {
  const added = getPermissionNames(record.added_permission);
  const revoked = getPermissionNames(record.revoked_permission);
  const time = new Date(record.created_at);
  const reason = record.reason?.trim() || "没道理，就这样。";

  return (
    <FeedCardTemplate
      href="/judgement"
      kind="judgement"
      time={time}
      content={
        <>
          {added.length > 0 || revoked.length > 0 ? (
            <div className="text-base font-semibold">
              <ul>
                {added.map((name) => (
                  <li key={`add-${name}`}>授予 <code>{name}</code> 权限</li>
                ))}
                {revoked.map((name) => (
                  <li key={`rev-${name}`}>撤销 <code>{name}</code> 权限</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-1">{reason}</div>
        </>
      }
      contentMaxLines={6}
      user={{
        id: record.user.uid,
        name: record.user.name,
        badge: record.user.badge,
        color: record.user.color,
        ccfLevel: record.user.ccfLevel,
        xcpcLevel: record.user.xcpcLevel,
      }}
    />
  );
}
