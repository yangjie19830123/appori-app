# WSI 双语版部署指南

新增中英双语：

- `www.appori.app/wsi/cn` — 中文测指数
- `www.appori.app/wsi/en` — English test
- `www.appori.app/wsi/pk/cn` — 中文 PK
- `www.appori.app/wsi/pk/en` — English PK

`www.appori.app/wsi` 默认重定向到 `/wsi/cn`，`/wsi/pk` 重定向到 `/wsi/pk/cn`。

每个页面顶部右侧有 `EN` / `中` 切换按钮，点击会切到当前页面的另一种语言（保留路径），不丢上下文。

## 部署步骤（跟之前一样）

### 1. 解压

zip 里包含：`package.json`、`tailwind.config.ts`、`wsi/`。先**完全删除**原有的 `appori-app/app/wsi/` 文件夹（避免旧路由文件残留），然后：

- `package.json` → 复制到 `appori-app\` 根目录（覆盖原文件）
- `tailwind.config.ts` → 复制到 `appori-app\` 根目录（覆盖原文件）
- `wsi/` 文件夹 → 复制到 `appori-app\app\` 下

最简单的做法：右键 zip → 全部展开 → 进到展开后的文件夹，把 `package.json`、`tailwind.config.ts` 拖到根目录（替换），把整个 `wsi\` 文件夹拖到 `appori-app\app\` 下。

### 2. 装依赖

```powershell
cd C:\Users\YangJie\appori-app
npm install
```

跟上一版相比 `package.json` 没变（一直就只新增了 `html-to-image`），但跑一遍 `npm install` 保险。

### 3. 本地验证（可选）

```powershell
npm run dev
```

依次访问：

- `http://localhost:3000/wsi` → 自动跳到 `/wsi/cn`
- `http://localhost:3000/wsi/cn` → 中文版测指数
- `http://localhost:3000/wsi/en` → 英文版
- `http://localhost:3000/wsi/pk/cn` → 中文 PK
- `http://localhost:3000/wsi/pk/en` → English PK

点页面右上角 `EN` / `中` 按钮验证语言切换不会丢失页面位置（停留在主页或 PK 页都行）。

### 4. 上线

```powershell
vercel --prod
```

## 改动总结

跟上一版（单语言）相比的差异：

**新增文件**：

- `app/wsi/lib/i18n.ts` — 翻译表 + 类型 + 工具函数
- `app/wsi/[lang]/page.tsx` — 主页（动态路由参数 lang）
- `app/wsi/pk/[lang]/page.tsx` — PK 页（动态路由参数 lang）

**重构**：

- `app/wsi/page.tsx` 现在只做重定向到 `/wsi/cn`
- `app/wsi/pk/page.tsx` 现在只做重定向到 `/wsi/pk/cn`
- 所有组件多了 `lang` 和 `t`（翻译对象）两个 prop
- `lib/types.ts` 中 `CountryConfig` 改为多语言结构（`names: { cn, en }`、`nicknames: { cn, en }` 等）
- `lib/countries.ts` 增加 `localizedCountry()` 函数返回当前语言的扁平结构
- `lib/calc.ts` / `lib/pk.ts` 接收 `lang` 参数，生成对应语言的 risk title、suggestion、verdict 等动态文案
- `TopNav.tsx` 增加右侧语言切换按钮，按钮目标 URL 是替换当前路径末尾的 `/cn` 或 `/en`
- 结果卡 / 战斗卡 watermark 显示当前语言路径（如 `appori.app/wsi/cn`）

**未改动**：

- `app/wsi/layout.tsx`、`wsi.css`、`api/rates/route.ts`、`useRates.ts`、`rates.ts` 都和上版本一致
- `package.json`、`tailwind.config.ts` 跟上版本一致，重新覆盖一次保险

## 技术决策

**为什么默认 `cn`**：主要受众是中文留学生，海外华人也读得懂。如果想改默认语言，编辑 `app/wsi/page.tsx` 和 `app/wsi/pk/page.tsx` 的 redirect 目标即可。

**为什么不做基于 `Accept-Language` 的自动检测**：副作用太多（CDN 缓存、SEO 主语言不明确、首次访问体验割裂）。语言用 URL 显式区分更干净，跟用户给的需求一致。

**为什么 `[lang]` 放在末尾**：跟用户提供的 URL 例子一致 `/wsi/pk/cn`、`/wsi/pk/en`。从分享链路看，URL 末尾带 `/cn` 或 `/en` 也比 `/cn/pk` 更直观——一眼能看出来这是哪个工具的哪个语言版本。

**SEO**：每个语言都是独立路由，搜索引擎可以分别索引，并且 `<html lang>` 默认是 `zh-CN`（appori-app 的 root layout 设的）。如果未来希望英文页声明 `lang="en"`，需要在 `app/wsi/[lang]/page.tsx` 里通过 metadata API 动态返回，或者改造成 server component + client widget 拆分（当前是 client component 整体）。先保持简单。

© 2026 Appori
