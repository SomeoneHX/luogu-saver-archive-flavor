# 迁移计划：luogu-archive 前端 → 基于 luogu-saver-next API 的纯前端 SPA

## 概述

将 luogu-archive 的 Next.js 前端提取为纯静态 SPA（React + Vite），后端数据源切换为 **luogu-saver-next（只读，不可修改）**。保留完整 UI 外观。

**关键约束**：luogu-saver-next 是只读后端，**不得修改/新增任何端点或数据表**。所有数据获取只能复用其现有 API，缺失能力由前端自行实现（前端分页、占位框架等）。

---

## 一、luogu-saver-next 现有 API 对照（全部只读可调用）

| luogu-archive 需要的功能 | luogu-saver-next 端点 | 适配说明 |
|-------------------------|----------------------|---------|
| 文章详情（含渲染内容） | ✅ `GET /article/query/:id` | 字段名不同，需映射 |
| 文章评论 | ✅ `GET /article/comments/:id` | 返回扁平数组（非游标分页），前端做分页 |
| 文章快照历史 | ✅ `GET /article/history/:id` | 返回全部版本数组，前端自己做滚动分页 |
| 最近文章列表（Feed） | ✅ `GET /article/recent?count=&updated_after=&truncated_count=` | 直接驱动首页信息流，前端做无限滚动 |
| 相关/推荐文章 | ✅ `GET /article/relevant/:id` 或 `GET /plaza/get` | 可作「推荐」区 |
| 文章总数 | ✅ `GET /article/count` | 统计展示 |
| 剪贴板详情 | ✅ `GET /paste/query/:id` | luogu.me 不需要，前端留占位框架 |
| 剪贴板总数 | ✅ `GET /paste/count` | 同上 |
| 用户资料 | ✅ `GET /user/query/:id` | 无 timeline，前端不展示时间线 |
| 搜索 | ✅ `GET /search/articles` | 仅文章搜索 |
| Markdown 渲染 | ✅ `POST /markdown/render` | 服务端渲染（注意：前端也可改用 react-markdown 本地渲染） |
| 刷新/保存任务 | ✅ `POST /task/create` | 触发后端重新抓取（写操作，但属既有端点） |
| 讨论/帖子/回复 | ⏸ 无端点 | luogu.me 无此模块，前端留占位框架 |
| 用户动态时间线 | ⏸ 无端点 | luogu.me 无此需求，留占位 |
| 条目解析（entries） | ⏸ 无端点 | feed 只展示文章，无需混合类型解析 |
| 裁决 Ostraka | ⏸ 无端点 | luogu.me 不需要，留占位 |

---

## 三、前端迁移步骤

### Phase 1: 项目初始化（1天）

- 用 Vite + React + TypeScript 创建新项目
- 安装依赖：`react-router-dom`, `@tanstack/react-query`, `tailwindcss v4`, `lucide-react`, `react-markdown`, `rehype-highlight`, `rehype-katex`, `remark-math`, `framer-motion`, `@radix-ui/*`, `@floating-ui/react`, `next-themes`（有 React 兼容版本 `@radix-ui/themes`），`class-variance-authority`, `clsx`, `tailwind-merge`
- 配置 Tailwind v4（从 `apps/web/app/globals.css` 复制 `@theme`, `@layer`, `@custom-variant`）

### Phase 2: 移植可复用的纯客户端代码（2天）

直接复制以下文件（仅改 import path），零改动：

```
components/ui/*                → shadcn/ui 组件（45个 use client 文件）
components/feed/*              → Feed 客户端组件
components/markdown/*.tsx       → Markdown 渲染（markdown.tsx 无 use client，需加）
components/markdown/*.css       → 样式文件
lib/*                           → 工具函数
hooks/*                         → 自定义 hooks
types/*                         → 类型定义
contexts/*                      → React 上下文
```

注意：所有 `import "next/*"` 替换为 React 等效或删除。

### Phase 3: 构建路由结构（2天）

| luogu-archive 路由 | React Router 映射 | 说明 |
|--------------------|-------------------|------|
| `/` | `/` | Home Feed（仅文章） |
| `/recent` | `/recent` | 最近（仅文章） |
| `/explore` | `/explore` | 探索（仅文章，基于 viewCount） |
| `/a/:id` | `/a/:id` | 文章详情 |
| `/a/:id/:snapshot` | `/a/:id/:snapshot` | 文章快照（或 `?snapshot=`，对应 `/article/history/:id`） |
| `/d/:id` | `/d/:id` | 讨论详情（**占位框架，暂不可点**） |
| `/p/:id` | `/p/:id` | 剪贴板（**占位框架，暂不可点**） |
| `/u/:id` | `/u/:id` | 用户主页 |
| `/about` etc | `/about` etc | 文档页（静态 MDX → 预编译 HTML） |

并行路由（`@content`, `@titleRow`, `@metaRow`, `@metaCard`, `@operationPanel`, `@replies`）改为在 layout 组件中按位置组合渲染。讨论/剪贴板相关的并行 slot 在占位阶段只渲染空壳。

### Phase 4: 重写服务端页面为客户端数据获取（2天）

原 15 个 Server Component → Client Component 加 `useEffect`/React Query：

| 原文件 | 新策略 |
|--------|-------|
| `app/page.tsx` | Client + React Query `useInfiniteQuery`（`/article/recent`，按 `updatedAt` 前端分页） |
| `app/(trending)/recent/page.tsx` | Client + fetch（`/article/recent`） |
| `app/(trending)/explore/page.tsx` | Client + fetch（用 `/search/articles` 或 `/plaza/get` 热门） |
| `app/(user)/u/[id]/page.tsx` | Client + React Query（`/user/query/:id`） |
| `app/(article)/a/[id]/*/page.tsx` | Client + React Query（`/article/query/:id`, `/article/comments/:id`, `/article/history/:id`） |
| `app/(discussion)/d/[id]/*/page.tsx` | **占位**：渲染空壳，提示「讨论功能未开放」 |
| `app/(paste)/p/[id]/*/page.tsx` | **占位**：渲染空壳，提示「剪贴板功能未开放」 |

### Phase 5: 替换 API 调用层（1天）

创建 `api/` 目录，统一封装对 luogu-saver-next 的请求：

```typescript
// api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data as T;
}
```

各模块 API 函数参照 `packages/frontend/src/api/` 的命名风格。

### Phase 6: Server Actions 替换（1天）

原 `server-actions/queue-jobs.ts` → 直接 `POST /task/create`：

| 原 Server Action | 替代 API 调用 |
|-----------------|--------------|
| `enqueueArticleRefresh(lid)` | `POST /task/create { type: "save", payload: { target: "article", targetId: lid } }` |
| `enqueueDiscussionRefresh(id)` | `POST /task/create { type: "save", payload: { target: "discuss", targetId: id } }` |
| `enqueuePasteRefresh(id)` | `POST /task/create { type: "save", payload: { target: "paste", targetId: id } }` |
| `enqueueJudgementRefresh()` | `POST /task/create { type: "save", payload: { target: "judgement" } }` |

### Phase 7: 构建配置（0.5天）

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { outDir: 'dist' },
});
```

### Phase 8: 处理 Rewrite 规则（0.5天）

`/@` 语法（如 `/a/:id@:snapshot`）→ 改用 URL query `?snapshot=`：

```
/a/abc123@snap-2024  →  /a/abc123?snapshot=snap-2024
```

---

## 四、数据映射：luogu-archive 类型 → luogu-saver-next API 响应

| luogu-archive 字段 | luogu-saver-next 字段 | 映射方式 |
|-------------------|----------------------|---------|
| `ArticleDto.lid` | `Article.id` | 直接映射 |
| `ArticleDto.title` | `Article.title` | 直接 |
| `ArticleDto.time` | `Article.createdAt` | 格式转换 |
| `ArticleDto.content` | `Article.renderedContent` | 服务端已渲染 HTML |
| `ArticleDto.author` | `Article.author` | 结构一致 |
| `ArticleDto.replyCount` | 无直接字段 | 前端用 `/article/comments/:id` 返回的 `comments` 数组长度近似，或隐藏该数字 |
| `ArticleDto.upvote` | `Article.upvote` | 直接 |
| `PasteDto.data` | `Paste.renderedContent` | 服务端渲染 |
| `PasteDto.user` | `Paste.author` | 结构一致 |
| `UserDto.name` | `User.name` | 直接 |
| `UserDto.color` | `User.color` | 枚举名一致（Gray/Blue/Green/Orange/Red/Purple/Cheater） |
| `UserSummary.badge` | `User` 无 Badge 字段 | 文字称号，luogu-saver-next 未存储；前端降级渲染（不显示，或仅显示 ccfLevel/xcpcLevel 数字） |

### 缺失数据字段处理：

- **badge（用户文字称号）**：luogu-saver-next 的 `User` 实体（user.ts:20-23）只有 `ccfLevel`、`xcpcLevel`、`color`，没有洛谷的 badge 称号文本。前端做可选渲染——没有 badge 字段时不显示小标签，外观不崩，仅少一个文字徽章。用户名颜色（color）已由 luogu-saver-next 提供，正常显示。
- **讨论/回复/剪贴板/裁决/用户时间线**：luogu.me 不需要，前端留占位框架，不接后端，无需处理数据缺口。

---

## 五、后端改动说明

**本期对 luogu-saver-next 零改动。**

- 所有数据均来自其现有只读端点（见第一节）。
- 无需新增数据表、实体、爬虫或 API。
- 前端信息流（Feed）直接消费 `GET /article/recent` 返回的数组，在前端做分页/无限滚动，不依赖后端游标。
- 文章快照直接消费 `GET /article/history/:id` 返回的数组，前端做滚动分页。

---

## 六、总工作量估算

| 阶段 | 工作量 |
|------|--------|
| 前端：Vite + 依赖初始化 | 1 天 |
| 前端：移植客户端组件 | 2 天 |
| 前端：路由 + layout 重构 | 2 天 |
| 前端：Server → Client 数据获取重写 | 2 天 |
| 前端：API 调用层（封装现有只读端点） | 1 天 |
| 前端：Server Actions → `POST /task/create` 替换 | 0.5 天 |
| 前端：占位框架（讨论/剪贴板/裁决） | 0.5 天 |
| 调试/联调 | 3-5 天 |

**总计：约 2 周（单人全职，纯前端）**

---

## 七、建议的迭代顺序

### Iteration 1（MVP）：文章 + 用户 + Feed
1. 前端搭建 Vite + React + Tailwind + Router
2. 封装只读 API 层（`/article/recent`, `/article/query/:id`, `/article/comments/:id`, `/article/history/:id`, `/user/query/:id`）
3. 移植文章详情页 `/a/:id`（含评论、`/article/history/:id` 驱动的 Wayback 弹窗）
4. 移植用户页 `/u/:id`
5. Feed 首页用 `/article/recent` 数组 + 前端无限滚动
6. 刷新/保存按钮 → `POST /task/create`

### Iteration 2：补全与占位
1. 移植 `/recent`、`/explore`（文章搜索/热门，复用 `/search/articles` 或 `/plaza/get`）
2. 讨论、剪贴板、裁决路由渲染占位框架（提示「功能未开放」）
3. Server Actions 替换
4. Rewrite → Query param 的 snapshot 路由

### Iteration 3：优化与部署
1. MDX 文档页预编译
2. 元标签（client-side `document.title`）
3. 性能优化（React Query 缓存策略）
4. 静态构建部署（Vite build → `dist/`，可托管任意静态服务器）
