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
          <div style={{ fontSize:"12.5px", color:"var(--muted)" }}>{tr(lang,"redeem in store","到店扫码兑奖")}</div>
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
const STEPS = [{en:"Name",zh:"店名"},{en:"Pick a game",zh:"选游戏"},{en:"Publish",zh:"上线"}]; // 店名在首页输入=第1步(已完成)
const STEPS_RET = [{en:"Pick a game",zh:"选游戏"},{en:"Edit & publish",zh:"改游戏 · 上线"}]; // 登录后建游戏：免店名，2 步
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
  const lang = useLang();
  const [name, setName] = useState("");
  return (
    <section className="hero">
      <div>
        <span className="hero-tag">{tr(lang,"TURN YOUR BUSINESS INTO A PLAYGROUND","把你的店变成游乐场")}</span>
        <h1 className="hero-h">{tr(lang,"They play.","他们来玩。")}<br/>{tr(lang,"They pay.","他们消费。")}<br/>{tr(lang,"They ","他们")}<span className="hl">{tr(lang,"stay.","留下来。")}</span></h1>
        <div className="hero-chips">
          <span className="hchip"><b>{tr(lang,"3 min","3 分钟")}</b>{tr(lang," to launch"," 上线")}</span>
          <span className="hchip"><b>S$0</b>{tr(lang," to start"," 起步")}</span>
          <span className="hchip">{tr(lang,"First 3 months free","前 3 个月免费")}</span>
          <span className="hchip">{tr(lang,"No hardware","不用装设备")}</span>
        </div>
        <div className="wow-form">
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") go(name); }} placeholder={tr(lang,"Your business name","你的店名")} />
          <button className="btn primary" onClick={()=>go(name)}>{tr(lang,"See my game →","看我的游戏 →")}</button>
        </div>
      </div>
      <div className="visual">
        <div className="visual-col">
          <div className="hscene">
            <span className="lamp" style={{ left:"22%" }}></span>
            <span className="lamp" style={{ left:"46%" }}></span>
            <span className="lamp" style={{ left:"70%" }}></span>
            <div className="cap">{tr(lang,"“Another slow day… same empty seats.”","「又是冷清的一天……还是空座位。」")}</div>
            <div className="floor"></div>
            <div className="counter"></div>
            <div className="person"></div>
          </div>
          <p className="flow-cap">{tr(lang,"A customer ","顾客 ")}<b>{tr(lang,"plays","玩一玩")}</b> → <b>{tr(lang,"wins a voucher","赢一张券")}</b> → <b>{tr(lang,"walks in & redeems","到店兑奖")}</b> → {tr(lang,"becomes a ","变成")}<b>{tr(lang,"regular","常客")}</b></p>
        </div>
      </div>
    </section>
  );
}
function Walkthrough() {
  const lang = useLang();
  const S = [
    { img:"walkthrough/poster.png", pos:"top",    label:tr(lang,"Poster on your door","门口的海报"),        sub:tr(lang,"A passer-by sees it","路过的人看到") },
    { scan:true,                                    label:tr(lang,"Scan — no app","扫码，免下载"),            sub:tr(lang,"Plays right in the browser","浏览器里直接玩") },
    { img:"walkthrough/play.png",   pos:"top",     label:tr(lang,"Plays YOUR game","玩你的专属游戏"),         sub:tr(lang,"A 30-second branded game","30 秒品牌小游戏") },
    { img:"walkthrough/win.png",    pos:"center",  label:tr(lang,"Wins a voucher","赢一张券"),               sub:tr(lang,"A reason to come in now","现在就进店的理由") },
    { img:"walkthrough/redeem.png", pos:"top",     label:tr(lang,"Walks in & redeems (QR)","到店兑奖（扫码）"), sub:tr(lang,"You scan → they're a regular","你一扫 → 成常客") },
  ];
  return (
    <section className="sec" id="the-game">
      <h2 className="sec-h">{tr(lang,"See the game your customer plays","看看你的客人玩的游戏")}</h2>
      <p className="sec-sub">{tr(lang,"A 30-second branded game — scan, play, win a voucher, walk in. No app, nothing to install, on either side.","30 秒品牌小游戏 —— 扫码、玩、赢券、进店。两边都不用下载 App。")}</p>
      <div className="wt-row">
        {S.map((s,i)=>(
          <React.Fragment key={i}>
            <div className="wt-step">
              <div className="wt-phone"><div className="wt-scr">
                {s.scan ? <div className="wt-scan"><i></i></div> : <img src={s.img} alt="" style={{ objectPosition:s.pos }}/>}
              </div></div>
              <div className="wt-label">{s.label}</div>
              <div className="wt-sub">{s.sub}</div>
            </div>
            {i < S.length-1 && <div className="wt-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="ppp">
        <div className="pppc"><div className="k">PLAY</div><h4>{tr(lang,"They play their way in","他们玩着玩着就进店")}</h4><p>{tr(lang,"Your branded game is the hook — no ads to buy.","你的品牌游戏就是钩子 —— 不用买广告。")}</p></div>
        <div className="pppc"><div className="k">PAY</div><h4>{tr(lang,"They win, walk in & spend","他们赢券、进店、消费")}</h4><p>{tr(lang,"A voucher — never cash — turns a play into a paying visit.","一张券（不是现金）把一次游戏变成一次到店消费。")}</p></div>
        <div className="pppc"><div className="k">STAY</div><h4>{tr(lang,"They keep coming back","他们一再回头")}</h4><p>{tr(lang,"Play again, win again, spend again — regulars, not one-offs.","再玩、再赢、再消费 —— 变成常客，而非一次性。")}</p></div>
      </div>
    </section>
  );
}
function SeeYourGame({ go }) {
  const lang = useLang();
  const [name, setName] = useState("");
  return (
    <section className="sec">
      <div className="wow2">
        <div>
          <h2 className="wow-h">{tr(lang,"Type your business name","输入你的店名")}<br/><span className="hl">{tr(lang,"See your game in 3 min","3 分钟看到你的游戏")}</span></h2>
          <p className="wow-sub">{tr(lang,"Our AI matches 1,000+ formats to your trade and auto-brands one with your logo & colors.","AI 从上千种玩法里匹配你的行业，自动套上你的 logo 和品牌色。")}</p>
          <div className="wow-form">
            <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") go(name); }} placeholder={tr(lang,"Your business name","你的店名")} />
            <button className="btn primary" onClick={()=>go(name)}>{tr(lang,"See my game →","看我的游戏 →")}</button>
          </div>
          <div className="wow-note">{tr(lang,"First 3 months free","前 3 个月免费")}</div>
        </div>
        <div className="wow-visual">
          <div className="wow-phone">
            <div className="wow-scr"><img src="walkthrough/play.png" alt="" style={{ objectPosition:"top" }}/></div>
          </div>
        </div>
      </div>
    </section>
  );
}
function WhyGame() {
  const lang = useLang();
  const C = [
    { ic:Ic.gift,   h:tr(lang,"Rewards, never cash","奖励是券，不是现金"),        p:tr(lang,"Winners get a voucher to redeem in your business — so they walk back in and spend, instead of pocketing a discount and leaving.","赢家拿到的是能在你店里兑奖的券 —— 于是他们走回店里消费，而不是揣着折扣离开。") },
    { ic:Ic.shield, h:tr(lang,"Every visit is verified","每一次到店都可验证"),       p:tr(lang,"A door scan proves which plays actually brought someone in. You pay only for real new customers — never for your own regulars.","到店一扫，就知道哪次游戏真的把人带进了门。你只为真正的新客付费 —— 永远不为你的老客买单。") },
    { ic:Ic.globe,  h:tr(lang,"Every game feeds the network","每个游戏都在壮大网络"), p:tr(lang,"Your players discover other businesses on KiX; theirs discover you. The more businesses join, the bigger every playground.","你的玩家在 KiX 上发现别家店，别家的玩家也发现你。加入的店越多，每个人的游乐场就越大。") },
  ];
  return (
    <section className="sec" id="why">
      <h2 className="sec-h">{tr(lang,"Why a game beats a discount","为什么游戏比打折更有效")}</h2>
      <p className="sec-sub">{tr(lang,"Not a one-off coupon — mechanics that make people come back, again and again.","不是一次性优惠券 —— 而是让人一次次回头的机制。")}</p>
      <div className="steps">{C.map((c,i)=>(<div key={i} className="stp"><div className="si">{c.ic()}</div><h3>{c.h}</h3><p>{c.p}</p></div>))}</div>
    </section>
  );
}
function FairDeal() {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"THE FAIR DEAL","公平的规则")}</div>
      <h2 className="sec-h">{tr(lang,"We never charge you for your own regulars","我们从不为你的老客收费")}</h2>
      <p className="sec-sub">{tr(lang,"You pay only when we bring a face that wasn't yours before — never for customers already yours.","只有当我们带来一位从前不属于你的新客时，你才付费 —— 本来就是你的客人，永远免费。")}</p>
      <div className="fair-vs">
        <div className="fvs bad"><div className="lab"><span className="x">✕</span> {tr(lang,"DISCOUNT DEALS","打折平台")}</div><p>{tr(lang,"Deep cuts for everyone — you subsidise regulars who'd have paid anyway, and attract one-time bargain hunters.","全场砍价 —— 你补贴了本来就会买的老客，还招来一次性薅羊毛的人。")}</p></div>
        <div className="fvs good"><div className="lab"><Check/> KiX</div><p>{tr(lang,"Pay only for genuinely new customers we send — verified at your door. Regulars are always free.","只为我们带来的真正新客付费 —— 到店验证。老客永远免费。")}</p></div>
      </div>
    </section>
  );
}
function Faq() {
  const lang = useLang();
  const QA = [
    { q:tr(lang,"Do my customers need to download an app?","客人需要下载 App 吗？"),               a:tr(lang,"No. They scan a QR and play right in the browser. The KiX app is optional — it just unlocks more games and rewards for the ones who love it.","不需要。扫码即在浏览器里玩。KiX App 是可选的 —— 只是给爱玩的人解锁更多游戏和奖励。") },
    { q:tr(lang,"Do I need any hardware or tech skills?","需要任何硬件或技术吗？"),                a:tr(lang,"None. You redeem by scanning the winner's QR with your own phone. No POS changes, no dev work, no agency.","都不用。你用自己的手机扫赢家的二维码即可兑奖。不改 POS、不用开发、不用找代理。") },
    { q:tr(lang,"What does it actually cost?","到底怎么收费？"),                                a:tr(lang,"Free for the first 3 months. After that you pay only as you grow — from S$29/mo, charged only on genuinely new business (never your regulars), capped at 12%.","前 3 个月免费。之后只在你增长时才付费 —— S$29/月起，只算新生意、永不碰老客，封顶 12%。") },
    { q:tr(lang,"I already run a loyalty program — does this replace it?","我已有会员体系 —— 这会取代它吗？"), a:tr(lang,"No, it feeds it. KiX brings new faces through the door; your loyalty program keeps them. They work together.","不会，是给它供血。KiX 把新客带进门，你的会员体系把他们留住。两者协同。") },
    { q:tr(lang,"What if a competitor copies my game?","竞争对手抄我的游戏怎么办？"),               a:tr(lang,"Good — that's the point. They'll need their own, branded to them. Every business that joins makes the whole KiX network bigger — and your players discover more places to play, right alongside you.","好啊 —— 这正是重点。他们得做自己的、套自己的品牌。每加入一家店，整个 KiX 网络就更大 —— 你的玩家也会发现更多可玩的店，就在你旁边。") },
    { q:tr(lang,"Is my customer data safe?","我的客户数据安全吗？"),                             a:tr(lang,"Yes. Your customers and their data stay with your business. KiX is the invisible engine — we never take your customers away.","安全。你的客户和他们的数据都留在你店里。KiX 是隐形引擎 —— 我们从不把你的客户带走。") },
  ];
  return (
    <section className="sec">
      <div className="sec-eye" id="questions">{tr(lang,"QUESTIONS","常见问题")}</div>
      <h2 className="sec-h">{tr(lang,"Everything a business owner asks","店主最关心的问题")}</h2>
      <div className="faq">{QA.map((x,i)=>(<div key={i} className="faq-item"><div className="faq-q">{x.q}</div><div className="faq-a">{x.a}</div></div>))}</div>
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
      <div className="sec-eye">{tr(lang,"THE GAMEPLAY ENGINE","玩法引擎")}</div>
      <h2 className="sec-h">{tr(lang,"One gameplay engine — AI picks the mechanic that fits your shop","一套玩法引擎，AI 挑一个适合你店的玩法")}</h2>
      <p className="sec-sub">{tr(lang,"Spin, scratch, stack, catch — 1,000+ play mechanics, each wrapped in your brand.","转盘、刮刮乐、叠叠乐、接一接…上千种玩法，每个都能套上你的品牌。")}</p>
      <div className="gallery">{GAMES.map((g, i) => (
        <div key={i} className="gtile" onClick={go}><div className="art"><GamePreview kind={g.kind} colors={g.g} /></div><div className="cap">{P(lang,g.n)}<div className="sm">{P(lang,g.t)}</div></div></div>))}</div>
      <div className="gallery-foot">{tr(lang,"Plus ","还有 ")}<b style={{ color:"var(--ink)" }}>1,000+</b>{tr(lang," templates — make any of them your own","个模板 · 每个都能换成你的品牌")}</div>
    </section>
  );
}
function Steps() {
  const lang = useLang();
  const S = [{ i:Ic.gamepad, h:tr(lang,"Pick a game","挑一个游戏"), p:tr(lang,"Choose a format that fits your shop from 1,000+ templates.","从上千个模板里选一个适合你店的玩法。") },{ i:Ic.palette, h:tr(lang,"Add your brand","套上你的品牌"), p:tr(lang,"Drop in your logo and photos — AI auto-colors and builds it.","传 logo 和商品图，AI 自动配色、生成游戏。") },{ i:Ic.store, h:tr(lang,"Redeem in store","客人到店兑奖"), p:tr(lang,"Winners walk in; you scan their QR or swipe to redeem.","赢家凭二维码到店，你一扫或滑动兑奖即可。") }];
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"HOW IT WORKS","三步上线")}</div><h2 className="sec-h">{tr(lang,"Three steps to open for business","三步做好，开门收客")}</h2>
      <div className="steps">{S.map((s, i) => (<div key={i} className="stp"><div className="sn">0{i+1}</div><div className="si">{s.i()}</div><h3>{s.h}</h3><p>{s.p}</p></div>))}</div>
    </section>
  );
}
const STORIES = [
  { init:"一", img:"stories/yifang.png", tone:["#16A34A","#22C55E"], name:{en:"YiFang Fruit Tea",zh:"一芳水果茶"}, type:{en:"Fruit tea · new store",zh:"水果茶 · 新店"},
    metric:"48%", metricL:{en:"walk-in rate in 4 weeks",zh:"4 周到店率"},
    quote:{en:"People who scanned to play actually walked through the door in our first month.",zh:"开业第一个月，扫码玩的人真的走进了店里。"} },
  { init:"冰", img:"stories/gelato.png", tone:["#0EA5E9","#38BDF8"], name:{en:"A gelato shop",zh:"街角冰激凌店"}, type:{en:"Ice cream · summer",zh:"冰激凌 · 夏季拉新"},
    metric:"1,500", metricL:{en:"new customers walked in",zh:"新客到店"},
    quote:{en:"Through the busy summer weeks, new faces kept coming in wave after wave.",zh:"夏天最忙那几周，新客一波接一波地进来。"} },
  { init:"咖", img:"stories/coffee.png", tone:["#B45309","#D97706"], name:{en:"A coffee shop",zh:"街角咖啡店"}, type:{en:"Coffee · win-back",zh:"咖啡 · 老客召回"},
    metric:"29%", metricL:{en:"regulars won back",zh:"老客召回复购"},
    quote:{en:"Regulars who hadn't visited in 30 days came back with a single voucher.",zh:"30 天没来的老客，一张券就请回来了。"} },
];
function Stories() {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"MERCHANT STORIES","商家的故事")}</div>
      <h2 className="sec-h">{tr(lang,"Real shops, real walk-ins","真实的店，真实的到店")}</h2>
      <p className="sec-sub">{tr(lang,"How neighbourhood shops turn a game into customers through the door.","看街边小店怎么把一个游戏变成走进门的客人。")}</p>
      <div className="stories">
        {STORIES.map((s,i)=>(
          <div key={i} className="story">
            <div className="story-hd"><span className="story-av" style={{ background:`linear-gradient(145deg,${s.tone[0]},${s.tone[1]})` }}>{s.init}{s.img && <img className="story-logo" src={s.img} alt="" onError={e=>e.currentTarget.remove()}/>}</span><div><div className="story-nm">{P(lang,s.name)}</div><div className="story-ty">{P(lang,s.type)}</div></div></div>
            <div className="story-metric"><b>{s.metric}</b><span>{P(lang,s.metricL)}</span></div>
            <p className="story-q">“{P(lang,s.quote)}”</p>
          </div>
        ))}
      </div>
    </section>
  );
}
function Pricing({ go }) {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye" id="pricing">{tr(lang,"PRICING","价格")}</div><h2 className="sec-h">{tr(lang,"Free for 3 months. Then pay only as you grow.","前 3 个月免费，之后只在你增长时才付费。")}</h2>
      <div className="tiers">
        <div className="tier"><div className="tname">{tr(lang,"FREE TO START","免费开始")}</div><div className="price">S$0</div><div className="pdesc">{tr(lang,"New to KiX","初次上手")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"Your branded game","你的品牌游戏")}</li><li><span className="ck"><Check/></span>{tr(lang,"Unlimited plays","不限游玩次数")}</li><li><span className="ck"><Check/></span>{tr(lang,"Redemption + dashboard","到店兑奖 + 看板")}</li></ul>
          <button className="btn ghost" onClick={go}>{tr(lang,"Start free","免费开始")}</button></div>
        <div className="tier pop"><div className="pbadge">{tr(lang,"Best value","最超值")}</div><div className="tname">{tr(lang,"GROW WITH KIX","成长版")}</div><div className="price"><span style={{ fontSize:"15px", fontWeight:700, color:"var(--muted)" }}>{tr(lang,"from ","低至 ")}</span>S$29<small>{tr(lang," / mo"," / 月")}</small></div><div className="pdesc">{tr(lang,"Growing shops","成长中的门店")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"Unlimited games & campaigns","不限游戏与活动")}</li><li><span className="ck"><Check/></span>{tr(lang,"Only new business, never your regulars — capped at 12%","只算新生意、永不碰老客 —— 封顶 12%")}</li><li><span className="ck"><Check/></span>{tr(lang,"Cheaper as you grow · all stores, one bill","越做越便宜 · 多店合并一张账单")}</li></ul>
          <button className="btn primary" onClick={go}>{tr(lang,"Get started","立即开始")}</button></div>
        <div className="tier"><div className="tname">{tr(lang,"GROW FASTER (optional)","加速拉新（可选）")}</div><div className="price" style={{ fontSize:"27px" }}>{tr(lang,"You set the price","你来定价")}</div><div className="pdesc">{tr(lang,"Want more new customers","想要更多新客")}</div>
          <ul><li><span className="ck"><Check/></span>{tr(lang,"Only pay for genuinely new faces","只为真正的新客付费")}</li><li><span className="ck"><Check/></span>{tr(lang,"Free until they come back","回头前不收费")}</li><li><span className="ck"><Check/></span>{tr(lang,"Multi-outlet · custom plans","多门店 · 定制方案")}</li></ul>
          <button className="btn ghost">{tr(lang,"Talk to us","联系我们")}</button></div>
      </div>
    </section>
  );
}
function Landing({ go, onSignIn, lang, setLang }) {
  return (
    <div className="wrap">
      <nav>
        <div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/></div>
        <div className="navlinks"><a onClick={(e)=>{e.preventDefault();document.getElementById("the-game")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"The game","游戏")}</a><a onClick={(e)=>{e.preventDefault();document.getElementById("why")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"Why it works","为什么有效")}</a><a onClick={(e)=>{e.preventDefault();document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"Pricing","价格")}</a><a onClick={(e)=>{e.preventDefault();document.getElementById("questions")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"Questions","常见问题")}</a></div>
        <div className="navright"><LangToggle lang={lang} setLang={setLang} /><a className="signin" onClick={(e)=>{e.preventDefault();onSignIn();}} href="#">{tr(lang,"Sign in","登录")}</a><button className="btn dark sm" onClick={go}>{tr(lang,"Start free","免费开始")}</button></div>
      </nav>
      <Hero go={go} />
      <Walkthrough/>
      <SeeYourGame go={go} />
      <WhyGame/>
      <Pricing go={go} />
      <Faq/>
      <section className="sec final-sec">
        <h2 className="final-h">{tr(lang,"Every business deserves its own ","每家店都值得拥有自己的 ")}<span className="hl">{tr(lang,"playground.","游乐场。")}</span></h2>
        <p className="final-sub">{tr(lang,"Go live today — and give every visit a reason to come back.","今天就上线 —— 让每一次到店都有回头的理由。")}</p>
        <button className="btn primary final-cta" onClick={go}>{tr(lang,"Build my game — free →","免费搭建我的游戏 →")}</button>
        <div className="final-fine">{tr(lang,"First 3 months free · regulars always free · cancel anytime","前 3 个月免费 · 老客永远免费 · 随时取消")}</div>
      </section>
      <footer><div>{tr(lang,"KiX · built for neighbourhood shops","KiX · 为街边小店而做")}</div><div>Mozat Pte Ltd · Singapore</div></footer>
    </div>
  );
}

/* ===================== register (publish gate) ===================== */
function Register({ onDone, onSignIn, onSaveCard, onBack }) {
  const lang = useLang();
  const [rstep, setRstep] = useState(new URLSearchParams(location.search).get("rstep")==="card" ? "card" : "account");   // account → card（收卡放最后一步，Airwallex）
  const [name, setName] = useState(""), [phone, setPhone] = useState(""), [country, setCountry] = useState(0);
  const [num, setNum] = useState(""), [exp, setExp] = useState(""), [cvc, setCvc] = useState("");
  const acctOk = name.trim() && phone.trim();
  const cardOk = num.replace(/\s/g,"").length >= 12 && exp.trim().length >= 4 && cvc.trim().length >= 3;
  const chargeDate = (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toLocaleDateString(lang==="zh"?"zh-CN":"en-GB",{ year:"numeric", month:"short", day:"numeric" }); })();
  const finish = () => { onSaveCard && onSaveCard({ last4: num.replace(/\s/g,"").slice(-4) || "4242" }); onDone(); };
  return (
    <div className="reg-wrap">
      {/* 返回只在"账号"步(回预览)；绑卡步不给返回——卡要绑定刚建的账户，不可回退 */}
      {rstep === "account" && <button className="canvas-back reg-back" onClick={onBack}><Ic.back style={{ width:15, height:15 }}/> {tr(lang,"Back","上一步")}</button>}
      <div className="reg-card">
      <div className="reg-steps"><span className={rstep==="account"?"on":"done"}>1 · {tr(lang,"Account","账号")}</span><i></i><span className={rstep==="card"?"on":""}>2 · {tr(lang,"Card","绑卡")}</span></div>
      {rstep === "account" ? <>
        <h1>{tr(lang,"Last step: create your account","最后一步：创建你的账号")}</h1>
        <div className="field"><label>{tr(lang,"Shop name","商家名称")} <span className="req">*</span></label><input value={name} onChange={e=>setName(e.target.value)} placeholder={tr(lang,"e.g. Kopi Corner","例如：Kopi Corner")}/></div>
        <div className="field"><label>{tr(lang,"Country / region","国家 / 地区")} <span className="req">*</span></label><select value={country} onChange={e=>setCountry(+e.target.value)}>{COUNTRIES.map((c,i)=><option key={i} value={i}>{c.flag} {P(lang,c)}</option>)}</select></div>
        <div className="field"><label>{tr(lang,"Mobile","手机号")} <span className="opt">{tr(lang,"(for WhatsApp)","（用于 WhatsApp 联系）")}</span> <span className="req">*</span></label>
          <div className="phonewrap"><input className="cc" value="+65" readOnly/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="9123 4567" onKeyDown={e=>{ if(e.key==="Enter"&&acctOk) setRstep("card"); }}/></div></div>
        <button className="btn primary" disabled={!acctOk} onClick={()=>setRstep("card")}>{tr(lang,"Continue","继续")}</button>
        <div className="reg-fine">{tr(lang,"By continuing you agree to our ","继续即表示同意 ")}<a>{tr(lang,"Terms","服务条款")}</a>{tr(lang," & ","与 ")}<a>{tr(lang,"Privacy","隐私政策")}</a>。{tr(lang,"Have an account? ","已有账号？")}<a onClick={onSignIn} style={{ cursor:"pointer" }}>{tr(lang,"Sign in","登录")}</a></div>
      </> : <>
        <h1>{tr(lang,"Add a card to go live","绑张卡就能上线")}</h1>
        <p className="login-sub">{tr(lang,"Free for 3 months, then from S$29/mo — only new business, regulars always free.","前 3 个月免费，之后 S$29/月起 —— 只算新生意、老客永远免费。")}</p>
        <div className="trust-list">
          <div className="trust-row"><Ic.bell/><span>{tr(lang,`We'll remind you 7 days before it ends — around ${chargeDate}.`,`到期前 7 天提醒你 —— 大约 ${chargeDate}。`)}</span></div>
          <div className="trust-row"><Ic.check/><span>{tr(lang,"Pause or cancel anytime, no minimum.","随时下线或取消，无最低消费。")}</span></div>
          <div className="trust-row"><Ic.shield/><span>{tr(lang,"Airwallex-encrypted — we never see your card number.","卡号由 Airwallex 加密 —— 我们看不到。")}</span></div>
        </div>
        <div className="cardf">
          <div className="cardf-input">
            <input placeholder={tr(lang,"Card number","卡号")} value={num} onChange={e=>setNum(fmtCard(e.target.value))} inputMode="numeric"/>
            <div className="cardf-row">
              <input placeholder={tr(lang,"MM / YY","有效期 MM/YY")} value={exp} onChange={e=>setExp(e.target.value.replace(/[^\d/]/g,"").slice(0,5))} inputMode="numeric"/>
              <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric"/>
            </div>
          </div>
        </div>
        <button className="btn primary" disabled={!cardOk} onClick={finish}>{tr(lang,"Add card & go live","绑卡并上线")}</button>
        <div className="charge-note">{tr(lang,"You won't be charged today.","今天不会扣款。")}</div>
      </>}
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
function Results({ need, onPick, onBack, onRename }) {
  const lang = useLang();
  const n = TEMPLATES.length;
  const [i, setI] = useState(Math.max(0, TEMPLATES.findIndex(t=>t.recommended)));
  const [editing, setEditing] = useState(false);
  const [buf, setBuf] = useState(need||"");
  const name = (need||"").trim() || tr(lang,"your shop","你的店");
  const _w = name.split(/\s+/).filter(Boolean);
  const initial = (_w.length>1 ? _w.slice(0,2).map(w=>w[0]).join("") : name.slice(0,2)).toUpperCase();
  // 由店名派生一套稳定的品牌配色（改名即换色、实时重新品牌化）
  const color = COLOR_SETS[[...name].reduce((a,c)=>a+c.charCodeAt(0),0) % COLOR_SETS.length];
  const cur = TEMPLATES[i];
  const go = (d) => setI(x => (x+d+n)%n);
  const commitName = () => { onRename && onRename(buf.trim()); setEditing(false); };
  return (
    <div className="canvas gp2">
      {onBack && <button className="canvas-back" onClick={onBack}><Ic.back style={{ width:15, height:15 }}/> {tr(lang,"Back","上一步")}</button>}
      <div className="center" style={{ marginBottom:20 }}>
        <h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{tr(lang,"Here's your game","这是你的游戏")}</h1>
      </div>
      <div className="gp2-grid">
        <div className="gp2-r">
          <div className="gp2-phone"><div className="gp2-screen">
            <div className="gp2-brandbar"><span className="gp2-av" style={{ background:`linear-gradient(135deg,${color[0]},${color[1]})` }}>{initial}</span><b>{name}</b></div>
            <GamePreview kind={cur.kind} colors={color} />
          </div></div>
          <button className="btn ghost lg gp2-another" onClick={()=>go(1)}><Ic.refresh style={{ width:16, height:16 }}/> {tr(lang,"Show me another","换一个看看")}</button>
        </div>
        <div className="gp2-l">
          <div className="gp2-typed">
            {editing
              ? <input autoFocus className="gp2-name-in" value={buf} onChange={e=>setBuf(e.target.value)} onBlur={commitName} onKeyDown={e=>{ if(e.key==="Enter") commitName(); }} placeholder={tr(lang,"Your business name","你的店名")}/>
              : <><span className="gp2-typed-lbl">{tr(lang,"YOU TYPED","你输入了")}</span> <b>{name}</b> <button className="gp2-edit" onClick={()=>{ setBuf(need||""); setEditing(true); }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> {tr(lang,"edit","改")}</button></>}
          </div>
          <div className="gp2-game">
            <span className="gp2-game-nm">{P(lang,cur.name)}{cur.recommended && <span className="gp2-pick"><Ic.spark style={{ width:11, height:11 }}/> {tr(lang,"AI pick","AI 首选")}</span>}</span>
            <div className="gp2-why-lbl">{tr(lang,"WHY THIS ONE","推荐理由")}</div>
            <p className="gp2-game-why">{P(lang,cur.lede)}</p>
          </div>
          <div className="gp2-actions">
            <button className="btn primary lg" onClick={()=>onPick(cur, color)}>{tr(lang,"Use this game","用这个游戏")} <Ic.arrow/></button>
          </div>
        </div>
      </div>
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
        ? tr(lang,"We hand out your uploaded codes in order until they run out; redemption verifies against your codes.","按你上传的券码依次发放、发完即停；兑奖时校验你的券码/二维码。")
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
  const [branded, setBranded] = useState(true);    // 第2步已按店名套好品牌 → 进来即编辑态，直接上线
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
      <div className="center" style={{ marginBottom:18 }}><h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{branded ? tr(lang,"One last tweak","最后微调一下") : tr(lang,"Make it yours, then generate","换成你的品牌，点生成")}</h1></div>
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
            {branded ? <button className="btn ghost lg" onClick={generate}><Ic.refresh/> {tr(lang,"Shuffle look","换个样子")}</button> : <span/>}
            {!branded
              ? <button className="btn primary lg" onClick={generate} disabled={gen}><Ic.spark style={{ width:18, height:18 }}/> {gen ? tr(lang,"Generating…","生成中…") : hasInput ? tr(lang,"Generate my game","生成我的定制游戏") : tr(lang,"Generate with suggested colors","用推荐配色生成")}</button>
              : <button className="btn primary lg" onClick={onLaunch}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Publish","上线")}</button>}
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
  { id:"redeem",     icon:"target",    en:"Redeem",     zh:"兑奖", badge:3 },
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

function HomeView({ game, brand, onShare, onRecall, activities, liveGame, onNewAct, onRedeem, onGoActivity, onGoActivities, onGoGames, onGoReports, outlets = OUTLETS }) {
  const lang = useLang();
  const [recalled, setRecalled] = useState(false);
  const [scanOk, setScanOk] = useState(false);
  const [scanning, setScanning] = useState(false);
  const doScan = () => { setScanning(true); setTimeout(() => { setScanning(false); setScanOk(true); setTimeout(() => setScanOk(false), 2800); }, 1700); };
  const liveAct = activities && activities.find(a => a.status === "live");
  const hasActs = activities && activities.length > 0;
  const M = DEMO_METRICS;
  // 分水岭：有真实到店(redeemed≥1) → 营业态 S2；否则启动态 S1。?nowalkins=1 演示"已上线待到店"
  const _p = new URLSearchParams(location.search);
  const _nw = _p.get("nowalkins") === "1";
  const walkins = _nw ? 0 : M.walkins;
  const hasWalkins = !!liveAct && walkins > 0;
  // 试用剩余天数（?trialleft=N 演示临近到期）；≤14 天亮预警 + 到期费率
  const trialLeft = +_p.get("trialleft") || 47;
  const trialEnding = trialLeft <= 14;
  // 券快发完提醒（发完即停=静默失败）：live 活动中券剩余 ≤15% 的
  const lowStock = (activities||[]).filter(a=>a.status==="live").map(a=>{ const v=a.vouchers&&a.vouchers[0]; const qty=(v&&+v.qty)||0, rem=Math.max(0,qty-((v&&+v.awarded)||0)); return { a, qty, rem, pct: qty?rem/qty:1 }; }).filter(x=>x.qty>0 && x.pct<=0.15).sort((p,q)=>p.rem-q.rem);
  // 当前 live 活动的券剩余（hero 第三个生命体征）
  const _lv = liveAct && liveAct.vouchers && liveAct.vouchers[0];
  const vQty = (_lv&&+_lv.qty)||0, vRem = _lv ? Math.max(0, vQty-((+_lv.awarded)||0)) : 0, vLow = vQty>0 && vRem/vQty<=0.15;
  // 启动态 hero：按进度只给一个下一步动作
  const sh = liveAct
    ? { badge:tr(lang,"Live · waiting for the first walk-in","已上线 · 等第一位到店"), dark:true, title:P(lang,liveAct.name)+" · "+tr(lang,"up and running","进行中"), sub:tr(lang,"Print your outlet QR and put it where customers can scan it.","把门店二维码打印出来，贴在客人扫得到的地方。"), cta:tr(lang,"Download outlet QR","下载门店二维码"), on:onGoActivities }
    : liveGame
    ? { badge:"LIVE", dark:true, title:P(lang,liveGame.name)+" · "+tr(lang,"up and running","进行中"), sub:tr(lang,"Customers scan and play. Want to hand out prizes and turn them into walk-ins? Add an activity.","客人扫码就能玩。想送奖品、把人变成到店客？加一个活动。"), cta:"+ "+tr(lang,"New activity","新建活动"), on:onNewAct }
    : hasActs
    ? { badge:tr(lang,"Draft","修改中"), dark:false, title:tr(lang,"Finish and publish your activity","完善并上线你的活动"), sub:tr(lang,"Set a voucher, pick outlets, then go live — customers scan to play.","设一张券、选门店，点上线 —— 客人扫码就能玩。"), cta:tr(lang,"Finish activity","去完善"), on:onGoActivity }
    : { badge:tr(lang,"No activity yet","暂时还没有活动"), dark:false, title:tr(lang,"Create an activity to open for business","建个活动，就能开门营业"), sub:tr(lang,"Pick outlets, set a voucher, link your game — customers scan to play.","选门店、设一张券、绑上你的游戏 —— 客人扫码就能玩。"), cta:"+ "+tr(lang,"New activity","新建活动"), on:onNewAct };
  return (
    <div className="app-body">
      {hasWalkins ? (
        /* ===== S2 营业态：收银台 + 成本一瞥 + 最近 + 召回（无上手清单，已毕业）===== */
        <>
          <div className="home-hero">
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span className="hl-live"><span className="b"></span>LIVE</span>
                <h3 style={{ margin:0, cursor:"pointer" }} onClick={onGoActivity}>{P(lang, liveAct.name)} · {tr(lang,"up and running","进行中")} <Ic.arrow style={{ width:13, height:13, opacity:.45 }}/></h3>
              </div>
              <div className="live3">
                <div className="lc"><div className="n">{M.today.plays}</div><div className="l">{tr(lang,"played today","今天玩了")}</div></div>
                <div className="lc"><div className="n">{M.today.redeemed}</div><div className="l">{tr(lang,"walked in & redeemed","到店兑奖")}</div></div>
                {vQty>0 && <div className="lc"><div className={"n"+(vLow?" low":"")}>{vRem}</div><div className="l">{tr(lang,"vouchers left","券剩余")}</div></div>}
              </div>
            </div>
            <button className="btn primary" style={{ alignSelf:"center", marginLeft:20, flexShrink:0, display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }} onClick={onRedeem}>
              <Ic.target style={{ width:16, height:16 }}/>{tr(lang,"Scan to redeem","扫码兑奖")}
            </button>
          </div>
          {/* 成本一瞥：进门第一眼看到花多少（P3）*/}
          <button className={"home-cost"+(trialEnding?" ending":"")} onClick={onGoReports}>
            <span className="hc-cell"><b>{M.newCust}</b> {tr(lang,"new customers this month","本月新客")}</span>
            <span className="hc-trial">{trialEnding
              ? <>{<Ic.bell style={{ width:13, height:13 }}/>} {tr(lang,`Free trial ends in ${trialLeft} days · then from S$29/mo`,`试用还剩 ${trialLeft} 天 · 到期后 S$29/月起`)}</>
              : <>{<Ic.spark style={{ width:13, height:13 }}/>} {tr(lang,`First 3 months free · ${trialLeft} days left · now S$0`,`首 3 个月免费 · 还剩 ${trialLeft} 天 · 现在 S$0`)}</>}</span>
            <Ic.arrow style={{ width:14, height:14, marginLeft:"auto", opacity:.5 }}/>
          </button>
          {lowStock.length>0 && <button className={"lowstock"+(lowStock[0].rem===0?" out":"")} onClick={onGoActivities}>
            <span className="ls-ic"><Ic.bell style={{ width:17, height:17 }}/></span>
            <span className="ls-t">{lowStock[0].rem===0
              ? tr(lang,`"${P(lang,lowStock[0].a.name)}" is all out of vouchers — players can't win`,`「${P(lang,lowStock[0].a.name)}」券已发完 —— 客人现在赢不到奖了`)
              : tr(lang,`"${P(lang,lowStock[0].a.name)}" has only ${lowStock[0].rem} vouchers left — runs out then stops`,`「${P(lang,lowStock[0].a.name)}」只剩 ${lowStock[0].rem} 张券 —— 发完就停`)}</span>
            <span className="ls-cta">{tr(lang,"Top up","去加券")} <Ic.arrow style={{ width:13, height:13 }}/></span>
          </button>}
          <div className="panel" style={{ marginTop:16 }}>
            <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent","最近")}</h4>
            {FEED.slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
          </div>
          <div className={"recall" + (recalled ? " ok" : "")}>
            <span className="ri">{recalled ? <Ic.check/> : <Ic.bell/>}</span>
            {recalled
              ? <div className="rt"><b>{tr(lang,"Win-back reminder sent to 18 regulars","召回通知已发送给 18 位老顾客")}</b><p>{tr(lang,"They've been nudged to come back — you'll see them walk in soon.","已提醒他们回店 —— 等他们回头来玩、来兑奖就行。")}</p></div>
              : <><div className="rt"><b>{tr(lang,"18 regulars haven't visited in 30+ days","有 18 位老顾客，超过 30 天没来了")}</b><p>{tr(lang,"Send a one-tap win-back reminder — your easiest repeat business.","一键发送召回通知，把他们请回来 —— 这是你最容易赢回的复购。")}</p></div>
                <button className="btn primary lg" onClick={()=>setRecalled(true)}>{tr(lang,"Send reminder to 18","通知召回 18 人")}</button></>}
          </div>
        </>
      ) : (
        /* ===== S1 启动态：唯一 CTA 在 hero + 进度清单(无按钮) + 计费心智 ===== */
        <>
          <div className={"home-hero" + (sh.dark ? "" : " empty")}>
            <div>
              <span className="hl-live" style={sh.dark ? {} : { background:"rgba(255,255,255,.12)", color:"#cdd8e4" }}>{sh.badge==="LIVE" ? <><span className="b"></span>LIVE</> : sh.badge}</span>
              <h3 style={{ marginTop:12 }}>{sh.title}</h3>
              <p style={{ color:"#9fb0c4", fontSize:14, margin:"6px 0 0", maxWidth:"42ch" }}>{sh.sub}</p>
            </div>
            <div style={{ marginLeft:"auto", alignSelf:"center" }}>
              <button className="btn primary lg" onClick={sh.on}>{sh.cta}</button>
            </div>
          </div>
          <div className="panel nudge" style={{ marginTop:18 }}>
            <h4 style={{ marginBottom:14 }}>{tr(lang,"Get your first wave playing","让第一波人玩起来")}</h4>
            <div className="nstep done"><span className="nt"><Ic.check/></span>{tr(lang,"Game created","游戏已创建")}</div>
            <div className={"nstep "+(liveAct?"done":"cur")}><span className="nt">{liveAct?<Ic.check/>:"2"}</span>{tr(lang,"Publish an activity","上线活动")}</div>
            <div className={"nstep "+(liveAct?"cur":"")}><span className="nt">3</span>{tr(lang,"Print QR per outlet","打印各门店二维码")}</div>
            <div className="nstep"><span className="nt">4</span>{tr(lang,"First customer walks in","第一位客人到店")}</div>
            <div className="nudge-free"><Ic.shield style={{ width:13, height:13, flexShrink:0 }}/> {tr(lang,"First 3 months free · regulars always free","首 3 个月免费 · 老客永远免费")}</div>
          </div>
        </>
      )}
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
      <p className="ph-sub" style={{ margin:"0 0 16px" }}>{tr(lang,"Games are your branded mini-games — customers scan and play. To hand out prizes and bring them in, add an ","游戏 = 你的品牌小游戏，客人扫码就能玩。想送奖品、把人带到店 → 去")}<b>{tr(lang,"Activity","「活动」")}</b>{tr(lang,".","加奖品和时限。")}</p>
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
                <div className="st">{status==="live" ? tr(lang,"Live · scan to play (no prizes)","已上线 · 可扫码玩（纯玩、无奖品）") : tr(lang,"Not live yet","未上线")}</div>
                {status==="live"
                  ? <><button className="btn ghost sm inapp" style={{ width:"100%", marginTop:10 }} onClick={(e)=>{ e.stopPropagation(); setAppQr(true); }}><Ic.phone style={{ width:14, height:14 }}/> {tr(lang,"View in app","在 App 查看")}</button>
                      <button className="btn ghost sm" style={{ width:"100%", marginTop:8 }} onClick={(e)=>{ e.stopPropagation(); onOffline(g); }}>{tr(lang,"Take offline","下线")}</button></>
                  : <button className="btn primary sm" style={{ width:"100%", marginTop:10 }} onClick={(e)=>{ e.stopPropagation(); setPubGame(g); }}><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Publish","上线")}</button>}
              </div>
            </div>
          );
        })}
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
  // 空状态分级：没 live 活动 = 无券可兑奖；有 live 但还没人赢券 = 等客人玩
  if (!hasLive) return (
    <div className="app-body"><EmptyState
      icon={<Ic.target/>}
      title={hasActs ? tr(lang,"Your activity isn't live yet","活动还没上线") : tr(lang,"Nothing to redeem yet","还没有可兑奖的奖品")}
      sub={hasActs
        ? tr(lang,"It's still being edited. Once it's live, customers play, win vouchers — then you scan to redeem here.","活动还在修改中。上线后客人才能玩、赢券，你才能在这里扫码兑奖。")
        : tr(lang,"Create an activity and publish it. Customers play, win a voucher, walk in — you scan it here, and that counts as a real walk-in.","先建一个活动并上线。客人玩、赢券、到店，你在这里一扫，就算一次真实到店。")}
      actLabel={hasActs ? tr(lang,"Go to activities","去活动") : "+ "+tr(lang,"New activity","新建活动")}
      onAct={hasActs ? onGoActivities : onNewAct}
    /></div>
  );
  if (totAwarded === 0) return (
    <div className="app-body"><EmptyState
      icon={<Ic.target/>}
      title={tr(lang,"No prizes won yet","还没有人赢到奖品")}
      sub={tr(lang,"Stick your activity QR on the counter and share it. As soon as someone plays and wins, their prize shows up here to redeem.","把活动二维码贴到收银台、分享出去。客人一玩、一赢券，就会出现在这里等你兑奖。")}
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
          <h3>{tr(lang,"Redeem at the counter","到店兑奖")}</h3>
          <p>{tr(lang,"Scan the customer's prize QR — or type their code.","扫客人的奖品二维码 —— 或输入奖品码。")}</p>
          {scanning
            ? <div className="scanbox"><div className="scanline"></div><Ic.qr style={{ width:56, height:56, color:"#fff", opacity:.55 }}/><div className="scan-t">{tr(lang,"Point at the customer's QR…","对准客人的二维码…")}</div></div>
            : <button className="btn primary lg scanbtn" onClick={scan}><Ic.qr style={{ width:20, height:20 }}/> {tr(lang,"Scan QR to redeem","扫码兑奖")}</button>}
          <div className="redeem-or"><span>{tr(lang,"or enter the code","或 输入奖品码")}</span></div>
          <div className="redeem-input"><input value={code} onChange={e=>setCode(e.target.value)} placeholder={tr(lang,"prize code","奖品码")} onKeyDown={e=>{ if(e.key==="Enter") submit(); }}/><button className="btn primary" onClick={submit}>{tr(lang,"Redeem","兑奖")}</button></div>
          {ok && <div className="redeem-ok"><Ic.check/> {tr(lang,"Redeemed — counted as a real walk-in","兑奖成功 —— 已计入真实到店")}</div>}
        </div>
        {reds.length > 0 && <div className="panel">
          <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent redemptions","最近兑奖")}</h4>
          {reds.slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
        </div>}
      </div>

      <div className="rd-right">
        {/* 简要概览 — 当下要瞄一眼的数；完整分析在「数据」页 */}
        <div className="rd-summary" style={{ marginTop:0 }}>
          <div className="rd-sum"><div className="n">{DEMO_METRICS.today.redeemed}</div><div className="l">{tr(lang,"redeemed today","今日兑奖")}</div></div>
          <div className="rd-sum"><div className="n">{toCome}</div><div className="l">{tr(lang,"not yet redeemed","待兑奖")}</div></div>
          <div className="rd-sum"><div className="n">{totRedeemed}</div><div className="l">{tr(lang,"redeemed total","累计兑奖")}</div></div>
        </div>
        <div className="panel">
          <div className="panel-head"><h4 style={{ fontSize:16, fontWeight:800, margin:0 }}>{tr(lang,"Voucher status","奖品券兑奖")}</h4><button className="panel-link" onClick={onReport}>{tr(lang,"Full report","查看完整数据")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Redeemed / total issued · per-outlet & trends in Reports","已兑奖 / 总张数 · 各门店与趋势看「数据」")}</p>
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
// ⋯ 溢出菜单：低频操作收纳（复制/二维码/在App查看），点外部关闭
function Kebab({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="kebab" ref={ref}>
      <button className="kebab-btn" aria-label="More" onClick={(e)=>{ e.stopPropagation(); setOpen(o=>!o); }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
      </button>
      {open && <div className="kebab-menu" onClick={e=>e.stopPropagation()}>
        {items.map((it,i)=>(<button key={i} className="kebab-item" onClick={()=>{ setOpen(false); it.on(); }}>{it.ic}{it.label}</button>))}
      </div>}
    </div>
  );
}
// 多店活动二维码弹层：逐门店一个（到店归因）
function ActivityQRSheet({ act, outlets, lang, onDownload, onClose }) {
  const list = (act.outletIds||[]).map(id => outlets.find(o=>o.id===id)).filter(Boolean);
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:430 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"Outlet QR codes","门店二维码")}</h3>
        <p className="pub-sub">{tr(lang,"One QR per outlet — walk-ins are attributed to the right shop. Fixed since first publish, safe to print.","每家门店各一个 —— 到店才能归因到对应店。首次上线即固定，可放心打印。")}</p>
        <div className="qr-list">
          {list.map(o => (
            <div className="qr-card" key={o.id}>
              <div className="qr" style={{ width:72, height:72, borderRadius:12 }}><Ic.qr style={{ width:44, height:44, color:"#0B1220" }}/></div>
              <div className="qr-meta">
                <div className="nm">{P(lang,o.name)}</div>
                <div className="ad">{o.city}</div>
                <button className="btn ghost sm" style={{ marginTop:8 }} onClick={()=>onDownload(P(lang,o.name))}><Ic.upload style={{ width:13, height:13, transform:"rotate(180deg)" }}/> {tr(lang,"Download","下载")}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
function ActivitiesView({ activities, outlets = [], onNew, onOpen, onDuplicate, onSetStatus }) {
  const lang = useLang();
  const [filt, setFilt] = useState("all");
  const [appQr, setAppQr] = useState(false);
  const [qrFor, setQrFor] = useState(null);   // 多店活动二维码弹层
  const dlQR = (name) => { const c=document.createElement("canvas"); c.width=200; c.height=200; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,200,200); x.fillStyle="#0B1220"; x.font="bold 24px sans-serif"; x.textAlign="center"; x.fillText("QR CODE",100,90); x.font="13px sans-serif"; x.fillText(name,100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); };
  // 每店一码（归因）：多店→弹门店清单逐个下；单店直接下
  const openQR = (act) => { const ids = act.outletIds || []; if (ids.length > 1) setQrFor(act); else dlQR(P(lang, act.name)); };
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
  // 选中的筛选态计数归零→标签被隐藏时，重置回"全部"，避免列表静默变全量却无高亮
  useEffect(() => { if (filt !== "all" && !tabs.some(f => f.k === filt)) setFilt("all"); }, [filt, tabs.length]);
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
            sub={tr(lang,"An activity is a promotion that gets customers scanning, playing and coming in. Pick outlets, add a prize, link your game — then go live.","活动就是一场让客人扫码玩、赢奖进店的促销。选门店、放个奖、绑上游戏，就能上线。")}
            actLabel={"+ " + tr(lang,"New activity","新建活动")}
            onAct={onNew}
          />
        : <div className="mygames">
            {shown.map(act => {
              const tpl = TEMPLATES.find(t => t.id === act.gameId) || TEMPLATES[0];
              const isChal = (act.form||"longrun") === "challenge";
              const ls = isChal ? ladderStats(act.prizeLadder) : null;
              const ran = act.status==="live" || act.status==="offline";
              return (
                <div key={act.id} className="mgcard clickable" onClick={() => onOpen(act)}>
                  <div className="mgart"><GamePreview kind={tpl.kind} colors={tpl.g} /><span className={"mgstatus act-badge " + ACT_STA[act.status||"draft"].cls}>{(act.status||"draft")==="live" && <span className="b"></span>}{P(lang, ACT_STA[act.status||"draft"])}</span><div className="play"><span>{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></span></div></div>
                  <div className="mgmeta">
                    <div className="nm">{isChal && <span className="chal-badge"><Ic.trophy style={{ width:11, height:11 }}/>{tr(lang,"Challenge","限时赛")}</span>}{P(lang, act.name)}</div>
                    {isChal
                      ? (()=>{ const isLive=act.status==="live", isOff=act.status==="offline"; const ns=isLive?nextSession(act.schedule):null; return <>
                          <div className={"chal-when"+(isLive&&ns?" next":"")}>{isLive&&ns && <span className="cw-dot"></span>}{isOff ? tr(lang,"Ended","已结束") : isLive ? (ns ? tr(lang,"Next","下一场")+" · "+nextLabel(act.schedule,lang) : tr(lang,"Finished","已跑完")) : schedSummary(act.schedule,lang)}</div>
                          {isOff && act.stat && <div className="act-stat"><b>{act.stat.players}</b> {tr(lang,"played","人参赛")} · <b>{act.stat.walkins}</b> {tr(lang,"walked in","到店")}</div>}
                          {!ran && <div className="st">{ls.slots} {tr(lang,"prizes","个奖")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>}
                        </>; })()
                      : <>
                          {act.stat && ran
                            ? <div className="act-stat"><b>{act.stat.walkins}</b> {tr(lang,"walked in","人到店")}<span style={{ color:"var(--muted)", fontWeight:400 }}>{tr(lang,` (incl. ${act.stat.newCust} new)`,`（含 ${act.stat.newCust} 新客）`)}</span></div>
                            : <div className="st">{(act.vouchers[0]&&act.vouchers[0].qty)||0} {tr(lang,"vouchers","张券")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>}
                          {act.status==="live" && (()=>{ const v=act.vouchers&&act.vouchers[0]; const qty=(v&&+v.qty)||0, issued=(v&&+v.awarded)||0, rem=Math.max(0,qty-issued), pct=qty?rem/qty:1; if(!qty) return null; return (
                            <div className={"stockrow"+(rem===0?" out":pct<=0.15?" low":"")}>
                              <div className="stock-bar"><i style={{ width:(pct*100)+"%" }}></i></div>
                              <span className="stock-t">{rem===0 ? tr(lang,"All vouchers given out — open to top up","券已发完 —— 打开可补券") : tr(lang,`${issued} given · ${rem} left`,`送 ${issued} · 剩 ${rem}`)}</span>
                            </div>); })()}
                        </>}
                    <div className="mgfoot">
                      {act.status === "live" && <button className="btn primary sm" onClick={(e)=>{ e.stopPropagation(); openQR(act); }} style={{ padding:"7px 14px", fontSize:12.5 }}><Ic.qr style={{ width:14, height:14 }}/> {tr(lang,"QR code","门店二维码")}</button>}
                      {act.status === "offline" && <button className="btn ghost sm" onClick={(e)=>{ e.stopPropagation(); onSetStatus(act,"live"); }} style={{ padding:"7px 14px", fontSize:12.5 }}><span className="b-dot"></span>{tr(lang,"Go live","上线")}</button>}
                      {act.status === "draft" && <button className="btn ghost sm" onClick={(e)=>{ e.stopPropagation(); onDuplicate(act); }} style={{ padding:"7px 14px", fontSize:12.5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> {tr(lang,"Copy","复制")}</button>}
                      {act.status !== "draft" && <Kebab items={[
                        { label:tr(lang,"Copy","复制"), ic:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>, on:()=>onDuplicate(act) },
                        ...(act.status === "offline" ? [{ label:tr(lang,"QR code","门店二维码"), ic:<Ic.qr style={{ width:15, height:15 }}/>, on:()=>openQR(act) }] : []),
                        { label:tr(lang,"View in KiX app","在 KiX App 里看"), ic:<Ic.phone style={{ width:15, height:15 }}/>, on:()=>setAppQr(true) },
                        ...(act.status === "live" ? [{ label:tr(lang,"Take offline","下线"), ic:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/><line x1="12" y1="2" x2="12" y2="12"/></svg>, on:()=>onSetStatus(act,"offline") }] : []),
                      ]}/>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>}
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
      {qrFor && <ActivityQRSheet act={qrFor} outlets={outlets} lang={lang} onDownload={dlQR} onClose={()=>setQrFor(null)}/>}
    </div>
  );
}
// 去审批(2026-07-03)：只有 draft/live/offline，无 review/rejected
const ACT_STA = {
  draft:    { en:"Draft",         zh:"修改中", cls:"st-draft" },
  live:     { en:"Live",          zh:"已上线", cls:"st-live" },
  offline:  { en:"Offline",       zh:"已下线", cls:"st-offline" },
};
// 赢奖难度档：商家选易/中/难（映射到分数），不再填裸分
const WIN_TIERS = [
  { k:"easy", en:"Easy",   zh:"容易",   score:300,  win:{en:"~70% win",zh:"约 7 成赢"} },
  { k:"med",  en:"Medium", zh:"适中",   score:1000, win:{en:"~40% win",zh:"约 4 成赢"} },
  { k:"hard", en:"Hard",   zh:"有挑战", score:2500, win:{en:"~15% win",zh:"约 1.5 成赢"} },
];
function ActivityPublishModal({ activity, cardOnFile, onSaveCard, onClose, onConfirm }) {
  const lang = useLang();
  const [step, setStep] = useState(new URLSearchParams(location.search).get("done")==="1" ? "done" : "confirm");
  // 卡在注册/绑卡步已收，上线弹窗不再显示付款方式（去 off-canon 定价 + 不重复要卡）
  const confirm = () => { onConfirm(); setStep("done"); };
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
        <p className="pub-sub">{(activity.form||"longrun")==="challenge" ? tr(lang,"Once live, customers can join the race and win by rank.","上线后客人即可扫码参赛、按名次赢奖。") : tr(lang,"Once live, customers can play and win vouchers right away.","上线后客人即可扫码玩、赢券进店。")}</p>
        <div className="pub-confirm-name">{P(lang, activity.name)}</div>
        <div className="pub-actions">
          <button className="btn ghost lg" onClick={onClose}>{tr(lang,"Cancel","取消")}</button>
          <button className="btn primary lg" onClick={confirm}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Confirm & publish","确认上线")}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
/* ===== 限时挑战赛(KiX Challenge)：第二种活动形态 =====
   longrun(现有)=时间窗+达标赢券；challenge=定点开赛+排名定奖+阶梯奖池 */
const WEEK_Z = ["日","一","二","三","四","五","六"];
const WEEK_E = ["S","M","T","W","T","F","S"];
const WEEK_E3 = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
// 阶梯奖池示例(一芳同款)——"套用示例奖池"一键铺好
const SAMPLE_LADDER = [
  { from:1,  to:1,   prize:{ type:"cash",     value:60 } },
  { from:2,  to:2,   prize:{ type:"cash",     value:40 } },
  { from:3,  to:3,   prize:{ type:"cash",     value:20 } },
  { from:4,  to:6,   prize:{ type:"item",     label:"芒果西米露 (M)" } },
  { from:7,  to:10,  prize:{ type:"item",     label:"龙井拿铁 (M)" } },
  { from:11, to:20,  prize:{ type:"discount", pct:20 } },
  { from:21, to:30,  prize:{ type:"discount", pct:10 } },
  { from:31, to:100, prize:{ type:"discount", pct:5  } },
];
// 只加总"可精确的现金奖" + 名额总数；折扣/商品/自定义不折现(见 P1 三体：不臆测总价)
function ladderStats(ladder) {
  let slots = 0, cash = 0;
  (ladder||[]).forEach(r => { const n = Math.max(0, (+r.to||0) - (+r.from||0) + 1); slots += n; if (r.prize && r.prize.type === "cash") cash += n * (+r.prize.value||0); });
  return { slots, cash };
}
function schedSummary(s, lang) {
  if (!s) return "";
  const t = s.time || "21:00";
  if (s.mode === "recurring") {
    const days = (s.days||[]).slice().sort((a,b)=>a-b);
    if (days.length === 0 || days.length === 7) return tr(lang, `Nightly ${t}`, `每晚 ${t}`);
    const lbl = days.map(d => lang === "zh" ? WEEK_Z[d] : WEEK_E3[d]).join(lang === "zh" ? "·" : "/");
    return tr(lang, `Every ${lbl} ${t}`, `每周${lbl} ${t}`);
  }
  return (s.date ? s.date : tr(lang,"Date TBD","日期待定")) + " " + t;
}
// 算真实"下一场"：recurring 按 days[] 找 >= 今天最近一天；oneoff 取 date
function nextSession(s) {
  if (!s) return null;
  const [hh,mm] = (s.time||"21:00").split(":").map(Number);
  const now = new Date();
  if (s.mode === "recurring") {
    const days = s.days || [];
    for (let i=0;i<8;i++){ const d=new Date(now); d.setDate(now.getDate()+i); d.setHours(hh,mm,0,0); if((days.length===0||days.includes(d.getDay())) && d>=now) return d; }
    return null;
  }
  if (s.date) return new Date(s.date+"T"+(s.time||"21:00"));
  return null;
}
function nextLabel(s, lang) {
  const d = nextSession(s); if (!d) return schedSummary(s, lang);
  const t = s.time || "21:00";
  const d0 = new Date(); d0.setHours(0,0,0,0);
  const dd = new Date(d); dd.setHours(0,0,0,0);
  const diff = Math.round((dd - d0) / 86400000);
  if (diff <= 0) return tr(lang, `Today ${t}`, `今天 ${t}`);
  if (diff === 1) return tr(lang, `Tomorrow ${t}`, `明天 ${t}`);
  if (diff < 7) return tr(lang, `${WEEK_E3[d.getDay()]} ${t}`, `周${WEEK_Z[d.getDay()]} ${t}`);
  return `${d.getMonth()+1}/${d.getDate()} ${t}`;
}
// 卡片头奖简写：现金→S$X / 折扣→X%券 / 商品/自定义→名称
function topPrizeShort(ladder, lang) {
  const p = ladder && ladder[0] ? ladder[0].prize : null;
  if (!p) return "";
  if (p.type === "cash") return `S$${p.value||0}`;
  if (p.type === "discount") return tr(lang, `${p.pct||0}% off`, `${p.pct||0}% 券`);
  return p.label || "";
}
const PRIZE_TYPES = [
  { k:"cash",     en:"Cash voucher", zh:"现金券" },
  { k:"item",     en:"Menu item",    zh:"菜单商品" },
  { k:"discount", en:"% discount",   zh:"折扣券" },
  { k:"custom",   en:"Custom",       zh:"自定义" },
];
function prizeLabel(p, lang) {
  if (!p) return "";
  if (p.type === "cash")     return tr(lang, `S$${p.value||0} cash`, `现金券 S$${p.value||0}`);
  if (p.type === "discount") return tr(lang, `${p.pct||0}% off`, `${p.pct||0}% 折扣券`);
  return p.label || tr(lang,"Prize","奖品");
}

// 建活动第一步：选形态(带介绍帮用户选)
function NewActivityPicker({ onPick, onClose }) {
  const lang = useLang();
  const forms = [
    { k:"longrun", ic:<Ic.clipboard/>, tag:{en:"Slow & steady",zh:"细水长流"}, nm:{en:"Long-run activity",zh:"长期活动"},
      line:{en:"Customers play anytime and win a voucher when they hit the target.",zh:"这段时间客人随时扫码玩，达标就赢券。"},
      fit:{en:"Daily traffic · clear stock · new-item trials",zh:"日常引流 · 清库存 · 新品试吃"},
      eg:{en:"Play within 2 weeks, win a voucher, redeem in store",zh:"两周内玩游戏得券，到店兑"} },
    { k:"challenge", ic:<Ic.trophy/>, tag:{en:"One big push",zh:"冲一波"}, nm:{en:"Timed challenge",zh:"限时挑战赛"},
      line:{en:"Everyone competes at a set time — top ranks win the big prizes.",zh:"约定某晚同时开赛，比分数排名，名次高赢大奖。"},
      fit:{en:"Buzz & hype · festival peaks · headline prizes",zh:"造话题 · 节日冲人气 · 大奖吸睛"},
      eg:{en:"Fri 21:00, 3-min score race, top 100 win",zh:"本周五 21:00，3 分钟冲分，前 100 名赢奖"} },
  ];
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="na-pick" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"New activity","新建活动")}</h3>
        <p className="pub-sub">{tr(lang,"Two ways to bring customers in — pick one.","两种把客人带进店的方式，选一种。")}</p>
        <div className="na-cards">
          {forms.map(f => (
            <button key={f.k} className={"na-card na-"+f.k} onClick={()=>onPick(f.k)}>
              <div className="na-ic">{f.ic}</div>
              <div className="na-tag">{P(lang,f.tag)}</div>
              <div className="na-nm">{P(lang,f.nm)}</div>
              <p className="na-line">{P(lang,f.line)}</p>
              <div className="na-fit"><span className="na-fit-l">{tr(lang,"Best for","适合")}</span>{P(lang,f.fit)}</div>
              <div className="na-eg">{tr(lang,"e.g. ","例：")}{P(lang,f.eg)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ScheduleEditor({ schedule, setSchedule }) {
  const lang = useLang();
  const s = schedule || {};
  const upd = (k,v) => setSchedule({ ...s, [k]:v });
  const days = s.days || [];
  const toggleDay = (d) => upd("days", days.includes(d) ? days.filter(x=>x!==d) : [...days, d]);
  const rounds = [1,2,3,5,10];
  return (
    <div className="panel" style={{ marginTop:16 }}>
      <h3>{tr(lang,"When it runs","开赛档期")}</h3>
      <p className="ph-sub">{tr(lang,"Everyone plays at the same set time and competes for rank.","大家在同一约定时间开赛、比分数排名。")}</p>
      <div className="seg2" style={{ marginTop:12 }}>
        <button type="button" className={s.mode!=="recurring"?"on":""} onClick={()=>upd("mode","oneoff")}>{tr(lang,"One-off","一次性")}</button>
        <button type="button" className={s.mode==="recurring"?"on":""} onClick={()=>upd("mode","recurring")}>{tr(lang,"Recurring","循环")}</button>
      </div>
      {s.mode === "recurring"
        ? <div className="field" style={{ marginTop:14 }}><label>{tr(lang,"On which nights","每周哪几晚")}</label>
            <div className="day-chips">{[0,1,2,3,4,5,6].map(d => (
              <button key={d} type="button" className={"dchip"+(days.includes(d)?" on":"")} onClick={()=>toggleDay(d)}>{lang==="zh"?WEEK_Z[d]:WEEK_E[d]}</button>
            ))}</div>
          </div>
        : <div className="field" style={{ marginTop:14 }}><label>{tr(lang,"Date","开赛日期")}</label><input type="date" value={s.date||""} onChange={e=>upd("date",e.target.value)}/></div>}
      <div style={{ display:"flex", gap:12, marginTop:14 }}>
        <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"Start time","开赛时间")}</label><input type="time" value={s.time||"21:00"} onChange={e=>upd("time",e.target.value)}/></div>
        <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"Round length","单局时长")}</label>
          <select value={s.roundMins||3} onChange={e=>upd("roundMins",+e.target.value)}>{rounds.map(r=>(<option key={r} value={r}>{tr(lang,`${r} min`,`${r} 分钟`)}</option>))}</select>
        </div>
      </div>
      {s.mode === "recurring" && <div className="field" style={{ marginTop:14, marginBottom:0 }}><label>{tr(lang,"Runs until","循环截止")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><input type="date" value={s.endDate||""} onChange={e=>upd("endDate",e.target.value)}/></div>}
    </div>
  );
}

function PrizeLadderEditor({ ladder, setLadder }) {
  const lang = useLang();
  const rows = ladder || [];
  const { slots, cash } = ladderStats(rows);
  const updPrize = (i,patch) => setLadder(rows.map((r,j)=> j===i ? {...r, prize:{...r.prize, ...patch}} : r));
  const updRank  = (i,patch) => setLadder(rows.map((r,j)=> j===i ? {...r, ...patch} : r));
  const addRow = () => { const last = rows[rows.length-1]; const from = last ? (+last.to||0)+1 : 1; setLadder([...rows, { from, to:from, prize:{ type:"discount", pct:10 } }]); };
  const dupRow = (i) => { const r = rows[i]; const span = (+r.to||0)-(+r.from||0); const from = (+r.to||0)+1; setLadder([...rows.slice(0,i+1), { from, to:from+span, prize:{...r.prize} }, ...rows.slice(i+1)]); };
  const delRow = (i) => setLadder(rows.filter((_,j)=>j!==i));
  const useSample = () => setLadder(SAMPLE_LADDER.map(r=>({...r, prize:{...r.prize}})));
  return (
    <div className="panel" style={{ marginTop:16 }}>
      <div className="ladder-head"><h3 style={{ margin:0 }}>{tr(lang,"Prize ladder","阶梯奖池")}</h3><button className="linkbtn" onClick={useSample}>{tr(lang,"Use sample ladder","套用示例奖池")}</button></div>
      <p className="ph-sub">{tr(lang,"Higher rank, better prize. Add any prize you like — cash, a menu item, a discount, or your own.","名次越高奖越好。奖品随你定 —— 现金、菜单商品、折扣、或自定义。")}</p>
      <div className="cost-bar">
        <span className="cost-slots"><b>{slots}</b> {tr(lang,"prizes","个奖")}</span>
        {cash>0 && <span className="cost-cash">· {tr(lang,"cash total","现金奖合计")} <b>S${cash}</b></span>}
        <div className="cost-note">{tr(lang,"Awarded by actual rank — empty ranks pay nothing.","按实际排名发 —— 没人到的名次不发奖、不产生费用。")}</div>
      </div>
      <div className="ladder-rows">
        {rows.map((r,i) => (
          <div className="lrow" key={i}>
            <div className="lrank">{tr(lang,"Rank","第")}<input type="number" min="1" value={r.from} onChange={e=>updRank(i,{from:+e.target.value})}/><span>–</span><input type="number" min="1" value={r.to} onChange={e=>updRank(i,{to:+e.target.value})}/>{tr(lang,"","名")}</div>
            <div className="lprize">
              <select value={r.prize.type} onChange={e=>updPrize(i,{ type:e.target.value })}>{PRIZE_TYPES.map(pt=>(<option key={pt.k} value={pt.k}>{tr(lang,pt.en,pt.zh)}</option>))}</select>
              {r.prize.type==="cash"     && <div className="pfield">S$<input type="number" min="0" value={r.prize.value||""} onChange={e=>updPrize(i,{value:+e.target.value})}/></div>}
              {r.prize.type==="discount" && <div className="pfield"><input type="number" min="0" max="100" value={r.prize.pct||""} onChange={e=>updPrize(i,{pct:+e.target.value})}/>%</div>}
              {(r.prize.type==="item"||r.prize.type==="custom") && <input className="plabel" placeholder={r.prize.type==="item"?tr(lang,"Menu item name","商品名"):tr(lang,"Prize name","奖品名")} value={r.prize.label||""} onChange={e=>updPrize(i,{label:e.target.value})}/>}
            </div>
            <div className="lact">
              <button type="button" title={tr(lang,"Duplicate","复制上一档")} onClick={()=>dupRow(i)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
              <button type="button" title={tr(lang,"Remove","删除")} onClick={()=>delRow(i)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn ghost sm" style={{ marginTop:12 }} onClick={addRow}><span style={{ fontSize:16, lineHeight:1 }}>+</span> {tr(lang,"Add a tier","加一档")}</button>
    </div>
  );
}

function ActivityEditor({ activity, setActivity, outlets, setOutlets, myGames, cardOnFile, setCardOnFile, onNewGame, onViewGame, onBack }) {
  const lang = useLang();
  const upd = (k, v) => setActivity(a => ({...a, [k]: v}));
  const st = activity.status || "draft";
  const live = st === "live";
  const [pubOpen, setPubOpen] = useState(new URLSearchParams(location.search).get("pub")==="1");
  const [appQr, setAppQr] = useState(false);
  const isChal = (activity.form||"longrun") === "challenge";
  const onLogo = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => upd("logo", rd.result); rd.readAsDataURL(f); };
  const curTier = (WIN_TIERS.find(t=>t.score===(activity.winScore||1000)) || WIN_TIERS[1]).k;
  // 活动直接上线（无审批）：draft/offline —上线→ live；live —下线→ offline
  const actOutlets = outlets.filter(o => (activity.outletIds||[]).includes(o.id));
  const dlQR = (label) => { const c=document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 22px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,88); ctx.font="12px sans-serif"; ctx.fillText(label,100,116); const a=document.createElement("a"); a.download="qr-"+label+".png"; a.href=c.toDataURL(); a.click(); };
  return (
    <div className="app-body" style={{ maxWidth:820 }}>
      {live && <div className="act-statusbar"><span className="act-note" style={{ color:"var(--green-d)" }}><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Live — customers can play now.","已上线 —— 客人现在就能扫码玩。")}</span><button className="btn ghost sm" style={{ marginLeft:"auto" }} onClick={()=>setAppQr(true)}><Ic.phone style={{ width:13, height:13 }}/> {tr(lang,"View in app","在 App 查看")}</button></div>}
      <div className="panel">
        <h3>{tr(lang,"Activity name","活动名称")}</h3>
        <div className="act-idrow">
          <div className="field" style={{ flex:1, margin:0 }}><input value={P(lang, activity.name)} onChange={e => upd("name",{en:e.target.value,zh:e.target.value})} placeholder={isChal ? tr(lang,"e.g. Friday Night Challenge","例如：周五夜赛") : tr(lang,"e.g. Weekend Coffee Promo","例如：周末咖啡促销")} /></div>
          <label className="act-logo-up" title={tr(lang,"Brand logo","品牌 Logo")}>
            {activity.logo ? <img src={activity.logo} alt=""/> : <><Ic.image style={{ width:17, height:17 }}/><span>Logo</span></>}
            <input type="file" accept="image/*" hidden onChange={onLogo}/>
          </label>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{isChal ? tr(lang,"Brand logo shows on the poster, app card and the leaderboard. Leave empty to use the game's brand.","品牌 Logo 会显示在活动海报、App 卡片和排行榜上。留空则沿用所选游戏的品牌。") : tr(lang,"Brand logo shows on the poster and app card. Leave empty to use the game's brand.","品牌 Logo 会显示在活动海报和 App 卡片上。留空则沿用所选游戏的品牌。")}</p>
        {!isChal && <><div style={{ display:"flex", gap:12, marginTop:14 }}>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"Start date","开始日期")}</label><input type="date" value={activity.startDate||""} onChange={e=>upd("startDate",e.target.value)}/></div>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"End date","结束日期")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><input type="date" value={activity.endDate||""} onChange={e=>upd("endDate",e.target.value)}/></div>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Leave the end date empty to run indefinitely — take it offline anytime.","结束日期留空 = 长期有效，随时可手动下线。")}</p></>}
      </div>
      {isChal
        ? <><ScheduleEditor schedule={activity.schedule} setSchedule={s => upd("schedule", s)} />
            <PrizeLadderEditor ladder={activity.prizeLadder} setLadder={l => upd("prizeLadder", l)} /></>
        : <div className="panel" style={{ marginTop:16 }}>
            <VoucherEditor vouchers={activity.vouchers} setVouchers={vs => upd("vouchers", vs)} showStock />
          </div>}
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
        {!isChal && <><div className="win-cond">
          <span className="wc-lbl">{tr(lang,"How hard to win","赢奖难度")}</span>
          <div className="wc-tiers">
            {WIN_TIERS.map(t => (
              <button key={t.k} type="button" className={"wc-tier"+(curTier===t.k?" on":"")} onClick={()=>upd("winScore",t.score)}>
                <b>{tr(lang,t.en,t.zh)}</b><span>{P(lang,t.win)}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Harder = fewer people win, vouchers last longer; easier = more win and walk in faster. You decide.","越难，赢的人越少、券发得越慢；越易，越多人赢、越快把客人带到店。你自己定。")}</p></>}
        {isChal && <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Players race for a high score in this game — ranking decides the prizes above.","玩家在这个游戏里冲高分，排名决定上面的奖池。")}</p>}
      </div>
      {isChal && <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Race rules","赛制")}</h3>
        <p className="ph-sub" style={{ marginTop:2 }}><Ic.check style={{ width:14, height:14, verticalAlign:"-2px", marginRight:5, color:"var(--green-d)" }}/>{tr(lang,"Tie-break: same score, earlier submission ranks higher.","同分裁决：分数相同，先提交者排名靠前。")}</p>
        <p className="ph-sub" style={{ marginTop:6 }}><Ic.shield style={{ width:14, height:14, verticalAlign:"-2px", marginRight:5 }}/>{tr(lang,"One play per person per round — enforced in the KiX app.","每人每场限一局 —— 由 KiX App 保证。")}</p>
        <p className="ph-sub" style={{ marginTop:6 }}><Ic.trophy style={{ width:14, height:14, verticalAlign:"-2px", marginRight:5, color:"#C2410C" }}/>{tr(lang,"Prizes are awarded by actual final rank — no minimum turnout needed.","按实际最终排名发奖 —— 不设最低人数门槛，来多少人都照常开赛。")}</p>
      </div>}
      <div className="panel" style={{ marginTop:16 }}>
        <OutletScope outlets={outlets} gameOutlets={activity.outletIds} setGameOutlets={ids => upd("outletIds", ids)} setOutlets={setOutlets} locked={live} />
        {live && <p className="ph-sub" style={{ marginTop:10 }}>{tr(lang,"To change outlets, take the activity offline first.","要改门店，请先把活动下线。")}</p>}
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Activity QR codes — one per outlet","活动二维码 —— 每家门店一个")}</h3>
        <p className="ph-sub">{tr(lang,"Each outlet gets its own QR, so walk-ins are attributed to the right shop.","每家门店各一个二维码，到店才能归因到对应门店。")}</p>
        {st === "draft"
          ? <p className="ph-sub" style={{ marginTop:8, color:"var(--muted-2)" }}><Ic.qr style={{ width:14, height:14, verticalAlign:"-2px", marginRight:4 }}/>{tr(lang,"Published once you go live: each outlet gets a fixed QR you can print — it never changes on later edits.","上线后每家门店各生成一个固定二维码，可放心打印 —— 后续编辑也不会变。")}</p>
          : actOutlets.length === 0
          ? <div className="ph-sub">{tr(lang,"Select at least one outlet above.","请先在上面选择至少一家门店。")}</div>
          : <><p className="ph-sub" style={{ marginTop:2, color:"var(--muted-2)" }}>{tr(lang,"Fixed since first publish — safe to print. Later edits won't change it.","首次上线时已固定 —— 可放心打印，后续编辑也不会变。")}</p>
            <div className="qr-list">
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
            </div></>}
      </div>
      <div className="act-actions">
        {(st==="draft"||st==="offline") && <button className="btn primary lg" onClick={()=>setPubOpen(true)}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Publish","上线")}</button>}
        {st==="live"     && <button className="ws-publish on" style={{ padding:"14px 22px", fontSize:"15.5px" }} onClick={()=>upd("status","offline")}>{tr(lang,"Take offline","下线活动")}</button>}
        <button className="btn ghost lg" onClick={onBack}>{tr(lang,"Save & close","保存并返回")}</button>
      </div>
      {pubOpen && <ActivityPublishModal activity={activity} cardOnFile={cardOnFile} onSaveCard={setCardOnFile} onClose={()=>setPubOpen(false)} onConfirm={()=>{ upd("status","live"); }}/>}
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
    </div>
  );
}

function ReportsView({ onTune, outlets = OUTLETS, vouchers = DEFAULT_VOUCHERS, hasLive, hasActs, hasLiveGame, multiAct, onNewAct, onGoActivities, onGoGames, onBilling, liveName }) {
  const lang = useLang();
  const M = DEMO_METRICS;
  const GM = GAME_METRICS;
  // 计费（落地页口径）：新客=计费单位、首 3 月免费、老客永远免费。免费期不展示"试用后总价"（避免提前吓退，见弹卡三体）
  const freeDaysLeft = 47;
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
        ? tr(lang,"Once your activity is live and customers redeem in store, walk-ins, new vs returning, and per-outlet stats appear here.","活动上线、客人到店兑奖后，这里会显示真实到店、新客/回头客、各门店表现。")
        : tr(lang,"This page only counts people who actually walked in. Create an activity, go live, and your real walk-in data will build up here.","这页只统计真正走进门的人。建活动、上线后，真实到店数据会在这里累积。")}
      actLabel={hasActs ? tr(lang,"Go to activities","去活动") : "+ "+tr(lang,"New activity","新建活动")}
      onAct={hasActs ? onGoActivities : onNewAct}
    />
  ) : totRed === 0 ? (
    <EmptyState
      icon={<Ic.chart/>}
      title={tr(lang,"Live — waiting for the first walk-in","已上线，等第一位到店")}
      sub={tr(lang,"As soon as a customer plays, wins, and redeems in store, your walk-in numbers and trends will appear here.","只要有客人扫码玩、赢券、到店兑奖，到店数据和趋势就会出现在这里。")}
      actLabel={tr(lang,"Download activity QR","下载活动二维码")}
      onAct={dlQR}
      ghostLabel={tr(lang,"Manage activities","管理活动")}
      onGhost={onGoActivities}
    />
  ) : (
    <>
      {/* Hero：真实到店兑奖 = 唯一付费指标、唯一独家证明，做绝对主角 */}
      <div className="rep-hero">
        <div className="rh-l">
          <span className="rh-eye"><span className="b"></span>{tr(lang,`Verified walk-ins · ${P(lang,ranges[ri])}`,`真实到店兑奖 · ${P(lang,ranges[ri])}`)}</span>
          <div className="rh-num">{M.walkins}<span className="rh-delta up"><Ic.arrow style={{ width:15, height:15, transform:"rotate(-90deg)" }}/>{M.delta.walkins} {note}</span></div>
          <p className="rh-sub">{tr(lang,"Only customers who actually walked in and were redeemed — the only thing you pay for.","只算真正走进门、被兑奖的客人 —— 也是你唯一付费的对象。")}</p>
        </div>
        <div className="rh-r">{M.trend.map((t,i)=>(<span key={i} className="rh-spark" style={{ height:(t.v/tmax*100)+"%" }}></span>))}</div>
      </div>
      {/* 计费仪表：新客=计费单位、老客免费；试用期就摊开"结束后要付多少"，反 bill-shock（Stripe/AWS 范式）*/}
      <div className="billmeter">
        <div className="bm-cost">
          <div className="bm-trial"><Ic.spark style={{ width:14, height:14 }}/> {tr(lang,`First 3 months free · ${freeDaysLeft} days left · now `,`首 3 个月免费 · 还剩 ${freeDaysLeft} 天 · 现在 `)}<b>S$0</b></div>
          <div className="bm-proj">{tr(lang,"Regulars always free — you only ever pay for new customers.","老客永远免费 —— 只为新客付费。")}</div>
        </div>
        <button className="panel-link bm-link" onClick={onBilling}>{tr(lang,"Billing","账单管理")} <Ic.arrow style={{ width:14, height:14 }}/></button>
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
            <div className="fstep on"><div className="fn">{M.walkins}</div><div className="fl">{tr(lang,"Walked in","到店兑奖")}</div></div>
          </div>
        </div>
        {/* 新客 vs 回头：证明"把路过变回头客" */}
        <div className="panel">
          <h3>{tr(lang,"New vs returning","新客 vs 回头客")}</h3>
          <p className="ph-sub">{tr(lang,"New faces are what you pay for — returning regulars are always free","新客才是你付费的对象 —— 老客回头永远免费")}</p>
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
        <p className="ph-sub">{tr(lang,"Played, then walked in and redeemed","扫码玩过、再走进门兑奖的人数")}</p>
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
          <p className="rh-sub">{tr(lang,"How many times customers played — games go live on their own, no prizes, no walk-in charge.","客人玩你游戏的总次数 —— 游戏可独立上线，无奖品、不产生到店费用（免费）。")}</p>
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
// 价格 = 落地页 bible MAU 口径：免费版功能门槛；成长版 S$29/品牌/月起(按 MAU 梯度、只算新生意封顶 12%)、前 3 月免费、老客永远免费
const PLANS = [
  { id:"free",   name:{en:"Free forever",zh:"永久免费"},  price:{en:"S$0",zh:"S$0"},              note:{en:"1 game · redemption + dashboard",zh:"1 个游戏 · 兑奖 + 数据看板"} },
  { id:"result", name:{en:"Grow with KiX",zh:"成长版"}, price:{en:"from S$29/mo",zh:"S$29 / 月起"}, note:{en:"Unlimited games & campaigns · only new business, capped 12% · cheaper as you grow, one bill",zh:"不限游戏与活动 · 只算新生意、封顶 12% · 越做越便宜、多店合一"} },
  { id:"chain",  name:{en:"Chains",zh:"连锁版"},         price:{en:"Contact us",zh:"联系我们"},    note:{en:"Multi-outlet · custom games & integration",zh:"多门店 · 定制玩法与对接"} },
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
          <p className="cardf-note"><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"First 3 months free. After that from S$29/mo — only new business, regulars always free.","前 3 个月免费。之后 S$29/月起 —— 只算新生意、老客永远免费。")}</span></p>
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
        <p className="pub-sub">{tr(lang,"Free for the first 3 months, then pay only as you grow. Regulars always free, change anytime.","前 3 个月免费，之后只在你增长时才付费。老客永远免费，随时可改。")}</p>
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
  const [plan, setPlan] = useState("result");
  const _bill = new URLSearchParams(location.search).get("bill");
  const [cardModal, setCardModal] = useState(_bill==="card"), [planModal, setPlanModal] = useState(_bill==="plan");
  const curPlan = PLANS.find(p=>p.id===plan) || PLANS[1];
  const [saved, setSaved] = useState(""), [appQr, setAppQr] = useState(false);
  const save = (k) => { setSaved(k); setTimeout(()=>setSaved(s=>s===k?"":s), 2000); };
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
        <div className="me-save">{saved==="acct" && <span className="me-saved"><Ic.check style={{ width:14, height:14 }}/> {tr(lang,"Saved","已保存")}</span>}<button className="btn primary sm" onClick={()=>save("acct")}>{tr(lang,"Save changes","保存修改")}</button></div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Billing & plan","账单与套餐")}</h3>
        <p className="ph-sub">{tr(lang,"First 3 months free — after that from S$29/mo, only new business, regulars always free. Manage your plan and card here.","前 3 个月免费 —— 之后 S$29/月起，只算新生意、老客永远免费。在这里管理套餐和银行卡。")}</p>
        <div className="billrow">
          <div className="bill-l"><span className="bill-ic"><Ic.spark style={{ width:16, height:16 }}/></span><div><div className="bill-t">{tr(lang,"Plan","套餐")}</div><div className="bill-v">{P(lang,curPlan.name)} · {P(lang,curPlan.price)}</div></div></div>
          <button className="btn ghost sm" onClick={()=>setPlanModal(true)}>{tr(lang,"Switch plan","切换套餐")}</button>
        </div>
        <div className="billrow">
          <div className="bill-l"><span className="bill-ic"><Ic.card style={{ width:16, height:16 }}/></span><div><div className="bill-t">{tr(lang,"Payment method","付款方式")}</div><div className="bill-v">{cardOnFile ? <>Visa •••• {cardOnFile.last4}</> : <span style={{ color:"var(--muted)" }}>{tr(lang,"No card yet","尚未绑定银行卡")}</span>}</div></div></div>
          <button className="btn ghost sm" onClick={()=>setCardModal(true)}>{cardOnFile ? tr(lang,"Change","更换") : tr(lang,"Add card","添加银行卡")}</button>
        </div>
        <p className="cardf-note" style={{ margin:"12px 2px 0" }}><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"You won't be charged for the first 3 months. Only new business counts, regulars always free, take activities offline anytime.","前 3 个月不扣款。只算新生意、老客永远免费，活动随时可下线。")}</span></p>
      </div>
      <div className="panel me-approw" style={{ marginTop:16 }}>
        <span className="me-app-ic"><Ic.phone style={{ width:20, height:20 }}/></span>
        <div style={{ minWidth:0 }}>
          <div className="bill-t">{tr(lang,"See it the way your customers do","在手机上以客人视角查看")}</div>
          <div className="ph-sub" style={{ margin:0 }}>{tr(lang,"Your games & activities go live in the KiX app.","你的游戏和活动上线在 KiX App 里。")}</div>
        </div>
        <button className="btn ghost sm" style={{ marginLeft:"auto", flex:"none" }} onClick={()=>setAppQr(true)}><Ic.phone style={{ width:14, height:14 }}/> {tr(lang,"Get the app","下载 App")}</button>
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
        <div className="me-save">{saved==="outlets" && <span className="me-saved"><Ic.check style={{ width:14, height:14 }}/> {tr(lang,"Saved","已保存")}</span>}<button className="btn primary sm" onClick={()=>save("outlets")}>{tr(lang,"Save changes","保存修改")}</button></div>
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
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
    </div>
  );
}

// 下线撤销 toast（可逆动作：立即执行 + 撤销，不弹前置确认）
function UndoToast({ onUndo, onClose, lang }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, []);
  return ReactDOM.createPortal(
    <div className="undo-toast">
      <span className="ut-txt"><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Taken offline · customer scans paused","已下线 · 客人扫码已暂停")}</span>
      <button className="ut-undo" onClick={onUndo}>{tr(lang,"Undo","撤销")}</button>
    </div>,
    document.body
  );
}
function AppShell({ game, setGame, brand, setBrand, lang, setLang, sec, setSec, onNewGame, onExit, builder, builderIdx, builderSteps, onLeaveBuild, outlets, setOutlets, activities, setActivities, myGames, setMyGames, cardOnFile, setCardOnFile, initEdit }) {
  const [editing, setEditing] = useState(initEdit || null);
  const [editingAct, setEditingAct] = useState((()=>{ const e=new URLSearchParams(location.search).get("editact"); return e ? (activities[parseInt(e,10)-1]||activities[0]||null) : null; })()); // 调试直达活动编辑器（editact=1/2/3 指定第几个）
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null); // 下线撤销 toast：{ undo }（可逆动作不弹前置确认）
  const [pickForm, setPickForm] = useState(false); // 建活动第一步：选形态弹窗
  const takeOffline = (act) => { const prev = act.status||"live"; setActivities(list => list.map(a => a.id===act.id ? {...a, status:"offline"} : a)); setToast({ undo:()=>setActivities(list => list.map(a => a.id===act.id ? {...a, status:prev} : a)) }); };
  const takeGameOffline = (g) => { setMyGames(list => list.map(x => x.id===g.id ? {...x, status:"draft"} : x)); setToast({ undo:()=>setMyGames(list => list.map(x => x.id===g.id ? {...x, status:"live"} : x)) }); };
  const undoOffline = () => { setToast(t => { if (t) t.undo(); return null; }); };
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
  const openAct = (act) => { setEditingAct({...act, vouchers:(act.vouchers||[]).map(v=>({...v})), prizeLadder:(act.prizeLadder||[]).map(p=>({...p, prize:{...p.prize}})), schedule:act.schedule?{...act.schedule, days:[...(act.schedule.days||[])]}:undefined }); };
  // 建活动第一步先选形态（长期/挑战赛），再进对应编辑器
  const openNewActPicker = () => { setEditing(null); setEditingAct(null); setPickForm(true); };
  const blankLongrun = () => ({ id:"a"+Date.now(), form:"longrun", name:{en:"New activity",zh:"新活动"}, outletIds:outlets.map(o=>o.id), vouchers:STARTER_VOUCHERS.map(v=>({...v})), gameId:(myGames[0]||TEMPLATES[0]).id, status:"draft" });
  const blankChallenge = () => ({ id:"a"+Date.now(), form:"challenge", name:{en:"New challenge",zh:"新挑战赛"}, outletIds:outlets.map(o=>o.id), gameId:(myGames[0]||TEMPLATES[0]).id, status:"draft", schedule:{ mode:"oneoff", date:"", days:[5,6,0], time:"21:00", roundMins:3, endDate:"" }, tiebreak:"earliest", prizeLadder:[ { from:1,to:1,prize:{type:"cash",value:20} }, { from:2,to:5,prize:{type:"discount",pct:20} }, { from:6,to:20,prize:{type:"discount",pct:10} } ] });
  const createAct = (form) => { setPickForm(false); openAct(form==="challenge" ? blankChallenge() : blankLongrun()); };
  // 复制现有活动：同游戏/券/门店/赢奖条件，名字加副本，回到 draft、清空运行数据，打开编辑器微调
  const dupAct = (act) => { openAct({ ...act, id:"a"+Date.now(), name:{ en:(act.name.en||"Activity")+" (copy)", zh:(act.name.zh||"活动")+"（副本）" }, vouchers:(act.vouchers||[]).map(v=>({...v, awarded:0, redeemed:0})), stat:undefined, status:"draft" }); };
  const saveAct = () => { setActivities(as => { const idx = as.findIndex(a=>a.id===editingAct.id); return idx>=0 ? as.map((a,i)=>i===idx?editingAct:a) : [...as, editingAct]; }); setEditingAct(null); };
  // 调试：?act=<id> 直接打开该活动编辑器；?pickact=1 打开形态选择弹窗
  useEffect(() => { const p=new URLSearchParams(location.search); const id=p.get("act"); if(id){ const a=activities.find(x=>x.id===id); if(a) openAct(a); } if(p.get("pickact")==="1") setPickForm(true); }, []);
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
              <button className="btn primary" style={{ height:36, fontSize:14, padding:"0 16px" }} onClick={openNewActPicker}>+ {tr(lang,"New activity","新建活动")}</button>
            )}
            {!inBuild && !inEdit && !inActEdit && sec === "games" && (
              <button className="btn primary" style={{ height:36, fontSize:14, padding:"0 16px" }} onClick={onNewGame}>+ {tr(lang,"New game","新建游戏")}</button>
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
          : sec === "home" ? <HomeView game={game} brand={brand} onShare={()=>setSec("redeem")} onRecall={()=>setSec("reports")} activities={activities} liveGame={myGames.find(g=>g.status==="live")} onNewAct={openNewActPicker} onRedeem={()=>setSec("redeem")} onGoActivity={()=>{ const first = activities[0]; if (first) openAct(first); else { setSec("activities"); } }} onGoActivities={()=>setSec("activities")} onGoGames={()=>setSec("games")} onGoReports={()=>setSec("reports")} outlets={outlets} />
          : sec === "activities" ? <ActivitiesView activities={activities} outlets={outlets} onNew={openNewActPicker} onOpen={openAct} onDuplicate={dupAct} onSetStatus={(act,st)=> st==="offline" ? takeOffline(act) : setActivities(list=>list.map(a=>a.id===act.id?{...a,status:st}:a))} />
          : sec === "games" ? <MyGamesView myGames={myGames} onNew={onNewGame} onOpen={(g)=>setEditing(g)} onPublish={(g,patch)=>setMyGames(gs=>gs.map(x=>x.id===g.id?{...x, ...patch, status:"live"}:x))} onOffline={takeGameOffline} />
          : sec === "redeem" ? <RedeemView vouchers={actVouchers} onReport={()=>setSec("reports")} hasLive={!!liveAct} hasActs={activities.length>0} onNewAct={openNewActPicker} onGoActivities={()=>setSec("activities")} liveName={liveAct ? P(lang, liveAct.name) : ""} />
          : sec === "me" ? <MeView brand={brand} setBrand={setBrand} outlets={outlets} setOutlets={setOutlets} cardOnFile={cardOnFile} setCardOnFile={setCardOnFile} />
          : <ReportsView onTune={()=>setSec("activities")} outlets={outlets} vouchers={actVouchers} hasLive={!!liveAct} hasActs={activities.length>0} hasLiveGame={myGames.some(g=>g.status==="live")} multiAct={activities.filter(a=>a.status==="live").length>=2} onNewAct={openNewActPicker} onGoActivities={()=>setSec("activities")} onGoGames={()=>setSec("games")} onBilling={()=>setSec("me")} liveName={liveAct ? P(lang, liveAct.name) : ""} />}
      </main>
      {toast && <UndoToast onUndo={undoOffline} onClose={()=>setToast(null)} lang={lang}/>}
      {pickForm && <NewActivityPicker onPick={createAct} onClose={()=>setPickForm(false)}/>}
    </div>
  );
}

/* ===================== app ===================== */
/* one narrated loader = matching + generating fused (Buell & Norton labor-illusion: visible work feels valuable) */
const BUILD_TASKS = [{en:"Reading your shop type",zh:"读懂你的店型"},{en:"Scanning 1,012 game templates",zh:"扫描 1,012 个玩法模板"},{en:"Ranking by walk-in conversion",zh:"按到店转化率排序"},{en:"Picking the best fits",zh:"挑出最合适的几款"}];
const STEP_IDX = { describe:0, building:1, results:1, preview:2, done:2 };       // 店名(0)在首页完成→loader/选游戏=1, 上线=2
const STEP_IDX_RET = { describe:0, building:0, results:0, preview:1, done:1 };   // 登录后 2 步

function App() {
  const _p = new URLSearchParams(location.search);
  const initScreen = _p.get("screen") || "landing";
  const [lang, setLang] = useState((_p.get("lang") === "zh") ? "zh" : "en");
  const [screen, setScreen] = useState(initScreen);
  const [authed, setAuthed] = useState(_p.get("authed") === "1" || ["app","dashboard"].includes(initScreen));
  const [appSec, setAppSec] = useState(_p.get("sec") || (initScreen === "dashboard" ? "reports" : "home"));
  const [need, setNeed] = useState(_p.get("need") || "");
  const [game, setGame] = useState(TEMPLATES[0]);
  const [brand, setBrand] = useState({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] });
  const [outlets, setOutlets] = useState(OUTLETS.map(o => ({ ...o })));
  const [myGames, setMyGames] = useState([{...TEMPLATES[0], status:"live"}, {...TEMPLATES[1], status:"draft"}, {...TEMPLATES[3], status:"draft"}]);
  // 卡预存储(SetupIntent 语义,不扣款)——注册最后一步收，需存活到进 AppShell，故提升到 App
  // 卡在注册最后一步就收 → 能进 Portal(authed)= 已有 card-on-file。?card=0 可强制无卡调试
  const [cardOnFile, setCardOnFile] = useState(() => { const c = _p.get("card"); if (c==="1") return { last4:"4242" }; if (c==="0") return null; return authed ? { last4:"4242" } : null; });
  // fresh=1：模拟全新商家首次登录（还没有任何活动）；否则用 demo 活动（老商家演示）
  const _fresh = _p.get("fresh") === "1";
  const [activities, setActivities] = useState(_fresh ? [] : DEFAULT_ACTIVITIES.map(a => ({...a, vouchers:(a.vouchers||[]).map(v=>({...v})), prizeLadder:(a.prizeLadder||[]).map(p=>({...p, prize:{...p.prize}}))})));

  const top = () => window.scrollTo(0,0);
  const toLanding = () => { setScreen("landing"); top(); };
  const enterApp = (sec) => { if (sec) setAppSec(sec); setScreen("app"); top(); };
  // 店名从首页 hero 输入带入(name)；未登录跳过 describe 直接进 loader→选游戏(swipe)
  const startBuild = (name) => { const nm = typeof name==="string" ? name.trim() : ""; setNeed(nm); setGame(TEMPLATES[0]); setBrand({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] }); setScreen(authed ? "results" : "building"); top(); };
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
  else if (screen === "results") flowStep = <Results need={need} onRename={setNeed} onPick={(t,c)=>{ setGame(t); if(c) setBrand(b=>({...b,color:c})); setScreen("preview"); top(); }} onBack={()=> authed ? enterApp(appSec) : toLanding()} />;
  else if (screen === "preview" && authed) flowStep = <div><Workspace game={game} brand={brand} setBrand={setBrand} /><div style={{ display:"flex", gap:12, justifyContent:"flex-end", padding:"16px 28px" }}><button className="btn ghost lg" onClick={()=>{ setScreen("results"); top(); }}><Ic.back style={{ width:16, height:16 }}/> {tr(lang,"Back","上一步")}</button><button className="btn primary lg" onClick={publishDone}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Save game","保存游戏")}</button></div></div>;
  else if (screen === "preview") flowStep = <Preview game={game} brand={brand} setBrand={setBrand} onLaunch={toPublishGate} onBack={()=>{ setScreen("results"); top(); }} />;

  const shellProps = { game, setGame, brand, setBrand, lang, setLang, sec:appSec, setSec:setAppSec, onExit:toLanding, outlets, setOutlets, activities, setActivities, myGames, setMyGames, cardOnFile, setCardOnFile };

  let body;
  if (screen === "landing") body = <Landing go={startBuild} onSignIn={signIn} lang={lang} setLang={setLang} />;
  else if (screen === "register") body = (
    <div className="shell">
      <div className="topbar">
        <div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div>
        <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}>
          <LangToggle lang={lang} setLang={setLang} />
          <button className="ghost-x" onClick={toLanding}>{tr(lang,"Exit","退出")}</button>
        </div>
      </div>
      <Register onDone={publishDone} onSignIn={signIn} onSaveCard={setCardOnFile} onBack={backToPreview} />
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
