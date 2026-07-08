/* bilingual data — default EN, optional ZH. pick with P(lang, obj) */
const P = (lang, o) => (o && (o[lang] !== undefined ? o[lang] : o.en));

/* landing headline & sub-line are now rendered inline in Hero() via tr() */

/* prizes (shared by hero wheel + flow); lose flag instead of string match */
const PRIZES = [
  { en: "Free Americano", zh: "一杯美式" },
  { en: "1-for-1",        zh: "买一送一" },
  { en: "Free topping",   zh: "加料免费" },
  { en: "10% off",        zh: "全单 9 折" },
  { en: "Try again",      zh: "谢谢惠顾", lose: true },
  { en: "A slice of cake",zh: "一块蛋糕" },
];

/* landing gallery */
const GAMES = [
  { kind:"spin",    g:["#16A34A","#22C55E"], n:{en:"Spin the Wheel",zh:"幸运大转盘"}, t:{en:"Spin to win",zh:"转一转赢好礼"} },
  { kind:"scratch", g:["#0EA5E9","#38BDF8"], n:{en:"Scratch Card",zh:"刮刮乐"},     t:{en:"Scratch to reveal",zh:"刮开见惊喜"} },
  { kind:"stack",   g:["#F59E0B","#FBBF24"], n:{en:"Stack Up",zh:"叠叠乐"},         t:{en:"Stack them steady",zh:"一层层叠稳就赢"} },
  { kind:"merge",   g:["#EF4444","#FB7185"], n:{en:"Merge",zh:"合成"},             t:{en:"Merge pairs, grow bigger",zh:"两两合并越合越大"} },
  { kind:"drop",    g:["#8B5CF6","#A78BFA"], n:{en:"Catch",zh:"接一接"},           t:{en:"Catch the falling drops",zh:"接住落下的好料"} },
  { kind:"flip",    g:["#EC4899","#F9A8D4"], n:{en:"Flip Cards",zh:"翻牌"},         t:{en:"Flip to find the match",zh:"翻牌拼出好礼"} },
  { kind:"hoop",    g:["#0EA5E9","#22C55E"], n:{en:"Hoops",zh:"投投乐"},           t:{en:"Shoot and score",zh:"投进就赢好礼"} },
  { kind:"draw",    g:["#14B8A6","#5EEAD4"], n:{en:"Lucky Draw",zh:"抽一抽"},       t:{en:"Draw your luck",zh:"抽一张看手气"} },
];

const COUNTRIES = [
  { flag:"🇸🇬", en:"Singapore", zh:"新加坡" },
  { flag:"🇲🇾", en:"Malaysia", zh:"马来西亚" },
  { flag:"🇮🇩", en:"Indonesia", zh:"印度尼西亚" },
  { flag:"🇹🇭", en:"Thailand", zh:"泰国" },
  { flag:"🇭🇰", en:"Hong Kong", zh:"香港" },
];

/* flow: describe chips — 只选「店型」(品牌化全放第三步，第一步不取品牌/不要店名) */
const EXAMPLES = [
  {en:"Bubble Tea",zh:"奶茶"}, {en:"Dessert",zh:"甜品"}, {en:"Coffee",zh:"咖啡"},
  {en:"Fresh Produce",zh:"生鲜"}, {en:"Convenience",zh:"便利店"}, {en:"Board Games",zh:"桌游"},
  {en:"Sports",zh:"运动"}, {en:"Pets & Kids",zh:"宠物"}, {en:"Beauty",zh:"美妆"}, {en:"Fashion",zh:"时尚"},
];

/* flow: describe chips (returning — campaign goal, shop already known) */
const GOALS = [
  {en:"New customers",zh:"拉新客"}, {en:"Win back regulars",zh:"老客回流"}, {en:"Weekend traffic",zh:"周末客流"},
  {en:"Festival promo",zh:"节日活动"}, {en:"Clear stock",zh:"清库存"},
];

/* flow: matched templates */
const TEMPLATES = [
  { id:"wheel", kind:"spin", g:["#16A34A","#22C55E"], demo:"wheel", recommended:true,
    name:{en:"Lucky Spin",zh:"幸运大转盘"}, tag:{en:"Scan & spin · easiest",zh:"扫码就转 · 最快上手"},
    lede:{en:"One spin to win — the classic foot-traffic game for shops.",zh:"转一下就赢 —— 街边店最经典的到店引流玩法。"},
    feats:{en:["Anyone gets it in 10 seconds","You set the prizes and win-rate","Winners walk in to redeem — no walk-in, no count"],
           zh:["10 秒上手，老人小孩都会玩","奖品和中奖率，你自己说了算","赢家到店扫码核销，没核销不计数"]} },
  { id:"scratch", kind:"scratch", g:["#0EA5E9","#38BDF8"], demo:"scratch",
    name:{en:"Scratch Card",zh:"刮刮乐"}, tag:{en:"Scratch today's prize",zh:"刮出今天的奖"},
    lede:{en:"A swipe of the finger reveals today's surprise.",zh:"手指一刮，揭晓今天的惊喜。"},
    feats:{en:["High suspense, very shareable","Set a 'try again' slice to control cost","A win creates a redemption code"],
           zh:["悬念感强，朋友间爱分享","可设“谢谢惠顾”稳稳控成本","刮中即生成到店核销码"]} },
  { id:"stack", kind:"stack", g:["#F59E0B","#FBBF24"], demo:"wheel",
    name:{en:"Stack It",zh:"叠叠乐"}, tag:{en:"Higher = bigger",zh:"越叠越高"},
    lede:{en:"The higher you stack, the bigger the prize.",zh:"叠得越高，奖越大 —— 越玩越上头。"},
    feats:{en:["Fast pace, longer dwell time","Adjustable difficulty","Top prize saved for in-store"],
           zh:["节奏快，停留时长更长","难度可调，新客也敢试","封顶大奖留给到店核销"]} },
  { id:"fruit", kind:"merge", g:["#EF4444","#FB7185"], demo:"scratch",
    name:{en:"Fruit Merge",zh:"合成水果"}, tag:{en:"Merge up",zh:"合成升级"},
    lede:{en:"Crash two together, merge into a big prize.",zh:"两两相撞，合出大奖。"},
    feats:{en:["Lively visuals catch the eye","Short rounds, great for queues","Big merge creates a code"],
           zh:["画面热闹，吸引路过目光","回合短，适合排队时玩","大奖即生成核销码"]} },
  { id:"gift", kind:"drop", g:["#8B5CF6","#A78BFA"], demo:"wheel",
    name:{en:"Gift Drop",zh:"天降好礼"}, tag:{en:"Catch to win",zh:"接住就中"},
    lede:{en:"Catch the falling gift boxes to open a prize.",zh:"接住掉下来的礼物盒，开出奖。"},
    feats:{en:["Intuitive, zero learning curve","Freely mix your prizes","A win goes straight to redemption"],
           zh:["操作直觉，零学习成本","奖品组合自由配","中奖直达到店核销"]} },
  { id:"pair", kind:"flip", g:["#EC4899","#F9A8D4"], demo:"scratch",
    name:{en:"Match Pairs",zh:"翻翻配对"}, tag:{en:"Memory flip",zh:"记忆翻牌"},
    lede:{en:"Flip two matching cards to win a reward.",zh:"翻开两张相同的牌，赢奖励。"},
    feats:{en:["Relaxing, high replay","Three difficulty levels","A match creates a code"],
           zh:["轻松解压，复玩率高","难度三档可调","配对成功生成核销码"]} },
  { id:"hoop", kind:"hoop", g:["#0EA5E9","#22C55E"], demo:"wheel",
    name:{en:"Hoop Shot",zh:"投篮赢奖"}, tag:{en:"Beat the clock",zh:"手速挑战"},
    lede:{en:"Shoot the ball into the hoop before time runs out.",zh:"在倒计时内投进篮筐，赢取奖品。"},
    feats:{en:["Action-packed, high energy","Timer creates urgency","A basket wins a voucher"],
           zh:["动感十足，节奏紧凑","倒计时制造紧迫感","投中即赢券"]} },
  { id:"draw", kind:"draw", g:["#14B8A6","#5EEAD4"], demo:"scratch",
    name:{en:"Lucky Draw",zh:"幸运抽签"}, tag:{en:"One draw decides",zh:"一抽定输赢"},
    lede:{en:"Pull a ticket from the box — one draw, one prize.",zh:"从箱子里抽一张签，一抽定奖。"},
    feats:{en:["Simple, no learning curve","Classic lucky-draw excitement","Instant result, instant code"],
           zh:["最简单，零门槛","经典抽签的期待感","即抽即出核销码"]} },
];

const SAMPLE_LOGOS = [
  { id:"kopi", name:"Kopi Corner", color:"#7A4B2B", mark:"K" },
  { id:"boba", name:"Boba Lab",   color:"#7C3AED", mark:"B" },
  { id:"bake", name:"Sunny Bake", color:"#E0883B", mark:"S" },
];
const COLOR_SETS = [
  ["#16A34A","#22C55E"], ["#0EA5E9","#38BDF8"], ["#7A4B2B","#B07A4B"],
  ["#7C3AED","#A78BFA"], ["#E0883B","#F6B26B"], ["#DB2777","#F472B6"],
];

/* dashboard */
const TREND = [{d:{en:"Mon",zh:"一"},v:8},{d:{en:"Tue",zh:"二"},v:12},{d:{en:"Wed",zh:"三"},v:9},{d:{en:"Thu",zh:"四"},v:15},{d:{en:"Fri",zh:"五"},v:11},{d:{en:"Sat",zh:"六"},v:18},{d:{en:"Sun",zh:"日"},v:13}];
const GAME_PERF = [
  { n:{en:"Lucky Spin",zh:"幸运大转盘"}, v:52, c:"linear-gradient(90deg,#16A34A,#22C55E)" },
  { n:{en:"Scratch Card",zh:"刮刮乐"}, v:21, c:"linear-gradient(90deg,#0EA5E9,#38BDF8)" },
  { n:{en:"Stack It",zh:"叠叠乐"}, v:13, c:"linear-gradient(90deg,#F59E0B,#FBBF24)" },
];
const FEED = [
  { ic:"gift", bg:"#EEF1FF", c:"#4F46E5", who:{en:"User 88**",zh:"张**"}, act:{en:'redeemed “Free Americano” · counter',zh:'核销「一杯美式」· 收银台'}, z:{en:"just now",zh:"刚刚"} },
  { ic:"star", bg:"#FFF3DA", c:"#F59E0B", who:{en:"New customer",zh:"新客"}, act:{en:"first visit ever",zh:"第一次到店"}, z:{en:"2 min ago",zh:"2 分钟前"} },
  { ic:"gift", bg:"#EEF1FF", c:"#4F46E5", who:{en:"User 44**",zh:"李**"}, act:{en:'redeemed “1-for-1” · counter',zh:'核销「买一送一」· 收银台'}, z:{en:"5 min ago",zh:"5 分钟前"} },
  { ic:"ret", bg:"#ECFDF3", c:"#16A34A", who:{en:"Returning",zh:"回头客"}, act:{en:"3rd visit",zh:"第 3 次到店"}, z:{en:"8 min ago",zh:"8 分钟前"} },
  { ic:"star", bg:"#FFF3DA", c:"#F59E0B", who:{en:"New customer",zh:"新客"}, act:{en:'played “Lucky Spin”, won a voucher',zh:'玩了「幸运大转盘」赢了券'}, z:{en:"12 min ago",zh:"12 分钟前"} },
];

/* 统一 demo 指标 —— 全站(主页/核销/数据/我的游戏)从这里取数，口径自洽。
   场景：live 活动 a1 / 2 门店 / 单券。7 天为主窗口，today 为其子集。改这一处，全站同步、不穿帮。
   自洽校验：new 61 + returning 25 = walkins 86；trend 7 天求和 = 86，末位 = today 12；
   漏斗 plays 312 → awarded 120 → walkins/redeemed 86；byOutlet 50+36 = 86；券 awarded 120 / redeemed 86 → 待核销 34。 */
const DEMO_METRICS = {
  plays: 312, awarded: 120, walkins: 86, newCust: 61, returning: 25,
  delta: { plays:"+18%", walkins:"+24%", newCust:"+31%", returning:"+12%" },
  today: { plays: 47, walkins: 12, redeemed: 9 },
  trend: [{d:{en:"Mon",zh:"一"},v:10},{d:{en:"Tue",zh:"二"},v:12},{d:{en:"Wed",zh:"三"},v:11},{d:{en:"Thu",zh:"四"},v:14},{d:{en:"Fri",zh:"五"},v:13},{d:{en:"Sat",zh:"六"},v:14},{d:{en:"Sun",zh:"日"},v:12}],
  byOutlet: { o1: 50, o2: 36 },
  spark: { plays:[20,28,24,32,30,40,44], walkins:[5,7,6,9,8,11,13], newCust:[3,5,4,7,6,9,11], returning:[2,3,3,4,3,5,5] },
};

/* 游戏（独立上线）纯玩数据 —— 无奖品/无到店；只统计游玩、玩家、完成率。
   自洽：byGame 720+340+180 = 1240 = plays；trend 7 天求和 = 1240；players 890 < plays；完成率 68%。 */
const GAME_METRICS = {
  plays: 1240, players: 890, completion: 68,
  delta: { plays:"+22%", players:"+15%" },
  trend: [{d:{en:"Mon",zh:"一"},v:150},{d:{en:"Tue",zh:"二"},v:160},{d:{en:"Wed",zh:"三"},v:170},{d:{en:"Thu",zh:"四"},v:180},{d:{en:"Fri",zh:"五"},v:190},{d:{en:"Sat",zh:"六"},v:190},{d:{en:"Sun",zh:"日"},v:200}],
  byGame: [ {n:{en:"Lucky Spin",zh:"幸运大转盘"}, v:720, c:"#16A34A"}, {n:{en:"Scratch Card",zh:"刮刮乐"}, v:340, c:"#0EA5E9"}, {n:{en:"Fruit Merge",zh:"合成水果"}, v:180, c:"#EF4444"} ],
};

/* vouchers — merchant只填「折扣 + 张数」，无中奖率概念。发券概率按剩余张数自然分布、发完即停。 */
/* 建游戏起步只给一张券（商家再自己加） */
const STARTER_VOUCHERS = [
  { name:{en:"Free drink",zh:"一杯免费饮品"}, price:"S$6.00", discount:{en:"Free",zh:"免费"}, qty:100, awarded:0, redeemed:0, perCust:1 },
];
const DEFAULT_VOUCHERS = [
  { name:{en:"Cappuccino",zh:"卡布奇诺"}, price:"S$6.00",  discount:{en:"Free",zh:"免费"},      qty:200, awarded:120, redeemed:86, perCust:1 },
  { name:{en:"Any drink",zh:"任意饮品"},  price:"S$6.50",  discount:{en:"1-for-1",zh:"买一送一"}, qty:300, awarded:140, redeemed:96, perCust:1 },
  { name:{en:"Whole order",zh:"全单"},    price:"—",        discount:{en:"20% off",zh:"8 折"},    qty:200, awarded:88,  redeemed:53, perCust:1 },
];
/* outlets — 一个账号可有多家店，结构化地址 */
const OUTLETS = [
  { id:"o1", name:{en:"Kopi Corner · Tampines",zh:"Kopi Corner · 淡滨尼"}, line1:"10 Tampines Central 1, #01-12", city:"Singapore", region:"", postal:"529536", country:0, primary:true },
  { id:"o2", name:{en:"Kopi Corner · Jurong",zh:"Kopi Corner · 裕廊"},     line1:"63 Jurong West Central 3, #B1-05", city:"Singapore", region:"", postal:"648331", country:0, primary:false },
];

/* activities — 经营决策（门店+券+绑定游戏），与游戏视觉分离。stat=累计效果(walkins 到店/newCust 新客=计费)，draft 无数据 */
const DEFAULT_ACTIVITIES = [
  { id:"a1", name:{en:"Weekend Coffee Promo",zh:"周末咖啡促销"},
    outletIds:["o1","o2"],
    vouchers: [ {...DEFAULT_VOUCHERS[0]} ],
    gameId:"wheel", status:"live", winScore:1000, stat:{ walkins:52, newCust:41 } },
  { id:"a2", name:{en:"Mid-Autumn Mooncake",zh:"中秋月饼礼"},
    outletIds:["o1"],
    vouchers: [ {...DEFAULT_VOUCHERS[0], name:{en:"Free mooncake",zh:"月饼一份"}, qty:60} ],
    gameId:"scratch", status:"draft" },
  { id:"a3", name:{en:"New Drink Launch",zh:"新品上市试饮"},
    outletIds:["o2"],
    vouchers: [ {...DEFAULT_VOUCHERS[0], name:{en:"$2 off new drink",zh:"新品减 2 元"}, qty:100} ],
    gameId:"stack", status:"live", winScore:1000, stat:{ walkins:21, newCust:15 } },
  { id:"a5", name:{en:"Birthday Cake Giveaway",zh:"生日蛋糕赠券"},
    outletIds:["o1"],
    vouchers: [ {...DEFAULT_VOUCHERS[0], name:{en:"Free slice",zh:"蛋糕一块"}, qty:500} ],
    gameId:"fruit", status:"live", winScore:2500, stat:{ walkins:13, newCust:9 } },
  { id:"a6", name:{en:"Lunar New Year Special",zh:"春节特惠（已结束）"},
    outletIds:["o1","o2"],
    vouchers: [ {...DEFAULT_VOUCHERS[0], name:{en:"CNY treat",zh:"新年好礼"}, qty:300} ],
    gameId:"wheel", status:"offline", winScore:1000, stat:{ walkins:30, newCust:22 } },
];

Object.assign(window, { P, PRIZES, GAMES, COUNTRIES, EXAMPLES, GOALS, TEMPLATES, SAMPLE_LOGOS, COLOR_SETS, TREND, GAME_PERF, FEED, DEMO_METRICS, GAME_METRICS, DEFAULT_VOUCHERS, STARTER_VOUCHERS, OUTLETS, DEFAULT_ACTIVITIES });
