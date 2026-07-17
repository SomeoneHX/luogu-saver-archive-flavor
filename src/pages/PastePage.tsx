import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getPaste } from "@/api/misc";
import { cn } from "@/lib/utils";
import Container from "@/components/layout/container";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import Markdown from "@/components/markdown/markdown";
import PasteMetaRow from "@/components/paste/paste-meta-row";
import { PasteOperationPanel } from "@/components/paste/paste-operation-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { NotFoundTemplate } from "@/components/error/not-found-template";
import { FileX2 } from "lucide-react";

export default function PastePage() {
  const { id = "" } = useParams();

  const {
    data: paste,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["paste", id],
    queryFn: () => getPaste(id),
    enabled: !!id,
  });

  const metaRowRef = React.useRef<HTMLDivElement | null>(null);
  const floatingMetaRef = React.useRef<HTMLDivElement | null>(null);
  const headerContainerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLElement | null>(null);
  const [isMetaPinned, setIsMetaPinned] = React.useState(false);
  const [floatingMetaHeight, setFloatingMetaHeight] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
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
    if (typeof window === "undefined") return;
    const node = floatingMetaRef.current;
    if (!node) return;
    const updateHeight = () => {
      const nextHeight = node.scrollHeight;
      setFloatingMetaHeight((prev) =>
        prev === nextHeight ? prev : nextHeight,
      );
    };
    updateHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => updateHeight());
    observer.observe(node);
    return () => observer.disconnect();
  }, [paste]);

  if (isLoading) {
    return (
      <Container>
        <div className="space-y-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-10 w-3/4" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </Container>
    );
  }

  if (error || !paste) {
    return (
      <Container>
        <NotFoundTemplate
          Icon={FileX2}
          title="剪贴板未找到"
          hint={
            error instanceof Error
              ? error.message
              : "指定的云剪贴板不存在或无法访问。"
          }
        />
      </Container>
    );
  }

  const time = new Date(paste.createdAt);
  const pasteMeta = {
    time,
    id: paste.id,
    content: paste.content ?? null,
    author: paste.author
      ? {
          id: paste.author.id,
          name: paste.author.name,
          color: paste.author.color,
          ccfLevel: paste.author.ccfLevel,
          xcpcLevel: paste.author.xcpcLevel,
        }
      : { id: 0, name: "未知用户", color: "Gray" as const, ccfLevel: 0, xcpcLevel: 0 },
  };

  return (
    <Container>
      <BreadcrumbSetter
        trail={[
          { label: "首页", href: "/" },
          { label: "云剪贴板" },
          { label: paste.id, href: `/p/${paste.id}` },
        ]}
      />

      {paste.deleted ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-300">
          该剪贴板已被删除（{paste.deleteReason || "管理员删除"}），以下内容仅供参考。
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-8",
          "lg:grid-cols-[minmax(0,8fr)_minmax(0,3.2fr)]",
          "xl:grid-cols-[minmax(0,8fr)_minmax(0,2.7fr)]",
          "2xl:grid-cols-[minmax(0,3fr)_minmax(0,8fr)_minmax(0,3fr)]",
        )}
      >
        <aside className="hidden 2xl:flex 2xl:flex-col 2xl:gap-4" />

        <main className="order-1 flex flex-col gap-8 2xl:order-2">
          <section className="flex flex-col gap-6">
            <header className="space-y-4" ref={headerContainerRef}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    云剪贴板
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {paste.id}
                  </h1>
                </div>
              </div>

              <div ref={metaRowRef}>
                <PasteMetaRow paste={pasteMeta} />
              </div>
            </header>

            <div className="lg:hidden">
              <PasteOperationPanel paste={pasteMeta} />
            </div>

            <section
              ref={contentRef}
              className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {paste.content !== null && paste.content !== undefined ? (
                <Markdown originalUrl={`https://www.luogu.com.cn/paste/${paste.id}`}>
                  {paste.content}
                </Markdown>
              ) : (
                <p className="text-sm text-muted-foreground">啊嘞？！云剪贴板不见了！</p>
              )}
            </section>
          </section>
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
                <div className="pointer-events-none absolute inset-0" />
                <div className="h-full overflow-hidden">
                  <div ref={floatingMetaRef} className="pb-2.5">
                    <div className="mb-2.5">
                      <p className="text-sm font-medium text-muted-foreground">
                        云剪贴板
                      </p>
                      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        {paste.id}
                      </h1>
                    </div>
                    <PasteMetaRow paste={pasteMeta} compact />
                    <hr className="mt-7" />
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "transition-transform duration-300 ease-out will-change-transform",
                  isMetaPinned ? "translate-y-[2px]" : "translate-y-0",
                )}
              >
                <PasteOperationPanel paste={pasteMeta} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
