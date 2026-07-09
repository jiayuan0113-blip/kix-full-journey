# KiX 商家端原型 · 改动记录（研发对照用）

> 按时间倒序。每条列出「改了什么 → 影响哪些文件/组件 → 研发需要做什么」。

---

## 2026-07-09

### 82. 挑战赛奖品：命名/配图/券码上传 + 现金券自定「面额×张数」+ Stripe + 绑卡文案去重
- **每档奖品**（四类通用）新增 3 项：**奖品名称**（现金/折扣选填，商品/自定义即名，`prize.label`）+ **配图**上传（`prize.img`）+ **券码来源**（`prize.codeSource` = `auto` 系统自动生成 / `custom` 上传自有码文件 `prize.codeFile`）。奖品行改**两行块**（上=名次/类型/值，下=名称/图/码）。
- **现金券 = 商家自定「面额 × 张数」**（Kash 非固定 $5，商家送什么、拆几张全自己定）：`prize:{type:'cash', denom, count}`，`cashTotal = denom×count`，编辑器行内实时显「每张 S$5 × 12 张 = S$60」；成本条「现金奖合计 S$120（24 张）」。**三体洞察**：拆小面额 = 每张单独到店兑 = 多次 verified walk-in（多次到店）。客人视角（App 契约）只显总额。SAMPLE_LADDER / data a7 同步。
- **支付平台 Airwallex → Stripe**（2026-07-09 Joyce 定）：全仓库 + canon 的 Airwallex 改 Stripe（SetupIntent + Elements）。
- **绑卡步文案去重**：副标题「前 3 个月免费，之后 S$29/月起。」（删掉重复的"只算新生意、老客永远免费"）；安心第 2 条删「无最低消费」（与 S$29 地板矛盾）→「随时下线或取消」。
**影响文件**：`journey.jsx`（PrizeLadderEditor 两行块 + onImg/pickCodes、`cashTotal`/`ladderStats`、prizeLabel/topPrizeShort、Register 信任区、SAMPLE_LADDER、blankChallenge）、`index.html`（`.lcard`/`.lrow-top`/`.lrow-detail`/`.pname`/`.pimg`/`.pcode`/`.pcash`/`.cash-split`）、`data.jsx`（a7 现金 denom/count）。

### 81. 活动页产品三体（4-lens 收敛）
**产品三体**（4 个互不重合 sub-agent 找命门：非技术可懂性 / 两类型IA+状态全覆盖 / 单一焦点冗余 / 忙碌操作效率）。收敛后实施：
- **卡片 footer 重排**：live 卡主按钮 = 绿色「门店二维码」（高频动作上位），「下线」降进 ⋯；offline 主按钮 = 「上线」，⋯ 含 复制/二维码/在 KiX App 里看；draft = 直接「复制」按钮（去掉只含 1 项的 ⋯）。
- **多店二维码**：点「门店二维码」→ ≥2 店弹门店清单逐个下载（每店一码归因，`ActivityQRSheet`）；单店直下。
- **状态/文案**：徽章「草稿」→「修改中」（与筛选一致）；longrun 卡「52 人到店（含 41 新客）」消歧义；「在 App 查看」→「在 KiX App 里看」；「加券」伪按钮 → 陈述「券已发完 —— 打开可补券」；空态去「触达」行话。
- **状态机全态修正**：offline 挑战赛补实测「X 人参赛 · Y 到店」（已发生的历史+计费KPI，非前瞻）；一次性挑战赛过期 `nextSession` 返 null → 卡显「已跑完」不再假"今天"；库存条仅 `live` 显（offline 不显前瞻"剩X"）；筛选态计数归零 → useEffect 重置 filt="all"。
- **新建弹窗**：删「选这个」伪 CTA（整卡可点）。
**影响文件**：`journey.jsx`（ActivitiesView、ActivityQRSheet、ACT_STA、NewActivityPicker、nextSession；AppShell 传 outlets）、`index.html`。收敛文档见 `Desktop/Mozat/kix/[评审] 2026-07-09-活动页内容设计-产品三体收敛.md`。

### 80. 全站定价迁到 bible MAU 口径 + 上线弹窗去卡
**为什么**：CEO bible（`mozatyin/kix-platform` §4.0 CANON，2026-07-09）定：基础费 = 按品牌 MAU、`max($29/品牌/月, 梯度)`、≤12% 增量、软件永久免费、"never a monthly fee"式读法作废。商家端旧「S$3/位新客 · pay-per-result」全部 off-canon。
**改了什么**：
- 落地页三卡（Joyce 手改）= S$29/月起 · 只算新生意封顶12% · 越做越便宜多店合一。
- 其余全部对齐：FAQ、登录副标题、主页成本条、PLANS、切套餐弹窗、我的·账单、换卡弹窗 → 「S$29/月起，只算新生意、老客永远免费」；清除所有 `S$3`/pay-per-result/"从不收月费"。
- **上线活动弹窗（ActivityPublishModal）删「付款方式」整块**（卡在注册即收，不重复要卡、不显 off-canon 定价）。
- `cardOnFile` 默认：authed（能进 Portal）= 已有卡（`?card=0` 调试无卡）。
**影响文件**：`journey.jsx`（Faq/login-sub/HomeView/PLANS/PlanModal/CardModal/MeView/ActivityPublishModal/App cardOnFile）。

### 79. 活动品牌 Logo 上传 + 去「最少参赛人数」
- 活动名称行右侧加方形 Logo 上传位（长期+挑战赛共用）；说明"显示在海报/App卡片（挑战赛用在排行榜），留空沿用游戏品牌"。
- 删挑战赛「最少参赛人数」（幻影控件：开赛前人数不可知、人已参赛无法回头取消）；赛制面板改明确承诺"不设最低人数门槛、来多少人都照常开赛"。
**影响文件**：`journey.jsx`（ActivityEditor onLogo + act-idrow；赛制面板）、`index.html`（`.act-idrow`/`.act-logo-up`）、`data.jsx`（去 a7 minPlayers）。

### 78. 限时挑战赛卡片内容（三体收敛）
challenge 卡去「到店/参赛人数/头奖」（不可知前瞻 or 用户自设已知值），只留可动作的「下一场 · <倒计时口径时间>」；草稿=「N 个奖 · X 门店」；已下线补实测（见 #81）。对标 Eventbrite/Faceit/Whatnot（倒计时=头条）。
**影响文件**：`journey.jsx`（ActivitiesView challenge 分支、`nextSession`/`nextLabel`/`schedSummary`/`topPrizeShort`）、`index.html`（`.chal-when.next`/`.cw-dot`）。

### 77. KiX Challenge（限时挑战赛）= 第二种活动形态
**canon**：`Activity.form` = `longrun`（现有：游戏+券，随时玩达标赢券）| `challenge`（新：游戏+阶梯奖池，定点开赛按排名赢）。品牌**自营**（自己的游戏/排行榜/档期），非赞助平台夜赛。
- **建活动第一步**：形态选择弹窗（`NewActivityPicker`，长期/挑战赛对比卡）。
- **挑战赛编辑器**：档期（一次性/循环 + 星期 chips + 时间 + 单局时长 + 循环截止）；**阶梯奖池**（逐档 名次区间→奖品，四类可配 现金/菜单商品/折扣/自定义，「套用示例奖池」+复制/删；**成本条** = 名额合计 + 现金奖合计 +"空名次不发不花钱"，不臆测折扣/商品总价）；赛制（同分裁决+每人限一局）；游戏/门店/二维码/上线复用。
- **数据模型**：`{form:'challenge', schedule:{mode,date|days,time,roundMins,endDate}, tiebreak, prizeLadder:[{from,to,prize:{type,value|pct|label}}], stat:{players,walkins,newCust}}`。demo `a7`。
**影响文件**：`journey.jsx`（NewActivityPicker/ScheduleEditor/PrizeLadderEditor/ActivityEditor 分支/ladderStats/schedSummary；AppShell pickForm/createAct）、`index.html`（`.na-*`/`.seg2`/`.day-chips`/`.ladder-*`/`.cost-bar`/`.chal-badge`）、`data.jsx`（a7 + 初始化 guard prizeLadder）。

---

## 2026-07-08

### 76. 主页 hero 加「券剩余」（当前活动第三个生命体征）
**为什么**：主页 hero 讲的是正在跑的活动，原来只有客流(今天玩了/到店兑奖)，缺券剩余——券发完客流即白费。券剩余是该活动的第三个生命体征，应常驻 hero（不只等低量提醒）。
**改了什么**：`HomeView` 营业态 hero 从 2 个数 → **3 个数：今天玩了 · 到店兑奖 · 券剩余**（取当前 live 活动 `qty-awarded`）；该活动券 ≤15% 时数字变橙。低量提醒条继续管"快发完"紧急态、卡片/兑奖页/编辑器已有。
**影响文件**：`journey.jsx`（HomeView `vRem/vLow` + hero 第三格）、`index.html`（`.live3 .lc .n.low`）。

### 75. 券剩余可见（送/剩）— 活动卡 + 主页低量提醒
**为什么**（从店主视角）：券"发完即停"是**静默失败**——活动看着还在跑，客人却赢不到奖，店主易漏。券剩余需求 = 随时瞄 + 快发完主动提醒 + 一键补货。
**改了什么**：
- **活动卡**（live/offline）：加「**送 X · 剩 Y**」+ 进度条；剩余 ≤15% 橙、=0 红「券已发完 · 加券」。
- **主页营业态**：**条件出现**的低量提醒（有 live 活动券 ≤15% 才显示）——琥珀「『X』只剩 N 张券 —— 发完就停 · 去加券」，=0 变红「客人赢不到奖了」；点击去活动。不常驻、不占焦点。
- 兑奖页(进度条)/活动编辑器(已发·剩 + 张数可改) 已有，本次补齐"随时瞄 + 主动提醒"两个缺口。
**数据**：`DEFAULT_ACTIVITIES` 补 voucher `awarded/redeemed`（a3 设 92/100 → 剩 8 演示低量；a2 draft 0）。
**影响文件**：`journey.jsx`（ActivitiesView 卡库存行；HomeView `lowStock` + 提醒）、`index.html`（`.stockrow`/`.lowstock`）、`data.jsx`。

### 74. 「我的游戏」页产品三体（去混淆 + 新建入口固定顶部）
**产品三体**（真人走查：Auntie May 分不清"游戏 vs 活动"；David 不懂"单独上线游戏有啥用"）：
- **页面顶部一句话定向**：「游戏 = 你的品牌小游戏，客人扫码就能玩。想送奖品、把人带到店 → 去『活动』加奖品和时限。」— 解游戏/活动概念混淆（不合并两列表，canon 分离；补的是"说明真空"）。
- **live 游戏卡状态**：「已上线 · 可扫码玩」→「**已上线 · 可扫码玩（纯玩、无奖品）**」，区分于带奖品的活动。
- **游戏下线复用撤销 toast**：游戏 live 也有客人扫的 QR，下线即暂停 → 和活动一致(UndoToast 已泛化：「已下线 · 客人扫码已暂停 · 撤销」)。
- **「新建游戏」固定右上角**（原来是网格末尾的 +卡，游戏一多会被埋）：与「活动」页「+新建活动」一致（app-bar 顶部按钮），**去掉末尾 +卡**（避免会被埋的第二入口）。
**影响文件**：`journey.jsx`（MyGamesView 定向文案/卡状态/去 mgnew；AppShell app-bar 加 games 新建按钮、`takeGameOffline` 复用 toast）。

### 73. 「我的」页产品三体（保存反馈 + App 瘦身）+ 下线撤销 toast
**「我的」页**（真人走查 Auntie May 非技术）：
- 🔴 **加保存反馈**：「账户」「店铺」原来可编辑但无保存按钮 → 非技术用户不知存没存。各加**「保存修改」按钮 + 点后「✓ 已保存」闪现**（三体：显式保存对 SMB 非技术用户 > 静默 auto-save，确定性优先）。
- 🟡 **KiX App 面板瘦身**：大 QR 块 → **一行**（图标 + "在手机上以客人视角查看" + 「下载 App」点开 `AppQRModal`）。
**下线活动 = 立即执行 + 撤销 toast**（三体：下线可逆非破坏，不弹前置确认；Gmail 式 Undo）：活动列表 live 卡「下线」→ 立即下线 + 底部 `UndoToast`「活动已下线 · 客人扫码已暂停 · 撤销」(6s 自动消，撤销恢复)。范围=列表卡（最易误点）；编辑器「下线活动」未重复加（深度操作+旁边即有上线）。
**影响文件**：`journey.jsx`（MeView 保存/App 行；AppShell `takeOffline`/`undoOffline`/`UndoToast`；ActivitiesView onSetStatus 分流）、`index.html`（`.me-save`/`.me-approw`/`.undo-toast`）。

### 72. 去黑话：中文 UI「核销→兑奖」「正在跑→进行中」（主页产品三体，非财务视角）
**为什么**：真人走查（Auntie May 56 咖啡店/不懂技术）发现"核销"是 O2O 后台黑话、非技术 F&B 店主看不懂（"这个词我看不懂,是不是要我做什么?"）。产品三体收敛：根因=术语黑话，一根杠杆解 3 症状（黑话/动作时机/部分单位）。
**改了什么**：`journey.jsx`+`data.jsx` **全站中文** `核销→兑奖`、`正在跑→进行中`（EN 侧本就是 redeem/live，不动）。波及：侧栏「兑奖」、主页 hero(进行中 / 到店兑奖 / 扫码兑奖)、兑奖页(今日/待/累计兑奖、奖品券兑奖)、数据页(真实到店兑奖)、最近动态(兑了「X」)、PLANS free 注等。「扫码兑奖」自带"客人来兑奖时用"→顺带解动作时机。
**canon**：`CLAUDE.md` 注明——**中文 UI 用「兑奖」；「核销」仅内部/计费概念词(verified walk-in)、不面向店主展示**。
**研发注意**：仅中文展示层文案变更，数据模型/字段/计费概念(verified walk-in)不变。

### 71. 主页三体复审修复 + 注册绑卡去返回 + 活动卡 ⋯ 菜单不被裁
**改了什么**（多视角三体复审，Joyce 提醒"别只从钱的角度看"）：
- **主页 hero 数据自洽**：原「今天 到店 12 / 已核销 9」两个数矛盾（canon=核销才计到店 → 应相等）。改为两个自洽指标：**今天玩了 / 到店核销**（核销=到店，一个概念）。
- **主页成本条试用感知**：常态「首 3 月免费 · 还剩 X 天 · 现在 S$0」（绿）；**≤14 天变琥珀预警「试用还剩 X 天 · 到期后按 S$3/位新客」**（临近扣款才亮费率，防突袭，符合"免费期不甩总价"）。`?trialleft=N` 演示。
- **拒绝**：连锁各店/多活动明细上主页（守单一焦点，归「数据」页）。
- **注册绑卡步去掉「上一步」**：卡要绑定刚建的账户、不可回退；返回只留在账号步（回预览）。
- **活动/游戏卡 ⋯ 溢出菜单被裁修复**：`.mgcard` `overflow:hidden`（裁圆角）把下拉菜单也裁了 → 改 `overflow:visible`，圆角交给 `.mgart` 自己裁上角。
**影响文件**：`journey.jsx`（HomeView hero/成本条 + `trialLeft`；Register 返回条件）、`index.html`（`.home-cost.ending`；`.mgcard`/`.mgart` overflow+圆角）。
**研发注意**：主页 hero 只显示 plays + verified walk-in（=redeemed，二者恒等）；试用倒计时/到期费率提醒为前端演示，真实需后端 trial 状态。

### 70. 后台逐页三体审查（数据/主页/活动）+ 注册收卡 + 选游戏重做 ⭐
**计费口径统一为落地页**：免费版 S$0 / 按结果 **S$3 位新客 · 首 3 个月免费 · 老客永远免费** / 连锁。全站文案（`PLANS`/PlanModal/MeView/CardModal/活动上线弹窗）校准；落地页所有 "no credit card" 删除，改「前 3 个月免费」。

**数据页（报告）计费仪表**：hero 下加 `.billmeter`（首 3 月免费·剩 X 天·现在 S$0 · 老客永远免费只为新客付费 · 账单管理→），**不展示试用后预估总价**（免费期避免损失厌恶，见弹卡三体）；新客/老客面板改「新客=计费、老客免费」；游戏 tab 标"免费·不产生到店费用"。

**主页两态**（分水岭=有没有真实到店）：S1 启动态=唯一 CTA + 进度清单（无重复按钮）+ 计费心智；S2 营业态=收银台 + 成本一瞥条 + 最近 + 召回，**上手清单毕业消失**（修活跃商家仍见"第一位到店"未打勾的矛盾）。`?nowalkins=1` 演示 S1 已上线待到店。

**活动页**：卡片生命周期自适应（草稿=券/门店，上线=到店/新客）；赢奖条件 裸分→**难度档 容易/适中/有挑战**；草稿态收起二维码；结束日期标选填+"留空=长期有效"；**列表卡操作重构**——上线卡「下线」+ ⋯ 菜单(复制/二维码/在App查看)，草稿 ⋯(复制)，「在App查看」移入编辑器 live 状态栏（PatternFly/数据表最佳实践：低频操作进溢出菜单）。**卡片游戏图统一方形**（9:16 只保留在选游戏 swipe）。

**未登录第 2 步「选游戏」重做**：coverflow → **单台大手机 · 这是你的游戏**（基础定制预览）：左预览手机 + 右（你输入了 X✎改可改店名/游戏名+推荐理由/用这个游戏）+ 手机下「换一个看看」。居中大标题 + 预览左/操作右，与第 3 步对齐；标题不再说"玩"（这步只预览、下一步才试玩）；去眉标（顶部步骤条已示）。

**注册最后一步收卡（Stripe）**：Register 改**两子步（账号→绑卡）**；绑卡步信任设计——条款副标题(一次) + 三条不同安心(7天提醒/随时取消/Stripe加密) + 纯动作按钮「绑卡并上线」+ CTA 旁唯一「今天不会扣款」（业界：按钮=动词、reassurance 只放 CTA 旁一次）。收卡时 `onSaveCard` 写入 `cardOnFile`（**已从 AppShell 提升到 App**，注册时绑卡存活进后台）。返回统一到左上角 + 顶栏右上「退出」，与建游戏各步一致。
**影响文件**：`journey.jsx`（ReportsView/HomeView/ActivitiesView+Kebab/ActivityEditor/Results/Register/PLANS/App cardOnFile 提升）、`index.html`（`.billmeter`/`.home-cost`/`.nudge-free`/`.act-stat`/`.kebab`/`.wc-tier`/`.gp2-*`/`.trust-list`/`.reg-back` 等）、`data.jsx`（活动 `stat`/`winScore`）。
**研发注意**：① 计费单位=**新客到店**、首 3 月免费、老客免费（非"所有到店"、非 50 免费额度）；② 卡走 **Stripe hosted fields**（不碰卡号，原型为 mock）；③ 待办：扣款前 7 天提醒、活动/门店"新客(计费)"归因、空态种计费心智。调试参数：`?nowalkins=1` `?rstep=card` `?need=<店名>`。

## 2026-07-07

### 62. 定价卡文案去重（描述不再复述 bullet）
**改了什么**（Joyce 红框标注：卡描述与下方 ✓ 列表重复）：
- **删**价格区三卡下方 `.pnote`（「没有软件费… 老客永远免费」——与卡描述 + 上方「我们从不为你的老客收费」整段重复）。
- 三卡**描述行**改为"只讲 bullet 不讲的一件事"：
  - FREE FOREVER：`软件永远免费。上线你的游戏，把座位填满。` → **`适合做你的第一个游戏。`**
  - PAY PER RESULT：`只为真正到店的新客付费。前 3 个月免费 · 价格锁定。` → **`前 3 个月免费 · 价格锁定。`**（去掉与价格标签 `S$3/new customer` 重复的部分，只留 promo）；同时早先已去掉「永不收软件费」（标题 + FREE 卡已表达）。
  - CHAINS：`多门店、定制玩法与对接。`（= 下方 bullet 复述）→ **`适合成长中的多门店品牌。`**
**影响文件**：`journey.jsx`（`Pricing`）。
**原则**：一处只说一件事；描述 = 定位/promo，✓ 列表 = features，不重叠。

### 61. 建游戏流程重做：首页输店名 → swipe 选游戏 → 编辑上线（未登录 3 步）⭐
**改了什么**：
- **第 1 步 = 首页 hero 输入店名**：`Hero`/`SeeYourGame` 输入框改为受控，点「See my game」带店名进入（`startBuild(name)`）；**未登录跳过原 `describe` 屏**（直接 `building` loader → 选游戏），删掉"再选一次店型"的冗余步。
- **第 2 步 = swipe 轮换选游戏**（重写 `Results`，取代原 8 宫格 `.grid`）：3 台手机 coverflow（中间 330px / 两侧 246px 半透可点），`←/→`、圆点、点侧卡都能切；全部卡用**由店名派生的同一套品牌配色**（`COLOR_SETS` 按店名哈希），传达"同一品牌、不同玩法"；单一提交动作 =「用这个游戏」（带出配色写入 `brand.color`）。
- **第 3 步 = 编辑页直接上线**：`Preview` 初始即 `branded=true`（进来就是编辑态，不再 neutral→生成），主按钮 `确认` → **`上线`**；标题「最后微调一下」。
- **Stepper**：`STEPS` = 店名 / 选游戏 / 上线；`STEP_IDX` building/results=1、preview=2（**店名在首页完成 = step0 自动打勾**）。
- **文案去重**（对照参考稿，一处只说一件事）：卡片去掉店名/头像条、去掉中卡 Play 按钮（预览本身在动）、删 GAMEPLAY 角标（仅 `.pkph-scr` 内，落地页画廊保留）。
- **新增调试参数** `?need=<店名>`（`App` 读 `need` 初值，便于直达选游戏/编辑页）。
**影响文件**：`journey.jsx`（`Hero`/`SeeYourGame`/`Results`/`Preview`/`STEPS`/`STEP_IDX`/`startBuild`/results 路由）、`index.html`（新增 `.pk-*`/`.pkph*` CSS + `.pkph-scr .gp-tag{display:none}`）。
**研发注意**：`describe`（`Describe` 组件）现为未渲染死路径（保留便于回退，可后续清理）；登录后建游戏仍是 2 步（选游戏 → 改游戏·上线，`STEPS_RET`）。

### 60. 落地页并入老板设计稿（boss LEAN）· 整段重做 ⭐
**改了什么**（Joyce 按老板 LEAN 稿逐屏截图标注驱动；本条替换 #59 的落地页）：
- **Hero**：H1 →「They play. / They pay. / They stay.」(stay 绿)；眉标 `TURN YOUR BUSINESS INTO A PLAYGROUND`；chips = 3 min to launch · S$0 to start · No credit card · No hardware；CTA 由双按钮改为**输入框「Your business name」+「See my game →」**(与 WOW 一致)；右侧视觉换成**空店场景**「Another slow day… same empty seats」(纯 CSS `.hscene`) + 其下**闭环 flow-cap**；**删**信任条(Already live…)、旧 lede、冗余 note。
- **新增 Walkthrough**「See the game your customer plays」(`id=the-game`)：5 屏真机截图(`walkthrough/poster|play|win|redeem.png` 一芳素材；②扫码为 CSS 占位) + 箭头 + PLAY/PAY/STAY 三卡(无 emoji)。
- **新增 SeeYourGame(WOW)**：两行标题「Type your business name / See your game in 3 min」(第二行绿) + 输入框按钮 + note(Free · no credit card) + 右侧游戏图。
- **新增 WhyGame**「Why a game beats a discount」(`id=why`)：3 卡(Rewards never cash / Every visit verified / Every game feeds the network)，**真实 icon**(gift/shield/新增 globe)，无 emoji，复用 `.steps/.stp/.si`。
- **落地页移除渲染**：`Steps/Gallery/ThreeThings/Stories`(#59 的段) 及一度加入的 `FairDeal`；组件函数仍留在 `journey.jsx`(未渲染、便于回退)。**去重**：原「只为新客付费」三处(WhyGame/FairDeal/ThreeThings)降到一处。
- **价格改为按结果付费**：FREE FOREVER S$0 ·「PAY PER RESULT」from **S$3 / new customer**(前3月免费·价格锁定·**永不收软件费**) · CHAINS 联系我们 + 底注。**取代** #59 的「专业 S$49/月」落地页写法。
- **FAQ**「Everything a business owner asks」(`id=questions`)：6 条，**静态全展开**(去掉 + 折叠)。
- **结尾 CTA**：「Every business deserves its own playground」+ Build my game — free + 细则。
- **Nav**：Showcase/How it works/Pricing → **The game · Why it works · Pricing · Questions**，点击平滑滚动到 section id。
**影响文件**：`journey.jsx`(Hero/Walkthrough/SeeYourGame/WhyGame/Pricing/Faq/Final/Landing/nav)、`index.html`(`.hero-tag`/`.hscene`/`.wt-*`/`.ppp*`/`.wow-*`/`.pnote` 等 CSS)、`data.jsx`(**删** `HEADLINE`/`SUB_LANDING`)、`icons.jsx`(**加** `globe`)、新增 `walkthrough/*.png`。
**研发注意 / 待办**：
- ⚠️ **价格模型冲突**：落地页(按结果付费·无月费) 与 #58「我的」页 `PLANS`(专业 S$49/月订阅) 不一致，后台计费侧待对齐(DRI 待定)。
- 全站**中文为占位草稿**，待 Joyce 定稿。
- 走查②「扫码」屏、hero 视觉素材待真图(现为 CSS/占位)。
- `Steps/Gallery/ThreeThings/Stories/FairDeal` 为**未渲染死组件**，确认不回退后可清理。

## 2026-07-06

### 59. 落地页重构（叙事：是什么→怎么用→解决方案→收益/证据）⭐
**改了什么**（三体决策，文档见 `Desktop/Mozat/kix/[方案] 2026-07-06 落地页重构 三体决策.md`）：
- **新 H1**「做个小游戏，把顾客带回店里」（改掉品类模糊的"把路过的人变成回头客"；机制+结果同框）+ 新副标；Hero 数据条 → **信任条**（一芳水果茶/冰激凌店/咖啡店 都在用）。
- **段落重排**：Hero → 闭环带 → **How it works(三步)** → **玩法引擎** → 收益三卡 → **商家故事(新增)** → 价格 → CTA。（原为 Hero→收益→样片→三步→价格。）
- **玩法引擎段**：原"游戏样片"改为解决方案层「一套玩法引擎，AI 挑一个适合你店的玩法」；卡片改**方形**(1/1，去 9:16)；名字换成**纯玩法名且与动画一致**（幸运大转盘/刮刮乐/叠叠乐/合成/接一接/翻牌/投投乐/抽一抽）。
- **商家故事段(新增)**：3 张 `.story` 卡（店 logo 占位 `stories/*.png` 缺图回退文字 + 店名/店型 + 大指标 + 老板引述）：一芳 48% 到店 / 冰激凌 1,500 新客 / 咖啡 29% 召回。
- **价格对齐已确认模型**：免费「每月前 50 位免费，超出 S$3/位」；专业「不限到店，首月免费」（删旧"或按 S$3/到店"）；套餐弹窗(`PLANS`)同步。
**影响文件**：`data.jsx`（HEADLINE/SUB_LANDING/GAMES）、`journey.jsx`（Hero/Steps/Gallery/ThreeThings/Stories/Pricing/PLANS 重排+改写）、`index.html`（`.trustbar*`/`.stories`/`.story*`/gtile `1/1`）。
**待补**：3 张真实店图放 `stories/`；真实商家数据需授权公开。

### 58. 「我的」新增账单与套餐（换卡 + 切套餐）
**改了什么**：MeView 在「账户」下加**账单与套餐**面板：①套餐行（当前套餐+价格，「切换套餐」→ `PlanModal` 三档：免费 S$0/专业 S$49 当前/连锁 定制，首月免费）②付款方式行（`Visa •••• last4`「更换」/ 无卡「添加银行卡」→ `CardModal`，SetupIntent 不扣款）。account 下拉「账单与套餐」现在跳 Me 页。
**为什么**：卡在上线活动时存了（#56），但之前无处查看/更换——补上管理入口（真空回填）；套餐切换也归入此处。
**影响文件**：`journey.jsx`（`PLANS`/`CardModal`/`PlanModal` 新增；MeView 加面板+状态；MeView 收 `cardOnFile`/`setCardOnFile`；account 菜单 Billing→goMe）、`index.html`（`.billrow`/`.bill-*`/`.plans`/`.plan-opt`）。调试参数 `?bill=plan` `?bill=card`。

### 57. 建游戏第 1 步标题改口吻
**改了什么**：Describe（第 1 步）主标题「先说说，你开的是什么店？」→ **「今天想做什么游戏？」**（EN: What game do you want to make today?）。副文案「选你的店型，AI 帮你挑最合适的玩法」保留作桥接——问"做什么游戏"、答"选店型"、AI 配玩法，逻辑自洽（店型仍是匹配玩法的输入）。
**影响文件**：`journey.jsx`（Describe h1）。

### 56. 信用卡预存储（上线活动收，游戏不收）+ 下载 KiX App 三处入口 ⭐
**改了什么**：
- **付款方式 gate 放「上线活动」，不放注册**：`ActivityPublishModal` 加 card-on-file 段（卡号/有效期/CVC，SetupIntent 语义**不扣款**；已存卡显示 `•••• 4242 · 更换`；未填卡「确认上线」置灰）。计费文案：**「第一个月免费。之后按客人真实到店笔数收费，随时可下线、无最低消费。」** **上线游戏不收卡**（`PublishGameModal` 无付款段）。`cardOnFile` 状态在 AppShell。
- **上线成功态**：两个 publish 弹窗确认后切成功态（绿勾「已上线🎉」+ `QRDownload` + 完成），不再确认即关。
- **下载 KiX App 三处**：①上线成功弹窗 ②每张 LIVE 卡「在 App 查看」（我的游戏 + 活动，弹 `AppQRModal`）③「我的」页 KiX App 面板。Home/侧栏不加下载横幅。
**为什么**：产物上架在 KiX App，商家需下载看真实效果；卡放上线活动=承诺峰值+计费首次成立，比注册收卡更不伤转化（三体决策，文档见 `Desktop/Mozat/kix/[分析] 2026-07-06 …`）。
**影响文件**：`journey.jsx`（QRGlyph/QRDownload/AppQRModal/fmtCard 新增；PublishGameModal/ActivityPublishModal 加成功态 + 卡段；MyGamesView/ActivitiesView 加「在 App 查看」；MeView 加面板；AppShell 加 cardOnFile）、`index.html`（`.qrdl*`/`.storebadge`/`.cardf*`/`.pub-done-badge`/`.btn:disabled`）、`icons.jsx`（card/shield/phone）。
**研发注意**：真实用 Stripe SetupIntent(off_session) 存卡→首笔 walk-in 计费；首月免费后按 redemption 计费（见 SPEC §6.6/6.7）。调试参数：`?pub=1` 开弹窗、`&done=1` 成功态、`&card=1` 预置已绑卡。

## 2026-07-03

### 55. 清理去审批后遗留的"审批"痕迹
**改了什么**：去审批（#活动状态机改为 draft/live/offline）后仍残留的死代码/过时文案，一并清掉：
- 核销页空态文案「活动还在修改/**审批**中」→「活动还在修改中」（英文同步去掉 "or reviewed"）。
- `ACT_STA` 删掉 `review`(审批中) / `rejected`(被驳回) 两个再也不会出现的状态定义。
- 活动列表「修改中」筛选去掉 `||s==="rejected"`。
- `index.html` 删掉 `.act-badge.st-review` / `.act-badge.st-rejected` 两条死 CSS。
**为什么**：活动已直接上线、无审批，这些残留会误导研发以为还有审批态。
**影响文件**：`journey.jsx`、`index.html`。（仅保留解释"为何无审批"的注释。）

### 54. 主页 live 检测认游戏（Hero 三态）⭐
**改了什么**：主页 Hero 从"活动二选一"改为**三态检测**：
- 有 live 活动 → 收银台 hero（不变）。
- **无 live 活动、但有 live 游戏** → 绿色 LIVE 徽章 +「游戏名 · 正在跑」+ 副文案「客人扫码就能玩。想送奖品、把人变成到店客？加一个活动。」+「+ 新建活动」。**不再谎报"还没有活动"**。
- 无 live 活动、也无 live 游戏 → 空态 hero（不变）。
**为什么**：游戏可独立上线（#51）后，只上线了游戏、没建活动的商家打开主页会被错误告知"还没有活动"。这是事实性 bug，非新增引导。
**没做什么**：未把上手清单第 1 步做成可点——上线游戏非上线活动前提、且上线活动会自动上线游戏，做成可点会制造假顺序（详见 SPEC §3.9 / §4.5）。营业态不加任何游戏促销卡（守单一焦点）。
**影响文件**：`journey.jsx`（HomeView 新增 `liveGame` prop + hero 三态；AppShell 传 `liveGame`/`onGoGames`）。
**canon 补充**：SPEC §3.9 新增"上线活动 ⊇ 上线游戏（自动带上线）；上线游戏非上线活动前提"。

### 53. 数据页新增「游戏」数据（活动/游戏切换）⭐
**改了什么**：数据页顶部加 **「活动 / 游戏」分段切换**。
- **活动 tab**（原内容）：真实到店核销漏斗、新客/回头、各门店、每日到店。空态同前（无 live 活动 / 未核销）。
- **游戏 tab**（新）：独立上线游戏的**纯玩数据**——游玩次数(hero) + 玩家数 + 完成率 + 各游戏游玩次数 + 每日游玩。**无到店/核销**（游戏无奖品）。无 live 游戏时给空态（去我的游戏）。
**为什么**：游戏可脱离活动独立上线（#51），但它没有奖品/到店，数据维度是"玩"而非"到店"，需与活动数据分开呈现。
**影响文件**：`data.jsx`（新增 `GAME_METRICS`）、`journey.jsx`（ReportsView 分 tab + AppShell 传 `hasLiveGame`/`onGoGames`）、`index.html`（`.rep-top`/`.rep-seg`）
**研发注意**：游戏数据源=游玩埋点（plays/unique players/completion/per-game/daily），与活动的到店核销数据是**两套口径**，别混。

### 52. 「赢奖条件」标为选填
**改了什么**：活动编辑器「赢奖条件」(winScore) 标签加「选填」标记（`.wc-lbl .opt`）——不设门槛则玩即有资格赢券。
**影响文件**：`journey.jsx`（ActivityEditor win-cond）、`index.html`（`.opt`）、SPEC §3.7 标注选填。

### 51. 游戏独立上线 + 上线确认弹窗 + 状态标签（草稿/已上线）⭐ canon
**改了什么**：
- **游戏可脱离活动独立上线**（客人扫码就玩，**无奖品、无时限**）；活动 = 在游戏之上加**奖品券 + 起止时间**。
- **我的游戏**改为渲染 `myGames` 数组 + **状态筛选标签**（全部 / 已上线 / 草稿；零计数隐藏）+ 每卡状态徽章 + 上线/下线动作。
- **游戏 = 2 态**：`draft`(草稿) / `live`(已上线)。**下线→回草稿**（游戏无时限无奖品，"已下线"与"草稿"同义，不设 offline）。
- **点「上线」弹确认弹窗**（`PublishGameModal`）：方形 + 长方形两个封面（AI 默认已生成、可替换上传）+ 游戏名可改 + 确认上线。
**影响文件**：`journey.jsx`（MyGamesView + PublishGameModal + AppShell 传 myGames/setGame/setMyGames）、`index.html`（`.pub-*` 弹窗样式）、`data.jsx`（seed 3 个游戏含状态）
**研发注意**：`game.status`(draft/live) + `coverSquare`/`coverRect`(封面，AI 默认可替换)。修复：AppShell 之前缺 `setGame/setMyGames` 传参（游戏改名会报错），已补。

### 50. 活动去审批：直接上线（3 态）⭐ canon 变更（推翻 #40 审批设计）
**改了什么**：**移除活动审批流程**——编辑器去掉「修改→审批→上线」进度条与 review/rejected 态；底部按钮就是「上线」，点击弹**二次确认弹窗**（活动名 + 确认上线，`ActivityPublishModal`）。状态机缩为 **draft / live / offline**：draft/offline —上线→ live；live —下线→ offline。列表筛选去掉「审批中」。
**影响文件**：`journey.jsx`（ActivityEditor + ActivitiesView FILTS）、`data.jsx`（demo 活动去掉 review/rejected 态）
**canon 变更**：活动**不再走平台审批**，商家直接上线。⚠️ 审核后台 `review-admin.html` 因此逻辑不一致（仍显示"待审批"队列），Joyce 决定暂留、待统一。

### 49. 券码上传直连文件框 + 活动二维码固定说明 + 弹窗 portal 修复
**改了什么**：
- 奖品券「上传自有券码」**点一下直接弹系统文件选择器**（不再两步）。
- 活动二维码区加说明「**首次保存时生成、之后固定不变**，可放心打印，后续编辑活动也不会变」。
- **修复弹窗定位 bug**：`.app-body` 的 `rise` 动画在过渡态产生 containing block，导致 `position:fixed` 弹窗被锚定到超高的 app-body（居中点落到视口外）。改用 `ReactDOM.createPortal` 把弹窗挂到 `document.body`。
**影响文件**：`journey.jsx`（VoucherEditor / ActivityEditor / PublishGameModal / ActivityPublishModal）

### 42. 活动卡布局调整：「打开编辑」移到游戏图 hover 浮层
**改了什么**：活动列表卡片的「打开编辑」从底部文字区移到游戏预览图上的 hover 浮层（白色胶囊，与游戏选择卡一致）；底部文字区按钮只留「复制」（已上线卡再加「二维码」），不再拥挤。
**影响文件**：`journey.jsx`（ActivitiesView 卡片）、`index.html`（`.mgcard .mgart .play span`）

### 41. 活动列表新增「复制活动」
**改了什么**：每张活动卡新增「复制」按钮 → 生成 draft 副本（同游戏/券/门店/赢奖条件，名字加「（副本）」，清空 awarded/redeemed 运行数据），并打开编辑器供微调。
**为什么**：季节性/结束的活动想重开，复制比重建快。
**影响文件**：`journey.jsx`（ActivitiesView + AppShell `dupAct`）
**研发注意**：真实工程 `POST /activities/:id/duplicate` 返回新 draft；副本不继承运行统计与二维码（新建活动生成新码）。

### 40. 活动状态机扩为 5 态：新增 `offline`（已下线）⭐ canon 变更
**改了什么**：新增 `offline`（已下线）状态。`live —下线→ offline`（不再回 draft）；offline 活动可「重新上线（需审批）」→ review。活动列表新增「已下线」筛选 pill（零计数自动隐藏）；状态徽章 `st-offline`（灰蓝）。
**为什么**：跑完结束/手动下线的活动，之前混进「修改中」和从没上线的草稿分不清；独立「已下线」让商家看到"跑过、现暂停"的活动，便于复制重开。
**影响文件**：`journey.jsx`（ActivitiesView FILTS + ACT_STA + ActivityEditor 动作）、`data.jsx`（+1 个 offline demo 活动）
**canon 变更**：**推翻 2026-06-30 的「4 态无 offline」**——现为 **5 态**：draft/review/live/rejected/**offline**。下线不再等于回草稿。重新上线仍须重走审批。

### 39. 审核后台详情新增「审核备注」
**改了什么**：`review-admin.html` 详情抽屉（待审态）新增「审核备注」文本框，审核员可记录需商家修改的地方；驳回时这段备注自动作为说明发给商家（驳回面板显示「将附上审核备注：…」）。
**影响文件**：`review-admin.html`

### 38. 新增平台审核后台 demo（`review-admin.html`）⭐ 新页面
**是什么**：独立单文件 demo（平台审核员视角，非商家端），复用同套设计 tokens + `vendor/`。地址 `http://localhost:4311/review-admin.html`。
**布局**（对标 App Store Connect 审核队列 / 内容审核 modqueue / Retool 数据表）：
- **数据表队列**：每行一个商家提交（商家+电话 / 活动 / 游戏类型 / 奖品券 / 门店数 / 提交时间 / 状态 / **操作**）；异常项行内带 ⚠。
- **筛选 pill**：待审批 / 已通过 / 已驳回 / 全部（带计数）。
- **首页行内动作**：每个待审行有「通过 / 驳回」按钮——通过=即时上线；驳回=打开详情抽屉填原因。
- **点行 → 右侧详情抽屉**，完整展示商家提交的一切：**商家上传素材（LOGO + 品牌配色 + 商品图）**、游戏（可「▶ 打开试玩」看客人玩到的游戏，手机框预览）、奖品券（含**自有券码文件** chip：文件名+张数+查看）、逐门店地址、活动期限、审核清单。
- 通过/驳回后行状态更新 + toast；待审队列清空显示空态。
**调试参数**：`?open=<id>` 直开某行抽屉、`?play=1` 直开游戏试玩。
**研发注意**：这是**独立可视化 mock**（内部审核台），approve/reject 只改本地状态；真实工程审核台与商家端共用后端，通过后回写活动 `status=live` 商家端才联动上线。上传素材/券码文件在真实环境为 `<img>`/文件下载，mock 用样式块 + emoji 表意。

### 37. 建游戏第 1 步店型 chips 改为 10 大类
**改了什么**：`EXAMPLES` 从 6 个（咖啡店/奶茶店/面包…）换成 10 类：奶茶 / 甜品 / 咖啡 / 生鲜 / 便利店 / 桌游 / 运动 / 宠物 / 美妆 / 时尚（中英双语）。
**影响文件**：`data.jsx`（EXAMPLES）

### 36. 移除 `Done`（上线成功庆祝页）dead code
**改了什么**：删除 `Done` 组件（[journey.jsx](journey.jsx)）+ AppShell 里 `screen==="done"` 路由分支。该页早在 2026-06-30 就从流程移除（`publishDone` 直接进主页），组件残留为孤立死代码、仅 `?screen=done` 调试可达。
**根因**：它是「发布游戏=自动建活动+出二维码」旧架构遗物；game/activity 分离后保存游戏不产生二维码，其展示的 QR + "开始营业了" 已是假信息。确认成功 + 下一步引导已由主页空态「上手清单」内联承接。
**影响文件**：`journey.jsx`（删 Done 组件 + done 分支）

### 35. 奖品券卡：抬头简化 + 加「奖品名称」字段标签
**改了什么**：券区标题从「奖品券 —— 名称、原价、折扣、张数」简化为「奖品券」；奖品名输入框上方补「奖品名称」字段标签（与原价/折扣/张数标签风格统一）。
**影响文件**：`journey.jsx`（VoucherEditor）、`index.html`（`.vc-namef`，`.vcard-top` 改 `align-items:flex-end`）

### 34. 游戏详情页新增「游戏名称」可编辑
**改了什么**：`Workspace` 工具栏左侧新增游戏名输入框（`ws-gamename`），仅当传入 `setName` 时渲染。编辑模式下改名同步更新 `editing` state 与 `myGames`。
**影响文件**：`journey.jsx`（Workspace + AppShell edit 分支）、`index.html`（`.ws-gamename`）

### 33. 核销页「最近核销」：无数据不展示 + 去掉假数据填充
**改了什么**：原来 `reds.concat(reds).slice(0,4)` 把 2 条真实核销硬凑成 4 条（穿帮）；改为只渲染真实 `reds`，且 `reds.length===0` 时整块面板不渲染。
**影响文件**：`journey.jsx`（RedeemView）

### 32. 活动列表页移除底部「新建活动」虚线卡
**改了什么**：#27 已在顶栏右上角加了「+ 新建活动」按钮，底部虚线卡重复，删除。
**影响文件**：`journey.jsx`（ActivitiesView）

### 31. 主页 Hero 移除多门店今日分条
**改了什么**：删除 #23 加的 `outlet-bar`（各门店今日到店数分条）及其 CSS；同步移除 `DEMO_METRICS.today.byOutlet`。Hero 回归「LIVE 标签 + 活动名 + 今日三数 + 扫码核销」。
**影响文件**：`journey.jsx`（HomeView）、`index.html`（删 `.outlet-bar`/`.ob-chip`）、`data.jsx`（删 `today.byOutlet`）

### 30. 活动二维码：立即可用（去掉审批门槛）⭐ canon 更新
**改了什么**：活动二维码区在**任意状态**（草稿/审批中/上线）都显示真码 + 「下载」，删掉「审核通过后自动生成」的灰态占位。
**为什么**：活动二维码只是指向 Web 玩游戏页的链接，由 activity+outlet 决定性生成，不依赖平台审批；商家可提前下载、打印备货。
**影响文件**：`journey.jsx`（ActivityEditor QR 区）
**canon 影响**：更新「活动二维码 = 活动上线生成」→「活动二维码从建活动起即可生成/下载，审批只 gate 游戏是否可玩」。

### 29. 活动编辑器新增「赢奖条件」（达标即赢）⭐ canon 更新
**改了什么**：游戏板块下新增赢奖条件设置「达到 [X] 即可赢得奖品券」（存 `activity.winScore`，默认 1000）。文案通用化：X 视游戏而定，可能是分数/关卡/回合。
**影响文件**：`journey.jsx`（ActivityEditor）、`index.html`（`.win-cond`/`.wc-*`）
**canon 影响**：奖品券发放在「按剩余张数自然发放」之上叠加**达标门槛**——玩家须达到 winScore 才触发赢券资格；仍无中奖率概念。

### 28. 奖品券支持「上传自有券码」 + 撤销活动二维码自定义上传 ⭐ canon 更新
**改了什么**：
- **奖品券区**新增「券码」来源选择：系统自动生成（默认）/ 上传自有券码。选后者出现上传入口（二维码图 / 验证码表格），供自备几百张券码、想自己控制的商家使用。
- **撤销 #26**：活动二维码区的「上传自定义图」按钮移除——活动二维码是店铺入场码、必须平台统一生成，不接受商家上传。
**影响文件**：`journey.jsx`（VoucherEditor + ActivityEditor）、`index.html`（`.vc-src`/`.vc-upl`）
**canon 影响**：明确两种码的上传权限——**奖品券码**可商家上传自控；**活动入场二维码**只能平台生成。
**研发注意**：上传接口 `PUT /activities/:id/vouchers/:vid/codes`（批量券码/二维码），发放时优先消耗商家上传的码；核销时校验商家券码。

### 27bis. 游戏样片文案全量重写（8 款）
**改了什么**：`GAMES` 8 款名称改为「店型-玩法类型」（如 咖啡店-配方游戏 / 便利店-叠叠消除），小字改为「怎么玩」一句话说明。中英双语。
**影响文件**：`data.jsx`（GAMES）

### 27. 活动列表页顶部新增「+ 新建活动」按钮
**改了什么**：`AppShell` 的 `app-bar` 右侧区域（`app-bar-r`），当 `sec === "activities"` 且不在编辑态时，插入「+ New activity / + 新建活动」绿色按钮，点击行为与原底部 `mgnew` 卡片相同（调用 `newAct`）。

**影响文件**：`journey.jsx`（AppShell app-bar）

**研发注意**：按钮仅在 Activities 列表页显示，进入活动编辑器后自动隐藏；复用现有 `newAct` 逻辑，无需新接口。

---

### 26. ActivityEditor QR 区新增「上传自定义图片」功能
**改了什么**：
- `ActivityEditor` 新增 `customQRs` state（`{outletId: objectURL}`），`pickQR(outletId)` 触发文件选择。
- QR 面板改为**逐门店卡片**（live 和非 live 状态统一），每张卡片底部新增「上传自定义图 / Upload custom」按钮。
- 上传后卡片图示替换为商家上传的图片；二次上传显示「已上传自定义 ✓」+ 「更换」按钮。
- 非 live 态下原灰色单一占位改为按门店展开（`actOutlets`），逻辑与 live 态保持一致。

**影响文件**：`journey.jsx`（ActivityEditor）

**研发注意**：
- 真实工程需要上传接口（`PUT /activities/:id/outlets/:oid/qr-image`），返回持久化 URL 存入 Activity。
- 商家上传的是 QR 图片文件（PNG/JPG）；系统不验证图片内容，商家自行保证二维码指向正确 URL。
- 若商家未上传，上线后仍按现有逻辑自动生成（一门店一 QR）。

---

### 25. 落地页次 CTA 改为「看游戏样片」
**改了什么**：Hero 白色 ghost 按钮从「看 30 秒怎么玩」改为「See sample games / 看游戏样片」，点击后平滑滚动到页面内游戏展示区（`id="gallery-sec"`）；Gallery `<section>` 新增该 id。

**影响文件**：`journey.jsx`（Hero + Gallery）

**研发注意**：不再跳转 game creation 流程，改为页内锚点滚动；视频自动播放（右侧占位框）已覆盖"看效果"的需求，次 CTA 改为"看真实游戏样本"以区分功能。

---

### 24. 主页 Hero 布局优化 — LIVE 内联小标签 + 核销按钮右置
**改了什么**：在 #23 基础上进一步调整 Hero 布局：
- **LIVE 标签内联**：不再独占一行，改为与活动名 `<h3>` 同行排列（`display:flex; alignItems:center; gap:10px`）。
- **核销按钮右置**：「扫码核销」从全宽底部按钮缩回为普通尺寸按钮（`btn primary`），`alignSelf:center` 固定在 Hero 右侧，Hero 整体回到左右两栏 flex 布局。
- `.home-hero` CSS 改回 `flex-direction:row; align-items:center`。

**影响文件**：`journey.jsx`（HomeView）、`index.html`（`.home-hero`）

---

### 23. 主页（Home）重设计 — 移除 QR 码，核销升为主动作，增多门店分条
**改了什么**：
- **Hero 移除 QR 码**：删掉 `qr-sm`（打印型 QR 图）及「下载」按钮；QR 下载的正确出口是「活动」页（逐门店生成）。
- **核销升为唯一主动作**：Hero 底部新增全宽绿色「扫码核销」按钮（`btn primary lg`），取代原来藏在 QR 右侧的小「核销」按钮。
- **多门店今日分条**：Hero 内新增 `outlet-bar`，当门店数 ≥ 2 时显示各门店今日到店数（如「淡滨尼 7 到店 · 裕廊 5 到店」）；单门店不显示。
- **活动名可点**：`<h3>` 加 `onClick={onGoActivity}` + 箭头图标，点进去跳活动编辑；Hero 不再整卡可点。
- **上手清单第 3 步**：文案改为「打印各门店二维码」，上线后出现「去下载」链接（`onGoActivities` → 活动页）。
- **DEMO_METRICS** `today` 新增 `byOutlet: { o1: 7, o2: 5 }` 驱动分条展示。

**影响文件**：`data.jsx`（DEMO_METRICS.today.byOutlet）、`journey.jsx`（HomeView + AppShell）、`index.html`（`.home-hero` 布局 + `.outlet-bar` + `.ob-chip`）

**研发注意**：
- `byOutlet` 应来自"当日按门店归因的核销/到店数"接口；Key = `outlet.id`。
- `onGoActivities` 从 AppShell 传入（`() => setSec("activities")`），真实工程中跳转到活动列表 `/activities`。
- Hero 内 h3 的"活动名 → 活动编辑"导航在真实工程中跳转至 `/activities/:id`。

---

### 22. 落地页 Hero + 定价区文案与视觉整改
**改了什么**：
- **Hero 副标题**：改为「AI做好你的品牌游戏；客人玩游戏赢券进店，**下次自动发券召回。**」（原"没进店，就不用花钱"改为机制+召回的完整描述）。
- **Hero 数据条**：恢复三个数据点（`某冰激凌店 · 48% 到店率 / 1,500 新客到店 / 29% 老客召回复购`），带竖线分隔。
- **Hero 删除**：去掉眉标「AI 帮你 ~30 分钟做好带品牌的小游戏」（副标题已含"AI做好游戏"，避免重复）；去掉「无需注册即可试做」小字。
- **Hero 右侧**：手机 mockup 替换为视频占位框（灰色 16:9 圆角矩形，`vid-ph`），待接入真实视频素材。
- **定价标题**：删掉「· S$3 / 位」大字，保留「免费开始，到店才计费」（S$3 定价信息保留在套餐描述文字里）。
- **专业版按钮**：从「免费创建第一个游戏」改为「立即开始」（原文案暗示免费且与页面其他 CTA 重复）。
- **`.lede` 样式**：去掉 `max-width`，字号从 18.5px 降至 17px，确保副标题单行显示不断字。

**影响文件**：`data.jsx`（SUB_LANDING）、`journey.jsx`（Hero + Pricing）、`index.html`（`.lede` + `.vid-ph`）

**研发注意**：
- `vid-ph` 占位框上线后替换为静音自动循环 `<video>`（建议 16:9 横屏产品演示视频）。
- 三个数据点（48%/1,500/29%）为 demo 数字，上线对接真实数据接口。

### 21. 修品牌生成浮层文案（去假信息 + 去重 + 加标题）
**改了什么**：第三步改配色/logo 后点「生成」的 before→after 浮层（`gen-overlay`）：
- 删「放入你的商品图」——未登录第三步**不支持传商品图**，是假信息。
- 三条步骤定为真实且不重复：套用你的配色 / 放上你的 logo / 生成可试玩的游戏（删掉"为游戏换上你的品牌"=与前两条重复）。
- 加标题「正在生成你的定制游戏」。
- 说明：旧整卡 loader 里那句「正在为你匹配最合适的游戏」（选游戏阶段的台词、放品牌生成里是错的）在现行"预览图就地变身浮层"设计中**本就已不存在**；本次是把现行浮层自身的文案修对。

**影响文件**：`journey.jsx`（Preview genTasks + gen-overlay 标题）、`index.html`（`.gen-title`）

### 20. 落地页文案整体去重（一个信息一个主场）⭐
**改了什么**：全站落地页原本只在讲 4 句话，每句重复 3–6 遍（变回头客 / 只为到店付费 / 玩→赢券→到店 / AI 30分钟）。按"每条信息只有一个家、每个 section 一个职责"重排：
- **Hero**：新增眉标「AI ~30 分钟做好带品牌小游戏」（独占"怎么做"）；副标从两句机制叙述→一句杀手锏「没进店，就不用花钱」；数据条从 48%/1500/29% 三个→只留真实案例 + 1,500 次真实到店（48% 存疑删、29% 让给卡02）；CTA 下加「无需注册即可试做」。
- **loop 带**：保留为"玩→赢券→到店核销→自动召回"的**唯一**全链路出处。
- **三件事**：副标删「一个游戏三件事一起做」（与眉标"一套搞定"重复）；卡01 删「只算真实到店/不为曝光」（B 归卡03）；卡02 删「把一次性客变回头客」（与标题重复）、29% 是它唯一的家；卡03 标题改「不像投广告那样烧钱」（避免与 Hero 副标"没进店不花钱"撞），专职 vs 广告角度。
- **样片 Gallery**：标题改「上千种玩法，每个都能变成你的品牌」、副标改店型举例（不再讲流程，流程归三步）。
- **三步 Steps**：标题改「三步做好，开门收客」（30分钟数字归 Hero 眉标）。
- **价格 Pricing**：标题改「免费开始，到店才计费 · S$3/位」（B 的价格主场）。
- 导航「玩法」→「样片」。
- B（只为到店付费）保留在 Hero(承诺)/卡03(对比广告)/价格(价钱)三处，但**三处用词全错开、各是一个深度**，属递进强化而非复读。

**影响文件**：`data.jsx`（SUB_LANDING）、`journey.jsx`（Hero/ThreeThings/Gallery/Steps/Pricing/nav）、`index.html`（`.hero-eye`/`.cta-micro`/`.proof .tagm`）

**研发注意**：落地页文案以此为准；每条核心信息只在指定 section 出现一次。

### 19. demo 数据集中化 + 数据页重构（砍虚荣指标，到店做主角）⭐
**改了什么**：
- **demo 指标集中到 `data.jsx` 的 `DEMO_METRICS` 一处**，全站（主页/核销/数据/我的游戏）统一取数，口径自洽不穿帮。校验关系：`new 61 + returning 25 = walkins 86`；漏斗 `plays 312 → awarded 120 → walkins 86`；`byOutlet 50+36 = 86`；券 `awarded 120 / redeemed 86 → 待核销 34`；trend 7 天求和=86、末位=today 12。`DEFAULT_VOUCHERS[0]` 同步为 qty200/awarded120/redeemed86。
- **数据页（Reports）按第一性原理重构**（决策：街边小店只问"带来真客人了吗/值不值/下一步"，到店核销是唯一付费且独家可证的指标 → 做主角，其余非升即砍）：
  - **Hero**：真实到店核销大数 + 趋势 sparkline（深色 band，绝对主角）。
  - **转化漏斗**：扫码玩 312 →(38%) 赢券 120 →(72%) 到店 86 —— 吸收原"玩了游戏"KPI 当分母，不再单列虚荣数。
  - **新客 vs 回头**：61/25 横向分段条（证明"把路过变回头客"）。
  - **每日到店趋势**：柱状。
  - **条件显示**：「各活动带客排名」仅 ≥2 个 live 活动时出现；「各门店到店」仅 ≥2 门店时出现（单活动/单店不显示废条）。
  - **删除**：最近到店 feed（主页已有）、奖品券剩余（核销页已有）—— 数据页只做分析，不重复运营信息。
  - **决策：全程不出现金额/花费**（Joyce 定，延续 landing"别让钱吓到商家"；账单另归他处）。
- 主页 hero（今日 47/12/9）、我的游戏卡（312 玩·86 到店）、核销概览（今日9/待核销34/累计86）全部改为从 `DEMO_METRICS` 取数。

**影响文件**：`data.jsx`（DEMO_METRICS + DEFAULT_VOUCHERS）、`journey.jsx`（ReportsView 重构 + OutletPanel + HomeView/MyGamesView/RedeemView 取数）、`index.html`（`.rep-hero/.funnel/.nvr`）、`SPEC.md`

**研发注意**：
- 所有展示指标统一从一个数据源/接口取，避免各页口径打架。
- 数据页指标取舍按本条；条件模块（活动排名/门店）按"≥2 才有意义"渲染。
- 数据页不展示金额（产品决策）。

### 18. 全站统一空状态系统（核销 / 数据 / 活动 / 我的游戏）⭐
**改了什么**：
- 新增可复用 `EmptyState` 组件（图标 + 标题 + 一句副文案 + 一个主动作 + 可选次按钮），全站空态视觉统一。CSS `.empty-state`。
- **按"商家旅程上游依赖"分级**，每个空态把人推向该补的那一步：
  - **活动**：无任何活动 → 「还没有活动」+ 新建活动。
  - **核销**：① 没 live 活动且没任何活动 → 「还没有可核销的奖品」+ 新建活动；② 有活动但没 live → 「活动还没上线」+ 去活动；③ 有 live 但还没人赢券（`awarded==0`）→ 「还没有人赢到奖品」+ 下载活动二维码 / 查看活动。
  - **数据**：① 没 live → 「上线后才有数据」/「还没有数据」+ 去活动/新建；② 有 live 但 0 核销 → 「已上线，等第一位到店」+ 下载二维码 / 管理活动。
  - **我的游戏**：游戏卡不再显示假的「312 次游玩」和 LIVE 角标；没被 live 活动使用时显示「还没用在已上线的活动里」。
- 数据有来源才渲染：判据 = 是否有 `status==='live'` 活动（核销/数据再叠加 `awarded`/`redeemed` 是否为 0）。

**影响文件**：`journey.jsx`（新增 EmptyState + RedeemView/ReportsView/MyGamesView/ActivitiesView 空态 + AppShell 传 hasLive/hasActs 等 props）、`index.html`（`.empty-state`）、`SPEC.md`

**研发注意**：
- 所有统计/列表页**必须先判空**：无真实数据时渲染对应空态，绝不显示编造数字或 0 值图表。
- 空态文案要指向"补哪一步上游"，动作直达那一步。

### 17. 首次登录空态：活动未上线时不显示任何假数据
**改了什么**：
- **新商家首次发布游戏后落到主页**：因为还没有任何活动，主页只显示「空 hero（建个活动就能开门营业）」+「上手清单（让第一波人玩起来）」。
- **隐藏所有"没数据来源"的模块**（仅在有 live 活动时才出现）：主页「最近」动态流（别人到店/核销的事件）、「召回 18 位老顾客」win-back 卡、侧栏「核销」红色数字角标。
- 上手清单第 2 步**按是否已有活动动态切换**：没活动=「新建第一个活动 / 去新建」；有草稿=「配置并上线活动 / 去完善」；已上线=打勾、第 3 步高亮。
- **数据隔离**：`publishDone` 在"经注册首次发布"（全新商家）时把 `activities` 置空，主页自然落到空态；老商家 demo（`?authed=1` 直达）仍带 `DEFAULT_ACTIVITIES`。新增 `?fresh=1` 调试参数模拟全新商家。

**影响文件**：`journey.jsx`（HomeView 条件渲染 + AppShell 侧栏 badge gate + publishDone + activities 初始化）

**研发注意**：
- 主页所有统计/动态/召回模块**必须有真实数据才渲染**：判据 = 该商家是否有 `status==='live'` 的活动（更严谨可用"是否有过核销记录"）。
- 侧栏角标数字来自真实未读/待核销数，无数据时不渲染（不是显示 0）。

### 16. 活动状态机收敛：取消「已下线」独立态，下线即回「修改中」⭐
**改了什么**：
- **状态机简化为 4 态**：`draft`(修改中) / `review`(审批中) / `live`(已上线) / `rejected`(被驳回)。**删除 `offline` 态**。
- 转移规则：
  - 修改中 →（点「提交审核」）→ 审批中 →（平台通过）→ 已上线
  - 已上线 →（点「下线活动」）→ **回到 修改中**（不再是独立的 offline）
  - 被驳回 →（修改后点「修改并重新提交」）→ 审批中
- 含义：**下线 = 要改东西**，所以回到可编辑的修改中；任何重新上线都要再走一遍审批。没有「原样秒开」的快捷路径（街边小店简单活动可接受这个权衡）。
- 删掉了 offline 相关的状态条提示、stepper 分支、ACT_STA.offline 定义、筛选标签。

**影响文件**：`journey.jsx`（ActivityEditor 底部按钮 + stepState + ACT_STA + ActivitiesView 筛选）、`data.jsx`（demo 数据）、`SPEC.md` §状态机

**研发注意**：
- Activity.status 枚举去掉 `offline`。下线操作把 status 置回 `draft`。
- 重新上线必须重新进入审批流（status → `review`）。

### 15. 活动编辑器顶部加「修改 → 审批 → 上线」进度条
**改了什么**：
- ActivityEditor 顶部新增 3 段式 stepper：**修改 → 审批 → 上线**，按当前 status 高亮：
  - 修改中：第 1 节点高亮（绿圈），2/3 灰待办
  - 审批中：第 1 打勾、第 2 高亮、第 3 灰
  - 已上线：三段全绿打勾
  - 被驳回：第 2 节点变红「!」，详情在下方状态条

**影响文件**：`journey.jsx`（ActivityEditor）、`index.html`（`.act-steps/.act-step/.step-line` 样式）

### 14. 活动列表加状态筛选标签 + 卡片状态徽章
**改了什么**：
- 活动列表顶部加筛选 pill：**全部 / 修改中 / 审批中 / 已上线**，带数量角标。
- 「修改中」= 草稿 + 被驳回（都需要商家动手）。
- **零计数标签自动隐藏**（全部除外）：小商家只有上线活动时只看到「全部 / 已上线」。
- 每张活动卡左上角带状态徽章（已上线/审批中/草稿/被驳回），颜色区分。

**影响文件**：`journey.jsx`（ActivitiesView）、`index.html`（`.act-filters/.afilt`）

### 13. 活动编辑器：门店选择移到底部、紧挨二维码；上线后锁定
**改了什么**：
- 「在哪些门店生效」面板从顶部移到**二维码面板正上方**。编辑器顺序：活动名称/日期 → 奖品券 → 游戏 → **门店 → 二维码**。
- 已上线时门店勾选**置灰锁定**，提示「要改门店，请先把活动下线」（下线回到修改中即可改）。
- 上线后二维码面板直接显示**每家门店各一个二维码 + 下载按钮**。

**影响文件**：`journey.jsx`（ActivityEditor + OutletScope 加 `locked` prop）、`index.html`（`.ock.disabled`、`.qr-list/.qr-card`）

**研发注意**：
- 活动二维码按门店各一个，到店扫码归因到对应门店。
- 上线态下门店为只读；改门店需先下线。

### 12. 建游戏第三步「显式生成定制版」+ 第一步纯选店型
**改了什么**：
- **第一步（Describe）只选店型**，不再有品牌预设/网址输入；副标题改为「选你的店型，AI 帮你挑最合适的玩法」。
- 第一步 → 第二步保留一个 **AI 匹配 loader**（文案只讲「按店型匹配玩法」，不夸生成）。
- **第三步（Preview）= 显式品牌化**：左侧初始为中性灰模板；用户填配色/logo（**未登录不支持商品图上传**）+ 可选网址；点「**生成定制游戏**」播 ~1.9s 变身动效（before→after），再变成定制版。
- 按钮行：左「重新生成」+ 右「确认」；「← 上一步」放在页面左上角（不在动作行）。
- 删掉游戏中的「已套用品牌」状态反馈徽章；标题去掉「好看!」感叹号。

**影响文件**：`journey.jsx`（Describe + Preview + BrandControls）、`index.html`（`.gen-overlay/.canvas-back/.bc-site` 等）

### 11. 删「上线成功 Done」页 → 发布后直接进主页
**改了什么**：
- 发布游戏后不再有独立的「上线成功」Done 页，直接落到主页。
- 主页顶部 hero：**无活动空状态**（「暂时还没有活动」+ 最显眼的「新建活动」按钮）；有 live 活动时 hero **可点击直接进活动页**；删掉底部整行「+ 新建活动」。

**影响文件**：`journey.jsx`（publishDone + HomeView + Hero）

### 10. 奖品券简化为单券、删有效期
**改了什么**：
- 一个活动只配**一张券**：删掉「添加奖品券/删除」功能。
- 删掉券的「有效期」列；券字段保留 名称 / 原价 / 折扣 / 张数（+ 可选奖品图）。

**影响文件**：`journey.jsx`（VoucherEditor）、`data.jsx`（STARTER_VOUCHERS）

**研发注意**：
- 一个活动一张券（一对一）；按剩余张数自然发放、发完即停，无中奖率字段。

---

## 2026-06-29

### 7. 模板从 6 个补齐到 8 个（4 列 × 2 行）
**改了什么**：
- TEMPLATES 数组新增 2 个模板：**Hoop Shot（投篮赢奖）** 和 **Lucky Draw（幸运抽签）**，与 GAMES（落地页）的 8 个一致。
- 选游戏页面标题文案：「6 games for / 挑了 6 款」→「8 games for / 挑了 8 款」。
- 4 列 × 2 行 = 8 个，排版整齐无空位。

**影响文件**：`data.jsx`（TEMPLATES）、`journey.jsx`（Results 标题文案）

**研发注意**：
- 新增 `hoop` 和 `draw` 两种 `template_kind`，需要对应的游戏玩法实现和竖屏视频素材。

### 8. 活动编辑器游戏卡「查看详情」移到图片悬浮层
**改了什么**：
- 游戏选择器中，「查看详情」按钮从底部按钮行移到**图片区域的 hover 遮罩层**（半透明黑 + 白色按钮），点击进入工作台。
- 「选择/已选择」按钮独占整行，宽度 100%。
- 修复了全站所有 curly smart quotes（`""`）导致 Babel 编译失败的问题，统一替换为直引号。

**影响文件**：`index.html`（新增 `.mgcard .mgart .play` hover 样式）、`journey.jsx`（ActivityEditor 游戏卡片结构 + 全局 smart quote 修复）

### 7. 模板从 6 个补齐到 8 个（4 列 × 2 行）
**改了什么**：
- TEMPLATES 数组新增 2 个模板：**Hoop Shot（投篮赢奖）** 和 **Lucky Draw（幸运抽签）**，与 GAMES（落地页）的 8 个一致。
- 选游戏页面标题文案：「6 games for / 挑了 6 款」→「8 games for / 挑了 8 款」。
- 4 列 × 2 行 = 8 个，排版整齐无空位。

**影响文件**：`data.jsx`（TEMPLATES）、`journey.jsx`（Results 标题文案）

**研发注意**：
- 新增 `hoop` 和 `draw` 两种 `template_kind`，需要对应的游戏玩法实现和竖屏视频素材。

### 6. 所有游戏预览改为竖屏比例（9:16）
**改了什么**：
- 所有展示游戏预览缩略图/动画的区域，`aspect-ratio` 从横屏（`1:1` / `4:3` / `16:10`）统一改为 **`9:16`**（标准手机竖屏视频比例）。
- 涉及的 CSS class：`.gtile .art`（落地页游戏库）、`.gcard .thumb`（选游戏结果）、`.mgcard .mgart`（我的游戏 / 活动卡片 / 游戏选择器）。
- 网格列数：`.grid`（选游戏）和 `.mygames`（我的游戏/活动）从 3 列改为 **4 列**，避免竖屏卡片太高占满一屏。
- 响应式断点同步调整。

**影响文件**：`index.html`（CSS）、`SPEC.md`

**研发注意**：
- 游戏视频直接用手机竖屏录制（9:16），放进缩略图不用裁剪、不用加黑边，零额外成本。
- `<video>` 标签放在 `.art` / `.thumb` / `.mgart` 容器内，用 `object-fit: cover` 填充。
- 网格布局已改为 4 列，注意检查各页面卡片数量是否需要调整。

---

## 2026-06-28

### 5. 登录后建游戏第二步改为完整工作台
**改了什么**：
- 登录用户新建游戏的第二步从简单的「预览发布」（Preview 组件，只有品牌控制）改为**完整三栏工作台**（Workspace 组件：左 AI 对话 + 中可玩预览 + 右品牌控制）。
- 步骤条文案：「选游戏 / 预览发布」→「选游戏 / 修改游戏」。
- 工作台底部加「← 上一步」+「保存游戏」按钮。
- 未登录流程不变（仍用简洁 Preview）。

**影响文件**：`journey.jsx`（App 组件的 flowStep 逻辑 + STEPS_RET 常量）、`SPEC.md`

**研发注意**：
- 登录后 `screen === "preview"` 时渲染 Workspace 而非 Preview。
- 保存按钮调用 `publishDone`（保存游戏到 myGames + 创建默认活动）。
- Workspace 组件只管品牌视觉（配色/logo/商品图），不含券和门店。

### 4. 券有效期 + 活动日期范围
**改了什么**：
- 券卡片最后一列从「每人 / Per person」改为「有效期 / Validity」（天数），旁边加 **?** 图标，hover 提示「用户获得券后几天内可兑换」。
- 活动编辑器顶部（活动名称下方）新增**开始日期 + 结束日期**两个 date picker 并排。

**影响文件**：`journey.jsx`（VoucherEditor + ActivityEditor）、`SPEC.md`

**研发注意**：
- Voucher 数据模型新增 `validity_days` 字段（原 `per_customer_limit` 语义变更）。
- Activity 数据模型新增 `start_date` / `end_date` 字段。
- 后端发券时需校验：券是否在有效期内（`won_at + validity_days > now`）。
- 活动到 `end_date` 后应自动停止发券。

### 3. 主页进度步骤 + 落地页优化
**改了什么**：
- **主页进度推动**从 3 步改为 4 步：
  1. ✓ 游戏已创建（不是「已上线」，因为活动还没配好）
  2. 补充活动细节（按钮「去完善」→ 跳到第一个活动编辑器）
  3. 分享游戏 · 打印二维码
  4. 第一位客人到店核销
- **落地页**删掉了首屏角标「给街边小店 · 咖啡 / 奶茶 / 小吃 / 美甲 / …」。
- **落地页第三张卡**从「每位到店成本 S$4.6」改为「零浪费 · 没进店，不花一分钱 · S$0 曝光费」（原来的数字让商家觉得贵，改为强调零风险）。

**影响文件**：`journey.jsx`（HomeView + Hero + ThreeThings）、`SPEC.md`

**研发注意**：
- 主页「去完善」按钮需跳到该商家的第一个活动详情页。
- 落地页改动是纯前端文案，无后端影响。

---

## 2026-06-27

### 2. 活动页二维码下载 + 主页按钮优化 + 游戏卡片精简
**改了什么**：
- **主页 Hero 右侧按钮**：「分享」→「下载」（直接下载活动二维码 PNG 图片）；「核销」→ 跳转到核销页（不再是就地扫码）。
- **活动列表卡片**：已上线（LIVE）的活动卡右下角新增「下载二维码」快捷按钮，点击直接下载 PNG。
- **活动编辑器游戏选择器**：游戏卡片图片区域去掉了「已选」叠加标签（重复，下方按钮已有状态区分）。
- **建游戏 Preview 页**：新增「← 上一步」按钮（回到选游戏页）。

**影响文件**：`journey.jsx`（HomeView + ActivitiesView + ActivityEditor + Preview）、`SPEC.md`

**研发注意**：
- 下载二维码：前端用 canvas 生成占位图；上线后需替换为真实活动二维码图片（从后端获取）。
- 核销按钮跳转到 `/redeem` 页，不在主页就地扫码。

### 1. 活动与游戏分离（核心架构重构）⭐
**改了什么**：
- **新增「活动 Activities」概念**：侧栏从 5 项增为 6 项（主页 / 活动 / 我的游戏 / 核销 / 数据 / 我的）。
- **对象模型拆分**：
  - 旧：`Game` 包含玩法 + 品牌 + 券 + 门店（全混在一起）
  - 新：`Game` = 纯视觉（玩法模板 + 品牌配色/logo/商品图）；`Activity` = 纯经营（参与门店 + 券 + 绑定哪个游戏 + 状态 + 活动二维码）
- **新增页面**：
  - 活动列表页（`ActivitiesView`）：活动卡片 + 新建活动大卡片；空状态引导。
  - 活动编辑器（`ActivityEditor`）：活动名称 + 活动期限 → 参与门店 → 奖品券（含图片上传、有效期）→ 游戏选择器（大卡片 + 选择/详情按钮 + 新建游戏）→ 活动二维码（上线后显示 + 下载/打印）→ 上线/下线 + 保存。
- **游戏工作台简化**（Workspace）：右栏只保留品牌控制（BrandControls），移除了 VoucherEditor 和 OutletScope。AI 对话输入券相关关键词时提示「去活动里改」。去掉了上线/下线按钮（在活动中控制）。
- **建游戏预览简化**（Preview）：不论登录与否只显示品牌控制，不再显示券和门店。
- **主页改动**：Hero 显示当前 live 活动名称；无活动时显示引导卡；底部加「+ 新建活动」按钮；右侧两按钮（下载 + 核销）。
- **数据页**：「哪个游戏带客」→「哪个活动带客」；「调整游戏」→「管理活动」。
- **核销页**：数据源从游戏改为当前 live 活动的券。
- **副标题优化**：
  - 旧 EN：「People nearby play your game, win a voucher, and walk in to redeem…」
  - 新 EN：「Customers play for a voucher and walk in to use it. Regulars who stop coming get brought back automatically.」
- **新增 icons.jsx**：`clipboard`（活动图标）。
- **新增 data.jsx**：`DEFAULT_ACTIVITIES` 数组。
- **奖品券新增功能**：每张券可上传奖品图片（选填，显示在原价/折扣/张数一行的右侧）。
- **二维码体系明确**：活动二维码（客人扫→玩游戏）vs 奖品二维码（商家扫→核销），两种码归属不同、用途不同，不再混淆。

**影响文件**：全部（`journey.jsx` / `data.jsx` / `icons.jsx` / `index.html` / `SPEC.md`）

**研发注意**：
- 这是**架构级变更**，数据模型需要拆分。详见 SPEC.md §10.1。
- 新增 `Activity` 对象（id / name / game_id / outlet_ids / vouchers / status / start_date / end_date）。
- 新增 Activity CRUD 接口（`/api/activities`）。
- Voucher 从挂在 Game 下改为挂在 Activity 下。
- Redemption 的外键从 `game_id` 改为 `activity_id`。
- 活动二维码在活动上线时生成，需要后端提供 QR 图片接口。
- 库存池从 game 级共享改为 activity 级共享。

---

_本文档随每次改动同步更新。研发按此对照修改，有疑问参考 SPEC.md 对应章节。_
