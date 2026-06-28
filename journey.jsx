const { useState, useEffect, useRef } = React;

/* ===================== i18n ===================== */
const LangCtx = React.createContext("en");
const useLang = () => React.useContext(LangCtx);
const tr = (lang, en, zh) => (lang === "zh" ? zh : en);
function LangToggle({ lang, setLang, style }) {
  return (
    <div className="langtoggle" style={style}>
      <button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>EN</button>
      <button className={lang==="zh"?"on":""} onClick={()=>setLang("zh")}>中文</button>
    </div>
  );
}

/* ===================== helpers ===================== */
const toHex = (rgb) => "#" + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
const lighten = (rgb, a) => rgb.map(v => v + (255 - v) * a);
const darken = (rgb, a) => rgb.map(v => v * (1 - a));
const hexToRgb = (h) => { const n = h.replace("#",""); return [0,2,4].map(i => parseInt(n.slice(i,i+2),16)); };
const paletteFromRgb = (rgb) => [toHex(darken(rgb, 0.06)), toHex(lighten(rgb, 0.34))];
/* solid-color rounded tile as a product-photo placeholder (presets demo) */
const swatchImg = (c) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' rx='12' fill='${c}'/></svg>`);
function extractColor(src) {
  return new Promise((res) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => {
      const s = 32, c = document.createElement("canvas"); c.width = s; c.height = s;
      const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, s, s);
      let d; try { d = ctx.getImageData(0, 0, s, s).data; } catch (e) { res(null); return; }
      const map = {}; let best = null, bestN = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i+3] < 128) continue;
        const r = d[i], g = d[i+1], b = d[i+2], mx = Math.max(r,g,b), mn = Math.min(r,g,b);
        if (mx > 238 && mn > 238) continue; if (mx < 22) continue;
        const key = (r>>5)+"-"+(g>>5)+"-"+(b>>5), w = 1 + (mx-mn)/50;
        map[key] = (map[key] || 0) + w; if (map[key] > bestN) { bestN = map[key]; best = [r,g,b]; }
      }
      res(best);
    };
    img.onerror = () => res(null); img.src = src;
  });
}

/* ===================== mini wheel (landing hero) ===================== */
function MiniWheel() {
  const lang = useLang();
  const [rot, setRot] = useState(0), [spinning, setSpinning] = useState(false), [result, setResult] = useState(null);
  const N = PRIZES.length, seg = 360 / N, cols = ["#7A4B2B", "#A9743F"];
  const stops = PRIZES.map((_, i) => `${i % 2 ? cols[1] : cols[0]} ${i*seg}deg ${(i+1)*seg}deg`).join(",");
  const spin = () => {
    if (spinning) return; setSpinning(true); setResult(null);
    let i = Math.floor(Math.random() * N);
    if (PRIZES[i].lose && Math.random() < 0.7) i = Math.floor(Math.random() * N);
    const center = i*seg + seg/2, desired = (360 - center) % 360;
    setRot(p => { const cur = ((p % 360) + 360) % 360; let d = desired - cur; if (d < 0) d += 360; return p + 360*5 + d; });
    setTimeout(() => { setResult(PRIZES[i]); setSpinning(false); }, 4500);
  };
  useEffect(() => { const t = setTimeout(spin, 1200); return () => clearTimeout(t); }, []);
  return (
    <>
      <div className="mw-box">
        <div className="mw-pointer"></div>
        <div className="mw" style={{ transform:`rotate(${rot}deg)`, background:`conic-gradient(${stops})` }}>
          {PRIZES.map((p, i) => (<div key={i} style={{ position:"absolute", inset:0, transform:`rotate(${i*seg+seg/2}deg)` }}><span className="lab">{P(lang,p)}</span></div>))}
        </div>
        <div className="mw-hub"><Ic.cup/></div>
      </div>
      <button className="mw-spin" onClick={spin} disabled={spinning}>{spinning ? tr(lang,"Spinning…","转动中…") : tr(lang,"Spin to win","转一下赢咖啡")}</button>
      <div className="gameresult">{result ? (result.lose ? <span style={{ color:"var(--muted)" }}>{tr(lang,"So close — try again!","差一点，再来一次！")}</span> : <span><Ic.spark style={{ verticalAlign:"-2px", marginRight:2 }}/> {tr(lang,"You won","你赢了")} <b>{P(lang,result)}</b></span>) : <span style={{ color:"var(--muted)", fontWeight:500 }}>　</span>}</div>
    </>
  );
}

/* ===================== gameplay preview (looping; stand-in for a short gameplay video) ===================== */
function GamePreview({ kind, colors }) {
  const lang = useLang();
  const [a, b] = colors || ["#16A34A", "#22C55E"];
  const wheel = "conic-gradient(rgba(255,255,255,.95) 0 60deg,rgba(255,255,255,.58) 60deg 120deg,rgba(255,255,255,.95) 120deg 180deg,rgba(255,255,255,.58) 180deg 240deg,rgba(255,255,255,.95) 240deg 300deg,rgba(255,255,255,.58) 300deg 360deg)";
  let inner;
  if (kind === "scratch") inner = (<div className="gp-card"><span className="pz" style={{ color:a }}><Ic.gift/></span><span className="foil"/><span className="shine"/></div>);
  else if (kind === "stack") inner = (<div className="gp-stack-w"><i style={{ "--d":"0s" }}/><i style={{ "--d":".5s" }}/><i style={{ "--d":"1s" }}/></div>);
  else if (kind === "merge") inner = (<div className="gp-merge-w"><i className="m1"/><i className="m2"/><i className="mb"/></div>);
  else if (kind === "drop") inner = (<div className="gp-drop-w"><span className="box"/><span className="tray"/></div>);
  else if (kind === "flip") inner = (<div className="gp-flip-w"><span className="fc"><span className="back"/><span className="face" style={{ color:a }}><Ic.star/></span></span><span className="fc d"><span className="back"/><span className="face" style={{ color:a }}><Ic.star/></span></span></div>);
  else if (kind === "hoop") inner = (<div className="gp-hoop-w"><span className="rim"/><span className="ball"/></div>);
  else if (kind === "draw") inner = (<div className="gp-draw-w"><span className="ticket" style={{ color:a }}><Ic.star/></span><span className="slot"/></div>);
  else inner = (<><div className="gp-wheel" style={{ background:wheel }}/><span className="gp-needle"/><span className="gp-hub"/></>);
  return (
    <div className={"gp gp-" + (kind || "spin")} style={{ background:`linear-gradient(140deg, ${a}, ${b})` }}>
      {inner}
      <span className="gp-tag"><Ic.play/>{tr(lang,"Gameplay","玩法")}</span>
    </div>
  );
}

/* ===================== playable demos (flow) ===================== */
function PlayableWheel({ colors, plist, logo, logoMark, hubColor }) {
  const lang = useLang();
  const [rot, setRot] = useState(0), [spinning, setSpinning] = useState(false), [result, setResult] = useState(null);
  const N = plist.length, seg = 360 / N, [a, b] = colors;
  const stops = plist.map((_, i) => `${i % 2 ? b : a} ${i*seg}deg ${(i+1)*seg}deg`).join(",");
  const spin = () => {
    if (spinning) return; setSpinning(true); setResult(null);
    let i = Math.floor(Math.random() * N);
    if (plist[i].lose && Math.random() < 0.6) i = Math.floor(Math.random() * N);
    const center = i*seg + seg/2, desired = (360 - center) % 360;
    setRot(p => { const cur = ((p % 360) + 360) % 360; let d = desired - cur; if (d < 0) d += 360; return p + 360*5 + d; });
    setTimeout(() => { setResult(plist[i]); setSpinning(false); }, 4700);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div className="wheel-box">
        <div className="wheel-pointer"></div>
        <div className="wheel" style={{ transform:`rotate(${rot}deg)`, background:`conic-gradient(${stops})` }}>
          {plist.map((p, i) => (<div key={i} style={{ position:"absolute", inset:0, transform:`rotate(${i*seg+seg/2}deg)` }}>
            <span style={{ position:"absolute", top:"20px", left:"50%", transform:"translateX(-50%)", fontSize:"11.5px", fontWeight:700, color:"#fff", textShadow:"0 1px 2px rgba(0,0,0,.45)", maxWidth:"78px", textAlign:"center", whiteSpace:"nowrap" }}>{p.label}</span></div>))}
        </div>
        <div className="wheel-hub" style={{ background: logo ? "#fff" : (hubColor || colors[0]), color:"#fff" }}>
          {logo ? <img src={logo} alt=""/> : <span style={{ fontSize:"24px" }}>{logoMark || "GO"}</span>}
        </div>
      </div>
      <div className="wheel-cta">
        <button className="spinbtn" onClick={spin} disabled={spinning}>{spinning ? tr(lang,"Spinning…","转动中…") : tr(lang,"Spin to win","转一下试试")}</button>
        <div className="prizebanner">{result ? (result.lose ? <span>{tr(lang,"So close — ","差一点点，")}<b>{tr(lang,"try again","再来一次")}</b>！</span> : <span><Ic.spark style={{ verticalAlign:"-2px", marginRight:2 }}/> {tr(lang,"You won","你赢了")} <b>{result.label}</b></span>) : <span style={{ color:"var(--muted)", fontWeight:500 }}>{tr(lang,"Tap the button to try it","点上面的按钮，试玩一下")}</span>}</div>
      </div>
    </div>
  );
}
function ScratchCard({ colors, prize }) {
  const lang = useLang();
  const ref = useRef(null), [done, setDone] = useState(false), draw = useRef(false);
  useEffect(() => {
    const cv = ref.current; if (!cv) return; const ctx = cv.getContext("2d"); cv.width = 300; cv.height = 200;
    const grad = ctx.createLinearGradient(0,0,300,200); grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1]);
    ctx.fillStyle = grad; ctx.fillRect(0,0,300,200);
    ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.textAlign = "center";
    ctx.font = "700 22px 'Plus Jakarta Sans',sans-serif"; ctx.fillText(tr(lang,"Scratch to reveal","刮开看奖"), 150, 100);
    ctx.font = "500 13px 'Plus Jakarta Sans',sans-serif"; ctx.fillText(tr(lang,"swipe finger / mouse","手指 / 鼠标滑动"), 150, 126);
    setDone(false);
  }, [colors, prize, lang]);
  const erase = (e) => {
    if (!draw.current) return; const cv = ref.current, r = cv.getBoundingClientRect();
    const x = (e.clientX-r.left)*(cv.width/r.width), y = (e.clientY-r.top)*(cv.height/r.height);
    const ctx = cv.getContext("2d"); ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill();
    const d = ctx.getImageData(0,0,cv.width,cv.height).data; let clear = 0;
    for (let i = 3; i < d.length; i += 36) if (d[i] < 128) clear++;
    if (clear/(d.length/36) > 0.45 && !done) { ctx.clearRect(0,0,cv.width,cv.height); setDone(true); }
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div className="scratch-box">
        <div className="scratch-prize">
          <div style={{ fontSize:"13px", color:"var(--muted)", fontWeight:600 }}>{tr(lang,"You scratched","恭喜你刮中")}</div>
          <div className="big">{prize}</div>
          <div style={{ fontSize:"12.5px", color:"var(--muted)" }}>{tr(lang,"redeem in store","到店扫码核销")}</div>
        </div>
        <canvas ref={ref} className="scratch-canvas" onPointerDown={(e)=>{draw.current=true;e.currentTarget.setPointerCapture(e.pointerId);erase(e);}} onPointerMove={erase} onPointerUp={()=>{draw.current=false;}}/>
      </div>
      <div className="scratch-hint">{done ? <span><Ic.spark style={{ verticalAlign:"-2px", marginRight:2 }}/> {tr(lang,"You won!","中奖啦！")}</span> : tr(lang,"Swipe across the card to scratch","在卡片上滑动，刮出今天的奖")}</div>
    </div>
  );
}
function Demo({ game, brand }) {
  const lang = useLang();
  const plist = PRIZES.map(p => ({ label:P(lang,p), lose:p.lose }));
  if (game.demo === "scratch") return <ScratchCard colors={brand.color} prize={(plist.find(p=>!p.lose)||plist[0]).label} />;
  return <PlayableWheel colors={brand.color} plist={plist} logo={brand.logo} logoMark={brand.logoMark} hubColor={brand.color[0]} />;
}

/* ===================== flow chrome + loader ===================== */
const STEPS = [{en:"Describe",zh:"描述"},{en:"Pick a game",zh:"选游戏"},{en:"Preview & publish",zh:"预览发布"}];
const STEPS_RET = [{en:"Pick a game",zh:"选游戏"},{en:"Preview & publish",zh:"预览发布"}]; // 登录后建游戏：免描述，2 步
function Stepper({ idx, steps = STEPS }) {
  const lang = useLang();
  return (<div className="stepper">{steps.map((s, i) => (
    <div key={i} className={"step " + (i<idx?"done":i===idx?"active":"")}>
      <div className="dot">{i<idx ? <Ic.check/> : i+1}</div><div className="lbl">{P(lang,s)}</div>
      {i < steps.length-1 && <div className="bar"></div>}
    </div>))}</div>);
}
function Loader({ title, who, tasks, onDone }) {
  const lang = useLang();
  const [cur, setCur] = useState(0);
  useEffect(() => { let i = 0; const t = setInterval(() => { i++; setCur(i); if (i>=tasks.length){ clearInterval(t); setTimeout(onDone, 700);} }, 540); return () => clearInterval(t); }, []);
  const pct = Math.min(100, Math.round((cur/tasks.length)*100));
  return (
    <div className="loader">
      <div className="f-eye" style={{ textAlign:"center" }}><Ic.spark style={{ verticalAlign:"-3px", marginRight:6 }}/>KiX AI</div>
      <h2>{title}{who && <> ·<span className="who"> {who}</span></>}</h2>
      <div className="tasklist">{tasks.map((tk, i) => (
        <div key={i} className={"task " + (i<cur?"on":i===cur?"cur":"")}>
          <span className="tick">{i<cur ? <Ic.check/> : i===cur ? <span className="spin"></span> : ""}</span>{tk}
        </div>))}</div>
      <div className="progress"><i style={{ width: pct+"%" }}></i></div>
    </div>
  );
}

/* ===================== landing ===================== */
function Hero({ go }) {
  const lang = useLang(); const H = P(lang, HEADLINE);
  return (
    <section className="hero">
      <div>
        <h1 className="hero-h">{H.a}<span className="hl">{H.b}</span>{H.c}</h1>
        <p className="lede">{P(lang,SUB_LANDING)[0]}<b>{P(lang,SUB_LANDING)[1]}</b></p>
        <div className="cta-row">
          <button className="btn primary lg" onClick={go}>{tr(lang,"Create your first game — free","免费创建第一个游戏")}</button>
          <button className="btn ghost lg" onClick={go}>{tr(lang,"See how it works","看 30 秒怎么玩")}</button>
        </div>
        <div className="proof">
          <div className="tagm">{tr(lang,"An ice-cream shop","某冰激凌店")}</div>
          <div className="stat"><div className="n"><b>48%</b></div><div className="l">{tr(lang,"walk-in rate","到店率")}</div></div>
          <div className="stat-sep"></div>
          <div className="stat"><div className="n">1,500</div><div className="l">{tr(lang,"new walk-ins","新客到店")}</div></div>
          <div className="stat-sep"></div>
          <div className="stat"><div className="n">29%</div><div className="l">{tr(lang,"win-back rate","老客召回复购")}</div></div>
        </div>
      </div>
      <div className="visual">
        <div className="float f1"><span className="ic" style={{ background:"var(--green-50)", color:"var(--green-d)" }}><Check/></span><div><div className="ft">{tr(lang,"Another walk-in","又一位到店")}</div><div className="fs">{tr(lang,"just now · redeemed a coffee","刚刚 · 核销一杯美式")}</div></div></div>
        <div className="float f2"><span className="ic" style={{ background:"#FFF3DA", color:"var(--amber)" }}><Ic.ret/></span><div><div className="ft">{tr(lang,"A regular came back","老顾客回来了")}</div><div className="fs">{tr(lang,"gone 30 days · won back","30 天没来 · 自动召回")}</div></div></div>
        <div className="phone"><div className="screen">
          <div className="appbar"><span className="blogo"><Ic.cup/></span><div><div className="bt">Kopi Corner</div><div className="bs">{tr(lang,"Play to win today's coffee","来玩一把，赢今天的咖啡")}</div></div><span className="livechip"><span className="b"></span>LIVE</span></div>
          <div className="gamearea"><div className="gametitle"><span>Kopi Corner</span> · {tr(lang,"Lucky Spin","幸运大转盘")}</div><MiniWheel/></div>
        </div></div>
      </div>
    </section>
  );
}
function ThreeThings() {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"ALL IN ONE","一套搞定")}</div>
      <h2 className="sec-h">{tr(lang,"Win new customers, bring back old ones, see the numbers","拉新客、召回老客、看得清账")}</h2>
      <p className="sec-sub">{tr(lang,"No ad skills, no hardware. One game does all three.","不用懂投放，不用装设备。一个游戏，三件事一起做。")}</p>
      <div className="three">
        <div className="tcard"><div className="tnum">{tr(lang,"01 · ACQUIRE","01 · 拉新客")}</div><h3>{tr(lang,"Passers-by play their way in","路过的人，玩着玩着就进店")}</h3><p>{tr(lang,"Nearby people play your game and win a voucher to walk in. You only pay for real walk-ins, never for views.","附近的人扫码玩你的游戏、赢券到店。只算真实到店，不为曝光花一分钱。")}</p>
          <div className="viz"><div className="vrow"><span className="vp" style={{ background:"var(--green-50)", color:"var(--green-d)" }}><Ic.pin/></span>{tr(lang,"Within 300m · office · walked in","300m 内 · 上班族 · 已到店")}</div><div className="vrow"><span className="vp" style={{ background:"#FFF3DA", color:"var(--amber)" }}><Ic.pin/></span>{tr(lang,"Within 500m · student · played","500m 内 · 学生 · 玩了一把")}</div></div></div>
        <div className="tcard"><div className="tnum">{tr(lang,"02 · RETAIN","02 · 召回老客")}</div><h3>{tr(lang,"Bring regulars back automatically","老顾客太久没来，自动请回来")}</h3><p>{tr(lang,"Members who haven't visited in 30 days get an auto voucher — turning one-time guests into regulars.","30 天没到店的会员，KiX 自动发一张券召回 —— 把一次性客人，变成回头客。")}</p>
          <div className="viz"><div className="vrow"><span className="vp" style={{ background:"#EEF1FF", color:"#4F46E5" }}><Ic.bell/></span>{tr(lang,"Miss you — here's a free coffee","想你了，送你一杯免费咖啡")}</div><div className="vbignum"><b>29%</b> <span className="vmini">{tr(lang,"win-back rate","召回复购率")}</span></div></div></div>
        <div className="tcard"><div className="tnum">{tr(lang,"03 · ZERO WASTE","03 · 零浪费")}</div><h3>{tr(lang,"Only pay when they walk in","没进店，不花一分钱")}</h3><p>{tr(lang,"No impressions, no clicks, no wasted budget. You only pay when a customer actually walks through your door.","不为曝光付费，不为点击付费。客人真正走进你的店，才算一次。")}</p>
          <div className="viz"><div className="vbignum"><b>S$0</b> <span className="vmini">{tr(lang,"for views & clicks","曝光和点击的花费")}</span></div><div className="vbar"><i style={{ width:"100%" }}></i></div><div className="vmini">{tr(lang,"vs traditional ads: 90% of budget wasted on non-visitors","传统广告：90% 预算花在不会来的人身上")}</div></div></div>
      </div>
    </section>
  );
}
function Gallery({ go }) {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"SAMPLE GAMES","游戏样片")}</div>
      <h2 className="sec-h">{tr(lang,"1,000+ games, yours in 30 minutes","上千个游戏，30 分钟变成你的")}</h2>
      <p className="sec-sub">{tr(lang,"Pick a template, drop in your logo and product photos — AI generates your branded game.","挑一个模板，放上你的 logo 和商品图，AI 帮你生成专属游戏。")}</p>
      <div className="gallery">{GAMES.map((g, i) => (
        <div key={i} className="gtile" onClick={go}><div className="art"><GamePreview kind={g.kind} colors={g.g} /></div><div className="cap">{P(lang,g.n)}<div className="sm">{P(lang,g.t)}</div></div></div>))}</div>
      <div className="gallery-foot">{tr(lang,"Plus ","还有 ")}<b style={{ color:"var(--ink)" }}>1,000+</b>{tr(lang," templates — make any of them your own","个模板 · 每个都能换成你的品牌")}</div>
    </section>
  );
}
function Steps() {
  const lang = useLang();
  const S = [{ i:Ic.gamepad, h:tr(lang,"Pick a game","挑一个游戏"), p:tr(lang,"Choose a format that fits your shop from 1,000+ templates.","从上千个模板里选一个适合你店的玩法。") },{ i:Ic.palette, h:tr(lang,"Add your brand","套上你的品牌"), p:tr(lang,"Drop in your logo and photos — AI auto-colors and builds it.","传 logo 和商品图，AI 自动配色、生成游戏。") },{ i:Ic.store, h:tr(lang,"Redeem in store","客人到店核销"), p:tr(lang,"Winners walk in; you scan their QR or swipe to redeem.","赢家凭二维码到店，你一扫或滑动核销即可。") }];
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"HOW IT WORKS","三步上线")}</div><h2 className="sec-h">{tr(lang,"Open for business in under 30 minutes","不到 30 分钟，开门营业")}</h2>
      <div className="steps">{S.map((s, i) => (<div key={i} className="stp"><div className="sn">0{i+1}</div><div className="si">{s.i()}</div><h3>{s.h}</h3><p>{s.p}</p></div>))}</div>
    </section>
  );
}
function Pricing({ go }) {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"PRICING","价格")}</div><h2 className="sec-h">{tr(lang,"Start free, pay only for real walk-ins","免费开始，只为真实到店付费")}</h2>
      <div className="tiers">
        <div className="tier"><div className="tname">{tr(lang,"FREE","免费版")}</div><div className="price">S$0</div><div className="pdesc">{tr(lang,"Never charged. Get your first game running.","永不扣款，先把第一个游戏跑起来。")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"1 game","1 个游戏")}</li><li><span className="ck"><Check/></span>{tr(lang,"50 walk-ins / month","每月 50 位到店")}</li><li><span className="ck"><Check/></span>{tr(lang,"Redemption + basic dashboard","到店核销 + 基础看板")}</li></ul>
          <button className="btn ghost" onClick={go}>{tr(lang,"Start free","免费开始")}</button></div>
        <div className="tier pop"><div className="pbadge">{tr(lang,"Most popular","最受欢迎")}</div><div className="tname">{tr(lang,"PRO","专业版")}</div><div className="price">S$49<small>/mo</small></div><div className="pdesc">{tr(lang,"Unlimited campaigns, or pay S$3 per walk-in.","不限活动，或按 S$3 / 到店 用多少付多少。")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"Unlimited games & campaigns","不限游戏与活动")}</li><li><span className="ck"><Check/></span>{tr(lang,"Auto win-back for regulars","老客自动召回")}</li><li><span className="ck"><Check/></span>{tr(lang,"Multi-outlet · walk-in attribution","多门店 · 到店归因")}</li></ul>
          <button className="btn primary" onClick={go}>{tr(lang,"Create your first game","免费创建第一个游戏")}</button></div>
        <div className="tier"><div className="tname">{tr(lang,"CHAINS","连锁版")}</div><div className="price">{tr(lang,"Contact us","联系我们")}</div><div className="pdesc">{tr(lang,"Multi-outlet, custom games and integrations.","多门店、定制玩法与对接，按规模报价。")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"Multi-city · multi-outlet","多城市 · 多门店")}</li><li><span className="ck"><Check/></span>{tr(lang,"Dedicated success manager","专属客户成功")}</li><li><span className="ck"><Check/></span>{tr(lang,"API / POS integration","API / POS 对接")}</li></ul>
          <button className="btn ghost">{tr(lang,"Book a call","预约沟通")}</button></div>
      </div>
    </section>
  );
}
function Landing({ go, onSignIn, lang, setLang }) {
  return (
    <div className="wrap">
      <nav>
        <div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/></div>
        <div className="navlinks"><a onClick={(e)=>e.preventDefault()} href="#">{tr(lang,"Games","玩法")}</a><a onClick={(e)=>e.preventDefault()} href="#">{tr(lang,"How it works","怎么用")}</a><a onClick={(e)=>e.preventDefault()} href="#">{tr(lang,"Pricing","价格")}</a></div>
        <div className="navright"><LangToggle lang={lang} setLang={setLang} /><a className="signin" onClick={(e)=>{e.preventDefault();onSignIn();}} href="#">{tr(lang,"Sign in","登录")}</a><button className="btn dark sm" onClick={go}>{tr(lang,"Start free","免费开始")}</button></div>
      </nav>
      <Hero go={go} />
      <div className="loop">
        <span>{tr(lang,"Customer ","客人 ")}<b>{tr(lang,"plays","扫码玩")}</b></span><span className="arr">→</span><span><b>{tr(lang,"wins a voucher","赢券")}</b></span><span className="arr">→</span>
        <span>{tr(lang,"walks in & ","到店 ")}<b>{tr(lang,"redeems","核销")}</b>{tr(lang," (QR / swipe)","（二维码 / 滑动）")}</span><span className="arr">→</span><span>{tr(lang,"regulars ","老客 ")}<b>{tr(lang,"won back","自动召回")}</b></span>
      </div>
      <ThreeThings/><Gallery go={go} /><Steps/><Pricing go={go} />
      <section className="sec" style={{ display:"flex", justifyContent:"center" }}>
        <button className="btn primary final-cta" onClick={go}>{tr(lang,"Create your first game — free","免费创建第一个游戏")}</button>
      </section>
      <footer><div>{tr(lang,"KiX · built for neighbourhood shops","KiX · 为街边小店而做")}</div><div>Mozat Pte Ltd · Singapore</div></footer>
    </div>
  );
}

/* ===================== register (publish gate) ===================== */
function Register({ onDone, onSignIn }) {
  const lang = useLang();
  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [country, setCountry] = useState(0);
  const ok = name.trim() && phone.trim();
  return (
    <div className="reg-wrap"><div className="reg-card">
      <h1>{tr(lang,"Last step: create an account to publish","最后一步：创建账号，发布上线")}</h1>
      <div className="field"><label>{tr(lang,"Shop name","商家名称")} <span className="req">*</span></label><input value={name} onChange={e=>setName(e.target.value)} placeholder={tr(lang,"e.g. Kopi Corner","例如：Kopi Corner")}/></div>
      <div className="field"><label>{tr(lang,"Country / region","国家 / 地区")} <span className="req">*</span></label><select value={country} onChange={e=>setCountry(+e.target.value)}>{COUNTRIES.map((c,i)=><option key={i} value={i}>{c.flag} {P(lang,c)}</option>)}</select></div>
      <div className="field"><label>{tr(lang,"Mobile","手机号")} <span className="opt">{tr(lang,"(for WhatsApp)","（用于 WhatsApp 联系）")}</span> <span className="req">*</span></label>
        <div className="phonewrap"><input className="cc" value="+65" readOnly/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9123 4567"/></div></div>
      <button className="btn primary" disabled={!ok} onClick={onDone}>{tr(lang,"Create account & publish","创建账号并发布游戏")}</button>
      <div className="reg-fine">{tr(lang,"By continuing you agree to our ","继续即表示同意 ")}<a>{tr(lang,"Terms","服务条款")}</a>{tr(lang," & ","与 ")}<a>{tr(lang,"Privacy","隐私政策")}</a>。{tr(lang,"Have an account? ","已有账号？")}<a onClick={onSignIn} style={{ cursor:"pointer" }}>{tr(lang,"Sign in","登录")}</a></div>
    </div></div>
  );
}

/* ===================== login (returning merchant · unified phone-OTP) ===================== */
function Login({ onDone }) {
  const lang = useLang();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState(""), [otp, setOtp] = useState("");
  const sendCode = () => { if (phone.trim().length >= 6) setStep("otp"); };
  const verify = () => { if (otp.trim().length >= 4) onDone(); };
  return (
    <div className="reg-wrap"><div className="reg-card">
      {step === "phone" ? <>
        <h1>{tr(lang,"Sign in to KiX","登录 KiX")}</h1>
        <p className="login-sub">{tr(lang,"Enter your phone — we'll text you a code. New here? It creates your account.","输入手机号，我们发条验证码。第一次来？会自动帮你建账号。")}</p>
        <div className="field"><label>{tr(lang,"Mobile","手机号")}</label><div className="phonewrap"><input className="cc" value="+65" readOnly/><input autoFocus value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9123 4567" onKeyDown={e=>{ if(e.key==="Enter") sendCode(); }}/></div></div>
        <button className="btn primary" disabled={phone.trim().length<6} onClick={sendCode}>{tr(lang,"Continue","继续")}</button>
      </> : <>
        <h1>{tr(lang,"Enter the code","输入验证码")}</h1>
        <p className="login-sub">{tr(lang,`We sent a 6-digit code to +65 ${phone}`,`验证码已发送至 +65 ${phone}`)}</p>
        <div className="field"><input className="otp-input" autoFocus value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))} placeholder="––––––" maxLength="6" onKeyDown={e=>{ if(e.key==="Enter") verify(); }}/></div>
        <button className="btn primary" disabled={otp.trim().length<4} onClick={verify}>{tr(lang,"Verify & sign in","验证并登录")}</button>
        <div className="reg-fine"><a onClick={()=>{ setStep("phone"); setOtp(""); }} style={{ cursor:"pointer" }}>{tr(lang,"Use a different number","换个号码")}</a></div>
      </>}
    </div></div>
  );
}

/* ===================== flow screens ===================== */
function Describe({ need, setNeed, site, setSite, setBrand, onNext }) {
  const lang = useLang();
  // 选样例店 = 顺手套用预设品牌包（logo 字母/配色/商品图），演示「选星巴克→品牌自动带好」
  const pick = (ex) => { setNeed(P(lang,ex)); if (ex.color && setBrand) setBrand(b => ({ ...b, color:ex.color, logo:null, logoMark:ex.mark, products:(ex.prod||[]).map(swatchImg) })); };
  return (
    <div className="canvas narrow describe-wrap">
      <div className="center">
        <div className="f-eye">{tr(lang,"Step 1 · 30 seconds to build your game","第 1 步 · 30 秒搭好你的游戏")}</div>
        <h1 className="big">{tr(lang,"First — what's your shop?","先说说，你的店是做什么的？")}</h1>
        <p className="sub">{tr(lang,"Your shop name or type — AI picks the fit & sample brand kit.","填店名或店型，AI 挑玩法、并带上样例品牌包。")}</p>
      </div>
      <div className="bigfield"><input autoFocus value={need} placeholder={tr(lang,"e.g. Starbucks, or “a corner coffee shop”","例如：星巴克，或「街角的咖啡店」")} onChange={e=>setNeed(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&need.trim())onNext(); }}/></div>
      <div className="chips">{EXAMPLES.map((ex,i) => (<button key={i} className="chip" onClick={()=>pick(ex)}><span className="pre">{tr(lang,"try","试试")}</span>{P(lang,ex)}</button>))}</div>
      <div className="site-field"><input value={site} onChange={e=>setSite(e.target.value)} placeholder={tr(lang,"Website or social (optional) — we'll pull your logo & colors","网站或社媒（选填）—— 帮你自动取 logo 和配色")}/></div>
      <div className="btn-row"><button className="btn primary lg" disabled={!need.trim()} onClick={onNext}>{tr(lang,"Match games","匹配游戏")} <Ic.arrow/></button></div>
    </div>
  );
}
function Results({ need, onPick, onBack }) {
  const lang = useLang();
  return (
    <div className="canvas">
      <div className="results-head"><div><div className="f-eye">{tr(lang,"Tap any to try it","点开任意一款即可试玩")}</div><h1>{tr(lang,"6 games for ","为")}<b>{tr(lang,"“","「")}{need || tr(lang,"your shop","你的店")}{tr(lang,"”","」")}</b>{tr(lang,"","挑了 6 款")}</h1></div><button className="relink" onClick={onBack}><Ic.back style={{ width:14, height:14, verticalAlign:"-2px" }}/> {tr(lang,"Back","返回")}</button></div>
      <div className="grid">{TEMPLATES.map(t => (
        <div key={t.id} className="gcard" onClick={()=>onPick(t)}>
          {t.recommended && <div className="ribbon"><span className="dot"></span>{tr(lang,"AI pick","AI 首选")}</div>}
          <div className="thumb"><GamePreview kind={t.kind} colors={t.g} /><div className="play"><span><Ic.play/> {tr(lang,"Try it","试玩")}</span></div></div>
          <div className="gmeta"><div className="gname">{P(lang,t.name)}</div><div className="gtag">{P(lang,t.tag)}</div></div>
        </div>))}</div>
    </div>
  );
}
/* ===== shared game-edit controls (used by Preview build step + Workspace edit) ===== */
function BrandControls({ brand, setBrand }) {
  const lang = useLang();
  const fileRef = useRef(null), prodRef = useRef(null), [busy, setBusy] = useState(false);
  const reroll = () => setBrand(b => ({ ...b, color: COLOR_SETS[Math.floor(Math.random()*COLOR_SETS.length)] }));
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setBusy(true);
    const rd = new FileReader(); rd.onload = async () => { const url = rd.result; const rgb = await extractColor(url);
      setBrand(b => ({ ...b, logo:url, logoMark:null, color: rgb ? paletteFromRgb(rgb) : b.color })); setBusy(false); }; rd.readAsDataURL(f); };
  const onProducts = (e) => { const fs = Array.from(e.target.files || []).slice(0,8); Promise.all(fs.map(f => new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f); }))).then(urls => setBrand(b => ({ ...b, products:[...(b.products||[]), ...urls].slice(0,8) }))); };
  const delProduct = (i) => setBrand(b => ({ ...b, products:(b.products||[]).filter((_,j)=>j!==i) }));
  // 上传 logo 后用提取出的色作为当前选中色（放第一个）；没上传才默认给一组
  const sets = [brand.color, ...COLOR_SETS.filter(c => c[0] !== brand.color[0])];
  return (
    <div className="editrow">
      <div className="k">{tr(lang,"Brand — logo, colors & product photos","品牌 —— Logo、配色与商品图")}</div>
      <div className="bc-line">
        {brand.logo ? <img src={brand.logo} alt="" style={{ width:40, height:40, borderRadius:10, objectFit:"cover" }}/> : <div style={{ width:40, height:40, borderRadius:10, background:brand.color[0], display:"grid", placeItems:"center", color:"#fff" }}><Ic.store style={{ width:20, height:20 }}/></div>}
        <div className="swatches" style={{ margin:0, justifyContent:"flex-start" }}>{sets.map((c, i) => (<span key={i} className={"swatch " + (c[0]===brand.color[0]?"sel":"")} style={{ background:`linear-gradient(135deg,${c[0]},${c[1]})` }} onClick={()=>setBrand(b=>({...b,color:c}))}></span>))}</div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile}/>
        <div className="bc-btns">
          <button className="reroll" onClick={()=>fileRef.current.click()}><Ic.upload style={{ width:14, height:14 }}/> {busy?tr(lang,"Reading…","读取中…"):tr(lang,"Logo","Logo")}</button>
          <button className="reroll" onClick={reroll}><Ic.refresh/> {tr(lang,"Shuffle","换色")}</button>
        </div>
      </div>
      {brand.logo && <div className="autocolor"><Ic.spark style={{ width:14, height:14 }}/> {tr(lang,"Colors picked from your logo","已从你的 logo 取色")}</div>}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink-2)" }}>{tr(lang,"Product photos","商品图")}</div>
        <input ref={prodRef} type="file" accept="image/*" multiple hidden onChange={onProducts}/>
        <button className="reroll" style={{ marginLeft:"auto" }} onClick={()=>prodRef.current.click()}><Ic.image style={{ width:14, height:14 }}/> {tr(lang,"Add photos","添加")}</button>
      </div>
      {(brand.products||[]).length>0 && <div className="thumbs-mini" style={{ justifyContent:"flex-start", marginTop:10 }}>{brand.products.map((u,i)=>(<span className="thumb-x" key={i}><img src={u} alt="" style={{ width:48, height:48 }}/><button onClick={()=>delProduct(i)} title={tr(lang,"Remove","删除")}>×</button></span>))}</div>}
    </div>
  );
}
function VoucherEditor({ vouchers, setVouchers, showStock }) {
  const lang = useLang();
  const upd = (i, k, v) => setVouchers(vs => vs.map((x,j)=> j===i ? {...x, [k]:v} : x));
  const add = () => setVouchers(vs => [...vs, { name:{en:"New voucher",zh:"新券"}, price:"", discount:{en:"",zh:""}, qty:100, awarded:0, perCust:1, image:null }]);
  const del = (i) => setVouchers(vs => vs.filter((_,j)=>j!==i));
  const onImg = (i, e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => upd(i, "image", rd.result); rd.readAsDataURL(f); };
  const total = vouchers.reduce((s,v)=>s+(+v.qty||0),0);
  return (
    <div className="editrow">
      <div className="k">{tr(lang,"Vouchers — name, price, discount & quantity","奖品券 —— 名称、原价、折扣、张数")}</div>
      <div className="vlist">
        {vouchers.map((v,i)=>(
          <div className="vcard" key={i}>
            <div className="vcard-top">
              <input className="vc-name" placeholder={tr(lang,"Prize name, e.g. Cappuccino","奖品名，如 卡布奇诺")} value={P(lang,v.name)} onChange={e=>upd(i,"name",{en:e.target.value,zh:e.target.value})}/>
              {showStock && <span className="vc-stock">{tr(lang,"issued ","已发 ")}{v.awarded}<span> · </span>{tr(lang,"left ","剩 ")}<b>{Math.max(0,(+v.qty||0)-(v.awarded||0))}</b></span>}
              <button className="vdel" onClick={()=>del(i)} title={tr(lang,"Remove","删除")}>x</button>
            </div>
            <div style={{ display:"flex", gap:10 }}>
            <div className="vc-grid" style={{ flex:1 }}>
              <label><span>{tr(lang,"Price","原价")}</span><input value={v.price||""} onChange={e=>upd(i,"price",e.target.value)} placeholder="S$6"/></label>
              <label><span>{tr(lang,"Discount","折扣")}</span><input value={P(lang,v.discount)} onChange={e=>upd(i,"discount",{en:e.target.value,zh:e.target.value})} placeholder={tr(lang,"Free / 1-for-1","免费 / 8折")}/></label>
              <label><span>{tr(lang,"Qty","张数")}</span><input className="num" type="number" min="1" value={v.qty} onChange={e=>upd(i,"qty",+e.target.value||0)}/></label>
              <label><span style={{ display:"flex", alignItems:"center", gap:3 }}>{tr(lang,"Validity","有效期")}<span title={tr(lang,"Days to redeem after winning the voucher","用户获得券后几天内可兑换")} style={{ width:14, height:14, borderRadius:"50%", border:"1.5px solid var(--muted-2)", display:"inline-grid", placeItems:"center", fontSize:9, fontWeight:800, color:"var(--muted-2)", cursor:"help" }}>?</span></span><input className="num" type="number" min="1" value={v.perCust} onChange={e=>upd(i,"perCust",+e.target.value||1)} placeholder={tr(lang,"days","天")}/></label>
            </div>
            {v.image
              ? <span className="thumb-x" style={{ flexShrink:0 }}><img src={v.image} alt="" style={{ width:64, height:64, borderRadius:10 }}/><button onClick={()=>upd(i,"image",null)} title={tr(lang,"Remove","删除")}>x</button></span>
              : <label style={{ width:64, height:64, borderRadius:10, border:"1.5px dashed var(--line)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, cursor:"pointer", flexShrink:0, color:"var(--muted-2)", fontSize:10, fontWeight:600 }}><Ic.image style={{ width:18, height:18 }}/>{tr(lang,"Photo","图片")}<input type="file" accept="image/*" hidden onChange={e=>onImg(i,e)}/></label>}
            </div>
          </div>
        ))}
      </div>
      <div className="vfoot"><button className="addrow" onClick={add}>+ {tr(lang,"Add voucher","添加券")}</button><span className="vtot">{tr(lang,"Total ","共 ")}<b>{total}</b>{tr(lang," vouchers"," 张")}</span></div>
      <p className="vnote">{tr(lang,"Each voucher is given out until its quantity runs out — no win-rate to set.","按张数自然发放，某券发完即停 —— 不用设中奖率。")}</p>
    </div>
  );
}
function OutletScope({ outlets, gameOutlets, setGameOutlets, setOutlets }) {
  const lang = useLang();
  const all = gameOutlets.length === outlets.length;
  const blank = { name:"", line1:"", city:"Singapore", postal:"" };
  const [adding, setAdding] = useState(false), [draft, setDraft] = useState(blank);
  const toggle = (id) => setGameOutlets(g => g.includes(id) ? g.filter(x=>x!==id) : [...g, id]);
  const toggleAll = () => setGameOutlets(all ? [] : outlets.map(o=>o.id));
  const save = () => {
    if (!draft.name.trim() || !draft.line1.trim()) return; // 店名 + 地址必填
    const id = "o"+Date.now();
    setOutlets(os => [...os, { id, name:{en:draft.name,zh:draft.name}, line1:draft.line1, city:draft.city, region:"", postal:draft.postal, country:0, primary:false }]);
    setGameOutlets(g => [...g, id]); setDraft(blank); setAdding(false);
  };
  return (
    <div className="editrow">
      <div className="k">{tr(lang,"Runs at which outlets","在哪些门店生效")}</div>
      <label className="ock"><input type="checkbox" checked={all} onChange={toggleAll}/><span><b>{tr(lang,"All outlets","全部门店")}</b></span></label>
      {outlets.map(o=>(
        <label className="ock" key={o.id}><input type="checkbox" checked={gameOutlets.includes(o.id)} onChange={()=>toggle(o.id)}/><span>{P(lang,o.name)} <em>· {o.city}</em></span></label>
      ))}
      {setOutlets && !adding && <button className="addrow" style={{ marginTop:8 }} onClick={()=>setAdding(true)}>+ {tr(lang,"Add outlet","添加门店")}</button>}
      {setOutlets && adding && (
        <div className="outlet-add">
          <input placeholder={tr(lang,"Outlet name · required","门店名称 · 必填")} value={draft.name} onChange={e=>setDraft(d=>({...d,name:e.target.value}))}/>
          <input placeholder={tr(lang,"Street address · required","街道地址 · 必填")} value={draft.line1} onChange={e=>setDraft(d=>({...d,line1:e.target.value}))}/>
          <div style={{ display:"flex", gap:8 }}>
            <input style={{ flex:1 }} placeholder={tr(lang,"City","城市")} value={draft.city} onChange={e=>setDraft(d=>({...d,city:e.target.value}))}/>
            <input style={{ flex:1 }} placeholder={tr(lang,"Postal","邮编")} value={draft.postal} onChange={e=>setDraft(d=>({...d,postal:e.target.value}))}/>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="reroll" onClick={()=>{ setAdding(false); setDraft(blank); }}>{tr(lang,"Cancel","取消")}</button>
            <button className="btn primary sm" disabled={!draft.name.trim()||!draft.line1.trim()} onClick={save}>{tr(lang,"Add outlet","添加")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
function Preview({ game, brand, setBrand, onLaunch, onBack }) {
  const lang = useLang();
  return (
    <div className="canvas wide">
      <div className="center" style={{ marginBottom:18 }}><div className="f-eye">{tr(lang,"Your game is ready","你的游戏，做好了")}</div><h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{tr(lang,"Try it, make it yours, publish when happy","试玩、换成你的品牌，满意就上线")}</h1></div>
      <div className="preview lite">
        <div className="demo-stage"><Demo game={game} brand={brand}/></div>
        <div>
          <div className="editbox">
            <BrandControls brand={brand} setBrand={setBrand} />
          </div>
          <p className="ph-sub" style={{ margin:"12px 2px 0" }}>{tr(lang,"Set up vouchers & outlets in your Activity after saving.","保存后在「活动」中设置奖品券和门店。")}</p>
          <div className="btn-row" style={{ marginTop:18 }}>
            {onBack && <button className="btn ghost lg" onClick={onBack}><Ic.back style={{ width:16, height:16 }}/> {tr(lang,"Back","上一步")}</button>}
            <button className="btn primary lg" onClick={onLaunch}><Ic.store style={{ width:18, height:18 }}/> {tr(lang,"Publish + print QR","上线 + 打印二维码")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
function Workspace({ game, brand, setBrand }) {
  const lang = useLang();
  const [msgs, setMsgs] = useState([{ who:"ai", text: tr(lang,"Hi! Tell me what to change — colors, style, difficulty. Or tap a suggestion below.","嗨！想改什么直接说——配色、风格、难度都行，也可以点下面的建议。") }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current && endRef.current.scrollIntoView({behavior:"smooth"}); }, [msgs]);
  const CHIPS = [{en:"Make it more festive",zh:"更有节日感"},{en:"Change the wheel to blue",zh:"转盘改成蓝色"},{en:"Make it brighter",zh:"更明亮一点"},{en:"Match my brand colors",zh:"套用我的品牌色"}];
  const push = (who, text) => setMsgs(m => [...m, { who, text }]);
  const reply = (txt) => {
    const t = (txt||"").toLowerCase();
    push("user", txt);
    setTimeout(() => {
      if (/festive|festival|节日|圣诞|新年/.test(t)) { setBrand(b=>({...b,color:["#B91C1C","#F59E0B"]})); push("ai", tr(lang,"Done — switched to a red & gold festive theme. Tap Undo up top to revert.","好了——换成红金节日配色。想还原点上方撤销。")); }
      else if (/blue|蓝/.test(t)) { setBrand(b=>({...b,color:["#0EA5E9","#38BDF8"]})); push("ai", tr(lang,"Changed the game to blue.","已把游戏改成蓝色。")); }
      else if (/brand|品牌|green|绿/.test(t)) { setBrand(b=>({...b,color:["#16A34A","#22C55E"]})); push("ai", tr(lang,"Applied your brand colors.","已套用你的品牌色。")); }
      else if (/voucher|coupon|券|买一送一|1-for-1|prize|奖/.test(t)) { push("ai", tr(lang,"Vouchers are managed in your Activity — head to Activities in the sidebar to add or change prizes.","奖品券在「活动」里管理 —— 去左侧栏的「活动」添加或修改奖品。")); }
      else { setBrand(b=>({...b,color: COLOR_SETS[Math.floor(Math.random()*COLOR_SETS.length)]})); push("ai", tr(lang,"Tweaked the look. Anything else?","调了下样式。还要改什么？")); }
    }, 480);
  };
  const send = () => { if (input.trim()) { reply(input.trim()); setInput(""); } };
  return (
    <div className="ws">
      <div className="ws-chat">
        <div className="ws-eye"><Ic.spark style={{ verticalAlign:"-3px", marginRight:5 }}/>{tr(lang,"AI · edit by chatting","AI · 对话改游戏")}</div>
        <div className="ws-msgs">
          {msgs.map((m,i)=>(<div key={i} className={"bubble "+m.who}>{m.text}</div>))}
          <div ref={endRef}/>
        </div>
        <div className="ws-chips">{CHIPS.map((c,i)=><button key={i} onClick={()=>reply(P(lang,c))}>{P(lang,c)}</button>)}</div>
        <div className="ws-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")send();}} placeholder={tr(lang,"Tell AI what to change…","告诉 AI 想改什么…")}/><button className="btn primary sm" onClick={send} aria-label="send"><Ic.arrow style={{width:16,height:16}}/></button></div>
      </div>
      <div className="ws-preview">
        <div className="ws-toolbar">
          <div className="ws-tools-l"><button className="ws-tool"><Ic.refresh style={{width:13,height:13}}/> {tr(lang,"Undo","撤销")}</button><button className="ws-tool">{tr(lang,"Redo","重做")}</button><button className="ws-tool">{tr(lang,"History","历史")}</button></div>
        </div>
        <div className="demo-stage" style={{ margin:0 }}><Demo game={game} brand={brand}/></div>
      </div>
      <div className="ws-controls">
        <div className="editbox" style={{ margin:0 }}>
          <BrandControls brand={brand} setBrand={setBrand} />
        </div>
      </div>
    </div>
  );
}
function Done({ game, brand, onRestart, onDash }) {
  const lang = useLang();
  return (
    <div className="canvas narrow">
      <div className="confetti">{Array.from({ length:60 }).map((_, i) => (<i key={i} style={{ left:Math.random()*100+"%", background:[brand.color[0],brand.color[1],"#F59E0B","#0EA5E9"][i%4], animationDuration:(1.6+Math.random()*1.4)+"s", animationDelay:(Math.random()*0.5)+"s" }}></i>))}</div>
      <div className="launchcard">
        <div className="done-hero"><div className="done-badge"><Ic.trophy/></div><div className="f-eye">{tr(lang,"LIVE","已上线")}</div><h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{tr(lang,`“${P(lang,game.name)}” is open for business`,`「${P(lang,game.name)}」开始营业了`)}</h1><p className="sub center">{tr(lang,"Stick this QR on your counter — customers scan to play.","把这张二维码贴在收银台，客人扫码就能玩。")}</p></div>
        <div style={{ display:"flex", gap:28, justifyContent:"center", alignItems:"center", flexWrap:"wrap", marginTop:26 }}>
          <div className="qr"><Ic.qr style={{ width:84, height:84, color:"#0B1220" }}/></div>
          <div style={{ textAlign:"left", maxWidth:280 }}><div style={{ fontSize:14, fontWeight:700, color:"var(--muted)" }}>{tr(lang,"How redemption works","核销流程")}</div><p style={{ fontSize:15, color:"var(--ink-2)", marginTop:8 }}>{tr(lang,"Winners show their ","客人赢奖后凭")}<b style={{ color:"var(--green-d)" }}>{tr(lang,"prize QR","奖品二维码")}</b>{tr(lang," in store; you scan it or ","到店，你手机一扫、或在后台")}<b style={{ color:"var(--green-d)" }}>{tr(lang,"swipe to redeem","滑动核销")}</b>{tr(lang," — only then it counts as a real walk-in."," —— 这一次才计入“真实到店”。")}</p></div>
        </div>
        <div className="btn-row" style={{ justifyContent:"center", marginTop:30 }}><button className="btn primary lg" onClick={onDash}>{tr(lang,"Go to my dashboard","进入我的后台")} <Ic.arrow/></button><button className="btn ghost lg" onClick={onRestart}>{tr(lang,"Make another game","再做一个游戏")}</button></div>
      </div>
    </div>
  );
}

/* ===================== dashboard ===================== */
function Kpi({ label, num, delta, up, note, spark }) {
  const mx = Math.max(...spark);
  return (
    <div className="kpi">
      <div className="kl">{label}</div>
      <div className="kn">{num}</div>
      <div className={"kd " + (up ? "up" : "down")}>{up ? <Ic.up/> : <Ic.down/>} {delta} <span className="ko">{note}</span></div>
      <div className="spark">{spark.map((v, i) => <i key={i} className={i === spark.length-1 ? "hi" : ""} style={{ height: (18 + v/mx*82) + "%" }}></i>)}</div>
    </div>
  );
}
const SB_ITEMS = [
  { id:"home",       icon:"home",      en:"Home",       zh:"主页" },
  { id:"activities", icon:"clipboard", en:"Activities", zh:"活动" },
  { id:"games",      icon:"gamepad",   en:"My games",   zh:"我的游戏" },
  { id:"redeem",     icon:"target",    en:"Redeem",     zh:"核销", badge:3 },
  { id:"reports",    icon:"chart",     en:"Reports",    zh:"数据" },
  { id:"me",         icon:"user",      en:"Me",         zh:"我的" },
];

function HomeView({ game, brand, onShare, onRecall, activities, onNewAct, onRedeem, onGoActivity }) {
  const lang = useLang();
  const [recalled, setRecalled] = useState(false);
  const [scanOk, setScanOk] = useState(false);
  const [scanning, setScanning] = useState(false);
  const doScan = () => { setScanning(true); setTimeout(() => { setScanning(false); setScanOk(true); setTimeout(() => setScanOk(false), 2800); }, 1700); };
  const liveAct = activities && activities.find(a => a.status === "live");
  const hasActs = activities && activities.length > 0;
  return (
    <div className="app-body">
      {!hasActs && <div className="panel" style={{ textAlign:"center", padding:"36px 24px", marginBottom:16 }}>
        <div style={{ marginBottom:12 }}><Ic.clipboard style={{ width:36, height:36, color:"var(--green-d)" }}/></div>
        <h4 style={{ fontSize:18, fontWeight:800, margin:"0 0 8px" }}>{tr(lang,"Create your first activity","创建你的第一个活动")}</h4>
        <p style={{ color:"var(--muted)", fontSize:14, margin:"0 0 20px", maxWidth:"32ch", marginLeft:"auto", marginRight:"auto" }}>{tr(lang,"Pick outlets, set vouchers, link a game — start bringing customers in.","选门店、设奖品券、绑游戏 —— 开始把客人带进店。")}</p>
        <button className="btn primary" onClick={onNewAct}>+ {tr(lang,"New activity","新建活动")}</button>
      </div>}
      <div className="home-hero">
        <div>
          {liveAct ? <span className="hl-live"><span className="b"></span>LIVE</span> : <span className="hl-live" style={{ background:"rgba(255,255,255,.1)", color:"#9fb0c4" }}>{tr(lang,"No live activity","暂无上线活动")}</span>}
          <h3>{P(lang, (liveAct || {}).name || game.name)} · {liveAct ? tr(lang,"up and running","正在跑") : tr(lang,"draft","草稿")}</h3>
          <div className="live3">
            <div className="lc"><div className="n">47</div><div className="l">{tr(lang,"plays today","今天玩了")}</div></div>
            <div className="lc"><div className="n">12</div><div className="l">{tr(lang,"walked in","到店")}</div></div>
            <div className="lc"><div className="n">9</div><div className="l">{tr(lang,"redeemed","已核销")}</div></div>
          </div>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div className="qr-sm"><Ic.qr style={{ width:60, height:60, color:"#0B1220" }}/></div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn primary sm" onClick={()=>{ const c=document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 24px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,90); ctx.font="13px sans-serif"; ctx.fillText(P(lang,(liveAct||{}).name||game.name),100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); }}><Ic.upload style={{ width:14, height:14, transform:"rotate(180deg)" }}/> {tr(lang,"Download","下载")}</button>
            {scanning
              ? <button className="btn white sm" disabled><span className="spin" style={{ width:11, height:11, borderColor:"rgba(22,163,74,.25)", borderTopColor:"var(--green)" }}></span> {tr(lang,"Scanning","扫描中")}</button>
              : scanOk
              ? <button className="btn white sm" style={{ color:"var(--green-d)" }}><Ic.check/> {tr(lang,"Done!","成功！")}</button>
              : <button className="btn white sm" onClick={onRedeem}><Ic.target style={{ width:14, height:14 }}/> {tr(lang,"Redeem","核销")}</button>}
          </div>
        </div>
      </div>
      <div className="home-grid">
        <div className="panel nudge">
          <h4 style={{ marginBottom:14 }}>{tr(lang,"Get your first wave playing","让第一波人玩起来")}</h4>
          <div className="nstep done"><span className="nt"><Ic.check/></span>{tr(lang,"Game created","游戏已创建")}</div>
          <div className="nstep cur"><span className="nt">2</span>{tr(lang,"Complete activity details","补充活动细节")}<button className="btn ghost sm na" onClick={onGoActivity}>{tr(lang,"Go","去完善")}</button></div>
          <div className="nstep"><span className="nt">3</span>{tr(lang,"Share & print the QR","分享游戏 · 打印二维码")}</div>
          <div className="nstep"><span className="nt">4</span>{tr(lang,"First customer redeems in store","第一位客人到店核销")}</div>
        </div>
        <div className="panel">
          <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent","最近")}</h4>
          {FEED.slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
        </div>
      </div>
      <div className={"recall" + (recalled ? " ok" : "")}>
        <span className="ri">{recalled ? <Ic.check/> : <Ic.bell/>}</span>
        {recalled
          ? <><div className="rt"><b>{tr(lang,"Win-back reminder sent to 18 regulars","召回通知已发送给 18 位老顾客")}</b><p>{tr(lang,"They've been nudged to come back — you'll see them walk in soon.","已提醒他们回店 —— 等他们回头来玩、来核销就行。")}</p></div></>
          : <><div className="rt"><b>{tr(lang,"18 regulars haven't visited in 30+ days","有 18 位老顾客，超过 30 天没来了")}</b><p>{tr(lang,"Send a one-tap win-back reminder — your easiest repeat business.","一键发送召回通知，把他们请回来 —— 这是你最容易赢回的复购。")}</p></div>
            <button className="btn primary lg" onClick={()=>setRecalled(true)}>{tr(lang,"Send reminder to 18","通知召回 18 人")}</button></>}
      </div>
      <button className="btn ghost lg" style={{ width:"100%", marginTop:16 }} onClick={onNewAct}>+ {tr(lang,"New activity","新建活动")}</button>
    </div>
  );
}

function MyGamesView({ game, onNew, onOpen }) {
  const lang = useLang();
  return (
    <div className="app-body">
      <div className="mygames">
        <div className="mgcard clickable" onClick={()=>onOpen(game)}>
          <div className="mgart"><GamePreview kind={game.kind} colors={game.g} /><span className="mglive" style={{ zIndex:6 }}><span className="b"></span>LIVE</span></div>
          <div className="mgmeta"><div className="nm">{P(lang,game.name)}</div><div className="st">{tr(lang,"312 plays · 86 walk-ins","312 次游玩 · 86 到店")}</div><div className="mgedit">{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></div></div>
        </div>
        <button className="mgnew" onClick={onNew}><span className="plus">+</span>{tr(lang,"New game","新建游戏")}</button>
      </div>
    </div>
  );
}

function RedeemView({ vouchers = DEFAULT_VOUCHERS, onReport }) {
  const lang = useLang();
  const [code, setCode] = useState(""), [ok, setOk] = useState(false), [scanning, setScanning] = useState(false);
  const success = () => { setOk(true); setCode(""); setTimeout(()=>setOk(false), 2800); };
  const submit = () => { if (code.trim().length >= 3) success(); };
  const scan = () => { setScanning(true); setTimeout(()=>{ setScanning(false); success(); }, 1700); };
  const reds = FEED.filter(f => f.ic === "gift");
  const totRedeemed = vouchers.reduce((s,v)=>s+(v.redeemed||0),0);
  const toCome = vouchers.reduce((s,v)=>s+Math.max(0,(v.awarded||0)-(v.redeemed||0)),0);
  return (
    <div className="app-body redeem-wrap">
      <div className="rd-left">
        <div className="redeem-card">
          <div className="ic-big"><Ic.target/></div>
          <h3>{tr(lang,"Redeem at the counter","到店核销")}</h3>
          <p>{tr(lang,"Scan the customer's prize QR — or type their code.","扫客人的奖品二维码 —— 或输入奖品码。")}</p>
          {scanning
            ? <div className="scanbox"><div className="scanline"></div><Ic.qr style={{ width:56, height:56, color:"#fff", opacity:.55 }}/><div className="scan-t">{tr(lang,"Point at the customer's QR…","对准客人的二维码…")}</div></div>
            : <button className="btn primary lg scanbtn" onClick={scan}><Ic.qr style={{ width:20, height:20 }}/> {tr(lang,"Scan QR to redeem","扫码核销")}</button>}
          <div className="redeem-or"><span>{tr(lang,"or enter the code","或 输入奖品码")}</span></div>
          <div className="redeem-input"><input value={code} onChange={e=>setCode(e.target.value)} placeholder={tr(lang,"prize code","奖品码")} onKeyDown={e=>{ if(e.key==="Enter") submit(); }}/><button className="btn primary" onClick={submit}>{tr(lang,"Redeem","核销")}</button></div>
          {ok && <div className="redeem-ok"><Ic.check/> {tr(lang,"Redeemed — counted as a real walk-in","核销成功 —— 已计入真实到店")}</div>}
        </div>
        <div className="panel">
          <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent redemptions","最近核销")}</h4>
          {reds.concat(reds).slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
        </div>
      </div>

      <div className="rd-right">
        {/* 简要概览 — 当下要瞄一眼的数；完整分析在「数据」页 */}
        <div className="rd-summary" style={{ marginTop:0 }}>
          <div className="rd-sum"><div className="n">9</div><div className="l">{tr(lang,"redeemed today","今日核销")}</div></div>
          <div className="rd-sum"><div className="n">{toCome}</div><div className="l">{tr(lang,"not yet redeemed","待核销")}</div></div>
          <div className="rd-sum"><div className="n">{totRedeemed}</div><div className="l">{tr(lang,"redeemed total","累计核销")}</div></div>
        </div>
        <div className="panel">
          <div className="panel-head"><h4 style={{ fontSize:16, fontWeight:800, margin:0 }}>{tr(lang,"Voucher status","奖品券核销")}</h4><button className="panel-link" onClick={onReport}>{tr(lang,"Full report","查看完整数据")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Redeemed / total issued · per-outlet & trends in Reports","已核销 / 总张数 · 各门店与趋势看「数据」")}</p>
          <div className="rd-list">
            {vouchers.map((v,i)=>{
              const cap=+v.qty||0, redeemed=v.redeemed||0;
              return (
                <div className="rd-row" key={i}>
                  <div className="rd-head"><span className="rd-name">{P(lang,v.name)} <em>· {P(lang,v.discount)}</em></span><span className="rd-frac"><b>{redeemed}</b>/{cap}</span></div>
                  <div className="rd-bar"><i className="rdR" style={{ width:(cap?redeemed/cap*100:0)+"%" }}></i></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== activities ===================== */
function ActivitiesView({ activities, onNew, onOpen }) {
  const lang = useLang();
  return (
    <div className="app-body">
      {activities.length === 0
        ? <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:48, marginBottom:16 }}><Ic.clipboard style={{ width:48, height:48, color:"var(--muted-2)" }}/></div>
            <h3 style={{ fontSize:20, fontWeight:800, margin:"0 0 8px" }}>{tr(lang,"No activities yet","还没有活动")}</h3>
            <p style={{ color:"var(--muted)", fontSize:15, margin:"0 0 24px" }}>{tr(lang,"Create your first activity — pick outlets, set vouchers, and link a game.","创建你的第一个活动 —— 选门店、设券、绑游戏。")}</p>
            <button className="btn primary lg" onClick={onNew}>+ {tr(lang,"New activity","新建活动")}</button>
          </div>
        : <div className="mygames">
            {activities.map(act => {
              const tpl = TEMPLATES.find(t => t.id === act.gameId) || TEMPLATES[0];
              return (
                <div key={act.id} className="mgcard clickable" onClick={() => onOpen(act)}>
                  <div className="mgart"><GamePreview kind={tpl.kind} colors={tpl.g} />{act.status === "live" && <span className="mglive" style={{ zIndex:6 }}><span className="b"></span>LIVE</span>}</div>
                  <div className="mgmeta">
                    <div className="nm">{P(lang, act.name)}</div>
                    <div className="st">{act.vouchers.length} {tr(lang,"vouchers","张券")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:8 }}>
                      <div className="mgedit">{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></div>
                      {act.status === "live" && <button className="btn ghost sm" onClick={(e)=>{ e.stopPropagation(); const c=document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 24px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,90); ctx.font="13px sans-serif"; ctx.fillText(P(lang,act.name),100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); }} style={{ padding:"6px 10px", fontSize:12.5 }}><Ic.upload style={{ width:12, height:12, transform:"rotate(180deg)" }}/> {tr(lang,"QR","二维码")}</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="mgnew" onClick={onNew}><span className="plus">+</span>{tr(lang,"New activity","新建活动")}</button>
          </div>}
    </div>
  );
}
function ActivityEditor({ activity, setActivity, outlets, setOutlets, myGames, onNewGame, onViewGame, onBack }) {
  const lang = useLang();
  const upd = (k, v) => setActivity(a => ({...a, [k]: v}));
  const live = activity.status === "live";
  const toggleLive = () => upd("status", live ? "offline" : "live");
  return (
    <div className="app-body" style={{ maxWidth:820 }}>
      <div className="panel">
        <h3>{tr(lang,"Activity name","活动名称")}</h3>
        <div className="field" style={{ margin:0 }}><input value={P(lang, activity.name)} onChange={e => upd("name",{en:e.target.value,zh:e.target.value})} placeholder={tr(lang,"e.g. Weekend Coffee Promo","例如：周末咖啡促销")} /></div>
        <div style={{ display:"flex", gap:12, marginTop:14 }}>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"Start date","开始日期")}</label><input type="date" value={activity.startDate||""} onChange={e=>upd("startDate",e.target.value)}/></div>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"End date","结束日期")}</label><input type="date" value={activity.endDate||""} onChange={e=>upd("endDate",e.target.value)}/></div>
        </div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <OutletScope outlets={outlets} gameOutlets={activity.outletIds} setGameOutlets={ids => upd("outletIds", ids)} setOutlets={setOutlets} />
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <VoucherEditor vouchers={activity.vouchers} setVouchers={vs => upd("vouchers", vs)} showStock />
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Game","游戏")}</h3>
        <p className="ph-sub">{myGames.length ? tr(lang,"Pick which game to use for this activity.","选一个游戏用在这个活动上。") : tr(lang,"You don't have a game yet — create one first.","你还没有游戏 —— 先新建一个。")}</p>
        <div className="mygames" style={{ marginTop:16 }}>
          {myGames.map(g => {
            const sel = activity.gameId === g.id;
            return (
              <div key={g.id} className={"mgcard" + (sel?" sel":"")}>
                <div className="mgart"><GamePreview kind={g.kind} colors={g.g} /></div>
                <div className="mgmeta">
                  <div className="nm">{P(lang, g.name)}</div>
                  <div className="st">{P(lang, g.tag)}</div>
                  <div style={{ display:"flex", gap:8, marginTop:10 }}>
                    <button className={sel ? "btn primary sm" : "btn ghost sm"} onClick={() => upd("gameId", g.id)}>{sel ? tr(lang,"Selected","已选择") : tr(lang,"Select","选择")}</button>
                    <button className="btn ghost sm" onClick={() => onViewGame && onViewGame(g)}>{tr(lang,"Details","查看详情")}</button>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="mgnew" onClick={onNewGame}><span className="plus">+</span>{tr(lang,"New game","新建游戏")}</button>
        </div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Activity QR code","活动二维码")}</h3>
        <p className="ph-sub">{tr(lang,"Customers scan this code to play your game and win vouchers.","客人扫这个码进入游戏，赢取奖品券。")}</p>
        {live
          ? <div style={{ display:"flex", alignItems:"center", gap:20, padding:"12px 0" }}>
              <div className="qr" style={{ width:100, height:100, borderRadius:14 }}><Ic.qr style={{ width:64, height:64, color:"#0B1220" }}/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, color:"var(--ink-2)", fontWeight:600 }}>{tr(lang,"Print this and stick it on your counter or door.","打印出来，贴在收银台或门口。")}</div>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button className="btn primary sm" onClick={() => { const c = document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 24px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,90); ctx.font="13px sans-serif"; ctx.fillText(P(lang,activity.name),100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); }}><Ic.upload style={{ width:14, height:14, transform:"rotate(180deg)" }}/> {tr(lang,"Download","下载")}</button>
                  <button className="btn ghost sm">{tr(lang,"Print","打印")}</button>
                </div>
              </div>
            </div>
          : <div style={{ display:"flex", alignItems:"center", gap:20, padding:"12px 0" }}>
              <div style={{ width:100, height:100, borderRadius:14, background:"#EAF1EE", display:"grid", placeItems:"center", color:"var(--muted-2)" }}><Ic.qr style={{ width:48, height:48 }}/></div>
              <div style={{ fontSize:14, color:"var(--muted)" }}>{tr(lang,"QR code will be generated once the activity goes live.","活动上线后自动生成二维码。")}</div>
            </div>}
      </div>
      <div style={{ display:"flex", gap:12, alignItems:"center", marginTop:24, justifyContent:"space-between" }}>
        <button className={"ws-publish " + (live?"on":"off")} style={{ padding:"14px 22px", fontSize:"15.5px" }} onClick={toggleLive}>{live ? tr(lang,"Take offline","下线活动") : tr(lang,"Go live","上线活动")}</button>
        <button className="btn primary" style={{ padding:"14px 22px", fontSize:"15.5px" }} onClick={onBack}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Save","保存")}</button>
      </div>
    </div>
  );
}

function ReportsView({ onTune, outlets = OUTLETS, vouchers = DEFAULT_VOUCHERS }) {
  const lang = useLang();
  const ranges = [{en:"Today",zh:"今天"},{en:"Last 7 days",zh:"近 7 天"},{en:"Last 30 days",zh:"近 30 天"}];
  const [ri, setRi] = useState(1);
  const tmax = Math.max(...TREND.map(t => t.v)), gmax = Math.max(...GAME_PERF.map(g => g.v));
  const note = tr(lang,"vs last week","比上周");
  // 各门店核销（mock：按权重把总核销分摊到门店）
  const totRed = vouchers.reduce((s,v)=>s+(v.redeemed||0),0);
  const sumW = outlets.reduce((s,_,i)=>s+(outlets.length-i),0);
  let acc = 0;
  const outRed = outlets.map((o,i)=>{ const v = i===outlets.length-1 ? totRed-acc : Math.round(totRed*(outlets.length-i)/sumW); acc += v; return { o, v }; });
  const omax = Math.max(1, ...outRed.map(x=>x.v));
  return (
    <div className="app-body">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:12, flexWrap:"wrap" }}>
        <p className="dash-sub" style={{ margin:0 }}>{tr(lang,`Only people who actually walked in — ${P(lang,ranges[ri])}.`,`只看真实走进门的人 —— ${P(lang,ranges[ri])}的数据。`)}</p>
        <div className="datepills">{ranges.map((r,i) => <button key={i} className={ri===i?"on":""} onClick={()=>setRi(i)}>{P(lang,r)}</button>)}</div>
      </div>
      <div className="kpis">
        <Kpi label={tr(lang,"Game plays","玩了游戏")} num="312" delta="+18%" up note={note} spark={[20,28,24,32,30,40,44]} />
        <Kpi label={tr(lang,"Verified walk-ins","到店核销")} num="86" delta="+24%" up note={note} spark={[5,7,6,9,8,11,13]} />
        <Kpi label={tr(lang,"New customers","新客到店")} num="61" delta="+31%" up note={note} spark={[3,5,4,7,6,9,11]} />
        <Kpi label={tr(lang,"Returning","回头客到店")} num="25" delta="+12%" up note={note} spark={[2,3,3,4,3,5,5]} />
      </div>
      <div className="panels">
        <div className="panel">
          <h3>{tr(lang,"Walk-ins per day","每天有多少人到店")}</h3>
          <p className="ph-sub">{tr(lang,`${P(lang,ranges[ri])} · played, then walked in and redeemed`,`${P(lang,ranges[ri])} · 扫码玩过、再走进门核销的人数`)}</p>
          <div className="bars7">{TREND.map((t, i) => (<div key={i} className="col"><div className="bv">{t.v}</div><div className="bar" style={{ height: (t.v/tmax*100) + "%" }}></div><div className="bd">{P(lang,t.d)}</div></div>))}</div>
        </div>
        <div className="panel">
          <h3>{tr(lang,"New vs returning","谁是新客，谁是回头客")}</h3>
          <p className="ph-sub">{tr(lang,"More returning = customers keep coming back","回头客越多，说明客人愿意一来再来")}</p>
          <div className="donut-wrap">
            <div className="donut" style={{ background:"conic-gradient(var(--green) 0 71%, var(--amber) 71% 100%)" }}><div className="hole"><b>86</b><span>{tr(lang,"walk-ins","到店")}</span></div></div>
            <div className="legend">
              <div className="lg"><span className="sw" style={{ background:"var(--green)" }}></span>{tr(lang,"New","新客")} <b>61</b> · 71%</div>
              <div className="lg"><span className="sw" style={{ background:"var(--amber)" }}></span>{tr(lang,"Returning","回头客")} <b>25</b> · 29%</div>
            </div>
          </div>
        </div>
      </div>
      <div className="panels">
        <div className="panel">
          <div className="panel-head"><h3>{tr(lang,"Which activity brings customers","哪个活动在帮你带客")}</h3><button className="panel-link" onClick={onTune}>{tr(lang,"Manage activities","管理活动")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Ranked by walk-ins — back the one that works","按带来的到店人数排序 —— 把预算押在最有效的那个")}</p>
          {GAME_PERF.map((g, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,g.n)}</span><span className="hv">{g.v} {tr(lang,"walk-ins","人到店")}</span></div><div className="ht"><i style={{ width:(g.v/gmax*100)+"%", background:g.c }}></i></div></div>))}
        </div>
        <div className="panel">
          <h3>{tr(lang,"Redeemed by outlet","各门店核销")}</h3>
          <p className="ph-sub">{tr(lang,"Which shop redeemed the most — voucher stock is shared across the game","哪家店核销最多 —— 库存为该游戏全门店共享")}</p>
          {outRed.map(({o,v}, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,o.name)}</span><span className="hv">{v} {tr(lang,"redeemed","张核销")}</span></div><div className="ht"><i style={{ width:(v/omax*100)+"%", background:"linear-gradient(90deg,#16A34A,#22C55E)" }}></i></div></div>))}
        </div>
      </div>
      <div className="panels">
        <div className="panel">
          <h3>{tr(lang,"Recent walk-ins","最近到店")}</h3>
          <p className="ph-sub">{tr(lang,"Live · redemptions & new customers","实时 · 核销与新客")}</p>
          {FEED.map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
        </div>
        <div className="panel">
          <h3>{tr(lang,"Voucher stock left","奖品券剩余")}</h3>
          <p className="ph-sub">{tr(lang,"Redeemed vs still to redeem vs left to win, per voucher","每张券：已核销 / 待核销 / 还可发")}</p>
          {vouchers.map((v,i)=>{ const cap=+v.qty||0, given=v.awarded||0, red=v.redeemed||0, come=Math.max(0,given-red); return (
            <div key={i} className="hbar"><div className="hl"><span>{P(lang,v.name)}</span><span className="hv">{red}/<b style={{color:"var(--ink)"}}>{cap}</b></span></div><div className="rd-bar" style={{ marginTop:2 }}><i className="rdR" style={{ width:(cap?red/cap*100:0)+"%" }}></i><i className="rdC" style={{ width:(cap?come/cap*100:0)+"%" }}></i></div></div>
          ); })}
        </div>
      </div>
    </div>
  );
}

function MeView({ brand, setBrand, outlets, setOutlets }) {
  const lang = useLang();
  const fileRef = useRef(null), [busy, setBusy] = useState(false);
  const [name, setName] = useState("Kopi Corner"), [phone, setPhone] = useState("9123 4567");
  const onLogo = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setBusy(true); const rd = new FileReader(); rd.onload = async () => { const url = rd.result; const rgb = await extractColor(url); setBrand(b => ({ ...b, logo:url, logoMark:null, color: rgb ? paletteFromRgb(rgb) : b.color })); setBusy(false); }; rd.readAsDataURL(f); };
  const onProducts = (e) => { const fs = Array.from(e.target.files || []).slice(0,8); Promise.all(fs.map(f => new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f); }))).then(urls => setBrand(b => ({ ...b, products:[...(b.products||[]), ...urls].slice(0,8) }))); };
  const hasBrand = brand.logo || brand.logoMark;
  const updO = (i, k, v) => setOutlets(os => os.map((o,j)=> j===i ? {...o,[k]:v} : o));
  const addO = () => setOutlets(os => [...os, { id:"o"+(os.length+1)+Date.now(), name:{en:"New outlet",zh:"新店铺"}, line1:"", city:"Singapore", region:"", postal:"", country:0, primary:false }]);
  const delO = (i) => setOutlets(os => os.filter((_,j)=>j!==i));
  return (
    <div className="app-body" style={{ maxWidth:820 }}>
      <div className="panel">
        <h3>{tr(lang,"Account","账户")}</h3>
        <p className="ph-sub">{tr(lang,"Your business name and contact — used across games and receipts.","商家名称与联系方式 —— 用在游戏与凭证上。")}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div className="field"><label>{tr(lang,"Business name","商家名称")} <span className="req">*</span></label><input value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="field"><label>{tr(lang,"Mobile (WhatsApp)","手机号（WhatsApp）")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><input value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        </div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Outlets","店铺")}</h3>
        <p className="ph-sub">{tr(lang,"Your physical shops — name & address required, phone optional. A game can run at one, some, or all of them.","你的实体门店 —— 店名与地址必填、电话选填。一个游戏可对一家 / 多家 / 全部门店生效。")}</p>
        {outlets.map((o,i)=>(
          <div className="outlet-card" key={o.id}>
            <div className="oc-head">
              <span className="oc-pin"><Ic.pin/></span>
              <input className="oc-name" value={P(lang,o.name)} onChange={e=>updO(i,"name",{en:e.target.value,zh:e.target.value})}/>
              {o.primary && <span className="oc-tag">{tr(lang,"Primary","主店")}</span>}
              {!o.primary && <button className="vdel" onClick={()=>delO(i)} title={tr(lang,"Remove","删除")}>×</button>}
            </div>
            <div className="oc-grid">
              <input className="oc-full" placeholder={tr(lang,"Street address (Block, street, unit) · required","街道地址（门牌、街道、单位）· 必填")} value={o.line1} onChange={e=>updO(i,"line1",e.target.value)}/>
              <input placeholder={tr(lang,"City","城市")} value={o.city} onChange={e=>updO(i,"city",e.target.value)}/>
              <input placeholder={tr(lang,"Postal code","邮政编码")} value={o.postal} onChange={e=>updO(i,"postal",e.target.value)}/>
              <select value={o.country} onChange={e=>updO(i,"country",+e.target.value)}>{COUNTRIES.map((c,j)=><option key={j} value={j}>{c.flag} {P(lang,c)}</option>)}</select>
              <input className="oc-full" placeholder={tr(lang,"Phone (optional)","门店电话（选填）")} value={o.phone||""} onChange={e=>updO(i,"phone",e.target.value)}/>
            </div>
          </div>
        ))}
        <button className="addrow" onClick={addO}>+ {tr(lang,"Add outlet","添加店铺")}</button>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Brand kit","品牌素材库")}</h3>
        <p className="ph-sub">{tr(lang,"Your logo, colors and product photos — auto-applied when you build a game.","你的 logo、品牌色和商品图 —— 建游戏时自动套用。")}</p>
        <div style={{ display:"flex", gap:16, alignItems:"center", flexWrap:"wrap" }}>
          {brand.logo ? <img className="preview-logo" src={brand.logo} alt="" style={{ margin:0 }}/> : <div style={{ width:54, height:54, borderRadius:14, background:hasBrand?brand.color[0]:"#EAF1EE", color:"#fff", display:"grid", placeItems:"center", fontSize:24 }}>{brand.logoMark || <Ic.store style={{ width:26, height:26 }}/>}</div>}
          <div>
            <div style={{ fontWeight:700, fontSize:15 }}>{tr(lang,"Logo & brand colors","品牌 Logo 与配色")}</div>
            <div className="swatches" style={{ margin:"8px 0 0", justifyContent:"flex-start" }}>{brand.color.map((c,i)=><span key={i} className="swatch" style={{ background:c }}></span>)}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onLogo}/>
          <button className="btn ghost sm" style={{ marginLeft:"auto" }} onClick={()=>fileRef.current.click()}>{busy ? tr(lang,"Reading…","读取中…") : tr(lang,"Upload logo","上传 Logo")}</button>
        </div>
        <div style={{ marginTop:18, paddingTop:18, borderTop:"1px solid var(--line-2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ fontWeight:700, fontSize:15 }}>{tr(lang,"Product photos","商品图")}</div><input id="me-prod" type="file" accept="image/*" multiple hidden onChange={onProducts}/><button className="btn ghost sm" style={{ marginLeft:"auto" }} onClick={()=>document.getElementById("me-prod").click()}>{tr(lang,"Add photos","添加图片")}</button></div>
          <div className="thumbs-mini" style={{ justifyContent:"flex-start", marginTop:12 }}>
            {(brand.products||[]).map((u,i)=><img key={i} src={u} alt="" style={{ width:60, height:60 }}/>)}
            {(!brand.products || !brand.products.length) && <div className="vmini">{tr(lang,"No photos yet — add a few so games look like your shop.","还没有商品图 —— 加几张，游戏更像你的店。")}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppShell({ game, brand, setBrand, lang, setLang, sec, setSec, onNewGame, onExit, builder, builderIdx, builderSteps, onLeaveBuild, outlets, setOutlets, activities, setActivities, myGames, initEdit }) {
  const [editing, setEditing] = useState(initEdit || null);
  const [editingAct, setEditingAct] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const inBuild = !!builder;
  const cur = SB_ITEMS.find(i => i.id === sec) || SB_ITEMS[0];
  const navClick = (id) => { setEditing(null); setEditingAct(null); inBuild ? onLeaveBuild(id) : setSec(id); };
  const inEdit = !inBuild && !!editing;
  const inActEdit = !inBuild && !inEdit && !!editingAct;
  const primary = outlets.find(o => o.primary) || outlets[0] || {};
  const shopName = (P(lang, primary.name || {en:"My shop",zh:"我的店"}) || "").split("·")[0].trim() || tr(lang,"My shop","我的店");
  const outletLabel = (o) => { const parts = (P(lang,o.name)||"").split("·"); return (parts[1]||"").trim() || o.city || P(lang,o.name); };
  const outletsLine = outlets.length >= 2 ? `${outlets.length} ${tr(lang,"outlets","家门店")}` : (primary.name ? outletLabel(primary) : "");
  const avatar = brand.logo ? <img className="sb-avatar" src={brand.logo} alt=""/> : <div className="sb-avatar ph">{shopName.slice(0,1) || "K"}</div>;
  const goMe = () => { setMenuOpen(false); setEditing(null); setEditingAct(null); setSec("me"); };
  const liveAct = activities.find(a => a.status === "live");
  const actVouchers = liveAct ? liveAct.vouchers : DEFAULT_VOUCHERS;
  const openAct = (act) => { setEditingAct({...act, vouchers:act.vouchers.map(v=>({...v}))}); };
  const newAct = () => { openAct({ id:"a"+Date.now(), name:{en:"New activity",zh:"新活动"}, outletIds:outlets.map(o=>o.id), vouchers:STARTER_VOUCHERS.map(v=>({...v})), gameId:(myGames[0]||TEMPLATES[0]).id, status:"draft" }); };
  const saveAct = () => { setActivities(as => { const idx = as.findIndex(a=>a.id===editingAct.id); return idx>=0 ? as.map((a,i)=>i===idx?editingAct:a) : [...as, editingAct]; }); setEditingAct(null); };
  const barTitle = inBuild ? tr(lang,"New game","新建游戏")
    : inEdit ? <><button className="iconx sm" onClick={()=>setEditing(null)} style={{ marginRight:10, verticalAlign:"middle" }}><Ic.back/></button>{P(lang,editing.name)}</>
    : inActEdit ? <><button className="iconx sm" onClick={()=>setEditingAct(null)} style={{ marginRight:10, verticalAlign:"middle" }}><Ic.back/></button>{P(lang,editingAct.name)}</>
    : P(lang,cur);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sb-id">{avatar}<div className="sb-idtxt"><div className="sb-name">{shopName}</div><div className="sb-outlet">{outletsLine}</div></div></div>
        <nav className="sb-nav">{SB_ITEMS.map(it => (
          <button key={it.id} className={"sb-item " + (!inBuild && !inEdit && !inActEdit && sec===it.id?"on":"")} onClick={()=>navClick(it.id)}>
            <span className="si">{Ic[it.icon] && Ic[it.icon]()}</span>{P(lang,it)}{it.badge && (inBuild || inEdit || inActEdit || sec!==it.id) && <span className="nbadge">{it.badge}</span>}
          </button>))}</nav>
        <div className="sb-bottom">
          <LangToggle lang={lang} setLang={setLang} />
          <div className="sb-kix"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-bar">
          <h2>{barTitle}</h2>
          {inBuild && <Stepper idx={builderIdx} steps={builderSteps} />}
          {inEdit && <span className="edit-live"><span className="b"></span>{tr(lang,"Editing","编辑中")}</span>}
          {inActEdit && (editingAct.status === "live"
            ? <span className="edit-live"><span className="b"></span>{tr(lang,"Live","已上线")}</span>
            : editingAct.status === "offline"
            ? <span className="edit-live" style={{ background:"#FEF2F2", color:"#DC2626" }}>{tr(lang,"Offline","已下线")}</span>
            : <span className="edit-live" style={{ background:"#F1F5F3", color:"var(--muted)" }}>{tr(lang,"Draft","未上线")}</span>)}
          <div className="app-bar-r">
            <div className="acct">
              <button className="acct-btn" onClick={()=>setMenuOpen(v=>!v)}>{avatar}<span className="acct-name">{shopName}</span><Ic.down style={{ width:13, height:13 }}/></button>
              {menuOpen && <><div className="acct-backdrop" onClick={()=>setMenuOpen(false)}/>
                <div className="acct-menu">
                  <div className="am-head">{avatar}<div><div className="sb-name">{shopName}</div><div className="sb-outlet">{P(lang, primary.name||{en:"",zh:""})}</div></div></div>
                  <button className="am-item" onClick={goMe}><Ic.user style={{ width:17, height:17 }}/>{tr(lang,"Account settings","账户设置")}</button>
                  <button className="am-item" onClick={goMe}><Ic.store style={{ width:17, height:17 }}/>{tr(lang,"Outlets","店铺管理")}</button>
                  <button className="am-item" onClick={()=>setMenuOpen(false)}><Ic.spark style={{ width:17, height:17 }}/>{tr(lang,"Billing & plan","账单与套餐")}</button>
                  <button className="am-item danger" onClick={onExit}><Ic.logout style={{ width:17, height:17 }}/>{tr(lang,"Log out","退出登录")}</button>
                </div></>}
            </div>
          </div>
        </div>
        {inBuild ? <div className="stage" style={{ padding:"22px 28px 60px" }}>{builder}</div>
          : inEdit ? <Workspace game={editing} brand={brand} setBrand={setBrand} />
          : inActEdit ? <ActivityEditor activity={editingAct} setActivity={setEditingAct} outlets={outlets} setOutlets={setOutlets} myGames={myGames} onNewGame={()=>{ setEditingAct(null); onNewGame(); }} onViewGame={(g)=>{ setEditing(g); }} onBack={saveAct} />
          : sec === "home" ? <HomeView game={game} brand={brand} onShare={()=>setSec("redeem")} onRecall={()=>setSec("reports")} activities={activities} onNewAct={newAct} onRedeem={()=>setSec("redeem")} onGoActivity={()=>{ const first = activities[0]; if (first) openAct(first); else { setSec("activities"); } }} />
          : sec === "activities" ? <ActivitiesView activities={activities} onNew={newAct} onOpen={openAct} />
          : sec === "games" ? <MyGamesView game={game} onNew={onNewGame} onOpen={(g)=>setEditing(g)} />
          : sec === "redeem" ? <RedeemView vouchers={actVouchers} onReport={()=>setSec("reports")} />
          : sec === "me" ? <MeView brand={brand} setBrand={setBrand} outlets={outlets} setOutlets={setOutlets} />
          : <ReportsView onTune={()=>setSec("activities")} outlets={outlets} vouchers={actVouchers} />}
      </main>
    </div>
  );
}

/* ===================== app ===================== */
/* one narrated loader = matching + generating fused (Buell & Norton labor-illusion: visible work feels valuable) */
const BUILD_TASKS = [{en:"Reading your business",zh:"读懂你的生意"},{en:"Matching from 1,012 templates",zh:"从 1,012 个模板里匹配"},{en:"Drafting game boards",zh:"草拟游戏玩法"},{en:"Applying your brand colors",zh:"套用你的品牌色"},{en:"Generating vouchers & codes",zh:"生成奖品券与核销码"}];
const STEP_IDX = { describe:0, building:0, results:1, preview:2, done:2 };       // first-run 3 步
const STEP_IDX_RET = { describe:0, building:0, results:0, preview:1, done:1 };   // 登录后 2 步

function App() {
  const _p = new URLSearchParams(location.search);
  const initScreen = _p.get("screen") || "landing";
  const [lang, setLang] = useState((_p.get("lang") === "zh") ? "zh" : "en");
  const [screen, setScreen] = useState(initScreen);
  const [authed, setAuthed] = useState(_p.get("authed") === "1" || ["app","dashboard"].includes(initScreen));
  const [appSec, setAppSec] = useState(_p.get("sec") || (initScreen === "dashboard" ? "reports" : "home"));
  const [need, setNeed] = useState("");
  const [site, setSite] = useState("");
  const [game, setGame] = useState(TEMPLATES[0]);
  const [brand, setBrand] = useState({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] });
  const [outlets, setOutlets] = useState(OUTLETS.map(o => ({ ...o })));
  const [myGames, setMyGames] = useState([TEMPLATES[0]]);
  const [activities, setActivities] = useState(DEFAULT_ACTIVITIES.map(a => ({...a, vouchers:a.vouchers.map(v=>({...v}))})));

  const top = () => window.scrollTo(0,0);
  const toLanding = () => { setScreen("landing"); top(); };
  const enterApp = (sec) => { if (sec) setAppSec(sec); setScreen("app"); top(); };
  const startBuild = () => { setNeed(""); setSite(""); setGame(TEMPLATES[0]); setBrand({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] }); setScreen(authed ? "results" : "describe"); top(); };
  const toPublishGate = () => { setScreen("register"); top(); };
  const backToPreview = () => { setScreen("preview"); top(); };
  const publishDone = () => {
    setAuthed(true);
    if (!myGames.find(g => g.id === game.id)) setMyGames(gs => [...gs, game]);
    const newAct = { id:"a"+Date.now(), name:game.name, outletIds:outlets.map(o=>o.id), vouchers:STARTER_VOUCHERS.map(v=>({...v})), gameId:game.id, status:"live" };
    setActivities(as => [...as, newAct]);
    setScreen("done"); top();
  };
  const signIn = () => { setScreen("login"); top(); };
  const loginDone = () => { setAuthed(true); setAppSec("home"); setScreen("app"); top(); };
  const exitBuild = () => { authed ? enterApp(appSec) : toLanding(); };

  const buildTasks = BUILD_TASKS.map(t => P(lang,t));

  let flowStep = null;
  if (screen === "describe") flowStep = <Describe need={need} setNeed={setNeed} site={site} setSite={setSite} setBrand={setBrand} onNext={()=>setScreen("building")} />;
  else if (screen === "building") flowStep = <div className="canvas narrow"><Loader title={tr(lang,"Building your games","正在生成你的游戏")} who={need || tr(lang,"your shop","你的店")} tasks={buildTasks} onDone={()=>setScreen("results")} /></div>;
  else if (screen === "results") flowStep = <Results need={need} onPick={t=>{ setGame(t); setScreen("preview"); top(); }} onBack={()=> authed ? enterApp(appSec) : setScreen("describe")} />;
  else if (screen === "preview") flowStep = <Preview game={game} brand={brand} setBrand={setBrand} onLaunch={authed ? publishDone : toPublishGate} onBack={()=>{ setScreen("results"); top(); }} />;

  const shellProps = { game, brand, setBrand, lang, setLang, sec:appSec, setSec:setAppSec, onExit:toLanding, outlets, setOutlets, activities, setActivities, myGames };

  let body;
  if (screen === "landing") body = <Landing go={startBuild} onSignIn={signIn} lang={lang} setLang={setLang} />;
  else if (screen === "register") body = (
    <div className="shell">
      <div className="topbar"><div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div><LangToggle lang={lang} setLang={setLang} style={{ marginLeft:"auto" }} /><button className="iconx" onClick={backToPreview} title={tr(lang,"Back to editing","返回继续编辑")}><Ic.back/></button></div>
      <Register onDone={publishDone} onSignIn={signIn} />
    </div>
  );
  else if (screen === "login") body = (
    <div className="shell">
      <div className="topbar"><div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div><LangToggle lang={lang} setLang={setLang} style={{ marginLeft:"auto" }} /><button className="iconx" onClick={toLanding} title={tr(lang,"Back","返回")}><Ic.back/></button></div>
      <Login onDone={loginDone} />
    </div>
  );
  else if (screen === "app" || screen === "dashboard") body = <AppShell {...shellProps} onNewGame={startBuild} initEdit={_p.get("edit")==="1" ? game : null} />;
  else if (screen === "done") body = (
    <div className="shell">
      <div className="topbar"><div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div><div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}><LangToggle lang={lang} setLang={setLang} /><button className="ghost-x" onClick={()=>authed ? enterApp("home") : toLanding()}>{tr(lang,"Exit","退出")}</button></div></div>
      <div className="stage"><Done game={game} brand={brand} onRestart={startBuild} onDash={()=>enterApp("home")} /></div>
    </div>
  );
  else if (authed)
    body = <AppShell {...shellProps} onNewGame={startBuild} onExit={exitBuild} builder={flowStep} builderIdx={STEP_IDX_RET[screen]} builderSteps={STEPS_RET} onLeaveBuild={enterApp} />;
  else
    body = (
    <div className="shell">
      <div className="topbar">
        <div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div>
        <Stepper idx={STEP_IDX[screen]} />
        <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button className="ghost-x" onClick={toLanding}>{tr(lang,"Exit","退出")}</button>
        </div>
      </div>
      <div className="stage">{flowStep}</div>
    </div>
  );

  return <LangCtx.Provider value={lang}>{body}</LangCtx.Provider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
