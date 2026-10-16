# 特斯拉能飞

[English](README.md) · **简体中文**

受飞行 Roadster 概念启发的浏览器驾驶挑战：沿吸附坡道驶向倒挂，在空中调整车身姿态，最后让整车停在绿色着陆区内。

使用 **Astro、Three.js 和 pnpm** 构建。首页是静态页面，只有游戏页加载三维场景。项目采用简化游戏物理，是独立制作的作品，与 Tesla 或 SpaceX 无隶属关系。

![特斯拉能飞](public/images/readme-car-ramp.jpg)

## 功能

- 中英文页面，按浏览器语言偏好提示切换。
- 完整自动演示，支持暂停、重播和多个观察视角。
- 电脑键盘驾驶、手机横屏触控操作。
- 手机竖屏只观看，提示横屏后才能驾驶。
- 风扇吸附、有限冷气推进、空中调姿、坡道碰撞与着陆检查。
- 预计触地点、实际触地点，以及整车在绿区内停稳的判定。
- 支持 Cloudflare Workers 静态部署，无需 SSR 或数据库。

## 演示视频

- [中文版竖屏演示 — MP4](videos/tesla-can-fly-zh-xiaohongshu.mp4)
- [英文版横屏演示 — MP4](videos/tesla-can-fly-en-x.mp4)

视频直接录制游戏场景，叠加对应语言的阶段字幕和仪表，均为无声 H.264、30 fps。

## 快速开始

要求 **Node.js 22.12+** 和 **pnpm 9.15.1**。

```sh
pnpm install
pnpm dev
```

打开 [localhost:3000](http://127.0.0.1:3000/)。根路径根据已保存偏好或浏览器首个受支持语言选择首页；关闭 JavaScript 时会显示语言入口链接。

| 路径 | 页面 |
| --- | --- |
| `/zh/` | 中文首页 |
| `/en/` | 英文首页 |
| `/zh/play/` | 中文游戏 |
| `/en/play/` | 英文游戏 |

首页 CTA 跳转到对应语言的游戏页，游戏左上角品牌返回首页。未知路径返回独立 404 页面。

## 游戏操作

| 按键 | 操作 |
| --- | --- |
| W / S | 加速 / 制动 |
| A / D | 转向或左右平移 |
| Shift | 在坡道上保持吸附 |
| 空格 | 沿车身局部上方喷气 |
| 左右方向键 | 空中翻滚 |
| 上下方向键 | 空中俯仰 |
| R | 重新开始当前模式 |
| C | 切换镜头，包含近景视角 |
| P | 暂停 / 继续自动演示 |

手机横屏使用加速/制动按钮、吸附锁定、姿态摇杆、喷气和左右平移按钮。竖屏仅能观看；驾驶时转回竖屏会结束本次手动挑战、释放输入并回到自动演示。

通关需要完整吸附通过倒挂段，再让整车在绿色区域内停稳。着陆反馈显示失败项目及允许范围。黄色标记按当前姿态和喷气输入预测触地点，青色标记保留实际触地点。

## 语言规则

页面语言由 URL 决定。切换语言保留页面路径，例如 `/en/play/` → `/zh/play/`，并在本地保存偏好。如果浏览器偏好是受支持语言 A，而当前页面是 B，就提示切换，不强制跳转。关闭提示后，本次浏览器会话不再对同一语言组合重复提醒。

## 测试与构建

```sh
pnpm test
pnpm build
pnpm verify:build
pnpm preview
```

测试覆盖坡道接触、通关资格、制动边界、落点预测和语言选择。`verify:build` 检查双语静态路由、CTA 链接、游戏入口、首页与游戏的脚本分离及 Worker 静态资源配置。

## 部署到 Cloudflare Workers

```sh
pnpm build
pnpm cf:preview
```

本地 Worker 预览使用 8787 端口。登录自己的 Cloudflare 账号后部署：

```sh
pnpm exec wrangler login
pnpm deploy
```

`wrangler.jsonc` 把 `dist/` 作为静态资源目录，采用带尾斜杠的 URL 和独立 404 页面。无需服务端渲染适配器或 Worker 入口文件。首次部署前可按需修改 Worker 名称。

Workers Builds 的构建命令为 `pnpm build`，部署命令为 `pnpm exec wrangler deploy`。仅检查部署配置、不发布：

```sh
pnpm exec wrangler deploy --dry-run
```

## 项目结构

```text
src/
  pages/
    index.astro                 语言入口
    404.astro                   未找到页面
    [lang]/index.astro          首页
    [lang]/play.astro           游戏页
  layouts/SiteLayout.astro      公共导航、元信息与页脚
  components/Game.astro         游戏 HUD 与脚本入口
  styles/site.css              首页样式
  main.js                      场景、模拟与镜头循环
  vehicle.js                   程序化 Roadster 模型
  collision.js                 坡道几何与碰撞辅助
  challenge.js                 着陆检查与轨迹预测
  locale.js                    共享语言选择规则
  i18n.js                      游戏翻译与语言切换
  touch.js                     触控与输入清理
  recording.js                 按需开启的演示录制
  style.css                    游戏样式
public/images/                 静态首页配图
scripts/verify-build.mjs        静态产物检查
videos/                        已导出的演示视频
qa/                            视觉检查截图
```

后续内容页可放在 `src/pages/[lang]/` 下，用 `getStaticPaths()` 生成中英文版本并复用 `SiteLayout`，链接带当前语言前缀。确定正式域名后，可继续补充绝对 canonical、sitemap 和社交分享元信息。

## 录制演示

打开 `/zh/play/?record=1` 或 `/en/play/?record=1`，在**加载页面前**选择横屏或竖屏视口，再点击录制按钮。录制工具会把完整自动演示导出为 WebM，包含对应语言的阶段字幕和仪表，不包含浏览器控件。只有显式打开录制入口时才启用，无需麦克风权限。

使用 FFmpeg 转为 MP4：

```sh
ffmpeg -i recording.webm -c:v libx264 -crf 19 -pix_fmt yuv420p -r 30 -movflags +faststart demo.mp4
```

`/zh/play/?poster=1` 可展示无 HUD 的停车近景，用于生成配图。

## 模拟范围

手机和窄屏默认使用轻量渲染：关闭实时阴影与动态聚光灯、开启抗锯齿、像素比最高为 1.5，并合批静态几何。仪表和落点预测每秒刷新 10 次，输入与模拟仍逐帧运行；后台标签页停止渲染。电脑可用 `?quality=low` 强制轻量档，`?perf=1` 显示本地渲染指标，便于排查性能。

坡道运动使用带间隙补偿的约束轨迹与路径碰撞探针，空中运动采用简化重力、推力和姿态输入。没有完整模拟轮胎动力学、空气流动或实车性能。车辆是程序化近似模型，并非厂商提供的模型。

## 许可证

[MIT](LICENSE) © 2026 panyanyany。第三方依赖保留各自的许可证。

## 项目说明页面

中英文免责声明与隐私说明位于 `/{lang}/disclaimer/`、`/{lang}/privacy/`，首页页脚和游戏信息菜单均提供入口。这些说明不等于取得第三方品牌授权，也不是法律合规保证。
