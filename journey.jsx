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
const STEPS_RET = [{en:"Pick a game",zh:"选游戏"},{en:"Edit game",zh:"修改游戏"}]; // 登录后建游戏：免描述，2 步
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
          <button className="btn ghost lg" onClick={()=>document.getElementById("gallery-sec")?.scrollIntoView({behavior:"smooth"})}>{tr(lang,"See sample games","看游戏样片")}</button>
        </div>
        <div className="proof">
          <div className="tagm">{tr(lang,"An ice-cream shop","某冰激凌店")}</div>
          <div className="stat"><div className="n"><b>48%</b></div><div className="l">{tr(lang,"walk-in rate","到店率")}</div></div>
          <div className="stat-sep"></div>
          <div className="stat"><div className="n">1,500</div><div className="l">{tr(lang,"new customers","新客到店")}</div></div>
          <div className="stat-sep"></div>
          <div className="stat"><div className="n"><b>29%</b></div><div className="l">{tr(lang,"win-back rate","老客召回复购")}</div></div>
        </div>
      </div>
      <div className="visual">
        <div className="vid-ph"></div>
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
      <p className="sec-sub">{tr(lang,"No ad skills, no hardware.","不用懂投放，不用装设备。")}</p>
      <div className="three">
        <div className="tcard"><div className="tnum">{tr(lang,"01 · ACQUIRE","01 · 拉新客")}</div><h3>{tr(lang,"Passers-by play their way in","路过的人，玩着玩着就进店")}</h3><p>{tr(lang,"Nearby people play your game and win a voucher to walk in.","附近的人扫码玩你的游戏、赢券进店。")}</p>
          <div className="viz"><div className="vrow"><span className="vp" style={{ background:"var(--green-50)", color:"var(--green-d)" }}><Ic.pin/></span>{tr(lang,"Within 300m · office · walked in","300m 内 · 上班族 · 已到店")}</div><div className="vrow"><span className="vp" style={{ background:"#FFF3DA", color:"var(--amber)" }}><Ic.pin/></span>{tr(lang,"Within 500m · student · played","500m 内 · 学生 · 玩了一把")}</div></div></div>
        <div className="tcard"><div className="tnum">{tr(lang,"02 · RETAIN","02 · 召回老客")}</div><h3>{tr(lang,"Bring regulars back automatically","老顾客太久没来，自动请回来")}</h3><p>{tr(lang,"Members who haven't visited in 30 days get an auto voucher to come back.","30 天没到店的会员，自动发一张券请回来。")}</p>
          <div className="viz"><div className="vrow"><span className="vp" style={{ background:"#EEF1FF", color:"#4F46E5" }}><Ic.bell/></span>{tr(lang,"Miss you — here's a free coffee","想你了，送你一杯免费咖啡")}</div><div className="vbignum"><b>29%</b> <span className="vmini">{tr(lang,"win-back rate","召回复购率")}</span></div></div></div>
        <div className="tcard"><div className="tnum">{tr(lang,"03 · ZERO WASTE","03 · 零浪费")}</div><h3>{tr(lang,"Not like burning cash on ads","不像投广告那样烧钱")}</h3><p>{tr(lang,"No impressions, no clicks, no wasted budget. You only pay when a customer actually walks through your door.","不为曝光付费，不为点击付费。客人真正走进你的店，才算一次。")}</p>
          <div className="viz"><div className="vbignum"><b>S$0</b> <span className="vmini">{tr(lang,"for views & clicks","曝光和点击的花费")}</span></div><div className="vbar"><i style={{ width:"100%" }}></i></div><div className="vmini">{tr(lang,"vs traditional ads: 90% of budget wasted on non-visitors","传统广告：90% 预算花在不会来的人身上")}</div></div></div>
      </div>
    </section>
  );
}
function Gallery({ go }) {
  const lang = useLang();
  return (
    <section className="sec" id="gallery-sec">
      <div className="sec-eye">{tr(lang,"SAMPLE GAMES","游戏样片")}</div>
      <h2 className="sec-h">{tr(lang,"1,000+ formats — every one becomes your brand","上千种玩法，每个都能变成你的品牌")}</h2>
      <p className="sec-sub">{tr(lang,"Coffee, bubble tea, nails, snacks — there's a fit for every shop.","咖啡、奶茶、美甲、小吃…都有适配的玩法。")}</p>
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
      <div className="sec-eye">{tr(lang,"HOW IT WORKS","三步上线")}</div><h2 className="sec-h">{tr(lang,"Three steps to open for business","三步做好，开门收客")}</h2>
      <div className="steps">{S.map((s, i) => (<div key={i} className="stp"><div className="sn">0{i+1}</div><div className="si">{s.i()}</div><h3>{s.h}</h3><p>{s.p}</p></div>))}</div>
    </section>
  );
}
function Pricing({ go }) {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"PRICING","价格")}</div><h2 className="sec-h">{tr(lang,"Start free. Pay only when they walk in.","免费开始，到店才计费")}</h2>
      <div className="tiers">
        <div className="tier"><div className="tname">{tr(lang,"FREE","免费版")}</div><div className="price">S$0</div><div className="pdesc">{tr(lang,"Never charged. Get your first game running.","永不扣款，先把第一个游戏跑起来。")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"1 game","1 个游戏")}</li><li><span className="ck"><Check/></span>{tr(lang,"50 walk-ins / month","每月 50 位到店")}</li><li><span className="ck"><Check/></span>{tr(lang,"Redemption + basic dashboard","到店核销 + 基础看板")}</li></ul>
          <button className="btn ghost" onClick={go}>{tr(lang,"Start free","免费开始")}</button></div>
        <div className="tier pop"><div className="pbadge">{tr(lang,"Most popular","最受欢迎")}</div><div className="tname">{tr(lang,"PRO","专业版")}</div><div className="price">S$49<small>/mo</small></div><div className="pdesc">{tr(lang,"Unlimited campaigns, or pay S$3 per walk-in.","不限活动，或按 S$3 / 到店 用多少付多少。")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"Unlimited games & campaigns","不限游戏与活动")}</li><li><span className="ck"><Check/></span>{tr(lang,"Auto win-back for regulars","老客自动召回")}</li><li><span className="ck"><Check/></span>{tr(lang,"Multi-outlet · walk-in attribution","多门店 · 到店归因")}</li></ul>
          <button className="btn primary" onClick={go}>{tr(lang,"Get started","立即开始")}</button></div>
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
        <div className="navlinks"><a onClick={(e)=>e.preventDefault()} href="#">{tr(lang,"Showcase","样片")}</a><a onClick={(e)=>e.preventDefault()} href="#">{tr(lang,"How it works","怎么用")}</a><a onClick={(e)=>e.preventDefault()} href="#">{tr(lang,"Pricing","价格")}</a></div>
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
function Describe({ need, setNeed, onNext }) {
  const lang = useLang();
  // 第一步只选店型（拿到匹配玩法所需的意图即可）；品牌化在第三步做，这里不取品牌、不要店名
  const pick = (ex) => setNeed(P(lang,ex));
  return (
    <div className="canvas narrow describe-wrap">
      <div className="center">
        <div className="f-eye">{tr(lang,"Step 1 · 30 seconds to build your game","第 1 步 · 30 秒搭好你的游戏")}</div>
        <h1 className="big">{tr(lang,"What game do you want to make today?","今天想做什么游戏？")}</h1>
        <p className="sub">{tr(lang,"Pick your shop type — AI matches the best game.","选你的店型，AI 帮你挑最合适的玩法。")}</p>
      </div>
      <div className="bigfield"><input autoFocus value={need} placeholder={tr(lang,"e.g. a corner coffee shop","例如：街角的一家咖啡店")} onChange={e=>setNeed(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&need.trim())onNext(); }}/></div>
      <div className="chips">{EXAMPLES.map((ex,i) => (<button key={i} className="chip" onClick={()=>pick(ex)}><span className="pre">{tr(lang,"try","试试")}</span>{P(lang,ex)}</button>))}</div>
      <div className="btn-row"><button className="btn primary lg" disabled={!need.trim()} onClick={onNext}>{tr(lang,"Match games","匹配游戏")} <Ic.arrow/></button></div>
    </div>
  );
}
function Results({ need, onPick, onBack }) {
  const lang = useLang();
  return (
    <div className="canvas">
      <div className="results-head"><div><div className="f-eye">{tr(lang,"Tap any to try it","点开任意一款即可试玩")}</div><h1>{tr(lang,"8 games for ","为")}<b>{tr(lang,'"','「')}{need || tr(lang,"your shop","你的店")}{tr(lang,'"','」')}</b>{tr(lang,"","挑了 8 款")}</h1></div><button className="relink" onClick={onBack}><Ic.back style={{ width:14, height:14, verticalAlign:"-2px" }}/> {tr(lang,"Back","返回")}</button></div>
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
function BrandControls({ brand, setBrand, noProducts }) {
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
      <div className="bc-site"><Ic.spark style={{ width:14, height:14, flex:"none", color:"var(--green-d)" }}/><input value={brand.site||""} onChange={e=>setBrand(b=>({...b,site:e.target.value}))} placeholder={tr(lang,"Website or social (optional) — we'll pull your logo & colors","网站或社媒（选填）—— 自动取 logo 和配色")}/></div>
      {!noProducts && <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14 }}>
        <div style={{ fontSize:13.5, fontWeight:600, color:"var(--ink-2)" }}>{tr(lang,"Product photos","商品图")}</div>
        <input ref={prodRef} type="file" accept="image/*" multiple hidden onChange={onProducts}/>
        <button className="reroll" style={{ marginLeft:"auto" }} onClick={()=>prodRef.current.click()}><Ic.image style={{ width:14, height:14 }}/> {tr(lang,"Add photos","添加")}</button>
      </div>}
      {!noProducts && (brand.products||[]).length>0 && <div className="thumbs-mini" style={{ justifyContent:"flex-start", marginTop:10 }}>{brand.products.map((u,i)=>(<span className="thumb-x" key={i}><img src={u} alt="" style={{ width:48, height:48 }}/><button onClick={()=>delProduct(i)} title={tr(lang,"Remove","删除")}>×</button></span>))}</div>}
    </div>
  );
}
function VoucherEditor({ vouchers, setVouchers, showStock }) {
  const lang = useLang();
  // 目前一个活动只发一种券：取第一张，无添加/删除、无有效期
  const v = vouchers[0] || { name:{en:"",zh:""}, price:"", discount:{en:"",zh:""}, qty:100, awarded:0, image:null, codeSource:"auto", codeFile:null };
  const upd = (k, val) => setVouchers(vs => { const a = vs.length ? vs.slice() : [v]; a[0] = { ...a[0], [k]:val }; return a; });
  const onImg = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => upd("image", rd.result); rd.readAsDataURL(f); };
  // 点「上传自有券码」直接弹文件选择器；选完切到 custom 并记录文件名
  const pickCodes = () => { const i=document.createElement("input"); i.type="file"; i.accept="image/*,.csv,.zip,.xlsx"; i.onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(!f) return; setVouchers(vs=>{ const a=vs.length?vs.slice():[v]; a[0]={...a[0], codeSource:"custom", codeFile:f.name}; return a; }); }; i.click(); };
  const csrc = v.codeSource || "auto";
  return (
    <div className="editrow">
      <div className="k">{tr(lang,"Prize voucher","奖品券")}</div>
      <div className="vcard">
        <div className="vcard-top">
          <label className="vc-namef"><span>{tr(lang,"Prize name","奖品名称")}</span><input className="vc-name" placeholder={tr(lang,"e.g. Cappuccino","如 卡布奇诺")} value={P(lang,v.name)} onChange={e=>upd("name",{en:e.target.value,zh:e.target.value})}/></label>
          {showStock && <span className="vc-stock">{tr(lang,"issued ","已发 ")}{v.awarded}<span> · </span>{tr(lang,"left ","剩 ")}<b>{Math.max(0,(+v.qty||0)-(v.awarded||0))}</b></span>}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div className="vc-grid g3" style={{ flex:1 }}>
            <label><span>{tr(lang,"Price","原价")}</span><input value={v.price||""} onChange={e=>upd("price",e.target.value)} placeholder="S$6"/></label>
            <label><span>{tr(lang,"Discount","折扣")}</span><input value={P(lang,v.discount)} onChange={e=>upd("discount",{en:e.target.value,zh:e.target.value})} placeholder={tr(lang,"Free / 1-for-1","免费 / 8折")}/></label>
            <label><span>{tr(lang,"Qty","张数")}</span><input className="num" type="number" min="1" value={v.qty} onChange={e=>upd("qty",+e.target.value||0)}/></label>
          </div>
          {v.image
            ? <span className="thumb-x" style={{ flexShrink:0 }}><img src={v.image} alt="" style={{ width:64, height:64, borderRadius:10 }}/><button onClick={()=>upd("image",null)} title={tr(lang,"Remove","删除")}>x</button></span>
            : <label style={{ width:64, height:64, borderRadius:10, border:"1.5px dashed var(--line)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, cursor:"pointer", flexShrink:0, color:"var(--muted-2)", fontSize:10, fontWeight:600 }}><Ic.image style={{ width:18, height:18 }}/>{tr(lang,"Photo","图片")}<input type="file" accept="image/*" hidden onChange={onImg}/></label>}
        </div>
        <div className="vc-src">
          <span className="vc-src-lbl">{tr(lang,"Prize codes","券码")}</span>
          <button type="button" className={"vc-src-pill"+(csrc==="auto"?" on":"")} onClick={()=>upd("codeSource","auto")}>{tr(lang,"Auto-generated","系统自动生成")}</button>
          <button type="button" className={"vc-src-pill"+(csrc==="custom"?" on":"")} onClick={pickCodes}>{tr(lang,"Upload my own","上传自有券码")}</button>
        </div>
        {csrc==="custom" && <div className="vc-upl">
          {v.codeFile
            ? <span className="vc-upl-ok"><Ic.check/> {tr(lang,"Uploaded","已上传")} <b>{v.codeFile}</b> · {v.qty} {tr(lang,"codes","个券码")}<button type="button" className="vc-upl-re" onClick={pickCodes}>{tr(lang,"Re-upload","重新上传")}</button></span>
            : <button type="button" className="btn ghost sm" onClick={pickCodes}><Ic.upload style={{ width:14, height:14 }}/> {tr(lang,"Upload QR images / code list","上传二维码图 / 验证码表格")}</button>}
        </div>}
      </div>
      <p className="vnote">{csrc==="custom"
        ? tr(lang,"We hand out your uploaded codes in order until they run out; redemption verifies against your codes.","按你上传的券码依次发放、发完即停；核销时校验你的券码/二维码。")
        : tr(lang,"Given out until the quantity runs out — no win-rate to set. One voucher per activity for now.","按张数自然发放，发完即停 —— 不用设中奖率。目前一个活动发一种券。")}</p>
    </div>
  );
}
function OutletScope({ outlets, gameOutlets, setGameOutlets, setOutlets, locked }) {
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
      <label className={"ock"+(locked?" disabled":"")}><input type="checkbox" checked={all} disabled={locked} onChange={toggleAll}/><span><b>{tr(lang,"All outlets","全部门店")}</b></span></label>
      {outlets.map(o=>(
        <label className={"ock"+(locked?" disabled":"")} key={o.id}><input type="checkbox" checked={gameOutlets.includes(o.id)} disabled={locked} onChange={()=>toggle(o.id)}/><span>{P(lang,o.name)} <em>· {o.city}</em></span></label>
      ))}
      {setOutlets && !adding && !locked && <button className="addrow" style={{ marginTop:8 }} onClick={()=>setAdding(true)}>+ {tr(lang,"Add outlet","添加门店")}</button>}
      {setOutlets && adding && !locked && (
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
const NEUTRAL_BRAND_COLOR = ["#9AA6B2","#C4CDD6"]; // 未品牌化前的中性模板配色
function Preview({ game, brand, setBrand, onLaunch, onBack }) {
  const lang = useLang();
  const [branded, setBranded] = useState(false);   // 是否已生成品牌版
  const [gen, setGen] = useState(false);            // 变身动效进行中
  // 用户是否提供了素材（决定按钮文案 + IKEA 拥有感门槛）
  const hasInput = !!brand.logo || (brand.products && brand.products.length > 0) || (brand.color && brand.color[0] !== "#16A34A");
  // 品牌化前左侧用中性模板（灰、无 logo）→ 点生成才 before→after 变身
  const shown = branded ? brand : { ...brand, color: NEUTRAL_BRAND_COLOR, logo:null, logoMark:null };
  const genTasks = [tr(lang,"Applying your colors","套用你的配色"), tr(lang,"Placing your logo","放上你的 logo"), tr(lang,"Building your playable game","生成可试玩的游戏")];
  const generate = () => {
    if (gen) return;
    setGen(true);
    setTimeout(() => {
      if (!hasInput) setBrand(b => ({ ...b, color: COLOR_SETS[0] })); // 没传素材 → 推荐配色兜底，保证有变化
      setBranded(true); setGen(false);
    }, 1900);
  };
  return (
    <div className="canvas wide">
      {onBack && <button className="canvas-back" onClick={onBack}><Ic.back style={{ width:15, height:15 }}/> {tr(lang,"Back","上一步")}</button>}
      <div className="center" style={{ marginBottom:18 }}><div className="f-eye">{branded ? tr(lang,"Your branded game","你的专属游戏") : tr(lang,"Your game is ready","你的游戏，做好了")}</div><h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{branded ? tr(lang,"Happy with it? Confirm","满意就确认") : tr(lang,"Make it yours, then generate","换成你的品牌，点生成")}</h1></div>
      <div className="preview lite">
        <div className="demo-stage" style={{ position:"relative" }}>
          <div className={"demo-skin" + (branded ? " on" : "")}><Demo game={game} brand={shown}/></div>
          {!branded && !gen && <div className="gen-hint">{tr(lang,"Add your brand on the right →","在右侧加上你的品牌 →")}</div>}
          {gen && <div className="gen-overlay"><div className="gen-spin"></div><div className="gen-title">{tr(lang,"Building your custom game","正在生成你的定制游戏")}</div><div className="gen-tasks">{genTasks.map((t,i)=><div key={i} className="gt" style={{ animationDelay:(i*0.5)+"s" }}>{t}</div>)}</div></div>}
        </div>
        <div>
          <div className="editbox"><BrandControls brand={brand} setBrand={setBrand} noProducts /></div>
          <p className="ph-sub" style={{ margin:"12px 2px 0" }}>{branded ? tr(lang,"Fine-tune live on the right. Set vouchers & outlets in your Activity next.","右侧可实时微调。下一步在「活动」里设奖品券和门店。") : tr(lang,"Upload your logo & colors, then generate your branded game.","传上 logo 和配色，一键生成你的定制游戏。")}</p>
          {/* 上一步在页面左上角；这一行固定：左=重新生成(生成后)，右=确认(主按钮，位置恒定) */}
          <div className="btn-row" style={{ marginTop:16, justifyContent:"space-between" }}>
            {branded ? <button className="btn ghost lg" onClick={generate}><Ic.refresh/> {tr(lang,"Re-generate","重新生成")}</button> : <span/>}
            {!branded
              ? <button className="btn primary lg" onClick={generate} disabled={gen}><Ic.spark style={{ width:18, height:18 }}/> {gen ? tr(lang,"Generating…","生成中…") : hasInput ? tr(lang,"Generate my game","生成我的定制游戏") : tr(lang,"Generate with suggested colors","用推荐配色生成")}</button>
              : <button className="btn primary lg" onClick={onLaunch}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Confirm","确认")}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
function Workspace({ game, brand, setBrand, setName }) {
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
          {setName
            ? <input className="ws-gamename" value={P(lang,game.name)} onChange={e=>setName(e.target.value)} placeholder={tr(lang,"Game name","游戏名称")}/>
            : <div/>}
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

// 统一空状态：图标 + 标题 + 一句副文案 + 一个主动作（可选次按钮）。全站复用，视觉一致。
function EmptyState({ icon, title, sub, actLabel, onAct, ghostLabel, onGhost }) {
  return (
    <div className="empty-state">
      <div className="es-ic">{icon}</div>
      <h3>{title}</h3>
      <p>{sub}</p>
      {(actLabel || ghostLabel) && <div className="es-actions">
        {actLabel && <button className="btn primary lg" onClick={onAct}>{actLabel}</button>}
        {ghostLabel && <button className="btn ghost lg" onClick={onGhost}>{ghostLabel}</button>}
      </div>}
    </div>
  );
}

function HomeView({ game, brand, onShare, onRecall, activities, liveGame, onNewAct, onRedeem, onGoActivity, onGoActivities, onGoGames, outlets = OUTLETS }) {
  const lang = useLang();
  const [recalled, setRecalled] = useState(false);
  const [scanOk, setScanOk] = useState(false);
  const [scanning, setScanning] = useState(false);
  const doScan = () => { setScanning(true); setTimeout(() => { setScanning(false); setScanOk(true); setTimeout(() => setScanOk(false), 2800); }, 1700); };
  const liveAct = activities && activities.find(a => a.status === "live");
  const hasActs = activities && activities.length > 0;
  return (
    <div className="app-body">
      {liveAct
        ? <div className="home-hero">
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span className="hl-live"><span className="b"></span>LIVE</span>
                <h3 style={{ margin:0 }} onClick={onGoActivity}>{P(lang, liveAct.name)} · {tr(lang,"up and running","正在跑")} <Ic.arrow style={{ width:13, height:13, opacity:.45 }}/></h3>
              </div>
              <div className="live3">
                <div className="lc"><div className="n">{DEMO_METRICS.today.plays}</div><div className="l">{tr(lang,"plays today","今天玩了")}</div></div>
                <div className="lc"><div className="n">{DEMO_METRICS.today.walkins}</div><div className="l">{tr(lang,"walked in","到店")}</div></div>
                <div className="lc"><div className="n">{DEMO_METRICS.today.redeemed}</div><div className="l">{tr(lang,"redeemed","已核销")}</div></div>
              </div>
            </div>
            <button className="btn primary" style={{ alignSelf:"center", marginLeft:20, flexShrink:0, display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }} onClick={onRedeem}>
              <Ic.target style={{ width:16, height:16 }}/>{tr(lang,"Scan to redeem","扫码核销")}
            </button>
          </div>
        : liveGame
          ? <div className="home-hero empty">
              <div>
                <span className="hl-live"><span className="b"></span>LIVE</span>
                <h3 style={{ marginTop:12, cursor:"pointer" }} onClick={onGoGames}>{P(lang, liveGame.name)} · {tr(lang,"up and running","正在跑")} <Ic.arrow style={{ width:13, height:13, opacity:.45 }}/></h3>
                <p style={{ color:"#9fb0c4", fontSize:14, margin:"6px 0 0", maxWidth:"40ch" }}>{tr(lang,"Customers scan and play. Want to hand out prizes and turn them into walk-ins? Add an activity.","客人扫码就能玩。想送奖品、把人变成到店客？加一个活动。")}</p>
              </div>
              <div style={{ marginLeft:"auto", alignSelf:"center" }}>
                <button className="btn primary lg" onClick={onNewAct}>+ {tr(lang,"New activity","新建活动")}</button>
              </div>
            </div>
          : <div className="home-hero empty">
              <div>
                <span className="hl-live" style={{ background:"rgba(255,255,255,.12)", color:"#cdd8e4" }}>{tr(lang,"No activity yet","暂时还没有活动")}</span>
                <h3>{tr(lang,"Create an activity to open for business","建个活动，就能开门营业")}</h3>
                <p style={{ color:"#9fb0c4", fontSize:14, margin:"6px 0 0", maxWidth:"38ch" }}>{tr(lang,"Pick outlets, set a voucher, link your game — customers scan to play.","选门店、设一张券、绑上你的游戏 —— 客人扫码就能玩。")}</p>
              </div>
              <div style={{ marginLeft:"auto", alignSelf:"center" }}>
                <button className="btn primary lg" onClick={onNewAct}>+ {tr(lang,"New activity","新建活动")}</button>
              </div>
            </div>}
      {/* 上手清单：未上线/首次登录也显示（这是引导，不是数据）。第 2 步按是否已有活动动态切换 */}
      {(() => {
        const nudge = (
          <div className="panel nudge">
            <h4 style={{ marginBottom:14 }}>{tr(lang,"Get your first wave playing","让第一波人玩起来")}</h4>
            <div className="nstep done"><span className="nt"><Ic.check/></span>{tr(lang,"Game created","游戏已创建")}</div>
            {hasActs
              ? <div className={"nstep "+(liveAct?"done":"cur")}><span className="nt">{liveAct?<Ic.check/>:"2"}</span>{tr(lang,"Set up & publish the activity","配置并上线活动")}{!liveAct && <button className="btn ghost sm na" onClick={onGoActivity}>{tr(lang,"Go","去完善")}</button>}</div>
              : <div className="nstep cur"><span className="nt">2</span>{tr(lang,"Create your first activity","新建第一个活动")}<button className="btn ghost sm na" onClick={onNewAct}>{tr(lang,"Create","去新建")}</button></div>}
            <div className={"nstep "+(liveAct?"cur":"")}><span className="nt">3</span>{tr(lang,"Print QR per outlet","打印各门店二维码")}{liveAct && <button className="btn ghost sm na" onClick={onGoActivities}>{tr(lang,"Download","去下载")}</button>}</div>
            <div className="nstep"><span className="nt">4</span>{tr(lang,"First customer redeems in store","第一位客人到店核销")}</div>
          </div>
        );
        // 没有已上线活动 = 还没有任何真实数据：只给上手清单，不显示「最近」动态与「召回老客」
        if (!liveAct) return <div style={{ marginTop:18 }}>{nudge}</div>;
        return (
          <>
            <div className="home-grid">
              {nudge}
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
          </>
        );
      })()}
    </div>
  );
}

function Cover({ url, onPick, ratio, label, colors, name, lang }) {
  const g = colors || ["#16A34A","#22C55E"];
  return (
    <div className="pub-cover">
      <div className="pc-label">{label}</div>
      <div className="pc-box" style={{ aspectRatio:ratio, background: url ? `center/cover no-repeat url(${url})` : `linear-gradient(150deg,${g[0]},${g[1]})` }}>
        {!url && <><span className="pc-ai">{tr(lang,"AI default","AI 默认")}</span><span className="pc-name">{name}</span></>}
        <button className="pc-replace" onClick={onPick}><Ic.upload style={{ width:12, height:12 }}/> {tr(lang,"Replace","替换")}</button>
      </div>
    </div>
  );
}
/* ===== KiX app download (desktop→mobile handoff) ===== */
function QRGlyph({ size = 132 }) {
  const N = 25, cells = [];
  const inBox = (x,y,bx,by) => x>=bx && x<bx+7 && y>=by && y<by+7;
  const isFinder = (x,y) => inBox(x,y,0,0) || inBox(x,y,N-7,0) || inBox(x,y,0,N-7);
  const finderOn = (x,y) => { for (const [bx,by] of [[0,0],[N-7,0],[0,N-7]]) { const dx=x-bx, dy=y-by; if (dx>=0&&dy>=0&&dx<=6&&dy<=6) { const edge=dx===0||dy===0||dx===6||dy===6, core=dx>=2&&dx<=4&&dy>=2&&dy<=4; return edge||core; } } return false; };
  for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    const on = isFinder(x,y) ? finderOn(x,y) : (((x*7+y*13+x*y*3)%5)===0 || ((x+y)%3===0 && (x*y)%2===0));
    if (on) cells.push(<rect key={x+"-"+y} x={x} y={y} width="1" height="1"/>);
  }
  return (<svg className="qr-glyph" width={size} height={size} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges"><rect width={N} height={N} fill="#fff"/><g fill="#0B1220">{cells}</g></svg>);
}
function QRDownload({ lang }) {
  return (
    <div className="qrdl">
      <div className="qrdl-code"><QRGlyph size={128}/></div>
      <div className="qrdl-r">
        <div className="qrdl-t">{tr(lang,"Scan to get the KiX app","扫码下载 KiX App")}</div>
        <p className="qrdl-p">{tr(lang,"Your published games & activities live in the KiX app — see them just like your customers do.","你上线的游戏和活动都在 KiX App 里 —— 像客人一样看到真实效果。")}</p>
        <div className="qrdl-badges"><span className="storebadge">App Store</span><span className="storebadge">Google Play</span></div>
      </div>
    </div>
  );
}
function AppQRModal({ onClose }) {
  const lang = useLang();
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:440 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"View in the KiX app","在 KiX App 查看")}</h3>
        <p className="pub-sub">{tr(lang,"Scan with your phone to download and see it live.","用手机扫码下载，看它真实上架的样子。")}</p>
        <QRDownload lang={lang}/>
      </div>
    </div>,
    document.body
  );
}
const fmtCard = (v) => v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
function PublishGameModal({ game, onClose, onConfirm }) {
  const lang = useLang();
  const [name, setName] = useState(P(lang, game.name));
  const [sq, setSq] = useState(null), [rc, setRc] = useState(null);
  const [step, setStep] = useState(new URLSearchParams(location.search).get("done")==="1" ? "done" : "confirm");
  const pick = (setter) => { const i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.onchange=e=>{ const f=e.target.files[0]; if(f) setter(URL.createObjectURL(f)); }; i.click(); };
  const doConfirm = () => { onConfirm({ name:{en:name,zh:name}, coverSquare:sq, coverRect:rc }); setStep("done"); };
  if (step === "done") return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" onClick={e=>e.stopPropagation()}>
        <div className="pub-done-badge"><Ic.check style={{ width:26, height:26 }}/></div>
        <h3 style={{ textAlign:"center" }}>{tr(lang,"Your game is live 🎉","游戏已上线 🎉")}</h3>
        <p className="pub-sub" style={{ textAlign:"center" }}>{tr(lang,"See it in the KiX app, just like your customers.","在 KiX App 里看看，就像客人看到的一样。")}</p>
        <QRDownload lang={lang}/>
        <div className="pub-actions" style={{ justifyContent:"center" }}><button className="btn primary lg" onClick={onClose}>{tr(lang,"Done","完成")}</button></div>
      </div>
    </div>,
    document.body
  );
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"Publish game","上线游戏")}</h3>
        <p className="pub-sub">{tr(lang,"Check the cover & name, then confirm. Covers are AI-generated — replace anytime.","确认封面和名字即可上线。封面 AI 已自动生成，可随时替换。")}</p>
        <div className="pub-covers">
          <Cover url={sq} onPick={()=>pick(setSq)} ratio="1/1" label={tr(lang,"Square","方形")} colors={game.g} name={name} lang={lang}/>
          <Cover url={rc} onPick={()=>pick(setRc)} ratio="16/9" label={tr(lang,"Landscape","长方形")} colors={game.g} name={name} lang={lang}/>
        </div>
        <label className="pub-namef"><span>{tr(lang,"Game name","游戏名称")}</span><input value={name} onChange={e=>setName(e.target.value)}/></label>
        <div className="pub-actions">
          <button className="btn ghost lg" onClick={onClose}>{tr(lang,"Cancel","取消")}</button>
          <button className="btn primary lg" onClick={doConfirm}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Confirm & publish","确认上线")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
const GAME_STA = {
  draft:   { en:"Draft",   zh:"草稿",   cls:"st-draft" },
  live:    { en:"Live",    zh:"已上线", cls:"st-live" },
};
function MyGamesView({ myGames, onNew, onOpen, onPublish, onOffline }) {
  const lang = useLang();
  const [filt, setFilt] = useState("all");
  const [pubGame, setPubGame] = useState(()=> new URLSearchParams(location.search).get("pub")==="1" ? (myGames[0]||null) : null);
  const [appQr, setAppQr] = useState(false);
  // 游戏只有 草稿/已上线 两态（无"已下线"——游戏无时限无奖品，下线即回草稿，与草稿同义）
  const FILTS = [["all","All","全部"],["live","Live","已上线"],["draft","Draft","草稿"]];
  const cnt = (k) => k==="all" ? myGames.length : myGames.filter(g=>(g.status||"draft")===k).length;
  const tabs = FILTS.filter(([k]) => k==="all" || cnt(k) > 0);
  const shown = myGames.filter(g => filt==="all" ? true : (g.status||"draft")===filt);
  return (
    <div className="app-body">
      {myGames.length > 0 && tabs.length > 1 && <div className="act-filters">
        {tabs.map(([k,en,zh]) => (<button key={k} className={"afilt"+(filt===k?" on":"")} onClick={()=>setFilt(k)}>{tr(lang,en,zh)} <em>{cnt(k)}</em></button>))}
      </div>}
      <div className="mygames">
        {shown.map(g => {
          const status = g.status || "draft"; const stt = GAME_STA[status];
          return (
            <div key={g.id} className="mgcard clickable" onClick={()=>onOpen(g)}>
              <div className="mgart"><GamePreview kind={g.kind} colors={g.g} /><span className={"mgstatus act-badge " + stt.cls}>{status==="live" && <span className="b"></span>}{tr(lang, stt.en, stt.zh)}</span><div className="play"><span>{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></span></div></div>
              <div className="mgmeta">
                <div className="nm">{P(lang,g.name)}</div>
                <div className="st">{status==="live" ? tr(lang,"Live · scan to play","已上线 · 可扫码玩") : tr(lang,"Not live yet","未上线")}</div>
                {status==="live"
                  ? <><button className="btn ghost sm inapp" style={{ width:"100%", marginTop:10 }} onClick={(e)=>{ e.stopPropagation(); setAppQr(true); }}><Ic.phone style={{ width:14, height:14 }}/> {tr(lang,"View in app","在 App 查看")}</button>
                      <button className="btn ghost sm" style={{ width:"100%", marginTop:8 }} onClick={(e)=>{ e.stopPropagation(); onOffline(g); }}>{tr(lang,"Take offline","下线")}</button></>
                  : <button className="btn primary sm" style={{ width:"100%", marginTop:10 }} onClick={(e)=>{ e.stopPropagation(); setPubGame(g); }}><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Publish","上线")}</button>}
              </div>
            </div>
          );
        })}
        <button className="mgnew" onClick={onNew}><span className="plus">+</span>{tr(lang,"New game","新建游戏")}</button>
      </div>
      {pubGame && <PublishGameModal game={pubGame} onClose={()=>setPubGame(null)} onConfirm={(patch)=>{ onPublish(pubGame, patch); }}/>}
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
    </div>
  );
}

function RedeemView({ vouchers = DEFAULT_VOUCHERS, onReport, hasLive, hasActs, onNewAct, onGoActivities, liveName }) {
  const lang = useLang();
  const [code, setCode] = useState(""), [ok, setOk] = useState(false), [scanning, setScanning] = useState(false);
  const success = () => { setOk(true); setCode(""); setTimeout(()=>setOk(false), 2800); };
  const submit = () => { if (code.trim().length >= 3) success(); };
  const scan = () => { setScanning(true); setTimeout(()=>{ setScanning(false); success(); }, 1700); };
  const reds = FEED.filter(f => f.ic === "gift");
  const totRedeemed = vouchers.reduce((s,v)=>s+(v.redeemed||0),0);
  const toCome = vouchers.reduce((s,v)=>s+Math.max(0,(v.awarded||0)-(v.redeemed||0)),0);
  const totAwarded = vouchers.reduce((s,v)=>s+(v.awarded||0),0);
  const dlQR = () => { const c=document.createElement("canvas"); c.width=200; c.height=200; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,200,200); x.fillStyle="#0B1220"; x.font="bold 24px sans-serif"; x.textAlign="center"; x.fillText("QR CODE",100,90); x.font="13px sans-serif"; x.fillText(liveName||"activity",100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); };
  // 空状态分级：没 live 活动 = 无券可核销；有 live 但还没人赢券 = 等客人玩
  if (!hasLive) return (
    <div className="app-body"><EmptyState
      icon={<Ic.target/>}
      title={hasActs ? tr(lang,"Your activity isn't live yet","活动还没上线") : tr(lang,"Nothing to redeem yet","还没有可核销的奖品")}
      sub={hasActs
        ? tr(lang,"It's still being edited. Once it's live, customers play, win vouchers — then you scan to redeem here.","活动还在修改中。上线后客人才能玩、赢券，你才能在这里扫码核销。")
        : tr(lang,"Create an activity and publish it. Customers play, win a voucher, walk in — you scan it here, and that counts as a real walk-in.","先建一个活动并上线。客人玩、赢券、到店，你在这里一扫，就算一次真实到店。")}
      actLabel={hasActs ? tr(lang,"Go to activities","去活动") : "+ "+tr(lang,"New activity","新建活动")}
      onAct={hasActs ? onGoActivities : onNewAct}
    /></div>
  );
  if (totAwarded === 0) return (
    <div className="app-body"><EmptyState
      icon={<Ic.target/>}
      title={tr(lang,"No prizes won yet","还没有人赢到奖品")}
      sub={tr(lang,"Stick your activity QR on the counter and share it. As soon as someone plays and wins, their prize shows up here to redeem.","把活动二维码贴到收银台、分享出去。客人一玩、一赢券，就会出现在这里等你核销。")}
      actLabel={tr(lang,"Download activity QR","下载活动二维码")}
      onAct={dlQR}
      ghostLabel={tr(lang,"View activity","查看活动")}
      onGhost={onGoActivities}
    /></div>
  );
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
        {reds.length > 0 && <div className="panel">
          <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent redemptions","最近核销")}</h4>
          {reds.slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
        </div>}
      </div>

      <div className="rd-right">
        {/* 简要概览 — 当下要瞄一眼的数；完整分析在「数据」页 */}
        <div className="rd-summary" style={{ marginTop:0 }}>
          <div className="rd-sum"><div className="n">{DEMO_METRICS.today.redeemed}</div><div className="l">{tr(lang,"redeemed today","今日核销")}</div></div>
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
function ActivitiesView({ activities, onNew, onOpen, onDuplicate }) {
  const lang = useLang();
  const [filt, setFilt] = useState("all");
  const [appQr, setAppQr] = useState(false);
  // 状态机(2026-07-03 去审批)：draft(修改中)/live(已上线)/offline(已下线)。直接上线，无 review/rejected。
  const FILTS = [
    { k:"all",     en:"All",       zh:"全部",   match:()=>true },
    { k:"edit",    en:"Editing",   zh:"修改中", match:s=>s==="draft" },
    { k:"live",    en:"Live",      zh:"已上线", match:s=>s==="live" },
    { k:"offline", en:"Offline",   zh:"已下线", match:s=>s==="offline" },
  ];
  const cnt = (f) => activities.filter(a => f.match(a.status||"draft")).length;
  // 零计数标签自动隐藏（全部除外），小商家不被空标签淹没
  const tabs = FILTS.filter(f => f.k==="all" || cnt(f) > 0);
  const cur = (tabs.find(f=>f.k===filt) || FILTS[0]);
  const shown = activities.filter(a => cur.match(a.status||"draft"));
  return (
    <div className="app-body">
      {activities.length > 0 && tabs.length > 1 && <div className="act-filters">
        {tabs.map(f => (
          <button key={f.k} className={"afilt"+(filt===f.k?" on":"")} onClick={()=>setFilt(f.k)}>
            {tr(lang,f.en,f.zh)} <em>{cnt(f)}</em>
          </button>
        ))}
      </div>}
      {activities.length === 0
        ? <EmptyState
            icon={<Ic.clipboard/>}
            title={tr(lang,"No activities yet","还没有活动")}
            sub={tr(lang,"An activity is how customers reach you — pick outlets, set a voucher, link your game, then publish.","活动是客人触达你的方式 —— 选门店、设一张券、绑上游戏，再上线。")}
            actLabel={"+ " + tr(lang,"New activity","新建活动")}
            onAct={onNew}
          />
        : <div className="mygames">
            {shown.map(act => {
              const tpl = TEMPLATES.find(t => t.id === act.gameId) || TEMPLATES[0];
              return (
                <div key={act.id} className="mgcard clickable" onClick={() => onOpen(act)}>
                  <div className="mgart"><GamePreview kind={tpl.kind} colors={tpl.g} /><span className={"mgstatus act-badge " + ACT_STA[act.status||"draft"].cls}>{(act.status||"draft")==="live" && <span className="b"></span>}{P(lang, ACT_STA[act.status||"draft"])}</span><div className="play"><span>{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></span></div></div>
                  <div className="mgmeta">
                    <div className="nm">{P(lang, act.name)}</div>
                    <div className="st">{(act.vouchers[0]&&act.vouchers[0].qty)||0} {tr(lang,"vouchers","张券")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>
                    <div style={{ display:"flex", gap:8, marginTop:10 }}>
                      <button className="btn ghost sm" onClick={(e)=>{ e.stopPropagation(); onDuplicate(act); }} style={{ padding:"7px 12px", fontSize:12.5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> {tr(lang,"Copy","复制")}</button>
                      {act.status === "live" && <button className="btn ghost sm" onClick={(e)=>{ e.stopPropagation(); const c=document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 24px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,90); ctx.font="13px sans-serif"; ctx.fillText(P(lang,act.name),100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); }} style={{ padding:"7px 12px", fontSize:12.5 }}><Ic.upload style={{ width:12, height:12, transform:"rotate(180deg)" }}/> {tr(lang,"QR","二维码")}</button>}
                    </div>
                    {act.status === "live" && <button className="btn ghost sm inapp" style={{ width:"100%", marginTop:8, fontSize:12.5 }} onClick={(e)=>{ e.stopPropagation(); setAppQr(true); }}><Ic.phone style={{ width:13, height:13 }}/> {tr(lang,"View in app","在 App 查看")}</button>}
                  </div>
                </div>
              );
            })}
          </div>}
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
    </div>
  );
}
// 去审批(2026-07-03)：只有 draft/live/offline，无 review/rejected
const ACT_STA = {
  draft:    { en:"Draft",         zh:"草稿",   cls:"st-draft" },
  live:     { en:"Live",          zh:"已上线", cls:"st-live" },
  offline:  { en:"Offline",       zh:"已下线", cls:"st-offline" },
};
function ActivityPublishModal({ activity, cardOnFile, onSaveCard, onClose, onConfirm }) {
  const lang = useLang();
  const [step, setStep] = useState(new URLSearchParams(location.search).get("done")==="1" ? "done" : "confirm");
  const [num, setNum] = useState(""), [exp, setExp] = useState(""), [cvc, setCvc] = useState("");
  const [replacing, setReplacing] = useState(false);
  const savedCard = cardOnFile && !replacing;
  const cardOk = savedCard || num.replace(/\s/g,"").length >= 12;
  const confirm = () => {
    if (!savedCard) onSaveCard({ last4: num.replace(/\s/g,"").slice(-4) || "4242" });
    onConfirm();
    setStep("done");
  };
  if (step === "done") return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:440 }} onClick={e=>e.stopPropagation()}>
        <div className="pub-done-badge"><Ic.check style={{ width:26, height:26 }}/></div>
        <h3 style={{ textAlign:"center" }}>{tr(lang,"You're live 🎉","活动已上线 🎉")}</h3>
        <p className="pub-sub" style={{ textAlign:"center" }}>{tr(lang,"See it in the KiX app, just like your customers.","在 KiX App 里看看，就像客人看到的一样。")}</p>
        <QRDownload lang={lang}/>
        <div className="pub-actions" style={{ justifyContent:"center" }}><button className="btn primary lg" onClick={onClose}>{tr(lang,"Done","完成")}</button></div>
      </div>
    </div>,
    document.body
  );
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:440 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"Publish activity","上线活动")}</h3>
        <p className="pub-sub">{tr(lang,"Once live, customers can play and win vouchers right away.","上线后客人即可扫码玩、赢券进店。")}</p>
        <div className="pub-confirm-name">{P(lang, activity.name)}</div>
        <div className="cardf">
          <div className="cardf-h"><Ic.card style={{ width:15, height:15 }}/> {tr(lang,"Payment method","付款方式")}</div>
          {savedCard
            ? <div className="cardf-saved"><span><b>{tr(lang,"Card","Visa")} •••• {cardOnFile.last4}</b></span><button className="linkbtn" onClick={()=>setReplacing(true)}>{tr(lang,"Change","更换")}</button></div>
            : <div className="cardf-input">
                <input placeholder={tr(lang,"Card number","卡号")} value={num} onChange={e=>setNum(fmtCard(e.target.value))} inputMode="numeric"/>
                <div className="cardf-row">
                  <input placeholder={tr(lang,"MM / YY","有效期 MM/YY")} value={exp} onChange={e=>setExp(e.target.value.replace(/[^\d/]/g,"").slice(0,5))} inputMode="numeric"/>
                  <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric"/>
                </div>
                {cardOnFile && <button className="linkbtn" style={{ marginTop:6 }} onClick={()=>{ setReplacing(false); setNum(""); }}>{tr(lang,"Use saved card","用已绑的卡")}</button>}
              </div>}
          <p className="cardf-note"><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"Free for the first month. After that, you only pay per verified walk-in — take it offline anytime, no minimum.","第一个月免费。之后按客人真实到店笔数收费，随时可下线、无最低消费。")}</span></p>
        </div>
        <div className="pub-actions">
          <button className="btn ghost lg" onClick={onClose}>{tr(lang,"Cancel","取消")}</button>
          <button className="btn primary lg" disabled={!cardOk} onClick={confirm}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Confirm & publish","确认上线")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
function ActivityEditor({ activity, setActivity, outlets, setOutlets, myGames, cardOnFile, setCardOnFile, onNewGame, onViewGame, onBack }) {
  const lang = useLang();
  const upd = (k, v) => setActivity(a => ({...a, [k]: v}));
  const st = activity.status || "draft";
  const live = st === "live";
  const [pubOpen, setPubOpen] = useState(new URLSearchParams(location.search).get("pub")==="1");
  // 活动直接上线（无审批）：draft/offline —上线→ live；live —下线→ offline
  const actOutlets = outlets.filter(o => (activity.outletIds||[]).includes(o.id));
  const dlQR = (label) => { const c=document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 22px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,88); ctx.font="12px sans-serif"; ctx.fillText(label,100,116); const a=document.createElement("a"); a.download="qr-"+label+".png"; a.href=c.toDataURL(); a.click(); };
  return (
    <div className="app-body" style={{ maxWidth:820 }}>
      {live && <div className="act-statusbar"><span className="act-note" style={{ color:"var(--green-d)" }}><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Live — customers can play now.","已上线 —— 客人现在就能扫码玩。")}</span></div>}
      <div className="panel">
        <h3>{tr(lang,"Activity name","活动名称")}</h3>
        <div className="field" style={{ margin:0 }}><input value={P(lang, activity.name)} onChange={e => upd("name",{en:e.target.value,zh:e.target.value})} placeholder={tr(lang,"e.g. Weekend Coffee Promo","例如：周末咖啡促销")} /></div>
        <div style={{ display:"flex", gap:12, marginTop:14 }}>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"Start date","开始日期")}</label><input type="date" value={activity.startDate||""} onChange={e=>upd("startDate",e.target.value)}/></div>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"End date","结束日期")}</label><input type="date" value={activity.endDate||""} onChange={e=>upd("endDate",e.target.value)}/></div>
        </div>
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
                <div className="mgart" style={{ cursor:"pointer" }} onClick={() => onViewGame && onViewGame(g)}><GamePreview kind={g.kind} colors={g.g} /><div className="play"><span><Ic.play/> {tr(lang,"Details","查看详情")}</span></div></div>
                <div className="mgmeta">
                  <div className="nm">{P(lang, g.name)}</div>
                  <div className="st">{P(lang, g.tag)}</div>
                  <div style={{ marginTop:10 }}>
                    <button className={sel ? "btn primary sm" : "btn ghost sm"} style={{ width:"100%" }} onClick={() => upd("gameId", g.id)}>{sel ? tr(lang,"Selected","已选择") : tr(lang,"Select","选择")}</button>
                  </div>
                </div>
              </div>
            );
          })}
          <button className="mgnew" onClick={onNewGame}><span className="plus">+</span>{tr(lang,"New game","新建游戏")}</button>
        </div>
        <div className="win-cond">
          <span className="wc-lbl">{tr(lang,"Win condition","赢奖条件")} <em className="opt">{tr(lang,"optional","选填")}</em></span>
          <span className="wc-txt">{tr(lang,"Reach","达到")}</span>
          <input className="wc-in" type="number" min="1" value={activity.winScore||1000} onChange={e=>upd("winScore",+e.target.value||0)}/>
          <span className="wc-txt">{tr(lang,"to win the voucher","即可赢得奖品券")}</span>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Depending on the game this is a score, level or round — players who hit it win. Higher = harder, you decide.","视游戏而定，这可能是分数、关卡或回合 —— 玩家达标即赢券。数值越高越难拿，你自己定。")}</p>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <OutletScope outlets={outlets} gameOutlets={activity.outletIds} setGameOutlets={ids => upd("outletIds", ids)} setOutlets={setOutlets} locked={live} />
        {live && <p className="ph-sub" style={{ marginTop:10 }}>{tr(lang,"To change outlets, take the activity offline first.","要改门店，请先把活动下线。")}</p>}
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Activity QR codes — one per outlet","活动二维码 —— 每家门店一个")}</h3>
        <p className="ph-sub">{tr(lang,"Each outlet gets its own QR, so walk-ins are attributed to the right shop.","每家门店各一个二维码，到店才能归因到对应门店。")}</p>
        <p className="ph-sub" style={{ marginTop:2, color:"var(--muted-2)" }}>{tr(lang,"Generated once on first save and stays fixed — safe to print. Later edits won't change it.","首次保存时生成、之后固定不变 —— 可放心打印，后续编辑活动也不会变。")}</p>
        {actOutlets.length === 0
          ? <div className="ph-sub">{tr(lang,"Select at least one outlet above.","请先在上面选择至少一家门店。")}</div>
          : <div className="qr-list">
              {actOutlets.map(o => (
                <div className="qr-card" key={o.id}>
                  <div className="qr" style={{ width:88, height:88, borderRadius:12 }}><Ic.qr style={{ width:56, height:56, color:"#0B1220" }}/></div>
                  <div className="qr-meta">
                    <div className="nm">{P(lang,o.name)}</div>
                    <div className="ad">{o.city}</div>
                    <button className="btn ghost sm" style={{ marginTop:8 }} onClick={()=>dlQR(P(lang,o.name))}><Ic.upload style={{ width:13, height:13, transform:"rotate(180deg)" }}/> {tr(lang,"Download","下载")}</button>
                  </div>
                </div>
              ))}
            </div>}
      </div>
      <div className="act-actions">
        {(st==="draft"||st==="offline") && <button className="btn primary lg" onClick={()=>setPubOpen(true)}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Publish","上线")}</button>}
        {st==="live"     && <button className="ws-publish on" style={{ padding:"14px 22px", fontSize:"15.5px" }} onClick={()=>upd("status","offline")}>{tr(lang,"Take offline","下线活动")}</button>}
        <button className="btn ghost lg" onClick={onBack}>{tr(lang,"Save & close","保存并返回")}</button>
      </div>
      {pubOpen && <ActivityPublishModal activity={activity} cardOnFile={cardOnFile} onSaveCard={setCardOnFile} onClose={()=>setPubOpen(false)} onConfirm={()=>{ upd("status","live"); }}/>}
    </div>
  );
}

function ReportsView({ onTune, outlets = OUTLETS, vouchers = DEFAULT_VOUCHERS, hasLive, hasActs, hasLiveGame, multiAct, onNewAct, onGoActivities, onGoGames, liveName }) {
  const lang = useLang();
  const M = DEMO_METRICS;
  const GM = GAME_METRICS;
  const ranges = [{en:"Today",zh:"今天"},{en:"Last 7 days",zh:"近 7 天"},{en:"Last 30 days",zh:"近 30 天"}];
  const [ri, setRi] = useState(1);
  const [tab, setTab] = useState(new URLSearchParams(location.search).get("tab") || (hasLive ? "activity" : (hasLiveGame ? "game" : "activity")));
  const note = tr(lang,"vs last week","比上周");
  const totRed = vouchers.reduce((s,v)=>s+(v.redeemed||0),0);
  // 漏斗转化率 + 新客占比
  const wonRate = Math.round(M.awarded / M.plays * 100);   // 扫码玩→赢券
  const redRate = Math.round(M.walkins / M.awarded * 100);  // 赢券→到店
  const newPct = Math.round(M.newCust / M.walkins * 100), retPct = 100 - newPct;
  const tmax = Math.max(...M.trend.map(t => t.v));
  // 各门店到店（来自统一 demo 口径，自洽求和=walkins）
  const outRed = outlets.map(o => ({ o, v: M.byOutlet[o.id] || 0 }));
  const omax = Math.max(1, ...outRed.map(x=>x.v));
  const gmax = Math.max(...GAME_PERF.map(g => g.v));
  const dlQR = () => { const c=document.createElement("canvas"); c.width=200; c.height=200; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,200,200); x.fillStyle="#0B1220"; x.font="bold 24px sans-serif"; x.textAlign="center"; x.fillText("QR CODE",100,90); x.font="13px sans-serif"; x.fillText(liveName||"activity",100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); };
  // 活动数据（真实到店）— 空状态分级
  const activityBody = !hasLive ? (
    <EmptyState
      icon={<Ic.chart/>}
      title={hasActs ? tr(lang,"No data until you go live","上线后才有数据") : tr(lang,"No data yet","还没有数据")}
      sub={hasActs
        ? tr(lang,"Once your activity is live and customers redeem in store, walk-ins, new vs returning, and per-outlet stats appear here.","活动上线、客人到店核销后，这里会显示真实到店、新客/回头客、各门店表现。")
        : tr(lang,"This page only counts people who actually walked in. Create an activity, go live, and your real walk-in data will build up here.","这页只统计真正走进门的人。建活动、上线后，真实到店数据会在这里累积。")}
      actLabel={hasActs ? tr(lang,"Go to activities","去活动") : "+ "+tr(lang,"New activity","新建活动")}
      onAct={hasActs ? onGoActivities : onNewAct}
    />
  ) : totRed === 0 ? (
    <EmptyState
      icon={<Ic.chart/>}
      title={tr(lang,"Live — waiting for the first walk-in","已上线，等第一位到店")}
      sub={tr(lang,"As soon as a customer plays, wins, and redeems in store, your walk-in numbers and trends will appear here.","只要有客人扫码玩、赢券、到店核销，到店数据和趋势就会出现在这里。")}
      actLabel={tr(lang,"Download activity QR","下载活动二维码")}
      onAct={dlQR}
      ghostLabel={tr(lang,"Manage activities","管理活动")}
      onGhost={onGoActivities}
    />
  ) : (
    <>
      {/* Hero：真实到店核销 = 唯一付费指标、唯一独家证明，做绝对主角 */}
      <div className="rep-hero">
        <div className="rh-l">
          <span className="rh-eye"><span className="b"></span>{tr(lang,`Verified walk-ins · ${P(lang,ranges[ri])}`,`真实到店核销 · ${P(lang,ranges[ri])}`)}</span>
          <div className="rh-num">{M.walkins}<span className="rh-delta up"><Ic.arrow style={{ width:15, height:15, transform:"rotate(-90deg)" }}/>{M.delta.walkins} {note}</span></div>
          <p className="rh-sub">{tr(lang,"Only customers who actually walked in and were redeemed — the only thing you pay for.","只算真正走进门、被核销的客人 —— 也是你唯一付费的对象。")}</p>
        </div>
        <div className="rh-r">{M.trend.map((t,i)=>(<span key={i} className="rh-spark" style={{ height:(t.v/tmax*100)+"%" }}></span>))}</div>
      </div>
      <div className="panels">
        {/* 转化漏斗：吸收"玩了游戏"作为分母，证明全链路通 */}
        <div className="panel">
          <h3>{tr(lang,"From scan to walk-in","从扫码到到店")}</h3>
          <p className="ph-sub">{tr(lang,"Every step of the funnel — play, win, walk in","扫码玩 → 赢到券 → 真实到店，每一步的转化")}</p>
          <div className="funnel">
            <div className="fstep"><div className="fn">{M.plays}</div><div className="fl">{tr(lang,"Played","扫码玩")}</div></div>
            <div className="farrow"><b>{wonRate}%</b><span>{tr(lang,"won","赢券")}</span></div>
            <div className="fstep"><div className="fn">{M.awarded}</div><div className="fl">{tr(lang,"Won a voucher","赢到券")}</div></div>
            <div className="farrow"><b>{redRate}%</b><span>{tr(lang,"walked in","到店")}</span></div>
            <div className="fstep on"><div className="fn">{M.walkins}</div><div className="fl">{tr(lang,"Walked in","到店核销")}</div></div>
          </div>
        </div>
        {/* 新客 vs 回头：证明"把路过变回头客" */}
        <div className="panel">
          <h3>{tr(lang,"New vs returning","新客 vs 回头客")}</h3>
          <p className="ph-sub">{tr(lang,"Bringing in new faces — and getting them to come back","既在拉新客，也在让老客回头")}</p>
          <div className="nvr">
            <div className="nvr-bar"><i className="nv-new" style={{ width:newPct+"%" }}></i><i className="nv-ret" style={{ width:retPct+"%" }}></i></div>
            <div className="nvr-legend">
              <div className="d"><span className="sw" style={{ background:"var(--green)" }}></span><span><b>{M.newCust}</b>{tr(lang,"New","新客")} · {newPct}%</span></div>
              <div className="d"><span className="sw" style={{ background:"var(--amber)" }}></span><span><b>{M.returning}</b>{tr(lang,"Returning","回头客")} · {retPct}%</span></div>
            </div>
          </div>
        </div>
      </div>
      {/* 每日到店趋势 */}
      <div className="panel">
        <h3>{tr(lang,"Walk-ins per day","每天有多少人到店")}</h3>
        <p className="ph-sub">{tr(lang,"Played, then walked in and redeemed","扫码玩过、再走进门核销的人数")}</p>
        <div className="bars7">{M.trend.map((t, i) => (<div key={i} className="col"><div className="bv">{t.v}</div><div className="bar" style={{ height: (t.v/tmax*100) + "%" }}></div><div className="bd">{P(lang,t.d)}</div></div>))}</div>
      </div>
      {/* 条件区：多活动才有"排名"意义；多门店才有"分店"意义 */}
      {(multiAct && outlets.length>=2) ? <div className="panels">
        <div className="panel">
          <div className="panel-head"><h3>{tr(lang,"Which activity brings customers","哪个活动在帮你带客")}</h3><button className="panel-link" onClick={onTune}>{tr(lang,"Manage","管理活动")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Ranked by walk-ins — back the one that works","按到店人数排序 —— 把预算押在最有效的")}</p>
          {GAME_PERF.map((g, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,g.n)}</span><span className="hv">{g.v} {tr(lang,"walk-ins","人到店")}</span></div><div className="ht"><i style={{ width:(g.v/gmax*100)+"%", background:g.c }}></i></div></div>))}
        </div>
        <div className="panel"><OutletPanel lang={lang} outRed={outRed} omax={omax}/></div>
      </div>
      : multiAct ? <div className="panel">
          <div className="panel-head"><h3>{tr(lang,"Which activity brings customers","哪个活动在帮你带客")}</h3><button className="panel-link" onClick={onTune}>{tr(lang,"Manage","管理活动")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Ranked by walk-ins — back the one that works","按到店人数排序 —— 把预算押在最有效的")}</p>
          {GAME_PERF.map((g, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,g.n)}</span><span className="hv">{g.v} {tr(lang,"walk-ins","人到店")}</span></div><div className="ht"><i style={{ width:(g.v/gmax*100)+"%", background:g.c }}></i></div></div>))}
        </div>
      : outlets.length>=2 ? <div className="panel"><OutletPanel lang={lang} outRed={outRed} omax={omax}/></div>
      : null}
    </>
  );

  // 游戏数据（独立上线的纯玩数据：无奖品/无到店）
  const gmax2 = Math.max(...GM.byGame.map(g=>g.v));
  const gtmax = Math.max(...GM.trend.map(t=>t.v));
  const gameBody = !hasLiveGame ? (
    <EmptyState
      icon={<Ic.gamepad/>}
      title={tr(lang,"No game is live yet","还没有已上线的游戏")}
      sub={tr(lang,"Publish a game (no prizes needed) and its plays, players and completion rate will show up here.","上线一个游戏（无需奖品），它的游玩次数、玩家数、完成率会显示在这里。")}
      actLabel={tr(lang,"Go to My games","去我的游戏")}
      onAct={onGoGames}
    />
  ) : (
    <>
      <div className="rep-hero">
        <div className="rh-l">
          <span className="rh-eye"><span className="b"></span>{tr(lang,`Game plays · ${P(lang,ranges[ri])}`,`游玩次数 · ${P(lang,ranges[ri])}`)}</span>
          <div className="rh-num">{GM.plays}<span className="rh-delta up"><Ic.arrow style={{ width:15, height:15, transform:"rotate(-90deg)" }}/>{GM.delta.plays} {note}</span></div>
          <p className="rh-sub">{tr(lang,"How many times customers played your games — games can go live on their own, no prizes needed.","客人玩你游戏的总次数 —— 游戏可独立上线，无需奖品。")}</p>
        </div>
        <div className="rh-r">{GM.trend.map((t,i)=>(<span key={i} className="rh-spark" style={{ height:(t.v/gtmax*100)+"%" }}></span>))}</div>
      </div>
      <div className="panels">
        <div className="panel">
          <h3>{tr(lang,"Players","玩家数")}</h3>
          <p className="ph-sub">{tr(lang,"Distinct people who played","玩过的独立用户数")}</p>
          <div className="rh-num" style={{ color:"var(--ink)" }}>{GM.players}<span className="rh-delta up" style={{ position:"static", marginLeft:10 }}>{GM.delta.players} {note}</span></div>
        </div>
        <div className="panel">
          <h3>{tr(lang,"Completion rate","完成率")}</h3>
          <p className="ph-sub">{tr(lang,"Played through to the end","玩到结束的比例")}</p>
          <div className="rh-num" style={{ color:"var(--ink)" }}>{GM.completion}%</div>
        </div>
      </div>
      <div className="panel">
        <h3>{tr(lang,"Plays by game","各游戏游玩次数")}</h3>
        <p className="ph-sub">{tr(lang,"Which game gets played the most","哪个游戏最多人玩")}</p>
        {GM.byGame.map((g,i)=>(<div key={i} className="hbar"><div className="hl"><span>{P(lang,g.n)}</span><span className="hv">{g.v} {tr(lang,"plays","次")}</span></div><div className="ht"><i style={{ width:(g.v/gmax2*100)+"%", background:g.c }}></i></div></div>))}
      </div>
      <div className="panel">
        <h3>{tr(lang,"Plays per day","每天游玩次数")}</h3>
        <p className="ph-sub">{tr(lang,"Daily game plays","每日游戏游玩量")}</p>
        <div className="bars7">{GM.trend.map((t,i)=>(<div key={i} className="col"><div className="bv">{t.v}</div><div className="bar" style={{ height:(t.v/gtmax*100)+"%" }}></div><div className="bd">{P(lang,t.d)}</div></div>))}</div>
      </div>
    </>
  );

  return (
    <div className="app-body">
      <div className="rep-top">
        <div className="rep-seg">
          <button className={tab==="activity"?"on":""} onClick={()=>setTab("activity")}>{tr(lang,"Activities","活动")}</button>
          <button className={tab==="game"?"on":""} onClick={()=>setTab("game")}>{tr(lang,"Games","游戏")}</button>
        </div>
        <div className="datepills">{ranges.map((r,i) => <button key={i} className={ri===i?"on":""} onClick={()=>setRi(i)}>{P(lang,r)}</button>)}</div>
      </div>
      {tab==="activity" ? activityBody : gameBody}
    </div>
  );
}
function OutletPanel({ lang, outRed, omax }) {
  return (<>
    <h3>{tr(lang,"Walk-ins by outlet","各门店到店")}</h3>
    <p className="ph-sub">{tr(lang,"Which shop pulls the most — voucher stock is shared across outlets","哪家店带客最多 —— 库存为活动全门店共享")}</p>
    {outRed.map(({o,v}, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,o.name)}</span><span className="hv">{v} {tr(lang,"walk-ins","人到店")}</span></div><div className="ht"><i style={{ width:(v/omax*100)+"%", background:"linear-gradient(90deg,#16A34A,#22C55E)" }}></i></div></div>))}
  </>);
}

/* ===== billing: plans + payment method ===== */
const PLANS = [
  { id:"free",  name:{en:"Free",zh:"免费版"},  price:{en:"S$0/mo",zh:"S$0/月"},   note:{en:"No monthly fee · S$3 per verified walk-in",zh:"无月费 · 真实到店 S$3/位"} },
  { id:"pro",   name:{en:"Pro",zh:"专业版"},   price:{en:"S$49/mo",zh:"S$49/月"}, note:{en:"Full analytics, brand customization, lower walk-in rate",zh:"完整数据 · 品牌定制 · 更低到店单价"} },
  { id:"chain", name:{en:"Chain",zh:"连锁版"}, price:{en:"Custom",zh:"定制"},     note:{en:"Multi-outlet management, priority support",zh:"多店统一管理 · 专属支持"} },
];
function CardModal({ cardOnFile, onSave, onClose }) {
  const lang = useLang();
  const [num, setNum] = useState(""), [exp, setExp] = useState(""), [cvc, setCvc] = useState("");
  const ok = num.replace(/\s/g,"").length >= 12;
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:420 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{cardOnFile ? tr(lang,"Change card","更换银行卡") : tr(lang,"Add a card","添加银行卡")}</h3>
        <p className="pub-sub">{tr(lang,"Authorization only — we don't charge your card now.","仅预授权绑定 —— 现在不会扣款。")}</p>
        <div className="cardf" style={{ marginBottom:16 }}>
          <div className="cardf-input">
            <input placeholder={tr(lang,"Card number","卡号")} value={num} onChange={e=>setNum(fmtCard(e.target.value))} inputMode="numeric"/>
            <div className="cardf-row">
              <input placeholder={tr(lang,"MM / YY","有效期 MM/YY")} value={exp} onChange={e=>setExp(e.target.value.replace(/[^\d/]/g,"").slice(0,5))} inputMode="numeric"/>
              <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric"/>
            </div>
          </div>
          <p className="cardf-note"><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"First month free. After that, billed per verified walk-in.","第一个月免费。之后按客人真实到店笔数收费。")}</span></p>
        </div>
        <div className="pub-actions">
          <button className="btn ghost lg" onClick={onClose}>{tr(lang,"Cancel","取消")}</button>
          <button className="btn primary lg" disabled={!ok} onClick={()=>{ onSave({ last4: num.replace(/\s/g,"").slice(-4) }); onClose(); }}>{tr(lang,"Save card","保存")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
function PlanModal({ plan, onPick, onClose }) {
  const lang = useLang();
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:440 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"Switch plan","切换套餐")}</h3>
        <p className="pub-sub">{tr(lang,"First month is free on any plan. Change anytime.","任意套餐首月免费，随时可改。")}</p>
        <div className="plans">
          {PLANS.map(pl => (
            <button key={pl.id} className={"plan-opt"+(plan===pl.id?" on":"")} onClick={()=>{ onPick(pl.id); onClose(); }}>
              <div className="plan-l"><div className="plan-nm">{P(lang,pl.name)}{plan===pl.id && <span className="plan-cur">{tr(lang,"Current","当前")}</span>}</div><div className="plan-note">{P(lang,pl.note)}</div></div>
              <div className="plan-price">{P(lang,pl.price)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
function MeView({ brand, setBrand, outlets, setOutlets, cardOnFile, setCardOnFile }) {
  const lang = useLang();
  const fileRef = useRef(null), [busy, setBusy] = useState(false);
  const [name, setName] = useState("Kopi Corner"), [phone, setPhone] = useState("9123 4567");
  const onLogo = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setBusy(true); const rd = new FileReader(); rd.onload = async () => { const url = rd.result; const rgb = await extractColor(url); setBrand(b => ({ ...b, logo:url, logoMark:null, color: rgb ? paletteFromRgb(rgb) : b.color })); setBusy(false); }; rd.readAsDataURL(f); };
  const onProducts = (e) => { const fs = Array.from(e.target.files || []).slice(0,8); Promise.all(fs.map(f => new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f); }))).then(urls => setBrand(b => ({ ...b, products:[...(b.products||[]), ...urls].slice(0,8) }))); };
  const hasBrand = brand.logo || brand.logoMark;
  const [plan, setPlan] = useState("pro");
  const _bill = new URLSearchParams(location.search).get("bill");
  const [cardModal, setCardModal] = useState(_bill==="card"), [planModal, setPlanModal] = useState(_bill==="plan");
  const curPlan = PLANS.find(p=>p.id===plan) || PLANS[1];
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
        <h3>{tr(lang,"Billing & plan","账单与套餐")}</h3>
        <p className="ph-sub">{tr(lang,"First month free — after that you only pay per verified walk-in. Manage your plan and card here.","首月免费 —— 之后只按真实到店笔数收费。在这里管理套餐和银行卡。")}</p>
        <div className="billrow">
          <div className="bill-l"><span className="bill-ic"><Ic.spark style={{ width:16, height:16 }}/></span><div><div className="bill-t">{tr(lang,"Plan","套餐")}</div><div className="bill-v">{P(lang,curPlan.name)} · {P(lang,curPlan.price)}</div></div></div>
          <button className="btn ghost sm" onClick={()=>setPlanModal(true)}>{tr(lang,"Switch plan","切换套餐")}</button>
        </div>
        <div className="billrow">
          <div className="bill-l"><span className="bill-ic"><Ic.card style={{ width:16, height:16 }}/></span><div><div className="bill-t">{tr(lang,"Payment method","付款方式")}</div><div className="bill-v">{cardOnFile ? <>Visa •••• {cardOnFile.last4}</> : <span style={{ color:"var(--muted)" }}>{tr(lang,"No card yet","尚未绑定银行卡")}</span>}</div></div></div>
          <button className="btn ghost sm" onClick={()=>setCardModal(true)}>{cardOnFile ? tr(lang,"Change","更换") : tr(lang,"Add card","添加银行卡")}</button>
        </div>
        <p className="cardf-note" style={{ margin:"12px 2px 0" }}><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"You won't be charged during the first month. No minimum, take activities offline anytime.","首月不扣款。无最低消费，活动随时可下线。")}</span></p>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"KiX app","KiX App")}</h3>
        <p className="ph-sub">{tr(lang,"Your games & activities go live in the KiX app. Get the app to see them the way your customers do.","你的游戏和活动上线在 KiX App 里。装上 App，用客人的视角看它们。")}</p>
        <QRDownload lang={lang}/>
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
      {cardModal && <CardModal cardOnFile={cardOnFile} onSave={setCardOnFile} onClose={()=>setCardModal(false)}/>}
      {planModal && <PlanModal plan={plan} onPick={setPlan} onClose={()=>setPlanModal(false)}/>}
    </div>
  );
}

function AppShell({ game, setGame, brand, setBrand, lang, setLang, sec, setSec, onNewGame, onExit, builder, builderIdx, builderSteps, onLeaveBuild, outlets, setOutlets, activities, setActivities, myGames, setMyGames, initEdit }) {
  const [editing, setEditing] = useState(initEdit || null);
  const [editingAct, setEditingAct] = useState((()=>{ const e=new URLSearchParams(location.search).get("editact"); return e ? (activities[parseInt(e,10)-1]||activities[0]||null) : null; })()); // 调试直达活动编辑器（editact=1/2/3 指定第几个）
  const [cardOnFile, setCardOnFile] = useState(new URLSearchParams(location.search).get("card")==="1" ? { last4:"4242" } : null); // 卡预存储(SetupIntent 语义,不扣款)——仅上线活动时收集
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
  // 复制现有活动：同游戏/券/门店/赢奖条件，名字加副本，回到 draft、清空运行数据，打开编辑器微调
  const dupAct = (act) => { openAct({ ...act, id:"a"+Date.now(), name:{ en:(act.name.en||"Activity")+" (copy)", zh:(act.name.zh||"活动")+"（副本）" }, vouchers:act.vouchers.map(v=>({...v, awarded:0, redeemed:0})), status:"draft" }); };
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
            <span className="si">{Ic[it.icon] && Ic[it.icon]()}</span>{P(lang,it)}{it.badge && liveAct && (inBuild || inEdit || inActEdit || sec!==it.id) && <span className="nbadge">{it.badge}</span>}
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
          {inActEdit && <span className={"act-badge " + ACT_STA[editingAct.status||"draft"].cls}>{(editingAct.status||"draft")==="live" && <span className="b"></span>}{P(lang, ACT_STA[editingAct.status||"draft"])}</span>}
          <div className="app-bar-r">
            {!inBuild && !inEdit && !inActEdit && sec === "activities" && (
              <button className="btn primary" style={{ height:36, fontSize:14, padding:"0 16px" }} onClick={newAct}>+ {tr(lang,"New activity","新建活动")}</button>
            )}
            <div className="acct">
              <button className="acct-btn" onClick={()=>setMenuOpen(v=>!v)}>{avatar}<span className="acct-name">{shopName}</span><Ic.down style={{ width:13, height:13 }}/></button>
              {menuOpen && <><div className="acct-backdrop" onClick={()=>setMenuOpen(false)}/>
                <div className="acct-menu">
                  <div className="am-head">{avatar}<div><div className="sb-name">{shopName}</div><div className="sb-outlet">{P(lang, primary.name||{en:"",zh:""})}</div></div></div>
                  <button className="am-item" onClick={goMe}><Ic.user style={{ width:17, height:17 }}/>{tr(lang,"Account settings","账户设置")}</button>
                  <button className="am-item" onClick={goMe}><Ic.store style={{ width:17, height:17 }}/>{tr(lang,"Outlets","店铺管理")}</button>
                  <button className="am-item" onClick={goMe}><Ic.card style={{ width:17, height:17 }}/>{tr(lang,"Billing & plan","账单与套餐")}</button>
                  <button className="am-item danger" onClick={onExit}><Ic.logout style={{ width:17, height:17 }}/>{tr(lang,"Log out","退出登录")}</button>
                </div></>}
            </div>
          </div>
        </div>
        {inBuild ? <div className="stage" style={{ padding:"22px 28px 60px" }}>{builder}</div>
          : inEdit ? <Workspace game={editing} brand={brand} setBrand={setBrand} setName={(nm)=>{ const id=editing.id; setEditing(g=>({...g, name:{en:nm, zh:nm}})); setMyGames(gs=>gs.map(x=>x.id===id?{...x, name:{en:nm, zh:nm}}:x)); }} />
          : inActEdit ? <ActivityEditor activity={editingAct} setActivity={setEditingAct} outlets={outlets} setOutlets={setOutlets} myGames={myGames} cardOnFile={cardOnFile} setCardOnFile={setCardOnFile} onNewGame={()=>{ setEditingAct(null); onNewGame(); }} onViewGame={(g)=>{ setEditing(g); }} onBack={saveAct} />
          : sec === "home" ? <HomeView game={game} brand={brand} onShare={()=>setSec("redeem")} onRecall={()=>setSec("reports")} activities={activities} liveGame={myGames.find(g=>g.status==="live")} onNewAct={newAct} onRedeem={()=>setSec("redeem")} onGoActivity={()=>{ const first = activities[0]; if (first) openAct(first); else { setSec("activities"); } }} onGoActivities={()=>setSec("activities")} onGoGames={()=>setSec("games")} outlets={outlets} />
          : sec === "activities" ? <ActivitiesView activities={activities} onNew={newAct} onOpen={openAct} onDuplicate={dupAct} />
          : sec === "games" ? <MyGamesView myGames={myGames} onNew={onNewGame} onOpen={(g)=>setEditing(g)} onPublish={(g,patch)=>setMyGames(gs=>gs.map(x=>x.id===g.id?{...x, ...patch, status:"live"}:x))} onOffline={(g)=>setMyGames(gs=>gs.map(x=>x.id===g.id?{...x, status:"draft"}:x))} />
          : sec === "redeem" ? <RedeemView vouchers={actVouchers} onReport={()=>setSec("reports")} hasLive={!!liveAct} hasActs={activities.length>0} onNewAct={newAct} onGoActivities={()=>setSec("activities")} liveName={liveAct ? P(lang, liveAct.name) : ""} />
          : sec === "me" ? <MeView brand={brand} setBrand={setBrand} outlets={outlets} setOutlets={setOutlets} cardOnFile={cardOnFile} setCardOnFile={setCardOnFile} />
          : <ReportsView onTune={()=>setSec("activities")} outlets={outlets} vouchers={actVouchers} hasLive={!!liveAct} hasActs={activities.length>0} hasLiveGame={myGames.some(g=>g.status==="live")} multiAct={activities.filter(a=>a.status==="live").length>=2} onNewAct={newAct} onGoActivities={()=>setSec("activities")} onGoGames={()=>setSec("games")} liveName={liveAct ? P(lang, liveAct.name) : ""} />}
      </main>
    </div>
  );
}

/* ===================== app ===================== */
/* one narrated loader = matching + generating fused (Buell & Norton labor-illusion: visible work feels valuable) */
const BUILD_TASKS = [{en:"Reading your shop type",zh:"读懂你的店型"},{en:"Scanning 1,012 game templates",zh:"扫描 1,012 个玩法模板"},{en:"Ranking by walk-in conversion",zh:"按到店转化率排序"},{en:"Picking the best fits",zh:"挑出最合适的几款"}];
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
  const [game, setGame] = useState(TEMPLATES[0]);
  const [brand, setBrand] = useState({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] });
  const [outlets, setOutlets] = useState(OUTLETS.map(o => ({ ...o })));
  const [myGames, setMyGames] = useState([{...TEMPLATES[0], status:"live"}, {...TEMPLATES[1], status:"draft"}, {...TEMPLATES[3], status:"draft"}]);
  // fresh=1：模拟全新商家首次登录（还没有任何活动）；否则用 demo 活动（老商家演示）
  const _fresh = _p.get("fresh") === "1";
  const [activities, setActivities] = useState(_fresh ? [] : DEFAULT_ACTIVITIES.map(a => ({...a, vouchers:a.vouchers.map(v=>({...v}))})));

  const top = () => window.scrollTo(0,0);
  const toLanding = () => { setScreen("landing"); top(); };
  const enterApp = (sec) => { if (sec) setAppSec(sec); setScreen("app"); top(); };
  const startBuild = () => { setNeed(""); setGame(TEMPLATES[0]); setBrand({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] }); setScreen(authed ? "results" : "describe"); top(); };
  const toPublishGate = () => { setScreen("register"); top(); };
  const backToPreview = () => { setScreen("preview"); top(); };
  // 第三步「确认」= 保存游戏(视觉)，不自动建活动；直接进主页（此时有游戏、无活动 → 主页空态引导建活动）
  const publishDone = () => {
    const firstTime = !authed;          // 经注册首次发布 = 全新商家
    setAuthed(true);
    if (!myGames.find(g => g.id === game.id)) setMyGames(gs => [...gs, game]);
    if (firstTime) setActivities([]);   // 新商家还没有任何活动，主页落到空态（不显示假数据）
    setAppSec("home"); setScreen("app"); top();
  };
  const signIn = () => { setScreen("login"); top(); };
  const loginDone = () => { setAuthed(true); setAppSec("home"); setScreen("app"); top(); };
  const exitBuild = () => { authed ? enterApp(appSec) : toLanding(); };

  const buildTasks = BUILD_TASKS.map(t => P(lang,t));

  let flowStep = null;
  if (screen === "describe") flowStep = <Describe need={need} setNeed={setNeed} onNext={()=>setScreen("building")} />;
  else if (screen === "building") flowStep = <div className="canvas narrow"><Loader title={tr(lang,"Matching games for","正在为你挑玩法")} who={need || tr(lang,"your shop","你的店")} tasks={buildTasks} onDone={()=>setScreen("results")} /></div>;
  else if (screen === "results") flowStep = <Results need={need} onPick={t=>{ setGame(t); setScreen("preview"); top(); }} onBack={()=> authed ? enterApp(appSec) : setScreen("describe")} />;
  else if (screen === "preview" && authed) flowStep = <div><Workspace game={game} brand={brand} setBrand={setBrand} /><div style={{ display:"flex", gap:12, justifyContent:"flex-end", padding:"16px 28px" }}><button className="btn ghost lg" onClick={()=>{ setScreen("results"); top(); }}><Ic.back style={{ width:16, height:16 }}/> {tr(lang,"Back","上一步")}</button><button className="btn primary lg" onClick={publishDone}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Save game","保存游戏")}</button></div></div>;
  else if (screen === "preview") flowStep = <Preview game={game} brand={brand} setBrand={setBrand} onLaunch={toPublishGate} onBack={()=>{ setScreen("results"); top(); }} />;

  const shellProps = { game, setGame, brand, setBrand, lang, setLang, sec:appSec, setSec:setAppSec, onExit:toLanding, outlets, setOutlets, activities, setActivities, myGames, setMyGames };

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
