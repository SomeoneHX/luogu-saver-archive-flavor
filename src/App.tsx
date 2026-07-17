import * as React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/components/query/query-provider";
import HomePage from "@/pages/HomePage";
import RecentPage from "@/pages/RecentPage";
import ExplorePage from "@/pages/ExplorePage";
import SearchPage from "@/pages/SearchPage";
import ArticlePage from "@/pages/ArticlePage";
import UserPage from "@/pages/UserPage";
import DocPage from "@/pages/DocPage";
import PastePage from "@/pages/PastePage";
import {
  DiscussionPlaceholder,
} from "@/pages/PlaceholderPages";
import JudgementPage from "@/pages/JudgementPage";
import { NotFoundTemplate } from "@/components/error/not-found-template";
import { FileX2 } from "lucide-react";

function Shell() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteTitle({ title }: { title: string }) {
  React.useEffect(() => {
    document.title = `${title} - 洛谷仓库`;
  }, [title]);
  return null;
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "");

const router = createBrowserRouter(
  [
    {
      element: <Shell />,
      children: [
      { path: "/", element: <><RouteTitle title="首页" /><HomePage /></> },
      { path: "/recent", element: <><RouteTitle title="最近" /><RecentPage /></> },
      { path: "/explore", element: <><RouteTitle title="探索" /><ExplorePage /></> },
      { path: "/search", element: <><RouteTitle title="搜索" /><SearchPage /></> },
      { path: "/a/:id", element: <><ScrollToTop /><ArticlePage /></> },
      { path: "/u/:id", element: <><ScrollToTop /><UserPage /></> },
      { path: "/d/:id", element: <><RouteTitle title="讨论" /><DiscussionPlaceholder /></> },
      { path: "/p/:id", element: <><ScrollToTop /><RouteTitle title="剪贴板" /><PastePage /></> },
      { path: "/judgement", element: <><RouteTitle title="陶片放逐" /><JudgementPage /></> },
      { path: "/about", element: <><RouteTitle title="关于" /><DocPage /></> },
      { path: "/takedown", element: <><RouteTitle title="删除政策" /><DocPage /></> },
      { path: "/terms", element: <><RouteTitle title="用户协议" /><DocPage /></> },
      { path: "/privacy", element: <><RouteTitle title="隐私政策" /><DocPage /></> },
      { path: "/contact", element: <><RouteTitle title="联系我们" /><DocPage /></> },
      { path: "/join", element: <><RouteTitle title="招贤纳才" /><DocPage /></> },
      {
        path: "*",
        element: (
          <NotFoundTemplate
            Icon={FileX2}
            title="页面走丢了"
            hint="你访问的页面不存在。"
            action={{ label: "返回首页", href: "/" }}
          />
        ),
      },
    ],
  },
],
{ basename: routerBasename });

export default function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ThemeProvider>
  );
}
