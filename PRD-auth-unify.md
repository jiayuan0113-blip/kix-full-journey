# [PRD] KiX 商家端 · 注册登录合一 v3

> 🤖 AI 助手生成 · 待 Joyce 审阅
> 日期：2026-07-14　媒介：网页 Web（桌面 React SPA `partner.letskix.com`）
> 交付对象：前端团队真实 TS portal（`src/pages/auth/*`、`src/stores/auth.ts`、`src/api/modules/auth.ts`）+ 后端
> 关联：前端方案《登录注册流程统一改造方案-2026-07-14 V2》、`[决策] 2026-07-14-KiX商家端注册登录合一-三体`、`[PRD] 2026-07-13-商家端-多账号团队席位`、原型 `kix-full-journey`（已实现 push，commit `38a27f0`）

---

## 1. 执行摘要

我们为 KiX 商家（东南亚为主的 F&B 小店主 + 少量国内运营）重做注册登录，把"验证凭证"和"账号"解耦：**唯一入口 `/login`，按 IP 分区展示（海外邮箱 OTP + Google/Apple SSO；国内手机 OTP），身份验证通过即登录态——老用户登录、新用户后端静默建号，没有注册表单**。分裂由**后端身份归并**（email / kix_user_id 归一账号）根治，SSO 保留。新用户绑卡后落到主页、主页上叠加「恭喜 + 可跳过补资料」遮罩弹窗。目标：消灭"同一人多个互不关联账号"，同时把注册流失点（4 栏表单）从进入产品前彻底移除。

## 2. 问题陈述

### 谁有这个问题
所有 KiX 商家：注册海外填邮箱、国内填手机+验证码；登录又可直接 Google/Apple SSO。

### 问题是什么
每种凭证各自 mint 一条账号记录，中间**缺一层把它们归并到同一个人**。→ 同一自然人可能有多个互不关联的账号（邮箱账号 / 手机账号 / Google 账号 / Apple 账号）。

### 为什么痛（机制层，非"体验不好"）
- **认证 ≠ 身份**：系统把 authenticator（邮箱/手机/SSO token）当成 account 主键。（NIST SP 800-63B：identity 与 authenticator 应分离。）
- **Apple Sign In + Private Relay**：Apple 每个 app 发一个中继邮箱 `xxx@privaterelay.appleid.com`，拿到的 email 必然≠用户真实邮箱 → Apple SSO 结构性分裂（置信度高）。
- **旧注册表单**（店名/国家/邮箱码/手机 4 栏）挡在"进入产品"之前，而这些字段没有一个是进入 portal 的硬前提 → 最大流失点。

### 证据
- 前端方案 §1 现状问题表 P1–P7（双入口互跳、二次验证码、OAuth displayName 丢弃、游客漏斗绕过统一认证、注册成功缺 refresh_token 等）。
- 代码事实：游客漏斗 describe 步已有店名（`draft.need`，`Results.tsx:146`/`Preview.tsx:95` 渲染店招）；国家 IP 自动预选（`Register.tsx detectCountry`）；portal 内已有 `/app/me` 补资料落点。

## 3. 目标用户与画像

| 画像 | 场景 / 熟练度 | 本需求关注 |
|---|---|---|
| **Marcus 41，新加坡咖啡馆老板** | 英文 / iPhone / 习惯 SSO 一键 | 海外邮箱 + SSO 路径顺不顺 |
| **阿珍 34，国内店主/运营** | 中文 / 安卓 / 手机号即身份 | 国内手机 OTP 路径、区号非 +65 |
| **May aunty 52，连锁 3 店店长** | 技术弱 / 老花 / membership≥2 | 账号选择页能不能看懂、别选错店 |
| **Kevin 38，老 SSO 用户** | 半年前 Google/Apple 注册（Apple 中继邮箱） | 砍/迁移后还进不进得去、丢不丢数据 |

## 4. 战略背景

- **北极星不变**：verified walk-in（真实到店）。本需求是其上游——账号可靠、注册不流失，后续激活/计费才成立。
- **canon 约束**：登录=注册同一动作 / 注册后置到发布闸门 / 按 canonical 主键去重 / 加法伤留存 / 单一焦点 / 不碰发布闸门收卡（Stripe）。
- **为什么现在**：账号分裂已实际发生在线上部署版；且前端团队已出联合改造方案（V2 零表单），窗口成熟、可一次性彻底改造。
- **业界对标**：Shopify ID（单主键 + SSO 挂靠）/ Grab·Gojek·美团（手机号单主键 OTP）/ Stripe（email 主键 + SSO 绑定）/ Notion·Vercel（continue = create account）。

## 5. 方案总览

### 5.1 目标态流程（4 条路径）

```
唯一入口 /login（按 IP 分区展示）
   ├─ 海外 IP：邮箱输入 + [继续] / Google / Apple
   └─ 国内 IP：手机号 +区号 + [发送验证码]
        ↓ 一次身份验证（OTP 或 SSO）
   后端按 canonical 身份归并查账号
        ├─ 已注册 → 直接登录（返回双 token）
        └─ 未注册 → 静默建号（默认资料）→ is_new_account=true
        ↓ 未绑卡且非豁免 → /register/card 绑卡（Stripe，不动）
        ↓ 进入 portal，按 membership 分流：
              0/1 商家 → 直接进主页；≥2 → 账号选择页
        ↓ 若 is_new_account → 主页上叠加「恭喜 + 可跳过补资料」遮罩弹窗
```

- **路径 A 老用户**（邮箱/Google/Apple/手机）：/login → 双 token →（未绑卡先绑卡）→ 后台。无感变化。
- **路径 B 新用户**：/login → 静默建号 →（绑卡）→ 主页 + 恭喜补资料遮罩。全程只做了"验证身份"一件事。
- **路径 C 游客发布漏斗**：Build Preview 点「上线」→ /login → A 或 B → 认领游戏（`claimPendingOnboardingOrder`）+ 新号品牌名 = 漏斗描述（`business_name_hint`）。
- **路径 D 免绑卡豁免链接**：`/login?card_exemption_code=<code>`（旧 `/register?...` 永久重定向兼容），仅自动建号时消费码。

### 5.2 页面清单

| # | 页面 / 组件 | 路由 | 原型对应 | 说明 |
|---|---|---|---|---|
| P1 | 登录（海外视图） | `/login` | `AuthEntry`(intl) | 邮箱 + Google/Apple SSO |
| P2 | 登录（国内视图） | `/login` | `AuthEntry`(cn) | 手机号 + 区号；IP 判定 |
| P3 | 验证码 OTP | `/login`（同页 step） | `AuthEntry` otp step | 手机/邮箱同一套 6 位码 |
| P4 | 绑卡 | `/register/card` | `Register` card step | **不改**，仅前置流程改动 |
| P5 | 恭喜 + 补资料（遮罩弹窗） | 叠加于 `/app/home` | `Welcome` | 仅 `is_new_account` 首次 |
| P6 | 账号选择页 | `/choose`（或 `/app` 前置态） | `AccountPicker` | 仅 membership≥2 |
| — | 兼容重定向 | `/register` → `/login` | — | 捕获豁免码后重定向 |

## 6. 成功指标

- **主指标**：孤儿账号率（同一自然人多账号占比）→ 目标趋近 0（后端按 canonical 主键去重后统计）。
- **次指标**：
  - 注册→进入产品 转化率（删表单后应↑，对标 opt-out 收卡 free→paid ~3–5× 的同类摩擦下降）。
  - `is_new_account` 新号首次会话完成"补资料引导条/弹窗"曝光→完成率（衡量后补资料实际完成率）。
  - 二次验证码发生率 → 0（P2 问题消除）。
- **护栏指标**：登录/发码成功率不下降；SMS/邮件发送量不异常上涨（防 pumping）；老用户登录 401 静默续期成功率（双 token 修复 P6）。

## 7. 用户故事与需求（含边界态）

> 交互统一约定：主按钮**禁用态=明显置灰 + `cursor:not-allowed`**（不做实心浅绿假激活）；发码类操作**成功后进入 OTP 步**；所有文案精简好懂、EN 不用破折号。

### Epic 假设
> 我们相信：把认证与账号解耦（唯一入口 + IP 分区验证 + 后端身份归并 + 验证即建号），能让同一自然人只有一个账号、并移除注册表单流失点。度量 = 孤儿账号率趋 0 + 注册→进入产品转化率上升。

---

### Story 1 · 登录页按 IP 分区展示（P1/P2）
**As** 商家，**I want** 打开 /login 看到适合我所在地区的登录方式，**so that** 我能用最顺手、也可达的渠道进入。

**触发**：访问 `/login`（含从落地页导航「登录」、游客漏斗「上线」跳转）。
**逻辑**：后端/前端按请求 IP geo 判定 region。
- 海外 → **P1**：标题「登录或注册 KiX」；副文案「输入邮箱，第一次来会自动建账号。」；邮箱输入 + [继续]；分隔线「或」；[用 Google 继续]、[用 Apple 继续]（**等权描边**，唯一实心主按钮 = 继续）；底部条款声明。
- 国内 → **P2**：同标题；副文案「输入手机号，第一次来会自动建账号。」；地区提示 pill「你在中国大陆，用手机号登录」；手机号 + **区号选择器**（默认 +86，可改）+ [发送验证码]；底部条款。**不展示 Google/Apple**（国内不可用）。

**验收标准**
- [ ] IP=海外 显示 P1（邮箱+SSO）；IP=中国大陆 显示 P2（手机号），且区号默认 +86。
- [ ] 区号**不硬编码**，可切换（覆盖 +65/+86 及其它目标区号）。
- [ ] 无「还没有账号？去注册」链接（已删，验证已合一）。
- [ ] 条款声明前移到本页（建号动作在此发生）。
- [ ] SSO 按钮等权描边，主按钮唯一实心。

**边界态**
- 空：输入为空 → 主按钮置灰禁用。
- 错误：邮箱格式非法/手机号过短 → 点击就地内联提示（不静默失败）。
- 极端：geo 判定失败 → 兜底展示海外视图（邮箱+SSO），并允许手动切换渠道入口（若产品接受）。
- VPN/出差导致 region 判错 → 用户可切区号（国内视图）或改用邮箱；渠道最终由用户所给凭证决定，不强锁 geo。

---

### Story 2 · 验证码 OTP（P3）
**As** 商家，**I want** 输一次验证码就进去，**so that** 不用记密码、不用二次验证。

**触发**：P1 点[继续]（邮箱合法）或 P2 点[发送验证码]（手机合法）。
**反馈**：进入 OTP 步；标题「输入验证码」；副文案「6 位验证码已发送至 <掩码后的邮箱/手机>」；6 位输入框；「N 秒后可重新发送」倒计时→到点变「重新发送」；「换一个」回上一步。
**验证成功即登录态**（见 Story 4 后端归并）。

**验收标准**
- [ ] 手机码支持 `autocomplete="one-time-code"` 自动填充；邮箱码需手动输入（正文含「复制验证码」）。
- [ ] OTP 屏是可刷新、保留身份的真实 URL（独立页），刷新不丢状态。
- [ ] 6 位齐 → 主按钮可点；不足 → 置灰。

**边界态**
- 加载：验证请求进行中 → 按钮 loading、防重复提交。
- 错误：码错误 → 内联「验证码不对，再试一次」；不跳走。
- 极端：码过期 → 提示并允许重新发送；重放/双击 → 后端幂等（见 Story 4）。

---

### Story 3 · SSO 一键（P1，仅海外）
**As** 海外商家，**I want** 用 Google/Apple 一键进，**so that** 更快。

**触发**：点[用 Google 继续]/[用 Apple 继续]。
**逻辑**：走 `third-party/login`；OAuth 的 `displayName`/`photoURL` 落库（displayName 用于派生店名/联系人，photoURL 落库不自动设 logo）。

**验收标准**
- [ ] Google 新用户建号后，退出再点 Google **登录同一账号**（不产生第二个号）。
- [ ] Apple（staging https）relay 邮箱正常建号；用户可在 /app/me 改联系邮箱（不影响登录身份）。
- [ ] 先邮箱建号 → 同邮箱 Google 登录 → **归并为同一账号**（见 Story 4 / 风险章）。

---

### Story 4 · 验证即建号 + 身份归并（后端核心）
**As** 系统，**I want** 验证通过即返回登录态、并把同一人的多凭证归并到一个账号，**so that** 不再分裂。

**逻辑**：`email/login` 与 `third-party/login` 的 `needs_registration` 分支**整体删除**；验证通过但未注册时，服务端同一事务内自动建 account + brand，返回登录态。
**默认资料策略**：`business_name` = `business_name_hint`（游客漏斗）→ OAuth displayName 派生 →邮箱前缀 →「My Shop」；`country` = IP geo（失败兜底 OTHER）；`email` = 认证身份自带（含 Apple relay，天然已验证）；`phone` = null（DB 放开非空、唯一改为"非空值唯一"）；`your_name` = displayName/邮箱前缀。

**验收标准**
- [ ] 老用户登录 `is_new_account=false`；新用户 `is_new_account=true` 且返回 `{access_token, refresh_token, brand_id, is_new_account, card_exempt}`。
- [ ] ⭐ **同一人 email/Google/Apple 归并到同一账号（覆盖自动建号场景）——后端硬验收项**（见风险章 R4）。
- [ ] 并发重复建号（双击/重放）→ 后端以身份唯一键幂等，第二个请求返回已建账号登录态。
- [ ] 注册成功写 **refresh_token**（修 P6，401 静默续期链路完整）。

---

### Story 5 · verify 后账号解析分流（P6）
**As** 名下有多商家/受邀团队席位的用户，**I want** 验证后选择进入哪个商家，**so that** 不会进错。

**逻辑**：verify 后按 user 的 active membership 数：0→匿名/新建、1→直接进、**≥2→账号选择页**。
**P6 账号选择页**：标题「选择要进入的商家」；副文案「你有多个商家，选一个进入。」；**等高大卡片**（logo/首字母头像 + 商家名 + 地址〔区分同名店〕+ 角色 pill〔店主/员工〕+ "上次进入"标记）；底部「＋ 创建新商家」。

**验收标准**
- [ ] membership≥2 才出此页；=1 直接进；=0 走新建/匿名。
- [ ] 卡片**等高**（`min-height`），信息含地址以区分同名店（如 May's Cafe · Bugis / · Jurong）。
- [ ] 记住上次进入的商家（高亮/置顶）。
- [ ] 语义 = 选"进哪个商家组织"（对齐 `PRD-team-seats` 的 Membership），非选门店。

**边界态**：加载 membership 列表 loading 骨架；某商家被移除后不再出现；角色决定进入后的权限（Owner/Member）。

---

### Story 6 · 恭喜 + 可跳过补资料（P5 遮罩弹窗）
**As** 新商家，**I want** 进主页时被恭喜一下、顺手补点资料（但能跳过），**so that** 我知道成功了、又不被表单挡住。

**触发**：`is_new_account` 用户绑卡后落到 `/app/home`，主页上叠加遮罩弹窗（`welcomeOpen`）。
**形态**：**不是独立整页**——用户已进主页（侧栏店名、主页内容在背后），主页压半透明遮罩 + 轻模糊，弹窗浮于中央。
**内容**：品牌绿成功徽章 SVG + 「欢迎加入 KiX！」+ 「账号建好了！花几秒完善商家信息。」+ 店名(漏斗预填，可改) / WhatsApp 手机号(选填，文案"方便我们工作人员联系你") / 国家地区(IP 预填) + [保存并进入] + [稍后再说，先逛逛]。

**验收标准**
- [ ] 仅 `is_new_account` 首次进入弹一次；老用户不弹；关闭后本会话不再弹。
- [ ] 三种关闭方式：保存并进入 / 稍后再说 / 点遮罩空白。
- [ ] **可跳过、非硬闸门**（跳过不影响任何功能进入）。
- [ ] 店名/国家预填正确来源（漏斗 `need` / IP）。

**边界态**：保存中 loading；保存失败 → 保留弹窗 + 错误提示，不吞数据；跳过 → 账号带派生店名长期存在、可后续在 /app/me 补（运营可按 phone 为空筛选召回）。

---

### Story 7 · 入口收敛与埋点
- [ ] 落地页/导航所有「注册」「免费开始」CTA 统一指向 `/login`（营销文案可留，路由统一）。
- [ ] 游客漏斗 `Preview` 点「上线」→ `/login`（不再 `/register`），并把 draft 店铺描述作为 `business_name_hint` 随登录提交（截断到后端上限）。
- [ ] 豁免码捕获 `captureCardExemptionCode()` 上移到 `main.tsx` 应用启动，任意落地 URL 均可捕获、清地址栏。
- [ ] 埋点：`diLogin` 加 `is_new_account` 维度（新老转化分开）；`diRegister` 系列废弃；新增「补资料弹窗 曝光/完成」事件（核心观测指标）。

## 8. 后端接口契约

**统一响应结构**（`email/login` 与 `third-party/login` 一致）
```json
{ "access_token":"<jwt>", "refresh_token":"<jwt>", "brand_id":12345,
  "is_new_account": true, "card_exempt": false }
```
**请求可选字段**（仅触发建号时消费，老用户登录忽略）
| 字段 | 说明 |
|---|---|
| `card_exemption_code` | 豁免码；无效返回 `403 invalid_card_exemption_code` 且**不建号**（fail-closed） |
| `business_name_hint` | 品牌名初值（游客漏斗传 draft 描述；后端做长度校验，非法回退派生） |
| `region` | 决定发码渠道（国内短信 / 海外邮件）；SSO 路径不需要 |

**端点**
- `POST /api/auth/start {login_id, region}` → 发码（返回是否已有账号，供前端决定后续）。
- `POST /api/auth/verify {login_id, code, card_exemption_code?, business_name_hint?}` → 上述统一响应。
- `POST /portal/auth/third-party/login {provider, id_token, card_exemption_code?, business_name_hint?}` → 同上 + displayName/photoURL 落库。
- `merchant-signup/start` → **进入废弃窗口**（兼容期旧前端可用，观察一个发版周期后下线）。

**DB**
- `users.phone` / 品牌联系手机：放开 NOT NULL；唯一索引改 partial unique（允许多个 NULL）。
- 排查依赖 phone 非空的下游（WhatsApp 通知、风控、报表导出）对 NULL 容错。

## 9. 上线顺序（部署依赖，非功能分期）

1. **DB 先行**：phone 可空 + 非空唯一索引（对现有数据无影响）。
2. **后端上线**：login 自动建号 + 新响应字段（旧前端收到新响应时 `needs_registration !== true` 走登录成功分支，行为正确；`merchant-signup/start` 保留）。
3. **前端全量**：删注册页、IP 分区、入口收敛、恭喜补资料弹窗、账号选择页。
4. **运营侧**：豁免链接模板更新为 `/login?card_exemption_code=`（旧链接永久兼容）。
5. 观察一个发版周期后，后端下线 `merchant-signup/start` 与注册场景邮箱验证码依赖。

## 10. 风险与专项（含 Stage 5 流程走查静默失败）

### R1 · 老 SSO 用户后台静默批量迁移（P0）— Joyce 定「后台静默迁移」
- **风险**：Kevin 用 Apple/Google 注册过；直接改造后用真实邮箱登录 → 归并不上 → 当新人建号 → 原游戏/活动/门店静默消失。
- **处理**：后端**静默批量迁移**——Google / 邮箱可见的 Apple 账号按 email 映射到 canonical 主键；用户下次用邮箱码/SSO 登录即命中原账号。
- **残余盲区（已知取舍）**：Apple 中继邮箱账号库里只有 `xxx@privaterelay.appleid.com`，用户填真实邮箱匹配不上。缓解：后端向中继地址发迁移邮件（Apple 转发到本人真实邮箱）引导补绑手机/邮箱；忽略者 → 客服「用 Apple 找回账号」兜底（小群体，可接受）。
- **验收**：迁移后老 SSO 用户 100% 能找回原账号（除忽略迁移邮件的中继邮箱极少数，走客服）。

### R2 · Apple 中继邮箱（Hide My Email）
- relay 邮箱视为已验证邮箱正常建号；用户可在 /app/me 换联系邮箱（不影响登录身份）。归并以 Apple `sub`(tp_user_id) 为准，不以 relay email 为主键。

### R3 · SMS pumping / 发码成本
- 验证即建号把建号成本降到一次 OTP，需防滥用：发码限频（email/phone + IP）；**自动建号增加 IP 维度限频**（同 IP 每小时 N 个新号）；发码入口挂 Turnstile + 同号冷却 + 每日上限；邮件码同样限流。新号默认无卡无豁免、上线活动仍被绑卡闸门拦，滥用价值有限。

### R4 · ⭐ 身份归并覆盖自动建号场景（后端硬验收项）
- **这是整套方案成败关键**：SSO 保留、分裂靠归并防；若后端归并仅按 tp_user_id、不覆盖 email 归并/自动建号场景 → **仍会分裂**，等于没修根因。
- **必须后端确认并硬验收**：邮箱建号 → 同邮箱 Google 登录 → 归并同一账号（不产生第二个号）。若现状仅 tp_user_id 匹配，需补 email 归并逻辑或明确接受双账号（后者不可接受，等于本 PRD 失败）。

### R5 · 海外邮箱码摩擦（已知取舍）
- iOS 邮件码不能 autofill，海外用户需切邮箱复制，比 SSO 慢。Joyce 定**只用 6 位码、不做 magic link**；靠邮件正文大号码 + 「复制验证码」+ portal 单框可粘贴自动分格缓解。

## 11. Out of Scope（本期不做）
- **magic link**（海外邮箱免复制）——已定不做，取简单。
- **深色模式**——后台纯浅色单主题，auth 流不单独加（避免孤儿页）。
- **绑卡步"稍后绑卡"软出口**——碰计费 canon（收卡放注册最后一步、card-on-file 自动转付），需 Joyce 在计费层单独决策，本期不动。
- **登录页地区手动切换器**（生产）——原型的 `demo·切换视图` 仅调试脚手架，不进生产。
- OAuth 头像自动设为 brand logo——本期只落库，/app/me 后续可提示"使用 Google 头像"。

## 12. Open Questions
1. 手机号后补的硬拦截点放哪：完全不拦 / 首次活动上线前必填 / 仅软提醒？（建议：先只软提醒，观察补资料完成率；若 WhatsApp 触达是运营硬需求，再在"首次上线活动"处加拦截——该处本有绑卡闸门，顺路。）
2. 派生品牌名文案规则（"Alice's Shop" vs 邮箱前缀 vs "My Shop"）——后端定一版即可，补资料弹窗会推动用户改。
3. 归并逻辑现状是否已覆盖自动建号（见 R4）——**阻塞级，需后端先答**。
4. 审核后台 `review-admin.html` 与去审批直接上线逻辑不一致（既有遗留），本 PRD 不涉及，另议。

---
**验收总纲**：孤儿账号率趋 0（R4 达成）｜4 画像端到端各自走通、无静默丢账号/收不到码/选错店｜老 SSO 用户可找回原账号｜注册→进入产品无表单阻断。
