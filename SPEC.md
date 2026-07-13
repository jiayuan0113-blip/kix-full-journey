# KiX 商家端 · 完整旅程规格说明（交付给研发）

日期：2026-06-25（更新 2026-06-28）
配套文件：`index.html` + `journey.jsx` / `data.jsx` / `icons.jsx` + `logo.png`（同目录，一起交付）
用途：HTML 原型只能演示「主路径」的一条线，**所有分支、状态、边界情况以本文档为准**。
**后端对接看 §10（数据模型 + 每个页面用哪些接口/数据 + 业务规则 + 原型变量映射）。**

打开原型：本地起静态服务器后访问 `index.html`。可用 URL 参数直达任意状态调试（见下）。

---

## 0. 一句话产品

让街边小店用 AI 在 30 分钟内做一个带自己品牌的营销小游戏；客人扫码玩、赢券、**到店扫码/滑动核销**才计一次；商家在后台看「真实到店」数据，并能一键召回老客。

定位主线：**把路过的人，变成回头客**（Turn passers-by into regulars）。落地页大标题（2026-07-07 并入老板稿）：**They play. They pay. They stay.**（玩 → 付 → 留）。

---

## 1. 信息架构（IA）

```
未登录（Marketing + 首次建游戏）
  落地页 Landing
    └─[任意 CTA]→ 建游戏【三步】（全屏、无侧栏、聚焦）
         描述 →〔一个叙事 loader：匹配+生成〕→ 选一款 → 可编辑预览（仅品牌）
            └─[上线]→ 注册（发布闸门）→ 上线成功 Done（自动建默认活动）→ 进入后台

已登录（App Shell，常驻左侧栏 6 项）
  🏠 主页 Home   ← 登录后默认落点；**无 live 活动时=空 hero + 上手清单，隐藏所有假数据**（见 §4.5a）
  📋 活动 Activities  ← 新增：创建/管理活动（门店+券+选游戏）；活动卡 + ➕「新建活动」卡
  🎮 我的游戏 My games  ← 纯视觉：游戏外观/玩法管理；游戏卡 + ➕「新建游戏」卡
       └─【卡片可点】→ 游戏工作台（预览+品牌控制+AI 对话，不含券/门店）
  🎯 核销 Redeem（角标=待处理数；**无 live 活动/无数据时不显示角标**，不显示 0）
  📊 数据 Reports
  👤 我的 Me（账户 + 多店铺地址 + 品牌素材库）
```

**对象层级（活动与游戏分离，2026-06-27 重构）**：
```
账号 Account → 店铺 Outlet[]（结构化地址）
            → 游戏 Game[]（纯视觉：玩法模板 + 品牌配色/logo/商品图）
            → 活动 Activity[]（纯经营：参与门店 + 券 + 绑定一个游戏） → 核销流水 Redemption
```

> **核心拆分**：Game 管「长什么样、怎么玩」，Activity 管「在哪用、发什么、发多少」。一个活动绑定一个游戏（一对一）。券和门店是活动的属性，不是游戏的属性。

**导航 IA 的最优解依据（三体调研结论）**：对标 Shopify / Square / Stripe ——
- 数据/分析**永远不放前两位**（它们都排第 6–8 位或并入 Home）；
- **登录后默认落「主页」，主页本身=可瞥见的实时战绩 + 一个主动作**，不是冷冰冰的分析台；
- 首次建游戏期间**不暴露导航**（聚焦单一 aha 动作，符合 NN/g 渐进式披露与激活实证）；登录后才给常驻侧栏。

---

## 2. 全局状态机

`screen` 取值与渲染外壳：

| screen | 外壳 | 说明 |
|---|---|---|
| `landing` | 无 | 营销落地页 |
| `describe`/`building`/`results`/`preview` | **未登录=全屏 flow shell；已登录=App Shell（带侧栏）** | 建游戏三步（`building`=合并后的单个叙事 loader） |
| `register` | 简化顶栏（仅未登录到达） | 发布闸门 |
| `login` | 简化顶栏 | 统一手机验证码登录=注册（同一页） |
| `app`（含旧 `dashboard` 别名） | App Shell | 登录后后台，`appSec` 决定显示哪个区 |

> ⚠️ 旧的 `matching`/`detail`/`upload`/`generating` 四个 screen **已废除**：两个 loader 合并为一个 `building`；`detail`（试玩）和 `upload`（品牌）**折叠进 `preview`**（预览本身可试玩、可改品牌）。
> ⚠️ 旧的 `done`（上线成功庆祝页）**已废除（2026-06-30）**：发布游戏后直接落到 **主页（`app`/home）**，不再有独立庆祝页。

关键全局变量：
- `authed`：是否已登录。首次发布成功（注册完成）后置 `true`，此后不再回到未登录建游戏形态。
- `appSec`：App Shell 当前区（home/activities/games/redeem/reports/me），**受控**于上层。
- `editing`（AppShell 内部 state）：当前在「游戏工作台」编辑的游戏；为 null 时显示常规区。
- `editingAct`（AppShell 内部 state）：当前在编辑的活动；为 null 时显示常规区。
- `lang`：`en`（默认）/ `zh`。
- `need` / `game` / `brand`：本次建游戏的输入、所选模板、品牌（色/logo/商品图）。
- `myGames`：商家已创建的游戏数组（纯视觉模板实例）。
- `activities`：商家的活动数组。两种形态（`form`，2026-07-09）：
  - `longrun`（现有，默认）：`{id, name, form:'longrun', outletIds, vouchers, gameId, winScore, status, logo?, stat?}` —— 时间窗+达标赢券。
  - `challenge`（限时挑战赛）：`{id, name, form:'challenge', outletIds, gameId, status, logo?, schedule:{mode:'oneoff'|'recurring', date?, days?:[0-6], time, roundMins, endDate?}, tiebreak:'earliest', prizeLadder:[{from, to, prize:{type:'cash'|'item'|'discount'|'custom', denom?&count?(cash：商家自定面额×张数，总额=denom×count) | pct?(discount), label?(名称/商品名), img?(配图), codeSource?:'auto'|'custom', codeFile?}}], stat?:{players, walkins, newCust}}` —— 定点开赛+排名定奖（见 §3.9a）。奖品券码=系统自动生成或商家上传自有码（同长期活动 codeSource）。
- `outlets`：账号下的门店数组（结构化地址）。

URL 调试参数：`?screen=`(landing/describe/building/results/preview/register/login/app) `?sec=`(home/activities/games/redeem/reports/me) `?lang=`(en/zh) `?authed=1` `?edit=1`(进 My games 直接打开游戏工作台) `?editact=1/2/3`(直达第 N 个活动编辑器) `?need=<店名>`(选游戏/编辑页带入店名，派生品牌配色) `?nowalkins=1`(主页 S1"已上线待到店"态) `?rstep=card`(注册直达绑卡子步) `?act=<id>`(直达该活动编辑器) `?pickact=1`(开新建活动形态弹窗) `?card=0/1`(强制无卡/有卡；默认 authed=有卡) `?trialleft=N`(试用剩余天数)。

---

## 3. 关键分支与边界（研发必须实现，原型只演示了主路径）

### 3.1 注册后置（发布闸门）+ 收卡（2026-07-08）
- **未登录全程免注册**：落地页→建游戏全部可用、可玩、可改。
- 仅当点「上线」时弹注册（`register`）。**注册 = 两子步：① 账号（店名/地区/手机）② 绑卡（Stripe，收卡放最后一步）**。
- **绑卡步信任设计**：条款副标题(前 3 月免费·之后 S$29/月起、只算新生意、老客免费，一次) + 三条不同安心(到期前 7 天提醒 / 随时下线取消 / Stripe 加密看不到卡号) + 纯动作按钮「绑卡并上线」+ CTA 旁唯一「今天不会扣款」。卡只 tokenize 不扣款（SetupIntent 语义）；生产走 **Stripe hosted fields**，原型 mock。
- ⭐ **计费口径 = bible §4.0 CANON（2026-07-09，`mozatyin/kix-platform`）**：软件永久免费；基础费按**品牌 MAU**（本月玩过≥1次的活跃用户）= `max($29/品牌/月 地板, 梯度费)`、**≤12% 增量**、**只算新生意、永不碰老客存量**；免费窗口 = 满 3 个月或活跃用户达 1,000（先到）。梯度 0–1k=$0.49/1k–5k=$0.39/5k–20k=$0.29/20k–100k=$0.19/100k+=$0.12。广告 B = 竞价（非固定 CPA）。**旧「S$3/位新客·pay-per-result·从不收月费」全部作废**，商家端所有文案已迁。
  - **UI 呈现（2026-07-09 定稿）**：① 落地页 Pricing = **2 卡 + 免费→付费时间线**（现在 S$0 → 之后 $0.49/活跃玩家），非并列多档；用户好处排序（免费定制品牌游戏 → 老客免费 → 越多越便宜封顶12% → 多店合并账单）。② **全平台 UI 不强调 $29 月度地板价**（撤下所有显眼处，只在 FAQ 软性披露「很低的月度最低消费」防 bill-shock）。③ FAQ 用 per-active-player 梯度表（边际累进）讲清「越多越便宜」。④ 套餐（我的>套餐）无 freemium 分层，只 **标准版**（含免费窗口→按增长）+ **连锁版**（联系我们）。⑤ 计费单位 UI 暂定 **active player（MAU）**；⚠️ 后台旧「到店=计费」叙事与此的统一为**待办**（Joyce 暂按 active player，后台对齐另起一轮）。
- **返回统一**：内容区左上角「← 上一步」（绑卡步→账号步；账号步→回预览 `onBack`），顶栏右上「退出」——与建游戏各步一致。删掉原顶栏右上返回箭头（避免双返回）。
- 收卡写入 `cardOnFile`（**state 提升到 App**，authed=已有卡），存活进后台：我的>账单显示 ••••。落地页所有 "no credit card" 文案已删。**上线活动弹窗（ActivityPublishModal）不再显示「付款方式」**（卡在注册即收，不重复要卡、不显定价）——弹窗只剩 标题+说明+活动名+确认上线。
- 已有账号入口：账号步底部「登录」。

### 3.2 首次 vs 登录后建游戏（防死胡同）
- **首次（`authed=false`）**：建游戏全屏、无侧栏（聚焦）；顶栏「退出」→ 回落地页。
- **登录后（`authed=true`）**：建游戏在 **App Shell 内**进行，**左侧栏常驻**；顶栏放步骤条。用户可随时：
  - 点侧栏任意项 → 离开建游戏、落到该区（`onLeaveBuild`）；
  - 点「退出」→ 回后台（不是回落地页）。
- 即：登录用户永远不会进入「没有侧栏、出不去」的状态。

### 3.3 已登录跳过注册
- 登录后再建游戏，第二步用**完整工作台**（Workspace），点「保存游戏」**跳过注册**，把游戏存进 myGames，直接落到**主页**（已是登录态，不再有 done 页）。
- **发布游戏 ≠ 自动建活动**：保存游戏只进 My games；要让客人扫码玩，得去「活动」里新建活动并绑定该游戏、配券、选门店、提交审核上线。

### 3.4 建游戏入口 = 条件式（2026-07-10 重做，推翻 07-07"无描述步"）
- **首次（未登录）条件入口**：落地页 hero **输入了店名 → 直接进 Step2 选游戏**（跳过描述，stepper「描述」自动打勾）；**没输入店名 → 先进 Step1「描述」**（`startBuild`：`nm ? "building" : "describe"`）。
- **Step1「描述」已按设计稿复活**（`今天想做什么游戏？` + 搜索框 + 店型 chips 网格〔emoji 图标，12 类：咖啡/奶茶/餐厅/甜品/酒吧/烘焙/便利店/宠物/美妆/时装/花店/运动〕+「匹配游戏」）。stepper 标签 = **描述 / 选游戏 / 我的游戏**；顶栏「Step N of 3」。
- **登录后**：点「新建游戏」直接到选游戏(swipe)。
- **登录后**：点「新建游戏」直接到选游戏(swipe)。原「按活动目标/店型匹配」已废——目标不改变玩法本身，是机制(到店核销/自动召回)带来拉新/复购。

### 3.5 品牌素材来源
- 「我的 / 品牌素材库」存 logo、品牌色（上传 logo 自动取色）、商品图。
- 建游戏的品牌设置现已**折叠进预览**（不再是独立的「上传」步）：预览右侧 `BrandControls` 可换色 / 传 logo（自动取色）。应**默认继承** Me 素材库内容（原型两处独立，研发请打通）。

### 3.6 核销机制（重要：已无「4 位码」）
- 赢家凭**奖品二维码**到店；商家**手机扫码核销**（核销页首选「扫码核销」，调摄像头扫客人二维码）或输入奖品码兜底；**核销成功才计入「真实到店」**，未核销不收费。
- 全站任何文案不得再出现「4 位码 / 4-digit code」。

### 3.7 奖品券模型（折扣 + 张数，无中奖率）⭐
- 商家只定义**券 = 折扣 + 张数 + 每人限领**（如：100 张全免券；或 100 张 8 折 + 300 张 7 折）。**不存在「中奖/不中奖」概念，不让商家填中奖率。**
- **每张券字段（5 列卡片）**：`name 奖品名(如卡布奇诺)` · `price 原价` · `discount 折扣(免费/买一送一/8折)` · `qty 张数` · `validity 有效期(天数，获得后几天内可兑换，带?提示)`；运行期加 `awarded 已发` / `redeemed 已核销` / `remaining=qty−awarded`。
- **发券逻辑**：玩一次按各券剩余张数自然分布发出；某券张数发完 → 该券**自动停发**；全部发完 → 「活动结束/名额已满」。底层=按剩余库存加权抽取 + `remaining>0` 原子扣减防并发超发，但**商家侧只看到张数**。
- ⭐ **赢奖门槛 `winScore`（活动级，2026-07-02 新增，**选填**）**：在「按张数自然发放」之上可叠加一道**达标门槛**——玩家须在游戏中达到 `winScore` 才获得赢券资格（未达标不发）。**非必填**：不设则玩即有资格赢券（按库存发放）。数值单位**视游戏而定**（分数 / 关卡 / 回合），文案通用化不写死「分」。默认 1000。**仍无中奖率概念**——达标是确定性的、由玩家操作决定，不是概率。UI 在活动编辑器「游戏」板块下（`.win-cond`），标签带「选填」。
- ⭐ **券码来源 `codeSource`（2026-07-02 新增）**：每张券可选 `auto`（默认，系统在玩家赢券时生成唯一奖品二维码）或 `custom`（商家上传自备券码/二维码/验证码，适合已印好几百张、想自控的商家）。custom 时优先消耗商家上传的码，核销校验商家券码。接口 `PUT /activities/:id/vouchers/:vid/codes`。
- UI=奖品卡片（**标题「奖品券」**；奖品名带「奖品名称」字段标签在上 + 原价/折扣/张数 一行 + 图片；`showStock` 时显示「已发/剩余」；底部「券码：系统自动生成 / 上传自有券码」），「+ 添加券」加卡，**无中奖率、无凑满 100%**。组件 `VoucherEditor`。
- **券挂在活动（Activity）下，不挂在游戏（Game）下**。同一个游戏可被不同活动引用、各自配不同的券。
- **建游戏第 1 步选样例店**（星巴克/麦当劳/咖啡店…）自动套用**预设品牌包**：logo 字母 + 配色 + 商品图占位（`EXAMPLES[].mark/color/prod`）。上线接真实品牌库/官网抓取。

### 3.8 多店铺 + 活动作用门店 ⭐
- 一个账号可有**多家门店**，每家**结构化地址**（街道/城市/邮编/国家 + 经纬度）。在「我的 / 店铺」管理（增删改）。**不要自由文本地址。**
- 活动 scope = `outletIds`（账号下门店的子集）：**默认全部门店，可改为一家/几家**（Square `location_ids` 模式）。原型组件 `OutletScope`，放在活动编辑器（`ActivityEditor`）中。
- 核销按**扫码的那家门店**归因 → 这就是「可归因到门店的真实到店」。库存池为活动级共享（跨该活动的门店）。

### 3.9 活动与游戏的关系（2026-06-27 新增，2026-07-03 明确各自可独立上线）⭐
- **游戏可独立上线**（2026-07-03）：游戏 = 纯视觉可玩体验，**能脱离活动单独上线**（客人扫码就玩，**无奖品、无时限**）。活动 = 在游戏之上叠加**奖品券 + 起止时间**的营销 campaign（送奖品、有时限）。两者各有自己的上线状态。
- **一对一**：一个活动绑定一个游戏。活动 = 经营决策（哪些门店、发什么券），游戏 = 视觉体验（玩法模板、品牌配色）。
- ⭐ **上线的包含关系（2026-07-03 明确）**：**上线活动 ⊇ 上线游戏**——活动依附于游戏，上线活动会把它依附的游戏（带活动弹窗的版本）**一并自动上线**。因此：**上线游戏不是上线活动的前提**，商家可跳过独立上线游戏、直接上线活动。工程侧：`publishActivity(a)` 必须确保 `a.game.status='live'`（若尚非 live 则一并置 live）。反之，独立上线游戏 = 只让客人扫码玩、不产生奖品/到店/计费。
- **活动状态机（3 态，2026-07-03 去审批）**：`draft`（修改中）/ `live`（已上线）/ `offline`（已下线）。**无审批**。
  - 转移：`draft`/`offline` —点「上线」（弹二次确认）→ `live`；`live` —点下线→ **`offline`**（已下线，含跑完结束/手动暂停）。**直接上线，不走平台审批**。
  - **下线 → 已下线**（不回 draft）：跑完/暂停的活动与"从没上线的草稿"要区分开，便于查看历史、复制重开。
  - 活动列表筛选：全部 / 修改中(draft) / 已上线 / **已下线**（零计数 pill 自动隐藏）。**无进度条**（去审批后不需要）。
- **游戏状态机（2 态，2026-07-03）**：`draft`（草稿）/ `live`（已上线）。游戏**可脱离活动独立上线**（客人扫码即玩，无奖品/无时限）。`draft` —点「上线」（弹确认弹窗：方形+长方形封面 AI 默认可替换 + 改名）→ `live`；`live` —下线→ `draft`（游戏无时限无奖品，**不设 offline**——下线与草稿同义）。我的游戏页有状态筛选标签（全部/已上线/草稿）。**多选删除（2026-07-13）**：我的游戏页 / 活动列表页顶部「选择」→ 进入选择态，顶部筛选栏变**上下文操作栏**（取消 / 已选 N / 全选·取消全选 / 红色「删除 (N)」），卡片选中 = 绿框 + 右上角✓、卡内操作按钮隐藏；红色删除按 `window.confirm` 二次确认后 `setMyGames/setActivities` 过滤删除。对齐 Gmail/Drive/Photos 批量选择范式；CSS `.selbar/.selbar-n/.selbar-del`。
- ⚠️ **审核后台 review-admin.html 逻辑已与商家端脱节**（商家端去审批直接上线，审核后台仍展示"待审批"队列）；暂留，待定改「发布后审核」或删除。
- **活动编辑器**（`ActivityEditor`）：从上到下 = 顶部进度条（修改/审批/上线） → 活动名称 + 活动期限（开始/结束日期） → 奖品券（`VoucherEditor`，**单券、无有效期**） → 选游戏（展示用户已创建的所有游戏大卡片，点选即绑定；卡片下方「选择」「查看详情」按钮；末尾「+ 新建游戏」卡） → **参与门店（`OutletScope`，移到底部、紧挨二维码；已上线时置灰锁定，改门店需先下线）** → 活动二维码（**上线后每门店各一个 + 下载**） → 底部按钮（按状态：提交审核 / 取消提交 / 下线活动 / 修改并重新提交）+ 保存。
- **游戏选择器**：活动编辑器中展示商家已创建的所有游戏（大卡片 + 玩法动画预览），已绑定的游戏标记「已选」，可点击切换。末尾有「+ 新建游戏」大卡片入口。

### 3.9a 限时挑战赛（`form:'challenge'`，2026-07-09）⭐
第二种活动形态，与长期活动并列。品牌**自营**（用自己的品牌游戏、自己的排行榜、自己的档期），非赞助平台夜赛。
- **建活动第一步**：形态选择弹窗 `NewActivityPicker`（长期活动 vs 限时挑战赛对比卡，含"适合/例"）。选完进对应编辑器。
- **挑战赛编辑器**（`ActivityEditor` 内按 `form` 分支）：活动名+Logo → **档期 `ScheduleEditor`**（一次性/循环 段选、循环选星期 chips、开赛时间、单局时长、循环截止）→ **阶梯奖池 `PrizeLadderEditor`**（逐档 `名次区间 from–to → 奖品`；奖品四类可配 `cash`(填 S$)/`item`(商品名+图，UI 名「免费商品 / Free item」)/`discount`(填%)/`custom`(自填名+图)；「套用示例奖池」`SAMPLE_LADDER` 一键铺 + 「复制上一档」+ 删；**成本条** = 名额合计 + 现金奖合计 + "按实际排名发、空名次不发不花钱"，**不折现/不加总折扣与商品**，避免臆测总价与损失厌恶）→ **赛制**（同分裁决=先提交者靠前 + 每人每场限一局，均 app 侧保证；**不设最低人数门槛**，来多少人都照常开赛）→ 游戏/门店/二维码/上线复用长期活动那套。
- **不设人数上限/中奖上限**：开赛前人数不可知、人已参赛无法回头取消；成本由 card-on-file + 按真到店新客计费兜底，无需封顶。
- **App 侧契约**（Portal 只配置）：倒计时卡 + 开赛推送 → 限时玩一局 → 赛后排行榜 → 名次出券 → 到店兑（= verified walk-in 计费，同长期活动）。排行榜结算/名次出券/推送 = 后端职责。
- **helper**：`ladderStats(ladder)`→{slots,cash}；`schedSummary`/`nextSession`/`nextLabel`（`nextSession` 对过期一次性返 null → 卡显「已跑完」）。

### 3.9b 活动列表卡内容（产品三体收敛，2026-07-09）⭐
`ActivitiesView` 卡片按 form × status 自适应，原则 = **只放"可动作/可识别"信息；不放不可知前瞻或用户自设已知值；完整分析归数据页**。
- **footer 动作按状态**：`live` 主按钮 = 「门店二维码」（高频，点→多店弹 `ActivityQRSheet` 逐门店下载、单店直下），⋯ = 复制/在 KiX App 里看/下线；`offline` 主按钮 = 「上线」，⋯ = 复制/二维码/在 KiX App 里看；`draft` = 直接「复制」按钮（无 ⋯）。整卡点击 = 打开编辑器。
- **longrun 卡**：live/offline 显「X 人到店（含 Y 新客）」+ (**仅 live**) 券库存条「送 X · 剩 Y」(≤15% 橙/=0 红「打开可补券」)；draft 显「X 张券 · Y 门店」。
- **challenge 卡**：live 显「下一场 · <今天/明天/周五/日期 时间>」(过期=「已跑完」)；offline 显「X 人参赛 · Y 到店」(已发生实测)；draft 显「N 个奖 · X 门店」。徽章「🏆限时赛」。
- **筛选 pill**：全部/修改中/已上线/已下线（零计数隐藏；选中态计数归零→自动重置回"全部"）。徽章文案 `draft` = 「修改中」（与筛选一致，不再叫"草稿"）。

### 3.10 二维码体系（两种码，用途不同）⭐

| | 活动二维码 | 奖品二维码 |
|---|---|---|
| **生成时机** | **建活动起即可生成/下载**（deterministic from activity+outlet，不等审批；审批只 gate 游戏是否可玩） | 客人赢奖时系统生成，或商家自备上传（见 §3.7 codeSource） |
| **放在哪** | 收银台/桌面/门口贴纸 | 客人手机屏幕 |
| **谁扫** | **客人**扫 → 打开游戏页面 | **商家**扫 → 核销奖品 |
| **归属** | Activity 级别（逐门店各一个，用于归因） | IssuedVoucher 级别 |
| **谁生成** | **只能平台生成**（入场码不接受商家上传自定义图） | 平台生成 or 商家上传自控 |

- **活动二维码**：活动编辑器底部，逐门店展示 QR 卡片。**任意状态（草稿/审批/上线）都显示真码 + 「下载」**——它只是指向 Web 玩游戏页的链接，由 activity+outlet 决定性生成，商家可提前下载打印备货。**不接受商家上传自定义图**（入场码必须平台统一生成）。**主页 Hero 不放 QR**（多门店场景下无法用单一二维码覆盖，正确出口在活动编辑器底部）。
- **奖品二维码**：客人赢奖后生成在客人手机上，商家用核销页扫码或主页快捷核销按钮扫码验证。

### 3.11 奖品券图片（选填）
- 每张券可上传一张奖品图片（`VoucherEditor` 中，图片上传区放在原价/折扣/张数/每人一行的右侧）。
- 用于客人端展示奖品样子。选填，不影响功能。

---

## 4. 各页面规格

### 4.1 落地页 Landing（重做 2026-07-07：并入老板设计稿 boss LEAN；叙事 = 是什么→怎么用→看你的游戏→为什么有效→价格→FAQ→CTA）
**IA 顺序**：
1. **Hero｜是什么**：三行大标题「They play. / They pay. / They stay.」（stay 绿高亮）+ 价值 chips（3 min to launch · S$0 to start · First 3 months free）+ CTA = **输入框「Your business name」+「See my game →」按钮**（点击 → 建游戏流 `go`）+ 右侧「空店场景」插画（"Another slow day… same empty seats"，纯 CSS `.hscene`）。（2026-07-13：删眉标 `TURN YOUR BUSINESS INTO A PLAYGROUND`、删场景下的 flow-cap、删「No hardware」chip。）
2. **走查 Walkthrough｜Turn your business into a playground**（`id=the-game`；小字 `With your own branded game, customers play, pay and stay.`）：5 屏真机截图（`walkthrough/poster|play|win|redeem.png`，**Pocket Coffee / Cheerful Goat 素材**；②「扫码」为 CSS 占位、无真图）+ 每屏大标题（Spots your poster / Scans, no app / Plays YOUR game / Wins a voucher / Redeems & returns，**无小字**）+ 箭头 + PLAY/PAY/STAY 三卡（无 emoji）。
3. **See your game（WOW）**：两行标题「Type your business name / See your game in 3 min」（第二行绿）+ 副标（AI matches 1,000+ formats… your logo & colors）+ 输入框按钮 + note（Free · no credit card）+ 右侧游戏图（`walkthrough/play.png`）。
4. **为什么有效 WhyGame｜Why a game beats a discount**（`id=why`）：3 卡（Rewards never cash / Every visit is verified / Every game feeds the network），**真实 icon**（gift/shield/globe），复用 `.steps/.stp/.si`。
5. **价格 Pricing**（`id=pricing`）：见下。
6. **FAQ｜Everything a business owner asks**（`id=questions`）：6 条，**静态全展开**（去掉 + 折叠——已讲完无需展开）。
7. **结尾 CTA**：「Every business deserves its own playground」（playground 绿）+「Build my game — free」+ 细则（No credit card · first 3 months free · cancel anytime）+ 页脚。
- **Nav**：The game · Why it works · Pricing · Questions（点击平滑滚动到对应 `id`；EN/中文 + 登录 + 免费开始 保留）。
- **价格模型（2026-07-10 定稿，以上文 §4.0 CANON 为准）**：落地页 **2 卡** —— ①「GROW WITH KIX / 成长计划」(`.tier.pop`)：Free for 3 months（or first 1,000 players）→ then **S$0.49 / active player**（越多越便宜）；4 要点（不限定制游戏与看板 · S$29/mo minimum · never for your regulars · 软件永远免费只为增长付费 · 无绑定随时取消）；`Start free`。②「CUSTOM / Need something custom?」（**任何规模，非仅连锁**）→ `Talk to us` **弹 `CustomLeadModal` 线索表单**（见 CHANGELOG #85）。**旧「S$3/new customer · PAY PER RESULT · FREE FOREVER」作废。** 币种 = 新币 S$；计费单位 = active player（MAU）。⚠️「我的」页 `PLANS` 旧「专业版 S$49/月」与此仍不一致 = 待对齐。
- **CustomLeadModal（线索表单，#85）**：`Talk to us` 点击弹出（`?lead=1` 调试）。5 必填（姓名/品牌名/电话·WhatsApp/邮箱/「你需要什么」下拉）+ 选填留言 + PDPA 同意；提交后感谢态含 **WhatsApp 即时出口**。⚠️ `WA_LINK` 占位待换真号；`submit()` 前端 mock 待接后端（存线索 + 通知 BD）。
- **卡文案去重（#62）**：三卡描述改为"只讲 bullet 不讲的一件事"——FREE=`适合做你的第一个游戏。`；PAY=`前 3 个月免费 · 价格锁定。`（去掉与价格标签重复的"只为新客付费"及"永不收软件费"）；CHAINS=`适合成长中的多门店品牌。`（原描述是下方 bullet 的复述）。**已删**三卡下方 `.pnote` 底注（与卡描述 + 上方 WhyGame「老客免费」段重复）。
- 原型组件：`Hero/Walkthrough/SeeYourGame/WhyGame/Pricing/Faq` + 结尾 CTA；CSS `.hscene/.hero-tag/.wt-*/.ppp*/.wow-*/.pnote`；新增 `Ic.globe`。**已从落地页移除渲染**：`Steps/Gallery/ThreeThings/Stories/FairDeal`（组件函数仍留在 `journey.jsx`，便于回退）。**已删数据**：`HEADLINE/SUB_LANDING`。
- ⚠️ 全站中文为占位草稿，待 Joyce 定稿。

### 4.2 建游戏 — 步数随是否登录而变 ⭐（2026-07-07 重做：店名前移到首页 + 选游戏改 swipe 轮换）
> 由旧 6 步压缩（三体调研：先给成品再要注册，对标 Durable/Carrd/Canva）。**2026-07-07 起：第 1 步"店名"直接在落地页 hero 输入，未登录建游戏不再有独立"描述/店型"屏。**
- **未登录＝3 步**（步骤条：**店名 / 选游戏 / 上线**；`STEP_IDX` building/results=1、preview=2 —— 店名在首页完成即 step0 打勾）：
  1. **店名**（落地页 hero / `SeeYourGame` 输入框，受控）：点「See my game」带店名进入建游戏流（`startBuild(name)` → 未登录直接 `building`）。**已删原 `describe` 店型屏**（"目标不改变玩法本身"，店型 chips 不再需要）。
  2. **〔一个叙事 loader〕**（`building`）：`Loader` 逐条旁白「正在为 {店名} 挑玩法」。labor-illusion，≤60s。
  3. **选游戏 = 单台大手机「这是你的游戏」**（`results`，2026-07-08 重做，取代 coverflow/8 宫格）：居中大标题「这是你的游戏」（已是基于店名的基础定制游戏预览，非从零挑；标题不说"玩"——这步只预览动效，试玩在下一步）+ **预览手机在左 / 操作在右**（与第 3 步对齐）。右栏：`你输入了 X ✎改`（可现场改店名→实时换品牌配色，`onRename=setNeed`）→ 游戏名 + `推荐理由`(取模板 `lede`) → **「用这个游戏」**（带出配色写入 `brand.color` → 第 3 步）。手机下方「换一个看看」（循环 TEMPLATES，控制离手机最近）。品牌配色由店名 `COLOR_SETS` 哈希派生。
- **登录后＝2 步**（步骤条：选游戏 / 改游戏·上线，`STEPS_RET`）：⭐ 点「新建游戏」**跳过店名与 loader，直接到选游戏(swipe)** → **修改游戏**（完整三栏工作台 `Workspace`）+ 底部「上一步」「保存游戏」（存草稿，发布走 My games 卡）。
- **第 3 步 = 编辑页直接上线**（`preview`）：进来即 `branded=true`（不再 neutral→生成的变身），左=已套品牌的**可玩**游戏；右=`BrandControls`（换色 + 传 logo 自动取色 + 商品图）；标题「最后微调一下」。
  - **不再显示券和门店**——券和门店是「活动」的属性（见 3.9）。
  - 左上「← 上一步」（回 swipe）；主按钮 **`上线`**（未登录 → 注册闸门 `toPublishGate`，符合"注册后置到发布闸门"）。
- 步骤条**水平居中**于顶栏。「上一步」在 swipe 页移到**左上角**（`alignSelf:flex-start`）。

### 4.3 注册（发布闸门）
- 字段：商家名称\*、国家/地区\*、手机号\*（WhatsApp）。**已删主页/网站字段**（移到建游戏第 1 步作为可选项）。
- 一个主按钮「创建账号并发布游戏」（必填未完成=实心柔和绿禁用态）。

### 4.4 上线成功 Done — ❌ 已废除（2026-06-30 移出流程，2026-07-02 删除代码）
保存游戏后 `publishDone` **直接进主页**，无独立庆祝页。原因：game/activity 分离后保存游戏不产生二维码，该页展示的 QR + "开始营业了" 是假信息；确认成功 + 下一步引导已由主页空态「上手清单」内联承接。`Done` 组件 + `screen==="done"` 分支已删除。

### 4.5 App Shell · 主页 Home（登录默认落点）

**设计逻辑**：主页 = 商家每天打开看一眼的「仪表盘」。不做数据分析（那是 Reports 的事），只做三件事：① 当前活动战绩一瞥，② 最高频日常操作（扫码核销）一步触达，③ 推动商家完成下一个关键动作。

**Hero 区（深色块）**：
- `LIVE` 标签 + 活动名称（可点击，跳活动编辑器）+ 今日三个数（plays / 到店 / 已核销）。
- **多门店分条**（门店数 ≥ 2 时显示）：Hero 内 `outlet-bar` 显示各门店今日到店数，格式「淡滨尼 7 到店 · 裕廊 5 到店」；数据来源 `DEMO_METRICS.today.byOutlet`（真实工程 = 当日按门店归因到店数接口）。
- **全宽「扫码核销」按钮**（`btn primary lg`，Hero 底部）：唯一主动作，点击跳核销页（Redeem）。
- **无 QR 码**：活动 QR 不放主页 Hero——一个活动可关联多个门店，每个门店有独立二维码，正确出口在「活动」编辑器底部（逐门店下载）。
- **Hero 三态**（2026-07-03，检测认游戏）：
  1. **有 live 活动** → 活动战绩 hero（LIVE + 活动名 + 今日三数 + 扫码核销），如上。
  2. **无 live 活动、但有 live 游戏** → 深色 hero：绿色 `LIVE` 徽章 + 游戏名「XX · 正在跑」（点击跳我的游戏）+ 副文案「客人扫码就能玩。想送奖品、把人变成到店客？加一个活动。」+ 「+ 新建活动」按钮。**不再谎报"还没有活动"**——游戏可独立上线（#51），此时游戏确实在跑，只是还没进到店/钱的路径。
  3. **无 live 活动、也无 live 游戏** → 空态 hero「暂时还没有活动 / 建个活动就能开门营业」+ 「+ 新建活动」。
- **判据**：`liveAct = activities.find(status==='live')`；`liveGame = myGames.find(status==='live')`。工程侧同源。
- ⚠️ **上手清单第 1 步「游戏已创建」保持被动打勾、不可点**：上线游戏不是上线活动的前提，且上线活动会自动上线其依附的游戏（见 §3.9），把第 1 步做成可点的「上线游戏」会制造假顺序 + 永远打不上的勾，故只作进度展示。

**进度推动（非模态，4 步）**：✓ 游戏已创建 → ② 补充活动细节（「去完善」按钮跳到第一个活动编辑器）→ ③ 打印各门店二维码（上线后出现「去下载」链接 → 跳活动列表，每门店有独立 QR 下载）→ ④ 第一位客人到店核销。帮商家在首次上手时知道「下一步做什么」。

**最近动态 + 召回卡**（**仅在有 live 活动时显示**）：
- 最近核销/新客流水列表（4 条）。
- 召回卡：「18 位老顾客超过 30 天没来」→ 一键发送召回通知 → 就地变成「已发送」成功态（不跳转）。

#### 4.5a 全站统一空状态系统（2026-06-30）⭐
统一 `EmptyState`（图标 + 标题 + 一句副文案 + 一个主动作 + 可选次按钮）。**判空才渲染**：无真实数据时给空态，绝不显示编造数字/0 值图表。按"上游依赖"分级，动作直达要补的那一步：

| 页面 | 空态触发 | 标题 | 主动作 |
|---|---|---|---|
| 活动 | 无任何活动 | 还没有活动 | 新建活动 |
| 核销 | 无活动 | 还没有可核销的奖品 | 新建活动 |
| 核销 | 有活动但无 live | 活动还没上线 | 去活动 |
| 核销 | 有 live 但 `awarded==0` | 还没有人赢到奖品 | 下载活动二维码（次：查看活动） |
| 数据 | 无 live（无活动） | 还没有数据 | 新建活动 |
| 数据 | 无 live（有活动） | 上线后才有数据 | 去活动 |
| 数据 | 有 live 但 0 核销 | 已上线，等第一位到店 | 下载二维码（次：管理活动） |
| 我的游戏 | 游戏未被 live 活动使用 | （不空，但去掉假战绩）显示「还没用在已上线的活动里」、不显 LIVE 角标 | 打开编辑 |

##### 首次登录/无 live 活动的主页空态
- **判据**：商家没有 `status==='live'` 的活动（典型 = 全新商家首次发布游戏后落到主页，还没建/上线任何活动）。
- **只显示两块**：① 空 hero（「暂时还没有活动 / 建个活动就能开门营业」+ 「+ 新建活动」）；② 上手清单「让第一波人玩起来」。
- **隐藏所有没数据来源的模块**：最近动态流、召回老客卡、侧栏「核销」角标。统计/动态/召回**必须有真实数据才渲染**，绝不显示编造数字或 0。
- 上手清单第 2 步动态：无活动=「新建第一个活动」；有草稿=「配置并上线活动」；已上线=打勾、第 3 步高亮。
- 原型：`publishDone` 在全新商家首次发布时把 activities 置空；调试用 `?fresh=1` 模拟。

**底部**：不再有常驻「+ 新建活动」按钮（空态 hero 里已有最醒目的入口）。

---

### 4.5b 活动 Activities（2026-06-27 新增）⭐

**设计逻辑**：活动是 KiX 的核心经营单元。一个活动 = 一次营销 campaign：在哪些门店、发什么券、用哪个游戏、状态是否上线。活动和游戏分离的原因：游戏只管「长什么样、怎么玩」（纯视觉），活动管「在哪用、发什么、发多少」（纯经营）。同一个游戏可以被不同活动引用。

**为什么需要独立的活动页**：
- 券的张数、折扣、门店范围 = 经营决策，和游戏的配色/玩法无关。之前把这些塞进游戏编辑器是错误的——改配色时看到一堆券字段是噪音，设置券时看到一堆品牌控制也是噪音。
- 商家可能想用同一个转盘游戏做两次不同的促销（比如周末促销用大额券、平日促销用小额券），只需建两个活动绑同一个游戏。

#### 4.5b-1 活动列表页

**有活动时**：
- **页面顶栏右侧**（`app-bar-r`）：「+ New activity / + 新建活动」绿色按钮，始终可见，一步触达建活动流程。
- 卡片网格（3 列），每张卡片 = 绑定游戏的玩法动画预览 + 活动名称 + 信息摘要（「3 张券 · 2 家门店」）+ 状态徽章。
- **整卡可点 → 进入活动编辑器**；游戏图上 hover 显示「打开编辑」白色胶囊浮层。
- **卡片底部按钮**：「复制」（生成 draft 副本、打开编辑器微调）；已上线卡再加「二维码」（直接下载 PNG）。
- 筛选 pill：全部 / 修改中 / 审批中 / 已上线 / **已下线**（零计数自动隐藏）。
- 新建入口**只在顶栏右上角**（见上），底部不再放虚线「新建活动」卡。

**无活动时**：
- 空状态全页引导：居中图标 + 「还没有活动」标题 + 一行说明（「创建你的第一个活动 —— 选门店、设券、绑游戏」）+ 「+ 新建活动」大按钮。

#### 4.5b-2 活动编辑器（`ActivityEditor`）

**入口**：点击活动卡或「新建活动」进入。在 App Shell 内，左侧栏常驻。

**顶栏**：
- 返回箭头（← 回活动列表）+ 活动名称 + 状态徽章（已上线/审批中/草稿/被驳回）。
- 顶栏下方一行 **3 段进度条（修改 → 审批 → 上线）**，按 `activity.status` 高亮当前阶段。状态**实时反映**当前 `activity.status`。
- **活动列表**（`ActivitiesView`）顶部有筛选 pill：全部 / 修改中（草稿+被驳回）/ 审批中 / 已上线；**零计数标签自动隐藏**（全部除外）。

**编辑器内容（从上到下，每块一个 panel 卡片）**：

1. **活动名称 + 活动期限**（panel）：活动名称输入框 + 下方两个并排 date picker（开始日期 / 结束日期），定义活动的有效运行时间段。

2. **参与门店**（panel，`OutletScope` 组件）：
   - 复选框列表，默认全部勾选。可单独勾选/取消。
   - 「+ 添加门店」：展开内联表单（店名\*、街道地址\*、城市、邮编），保存后自动勾选。
   - 设计逻辑：一个活动的券库存是跨门店共享的，这里选的是「哪些门店的客人可以参与」以及「核销归因到哪家店」。

3. **奖品券**（panel，`VoucherEditor` 组件）：
   - 标题**「奖品券」**（简化，不再罗列字段）。每张券一个卡片：**「奖品名称」字段标签 + 名称输入框** + 已发/剩余（showStock 时）。
   - 下方一行：原价 / 折扣 / 张数。右侧=**奖品图片上传**（选填，虚线框，上传后显示缩略图可删）。
   - **券码来源**（底部一行）：`系统自动生成`（默认）/ `上传自有券码` 两个 pill。选后者出现上传入口（二维码图 / 验证码表格）+ 已上传文件名/张数 + 重新上传。见 §3.7 `codeSource`。
   - 说明随模式切换：auto=「按张数自然发放，发完即停 —— 不用设中奖率」；custom=「按你上传的券码依次发放、发完即停；核销时校验你的券码」。
   - 设计逻辑：商家只管「发什么、发多少」，不需要理解概率。自备券码的商家可上传自控。

4. **游戏选择器**（panel）：
   - 标题「游戏」+ 说明「选一个游戏用在这个活动上。」
   - 展示商家已创建的**所有游戏大卡片**（3 列网格）：玩法动画预览 + 名称 + 描述。已选游戏卡片带绿色边框（`.sel`）。
   - 每张卡下方两个按钮：**「选择」**（选中后变绿色「已选择」）/ **「查看详情」**（跳到游戏工作台编辑视觉）。卡片图片区域不再叠加「已选」标签，仅通过按钮状态和卡片边框区分。
   - 末尾 ➕「新建游戏」大卡片 → 跳转到建游戏流程。
   - **游戏名称编辑**：进入「查看详情」（`Workspace`）后，工具栏左侧有可编辑的游戏名称输入框（`ws-gamename`），改名同步更新 `myGames`。
   - ⭐ **赢奖条件**（游戏板块下，`.win-cond`）：「达到 [X] 即可赢得奖品券」（`activity.winScore`，默认 1000）。X 视游戏而定=分数/关卡/回合，文案通用不写死单位。见 §3.7。
   - 一个活动只绑定一个游戏（一对一），点击另一个游戏 = 切换绑定。
   - 设计逻辑：游戏是可复用的视觉模板。商家建了一个品牌转盘，可以在不同活动里反复使用，每次配不同的券和门店。

5. **活动二维码**（panel）：
   - **逐门店卡片**（一门店一码，用于归因）。**任意状态都显示真码 + 「下载」**——它只是指向 Web 玩游戏页的链接。**首次保存时生成、之后固定不变**（可放心打印，后续编辑活动也不变）。**不接受商家上传自定义图**（入场码必须平台统一生成）。
   - 设计逻辑：二维码是活动级别的（不是游戏级别）。QR URL 由 activity+outlet 决定性生成、创建时固定，编辑活动不重新生成，保证打印出去的码永久有效。

6. **底部操作栏**（去审批后）：
   - 左=**上线/下线按钮**：draft/offline 显示「上线」（点击弹**二次确认弹窗** `ActivityPublishModal`：活动名 + **付款方式**（card on file，首次未存卡才出卡输入；SetupIntent 不扣款；文案「首月免费，之后按到店笔数收费，随时可下线、无最低消费」；未填卡则「确认上线」置灰）+ 确认上线/取消 → 直接置 live，无审批 → **切成功态**：绿勾「已上线🎉」+ `QRDownload`（在 App 查看）+ 「完成」。见 §6.7 / §4.9a）；live 显示「下线活动」（→ offline）。
   - 右=**「保存并返回」**。保存所有编辑（名称/门店/券/游戏绑定/winScore），返回活动列表。

---

### 4.6 我的游戏 My games（纯视觉，不含券/门店）

**设计逻辑**：游戏 = 纯视觉体验模板。商家在这里管理「游戏长什么样」（玩法类型、品牌配色、logo、商品图），不涉及券和门店。游戏做好之后，在「活动」里被引用。

**页面结构**：
- **状态筛选标签**（顶部）：全部 / 已上线 / 草稿（零计数隐藏）。游戏 2 态：`draft`/`live`。
- 卡片网格（3 列），每张卡 = 玩法动画预览 + **状态徽章**（草稿/已上线）+ 名称 + 状态说明。游戏图上 hover 显示「打开编辑」浮层。
- 卡片底部动作：草稿 →「上线」（弹确认弹窗）；已上线 →「下线」（回草稿）。
- ➕「新建游戏」卡 → 进入建游戏流程（选模板 → 预览品牌）。

**上线确认弹窗（`PublishGameModal`）**：点「上线」弹出——**方形 + 长方形两个封面**（AI 自动生成默认，各带「替换」上传）+ **游戏名称**（可改）+ 确认上线 / 取消。封面字段 `coverSquare`/`coverRect`。**无付款方式**（游戏不计费，见 §6.7）。确认后**切成功态**：绿勾「游戏已上线🎉」+ `QRDownload`（在 App 查看）+「完成」。

**与活动的关系**：游戏可独立上线（无奖品/无时限），也可被活动引用（活动加券+时限）。一个游戏可被多个活动引用。删除游戏前应检查是否被活动引用。

---

### 4.6b 游戏工作台 Game Workspace（My games 点开 → 编辑）⭐

**设计逻辑**：面向非技术商家的「对话改游戏 + 手动微调」，只管视觉。券/门店/上下线都在「活动」中管理，工作台不涉及。

**布局 3 栏**：

- **左栏 AI 对话**（280px）：
  - 建议 chips（更有节日感 / 转盘改蓝 / 更明亮一点 / 套用我的品牌色）+ 输入框。
  - 普通改动自动应用 + 预览即时变 + 一句话回执。
  - 输入券相关关键词（券/voucher/奖/prize）时**不执行**，回复提示「奖品券在活动里管理，去左侧栏的活动添加或修改」。
  - 顶部 Undo/Redo/History 按钮（占位，接版本快照）。

- **中栏 实时预览**（flex-1）：
  - 可玩的游戏 Demo（转盘/刮刮卡等）。
  - 顶部工具条：Undo / Redo / History。
  - **无上线/下线按钮**——上下线是活动的事，不是游戏的事。

- **右栏 手动控制**（400px）：
  - 仅 `BrandControls`：换色（色板选择 + 随机换色）/ 上传 logo（自动取色）/ 商品图上传。
  - **不含** VoucherEditor 和 OutletScope。
  - 手动与 AI 共享同一状态（AI 改色，右侧 swatch 同步高亮）。

---

### 4.7 核销 Redeem（操作页，简要；完整分析在 Reports）⭐

**设计逻辑**：核销页 = 收银台场景的高频操作工具。要快、信息少、一个动作完成核销。完整的核销数据分析在「数据」页，这里只放操作 + 一眼概览，不重复。对标 Square/Toast/Lightspeed：redeem 流程与分析 dashboard 始终分离。

**核销流程**：客人赢奖后手机上有一个**奖品二维码**（IssuedVoucher 级别） → 到店出示 → 商家用核销页**扫码**或输入奖品码 → 系统校验（券存在、未核销、未过期、属于该商家）→ 核销成功 = 一次「真实到店」，按扫码门店归因。

**两栏布局**：
- **左栏·扫码核销（主操作）**：
  - 大按钮「扫码核销」→ 进入摄像头取景态 → 识别成功自动核销。
  - 「或 输入奖品码」兜底（手动输码 + 核销按钮）。
  - 核销成功：绿色提示「核销成功 —— 已计入真实到店」。
- **左栏·最近核销**：最近核销流水（最多 4 条，只显示真实数据）。**无核销记录时整块面板不渲染**（不编造/不重复填充）。

- **右栏·概览三数**：今日核销 / 待核销（已发未核销） / 累计核销（demo：9 / 34 / 86）。
- **右栏·奖品券核销（简要）**：每券一行 = 名称·折扣 + `已核销/总张数`（demo 86/200）+ 单段进度条。顶部「查看完整数据 →」跳 Reports。

**主页的快捷核销 vs 核销页的区别**：主页 hero 里的「核销」按钮是快捷入口（一键扫码，适合「客人来了赶紧扫一下」），核销页是完整操作台（有输码兜底、核销历史、券概览）。

---

### 4.8 数据 Reports（深看，排第 5）

**顶部「活动 / 游戏」分段切换（2026-07-03 新增）**：因游戏可独立上线（无奖品/无到店），数据分两套口径：
- **活动**：真实到店核销视角（下述）。
- **游戏**：独立上线游戏的**纯玩数据**——游玩次数(hero) + 玩家数 + **玩的时长(平均每局)** + 各游戏游玩次数 + 每日游玩。**无到店/核销/门店/券**（游戏没有这些）。数据源 `GAME_METRICS`（plays/players/avgPlaySec/byGame/trend）。无 live 游戏 → 空态「去我的游戏」。〔2026-07-13：**「完成率」改「玩的时长(38s)」**（完成率对店主无意义）；删各卡冗余副标题（VERIFIED WALK-INS / From scan to walk-in / New vs returning / Walk-ins per day）；Games hero 副标题去「不收到店费」句。IA 分层(参与度 Games / 转化 Activities)已对，见 `Desktop/Mozat/kix/[决策] 2026-07-13-KiX数据页IA与指标-三体.md`。〕

**活动数据设计逻辑（2026-06-30 重构）**：街边小店打开数据页只问三件事——"带来真客人了吗 / 值不值 / 下一步干嘛"，30 秒看完。**真实到店核销 = 唯一付费且独家可证的指标 → 做绝对主角**；其余指标非升即砍（REDUCTIVE）。**全程不出现金额/花费**（产品决策，延续 landing"别让钱吓到商家"；账单归他处）。

**日期切换**：今天 / 近 7 天 / 近 30 天（右上）。

**版块（自上而下）**：
1. **Hero（深色 band）**：真实到店核销大数 + 环比 + 趋势 sparkline。文案"只算真正走进门、被核销的客人——你唯一付费的对象"。
2. **转化漏斗**：扫码玩 312 →(38% 赢券) 赢到券 120 →(72% 到店) 到店核销 86。**吸收原"玩了游戏"KPI 当分母**，不再单列虚荣数。
3. **新客 vs 回头**：横向分段条 + 两个数（证明"把路过变回头客"）。
4. **每日到店趋势**：柱图。
5. **〔条件〕各活动带客排名**：仅 **≥2 个 live 活动**时显示（单活动是一根废条）。
6. **〔条件〕各门店到店**：仅 **≥2 门店**时显示。

**已删除**（去重）：~~奖品券剩余~~（核销页已有券核销进度）、~~最近到店流水~~（主页已有）。数据页只做分析，不重复运营信息。

**数据来源**：原型全站统一从 `data.jsx` 的 `DEMO_METRICS` 取数（口径自洽）；研发应同样让所有指标来自单一数据源/接口，避免各页口径打架。

---

### 4.9 我的 Me

**设计逻辑**：账号级设置，管理身份、门店、品牌素材。不是高频页面，但每项变更影响全局（店名出现在游戏页面，品牌色自动套用到新建游戏）。

- **账户**：商家名称（必填，出现在游戏和凭证上）/ 手机号 WhatsApp（选填，用于联系）。
- **账单与套餐（2026-07-06 新增）**：两行——①**套餐**（当前套餐名 + 价格，「切换套餐」→ `PlanModal`：免费版 S$0（无月费·到店 S$3/位）/ 专业版 S$49（当前）/ 连锁版 定制，任意套餐首月免费）；②**付款方式**（`Visa •••• last4`，「更换」；无卡则「添加银行卡」→ `CardModal`，SetupIntent 语义不扣款）。底部注解「首月不扣款、无最低消费、随时可下线」。account 菜单「账单与套餐」跳到本页。调试参数 `?bill=plan` / `?bill=card`。
- **KiX App 面板（2026-07-06 新增）**：常驻 `QRDownload`（二维码 + 扫码下载文案 + App Store/Google Play 徽章）。见下「下载 App 入口」。
- **店铺 Outlets**：多家门店卡片列表。每家 = 店名\* + 街道地址\* + 城市 + 邮编 + 国家 + 门店电话（选填）。主店带「主店」标。可增删改 + 「+ 添加店铺」。
- **品牌素材库**：Logo（上传后自动取色为品牌色）+ 品牌色色板 + 商品图（上传多张，建游戏时自动套用）。

#### 4.9a 下载 KiX App 入口（2026-07-06 新增）⭐
**前提**：商家生成的游戏/活动**上架在 KiX App**，商家需下载 App 才能看到自己产物的真实上架效果（区别于 Portal 里的编辑器预览）。商家在桌面 Web 操作、产物在手机 App → 用 **QR 码**做桌面→手机交接（配 App Store/Google Play 徽章兜底）。
**放三处（情境主推 + 持久兜底，不散落横幅）**：
1. **上线成功那一刻**（`PublishGameModal` / `ActivityPublishModal` 的成功态 `step==="done"`）：绿勾 + "已上线🎉" + `QRDownload`。相关度最高。
2. **每张 LIVE 卡「在 App 查看」**：我的游戏（live 卡）+ 活动（live 卡）→ 点开 `AppQRModal`（QR 弹窗）。
3. **「我的」页 KiX App 面板**：常驻兜底。
**不做**：Home hero / 侧栏 / 每页横幅塞下载 banner（守单一焦点、加法伤留存；判据见"真空 vs 加法"）。
**组件**：`QRGlyph`（伪 QR 视觉）/ `QRDownload`（QR+文案+徽章块）/ `AppQRModal`（弹窗）。真实工程：QR 指向 device-routed 下载链接（iOS→App Store、Android→Play），保留链接兜底。

### 4.10 平台审核后台 Review Console（`review-admin.html`，独立页面）⭐
**受众**：KiX 平台审核员（内部运营），**非商家端**。独立单文件 demo，复用同套设计 tokens。对标 App Store Connect 审核队列 / 内容审核 modqueue / Retool 数据表。
- **数据表队列**：每行 = 一个商家活动提交（商家+电话 / 活动 / 游戏类型 / 奖品券 / 门店数 / 提交时间 / 状态 / 操作）。异常项（如券量偏高）行内 ⚠。
- **筛选**：待审批 / 已通过 / 已驳回 / 全部（带计数 pill）。
- **首页行内动作**：待审行有「通过 / 驳回」——通过=即时置 live；驳回=打开抽屉填原因（原因商家可见）。
- **详情抽屉**（点行展开）：完整展示提交的**全部内容**供审核——
  - **商家上传素材**：品牌 LOGO + 配色色板 + 商品图（商家上传的照片）。
  - **游戏**：预览 + 玩法类型 + 赢奖条件；「▶ 打开试玩」= 手机框预览客人玩到的游戏。
  - **奖品券**：名称/折扣/张数/有效期/券码来源；若「商家自有券码」，显示**券码文件**（文件名 + 张数 + 查看/下载）。
  - **门店**：逐门店地址。**活动信息**：期限、提交时间。**审核清单**：4 项人工核对项。
  - **审核备注**（待审态常驻文本框）：审核员记录需商家修改的地方；驳回时这段备注自动作为说明发给商家。
- **动作结果**：通过 → 状态 live（真实工程回写活动 `status=live`，商家端联动上线）；驳回 → 状态 rejected + 原因（商家端显示「被驳回：原因」）。
- **接口（真实工程）**：`GET /admin/submissions?status=`（队列）、`POST /admin/submissions/:id/approve`、`POST /admin/submissions/:id/reject {reason}`。审核台与商家端**共用后端**，approve/reject 回写活动状态机（§状态机 review→live / review→rejected）。
- **原型局限**：静态 mock，approve/reject 只改本地状态；素材/券码文件用样式块+emoji 表意，真实为 `<img>`/文件下载。调试参数 `?open=<id>` `?play=1`。

---

## 5. 国际化（i18n）
- **默认英文，可切中文**；切换器在四处页头右侧（落地页 nav / 注册顶栏 / 建游戏顶栏或侧栏 / App Shell 侧栏底）。
- **翻译非直译**：英文按目标语境改写，不照中文字面。例：
  - 角标 EN「Built for neighbourhood shops — cafés, bubble tea, street food & more」（不用 `/`、不用 `…`）。
  - coupon → **voucher**（全站统一用 voucher）。
  - 英文引号用 `“ ”`，不用中文方括号 `「 」`。
- 实现：`tr(lang, en, zh)` 内联 + `P(lang, obj)` 取数据双语字段（见 `data.jsx`）。

---

## 6. 设计 tokens / 品牌
- 主色：`--green #16A34A`（按钮/强调）、`--green-br #22C55E`、品牌绿 logo 自带黑描边（深浅底通用）。
- 文字/底：`--ink #0B1220`、`--muted #5C6B7A`、`--bg #F2F7F4`、`--line #E4EBE8`。
- 字体：Plus Jakarta Sans + PingFang/Noto 中文回退。
- 触控目标 ≥44px；单页单一主动作；操作按钮固定右上/底部，不随内容漂移。

---

## 7. 数据指标定义（商家语言，禁用广告黑话）
- **到店核销**：赢家到店并核销成功的人数（=真实到店，计费基准）。
- **玩了游戏 plays**：游戏被打开游玩次数。
- **新客 / 回头客**：首次到店 vs 二次以上到店。
- **到店率**：到店 ÷ 玩过的人。
- **每位到店成本**：花费 ÷ 到店人数。
- 禁止出现：Impressions / CTR / CPA / Ad groups / Creatives / Audiences / Top up wallet 等。

---

## 8. 占位与待办（研发/设计需补）
1. **游戏库 = 玩法短视频（重点）**：首页游戏库 / 匹配结果 / My games / 活动卡片 / 活动编辑器游戏选择器的缩略图，原型用 **`GamePreview` 组件做的循环 CSS 动画**（每种玩法一套独立动效：spin/scratch/stack/merge/drop/flip/hoop/draw）。所有预览区域统一使用 **9:16 竖屏比例**（与手机竖屏游戏视频一致），上线替换为 **静音自动循环 `<video>`（webm/mp4，loop muted playsinline，9:16 竖屏录制）**，按 `kind` 取对应视频。研发录制时直接录手机竖屏，不用裁剪。网格布局已从 3 列调整为 4 列以适配竖屏卡片高度。
2. **图标全部为真实 SVG**：全站 UI 图标统一走 `icons.jsx` 的 `Ic.*`（line/solid SVG），**不再使用 emoji 文字图标**。导航(home/gamepad/target/chart/user)、动态流(gift/star/ret)、召回(bell)、核销(target)、步骤(gamepad/palette/store)、数据涨跌(up/down)、完成页奖杯(trophy)、退出(logout) 等均为 SVG。仅 **国家旗帜**（COUNTRIES 的 🇸🇬🇲🇾…）与流程连接箭头 `→` 保留为字符，属正常内容。样例店 logo 用首字母 monogram（K/B/S）占位，上线由商家上传真实 logo 图。
3. **后端**：注册/登录、游戏生成、核销、数据、召回、**多店/多券库存**均为前端 mock，需接真实服务（数据模型见 3.7 / 3.8）。
4. **AI 对话改游戏（工作台）**：左栏对话回复为前端关键词 mock（→改色/加券+确认卡），上线接真实模型；撤销/重做/历史为占位按钮，需接版本快照。
5. **素材库联动**：Me 的品牌素材库 → 建游戏预览的 `BrandControls` 自动套用（原型未打通）。
6. **券库存运行时**：发券分布/停发/防超发逻辑见 3.7，需后端实现原子扣减与归因。
7. **真实地理围栏/归因**：落地页「附近 300m/500m」与按门店到店归因为示意。
8. **可玩 demo 扩展**：原型仅转盘 + 刮刮卡两种真可玩（`Demo`）；其余模板上线需各自真玩法。

---

## 9. 关键文案对照（节选）

| 位置 | EN | 中文 |
|---|---|---|
| 落地标题 | Turn passers-by into regulars | 把路过的人，变成回头客 |
| 角标 | Built for neighbourhood shops — cafés, bubble tea, street food & more | 给街边小店 · 咖啡 / 奶茶 / 小吃 / 美甲 / … |
| 主 CTA | Create your first game — free | 免费创建第一个游戏 |
| 发布闸门标题 | Last step: create an account to publish | 最后一步：创建账号，发布上线 |
| 登录后建游戏 Step1 | What's this game for? | 这次想做个什么游戏？ |
| 核销成功 | Redeemed — counted as a real walk-in | 核销成功 —— 已计入真实到店 |
| 侧栏 | Home / Activities / My games / Redeem / Reports / Me | 主页 / 活动 / 我的游戏 / 核销 / 数据 / 我的 |

---

## 10. 后端对接：数据模型 + 接口契约 ⭐（研发按此实现）

> 原型所有数据都是前端 mock；下面是**建议契约**（命名可按你们规范调整，但字段语义需保留）。所有 `/api` 接口除「玩家端」「落地页」外均需商家登录态（token）。

### 10.1 核心对象（schema）

```
Account（商家账号）
  id, name, phone(WhatsApp), country, brandKit{ logo_url, colors[2], product_photos[] }

Outlet（门店，账号下可多家）
  id, account_id, name, address{ line1, city, region, postal, country }, lat, lng,
  phone(选填), is_primary
  # 店名 + address 必填；phone 选填

Game（游戏，纯视觉模板实例）
  id, account_id, template_kind(spin/scratch/stack/merge/drop/flip/hoop/draw),
  name, brand{ logo_url, colors[2], product_photos[] },
  created_at
  # 不含门店和券 —— 这些在 Activity 下

Activity（活动，经营决策，2026-06-27 新增）
  id, account_id, name,
  game_id,                              # 绑定的游戏（一对一）
  participating_outlet_ids[],           # 作用门店，默认全部
  status(draft/review/live/rejected/offline),  # 2026-07-02：5 态；live—下线→offline；offline—重新上线→review
  win_score,                            # 赢奖门槛：玩家达到即赢券（单位视游戏而定，分数/关卡/回合）
  start_date, end_date,
  created_at, published_at

Voucher（奖品券，挂在 Activity 下，一个活动一张券）
  id, activity_id,
  name(如"卡布奇诺"), price(原价,字符串如"S$6.00"), discount(如"免费/买一送一/8折"),
  qty(总张数=发行上限),                 # 无有效期、无中奖率字段
  awarded_count(已发/已被赢走), redeemed_count(已核销),
  remaining = qty - awarded_count        # 派生
  status(active/exhausted)

IssuedVoucher（一张被赢走的券实例）
  id, voucher_id, activity_id, player_id, outlet_scope,
  qr_token(核销用), state(awarded/redeemed/expired), won_at

Redemption（核销流水，append-only）
  id, issued_voucher_id, voucher_id, activity_id,
  outlet_id(扫码核销的那家店 = 到店归因), redeemed_at, staff_id

Player（客人，端侧最小化）
  id(匿名), first_seen_at, visit_count, is_returning
```

### 10.2 按页面 / 功能 → 所需接口

| 页面 / 动作 | 方法 路径（建议） | 入参 | 返回 / 数据 |
|---|---|---|---|
| 落地页战绩/玩法 | 静态，无需接口（示例数据） | — | — |
| **建游戏·描述**（选样例店带品牌包） | `GET /api/brand/lookup?name=&site=` | 店名 / 网址 | `{ logo_url, colors[2], product_photos[] }`（抓不到则空，前端给默认） |
| **建游戏·生成**（一个 loader） | `POST /api/games/generate` | `{ need, site, brand? }` + **匿名会话 token + Turnstile token** | `{ matched_templates[6], draft_game }`（**生成在注册前；鉴权见 §12**） |
| 模板库 | `GET /api/templates?goal=` | — | `template[]`（kind/封面/玩法视频 url） |
| **预览·改品牌** | 本地状态；发布时随 Game 提交 | — | — |
| **预览·logo 取色** | 前端 canvas 取色（无需接口）；或 `POST /api/brand/extract-color` | 图片 | `colors[2]` |
| **登录 / 注册（统一手机验证码）** | `POST /api/auth/start` → `POST /api/auth/verify` | `{phone}` → `{phone, code}` | start: `{ is_new }`；verify: `{ token, account, is_new }` |
| 发布闸门补资料（手机为新时） | 随 verify 后 `POST /api/account` | 商家名*/国家* | account；**手机已存在则跳过、直接挂账号（按手机去重）** |
| **发布游戏** | `POST /api/games`（草稿首发）/ `POST /api/games/:id/publish` | 完整 Game（含 vouchers、participating_outlets） | `{ game, play_url, qr_png }` |
| 上线成功页二维码 | 用上一步返回的 `qr_png` / `play_url` | — | — |
| **我的游戏列表** | `GET /api/games` | — | `game[]`（纯视觉，含 plays 汇总） |
| 我的游戏·点开工作台 | `GET /api/games/:id` | — | 完整 Game（品牌） |
| **工作台·手动改**（仅品牌） | `PATCH /api/games/:id` | 改动字段 | 更新后的 Game |
| **工作台·AI 对话改** | `POST /api/games/:id/ai-edit` | `{ prompt }` | `{ change_summary, patch }`（改色等自动应用） |
| 工作台·版本/历史 | `GET /api/games/:id/versions` · `POST /api/games/:id/restore` | version_id | 版本快照 |
| **活动列表** | `GET /api/activities` | — | `activity[]`（含 vouchers、game_id、status） |
| **活动详情** | `GET /api/activities/:id` | — | 完整 Activity + vouchers + 统计 |
| **活动增删改** | `POST/PATCH/DELETE /api/activities` | Activity 字段 | activity |
| **活动提交审核/下线** | `POST /api/activities/:id/submit`（→review）· `/unpublish`（**下线→offline**）· `/relaunch`（offline→review，重走审批）· `/duplicate`（复制为新 draft） | — | `{ status }` / `{ activity }` |
| **奖品券增删改** | 含在 `PATCH /api/activities/:id` 的 `vouchers[]`（或 `/activities/:id/vouchers` CRUD） | voucher 字段 | vouchers |
| **门店增删改**（我的/Me & 预览内联加） | `GET/POST/PATCH/DELETE /api/outlets` | Outlet 字段 | outlet[] |
| 账户/品牌素材库（Me） | `GET/PATCH /api/account` | name/phone/brandKit | account |
| **核销·扫码/输码** | `POST /api/redemptions` | `{ qr_token 或 code, outlet_id }` | `{ ok, voucher, walkin:true }` 或错误（无效/已核销/已发完） |
| 核销·最近核销 | `GET /api/redemptions?range=today` | — | redemption[] |
| 核销·概览+奖品券简要 | `GET /api/activities/:id/voucher-stats` | — | 每券 `{ name, qty, awarded, redeemed }` + 汇总(今日核销/待核销/累计) |
| **数据·KPI** | `GET /api/reports/summary?range=` | range | `{ plays, walkins, new, returning }` + 环比 |
| 数据·每天到店 | `GET /api/reports/walkins-by-day?range=` | range | `[{day, count}]` |
| 数据·新客vs回头客 | `GET /api/reports/new-vs-returning?range=` | range | `{ new, returning }` |
| 数据·哪个活动带客 | `GET /api/reports/activity-performance?range=` | range | `[{activity, walkins}]` |
| **数据·各门店核销** | `GET /api/reports/redeemed-by-outlet?range=` | range | `[{outlet, redeemed}]` |
| 数据·奖品券剩余 | `GET /api/reports/voucher-stock?activity_id=` | activity_id | 每券 `{redeemed, awarded, qty}` |
| **召回老客** | `GET /api/winback/candidates` → `POST /api/winback/send` | — | `{ count }`；**send = 发通知(push/WhatsApp)，不直接发券** |
| 玩家端·扫码玩 | `GET /api/play/:game_code` | — | 游戏配置（品牌/券池可见部分） |
| **玩家端·抽券** | `POST /api/play/:game_code/draw` | `{ player_id }` | `{ issued_voucher, qr_token }` 或 `{ exhausted:true }` |

### 10.3 后端必须实现的业务规则

1. **发券抽取**：玩一次从 `remaining>0` 的券里**按剩余张数加权随机**抽一张；**原子扣减 `remaining`（`WHERE remaining>0` 守卫）防并发超发**；某券 `remaining=0` 自动移出抽取池；全部为 0 → 返回 `exhausted`（玩家端显示"名额已满"）。**无中奖率概念**，商家只配张数。
2. **核销归因**：`POST /redemptions` 必带 `outlet_id`（= 扫码核销的那家店）；一条 redemption = 一次「真实到店」，按 `outlet_id` 归因到门店。校验：券存在、未核销、未过期、属于该商家。
3. **库存池**：券库存是 **activity 级共享**，跨 `participating_outlet_ids` 的所有门店共用（v1 不做按店子配额）。
4. **每人限领**：`per_customer_limit` 在抽券时按 `player_id` 校验。
5. **召回**：`winback/send` 发的是**召回通知**（push/WhatsApp 提醒回店），不是直接发券。
6. **计费（2026-07-06 更新）**：**第一个月免费**；首月后按 **redemption（真实到店核销）笔数**计费，未核销不计费。无最低消费、随时可下线。
7. **付款方式（card on file，2026-07-06 新增）**：**gate 放「上线活动」，不放注册**（注册保持手机验证码一步，维持激活铁律；卡是漏斗里掉转化最狠的字段之一）。首次上线活动且未存卡 → 在上线确认弹窗内收集卡（**Stripe SetupIntent，usage=off_session，不扣款**、仅 tokenize 存 `customer`）；已存卡则显示 `•••• last4 · 更换`。**上线游戏不收卡**（游戏无奖品/无到店/无计费）。首笔 walk-in 计费时用该 PaymentMethod 建 PaymentIntent。文案须点明"首月免费、之后按到店笔数收费、随时可下线、无最低消费"以降恐惧。理由见决策文档 `Desktop/Mozat/kix/[分析] 2026-07-06 商家端-信用卡预存储+下载App入口.md`。

### 10.4 原型变量 → 后端字段映射（给研发对照）

| 原型（journey.jsx / data.jsx） | 对应后端 |
|---|---|
| `brand{color,logo,logoMark,products}` | `Game.brand` / `Account.brandKit` |
| `activities[]{id,name,outletIds,vouchers,gameId,status}` | `Activity[]`（2026-06-27 新增） |
| `myGames[]`（游戏数组） | `Game[]`（纯视觉） |
| `activity.vouchers[]{name,price,discount,qty,awarded,redeemed,perCust}` | `Voucher[]`（挂在 Activity 下） |
| `outlets[]{name,line1,city,postal,country,phone,primary}` | `Outlet[]` |
| `activity.outletIds[]`（id 数组） | `Activity.participating_outlet_ids` |
| `STARTER_VOUCHERS`（建活动起步 1 张） | 新建 Activity 的默认 voucher |
| `EXAMPLES[].mark/color/prod`（样例店预设） | `GET /brand/lookup` 的返回（上线换真实品牌库/抓取） |
| 游戏库玩法动画（`GamePreview`/`kind`） | 上线换静音循环 `<video>`，按 `kind` 取片源 |

---

## 11. 登录与身份（2026-06-26 三体决策）⭐

### 11.1 登录入口：独立 `/login` 页 + 统一手机验证码（不是弹窗、不分登录/注册）
- **独立页不用弹窗**：手机收码常切到短信 App，弹窗在 SPA 一刷新/切回就丢状态；独立页能刷新、能 deep-link、密码管理器更稳（对标 Stripe/Slack/Notion/Linktree 全用独立页）。
- **不分"登录/注册"**：手机验证码下登录=注册同一动作——输手机→验证码→**有账号就进、没有就自动建**（对标 WhatsApp/Grab/Gojek）。原型 `Login` 组件：phone 步 → otp 步 → 进后台。
- **落地页砍掉单独 "Sign up"**：只留 **"免费开始"（建游戏，免登录）** + **"登录"（回访 → `/login`）**。注册仍在发布闸门完成。
- **发布闸门 与 /login 共用同一手机验证码，按手机号去重**：回访商家"免费开始→发布"时若手机已存在 → 不重复建号、直接挂到原账号、跳过再问店名/国家。
- 端到端流程：① 回访点登录→/login→手机→验证码→进后台；② 新商家"免费开始"→建游戏→发布闸门→手机(新)→验证码→补店名/国家→建号上线；③ 点登录但无账号→同页验证码通过→补店名/国家→建号（即"登录"静默变"注册"，文案中性："验证码已发送"，不写"无账号"）。
- 移动端 OTP：`autocomplete="one-time-code"` 单框自动填充；但假设用户会切到短信 App → OTP 屏必须是可刷新、保留手机号的真实 URL（独立页天然满足）。SG/MY 建议 SMS 为主、WhatsApp 兜底。
- 接口：`POST /api/auth/start{phone}` → 发码（返回是否已有账号，用于决定后续是否补资料）；`POST /api/auth/verify{phone,code}` → `{token, account, is_new}`。

### 11.2 登录后身份：侧栏店铺头 + 右上角账户菜单 + 门店筛选
- **侧栏头部 = 商家身份**：商家 logo/首字母头像 + **店名** + **当前门店**（如 Kopi Corner · 淡滨尼）。常驻"我是谁"。KiX 品牌缩到侧栏底部小字（商家身份优先，对标 Shopify/Square/Loyverse：身份在 chrome、标签即切换器）。
- **右上角头像 + 账户菜单**（标准位）：菜单含 店名+门店表头 / 账户设置(→Me) / 店铺管理(→Me) / 账单与套餐 / **退出登录**（"Exit"非标准，改"退出登录"放头像菜单）。
- **语言切换留在侧栏底部**（EN/中文，常驻可见）——不收进账户菜单，方便随时切。
- **不做右上角门店切换器**（已去掉）：门店在「我的」管理即可，数据本就账号级；per-门店明细在 Reports（沿用上轮三体结论）。侧栏第二行显示「N 家门店」或单店名作身份提示，不作筛选。
- **不放大 logo 在内容区**（业界惯例：logo 只用于客户端凭证/收据）；Home 不抢戏做问候语，游戏战绩 hero 优先。
- 创意打分：S1 3 / S2 3 / S3 3 / S4 2 = 11/12 REAL_INSIGHT。Trinity converged, 1 round。

---

## 12. 生成接口的鉴权与防滥用（2026-06-26 三体决策，回应研发安全顾虑）⭐

**研发顾虑**：生成在注册前 → `POST /games/generate` 未鉴权 → 任何人可调、被刷、烧成本。建议"注册后再生成"。

**结论：不要把注册前置（假二选一 + 弱防御）。生成保持在注册前（激活杠杆），用分层防护 + 把硬鉴权闸门放在「发布/持久化」。**

- **"未登录" ≠ "无鉴权"**：页面加载即发一个**匿名会话 token**（Firebase Anonymous Auth / Supabase Anonymous Sign-in）——每次 generate 可归因、可限流，无需注册；发布时把同一匿名身份**原地升级**为正式账号（`linkWithCredential`/身份合并，已生成内容不丢）。
- **生成端分层防护**（平台官方推荐栈）：① Cloudflare WAF/Bot → ② **Turnstile 隐形验证（后端 siteverify）** → ③ 匿名会话 token（+可选 Firebase App Check 校验来源是真 App 而非脚本）→ ④ 按 IP/会话/设备限流（可加 FingerprintJS 按设备）→ ⑤ **免费生成次数上限**（如每设备 2–3 次后要手机 OTP）。Supabase 匿名登录文档即 "Turnstile + 限流 + RLS"。
- **注册前置防不住、还更贵**：OTP/邮箱可用一次性号刷；**手机 OTP 会被"短信轰炸(SMS pumping)"专打 OTP 接口、每条短信我们掏钱**（单次攻击可达数千刀，Twilio/Stytch 文档）。注册墙只是把滥用转移，并新增烧钱攻击面。
- **成本前提**：Step3 是**模板换皮**（套品牌色+logo 到预制模板），单次成本极低且可缓存 → 上述防护已足够。**真正贵的环节（任何真 AI 调用 / 最终高清渲染）放到发布步**（已在手机 OTP 闸门后）。⚠️ 研发需先**实测单次 generate 成本**：若它其实跑昂贵大模型，则把该部分挪到发布后、生成前只做轻量预览。
- **硬鉴权闸门位置**：放在 **publish/persist（发布、建 Game、出二维码、上线）**，不放在 generate。对标 Durable（Save/Publish 才要账号）、remove.bg（高清下载才 gate）、ChatGPT 未登录（先生成后注册）。
- 创意打分：S1 3 / S2 3 / S3 3 / S4 2 = 11/12 REAL_INSIGHT。

---

_本规格随原型演进同步更新；如与最新 HTML 冲突，以双方确认的最新版为准。_
