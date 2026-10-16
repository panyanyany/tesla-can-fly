# Roadster / Flight Lab

Astro 静态多页面网站 + Three.js 概念驾驶游戏。使用简化运动模型，并非真实车辆或飞行性能模拟，也不是 Tesla / SpaceX 官方作品。

## 本地运行

要求 Node.js 22.12+，使用 pnpm。

```sh
pnpm install
pnpm dev
```

默认地址 http://127.0.0.1:3000/。根路径按已保存偏好或浏览器支持语言进入首页；页面本身的语言由 URL 决定。

- `/zh/`、`/en/`：中英文落地页，不加载 Three.js。
- `/zh/play/`、`/en/play/`：点击首页 CTA 后进入的游戏页，也支持直接访问。
- 游戏页左上角品牌返回对应语言首页。
- 未知路径返回独立 404，不使用 SPA 兜底。

浏览器偏好语言与页面不同且受支持时，提示可切换；不会自动切换已打开的页面。手动切换保留页面路径并保存偏好。关闭提示后本次会话不重复提醒。

## 验证和构建

```sh
pnpm test
pnpm build
pnpm verify:build
pnpm preview
```

`verify:build` 检查两种语言的首页/游戏路由、CTA、首页没有游戏画布或 WebGL bundle，以及静态 Worker 资源配置。

## Cloudflare Workers 静态部署

```sh
pnpm build
pnpm cf:preview
# 已登录 Cloudflare 后执行：
pnpm deploy
```

`wrangler.jsonc` 将 `dist/` 作为静态资源目录，采用 trailing slash 和 404-page。没有 SSR Worker、适配器或数据库依赖；后续有 API 需求时再加入 Worker 代码。

Workers Builds 可使用构建命令 `pnpm build` 和部署命令 `pnpm exec wrangler deploy`。首次部署前按需更改 Worker 名称，完成自己的 Cloudflare 登录。仓库不保存凭据。

## 页面扩展

- `src/layouts/SiteLayout.astro`：共享导航、语言提示、元信息和页脚。
- `src/pages/[lang]/index.astro`：静态首页。
- `src/pages/[lang]/play.astro`：独立游戏页面。
- `src/components/Game.astro`：游戏 HUD；只在游戏页面引入 `src/main.js`。
- `src/locale.js`：纯语言选择规则，供首页与游戏共用。
- `src/i18n.js`：游戏翻译及 URL 语言切换。
- `src/styles/site.css`、`src/style.css`：站点和游戏样式分别加载。
- `public/images/roadster-hero.jpg`：游戏场景实拍静态配图，无运行时代价。

新增内容页可在 `src/pages/[lang]/` 下增加 `.astro` 文件，使用 `getStaticPaths` 生成 zh/en，并复用 SiteLayout；导航链接应带当前语言前缀。配置正式域名后，可进一步补充绝对 canonical、sitemap 和社交分享图地址。

## 游戏操作

W/S 加速制动；Shift 吸附；空格喷气；方向键调姿；A/D 转向；R 重试；C 切换视角（含近景）。自动演示支持 P 暂停，暂停可切换视角。

手机竖屏仅观看，横屏解锁多指触控：加速/制动、吸附锁定、姿态摇杆、喷气与左右平移。驾驶中转为竖屏会清空输入并回到演示。

必须完整吸附通过倒挂段，并让整车在绿区内停稳。黄色标记为按当前姿态/喷气估算的触地点，青色标记保留实际触地点。失败后显示检查明细。

`/zh/play/?poster=1` 可展示无 HUD 的停车近景，供开发时生成配图。
