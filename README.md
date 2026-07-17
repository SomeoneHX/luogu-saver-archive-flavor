# 洛谷仓库 · 风味版

洛谷内容存档站点的前端单页应用（SPA）。本项目是 [luogu-archive](https://github.com/oi-zone/luogu-archive) 的一个前端分支（flavor），后端由 [luogu-saver](https://github.com/laikit-dev/luogu-saver) 提供。

与上游不同，本项目的 Markdown 内容不再依赖后端的统一渲染器（unified/Shiki）生成 HTML，而是**在前端直接用原始 `content` 渲染**：通过 `react-markdown` + 自研的洛谷风味 remark 插件（`remark-lda-lfm`）还原洛谷专栏/讨论中的专属语法（指令容器、@提及、B 站视频、代码高亮、可爱表格合并等），并复用 `.markdown-body` 样式体系。这样前端展示与洛谷原文语义一致，且不再受后端渲染 HTML 与前端样式脱节的影响。

---

## 功能特性

- **文章详情页**：渲染专栏正文、作者信息、目录（TOC，滚动高亮当前章节）、评论、以及「时光机」历史快照对比。
- **用户页**：展示用户资料与自我介绍（原始 Markdown 渲染）。
- **评论渲染**：评论中的 Markdown（含 @提及、链接、代码）前端直接渲染。
- **首页 / 探索 / 最近**：
  - 首页：链接录入框（`LinkIntake`）+ 按更新时间倒序的无限滚动文章流。
  - 探索：基于后端 `/plaza/get` 的推荐列表（固定 20 条）。
  - 最近：`/article/recent` 的文章列表。
- **搜索**：按关键词、分类、作者检索文章。
- **洛谷风味 Markdown 渲染**（`src/lib/remark-lda-lfm`）：
  - GFM 扩展：脚注、删除线、表格、任务列表、数学公式（KaTeX）。
  - 指令容器：`:::info / success / warning / error` 折叠提示框，`:::align{center|left|right}` 对齐，`:::epigraph` 引用。
  - `::cute-table` 可爱表格（自动加样式的表格容器）。
  - 单元格合并：表格单元格内容为 `^` 向上合并、`<` 向左合并。
  - `@提及`：渲染为指向 `/u/:uid` 的彩色提及徽章。
  - B 站视频：`bilibili:视频ID` 渲染为内嵌播放器。
  - 代码块：行号、指定高亮行（`lines=5-6`）、语言标签、一键复制。
  - 站内链接识别：文章/讨论/用户/剪贴板/题目链接自动改写并携带 `data-ls-*` 元数据。
- **链接录入框（首页）**：粘贴洛谷链接（文章/讨论/剪贴板/陶片放逐），自动识别并加入后端保存队列。
- **主题**：亮色 / 暗色模式（基于 `next-themes`）。
- **响应式**：桌面端多列瀑布流，移动端自适应单列与抽屉式导航。

> 说明：讨论（`/d/:id`）、剪贴板（`/p/:id`）、陶片放逐（`/judgement`）目前为占位页（`PlaceholderPages`），数据接入待后续完善。

---

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 构建 | [Vite](https://vite.dev/) 8 |
| 框架 | [React](https://react.dev/) 19 |
| 语言 | TypeScript 6（`tsc -b` 类型检查） |
| 路由 | [react-router-dom](https://reactrouter.com/) 7 |
| 数据请求 | [@tanstack/react-query](https://tanstack.com/query) 5 |
| 样式 | [Tailwind CSS](https://tailwindcss.com/) 4（`@tailwindcss/vite`） |
| 组件原语 | Radix UI + `class-variance-authority` + `clsx` + `tailwind-merge` |
| Markdown | `react-markdown` 10 + `remark-math` + `rehype-katex` + `rehype-highlight` |
| 洛谷风味解析 | 自研 `remark-lda-lfm`（directive / gfm 系列 micromark + mdast 扩展） |
| 公式 | KaTeX |
| 代码高亮 | highlight.js（经由 `rehype-highlight`） |
| Lint | [Oxlint](https://oxc.rs/docs/guide/usage/linter/intro.html) |
| 图标 | `lucide-react` |

---

## 目录结构

```
src/
├── api/                      # 后端 API 封装
│   ├── client.ts             # fetchApi 信封解析（{ code, message, data }）
│   ├── article.ts            # 文章 / 最近文章 / 历史
│   ├── misc.ts               # 评论、用户、搜索、广场、剪贴板
│   └── task.ts               # 保存队列任务（enqueue*）
├── components/
│   ├── layout/               # AppShell、Container、Breadcrumb、Footer
│   ├── markdown/             # Markdown 渲染核心组件
│   │   ├── markdown.tsx
│   │   ├── markdown-code-block.tsx
│   │   └── markdown-summary.tsx
│   ├── feed/                 # 首页文章流（FeedGrid / FeedCard）
│   ├── link-intake.tsx       # 首页链接录入框
│   ├── article/ comment/ user/ ...
│   └── ui/                   # Radix 基础组件（Button/Badge/Dialog…）
├── lib/
│   ├── remark-lda-lfm/       # 洛谷风味 remark 插件
│   │   ├── index.js          # 主插件：链接改写 / @提及 / B站
│   │   ├── luogu-code.js     # 代码块 line-numbers / highlight-lines
│   │   ├── luogu-directives.js # 指令容器（提示框/对齐/引用）
│   │   ├── luogu-tables.js   # 可爱表格 + 单元格合并
│   │   └── index.d.ts        # 类型声明
│   ├── link.ts               # 链接识别正则（文章/讨论/剪贴板/陶片…）
│   └── utils.ts              # cn() 等工具
├── pages/                    # 路由页面
├── types/api.ts              # API 数据类型
└── index.css                 # 全局样式 + .markdown-body 体系
```

---

## 环境要求

- Node.js ≥ 20（建议 LTS）
- 一个可用的 [luogu-saver](https://github.com/laikit-dev/luogu-saver) 后端实例

---

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置后端地址
cp .env.example .env
# 编辑 .env，设置 VITE_API_URL，例如：
# VITE_API_URL=https://api.luogu.me
# 留空表示同源（部署在反向代理后，由代理转发 /api）

# 3. 启动开发服务器
npm run dev

# 4. 构建生产版本
npm run build

# 5. 预览构建产物
npm run preview
```

### 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `VITE_API_URL` | 后端基地址。留空则使用同源地址（适合反向代理场景）。 | 空（同源） |

API 请求会拼接为 `${VITE_API_URL}${path}`，并期望返回信封格式：

```json
{ "code": 200, "message": "", "data": { } }
```

`code !== 200` 或缺少 `data` 时会抛出错误。

---

## 可用脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（含 HMR） |
| `npm run build` | `tsc -b` 类型检查 + `vite build` 生产构建 |
| `npm run preview` | 本地预览构建产物 |
| `npm run lint` | 使用 Oxlint 进行静态检查 |

---

## 后端 API 约定

本项目消费 `luogu-saver` 的接口，主要端点：

- `GET /article/query/:id` —— 文章详情（返回 `content` 原始 Markdown 与 `renderedContent` 后端 HTML；前端使用 `content`）。
- `GET /article/history/:id` —— 文章历史版本（用于「时光机」快照）。
- `GET /article/comments/:id` —— 文章评论（`content` 为原始 Markdown）。
- `GET /article/recent` —— 最近更新的文章（首页文章流、最近页）。
- `GET /user/query/:id` —— 用户信息（含 `introduction` 原始 Markdown）。
- `GET /search/articles` —— 文章搜索。
- `GET /plaza/get` —— 探索页推荐（热度）。
- `GET /paste/query/:id` —— 云剪贴板（占位页待接入）。
- `POST /workflow/create/template/article-save-pipeline`、`POST /task/create`、`POST /user/:uid/refresh` —— 首页链接录入框加入保存队列 / 刷新资料。

后端尚未运行时，前端可正常构建，但页面会在请求时报「加载失败」。

---

## Markdown 渲染说明

前端渲染链路：

```
原始 Markdown (content)
  → remark-lda-lfm（洛谷风味转换）
  → remark-math（数学）
  → react-markdown（MD -> HAST）
  → rehype-katex（公式）
  → rehype-highlight（代码高亮）
  → 自定义 components（a / pre / summary / table / iframe 等）
```

关键组件：

- `src/components/markdown/markdown.tsx`：核心渲染器，封装 `react-markdown`、TOC 采集（`onHeadings`）、标题锚点。
- `src/components/markdown/markdown-code-block.tsx`：代码块（语言标签、行号、高亮行、复制按钮）。
- `src/components/markdown/markdown-summary.tsx`：提示框 `summary` 图标。
- `src/lib/remark-lda-lfm/`：洛谷专属语法转换（见上文「功能特性」）。

所有 Markdown 内容（文章正文、评论、用户简介、快照）均使用同一渲染器，保证风格统一。旧的 `DOMPurify` + `dangerouslySetInnerHTML` 注入方式已移除。

---

## 主题与样式

- 全局样式与 `.markdown-body` 体系位于 `src/index.css`（Tailwind v4 `@import "tailwindcss"` + 自定义工具类）。
- 洛谷等级/用户色：`text-luogu-*`、`bg-luogu-*`、`USER_COLOR_CLASS`（`src/components/user/user-inline-link.tsx`）。
- 明暗主题由 `next-themes` 提供，`AppShell` 内嵌 `ThemeToggle`。

---

## 部署

构建产物输出到 `dist/`，为纯静态文件，可托管于任意静态服务器（Nginx、GitHub Pages、Cloudflare Pages 等）。

### GitHub Pages（推荐）

仓库已内置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），推送 `main` 分支即自动构建并部署：

1. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送/合并到 `main` 即可触发部署，站点地址为 `https://<用户名>.github.io/luogu-saver-archive-flavor/`。

相关配置说明：

- `vite.config.ts` 中已设置 `base: "/luogu-saver-archive-flavor/"`，与仓库名一致。
- 构建后自动生成 `404.html`（内容与 `index.html` 相同），实现 SPA 刷新兜底；`public/.nojekyll` 避免 GitHub Pages 的 Jekyll 处理。
- 前端通过 `VITE_API_URL` 访问后端。GitHub Pages 为纯静态托管，**无法同源代理后端 API**，因此通常需要将 `VITE_API_URL` 指向可跨域访问的后端地址（确保后端已开启 CORS）。也可通过 Cloudflare Pages / 自有服务器配合反向代理实现同源。

### 自托管 / 反向代理

若自行托管，推荐通过反向代理将后端 API 同源暴露，例如 Nginx：

```nginx
location /api/ {
    proxy_pass https://your-luogu-saver-backend/;
}
```

此时 `.env` 中 `VITE_API_URL` 留空即可。若后端为跨域独立域名，则在 `VITE_API_URL` 中填写完整基地址（需注意后端 CORS 配置）。

SPA 需配置「兜底路由」：所有未命中静态资源的路径回退到 `index.html`，否则刷新子路由会 404（GitHub Pages 已由 `404.html` 处理）。

---

## 开发约定

- 代码风格以 Oxlint 为准（`npm run lint`），提交前请确保 `tsc -b` 与 `vite build` 通过。
- 组件以 `@/` 别名引用 `src/`。
- 新增页面：在 `src/pages/` 编写组件，并在 `src/App.tsx` 的 `router` 中注册路由。
- 需要接入新接口时，参照 `src/api/` 现有封装，使用 `fetchApi<T>()` 并假定信封返回。

---

## 相关仓库

- 后端：[luogu-saver](https://github.com/laikit-dev/luogu-saver)
- 上游归档站：[luogu-archive](https://github.com/oi-zone/luogu-archive)

---

## 许可证

本前端分支沿用上游 [luogu-archive](https://github.com/oi-zone/luogu-archive) 的许可证（AGPL-3.0-or-later）。详情见仓库根目录的 `LICENSE` 文件。
