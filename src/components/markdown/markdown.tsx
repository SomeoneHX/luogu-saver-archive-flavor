import * as React from "react";
import { Link as LinkIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import remarkLuoguFlavor from "@/lib/remark-lda-lfm";
import { cn, withBase } from "@/lib/utils";

import MarkdownCodeBlock from "./markdown-code-block";
import MarkdownSummary from "./markdown-summary";

import "katex/dist/katex.min.css";

export type MarkdownMentionContext = {
  kind: "discussion";
  discussionId: number;
  relativeReplyId?: number;
  discussionAuthors: number[];
};

type MarkdownProps = {
  children: string;
  originalUrl?: string;
  enableHeadingAnchors?: boolean;
  onHeadings?: (items: TocItem[]) => void;
  compact?: boolean;
  mentionContext?: MarkdownMentionContext;
};

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  if (!text) return "section";
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9一-龥\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}

function isIntrinsicElement(
  node: React.ReactNode,
  tag: keyof React.JSX.IntrinsicElements,
): node is React.ReactElement {
  return React.isValidElement(node) && node.type === tag;
}

function lineSetFromDataAttribute(dataAttr?: string): Set<number> {
  const lineSet = new Set<number>();
  if (!dataAttr) return lineSet;

  const parts = dataAttr.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) {
          lineSet.add(i);
        }
      }
    } else {
      const lineNum = parseInt(part, 10);
      if (!isNaN(lineNum)) {
        lineSet.add(lineNum);
      }
    }
  }

  return lineSet;
}

export default function Markdown({
  children,
  originalUrl,
  enableHeadingAnchors = false,
  onHeadings,
  compact = false,
}: MarkdownProps) {
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!enableHeadingAnchors || !contentRef.current) return;
    const root = contentRef.current;
    const counter: Record<string, number> = {};
    const headings = root.querySelectorAll<HTMLElement>(
      "h1, h2, h3, h4, h5, h6",
    );
    headings.forEach((heading) => {
      const text = heading.textContent?.trim() ?? "";
      const base = slugify(text);
      const count = counter[base] ?? 0;
      counter[base] = count + 1;
      const id = count === 0 ? base : `${base}-${count}`;
      const level = Number(heading.tagName.substring(1));
      heading.setAttribute("id", id);
      heading.setAttribute("data-heading-id", id);
      heading.setAttribute("data-heading-text", text);
      heading.setAttribute("data-heading-level", String(level));
      heading.setAttribute("data-md-heading", "true");
      heading.classList.add("markdown-heading-anchor-wrapper");
    });
    const items: TocItem[] = Array.from(headings).map((h) => ({
      id: h.getAttribute("id") ?? "",
      text: h.getAttribute("data-heading-text") ?? h.textContent?.trim() ?? "",
      level: Number(h.getAttribute("data-heading-level") ?? "2"),
    }));
    onHeadings?.(items);
  }, [children, enableHeadingAnchors, onHeadings]);

  return (
    <div
      ref={contentRef}
      className={cn("markdown-body", compact && "markdown-body-compact")}
    >
      <ReactMarkdown
        remarkPlugins={[
          [remarkMath, {}],
          [remarkLuoguFlavor, { linkOriginalUrl: originalUrl }],
        ]}
        rehypePlugins={[
          rehypeKatex,
          [rehypeHighlight, { detect: false, ignoreMissing: true }],
        ]}
        skipHtml
        components={{
          p(props) {
            const { node, className, children, ...rest } = props;
            void node;
            const newClassName = cn(className ?? "", "fake-p");
            return (
              <div className={newClassName} {...rest}>
                {children}
              </div>
            );
          },
          pre(props) {
            const { node, children, ...rest } = props;
            void node;
            if (isIntrinsicElement(children, "code")) {
              const codeProps =
                children.props as React.JSX.IntrinsicElements["code"] & {
                  "data-ls-line-numbers"?: boolean;
                  "data-ls-highlight-lines"?: string;
                };
              const languageMatch = /language-([\w-]+)/.exec(
                codeProps.className ?? "",
              );
              const language = languageMatch?.[1] ?? undefined;
              return (
                <MarkdownCodeBlock
                  className={codeProps.className}
                  language={language}
                  showLineNumbers={codeProps["data-ls-line-numbers"] === true}
                  highlightLines={lineSetFromDataAttribute(
                    codeProps["data-ls-highlight-lines"],
                  )}
                >
                  {codeProps.children}
                </MarkdownCodeBlock>
              );
            }
            return <pre {...rest}>{children}</pre>;
          },
          a(props) {
            const { node, href, children, ...rest } = props;
            void node;
            const anyProps = rest as Record<string, unknown>;
            const mentionUid = anyProps["data-ls-user-mention"] as
              | string
              | undefined;
            if (mentionUid) {
              return (
                <a
                  href={withBase(`/u/${mentionUid}`)}
                  className="ls-user-mention clear-markdown-style font-medium text-luogu-blue hover:underline"
                  onClick={(e) => {
                    if (
                      e.metaKey ||
                      e.ctrlKey ||
                      e.shiftKey ||
                      e.button !== 0
                    )
                      return;
                    e.preventDefault();
                    window.history.pushState({}, "", withBase(`/u/${mentionUid}`));
                    window.dispatchEvent(new PopStateEvent("popstate"));
                  }}
                >
                  {children}
                </a>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                {...rest}
              >
                {children}
              </a>
            );
          },
          summary(props) {
            const { node, children, ...rest } = props;
            void node;
            return <MarkdownSummary {...rest}>{children}</MarkdownSummary>;
          },
          table(props) {
            const { node, children, ...rest } = props;
            void node;
            return (
              <div className="fake-p max-w-full overflow-x-auto">
                <table {...rest}>{children}</table>
              </div>
            );
          },
          iframe(props) {
            const { node, ...rest } = props;
            void node;
            return <iframe {...rest} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export { LinkIcon };
