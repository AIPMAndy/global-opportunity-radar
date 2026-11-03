# 从零部署：全球机会雷达 V2

这份教程适用于没有前端经验、只想用 GitHub 免费部署网站的人。

## 0. 你需要准备什么？

- 一个 GitHub 账号
- 一个公开仓库（可以 Fork 原项目）
- 不需要买服务器、域名、数据库或配置前端构建工具

原始项目：https://github.com/AIPMAndy/global-opportunity-radar

## 1. 复制项目

打开上方 GitHub 地址，点击 **Fork** → **Create fork**。

如果希望仓库名称不一样，可以改名；但网站地址中的项目路径也会随之变化。

## 2. 启用 GitHub Pages

1. 打开你 Fork 后的仓库。
2. 点击 **Settings**。
3. 左侧找到 **Pages**。
4. **Build and deployment → Source** 选择 **GitHub Actions**。
5. 不需要在页面设置里选择 main / root；本项目使用 Actions 上传构建目录。

仓库必须允许 GitHub Actions 运行。可在 **Actions** 标签中查看是否被禁用。

## 3. 首次发布

1. 打开 **Actions**。
2. 左侧选择 **Build and Publish Global Opportunity Radar**。
3. 点击 **Run workflow**，选择 main，确定运行。
4. 打开本次运行记录。
5. 检查 **Prepare offline-first static site**、**Upload only the built site**、**Deploy to GitHub Pages** 三步是否成功。

成功后，进入 **Settings → Pages**，以 GitHub 显示的 URL 为准。

原仓库的预期网站地址：
https://aipmandy.github.io/global-opportunity-radar/

## 4. 数据如何自动更新？

- 自动执行时间：UTC 每六小时的第 17 分钟。
- 也可以通过 Actions → Run workflow 手动刷新。
- scripts/collect.py 并发采集世界银行、GitHub、Hacker News 与 OpenAlex。
- 采集成功会生成更新后的 data/snapshot.json 并作为网站发布产物。
- 采集失败则网站继续部署原始空值快照；经济卡与信号面板明确显示缺失，不会自动编造数值。

如果你在页面上看到 GDP 统计年份为 2025，并不表示系统没运行。宏观经济指标按官方发布周期更新，网站每六小时抓取只是查询最新已公布数据。

## 5. 常见打不开问题

### A. 网站返回 404

重点查看本次 GitHub Actions 的 **Deploy to GitHub Pages** 是否成功，而不只是看到代码提交成功。

- 检查 Settings → Pages 的 Source 是否确实为 GitHub Actions。
- 检查发布工作流是否运行在 main 分支。
- 检查 Actions 运行记录的 Deploy to GitHub Pages 步骤。
- 检查 URL 中用户名与仓库路径的大小写和拼写。
- 不能访问 github.io 时，换一种网络环境测试，区分网络问题与 GitHub Pages 发布问题。

### B. 页面出现但地图不加载

V2 使用内置 Canvas，不再依赖 Globe.gl、Three.js、地图贴图 CDN。

- 确认 app.js、styles.css 和 data/world.json 已存在于仓库 main 分支。
- 打开浏览器开发者工具，查看 Console 是否有 JavaScript 错误。
- 检查浏览器是否允许 JavaScript 和 Canvas。
- 刷新缓存；若使用了旧版缓存，请尝试强制刷新页面。

### C. 地球正常，但经济指标全部显示「—」

检查 Actions 日志中 **Refresh public-data snapshot (best effort)** 的输出。

- **Providers** 列出了各来源是否成功。
- **Economies with GDP** 是包含至少一项 GDP 增长率指标的经济体数。
- OpenAlex 若需要密钥，在 Settings → Secrets and variables → Actions 添加 OPENALEX_API_KEY。
- 世界银行数据可能暂时不可用，部分经济体也可能本就没有该指标。

### D. GitHub Actions 无权限部署

检查 Settings → Actions → General 中 Actions 是否被允许运行，并检查 Pages Source。工作流文件已显式声明 pages: write 和 id-token: write 权限；不要在不理解原因时关闭仓库安全设置。

## 6. 本地开发

把源码克隆到电脑后，在仓库根目录运行：

    python3 -m http.server 8000

打开 http://localhost:8000/

前端无依赖，代码修改刷新即可。可以用下面的命令做基础检查：

    node --check app.js
    python3 -m py_compile scripts/collect.py

本地运行一次采集：

    python3 scripts/collect.py

访问公开数据源需要能联网。离线时页面结构和地球仍能显示。

## 7. 改成你自己的全球观察平台

- 首页文案和页面模块：index.html
- 颜色、字体、间距和移动端样式：styles.css
- 经济体坐标、研究问题、筛选与交互：app.js
- 采集指标、API 路径、采集频率：scripts/collect.py
- 自动部署频率与构建步骤：.github/workflows/pages.yml

注意：增加一个新经济体时，需要同时修改 app.js 和 scripts/collect.py 中的经济体列表。

## 8. 更进一步

你可以在 GitHub Pages 上免费运行这个静态项目；如果将来需要持久化历史数据库、用户登录或实时流式更新，再考虑后端服务。V2 设计有意降低最低运行门槛。
