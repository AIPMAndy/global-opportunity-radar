# 🌍 全球机会雷达 · Global Opportunity Radar

> **世界在变化。机会在哪里？**
>
> 用一颗可以交互的地球，持续观察全球经济、AI 技术与创业产品的变化。

[**在线打开网站**](https://aipmandy.github.io/global-opportunity-radar/) · [**查看部署状态**](https://github.com/AIPMAndy/global-opportunity-radar/actions) · [**五分钟上手**](docs/QUICKSTART.md) · [**数据方法**](docs/DATA_SOURCES.md) · [**保姆级部署**](docs/DEPLOY.md)

由 [AI 酋长 Andy](https://github.com/AIPMAndy) 发起的免费开源研究项目。适合创业者、AI 产品经理、独立开发者和想对比不同市场的人。

## 为什么做？

同样是 2026 年，不同地方的经济与创业感受可能完全不同：硅谷关注 AI 产品化，越南关注产业链变化，中国内地越来越重视投入产出，香港连接不同市场的业务机会。个人观察可以提出问题，最终还需要核对数据、技术进展和真实客户。

项目追踪三层信息：

1. **全球经济**：市场周期、GDP 增长、通胀、失业、外资流入、人均 GDP。
2. **AI 发展**：开源生态的新项目、OpenAlex 论文关键词匹配记录。
3. **创业动态**：Hacker News 新产品发布、值得进一步验证的商业场景。

## V2.1 功能

- **可交互的 3D 风格地球**：拖动旋转、滚轮缩放、点击光点、键盘方向键；完全本地 Canvas 绘制，**不依赖第三方地图 CDN**。
- **25 个重点经济体**：美国、越南、中国内地、中国香港、新加坡等，支持搜索、选择和指标对比。
- **机会对比实验室（V2.1）**：五项指标按地区筛选、排序，并可导出 25 个经济体 CSV 数据。
- **GDP 历史趋势（V2.1）**：最近约 10 年的年度观察值；最多对比 5 个经济体，缺失年份不补线。
- **经济指标卡**：五项世界银行公开指标，标注统计年份，缺失数据保留「—」。
- **四个市场研究切面**：AI 创新、产业链迁移、效率竞争、国际连接。
- **AI 与创业信号**：GitHub 最近 30 天 AI agents 主题仓库、OpenAlex 关键词匹配、Hacker News Show HN。
- **苹果风格页面**：白色底、渐变光感、大字号、深色数据模块、完整手机适配。
- **自动采集与部署**：GitHub Actions 每六小时尝试刷新公开数据；采集失败不阻止网站发布。
- **零 npm 依赖**：纯 HTML + CSS + JavaScript，Python 只用标准库。

## 保姆级部署（Fork 版本）

1. 点击 GitHub 页面右上角 **Fork**，将本仓库复制到自己的账号。
2. 进入 **Settings → Pages**，在 **Build and deployment → Source** 选择 **GitHub Actions**。
3. 打开 **Actions → Build and Publish Global Opportunity Radar → Run workflow**，选择主分支，手动运行。
4. 等到 **Deploy to GitHub Pages** 显示绿色成功。Pages 设置会显示正式网站地址。

完整说明：[docs/DEPLOY.md](docs/DEPLOY.md)。

## 源码结构

- **index.html** — 页面内容及结构
- **styles.css** — 视觉系统、响应式布局
- **app.js** — Canvas 地球、地图交互、经济对比、数据展示
- **explorer.js / explorer.css** — 经济体排序、GDP 历史曲线与 CSV 下载
- **favicon.svg** — 网站标志
- **data/world.json** — 与网站一同部署的海岸线数据
- **data/snapshot.json** — 未采集状态的原始空值快照，部署时由采集器更新
- **scripts/collect.py** — 并发采集的 Python 标准库脚本
- **.github/workflows/pages.yml** — GitHub Pages 自动更新与发布
- **docs/DEPLOY.md** — 从零部署与打不开排查
- **docs/DATA_SOURCES.md** — 指标口径、来源与方法
- **tests/test_collect.py** — 无网络依赖的采集器测试
- **docs/QUICKSTART.md** — 五分钟市场研究指南

## 数据来源

| 来源 | 数据 | 周期 | 使用时要知道 |
| --- | --- | --- | --- |
| [世界银行 WDI](https://data.worldbank.org/) | GDP、通胀、失业、FDI、人均 GDP | 通常每年 | 每项显示统计年份，非实时 GDP |
| [OpenAlex](https://openalex.org/) | AI 关键词匹配的论文记录 | 上一自然月 | 不等于全球全部 AI 论文 |
| [GitHub Search](https://github.com/topics/ai-agents) | 新建 ai-agents 主题仓库 | 最近 30 天 | 不等于 AI 公司数量 |
| [Hacker News](https://news.ycombinator.com/show) | 含 AI 的 Show HN 发布 | 最新检索 | 不等于融资或营收 |

**重要区别**：每六小时是程序抓取频率，非宏观经济指标发布频率。每条数值应结合来源和统计年份理解。抓取异常不会被写成 0。

## 5 分钟判断一个市场

打开网站的 [市场对比](https://aipmandy.github.io/global-opportunity-radar/#explorer)，选择 GDP 年增长率，查看每个经济体及其统计年份，再切换到 FDI、失业率、人均 GDP；右侧的 GDP 历史曲线可以对比美国、越南、中国内地、中国香港的周期变化。点击市场卡片上的原始数据链接继续查证，也能下载 CSV 进一步分析。

排序是数据整理工具，不代表创业成功率或投资收益。详见 [五分钟上手指南](docs/QUICKSTART.md)。

### 本地验证

    node --check app.js
    node --check explorer.js
    python3 -m unittest discover -s tests -v
    python3 -m http.server 8000

## 技术架构

前端使用静态 HTML、CSS 和 Canvas。世界地图资源跟随仓库一起发布，不需要请求第三方 3D 库。Python 采集器并发访问四类公开 API，生成 JSON 快照。GitHub Actions 将生产文件复制到独立的 _site 目录并部署。

默认不需要申请密钥。GitHub Actions 自带的令牌可以访问公开 GitHub 搜索接口。若 OpenAlex 需要 API Key，可以在仓库 **Settings → Secrets and variables → Actions** 创建名为 OPENALEX_API_KEY 的 Secret；其他来源可以继续运行。

## 未来版本

1. 增加同年比较开关、行业维度与完整历史区间下载。
2. 区分 AI 科研、开源、企业落地和招聘信号。
3. 具有原始链接、发布日期和事实口径的全球融资事件库。
4. 行业机会档案：谁有痛点、谁来付钱、验证结果如何。
5. 中英文市场研究摘要和定期报告。

欢迎提交 Issue、PR 或新的公开数据源。

## 作者与许可

由 [AI 酋长 Andy](https://github.com/AIPMAndy) 发起，代码使用 [MIT License](LICENSE)。世界地图轮廓来源信息见 [数据说明](docs/DATA_SOURCES.md)。
