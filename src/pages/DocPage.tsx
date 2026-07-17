import * as React from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { DOCS } from "@/pages/docs";
import { BreadcrumbSetter } from "@/components/layout/breadcrumb-context";
import { NotFoundTemplate } from "@/components/error/not-found-template";
import { withBase } from "@/lib/utils";
import { FileX2 } from "lucide-react";

function isInternalHref(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith("/") && !href.startsWith("//");
}

function InternalLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  const onClick = React.useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!isInternalHref(href)) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      window.history.pushState({}, "", withBase(href!));
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    [href],
  );
  return (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
}

export default function DocPage() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/+/, "").split("/")[0] ?? "";
  const doc = DOCS[slug];

  if (!doc) {
    return (
      <NotFoundTemplate
        Icon={FileX2}
        title="页面走丢了"
        hint="你访问的文档不存在。"
        action={{ label: "返回首页", href: "/" }}
      />
    );
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-10 sm:px-6 lg:px-8">
      <article className="w-full max-w-4xl">
        <BreadcrumbSetter
          trail={[
            { label: "首页", href: "/" },
            { label: doc.title, href: `/${slug}` },
          ]}
        />
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <InternalLink href={href}>{children}</InternalLink>
              ),
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
