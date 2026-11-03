# 🌍 全球机会雷达 · Global Opportunity Radar

**世界一直在变化。机会在哪里？**

由 [AI 酋长 Andy](https://github.com/AIPMAndy) 发起的免费开源全球经济、AI 技术及创业信号观察平台。

## 在线体验

**GitHub Pages（配置成功后）：** https://aipmandy.github.io/global-opportunity-radar/

> 当前在线仓库版本：**V1 核心交互版**。已提交可运行的单页 3D 地球网站和 GitHub Pages 自动部署工作流；已增加 Python 标准库采集器与每六小时定时重新构建；网页优先尝试公开接口，接口失败时使用最近成功采集的缓存指标。数据抓取频率不等于宏观指标发布频率。

### 已支持

- 25 个重点经济体的三维地球定位、拖动、缩放、点击交互；3D 资源不可达时可用地区按钮。
- 按经济体查询世界银行公开指标：GDP 增长率、通胀、失业、FDI 净流入、人均 GDP。
- 打开网页时查询 GitHub 近 30 日新增 AI agents 仓库、Hacker News 近期 Show HN 中包含 AI 的投稿。\n- GitHub Actions 每六小时尝试采集世界银行、GitHub、Hacker News 和 OpenAlex 关键词数据，生成部署用 JSON 快照；部分来源失败时保留空值和失败记录。
- 每项宏观指标展示统计年份；接口失败或没有数据时显示空值，不编造实时数值。
- 苹果风浅色界面、移动端布局、源站跳转。
- GitHub Actions 自动**更新数据并发布网站**：每次向 main 推送及每六小时定时尝试运行。

### 暂不包含

- 定时后台数据抓取和落盘快照（计划下一阶段接入）。
- OpenAlex AI 论文数据的在线展示。
- VC 融资额、创业公司收入、公司“赚钱指数”。
- 官方意义上的实时 GDP、实时就业与跨国营商难易度排名。

## 保姆级部署

1. 进入仓库 [Settings → Pages](https://github.com/AIPMAndy/global-opportunity-radar/settings/pages)。
2. 在 **Build and deployment** 的 **Source** 中选择 **GitHub Actions**。
3. 打开 [Actions](https://github.com/AIPMAndy/global-opportunity-radar/actions)，选择 **Publish Global Opportunity Radar** → **Run workflow** → 选择 `main` 并运行。如果已经有成功的部署，则不必重复运行。
4. 在 [Pages 设置](https://github.com/AIPMAndy/global-opportunity-radar/settings/pages) 查看正式访问 URL。通常为 https://aipmandy.github.io/global-opportunity-radar/ ，以 GitHub 显示的地址为准。

## 技术栈

- 前端：静态 HTML / CSS / JavaScript，无 npm 安装要求。
- 地球：globe.gl，通过 jsDelivr 加载。贴图通过第三方地址加载；离线或 CDN 不可用时保留地区和数据面板。
- 数据：世界银行 WDI、GitHub REST 搜索、Hacker News Algolia、OpenAlex 关键词检索。\n- 自动采集：Python 标准库脚本 \`scripts/collect.py\`；定时任务 UTC 每六小时第 17 分钟运行；生成 \`data/snapshot.json\`，只打包到 Pages 部署产物（不自动提交到 main）。
- 托管：GitHub Pages；工作流位于 `.github/workflows/pages.yml`。

页面在浏览器中查询公开接口，并使用已部署的数据快照作为回退。接口可能受 CORS、网络、配额限制；OpenAlex 可能要求 API Key，可在仓库的 Actions secrets 中按需设置 \`OPENALEX_API_KEY\`。缺失值不能当成零，缓存数值应结合标注年份理解。

## 判断创业机会的方法

| 跨地区观察 | 需要核实的证据 |
| --- | --- |
| 美国 AI 创业活跃 | 是否有企业持续付费、可复用交付、成本优势？ |
| 越南制造与本地消费 | 外资流入究竟进入哪些行业、本地商户是否有预算？ |
| 中国内地流量竞争 | 哪些场景付费需求仍然稳定、客户的 ROI 是否成立？ |
| 香港跨境连接 | 贸易及专业服务需求是否能形成可重复交易？ |

城市体验属于观察线索，GDP 属于宏观数据，创业成功需要真实付费和单位经济模型证据，三者不能直接画等号。

## 数据诚信

- 宏观指标通常按年度发布，新抓取时间不等于指标统计期。
- GitHub 搜索结果只是符合检索条件的公开仓库，不等于 AI 公司数量。
- Show HN 的社区投稿不等于融资、营收和商业成功。
- 仅供学习与研究，不构成投资建议或收益承诺。

MIT License。欢迎提交 Issue、PR 和新增可核实的数据源。
