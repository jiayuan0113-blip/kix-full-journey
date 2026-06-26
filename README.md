# KiX 商家端原型 — 交付说明

商家端完整旅程的可交互 HTML 原型：落地页 →（免登录）6 步建游戏 → 发布前注册 → 上线成功 → 登录后台（首页 / 我的游戏 / 核销 / 数据 / 我的）。中英双语（默认英文，右上角可切中文）。

## 怎么运行（重要）

原型用浏览器内的 Babel 加载 `.jsx`，**必须经本地 HTTP 服务打开，不能直接双击 `index.html`**（`file://` 下浏览器会拦截 .jsx 加载，导致白屏）。

任选一种起服务，然后开浏览器：

```bash
# 方式 A：Python（Mac 自带）
cd kix-full-journey
python3 -m http.server 4311
# 浏览器打开 http://localhost:4311/index.html

# 方式 B：Node
cd kix-full-journey
npx serve -l 4311
# 浏览器打开 http://localhost:4311/index.html
```

> React / ReactDOM / Babel 已内置在 `vendor/`，**断网也能跑**。
> 字体 Plus Jakarta Sans 走 Google Fonts，断网会自动降级为系统字体，不影响功能。

## 直达某个页面（调试用 URL 参数）

| 参数 | 取值 | 作用 |
|---|---|---|
| `screen` | `landing` / `describe` / `building` / `results` / `preview` / `register` / `done` / `app` | 直接跳到某屏（建游戏=三步：describe→building→results→preview） |
| `authed` | `1` | 模拟已登录（带左侧栏的后台外壳） |
| `sec` | `home` / `games` / `redeem` / `reports` / `me` | 后台具体页 |
| `edit` | `1` | 配合 `sec=games` 直接打开「游戏工作台」（预览 + 控制 + AI 对话） |
| `lang` | `en` / `zh` | 语言 |

例：`...?screen=preview`（建游戏第3步）｜`...?screen=app&authed=1&sec=games&edit=1`（游戏工作台）｜`...?screen=app&authed=1&sec=me`（多店铺）

## 文件结构

```
kix-full-journey/
├── index.html      所有 CSS + 页面骨架 + 入口
├── data.jsx        双语文案与数据（游戏、模板、动态流、价格…）
├── icons.jsx       全部 UI 图标（真实 SVG，无 emoji 图标）
├── journey.jsx     全部组件与状态机（落地页 / 建游戏流程 / 后台）
├── logo.png        KiX logo
├── vendor/         React / ReactDOM / Babel（内置，离线可用）
├── SPEC.md         详细产品规格：信息架构、状态机、各分支与边界、文案对照、占位与待办
└── README.md       本文件
```

## 给研发的提醒

- **先读 `SPEC.md`**：所有分支、边界、指标口径、待办都在里面。重点见 SPEC 的 3.7（奖品券模型）/ 3.8（多店铺）/ 4.2（建游戏步数）/ 4.6b（游戏工作台 + AI 对话）。
- **建游戏步数随登录态**：**未登录 = 3 步**（描述 → loader → 选游戏 → 预览）；**登录后 = 2 步**（点「新建游戏」直接到选游戏 → 预览，跳过描述，因为目标不改变玩法、是机制带来拉新/复购）。注册仍在点「发布」时。
- **建游戏第 1 步可填店名**（placeholder/示例含星巴克、麦当劳等），并有可选「网站/社媒」字段（自动取 logo/配色）；注册页已无主页字段。
- **奖品券 = 折扣 + 张数，没有「中奖率」**：商家只填每种券发多少张；某券发完自动停发。
- **多店铺**：账号下可多家门店（各自地址，店名+地址必填、电话选填），游戏可对一家/几家/全部生效（默认全部，预览/工作台/「我的」都能加门店）。
- **游戏工作台 = 预览 + 手动控制 + AI 对话**：日常改动自动应用+撤销；改券的钱/量才弹确认。右上角「一键上线/下线」切换；右栏可传 logo（自动取色）+ 商品图。AI 回复为前端 mock，需接真实模型。
- **核销首选扫码**（扫客人奖品二维码），输入码兜底；只有二维码/滑动两种，没有 4 位码。
- **数据 KPI 按漏斗顺序**：玩了游戏 → 到店核销 → 新客到店 → 回头客到店；「哪个游戏带客」可跳到我的游戏调整。
- **一键召回**点击=就地成功提示（不跳数据页）。
- **游戏库玩法预览是动画占位**：上线按 `kind`（spin/scratch/stack/merge/drop/flip/hoop/draw）换成静音自动循环短视频（`<video> loop muted playsinline`）。
- 注册/生成/核销/数据/召回/多店多券库存均为前端 mock，需接真实后端。
