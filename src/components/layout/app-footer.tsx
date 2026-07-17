import { Scale, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.8 1.08.8 2.18v3.23c0 .31.21.67.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

const LINKS: { label: string; href?: string }[] = [
  { label: "关于", href: "/about" },
  { label: "删除政策", href: "/takedown" },
  { label: "用户协议", href: "/terms" },
  { label: "隐私政策", href: "/privacy" },
  { label: "联系我们", href: "/contact" },
  { label: "招贤纳才", href: "/join" },
];
const REPO_URL = "https://github.com/oi-zone/luogu-archive";
const QQ_GROUP_URL =
  "https://qm.qq.com/cgi-bin/qm/qr?k=Ri6rACS0-el0LZO83yfbwLp-KV3_Ov34&jump_from=webapi&authKey=uhOW0unvRiSw9ftcWonXt32O6qVa5A4oZbQ0XcqcqamLLxtjX2RnfMU7ngJHs4Wn";

export function AppFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t bg-background/70", className)}>
      <div className="mx-auto flex w-full flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.href ?? "#"}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <GithubIcon className="relative -top-0.5 me-0.5 inline-block size-3.75" />
            GitHub&thinsp;仓库
          </a>
          <span>
            <Scale className="relative -top-0.5 me-0.75 inline-block size-3.75" />
            基于&thinsp;
            <a
              href={`${REPO_URL}?tab=AGPL-3.0-1-ov-file#readme`}
              target="_blank"
              rel="noreferrer noopener"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              AGPL-3.0&thinsp;协议
            </a>
            开源
          </span>
          <a
            href={QQ_GROUP_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Users className="relative -top-0.5 me-0.75 inline-block size-3.75" />
            用户&thinsp;QQ&thinsp;群&thinsp;<code>149774448</code>
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-muted-foreground">
            &copy; 2025 全体&thinsp;oi.zone&thinsp;开发者
          </span>
        </div>
      </div>
    </footer>
  );
}
