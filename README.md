# 🌍 全球机会雷达 Global Opportunity Radar

> 世界一直在变化。机会在哪里？
>
> 一个免费、可自托管的全球经济 × AI 研究 × 开源项目 × 创业产品发布观察站。打开网页中的 3D 地球，点击经济体，查看指标、统计年份、源站链接和需要进一步验证的市场问题。

**项目状态：V1.0 开源版（可运行的静态站点 + 自动采集代码）**

**重要：GitHub 仓库需要由使用者创建并上传文件。直接在 GitHub Pages 发布后，定时更新依赖 GitHub Actions。初始仓库里的 `site/data/snapshot.json` 是诚实的空值示例，不包含假造的实时统计。**

## 一张图看懂

```text
世界银行 WDI ───┐  年度宏观指标（GDP 增速、通胀、失业、FDI）
                │
OpenAlex ───────┤  上月全球 AI 论文量 + 各地区机构参与量
                │
GitHub Search ──┤  最近 30 天 AI agents/LLM 公开仓库
                ├──→ Python 采集和校验 → site/data/snapshot.json → GitHub Pages
Hacker News ────┘  最近 7 天 Show HN + AI 的社区产品发布
                                     ↑
                            GitHub Actions 每 6 小时重建站点
```

## 这版已经实现

- 3D 地球拖拽、缩放、点击国家或地区亮点，右侧联动详情。
- 25 个重点经济体（含美国、越南、中国内地、中国香港、新加坡、中国台湾）。
- GDP 增长、消费者价格通胀、失业、FDI 及 AI 论文机构参与数可切换地图图层。
- 经济体搜索、五个重点地区快捷入口、10 个经济体对比表。
- 全球 AI 论文数量、30 天 AI agents 开源仓库检索量、7 天 Show HN AI 发布量。
- 最新 GitHub 仓库与 Hacker News 发布信号列表，支持来源跳转。
- 数据源状态、指标统计年份、原始链接、失败和缺失值提示。
- 无付费数据库、无需后端、无需配置服务器；Python 只使用标准库。
- 手机端适配；3D 组件受限时，保留可用的检索和数据面板。

**它还不包括：** 实时 GDP、创业公司真实融资额、项目盈利、国家“赚钱指数”、AI 能力排行榜。V1 不会用流量热度伪装为商业结果。

## 保姆级：照着做，发布你的站点

### 第 1 步：下载项目

下载并解压本项目 ZIP。解压后应看到：`site/`、`scripts/`、`tests/`、`.github/workflows/site.yml` 和本说明。

**注意：上传整个文件夹里的内容，不要只上传 `site/index.html`。** GitHub 网页批量上传时，隐藏目录 `.github` 可能不易操作，推荐使用 git 命令上传，才能保留自动部署文件。

### 第 2 步：在 GitHub 创建仓库

登录 GitHub，点击右上角 `+` → `New repository`，填写：

- **Repository name**：`global-opportunity-radar`
- **Visibility**：`Public`
- **Initialize**：不勾选 README、.gitignore 或 License（压缩包已经附带）。

点击 `Create repository`。这一步会生成仓库 URL：

`https://github.com/<你的GitHub用户名>/global-opportunity-radar`

### 第 3 步：上传源代码

在自己的 Mac/Windows 终端中进入解压后的目录（含 README.md）：

```bash
git init
git add .
git commit -m "feat: launch Global Opportunity Radar"
git branch -M main
git remote add origin https://github.com/<你的GitHub用户名>/global-opportunity-radar.git
git push -u origin main
```

如提示身份验证，请使用 GitHub 官网提供的 Git Credential Manager 或 GitHub CLI 登录；不要把私人 Token 写入仓库。

### 第 4 步：开启免费网站

打开刚创建的仓库 → `Settings` → 左侧 `Pages` → `Build and deployment` → `Source` 选择 **GitHub Actions**。

首次推送可能在 Pages 开启之前触发了失败的构建。请进入 `Actions` → `Refresh data and publish globe` → `Run workflow` → 选择 `main` → 手动执行一次。

**工作流会在 GitHub 服务器重新抓取公开数据，生成 JSON，并部署网站。** 完成后可在 Pages 设置中看到正式访问地址，通常为：

`https://<你的GitHub用户名>.github.io/global-opportunity-radar/`

实际地址以 GitHub Pages 页面显示的 URL 为准。

### 第 5 步：让数据自动更新

`.github/workflows/site.yml` 已配置每 **6 小时**运行一次。即使无人打开网页，也会尝试重新采集、验证并发布数据。你可以在 `Actions` 中查看每次运行的完整状态。

如果不需要那么频繁，在该文件中把 `cron: '17 */6 * * *'` 改成 `cron: '17 2 * * *'`，即可每天在 UTC 02:17 执行一次。定时任务可能存在 GitHub 调度延迟。

### 第 6 步：本地运行（可选）

项目无需 npm，Python 3.10+ 即可：

```bash
# 在仓库根目录，采集真实数据（需要联网）
python3 scripts/update_data.py

# 启动本地网页服务
cd site
python3 -m http.server 8000
```

浏览器打开 `http://localhost:8000`。不要直接双击 `index.html`，浏览器的 `file://` 安全限制可能阻止读取 JSON。

如果只想检验页面和代码结构，可先运行：

```bash
python3 scripts/update_data.py --offline
python3 -m unittest discover -s tests -v
```

`--offline` 模式**不会**生成任何伪造数值；它会生成展示空值和“未采集”状态的示例文件。

### 第 7 步：改成你的品牌

- `site/index.html`：标题、页头、页脚、品牌相关链接。
- `site/styles.css`：苹果风配色、卡片、字号、响应式布局。
- `scripts/update_data.py` 的 `COUNTRIES`：增删经济体、地图坐标、观察问题。
- `scripts/update_data.py` 的 `INDICATORS`：增加世界银行指标（需同步修改 `site/app.js` 显示逻辑）。
- `.github/workflows/site.yml`：更新频率。

网页入口：`site/index.html`；数据接口格式：`site/data/snapshot.json`。

## 阅读指南：如何判断真实机会？

根据提供的美国、越南、中国内地、中国香港跨市场观察，把直觉转成四个可检验的问题：

| 观察线索（不是已验证结论） | 先看什么指标 | 需要实地验证的问题 |
| --- | --- | --- |
| 硅谷 AI 项目活跃 | 研究产出、开源活动、实际采购 | 是否有客户持续付费、而非只有 demo？ |
| 越南城市商业氛围活跃 | GDP、FDI、就业、行业数据 | 哪些工厂/商户需求可以成交？ |
| 中国内地客户预算谨慎 | 宏观数据、细分行业预算 | 是全部客户收缩，还是预算转向性价比？ |
| 中国香港跨境连接 | 贸易/投资指标、真实客户访谈 | 哪类跨境服务具有稳定交付和利润？ |

**请勿把一次城市观察推断成整个经济体的统计事实。** 要把“感觉”当作待检验假设，把付费客户作为最终证据。

详见 [docs/机会研究方法.md](docs/机会研究方法.md) 和 [docs/数据来源与局限.md](docs/数据来源与局限.md)。

## 目录说明

```text
global-opportunity-radar/
├── site/
│   ├── index.html             # 网站内容
│   ├── styles.css             # Apple 风格页面
│   ├── app.js                 # 地球交互、筛选和数据呈现
│   ├── favicon.svg
│   └── data/snapshot.json     # 数据快照（首版为显式空值）
├── scripts/update_data.py     # 免费 API 自动采集器
├── tests/test_update_data.py  # 基础验证
├── docs/
│   ├── 机会研究方法.md
│   ├── 数据来源与局限.md
│   └── 每周观察报告提示词.md
├── .github/workflows/site.yml # 定时更新 + GitHub Pages
├── LICENSE
└── README.md
```

## 数据使用、隐私和准确性

- **宏观指标**：保留每条指标数据年份，各项数据可能不是同一年，不做未经归一化的综合排行榜。
- **研究**：机构所在地不等于作者国籍；跨国合著可能计入多个国家和地区。
- **代码**：GitHub 公开仓库新增不等于 AI 公司数量、技术突破或融资活动。
- **产品**：Show HN 是用户提交的社区发布，不代表成功创业或已验证盈利。
- **权限**：网站是纯静态网页，不收集访客个人账户或支付信息。第三方 CDN/源站可能有自己的访问日志。
- **刷新**：定时获取最新可用记录，不等于所有底层指标实时变化。
- **访问依赖**：3D 地球依赖外部 CDN 图片及 globe.gl 脚本；如果 CDN 不可达，页面会展示降级提示并继续提供文字数据功能。
- **引用**：项目使用 `globe.gl`（MIT），数据来源和原站点链接见完整说明。
- **授权**：本站代码采用 MIT License；第三方数据、图片及代码各自遵循原许可。

## 未来迭代方向

1. **V1.1** 可人工核实的地区创业事件库：增加公司所在地、公告日期、原始证据、是否核实、历史修订记录。
2. **V1.2** 增加 IMF/OECD 等有官方 API 的高频数据；明确频率、季调和可比性。
3. **V1.3** 关注经济体、行业和关键词；生成差异报告，支持 RSS/邮件订阅（用户明确授权后）。
4. **V2.0** 建立来源可验证的创业公司融资/招聘/营收信号体系，严格区分报道和官方披露。

这些是规划，**没有在 V1 中伪装为已实现功能**。

---

**作者 / Author：** [AI 酋长 Andy](https://github.com/AIPMAndy)  
**License：** MIT  
**声明：** 信息研究工具，不构成投资、税务、法律或商业收益承诺。