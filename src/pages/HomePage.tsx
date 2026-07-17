import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { FeedGrid } from "@/components/feed/feed-grid";
import { LinkIntake } from "@/components/link-intake";

export default function HomePage() {
  return (
    <Container>
      <BreadcrumbSetter trail={[{ label: "首页", href: "/" }]} />
      <div className="mb-10 mt-6">
        <LinkIntake />
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">社区精选</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          实时汇总高热度的文章、帖子、云剪贴板与陶片。
        </p>
      </div>
      <FeedGrid />
    </Container>
  );
}
