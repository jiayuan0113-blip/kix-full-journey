# KiX 商家端原型 · 改动记录（研发对照用）

> 按时间倒序。每条列出「改了什么 → 影响哪些文件/组件 → 研发需要做什么」。

---

## 2026-07-23

### 107. 落地页两幕重构 — 顺序重排 + 地图整幅图版式 + 「为什么有效」三卡（三体 + 诚实化）
- **背景**：Joyce 要按「工具→网络」两幕叙事重排落地页；先综合调研（come-for-the-tool-stay-for-the-network / SMB SaaS section 顺序 / 冷启动薄网络风险），三体确定「为什么有效」三卡。方向卡存 `design-runs/落地页两幕重构/00-方向.md`。
- **顺序重排**（`Landing()`）：Hero → Walkthrough(5 手机屏) → WhyGame(地图) → FairDeal(为什么有效) → Pricing → FAQ → 终屏 CTA。
  - **删** `SeeYourGame`（中间重复的"输店名→看游戏"大手机屏，函数保留未渲染）→「输店名」只在 hero 出现一次。
  - **删** hero 两个 chip（`3 分钟 上线` / `免费试用`，`.hero-chips`）。
- **地图节（`WhyGame`，id `why`→`map`）改版式**：2 列(map 左/steps 右) → **整幅地图图 + 4 步横排在下**。`MapHero` mock → `<img className="mapshot" src="landing/map.png">`（占位=裁部署版真地图；⚠️ 待 Joyce 换正式图）。新 CSS `.mapshot-wrap/.mapshot/.mapsteps/.mapstep`。副标「不花一分广告费」→「不用花钱买广告位」。
- **「为什么有效」节（`FairDeal`，id `why`）重做**：旧 2 卡「不是打折平台」→ **3 卡**（三体收敛，覆盖店主决策三问 拉新/留存/成本）：
  - ①「让路过的人，玩着就进店」(Ic.pin) — 扫码 + 地图两入口、不买广告位。
  - ②「太久没来的客人，请他们回来」(Ic.ret) — **用比赛/品牌活动/新游戏召回**（⚠️ Joyce 修正产品事实：非"自动发券"）。
  - ③「每一块钱，都对着一个真客人」(Ic.shield) — 诚实口径：不为曝光付钱、不全场打折、券有上限只在到店兑现时让利、只按真玩的人计 MAU。
  - 标题「拉新客、留住老客、每块钱都花在真客人身上」/ 副标「钱跟着真客人走，不是交给平台买曝光」。
  - **诚实化背景**：Joyce 挑「发券=打折、送奖品=广告费」，撤回「不打折、不烧广告费」绝对说法，全线改「不买广告位 / 钱跟着真客人走」。
  - **字号对齐 portal**：`.tcard h3` 21px→17px、`.tcard p` 15px→14px、字距 -.02em→-.01em（与 `.pppc`/`.mapstep` 一致；`.tcard` 仅 FairDeal 渲染用）。
- **影响文件**：`journey.jsx`（`Landing`/`Hero`/`WhyGame`/`FairDeal`）、`index.html`（`.mapshot*`/`.mapsteps*` 新增、`.tcard h3/p` 调整）、新增 `landing/map.png`（占位图）。
- **调试**：`?screen=landing&lang=zh|en`。
- ⚠️ **canon 连带待办（未动，待 Joyce）**：pricing「EVERY PLAN INCLUDES」的「老客自动召回/Auto win-back」+ 未渲染 `ThreeThings` 卡2「30天自动发券」与 ②「比赛/活动/游戏召回」新口径冲突；地图标题「让全球人发现」薄网络下略满，建议改「让附近玩家发现你」。

---

## 2026-07-22

### 106. 预览页（第3步·我的游戏）加「登录后 AI 还能做更多」预告条
- **背景**：Joyce 要在匿名预览页露出"登录后有更进阶的 AI 定制"的说明，勾起注册欲望（契合 canon 渐进披露 + 注册后置：先给成品/勾欲望再要注册）。
- **改动**：`Preview` 组件右栏——**去掉原绿色「改哪个即时预览」note（`pv-note`）**，在其位置（品牌卡片与「上线」按钮之间）换成**淡紫虚线预告条 `pv-more`**：标题「登录后,AI 还能做更多」+ 正文「进后台用对话接着改:调难度、换玩法风格、加节日主题」（EN: More AI once you're in / Keep tuning by chatting: difficulty, game style, seasonal themes）。
- **设计取舍**：纯说明、**不加第二个按钮**（守单一焦点，唯一实心 CTA 仍是「上线」）；具体列出登录后 `Workspace` 对话编辑器真实能做的能力（与其 chip 一致），不写空泛"更多功能"；复用 AI 紫色语义（#7C3AED spark），与上方「用我的品牌生成」呼应。
- **「上线」按钮不改**（Joyce 曾问是否改成"登录体验更多"，否决：按钮说目标不说机制；点「上线」本就走发布闸门＝登录入口，无需单独登录 CTA；改了会丢"发布"动作且和预告条重复）。
- **影响文件**：`journey.jsx`（`Preview` 内 `pv-note`→`pv-more`）、`index.html`（新增 `.pv-more` 样式，删/替 `pv-note` 使用处；`pv-note` 样式暂留未清）。
- **调试**：`?screen=preview&lang=zh|en`。

### 105. 主页多活动/多游戏聚合 + A2 数据露出 + 聚合标题直达「已上线」
- **背景**：#104 的状态机用 `activities.find(live)` 只取第一个 live 活动，多活动/多游戏时露馅。Joyce 要求想清楚多个活动和游戏的情况。
- **两阶段模型**（想清楚后）：**开业跑道（上线第一个活动，单活动 + 进度条 C/B/A1）→ 运营台（在跑，业务级聚合，任意数量活动/游戏，无进度条）**。你不会同时 onboard 两个；A2 归进运营台（1 活动 + 0 到店的特例）。
  - `liveActs = activities.filter(live)`（不再 find 第一个）；`operating = nAct≥1 && (qrDownloaded || hasWalkins || nAct≥2)`。
  - 运营台 hero 聚合：**1 活动→活动名 + 券剩余**；**≥2 活动→「N 个活动进行中」+ 今日总玩/总到店（跨活动聚合，不显单个券剩余）**。券提醒跨所有 live 活动挑最紧张。
  - B（游戏 live 无活动）同样聚合：1 游戏→名 / **≥2 游戏→「N 个游戏在跑」**。
  - 运营台 `hasWalkins` 切换：有到店→兑奖流水 FEED + 召回卡；还没到店→游玩动态 feed（有人玩了/新玩家扫码/连玩3局）+ 数据条「N 上线以来玩过 → 看完整数据和趋势」（→ 数据页=历史看板）。
- **聚合标题「N 个活动进行中」点击 → 活动页并预选「已上线」分类**：`ActivitiesView` 新增 `initFilt` prop；`AppShell` 加 `actFilt` state + `goActs(f)` 助手；`HomeView` 聚合标题走新 prop `onGoActivitiesLive`（=`goActs("live")`），单活动标题仍 `onGoActivity`（开该活动编辑器）。
- **影响文件**：`journey.jsx`（`HomeView` 重构为两阶段聚合 + `HomeRunway`；`ActivitiesView` 收 `initFilt`；`AppShell` 加 `actFilt`/`goActs`，`HomeView`/`ActivitiesView` 透传）。
- **调试**：`?oneact=1`（截断到 1 个 live 活动，看 A1/A2 单活动态）；配合 `?nowalkins=1`/`?qr=1`/`?fresh=1`/`?nogame=1`/`?lang=zh`。
- **⚠️ 研发**：运营台聚合口径 = 跨所有 live 活动/游戏的当日总数；「N 个活动进行中」点击进活动列表须携带 live 筛选；游玩动态 feed 需真实 play 事件源（demo 用占位）。

### 104. 主页空态整体重设计：「开业跑道」五态（C/B/A1/A2/营业态）+ HomeRunway 进度条
- **背景/决策**：主页非营业态从旧「单 CTA hero + 竖直上手清单（游戏已创建/上线活动/打印码/首客到店）」重构为**「开业跑道」模型**。设计流水线全程 `design-runs/首页空态重设计/`（00方向/03评审清单/02示意图）；经设计评审官 + 产品三体 + 文字审查官三方评审 + Joyce 多轮迭代。
- **核心原则（Joyce 拍板）**：① **home 常驻主动作 = 扫码兑奖（收银台）**，不是数据展示、不是一次性下载；② **下载门店码 = 一次性 bootstrap**，下载后 home 永久锚定"扫码兑奖"；③ **免费试用信息只在上线前（C 态）**，已上线态不显；④ 一个页面一个动作，次动作（只上线游戏）放 hero 下方引导条、不与主 CTA 并列打架。
- **五态**（分水岭 `hasWalkins`→营业态；否则按 `liveAct`/`qrDownloaded`/`liveGame` 落）：
  - **C 全空**（无 live 活动+无 live 游戏）：深色 hero 灰徽章「游戏做好了·游戏名」+「上线活动，把客人请到店」+ 主按钮「上线活动」+ 理由 micro；下方圆角引导条「还没想好？先让客人玩玩看」+ ghost「只上线游戏」；免费试用 micro；跑道 cur=上线活动。
  - **B 游戏 live**（有 live 游戏无 live 活动）：进行中 + 游戏名 + 今天玩了 + 「+上线活动」+ micro「上线活动，把客人请到店」；跑道 cur=上线活动。
  - **A1 活动刚上线**（live 活动 + 门店码未下载）：进行中 + 活动名 +「下载门店二维码」(一次性) + micro「每家店一张，贴在客人扫得到处」；跑道 cur=贴门店码。
  - **A2 收银台待客**（live 活动 + 门店码已下载 + 到店兑奖=0）：进行中 + 活动名 + 今天玩了/到店兑奖 +「扫码兑奖」；**无跑道**（onboarding 毕业）。
  - **营业态**（到店兑奖≥1）：不变（LIVE + 今日三数 + 扫码兑奖 + 成本条 + 最近 + 召回）。
- **HomeRunway 组件**：横向进度条「做好游戏✓→上线活动→贴门店码→到店兑奖」，纯状态不可点，只在 C/B/A1 显示（A2/营业态不显）。第 1 节被动打勾不可点。
- **影响文件/组件**：`journey.jsx` `HomeView`（重写 S1 分支为 C/B/A1/A2 + 新增 `HomeRunway` + `qrDownloaded` state；移除旧 `sh` 对象 + `nudge` 竖直清单）；`index.html`（新增 `.runway/.rnode/.rline/.hl-ready/.hmicro/.subrow/.sr-ic/.home-cmicro`；`.live3 .l` 12.5→13）。中文 UI 用「兑奖」；游戏名中文取「幸运大转盘」。
- **字号规范**：新 home 元素全部对齐整数刻度（去半 px），`hl-ready` 对齐既有 `hl-live`(12/700)。⚠️ 全站其余页面仍有大量遗留半 px（12.5/13.5…），是独立的 type-scale 统一 follow-up、本次未动。
- **⚠️ 研发**：`qrDownloaded` = 商家是否已下载门店码（一次性、账号级或活动级，工程定）；下载按钮点击置 true 并触发实际下载。**调试**：`?nogame=1`(C 全空)、`?qr=1`(A1→A2)，配合 `?fresh=1`(空活动)、`?nowalkins=1`(到店兑奖=0)、`?lang=zh`。

### 103. 收卡时机 v2：账号门/卡门解耦 + 任何上线（游戏或活动）都判卡（本地已实现，未 push）
- **背景/决策**：收卡从"注册最后一步（发布闸门两子步 验证→绑卡）"改为**两道门解耦**。真分界线＝**"给自己用 vs 给客人玩"**：建游戏/预览/逛后台/进后台**免费不收卡**；**任何"上线给客人玩"（游戏 or 活动，客人扫码玩＝产生 MAU）首次都要绑卡**。**「上线游戏不收卡」已废**——纯游戏被客人玩也算计费 MAU（Joyce 2026-07-22 拍板）。设计流水线全程 `design-runs/上线收卡新流程/`（00方向/02示意图/03评审清单/04研发PRD）；决策 `Desktop/Mozat/kix/[决策] 2026-07-20-KiX注册收卡时机-三体.md`（含 07-21/22 修正）。
- **共享组件**：抽 **`CardForm`**（卡 UI：前3月免费+3条安心[7天提醒/随时取消/Stripe]+consent+Stripe 卡输入+「绑卡并上线」+「今天不会扣款」，从旧 Register 卡步提取）+ **`CardGate`**（`CardForm` 的独立弹窗，给绕过发布弹窗的直接上线用）。
- **`Register`（账号门）去卡步 → 只验证**：删 `rstep`/卡 state，`AuthEntry` 验证即建号进后台；标题「登录或注册」；footer「免费进入，随时可退出」（**不提"信用卡"，避粉色大象**）。建游戏第三步仍是存草稿+进后台（canon 不自动上线）→ 故账号门不是 go-live、不收卡。
- **`PublishGameModal` + `ActivityPublishModal` 内置卡步**：确认 → `!cardOnFile` 则 `setStep("card")` 渲染 `CardForm`（绑卡→onConfirm→done）；有卡直接上线。确认按钮无卡时文案「下一步：绑卡并上线」、有卡「确认上线」。`PublishGameModal` 新增 `cardOnFile`/`onSaveCard` props（`MyGamesView` 透传）。
- **集中闸门 `requireCard`（`AppShell`）**：`const requireCard = (proceed)=> cardOnFile ? proceed() : setCardGate(()=>proceed)`；渲染 `{cardGate && <CardGate onSave=…/>}`。**覆盖绕过弹窗的直接上线**——活动管理页卡片「上线」按钮（`ActivitiesView` offline→live `onSetStatus`）现走 `requireCard`。所有 go-live 路径（游戏发布/活动发布/活动管理页直接上线/Register 后台首发）统一判卡。
- **CSS（`index.html`）**：`.card-gate-modal`（h1/按钮在 pub-modal 里走 reg-card 排版）。
- **⚠️ 研发**：卡＝Stripe SetupIntent（off_session、tokenize 不扣款）；MAU 定义须含**独立游戏玩家**（bible §4.0 待改）；90 天卡衰减用 Stripe Account Updater + dunning（见 04-研发PRD §5）。**调试**：`?card=0` 强制无卡（点任何上线弹卡门）；`?rstep=card` **已废**（Register 无卡步了）。

## 2026-07-21

### 102. 每日锦标赛 DT（`form:'dt'`）替换旧限时挑战赛；旧 challenge 存支线 `kc-challenge`（本地已实现，未 push）
- **背景**：把 KiX App 现有玩法「Daily Tournament」做成**品牌可定制**版上架商家 portal，替代旧 KC 限时挑战赛模板。根因=旧 challenge 是一次性造势、事件内无"再来"钩子；DT 是多日留存引擎（每天回来+累积大奖），直补 KiX「They stay」。设计流水线全程存 `design-runs/DT-品牌锦标赛/`（00方向/01蓝图PRD/02示意图Pencil/03评审清单）。
- **机制**：品牌设时长(天) → 客人连玩几天 → **每天按当日名次发「每日奖」小奖** → **最后一天按累积总分发「末日大奖」**。奖分金/银/铜/铁四档奖牌皮，商家填**前 N 名**（绝对人数，不用 Top X%，成本可估）+ 奖励；**铁档**可选「前N名」或「所有有分的人」保底。每日/末日两梯独立配置，每日梯可留空=纯累积赛。
- **`NewActivityPicker`（`journey.jsx`）**：「限时挑战赛」卡 → **「每日锦标赛」卡**（天天来 / 促复购养回头客 / 例：7天·每天前3名赢·累积总分赢大奖）。
- **DT 编辑器（`ActivityEditor` `form==='dt'` 分支 + 新组件 `DurationEditor`/`MedalLadderEditor`）**：活动名 → **时长**(3/7/14/自定+开始日期，最短2天，绿底锚定=视觉焦点) → **每日奖梯**(绿左带) → **末日大奖梯**(琥珀左带) → 绑定游戏 → 门店/二维码/上线(复用长期活动)。奖牌行=奖牌 pill + 前N名(铁档带模式开关) + 奖励(类型下拉/名称/**上传图片**/券码来源，复用 `PrizeLadderEditor` 奖品块)。「套用示例」`DT_DAILY_SAMPLE`/`DT_GRAND_SAMPLE`；「+加一档奖牌」按金>银>铜>铁补。
- **成本条**：每日梯主数字「全程最多发 N 份奖」=单日×天数（评审必改：防 ×天数 账单吓退）；末日梯「最后一天发 N 份大奖」+铁档人人有份不计数。现金奖 0 隐去。
- **游戏面板**：`longrun`/`dt` 共用面板的「新建游戏」从网格内虚线卡 → **右上角绿色按钮**（Joyce 定，`.ladder-head` header）。
- **活动列表卡**：加 `form:'dt'` 分支（徽章「🏆锦标赛」；draft「N天·M奖·X门店」/live「进行中·N天锦标赛」/offline「X人参赛·Y到店」）。
- **数据模型**：`{form:'dt', duration:{days,startDate}, dailyLadder:[{medal,count,prize}], grandLadder:[{medal,count?,mode?,prize}], tiebreak}`；`blankDT`/`openAct` 深拷贝 DT 字段。
- **CSS（`index.html`）**：`.dt-anchor/.dt-key/.dt-days/.dt-day/.dt-daynum/.dt-note/.panel.ml-daily(绿左带)/.ml-grand(琥珀左带)/.dt-when/.medal-pill/.iron-seg/.mlspace/.ml-empty/.ml-note`。
- **旧 challenge**：整套（`form:'challenge'` + `ScheduleEditor`/`PrizeLadderEditor` 等）从 main 移除入口、代码保留在 git 支线 `kc-challenge`；渲染仍兼容历史 `challenge` 数据。
- **⚠️ 研发接口**：每日/末日结算、名次、累积、出券、推送=后端；前N名>实际参赛"发到实际名次"、小样本并档规则待产品定。**调试**：`?newdt=1` 直达空白 DT 编辑器。
- **修复**：初版用了不存在的 `Ic.calendar`/`Ic.info` → React #130 崩溃，改 `Ic.gift`/`Ic.shield`。
- **评审收紧 pass（设计评审官 + 文字审查官，见 design-runs 03 Round2）**：①成本条去绿→中性底 + 数字字号顶（`.ml-* .cost-bar` 覆盖，绿实底只留时长锚点）；②删跨组件机制复述 + 统一术语（档→奖牌、总冠军→末日大奖）+ 去破折号；③现金档溢出修复（删多余 `mlspace` 双 flex:1；`.pcash input` 锁宽 flex:none 防窄屏截断）。
- **Joyce 迭代收敛**：①`.dt-cpreview` 玩家预览条**固定只显总奖券个数**「玩家在 App 看到 N 份奖 · D 天」（去掉早前 $奖池/+好礼 分支；C 端 $ 奖池逻辑归 App 团队，见 `Desktop/Mozat/kix/[决策] 2026-07-21-*`）；②**奖牌行券码来源 = 右侧不打眼小链接**`.pcode-mini`「券码：自动 · 上传自有码」（默认系统自动生成，点击才上传自有码文件→显「✓ 文件名 · 改回自动」；2026-07-22 从下拉简化为链接、default auto）；DT 不支持商家为实物填单价——纯膨胀无校验，见决策文档；③图片上传方块去"图"字改纯图标；④时长面板：删空副标「活动跑几天」+ 去「先填这个」eyebrow、底部说明从白框 block 降单行灰字、**补回一处机制说明**「客人连玩几天…每天发『每日奖』…最后一天发『总冠军大奖』」（点名两档、机制只此一处不散落）；⑤**「末日大奖」全局改名「总冠军大奖」**（"末日"=doomsday 负面误译；EN 保持 grand finale）；⑥**每日奖默认折叠**（`MedalLadderEditor` 加 `open` state；daily 空时折叠成「每日奖·可选」一条 + 「添加每日奖」点开即加一档；grand 必填始终展开；`blankDT.dailyLadder`→`[]`）；⑦空态按 grand/daily 分文案（修 bug：总冠军空态曾错显「还没设每日奖」）+ 每日奖空态精简；⑧**删每日/总冠军两条 per-ladder 成本条**（`.cost-bar` 冗余，总数改由底部 `.dt-cpreview` 预览条单一计算，随配置动态）；⑨日期输入 `.dt-anchor .field input[type=date]` 锁平台字体 Plus Jakarta + 14px（原系统字体偏大不一致）、天数 chip 16→15px。
- **Joyce 迭代 v6**：①**底部改「成本小结」`.dt-costsum`**（替代玩家份数预览）= 「这场活动的成本：N 份奖·现金 S$X·铁牌人人有份·空名次不花钱」+ **可编辑「预估总价值」`activity.estCost`**（系统自动预估=现金精确+非现金档×S$5，商家可覆盖；纯商家成本认知、不上玩家端，与"不让商家填玩家侧奖池值"不冲突）；②**每日奖默认态改回空态解释卡**（去 thin fold bar/`open` state），一句话讲「加了=客人每天回来拿小奖；不加=只拼总冠军大奖」；③空态/加档按钮 `btn primary`→`btn ghost`（去绿，绿只留时长锚点）；④**开始日期 + 预计结束同行**（`.dt-daterow`，系统算 start+天数-1 → 「M 月 D 日结束」，去掉单独占行的 note）；⑤删每日/总冠军 per-ladder 成本条后 `medalStats` 移到底部小结统一算；文案二次精简。
- **Joyce 迭代 v8（估值+成本小结+券码提示，daa9e0b 之后本地）**：①**预估总成本估值定案**=现金精确 + 免费商品/自定义按**商家选填单价**`prize.unitPrice`×名额×倍数 + 折扣/未填/铁档人人有份=不计（弃 ATV 猜测，见 `Desktop/Mozat/kix/[方案]`）；免费商品/自定义行右侧加「单价 S$ 选填」输入；②底部小结重排：**份数做主视觉**`.cs-count`（大号「N 份奖·D 天」）+ 精简核心点 + 可编辑「预估总成本」`activity.estCost`；③每日奖机制句改一行不换（`.ml-empty p` max-width 放开）；④券码=默认系统自动、右侧「上传自有码」，上传时**行内动态提示**`.pc-req`「一张券配一个码/图 · 需≥N个（每日档=名额×天数）· 多张可打 ZIP」，铁档 all=「按到场量」；⑤修「选填」被截断（`.pf-unit input` 加宽）。
- **Joyce 迭代 v7（排版收口）**：①券码区拆成 `.pc-status`「券码 系统自动生成」灰字状态 + `.pc-upload`「上传自有码」绿色小 chip 按钮（原「券码：自动·上传自有码」糊一坨、看不出可点）；②时长面板 `.dt-anchor` **去绿改白**（跟其它 panel 统一）；③天数 chip `.dt-day` 扁平化（padding 8/16、font14、border1px）；④「预计结束」**去框**改 `.dt-endtxt` 行内小灰字（原 box 像待填输入）。

### 101. 落地页再定位：视频版 hero + 地图从 hero 降为「辅助发现步骤流」段（landing-video → main；push）
- **背景**：#98「进地图」把 hero 做成消费者城市地图。Joyce 复盘后认为**地图不是全新强调功能、应弱化为辅助特征**，顶部与第二屏回归旧的游戏优先叙事，地图移到核心故事之后单列一段。先在本地 `landing-map`（#98 地图完整版快照）/`landing-video`（本变体）两支线 A/B，最终选定视频版设为 main。
- **Hero（`journey.jsx` Hero + `index.html` `.herovid/.hv-*/.hv-wrap`）**：地图卡 → **16:10 长方形产品视频占位**（播放键 + 右上「实拍演示」live 徽标 + 底部「看 30 秒怎么玩」+ 隐约转盘底 + 两张活动浮层贴角）。副标题改游戏优先「一个你自己品牌的小游戏，客人来玩、赢券，进店消费」。hero 栅格右列加宽 `.94/1.06` 适配横向视频。**⚠️ 研发接真实产品视频**（换掉占位，尺寸位置不变）。
- **第二屏 Walkthrough（`#the-game`）恢复旧 5 步**：海报 → 扫码免下载 → 玩专属游戏 → 赢券 → 兑奖成常客（`poster/play/win/redeem.png` + `.wt-scan`）；标题回「把你的店变成游乐场」；**去掉 #98 的城市地图/3D 店开场**（`.wt-full`、`map-3d.png`/`store-3d.png` 在落地页不再用）。
- **第三屏 SeeYourGame 恢复旧手机游戏截图**：去掉 #98 的 `.live3d` 实时 3D 店，回 `.wow-phone` + `play.png`；副题去「3D 店/上地图」措辞。
- **地图降为辅助段（原 `#why` WhyGame 位）**：标题「把你的店铺小游戏放上地图，**让全球人发现**」（Joyce 认可全球发现口径）；**去眉标**；小字压成一句「玩家在地图上逛店，顺手就发现你、点进来玩，你不花一分广告费」。布局 `.mapsec` 2 列 = 中号地图卡（`MapHero` 复用，≤440px）+ **竖向 4 步发现流程 `.mapflow`**（① 玩家逛地图 → ② 刷到你的店 → ③ 玩一局赢券 → ④ 到店消费成常客，带连接线）。替掉 #98 的 3 张网络收益卡（Joyce：小字啰嗦、没突出流程 → 改步骤图）。
- **删 Stories 店主证言整段**（Landing 不再渲染 `<Stories/>`；组件/`STORIES` 定义保留未用）。
- **FAQ 竞品抄袭问答中英逻辑纠偏**：原「你的玩家发现附近别家店」（等于把客人往外送）→ 改「店越多 → 平台玩的人越多 → **来发现你的人也越多**」，好处落回商家；中文去「就在你隔壁」语义错。
- **Nav**：首链 ZH「怎么被发现」→「怎么运作」。
- **Pricing 未动**（沿用 #100 MAU 阶梯）。
- **分支**：`landing-video` 快进设为 `main` 并 push；`origin/landing-map` 保留 #98 地图完整版以备回退（含 `map-3d.png`/`store-3d.png` 素材与 `.live3d`/`MapHero`-in-hero）。

---

## 2026-07-20

### 100. 定价改版：MAU 用量阶梯 3 档 + Custom + 全平台口径统一 + ToS/隐私对齐（本地→push）
- **模型**：软件永久免费；**3 个月免费试用 → 到期自动转付**（opt-out，card-on-file）；卡**在发布闸门收、不在冷启动入口收**（"不一进去就绑卡"）；按 **MAU（当月玩过≥1次的活跃玩家）** 计费。**推翻旧「walk-in/到店=计费」与旧梯度 0.49→0.12**；删「只对新生意/老客永远免费」。
- **落地页 Pricing（`journey.jsx` `TiersNew`/`LADDER_STEPS` + `index.html` `.ladder .step*`）**：2 卡 → **单一 Start free + 上升阶梯 4 档**（Starter S$29/≤500 · Growth S$79/≤2,500 · Pro S$199/≤10,000 · Custom=Talk to us）。视觉 = **倒色阶**（便宜档最深、越贵越淡、Custom 白卡）+ **四档等高**（去高度台阶，避免与色阶/CTA 冲突，三体决策）；每档「含 N 玩家 + 超额 S$0.0X/位」明码；标题「Priced to grow with you」。`?pricing=legacy` 保留旧 2 卡回退。**数字待财务核 per-MAU 毛利**。
- **平台文案统一**：FAQ「怎么收费」→ 3 档；主页 `nudge-free` / 数据页 `bm-proj` / 「我的」`cardf-note`×2 → 去「老客免费/只对新生意」，改 MAU 口径。
- **「我的 → 套餐」(`PLANS`/`PlanModal`)**：单一「Grow with KiX」→ **只读 4 档阶梯**，当前档高亮「You're here」，**自动定档不手选**；账单行显示「Starter · S$29/mo」。（并入另一窗口 `chain` 条为 Custom 行。）
- **ToS/隐私(`legal.jsx`)**：§7.3 去「或首 1,000 玩家」；**§7.4 改宽表述**（不写死 29/79/199，指向「当前公示价目表」，变价走 §7.7）；**walk-in 全清**（术语 Verified walk-in→In-store redemption；§7.5/§68/隐私计量去 walk-in；"到店兑奖"作兑奖动作保留）。⚠️ DRAFT 待法务。
- 决策存档：`Desktop/Mozat/kix/[决策] 2026-07-20-KiX注册收卡时机-三体.md`、`[决策] 2026-07-20-KiX定价页信息架构-B骨A皮.md`。
- ⚠️ **SPEC 待跟进**：§4.0/§6.7/数据页/成员角色仍有旧「walk-in/到店=计费」「梯度」「2 卡」表述，本次未逐条清（已在 SPEC §4.0 顶部加超越标记指向本条），标 follow-up。

### 99. 建游戏 3 步 UI 按 Joyce 截图对齐（describe/results/preview）+ 删 building loader（本地未 push）
- **描述(Describe)**：店型 chips 从 **emoji → 单色线性 SVG 图标**（12 类，`sic()` 生成；craft 反 emoji-当图标）；选中态复用 `.cate-chip.on` 绿圈 + `.cico` 绿标。
- **选游戏(Results)** 重建为设计稿版：**店铺信息卡**(你输入的店铺 + name + ✏改) + **主游戏卡**(方形封面 `.gcov` + 名 + `96%匹配` + 为什么是这个 + lede) + **用这个游戏**(绿满宽) + **换一个看看**(白满宽) + **其他 2 个候选**(带封面 + 匹配%)。match% = 按 rank [96,91,88,…]；封面 = 玩法色 tint 方块 + gamepad 图标（研发接真实方形封面图）。游戏名用本地 TEMPLATES 真实数据（幸运大转盘/刮刮乐/叠叠乐），非 mock 的 Palette Puzzle。
- **我的游戏(Preview)** 品牌面板重构为设计稿版：标题「换成你的品牌」+ 副题；`.pv-brand` 卡 = **配色**(圆 swatch + 选中黑圈 + "+"换色) + **Logo / 商品图 两个上传框** + **或让 AI 帮你抓一套**(网址 input + `用我的品牌生成` 浅紫按钮) + **即时预览绿提示条** + **🚀 上线**。弃用 Preview 内的共享 `BrandControls`（Workspace 仍用，未动）。
- **删 building loader 屏**（Joyce：这一屏删掉）：`describe onNext` 与 `startBuild(有店名)` 均直接 →`results`（原 `Loader`「Matching games…」分支移除；`BUILD_TASKS`/`Loader` 变未用 dead code，保留）。
- 文件：`journey.jsx`(CATE+sic/Describe/Results/Preview/路由) + `index.html`(`.cate-chip .cico`/`.rs-*`/`.gcov`/`.pv-*` CSS)。**仅本地，未 push**。

### 98. 落地页「进地图」重定位 —— 从卖功能(AI建游戏) → 卖需求(上地图被一城人发现)（设计流水线定稿 → 落码，本地未 push）
- **需求**：线上新版抛头引入"进地图"范式（消费者端城市地图 = 需求侧可视化）。落地页据此重定位。产品事实：每家店 = 一个 3D 游戏化建模，点进去玩该店专属小游戏；客人体验三层下钻 城市地图→店 3D 建模→店内游戏。
- **方向（设计流水线 Stage0-8 + 三体）**：lead-with-demand 换 lead-with-feature（marketplace 铁律：Airbnb/Yelp/DoorDash/Dixon come-for-the-tool-stay-for-the-network）。hero=地图（需求钩子）；建游戏工具降为 how、地图/网络升为 why-it-compounds。
- **原型改动（`journey.jsx` + `index.html`，只改 Landing 段）**：
  - **Hero**：去掉"冷清空店场景"→ 换**嵌入式消费者城市地图**（`MapHero`：搜索/City/★pts/券/Singapore·Orchard/GO·Night·Bold/NEARBY MALLS/定位准星 + 散布店 pin + 高亮 YOU pin + callout「你的店，就在这里 / ▶玩一局，赢张券」）。文案精简：去 eyebrow，副标题一句「把你的店做成游戏放进地图，被全球发现」（店=游戏+全球，与网络段「全世界」一致；2026-07-20 Joyce 定）；chips 改 3分钟上线/客人免下载/免费试用。hero 栅格调宽给地图（`.86fr 1.14fr`）。
  - **Walkthrough(`#the-game`)**：改回**多手机屏流程**，5 屏 = ①**3D 城市地图** `walkthrough/map-3d.png` ②**3D 店** `walkthrough/store-3d.png`（Joyce 给的真 3D 渲染图，含自带手机边框 → 用 `.wt-full` 无框直铺，避免框中框）③④⑤ **复用现有图** `walkthrough/play|win|redeem.png`（`.wt-phone` 框）。标题「他们在地图上发现你，玩着就进店」。PLAY/PAY/STAY 口径贴地图。〔`MiniMap` 组件保留未用〕
  - **SeeYourGame**：**改为 live-3D 店铺预览**（2026-07-20 Joyce：这屏不是手机截屏，是实时 3D 图、真实 3D 店铺将来嵌入，先做模拟）。`.live3d` 深色圆角卡 + 店铺 3D 图放大裁掉手机框 + 「◈ LIVE 3D」实时徽标 + 「↻ 拖动查看你的店」提示 + 轻微自转动画（`live3dspin`）。**⚠️ 研发接真实 3D embed（three.js / model-viewer）**；副题"生成你的品牌 3D 店和小游戏，做好就能上地图"；去"前3月免费"note。
  - **WhyGame(`#why`)**：→「这不只是地图，是**全世界**的游戏乐园 / Not just a map. The whole world at play.」（2026-07-20 Joyce：城→全世界）+ 副题「店越多，玩的人越多，你也被更多人发现」；3 卡 = 券非现金 / **店和店互相带客** / **店越多玩家越多**；**删**旧"每次到店可验证"卡（与 MAU 计费冲突）。
  - **Hero 地图**再放大：栅格 `.76fr 1.24fr`。
  - **Pricing 可点（2026-07-20 Joyce）**：`TiersNew` 3 档位卡加 `onClick={go}`（点击 = Start free，走注册/生成闸门）；Custom 卡本就 `setLead`。**⚠️ 仅加可点行为，档位数字/内容仍未改**（之前"完全未动"修正为此）。
  - **Pricing 视觉中心（2026-07-20 Joyce：Start free 被信息淹没）**：`.btn.big` 放大 52→66px 高 / 17→21px 字 / padding 60 / 更强绿投影 + hover 抬升；`.ladder-cta` `.includes` 加留白。深绿实心 CTA 压过浅绿档位卡 = 唯一焦点（Fitts + 单一焦点）。仅 index.html CSS。
  - **Faq**：顶部**新增 3 条地图 Q**（怎么在地图上找到我 / 找到之后然后呢〔含 3D 店→游戏→券→到店〕/ 地图上没人怎么办〔诚实冷启动 come-for-tool〕）；旧 Q&A（含定价档 FAQ）不动。
  - **Stories**：接进 Landing（原 `Stories` 组件定义了但没渲染）；内容换地图版店主证言（Marcus 茶饮/Lim 姨小食/Priya 咖啡），去掉旧虚荣数字(48%/1500/29%)，改 quote-forward。标题「已经在地图上的店」。
  - **Final CTA**：**保留旧版**「每家店都值得拥有自己的游乐场」（2026-07-20 Joyce：最后一屏保留旧的；曾短暂改地图版又还原）。
  - **地图/店铺素材**：流程首屏地图 `walkthrough/map-3d.png` + 店铺 `walkthrough/store-3d.png` 均用 Joyce 给的 **852×1846 高清透明 PNG**（hasAlpha，融入无底色块）。同一 store-3d.png 在流程里作手机屏、在 SeeYourGame 里作 live-3D 预览两处复用。
  - **Nav**：首链接「游戏」→「怎么被发现」。
  - 新增组件 `MapHero / MiniMap / Store3D`；新增 CSS `.mapcard/.mchrome/.mpin/.mcallout/.wtm/.wts` 等（index.html）。
  - **⚠️ 定价段（`Pricing`/`TiersNew`）完全未动**（Joyce 指示：除定价外其他都传）。3D 店目前为 CSS 卡通示意，待真实 3D 建模素材替换。
  - **状态**：仅改本地，**未 push**（待 Joyce 确认）。设计流水线全程产物在 `design-runs/落地页-进地图/`。

### 97. 兑奖页布局重排 —— 修正视觉权重倒挂，扫码成唯一焦点（Pencil 定稿 → 落码）
- **需求**：Joyce 觉得兑奖页排布可优化。三体调研收敛（Square/Toast/Loyverse 收银屏 + POS UX：一屏一主动作、主动作最大最高对比、离屏≥80cm 要够大、砍冗余）→ Pencil 出布局稿 → Joyce 微调（去页副标题、右栏第 2 数改「累计兑奖」）→ 落码。
- **诊断**：原布局主动作「扫码兑奖」挤在左侧 400px 窄栏，更宽的右栏却放次要参考（3 统计块 + 券进度）= 视觉权重倒挂；券进度是分析、越位（违 canon 操作页/分析页分离）。
- **原型改动**：
  - `index.html`：`.redeem-wrap` 网格翻转 `minmax(0,400px) 1fr` → **`minmax(0,1fr) minmax(0,360px)`**（左主右次）、`align-items:stretch`；`.redeem-card` 改 flex 垂直居中 + 放大 padding（扫码 hero 占主导、居中）；`.rd-summary` `repeat(3)`→`repeat(2)`；新增 `.rd-datalink`（深入数据入口）。
  - `journey.jsx` `RedeemView`：最近兑奖从左栏移到右栏；右栏概览三数→**两数（今日兑奖 + 累计兑奖，删待兑奖）**；**移除奖品券进度面板**、换成一行「各门店与趋势 · 查看完整数据 →」（`onReport` 跳数据页）。
- **影响文件**：`index.html`、`journey.jsx`、`SPEC.md`(§4.7 重写)、`CHANGELOG.md`。调试 `?screen=dashboard&sec=redeem`。

### 96. 核销门店归因 —— 兑奖页当前门店选择器 + 数据页「未指定门店」桶（三体，统计用非计费）
- **需求**：Portal 要展示"这个码在哪核销的"。很多商家用自家设备核销（不用 KiX 机子），无设备级门店绑定 → 记不到门店。三体调研：核销门店不靠客人的码定位，靠"扫码端携带门店身份"（对标 Shopify POS 设备绑 location / 美团门店授权）。**仅统计用、不计费** → 软处理、不卡扫码；纯 off-KiX 核销 KiX 无记录、覆盖不到（须强制"在 KiX 标记已用"，未做）。决策见 `Desktop/Mozat/kix/[决策] 2026-07-20-KiX核销门店归因.md`。
- **原型改动**：
  - `journey.jsx` `RedeemView`：顶部通栏「当前兑奖门店」bar——单门店只读、多门店下拉（`curStore` state、默认主门店、软默认不卡扫码）。新增 `outlets` prop（App 传 `outlets`）。
  - `journey.jsx` `ReportsView`/`OutletPanel`：各门店到店追加「未指定门店」灰桶（`M.byOutlet.unknown`）+ 说明；归因轴 = 门店是否已归因（非设备归属）。
  - `data.jsx` `DEMO_METRICS.byOutlet`：`{o1:50,o2:36}` → `{o1:44,o2:30,unknown:12}`（自洽求和仍 = walkins 86）。
  - `index.html`：`.redeem-storebar`/`.rsb-*`/`.ho-unk` 样式。
- **影响文件**：`journey.jsx`、`data.jsx`、`index.html`、`SPEC.md`(§4.7 顶部门店 bar + §4.8 未指定门店桶)、`CHANGELOG.md`。

---

## 2026-07-15

### 95. 接入法律文本 —— ToS / 隐私政策 / 玩家条款（中英，三体调研）
- **需求**：portal 缺对外法律文本；注册绑卡步已引用"条款"但为死链；上线即采玩家个人数据无隐私政策 = PDPA 违规 + Apple 上架需 privacy policy URL。
- **调研（三体，2 轮收敛）**：新加坡 PDPA + GDPR + PIPL + Stripe 条款 + 13 家同类平台。核心定性 = **玩家数据双重角色**（单商家时 processor / network·App 时 KiX 独立 controller）；结构母版 = Como。决策与来源见 `Desktop/Mozat/kix/[决策] 2026-07-15-KiX-portal-ToS隐私政策-三体.md`。
- **分类**：3 份对外文档 = 商家 ToS / 隐私政策（统一含双数据主体）/ 玩家条款（含券规则 + 反赌博 recital）；DPA 待补。
- **原型改动**：
  - **新增 `legal.jsx`**：`LEGAL{tos,privacy,player}.{en,zh}` 结构化块，**由 `scratchpad/md2legal.py` 从 3 份 md 生成**（改 md 后重跑脚本，勿手改）。
  - `journey.jsx`：新增 `LegalModal`（三 tab + createPortal）/`LegalHost`（挂 App 根 + `?legal=` 调试）/`LegalLinks`/全局 `openLegal`；landing footer + 侧栏底 + 注册验证步 + 登录页死链→打开弹窗；**绑卡步**卡框上方加授权披露句（Terms 链接 + 按月扣费 S$29 起 + 随时取消），采 clickwrap（未加硬 checkbox，守 canon 绑卡步单一焦点）。
  - `index.html`：加载 `legal.jsx` + 法律弹窗/链接/表格/占位符 chip 样式 + `.reg-fine.card-consent`。
- **已定内容**：管辖=新加坡法院；儿童=13 岁（EU 16）；保留期给默认（账号+计费 5 年 / 游玩 24 月 / 验证码分钟 / 营销至撤回）；EU·中国代表暂未指定。**占位符待填**：公司法定名称 / UEN / 注册地址 / DPO 邮箱 / **生效日（暂空）**。
- ⚠️ 全部 DRAFT，上线前须经新加坡法务复核。SPEC §14 已加。调试参数 `?legal=tos|privacy|player`。
- **影响文件**：`legal.jsx`(新)、`journey.jsx`、`index.html`、`SPEC.md`(§14 + 调试参数)、`CHANGELOG.md`。

## 2026-07-14

### 94. 数据页·游戏 tab 重构 —— 概览→单游戏下钻 + 已下线历史留存 + 玩次含活动内
- **需求根因**：原游戏 tab 只展示"当前 live 游戏"的单聚合数据，游戏一下线（回 draft）历史即消失；且无法按单游戏维度看。根因 = 数据挂"live 瞬时态"而非"游戏对象生命周期"。（三体 REDUCTIVE，一根杠杆=数据留存与游戏状态解耦。）
- **方案**：
  - **数据模型**（`data.jsx` `GAME_METRICS`）：由单聚合改为 `{ plays,players,avgPlaySec,dailyAvg,spark, games:[] }`；`games[]` 每项含 `status(live|offline)/liveMeta/plays/players/avgPlaySec/trend/ended/small`。`status:"offline"` = 展示态"曾上线现已下线"，**非游戏状态机态**（游戏仍只有 draft/live）。
  - **⭐ 玩次含活动内游玩**：跟游戏对象走 = 独立上线 + 活动内被玩之和。与 Activities 漏斗「扫码玩」有意重叠（参与度 vs 转化）。文案改「包含在活动里玩的 / including plays inside activities」，删旧「纯玩，不送奖品」。
  - **两层 UI**（`journey.jsx` `ReportsView` 的 `gameBody`/`gameDetail`）：概览(总数 hero + 玩家/时长 单行 KPI 卡 + 各游戏横向对比条形图〔含已下线、可点、玩次/玩家/时长切换〕，砍掉重复的合并每日图) → 点条进单游戏详情。`games.length===1` 跳过概览直接详情；≥2 有「‹ 所有游戏」返回。
  - **已下线详情**：灰存档 hero + "在线期间"口径 + 黄提示条 + 每日柱只画在线段 + 结束竖虚线 + 隐藏日期 pill。**小样本**降级 sparkline + 提示。
  - **空态判据** `hasLiveGame`→`hasEverLive`（曾上线有数据即走概览，全下线也不空）。
  - **字体（设计评审）**：hero 900→800、KPI 数字 50/900→36/700、单位 `.rh-unit` 缩小变灰、全站数字 `tabular-nums`（Plus Jakarta 900 是营销字重、放大发闷）。
- **影响文件**：`data.jsx`（GAME_METRICS）、`journey.jsx`（gameBody/gameDetail + gsel/gmetric state）、`index.html`（`.panel.gstat`/`.cbar`/`.metricseg`/`.rep-hero.archived`/`.endline`/`.rep-back`/`.gd-head`/`.gnote` 等 CSS）。
- **研发**：GAME_METRICS 需接真实服务，按游戏对象累计玩次(含活动内)、下线不删历史；`everLive` 标记 + 单游戏时间序列(在线期间)。调试参数 `&tab=game&g=<id>`。SPEC §4.8 已更新。

### 93. 注册登录合一 v3 —— 按 IP 分区登录 + 验证即建号 + 恭喜补资料 + 账号选择页
- **需求根因**：多入口身份分裂——注册海外填邮箱/国内填手机、登录又可 Google/Apple SSO，每种凭证各建号、无人归并 → 同一人多个互不关联账号。（三体：REDUCTIVE，根因=缺规范身份主键 + verify 后账号解析。）
- **方案（前后端联合，采纳前端 V2「零表单」骨架 + Joyce 决策）**：
  - **删注册表单，验证即建号**：唯一入口，身份验证通过即登录态（老=登录 / 新=后端静默建号，默认资料：店名派生 / 国家按 IP / 手机可空）。旧的 4 栏注册页（店名/国家/邮箱码/手机）作废。
  - **按 IP 分区展示登录**：海外 IP = 邮箱 OTP + Google/Apple SSO；国内 IP = 手机号 +86（Google/Apple 国内不可用，逻辑自洽）。**SSO 保留**，分裂靠**后端身份归并**（email/kix_user_id 归到同一账号）防——⚠️ 归并覆盖自动建号场景是后端硬验收项（前端方案 §9 待确认）。
  - **恭喜 + 可跳过补资料 = 主页上的遮罩弹窗（非独立整页，2026-07-14 Joyce 定）**：新用户绑卡后**先进主页**，主页压半透明遮罩、上浮「欢迎加入 KiX」弹窗 + 店名(预填)/WhatsApp(选填)/国家(预填)，「保存并进入」或「稍后再说」或点遮罩关闭。强化"已经进来了、这只是可跳过小步骤"，不做硬闸门（守 canon 注册后置 / 加法伤留存）。
  - **verify 后账号解析**：membership 0→匿名进 / 1→直接进 / ≥2→账号选择页（大卡+地址区分同名店+角色+记住上次+新建入口）。对齐 §13 + `PRD-team-seats.md`。
  - 绑卡步（Stripe /register/card 语义）**不动**。
- **设计评审已过（设计评审官 web 媒介）**：修了①验证步标题按目标命名「最后一步：验证身份就能上线」+ 删冗余「已有账号登录」链；②禁用按钮从假激活改明显置灰；③SSO 等权描边（邮箱主按钮唯一焦点）；④去 📍 emoji；⑤退出控件统一右上。恭喜页 🎉 换成品牌绿成功徽章 SVG（去 AI 味）。
- **原型改动**：`journey.jsx` 新增 `AuthEntry`（IP 分区 + SSO + OTP，可传 title）/`Welcome`/`AccountPicker`，重写 `Login`（用 AuthEntry）与 `Register`（auth→card→welcome，删旧 4 栏表单）；App 加 `choose` 屏 + loginDone 按 `?accounts=multi` 分流。`index.html` 加 auth v3 样式（sso/divider/region-note/welcome-badge/acct-*）+ 禁用态置灰。
- **调试参数**：`?screen=login`（海外）·`&region=cn`（国内）·`?screen=register`(验证→绑卡)·`&rstep=card`·`?welcome=1`（主页遮罩恭喜弹窗，配 `&fresh=1` 空态更真）·`?screen=choose`（账号选择）·`&accounts=multi`（登录后进选择页）·`&need=<店名>`（恭喜预填）。登录卡底部 `demo·切换视图` 翻两种 IP 视图。
- **原型为 mock**：验证即建号 / is_new_account / **后端身份归并** 是后端行为，原型只演示前端形态；真效果需前端 TS portal（`src/pages/auth/*`，不在本机）+ 后端联合上。
- **影响文件**：`journey.jsx`、`index.html`、`SPEC.md`（§0/§3.1/§4.3/§11）、`README.md`（调试参数）、`CHANGELOG.md`、`PRD-auth-unify.md`（新增·研发版 PRD）。

---

## 2026-07-13

### 92. 多账号团队席位（Team Seats）——「我的」新增团队面板 + 邀请弹窗
- **需求**：不同的人（合伙人/夫妻档/店长/记账）都想登录同一后台、**共同看到全部数据、能一起干活**。现状账号被单一登录凭证（国内手机号/海外邮箱）唯一标识，第二个人进不去。
- **角色 2 个**：`Owner`（全部 + 账单 + 增删成员）/ `Member`（看全部数据 + 能操作 + 能上线花钱，仅不碰账单和成员管理）。**不做"只核销受限角色"（无需求证据）**；席位免费不限数。
- **身份模型（给研发的契约）**：`User(login_type=email|phone, region)` + `Membership(role=owner|member)` + `InviteToken`；Account 去掉直接挂登录凭证；登录 verify 后按 membership 数量决定 新号/直接进/账号选择页；渠道按区域（国内短信码 / 海外邮件码 + SSO）。详见 `SPEC.md §13` + `PRD-team-seats.md`。
- **点击即加入，无老板审批、无"待加入"状态**：邀请是匿名可分享链接，平台不知道受邀人凭证 → 成员列表只显示已加入成员；`Membership.status` 只有 `active|removed`；安全边界靠链接本身（7 天失效 + 可撤销 + 可一次性）。
- **原型改动**：`journey.jsx` 新增 `InviteModal`（QR + 复制链接 + 区域验证码说明 + 重新生成）；`MeView` 新增团队面板（members 列表 + 移除 + 「+ 邀请成员」，Owner 行不可移除）；账户菜单加「团队管理」入口。`icons.jsx` 加 `users` 图标。`index.html` 加 `.team-*` / `.invite-*` CSS。调试参数 `?screen=app&sec=me&invite=1`。
- **原型为 mock**（成员写死、token 随机）；身份模型/鉴权/账号选择页是给研发的契约，原型未演示。
- **影响文件**：`journey.jsx`、`icons.jsx`、`index.html`、`SPEC.md`（§13）、`PRD-team-seats.md`（新增）。

### 91. 英文文案校对（去破折号后遗留 + 术语一致）
- 全站审 696 条 EN，修 10 处：去破折号后的 comma splice 改分号/重组（`run indefinitely; take it offline anytime` 等 3 处）；游戏结果漏网 `—`（`So close, try again!` 2 处）；拼写统一美式（`auto-colours`→`auto-colors`）；地道化（`scanning paused`、`Now live. Customers can play.`、`Got a question…`、Oxford comma）。
- 术语一致性确认无误：walk-in(名)/walk in(动)、redeem、voucher、outlet、active player、verified walk-ins、KiX app、Since launch。tr() 内破折号中英均已归零。仅改 EN，ZH/代码未动。
- **影响文件**：`journey.jsx`（多处 tr() 的 EN）。

### 90. 数据页(Reports)日期范围改「上线以来」+ 稀疏/小样本规则（三体）
- **日期范围**：预设改为 **上线以来(默认) / 今天 / 近 7 天 / 近 30 天**；活动看板以"活动上线"为锚点累计（Mailchimp/Klaviyo/HubSpot 惯例），默认「上线以来」、**不设 All-time/全部**。（`ranges` + `ri` 默认 0）
- **稀疏 / 小样本规则（精确阈值，可调）**：① 逐日到店柱状图仅当 `nonZeroDays ≥ 7` 才画柱，否则换 mini sparkline + 提示「到店还太少，暂时画不出每日趋势」；② `smallSample = 本期 walk-ins < 10`（"多小叫小"=<10）→ Hero 隐藏"vs 上期"百分比、只显绝对数；各门店到店比例条收掉、只留「门店名 + N 人到店」；③ 范围=「上线以来」(lifetime 无上期) 也不显百分比。
- **数据源**：新增 `SPARSE_METRICS`（`?sparse=1` 冷启动演示：1 到店 / 27 玩）。
- 三体调研见 `Desktop/Mozat/kix/[决策] 2026-07-13-KiX数据页日期范围与稀疏数据-三体.md`。
- **影响文件**：`journey.jsx`（ReportsView：ranges/ri/smallSample/nonZeroDays/showTrendBars + Hero delta 条件 + 每日到店条件 + OutletPanel smallSample 参数）、`data.jsx`（SPARSE_METRICS + 导出）、`SPEC.md`（§4.8 精确规则）。

### 89. app 文案母语化去破折号 + 注册邮箱验证码 + 数据页收敛 + 游戏/活动页多选删除
- **app 段文案（journey.jsx 536+）**：59 条含破折号的 tr() 去破折号 + 中文母语化（注册/登录/建游戏/发布/看板/活动/兑奖/数据/我的）；用户可见破折号归零（仅剩代码注释）。
- **注册账号步新增邮箱 + 邮箱验证码**：邮箱字段 +「发送验证码」→ 6 位码（60s 重发倒计时 + 已验证 ✓），验证通过前「继续」不可点。原型 mock（满 6 位即过）；研发接真实 OTP。本地原注册无邮箱字段，此处补齐（`Register` 组件，state：email/code/sent/left + emailOk/verified/sendCode + acctOk 加 verified）。
- **数据页（Reports）收敛**：删 4 条冗余副标题（VERIFIED WALK-INS / From scan to walk-in / New vs returning / Walk-ins per day）；Games tab「完成率 68%」→「玩的时长 / 平均每局玩多久 / 38s」（`GAME_METRICS.avgPlaySec`）；Games hero 副标题删「不收到店费（免费）」句。三体调研结论：两 tab IA（参与度 Games / 转化 Activities）分层已对，ROI 成本因「免费期不展示预估总价」铁律未加。见 `Desktop/Mozat/kix/[决策] 2026-07-13-KiX数据页IA与指标-三体.md`。
- **游戏页 + 活动页 多选删除（业界标准式）**：新增「选择」→ 选择态顶部**上下文操作栏**（取消 / 已选 N / 全选 / 红色删除 N），卡片选中 = 绿框 + 右上角 ✓、卡内操作隐藏；`window.confirm` 二次确认后删除。对齐 Gmail/Drive/Photos 范式（初版做成飘在中间的浮层，Joyce 指出不合业界标准后改为顶部上下文栏）。父组件 `setMyGames/setActivities` 过滤。
- **影响文件**：`journey.jsx`（Register / MyGamesView / ActivitiesView / ReportsView / 父组件 props / app tr()）、`index.html`（`.selbar/.selbar-n/.selbar-del`）、`data.jsx`（`GAME_METRICS.avgPlaySec`）。

### 88. 落地页中文母语化重写 + 全落地页去破折号
- 按「地道中文、不直译、不用破折号」重写落地页所有营销文案的中文，并去掉中英文里的破折号（—/——，改完整句/短句/冒号）：WhyGame（三卡 + sec-sub）、FairDeal（对比两栏 + sec-sub）、FAQ（5 问，含计费梯度段）、Gallery、Steps、ThreeThings（召回卡）、Pricing（成长/定制两卡）、CustomLeadModal、PPP（PAY/STAY）、底部 CTA。
- 定位口径对齐线上 portal = playground / play-pay-stay；旧「把路过的人变成回头客」作废（CLAUDE.md 仓库外配置，另行更新）。
- **影响文件**：`journey.jsx`（Hero 之后各 landing section 的 tr() 中文 + 去破折号）。
- ⚠️ **进行中（wave 2）**：app 内（建游戏/发布/登录/看板/核销等）约 480 条 tr() 的中文母语化 + 去破折号尚未处理。

### 87. 落地页「客户旅程」区块重做（图 + 文案 + 品牌统一）+ hero 精简 + 奖池奖品类型改名
- **五步流程区块（Walkthrough）标题/小字**：段标题 `See the game your customer plays` → **`Turn your business into a playground`**（把 playground 定位从 hero eyebrow 挪来做段标题）；小字重写为 `With your own branded game, customers play, pay and stay.` / `你自己的品牌小游戏，让客人来玩、消费、留下来。`（强调"你自己的品牌游戏"、不强调时长、无破折号）。
- **每屏大标题重写**（去掉重复的 "They" 前缀，改第三人称动词打头）：Spots your poster / Scans, no app / Plays YOUR game / Wins a voucher / Redeems & returns；**删掉每屏下方小字**（sub 整行移除 + 数据里的 sub 字段清理）。
- **四张手机图统一到 Pocket Coffee / Cheerful Goat**（原为一芳，品牌不一致）：`walkthrough/poster.png`（Today's Offer 海报）、`play.png`（Spin for Pocket Coffee 转盘）、`win.png`（You earned it 中奖券）、`redeem.png`（Redeemed 屏 + what's next 复访奖励）。
- **Hero 精简**：删 eyebrow「TURN YOUR BUSINESS INTO A PLAYGROUND」；删右侧场景下与本区块重复的 flow-cap「plays → wins → walks in → becomes a regular」；删「No hardware」chip（hero chips 剩 3）。
- **PLAY/PAY/STAY 三卡文案去破折号**（改完整句/逗号）。
- **奖池奖品类型改名**：`Menu item / 菜单商品` → **`Free item / 免费商品`**（与"现金券/折扣券"对仗、更直观）；输入占位 `Menu item name / 菜单商品名` → `Item name / 商品名称`。
- **影响文件**：`journey.jsx`（HeroSection / Walkthrough 的 S 数组 + 段标题 + PPP 卡 / PRIZE_TYPES / 奖池占位符）、`walkthrough/{poster,play,win,redeem}.png`。
- ⚠️ **未尽**：全站仍有约 89 处破折号待清（本次只清了 walkthrough + PPP 区块）；CLAUDE.md 定位口径待更新为 portal（playground / play-pay-stay）。

## 2026-07-10

### 86. 后台「联系我们」面板 + 全站 WhatsApp 入口先走邮箱
- **「我的」页新增「联系我们」面板**（KiX App 面板下方）：说明 + 「发邮件」+「连锁 / 定制 · 联系销售」（均 mailto），支持入口归在设置枢纽、不进侧栏、不镜像到头像菜单（守单一入口）。
- **全站 WhatsApp 入口统一先走邮箱**（WhatsApp 未就绪）：`CustomLeadModal` 底部「Prefer now? Chat on WhatsApp」+ 提交成功态「Chat on WhatsApp now」→ 均改 `MAIL_LINK`（mailto）；「我的」联系面板去掉 WhatsApp 按钮。**留资输入项「电话/WhatsApp」与授权条款文案保留**（非即时入口）。`WA_LINK` 常量留作 WhatsApp 就绪后的占位。
- **影响文件**：`journey.jsx`（MeView 联系面板；CustomLeadModal 两处链接；MAIL_LINK 常量）、`index.html`（`.contact-row`）。

### 85. 定价卡文案定稿 + CHAINS「Talk to us」线索表单弹窗（三体 2026-07-10）
- **定价卡文案（按 §4.0 + Joyce 定稿）**：左「成长计划」4 要点 = Unlimited custom games & dashboard · **S$29/mo minimum · never for your regulars** · Software always free — only pay for growth · No lock-in · cancel anytime。右卡由「GROW FASTER / Custom（连锁专属）」**重定位为「CUSTOM / Need something custom?」**——**不锁连锁、任何规模**（副标 Any size — if the plan doesn't fit, we'll build it with you；要点 = 定制游戏与品牌 · API/POS · 多门店统一上线 · 排他与量价；bullet 由图标改绿勾）。
- **新增 `CustomLeadModal`（journey.jsx）**：右卡「Talk to us」→ `ReactDOM.createPortal` 弹线索表单（复用 `.pub-scrim/.pub-modal/.pub-x`）。**5 必填**（姓名 / 品牌名 / 电话·WhatsApp / 邮箱 / 「你需要什么」下拉）+ 选填留言 + PDPA 同意勾选；缺项校验报错。**提交后感谢态** = 「1 个工作日内联系」+ **WhatsApp 即时出口**（三体结论：提交后即时接触 > 表单机制，WhatsApp = SG 版 book-a-call-now）。调试参数 `?lead=1`。
- **CSS**：index.html 新增 `.lead-modal/.lead-f/.lead-consent/.lead-err/.lead-wa/.lead-back`。
- ⚠️ **研发待接**：① `WA_LINK` 现为占位 `wa.me/6580000000` → 换真实 WhatsApp 号；② `CustomLeadModal.submit()` 现前端 mock（只切感谢态）→ 需 POST 线索到后端 + 通知 BD（字段 name/biz/phone/email/need/msg/consent + 来源）。
- 三体依据：`Desktop/Mozat/kix/[策略] 2026-07-10-KiX连锁线索表单-三体调研.md`。

### 84. 建游戏流程 UI 重做（按 Joyce 设计稿）+ 定价卡二次重排 + 全平台去 12%
- **Step 3「我的游戏」(Preview) 重做**：套 Results 的真机边框 + 品牌栏 + 可试玩；右侧品牌面板 = **AI 输入**（配色/Logo/网址改动不即时），点「✨ 用我的品牌生成」跑 AI loading（读取→提取→重绘）才应用；**「上线」始终不被生成阻塞**（绿实心主 CTA）。标题「换成你的品牌，随时可上线」。
- **Step 1「描述」按设计稿复活（条件入口）**：`今天想做什么游戏？` + 搜索框 + **店型 chips 网格（emoji 图标，12 类）** + 「匹配游戏」。**落地页 hero 输入了店名 → 直接进 Step2（跳过描述、自动打勾）；没输入 → 先进 Step1**（`startBuild`：`nm ? "building" : "describe"`）。stepper 标签改 **描述/选游戏/我的游戏**，顶栏加「Step N of 3」。
- **落地页定价卡按设计稿重排（2 卡）**：左「GROW WITH KIX / 成长计划」= Free for 3 months / or first 1,000 players / Then just S$0.49 per active player — cheaper the more you grow / 3 要点(Unlimited custom games & dashboard · S$29/mo minimum · cancel anytime · Free software · no setup fee) / Start free；右「GROW FASTER / Custom」= 专属成功经理·API/POS·量价排他·优先支持SLA / Talk to us。去掉 for-you 徽章、底部页脚 strip。
- **全平台去「12%」对外概念**：落地页卡、FAQ、PlanModal、账单 note 均不再显示 12%（FAQ 保留"远低于团购三到五成"的竞争点、不带数字）；`S$29/mo minimum` 作为要点保留。
- **PlanModal / 账单 清理**：套餐去 freemium 分层保留（成长计划[当前] + 加速增长/定制）；成长计划去掉冗余价格串「现在免费·之后按增长付费」（弹窗副标题已说）；账单行只留「成长计划」。
- **影响文件**：`journey.jsx`（Describe / Preview / Pricing / Faq / PLANS / PlanModal / MeView 账单 / startBuild / STEPS / topbar）、`index.html`（`.desc-search`/`.cate-grid`/`.cate-chip`/`.tier-*`/`.tag-pill`/`.feat-list`/`.gp2-editcard`/`.gp2-genbtn` 等）。设计稿依据见 `Desktop/Mozat/kix/[策略] 2026-07-10-KiX付费模型完整总结`。

## 2026-07-09

### 83. 定价全平台重构（老板方案 · 多轮真人走查 + bible 映射 + 去 $29 强调）
**背景**：老板定 bible §4.0 方案（免费窗口 → 按活跃玩家计费 + 可选广告 + 连锁定制），本轮只优化**表达**、机制不变。产出研究/映射文档见 `Desktop/Mozat/kix/`（SaaS定价套餐分类-三体调研 / 定价bible事实→网站呈现映射 / 定价页用户反馈-真人走查）。
- **落地页 Pricing 重构（三体：用量制不摆并列档）**：从老板原稿 3 等高并列卡 → **2 卡 + 免费→付费时间线**。主卡「按活跃玩家」：时间线 **现在 S$0（绿高亮）→ 之后 S$0.49/活跃玩家** + 小字「免费到 3 个月或首 1,000 位玩家（先到为准）」+ 「Best choice」推荐徽章 + 4 条按**用户好处**排序（① 免费定制品牌专属游戏·随时取消 ② 老客永远免费·只算新生意 ③ 越多越便宜·封顶12% ④ 多店合并一张账单）。可选卡「想更快拉新?」：你来定价 + 广告新客留下前不收费 / 连锁·加盟定制 / 对接 POS·会员·专属支持。每条信息只说一次（删徽章/标题/要点的重复）。
- **不强调 $29**：全平台 UI 撤下 S$29 月度地板价（落地页/FAQ/登录副标题/主页成本条/PLANS/绑卡/换卡），改「按增长付费 / 玩的人越多越便宜」。floor 仅在 FAQ 作软性披露「另有很低的月度最低消费」（防 bill-shock、不强调数字）。
- **FAQ「到底怎么收费」= JSX 梯度表**：per-active-player 边际累进（首1k $0.49 / 1k–5k $0.39 / 5k–20k $0.29 / 20k+ 低至 $0.12）+「按档累进（像个税）」注 + 12%封顶（vs 团购三到五成）+ 老客免费 + 活跃玩家定义（当月真正玩过你游戏的人）。
- **PlanModal / 套餐选择去「永久免费」分层**（bible 无 freemium）：只剩 **标准版[当前]**（现在免费·之后按增长付费；免费定制品牌游戏·越多越便宜封顶12%·老客免费）+ **连锁版**（联系我们；多门店合并账单·定制游戏·对接POS/会员·专属支持）。标题「我的套餐」。
- **影响文件**：`journey.jsx`（Pricing / Faq / Register login-sub / HomeView 成本条 / PLANS / PlanModal / CardModal）、`index.html`（`.tiers-2` gap / `.ptimeline`·`.pt-step`·`.pt-sub` / `.faq-tiers`）。

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
