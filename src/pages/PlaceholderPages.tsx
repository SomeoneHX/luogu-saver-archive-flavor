import { MessagesSquare, type LucideIcon } from "lucide-react";

import Container from "@/components/layout/container";
import { NotFoundTemplate } from "@/components/error/not-found-template";

export default function PlaceholderPage({
  title,
  message,
  icon: Icon,
}: {
  title: string;
  message: string;
  icon: LucideIcon;
}) {
  return (
    <Container>
      <NotFoundTemplate Icon={Icon} title={title} hint={message} />
    </Container>
  );
}

export function DiscussionPlaceholder() {
  return (
    <PlaceholderPage
      title="讨论功能未开放"
      message="洛谷仓库目前仅收录文章存档，讨论模块暂不可用。"
      icon={MessagesSquare}
    />
  );
}

export function PastePlaceholder() {
  return (
    <PlaceholderPage
      title="剪贴板功能未开放"
      message="洛谷仓库目前仅收录文章存档，云剪贴板模块暂不可用。"
      icon={MessagesSquare}
    />
  );
}
