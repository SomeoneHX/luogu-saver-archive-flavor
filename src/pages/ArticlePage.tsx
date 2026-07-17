import * as React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ListTree, X } from "lucide-react";

import { getArticle, getArticleHistory } from "@/api/article";
import { getArticleComments } from "@/api/misc";
import { ABSOLUTE_DATE_FORMATTER } from "@/lib/time";
import { cn } from "@/lib/utils";
import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import Markdown, { type TocItem } from "@/components/markdown/markdown";
import ArticleMetaRow from "@/components/article/article-meta-row";
import { ArticleOperationPanel } from "@/components/article/article-operation-panel";
import { ArticleComments } from "@/components/article/comments";
import {
  WaybackModal,
  type WaybackDataSource,
  type WaybackTimelineItem,
} from "@/components/wayback/wayback-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundTemplate } from "@/components/error/not-found-template";
import { FileX2 } from "lucide-react";

function TocList({
  items,
  activeId,
  onNavigate,
}: {
  items: TocItem[];
  activeId: string | null;
  onNavigate: (id: string) => void;
}) {
  return (
    <ol className="article-toc-list space-y-0.5 text-sm">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={cn(
              "article-toc-entry",
              `article-toc-level-${Math.min(Math.max(item.level, 2), 6)}`,
              activeId === item.id && "article-toc-entry-active",
            )}
            onClick={() => onNavigate(item.id)}
          >
            <span className="line-clamp-1 truncate text-left" title={item.text}>
              {item.text}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export default function ArticlePage() {
  const { id = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const snapshotToken = searchParams.get("snapshot");

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["article", id],
    queryFn: () => getArticle(id),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ["article-history", id],
    queryFn: () => getArticleHistory(id),
    enabled: !!id,
  });

  const { data: commentsData } = useQuery({
    queryKey: ["article-comments-count", id],
    queryFn: () => getArticleComments(id),
    enabled: !!id,
  });

  const [tocItems, setTocItems] = React.useState<TocItem[]>([]);
  const [activeHeadingId, setActiveHeadingId] = React.useState<string | null>(
    null,
  );
  const [mobileTocOpen, setMobileTocOpen] = React.useState(false);

  const hasToc = tocItems.length > 0;
  const metaRowRef = React.useRef<HTMLDivElement | null>(null);
  const floatingMetaRef = React.useRef<HTMLDivElement | null>(null);
  const headerContainerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLElement | null>(null);
  const [isMetaPinned, setIsMetaPinned] = React.useState(false);
  const [floatingMetaHeight, setFloatingMetaHeight] = React.useState(0);

  React.useEffect(() => {
    const TOP_OFFSET = 50;
    let animationFrame = 0;
    const runCheck = () => {
      animationFrame = 0;
      const target = metaRowRef.current;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const isVisible = rect.top >= TOP_OFFSET && rect.top < viewportHeight;
      setIsMetaPinned(!isVisible);
      const node = floatingMetaRef.current;
      if (node) {
        const nextHeight = node.scrollHeight;
        setFloatingMetaHeight((prev) =>
          prev === nextHeight ? prev : nextHeight,
        );
      }
    };
    const scheduleCheck = () => {
      if (animationFrame !== 0) return;
      animationFrame = window.requestAnimationFrame(runCheck);
    };
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => scheduleCheck())
        : null;
    if (resizeObserver && metaRowRef.current) {
      resizeObserver.observe(metaRowRef.current);
    }
    runCheck();
    return () => {
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      if (animationFrame !== 0) window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
    };
  }, []);

  React.useLayoutEffect(() => {
    const node = floatingMetaRef.current;
    if (!node) return;
    const updateHeight = () => {
      const nextHeight = node.scrollHeight;
      setFloatingMetaHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };
    updateHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(node);
    return () => observer.disconnect();
  }, [article, history]);

  const snapshot = React.useMemo(() => {
    if (!snapshotToken || !history) return null;
    const target = Number.parseInt(snapshotToken, 36);
    if (Number.isNaN(target)) return null;
    return (
      history.find((h) => new Date(h.createdAt).getTime() === target) ?? null
    );
  }, [snapshotToken, history]);

  const isSnapshot = !!snapshot;
  const commentsCount = commentsData?.comments.length ?? article?.viewCount ?? 0;

  const waybackDataSource: WaybackDataSource<WaybackTimelineItem> =
    React.useMemo(
      () => ({
        key: ["wayback", id],
        fetchPage: async ({ cursor }) => {
          const all = (history ?? []).map((h) => ({
            snapshotId: new Date(h.createdAt).getTime().toString(36),
            title: h.title,
            capturedAt: h.createdAt,
          }));
          const startIndex = cursor
            ? all.findIndex((x) => x.snapshotId === cursor) + 1
            : 0;
          const page = all.slice(startIndex, startIndex + 10);
          return {
            items: page,
            hasMore: startIndex + 10 < all.length,
            nextCursor: page.length
              ? page[page.length - 1].snapshotId
              : null,
          };
        },
      }),
      [history, id],
    );

  const openWayback = React.useCallback(() => {
    window.location.hash = "#wayback";
  }, []);

  const handleSelectSnapshot = React.useCallback(
    (item: WaybackTimelineItem) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("snapshot", item.snapshotId);
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const scrollToHeading = React.useCallback((headingId: string) => {
    const target = document.getElementById(headingId);
    if (!target) return;
    const offset = window.matchMedia("(min-width: 1024px)").matches ? 96 : 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setMobileTocOpen(false);
  }, []);

  React.useEffect(() => {
    if (tocItems.length === 0) return;
    const onScroll = () => {
      const offset = window.matchMedia("(min-width: 1024px)").matches
        ? 96
        : 72;
      let candidate = tocItems[0]?.id ?? null;
      for (const item of tocItems) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - offset <= 4) candidate = item.id;
        else break;
      }
      setActiveHeadingId(candidate);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [tocItems]);

  if (isLoading) {
    return (
      <Container>
        <div className="space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Container>
    );
  }

  if (error || !article) {
    const notFound =
      error?.message?.includes("not found") ||
      error?.message?.includes("404");
    if (notFound) {
      return (
        <Container>
          <NotFoundTemplate
            Icon={FileX2}
            title="文章随风而去了"
            hint="这篇文章尚未收录、已被删除或不存在。"
          />
        </Container>
      );
    }
    return (
      <Container>
        <p className="py-20 text-center text-destructive">
          加载失败：{error?.message ?? "未知错误"}
        </p>
      </Container>
    );
  }

  const capturedAt = snapshot
    ? new Date(snapshot.createdAt)
    : new Date(article.updatedAt);
  const lastSeenAt = snapshot ? capturedAt : new Date(article.updatedAt);
  const title = isSnapshot ? snapshot.title : article.title;
  const markdownSource = isSnapshot ? snapshot.content : article.content ?? "";

  const metaArticle = {
    time: capturedAt,
    category: article.category ?? 0,
    solutionFor: article.solutionForPid
      ? { title: "", pid: article.solutionForPid, difficulty: null }
      : null,
    author: article.author
      ? {
          id: article.author.id,
          name: article.author.name,
          color: article.author.color,
          ccfLevel: article.author.ccfLevel,
          xcpcLevel: article.author.xcpcLevel,
        }
      : {
          id: article.authorId ?? 0,
          name: "未知作者",
          color: "Gray" as const,
        },
    allRepliesCount: commentsCount,
    allParticipantsCount: undefined,
  };

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "文章" },
          { label: title, href: `/a/${article.id}` },
        ]}
      />
      <div
        className={cn(
          "article-grid grid gap-8",
          "lg:grid-cols-[minmax(0,8fr)_minmax(0,3.2fr)]",
          "xl:grid-cols-[minmax(0,8fr)_minmax(0,2.7fr)]",
          hasToc
            ? "2xl:grid-cols-[minmax(0,2fr)_minmax(0,8fr)_minmax(0,3fr)]"
            : "2xl:grid-cols-[minmax(0,3fr)_minmax(0,8fr)_minmax(0,3fr)]",
        )}
      >
        {hasToc ? (
          <aside className="hidden 2xl:order-1 2xl:flex 2xl:flex-col 2xl:gap-4">
            <div className="article-toc-track">
              <div className="article-toc-card sticky top-24">
                <p className="article-toc-card-header">目录</p>
                <TocList
                  items={tocItems}
                  activeId={activeHeadingId}
                  onNavigate={scrollToHeading}
                />
              </div>
            </div>
          </aside>
        ) : null}

        {hasToc ? (
          <div className="article-floating-toc pointer-events-none hidden lg:flex lg:items-center lg:justify-end 2xl:hidden">
            <div className="article-floating-toc-hitbox">
              <span className="article-floating-toc-button">
                <ListTree className="size-4" />
              </span>
              <div className="article-floating-toc-panel">
                <div className="article-toc-card">
                  <p className="article-toc-card-header">目录</p>
                  <TocList
                    items={tocItems}
                    activeId={activeHeadingId}
                    onNavigate={scrollToHeading}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main className="order-1 flex min-w-0 flex-col gap-8 2xl:order-2">
          {isSnapshot ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
              正在查看历史快照（{ABSOLUTE_DATE_FORMATTER.format(capturedAt)}）。
              <button
                className="ml-2 underline"
                onClick={() => {
                  searchParams.delete("snapshot");
                  setSearchParams(searchParams, { replace: true });
                }}
              >
                返回当前版本
              </button>
            </div>
          ) : null}
          <header className="space-y-4" ref={headerContainerRef}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  专栏文章
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {title}
                </h1>
              </div>
              {hasToc ? (
                <button
                  type="button"
                  className="article-toc-mobile-trigger inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-foreground/40 hover:text-foreground lg:hidden"
                  onClick={() => setMobileTocOpen(true)}
                >
                  <ListTree className="h-3.5 w-3.5" /> 目录
                </button>
              ) : null}
            </div>
            <div ref={metaRowRef}>
              <ArticleMetaRow article={metaArticle} />
            </div>
          </header>

          <section
            ref={contentRef}
            className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {markdownSource ? (
              <Markdown enableHeadingAnchors onHeadings={setTocItems}>
                {markdownSource}
              </Markdown>
            ) : (
              <p className="text-sm text-muted-foreground">（暂无正文）</p>
            )}
          </section>

          <ArticleComments
            articleId={article.id}
            articleAuthorId={article.authorId}
          />
        </main>

        <aside className="order-2 hidden lg:order-2 lg:block 2xl:order-3">
          <div className="sticky top-24.25 flex flex-col gap-4">
            <div
              className="grid transition-[grid-template-rows,gap] duration-300 ease-out"
              style={{
                gridTemplateRows: `${isMetaPinned ? floatingMetaHeight : 0}px auto`,
                gap: isMetaPinned ? "14px" : "0px",
              }}
            >
              <div
                className={cn(
                  "relative h-full transition-opacity duration-300 ease-out",
                  isMetaPinned ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="h-full overflow-hidden">
                  <div ref={floatingMetaRef} className="pb-2.5">
                    <div className="mb-2.5">
                      <p className="text-sm font-medium text-muted-foreground">
                        专栏文章
                      </p>
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {title}
                      </h1>
                    </div>
                    <ArticleMetaRow article={metaArticle} compact />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "transition-transform duration-300 ease-out will-change-transform",
                  isMetaPinned ? "translate-y-[2px]" : "translate-y-0",
                )}
              >
                <ArticleOperationPanel
                  article={{
                    lid: article.id,
                    replyCount: commentsCount,
                    snapshotsCount: history?.length ?? 1,
                    capturedAt,
                    lastSeenAt,
                  }}
                  onOpenWayback={openWayback}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {tocItems.length > 0 ? (
        <div
          className={cn(
            "article-mobile-toc fixed inset-0 z-50 bg-background/60 px-4 py-6 backdrop-blur lg:hidden",
            mobileTocOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <div className="mx-auto w-full max-w-sm rounded-3xl border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-base font-semibold">目录</span>
              <button
                type="button"
                className="rounded-full border p-1 text-muted-foreground transition hover:text-foreground"
                onClick={() => setMobileTocOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[80dvh] overflow-y-auto pr-1">
              <TocList
                items={tocItems}
                activeId={activeHeadingId}
                onNavigate={scrollToHeading}
              />
            </div>
          </div>
        </div>
      ) : null}

      <WaybackModal
        dataSource={waybackDataSource}
        header={{
          title: "时光机",
          description: "翻阅历史快照，观察内容的演变。",
        }}
        onSelectSnapshot={handleSelectSnapshot}
      />
    </Container>
  );
}
