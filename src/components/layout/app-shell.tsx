import * as React from "react";
import {
  Gavel,
  Home,
  Layers,
  PanelLeft,
  Search,
  Telescope,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AppFooter } from "@/components/layout/app-footer";
import {
  BreadcrumbProvider,
  useBreadcrumbContext,
  type BreadcrumbEntry,
} from "@/components/layout/breadcrumb-context";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const NAV_ITEMS = [
  {
    title: "首页",
    href: "/",
    icon: Home,
  },
  {
    title: "探索",
    href: "/explore",
    icon: Telescope,
  },
  {
    title: "最近",
    href: "/recent",
    icon: Layers,
  },
  {
    title: "陶片放逐",
    href: "/judgement",
    icon: Gavel,
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
}

function InternalLink({
  href,
  className,
  children,
  onClick,
  tabIndex,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  tabIndex?: number;
}) {
  const navigate = useNavigate();
  return (
    <a
      href={href}
      className={className}
      tabIndex={tabIndex}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
          return;
        }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

const desktopLabelClass = cn(
  "ml-3 whitespace-nowrap text-base/1 transition-opacity duration-200 ease-in-out",
  "opacity-0 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100",
);

function SidebarBrand({ variant }: { variant: "desktop" | "mobile" }) {
  return (
    <InternalLink
      href="/"
      className={cn(
        "flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40",
        variant === "desktop" && "pointer-events-none",
      )}
      tabIndex={variant === "desktop" ? -1 : 0}
    >
      <img
        src={`${import.meta.env.BASE_URL}piterator.svg`}
        alt="Piterator"
        className="size-5"
      />
      {variant === "desktop" ? (
        <span className={desktopLabelClass}>洛谷仓库</span>
      ) : (
        <span className="ml-3 text-base">洛谷仓库</span>
      )}
    </InternalLink>
  );
}

function TopBarBreadcrumbs({ pathname }: { pathname: string }) {
  const { crumbs } = useBreadcrumbContext();
  const breadcrumbs = React.useMemo<BreadcrumbEntry[]>(
    () => crumbs.length > 0 || pathname === "/" ? crumbs : createBreadcrumbs(pathname),
    [crumbs, pathname],
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem>
                {crumb.href && !isLast ? (
                  <BreadcrumbLink asChild>
                    <InternalLink href={crumb.href}>{crumb.label}</InternalLink>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {!isLast ? <BreadcrumbSeparator /> : null}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function createBreadcrumbs(pathname: string): BreadcrumbEntry[] {
  const sanitized = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const segments = sanitized.split("/").filter(Boolean);

  const crumbs: BreadcrumbEntry[] = [{ label: "首页", href: "/" }];

  if (segments.length === 0) {
    return crumbs;
  }

  const [first, second] = segments;

  crumbs.push({ label: toTitleCase(first) });
  if (second) {
    crumbs.push({ label: decodeURIComponent(second) });
  }

  return crumbs;
}

function toTitleCase(value: string) {
  if (!value) return value;
  const lower = value.replace(/[-_]/g, " ");
  return lower.replace(/\b\w/g, (char) => char.toUpperCase());
}

function SearchBox() {
  const navigate = useNavigate();
  const [q, setQ] = React.useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form onSubmit={submit} className="relative hidden w-full max-w-xs sm:block">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索文章…"
        className="pl-8"
      />
    </form>
  );
}

function TopBar({
  isMobile,
  onOpenSidebar,
  pathname,
}: {
  isMobile: boolean;
  onOpenSidebar: () => void;
  pathname: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="-ml-1"
            aria-label="打开导航"
          >
            <PanelLeft className="size-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <TopBarBreadcrumbs pathname={pathname} />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchBox />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <div className="pointer-events-none fixed inset-y-0 left-0 z-40 hidden md:flex">
      <aside className="group/sidebar pointer-events-auto flex h-full w-15.25 flex-col border-r bg-background/80 px-2 py-6 shadow-sm backdrop-blur transition-[width] duration-300 ease-in-out hover:w-56">
        <div className="flex flex-1 flex-col gap-6 overflow-hidden">
          <SidebarBrand variant="desktop" />
          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <InternalLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group/nav flex items-center overflow-hidden rounded-full p-3 text-sm transition-colors duration-200 focus-visible:text-foreground focus-visible:outline-none",
                    active
                      ? "bg-indigo-500/85 !text-white"
                      : "text-muted-foreground hover:bg-muted/85 hover:text-foreground",
                  )}
                >
                  <Icon className="size-5 shrink-0" size={20} aria-hidden />
                  <span className={desktopLabelClass}>{item.title}</span>
                </InternalLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}

function MobileSidebar({
  open,
  onOpenChange,
  pathname,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 border-r p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>导航菜单</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col overflow-y-auto px-4 py-6">
          <SidebarBrand variant="mobile" />
          <nav className="mt-6 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <InternalLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-full p-3 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                    active
                      ? "bg-indigo-500/85 text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={onNavigate}
                >
                  <Icon className="size-5 shrink-0" size={20} aria-hidden />
                  <span className="ml-3 whitespace-nowrap text-base/1">
                    {item.title}
                  </span>
                </InternalLink>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const handleOpenSidebar = React.useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const onNavigate = React.useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  return (
    <BreadcrumbProvider key={pathname}>
      <div className="bg-background text-foreground">
        <DesktopSidebar pathname={pathname} />
        <MobileSidebar
          open={mobileSidebarOpen}
          onOpenChange={setMobileSidebarOpen}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <div
          className={cn(
            "flex min-h-svh flex-col transition-[margin-left] duration-300 ease-in-out",
            "md:ml-15.25",
          )}
        >
          <TopBar
            isMobile={isMobile}
            onOpenSidebar={handleOpenSidebar}
            pathname={pathname}
          />
          <div className="flex-1">{children}</div>
          <AppFooter className="mt-8" />
        </div>
      </div>
    </BreadcrumbProvider>
  );
}
