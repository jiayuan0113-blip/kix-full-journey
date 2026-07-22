# 04 · 研发 PRD — 收卡时机 v2（两道门 · 任何上线绑卡）

> 2026-07-21 · 设计流水线 Stage 8 · 状态：方向锁死，代码待 Joyce 批准后改。
> 决策源：`Desktop/Mozat/kix/[决策] 2026-07-20-KiX注册收卡时机-三体.md`（含 07-21 修正 + linchpin）。

## 1. 模型（一句话）
**真分界线＝"给自己用 vs 给客人玩"。** 账号门（进后台，只 OTP、不收卡）与卡门（任何上线＝游戏 or 活动，客人能扫码玩＝产生 MAU，首次绑卡、前 3 月免费）解耦。卡 ⟺ "真实客人现在能玩到了"。**纯游戏玩家算计费 MAU（Joyce 2026-07-21 拍）。**

## 2. 端到端流程（点「上线」触发）
```
点「上线」(游戏 or 活动)
 ├─ 未登录 → ① 账号门 AuthEntry（手机CN/邮箱+SSO海外 OTP，验证即建号）  ← 不收卡
 ├─ 上线确认（游戏：封面方/长+名；活动：+奖品+起止时间）
 ├─ 无卡在档(!cardOnFile) → ② 卡门 CardGate（Stripe 绑卡，前3月免费）
 └─ publish → LIVE（首次上线起算 3 个月试用）
再次上线(已登录+有卡) → 跳过①②，仅上线确认 → LIVE
先逛后台 → ① 账号门单独走（不触发②）
```

## 3. 组件改动（相对现有 journey.jsx）
| 组件 | 现状 | 改为 |
|---|---|---|
| `Register`（:808） | 两步 `rstep: auth→card` | **删 card 步**，只保留 auth（AuthEntry）；`onVerified` = 建号并进后台。移除 `rstep`/卡相关 state（num/exp/cvc/cardOk/saveCard/chargeDate）。 |
| **新** `CardGate` | 卡步内嵌在 Register | **抽成独立共享组件**：props `{ cardOnFile, onSaveCard, chargeDate, lang, onBack }`。内容＝原 Register card 分支整块（trial badge + 标题「绑张卡，活动就上线」+ 3 trust 行 + Stripe Element + consent + 「绑卡并上线」+ CTA下唯一「今天不会扣款」）。**修评审必改**：随时取消用对勾非叉号；主绿→ #15803D 过 AA；副标不重复「今天不扣款」。 |
| 游戏上线弹窗 | 封面方/长+名，确认即上线，无卡 | 确认后：`cardOnFile ? publish() : <CardGate onSaveCard=…>`；底部提示改「客人玩即计入活跃玩家 · 前 3 个月免费」（去「免费上线无需付款」）；首次按钮「下一步：绑卡并上线」。 |
| `ActivityPublishModal`（:1735） | 已有 `cardOnFile`/`onSaveCard`，注释"不显示付款" | 同上：`!cardOnFile` → 渲染 `CardGate`；有卡直接确认。去掉"卡注册已收"注释。**P3 预期管理**：奖品配置区/上线按钮旁内联一行「带奖品活动上线需绑卡 · 前 3 月免费」（非弹窗）。 |
| 账号门文案 | 标题"验证一下就上线" | 「验证一下，进入后台」；副标「验证即进入，免费」；底部极轻灰字「进入后台免费，随时可退出」（**不出现"信用卡"三字**——粉色大象）。 |

## 4. 状态机
- **认证** `authed: false→true`（AuthEntry verify 成功；后端建号/归并 membership，见注册合一 v3 §11）。
- **卡** `cardOnFile: false→true`（CardGate SetupIntent 成功 tokenize）。
- **上线态**（不变）：draft/live/offline；游戏 draft/live。首次 live（游戏或活动）→ 账户 `trialStartAt` 落地，3 个月后自动转付 Starter。

## 5. 边界态（craft 必画/必做）
- 账号门：OTP 发送中(loading)、验证码错误（6 格全红 + 人话提示）、重发倒计时、手机号/邮箱格式错。
- 卡门：Stripe Element 加载中、**卡被拒**（"被发卡行拒绝了（未扣任何费用）。换一张卡，或联系银行"）、SCA/3DS 挑战（SetupIntent 原生，setup 时就过、别留到首扣）、网络失败重试。
- 有卡在档：展示末4位+品牌+到期 + 「更换」入口；「免费期剩 N 个月 · 今天不扣款」。
- 卡衰减（90 天）：Stripe **Account Updater** 自动更新过期卡；首扣前失效走 dunning 重试 + 补卡链接；扣款前 7 天提醒放**已实现价值**（"已有 X 人玩过你的游戏"）。

## 6. 计费口径（钉死）
- **MAU＝本月玩过≥1 次你游戏的人，含独立上线游戏 + 活动内游玩。** 纯游戏玩家计费。
- 免费＝建/预览/逛后台（无客人）；首次上线起 3 个月试用 → 自动转 Starter S$29（含 500 MAU）。
- 连带（非本次前端）：bible §4.0 MAU 定义补"含独立游戏"；财务核 per-MAU 毛利含纯游戏流量。

## 7. 验收标准
1. 未登录点上线 → 账号门**只有 OTP、无任何卡字段**；验证后进后台。
2. 后台可在**无卡**状态下浏览/建游戏/管理门店（先逛后台不被卡拦）。
3. 首次上线**游戏**（无奖品）→ 出 CardGate；绑卡成功才 live。（回归旧"游戏免费上线"= 失败。）
4. 首次上线**活动** → 出 CardGate；有卡时活动/游戏上线都跳过 CardGate 直接确认。
5. CardGate：随时取消配对勾；主按钮/链接对比度 ≥ AA；"今天不会扣款"全屏仅 CTA 下一处。
6. 卡被拒不扣费、文案说人话、可换卡重试。
7. 后端按 SetupIntent tokenize、不即时扣款；trialStartAt 落在首次 live。
8. 调试参数：账号门 `?screen=register`（纯验证无卡）；卡门＝`?card=0` 强制无卡后点任意「上线」触发（`?rstep=card` 已废）。

> 实现状态（2026-07-22）：本 PRD 已全部落地到本地 `journey.jsx`/`index.html`，见 CHANGELOG #103。已冒烟验证渲染（Register 纯验证、games/activities 页、发布弹窗无卡态按钮、CardForm）；端到端点击流因本机无 CDP 工具未自动化，靠分步验证 + 逻辑同构（`setStep("card")` 与既有 `done` 步同构）。

## 8. 锁定文案（中／EN）
- 账号门标题：验证一下，进入后台 / Verify to enter
- 账号门底注：进入后台免费，随时可退出 / Free to explore, leave anytime
- 上线游戏底注：客人玩即计入活跃玩家 · 前 3 个月免费 / Players count as active players · first 3 months free
- 卡门标题：绑张卡，活动就上线 / Add a card to go live
- 卡门 CTA：绑卡并上线 / Add card & go live ·　CTA下：今天不会扣款 / You won't be charged today
- 卡被拒：这张卡被发卡行拒绝了（未扣任何费用）。换一张卡，或联系你的银行。/ Your bank declined this card (nothing was charged). Try another card or contact your bank.

## 9. 沉淀回设计大脑（判例）
1. **"免费/收费的分界线是'给自己用 vs 给客人玩'，不是功能类型"**——收卡对齐"价值真正外溢给客人"那一刻，别按功能标签切（会漏钱＋被套利）。→ `原则/00-产品判断.md`。
2. **主动"安心话"会引入它想消除的焦虑（粉色大象）**——账号门喊"无需信用卡"反而植入卡焦虑；不提才是对的。→ `原则/文案与语言.md`。
