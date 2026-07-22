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

/* ===================== legal (ToS / Privacy / Player Terms) ===================== */
/* content lives in legal.jsx (LEGAL); opened globally via openLegal(doc) */
let _setLegal = null;
const openLegal = (doc) => { _setLegal && _setLegal(doc); };
const LEGAL_TITLES = { tos:["Terms of Service","服务条款"], privacy:["Privacy Policy","隐私政策"], player:["Player Terms","玩家使用条款"] };
function legalInline(s){
  return String(s).split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean).map((p,i)=>{
    if(p.startsWith("**")&&p.endsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
    if(p.startsWith("`")&&p.endsWith("`")) return <code key={i} className="legal-ph">{p.slice(1,-1)}</code>;
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
function LegalBlocks({ blocks }){
  return (blocks||[]).map((b,i)=>{
    if(b.t==="h") return <h4 key={i} className="legal-h">{legalInline(b.x)}</h4>;
    if(b.t==="h1") return <h3 key={i} className="legal-h1">{legalInline(b.x)}</h3>;
    if(b.t==="p") return <p key={i} className="legal-p">{legalInline(b.x)}</p>;
    if(b.t==="ul") return <ul key={i} className="legal-ul">{b.x.map((it,j)=><li key={j}>{legalInline(it)}</li>)}</ul>;
    if(b.t==="tbl") return (
      <div key={i} className="legal-tblwrap"><table className="legal-tbl">
        <thead><tr>{b.head.map((h,j)=><th key={j}>{legalInline(h)}</th>)}</tr></thead>
        <tbody>{b.rows.map((r,j)=><tr key={j}>{r.map((c,k)=><td key={k}>{legalInline(c)}</td>)}</tr>)}</tbody>
      </table></div>);
    return null;
  });
}
function LegalModal({ doc, onClose }){
  const lang = useLang();
  const [cur, setCur] = useState(doc);
  const blocks = ((typeof LEGAL!=="undefined" && LEGAL[cur]) || {})[lang] || [];
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal legal-modal" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <div className="legal-tabs">
          {["tos","privacy","player"].map(k=>(
            <button key={k} className={"legal-tab "+(k===cur?"on":"")} onClick={()=>setCur(k)}>{tr(lang,LEGAL_TITLES[k][0],LEGAL_TITLES[k][1])}</button>
          ))}
        </div>
        <div className="legal-body"><LegalBlocks blocks={blocks}/></div>
      </div>
    </div>,
    document.body
  );
}
function LegalHost(){
  const _lg = new URLSearchParams(location.search).get("legal");   // ?legal=tos|privacy|player 调试
  const [doc, setDoc] = useState(["tos","privacy","player"].includes(_lg) ? _lg : null);
  useEffect(()=>{ _setLegal = setDoc; return ()=>{ _setLegal = null; }; }, []);
  return doc ? <LegalModal doc={doc} onClose={()=>setDoc(null)} /> : null;
}
function LegalLinks({ lang, className }){
  return (
    <div className={"legal-links "+(className||"")}>
      <a onClick={()=>openLegal("tos")}>{tr(lang,"Terms","服务条款")}</a>
      <a onClick={()=>openLegal("privacy")}>{tr(lang,"Privacy","隐私政策")}</a>
      <a onClick={()=>openLegal("player")}>{tr(lang,"Player Terms","玩家条款")}</a>
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
      <div className="gameresult">{result ? (result.lose ? <span style={{ color:"var(--muted)" }}>{tr(lang,"So close, try again!","差一点，再来一次！")}</span> : <span><Ic.spark style={{ verticalAlign:"-2px", marginRight:2 }}/> {tr(lang,"You won","你赢了")} <b>{P(lang,result)}</b></span>) : <span style={{ color:"var(--muted)", fontWeight:500 }}>　</span>}</div>
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
        <div className="prizebanner">{result ? (result.lose ? <span>{tr(lang,"So close, ","差一点点，")}<b>{tr(lang,"try again","再来一次")}</b>！</span> : <span><Ic.spark style={{ verticalAlign:"-2px", marginRight:2 }}/> {tr(lang,"You won","你赢了")} <b>{result.label}</b></span>) : <span style={{ color:"var(--muted)", fontWeight:500 }}>{tr(lang,"Tap the button to try it","点上面的按钮，试玩一下")}</span>}</div>
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
const STEPS = [{en:"Describe",zh:"描述"},{en:"Pick a game",zh:"选游戏"},{en:"My game",zh:"我的游戏"}]; // 描述(店名有则跳过、自动打勾)/选游戏/我的游戏
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
/* map-first landing helpers (2026-07-20) */
function MapHero({ lang }) {
  return (
    <div className="mapcard">
      <div className="mglow"></div>
      <svg className="mstreets" viewBox="0 0 400 416" preserveAspectRatio="none">
        <line className="mn" x1="0" y1="120" x2="400" y2="150"/>
        <line className="mn" x1="150" y1="0" x2="120" y2="416"/>
        <line className="mn" x1="0" y1="300" x2="400" y2="270"/>
        <line x1="0" y1="60" x2="400" y2="80"/><line x1="0" y1="205" x2="400" y2="215"/>
        <line x1="0" y1="365" x2="400" y2="345"/><line x1="60" y1="0" x2="40" y2="416"/>
        <line x1="260" y1="0" x2="280" y2="416"/><line x1="340" y1="0" x2="360" y2="416"/>
      </svg>
      <div className="mpin" style={{ left:"24%", top:"30%" }}><span className="d"><b>C</b></span></div>
      <div className="mpin" style={{ left:"78%", top:"26%" }}><span className="d"><b>B</b></span></div>
      <div className="mpin" style={{ left:"16%", top:"64%" }}><span className="d"><b>R</b></span></div>
      <div className="mpin" style={{ left:"84%", top:"70%" }}><span className="d"><b>K</b></span></div>
      <div className="mpin" style={{ left:"40%", top:"80%" }}><span className="d"><b>T</b></span></div>
      <div className="mpin" style={{ left:"66%", top:"82%" }}><span className="d"><b>D</b></span></div>
      <div className="mpin you" style={{ left:"52%", top:"52%" }}><span className="d"><b>YOU</b></span></div>
      <div className="mcallout">
        <div className="ct">{tr(lang,"Your shop","你的店")}</div>
        <div className="cb">{tr(lang,"▶  Click to play your game","▶  点击玩你的游戏")}</div>
      </div>
      <div className="mchrome">
        <div className="mtop">
          <span className="mlg"><b>Ki</b>X</span><span className="msp"></span>
          <span className="mpill">⌕ {tr(lang,"Search","搜索")}</span>
          <span className="mpill">◱ City</span>
          <span className="mpill pts">★ 0 pts</span>
          <span className="mpill vch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 6 2 2 0 01-2 2H6a2 2 0 01-2-2 2 2 0 000-6z"/></svg> 0</span>
        </div>
        <div className="mloc">Singapore · Orchard</div>
        <div className="mfilters"><span className="mfil on">GO</span><span className="mfil">Night</span><span className="mfil">Bold</span></div>
        <div className="mfoot"><span className="mnearby">{tr(lang,"NEARBY MALLS","附近商场")}</span><span className="mrecenter">◎</span></div>
      </div>
    </div>
  );
}
function MiniMap() {
  return (
    <div className="wtm">
      <svg viewBox="0 0 120 250" preserveAspectRatio="none"><line x1="0" y1="90" x2="120" y2="80"/><line x1="0" y1="170" x2="120" y2="180"/><line x1="45" y1="0" x2="35" y2="250"/><line x1="90" y1="0" x2="100" y2="250"/></svg>
      <div className="b">◱ Singapore</div>
      <span className="p" style={{ left:"70%", top:"30%" }}></span>
      <span className="p" style={{ left:"25%", top:"58%" }}></span>
      <span className="p" style={{ left:"80%", top:"74%" }}></span>
      <span className="p you" style={{ left:"48%", top:"48%" }}></span>
    </div>
  );
}
function Store3D({ lang }) {
  return (
    <div className="wts"><div className="bld">
      <div className="sign">{tr(lang,"Your shop","你的店")}</div>
      <div className="face"><div className="awn"></div><div className="door"></div></div>
      <div className="enter">{tr(lang,"▶ Enter","▶ 进店")}</div>
    </div></div>
  );
}
function Hero({ go }) {
  const lang = useLang();
  const [name, setName] = useState("");
  return (
    <section className="hero">
      <div>
        <h1 className="hero-h">{tr(lang,"They play.","他们来玩。")}<br/>{tr(lang,"They pay.","他们消费。")}<br/>{tr(lang,"They ","他们")}<span className="hl">{tr(lang,"stay.","留下来。")}</span></h1>
        <p style={{ fontSize:18, color:"var(--ink-2)", margin:"18px 0 0", maxWidth:"22em" }}>{tr(lang,"Your own branded game that customers play to win, then walk in to spend.","一个你自己品牌的小游戏，客人来玩、赢券，进店消费。")}</p>
        <div className="wow-form">
          <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") go(name); }} placeholder={tr(lang,"Your business name","你的店名")} />
          <button className="btn primary" onClick={()=>go(name)}>{tr(lang,"See my game →","看我的游戏 →")}</button>
        </div>
        <div className="hero-chips">
          <span className="hchip"><b>{tr(lang,"3 min","3 分钟")}</b>{tr(lang," to launch"," 上线")}</span>
          <span className="hchip">{tr(lang,"Free to try","免费试用")}</span>
        </div>
      </div>
      <div className="visual">
        <div className="hv-wrap">
          <div className="float f1"><span className="ic" style={{ background:"var(--green-50)", color:"var(--green-d)" }}><Ic.spark/></span><div><div className="ft">{tr(lang,"Someone just played","又有人玩了一局")}</div><div className="fs">{tr(lang,"won a free coffee","赢到一杯免费咖啡")}</div></div></div>
          <div className="float f2"><span className="ic" style={{ background:"#FFF3DA", color:"var(--amber)" }}><Ic.ret/></span><div><div className="ft">{tr(lang,"A regular came back","老顾客回来了")}</div><div className="fs">{tr(lang,"won back after 30 days","30 天没来 · 已召回")}</div></div></div>
          <div className="herovid">
            <span className="hv-badge"><span className="b"></span>{tr(lang,"Live demo","实拍演示")}</span>
            <button className="hv-play" aria-label="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>
            <span className="hv-cap">{tr(lang,"See how it plays · 30s","看 30 秒怎么玩")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
function Walkthrough() {
  const lang = useLang();
  const S = [
    { img:"walkthrough/poster.png", pos:"top",    label:tr(lang,"Spots your poster","看到你的海报") },
    { scan:true,                                   label:tr(lang,"Scans, no app","扫码，免下载") },
    { img:"walkthrough/play.png",   pos:"top",    label:tr(lang,"Plays YOUR game","玩你的专属游戏") },
    { img:"walkthrough/win.png",    pos:"center", label:tr(lang,"Wins a voucher","赢到一张券") },
    { img:"walkthrough/redeem.png", pos:"top",    label:tr(lang,"Redeems & returns","兑奖，成常客") },
  ];
  return (
    <section className="sec" id="the-game">
      <h2 className="sec-h">{tr(lang,"Turn your business into a playground","把你的店变成游乐场")}</h2>
      <p className="sec-sub">{tr(lang,"With your own branded game, customers play, pay and stay.","你自己的品牌小游戏，让客人来玩、消费、留下来。")}</p>
      <div className="wt-row">
        {S.map((s,i)=>(
          <React.Fragment key={i}>
            <div className="wt-step">
              <div className="wt-phone"><div className="wt-scr">
                {s.scan ? <div className="wt-scan"><i></i></div> : <img src={s.img} alt="" style={{ objectPosition:s.pos }}/>}
              </div></div>
              <div className="wt-label">{s.label}</div>
            </div>
            {i < S.length-1 && <div className="wt-arrow">→</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="ppp">
        <div className="pppc"><div className="k">PLAY</div><h4>{tr(lang,"They play their way in","他们玩着玩着就进店")}</h4><p>{tr(lang,"Your branded game is the hook. No ads to buy.","你的品牌游戏就是钩子，不用买广告。")}</p></div>
        <div className="pppc"><div className="k">PAY</div><h4>{tr(lang,"They win, walk in & spend","他们赢券、进店、消费")}</h4><p>{tr(lang,"A voucher, never cash, turns a play into a paying visit.","发的是券不是现金，一次游戏换来一次真进店消费。")}</p></div>
        <div className="pppc"><div className="k">STAY</div><h4>{tr(lang,"They keep coming back","他们一再回头")}</h4><p>{tr(lang,"Play again, win again, spend again. Regulars, not one-offs.","一次次玩、一次次赢、一次次消费，来的是常客不是过客。")}</p></div>
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
          <div className="sec-eye" style={{ textAlign:"left" }}>{tr(lang,"MADE IN MINUTES","几分钟做好")}</div>
          <h2 className="wow-h">{tr(lang,"Type your business name","输入你的店名")}<br/><span className="hl">{tr(lang,"See your game in 3 min","3 分钟看到你的游戏")}</span></h2>
          <p className="wow-sub">{tr(lang,"Our AI matches 1,000+ formats to your trade and auto-brands one with your logo & colors.","AI 从上千种玩法里匹配你的行业，自动套上你的 logo 和品牌色。")}</p>
          <div className="wow-form">
            <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") go(name); }} placeholder={tr(lang,"Your business name","你的店名")} />
            <button className="btn primary" onClick={()=>go(name)}>{tr(lang,"See my game →","看我的游戏 →")}</button>
          </div>
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
  const F = [
    { h:tr(lang,"Players browse the map","玩家逛地图"),      p:tr(lang,"They open KiX to explore shops around them.","打开 KiX 逛附近有什么好玩的店。") },
    { h:tr(lang,"They spot your shop","刷到你的店"),          p:tr(lang,"Yours is a spot they can tap and play, no ads from you.","你的店是能点开就玩的一个点，你不用投广告。") },
    { h:tr(lang,"They play & win","玩一局、赢到券"),          p:tr(lang,"A round of your branded game wins them a voucher.","玩一把你的品牌游戏，赢到一张券。") },
    { h:tr(lang,"They walk in","到店消费、成常客"),           p:tr(lang,"They redeem in store and keep coming back.","到店兑券消费，一次次回头。") },
  ];
  return (
    <section className="sec" id="why">
      <h2 className="sec-h">{tr(lang,"Put your shop's game on the map, ","把你的店铺小游戏放上地图，")}<span className="hl">{tr(lang,"discovered worldwide","让全球人发现")}</span></h2>
      <p className="sec-sub">{tr(lang,"Players browsing the map find you and tap in to play, with zero ad spend from you.","玩家在地图上逛店，顺手就发现你、点进来玩，你不花一分广告费。")}</p>
      <div className="mapsec">
        <div className="mapsec-vis"><MapHero lang={lang} /></div>
        <ol className="mapflow">{F.map((s,i)=>(<li key={i} className="mapflow-step"><span className="mf-n">{i+1}</span><div><h3>{s.h}</h3><p>{s.p}</p></div></li>))}</ol>
      </div>
    </section>
  );
}
function FairDeal() {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"THE FAIR DEAL","公平的规则")}</div>
      <h2 className="sec-h">{tr(lang,"Your brand's game, not a discount platform","你自己品牌的游戏，不是打折平台")}</h2>
      <p className="sec-sub">{tr(lang,"Discount platforms train people to only show up when it's cheap. KiX gives you a branded game people play for fun, and you're billed by how many play, not by cutting your margin.","打折平台只会把客人训练成不打折不来。KiX 给你一个大家愿意玩的品牌游戏，按玩的人数计费，而不是靠砍你的利润。")}</p>
      <div className="fair-vs">
        <div className="fvs bad"><div className="lab"><span className="x">✕</span> {tr(lang,"DISCOUNT DEALS","打折平台")}</div><p>{tr(lang,"Deep cuts for everyone: you subsidise people who'd have paid anyway, and pull in one-time bargain hunters.","全场打骨折：本来就会买的人被你白白补贴，招来的多是薅一次就走的人。")}</p></div>
        <div className="fvs good"><div className="lab"><Check/> KiX</div><p>{tr(lang,"A branded game that's yours. You keep your full margin and your customers, and pay only by how many people play.","一个属于你自己的品牌游戏。利润和客户都还是你的，只按玩的人数付费。")}</p></div>
      </div>
    </section>
  );
}
function Faq() {
  const lang = useLang();
  const QA = [
    { q:tr(lang,"How do customers find me on the map?","客人怎么在地图上找到我？"), a:tr(lang,"Players open KiX and browse shops near them, by street or by mall. Your shop shows up as a spot they can tap to play. You can also print a QR poster so people scan you directly.","玩家打开 KiX，按街区或商场逛附近的店。你的店是地图上一个能点开玩的位置。你也可以打印二维码海报，让人直接扫你。") },
    { q:tr(lang,"A customer found me on the map, then what?","客人在地图上找到我，然后呢？"), a:tr(lang,"They tap into your 3D shop and play your game right there. Win, and they get a voucher to redeem in store, so a browse on the map becomes a real, paying visit.","他们点进你的 3D 店，就地玩你的小游戏。玩赢了拿到一张能到店兑的券，专程进店消费。一次「逛地图」就变成一次真到店、真消费。") },
    { q:tr(lang,"What if the map is quiet in my area right now?","我这一带地图上现在没什么人怎么办？"), a:tr(lang,"Then you start with the tool, not the network. Your game works on its own from day one: put the QR on your door and counter, and every scan wins. As more shops nearby join, the map brings you extra players on top.","那就先把它当工具用，别指望网络。你的游戏第一天就能独立跑：把二维码贴在门口和收银台，扫码就能玩、就能赢。等附近的店越来越多，地图会再额外给你带玩家。") },
    { q:tr(lang,"Do my customers need to download an app?","客人需要下载 App 吗？"),               a:tr(lang,"No. They scan a QR and play right in the browser. The KiX app is optional; it just unlocks more games and rewards for the fans.","不用。扫码就能在浏览器里玩。KiX App 是可选的，只是给玩上瘾的人多解锁些游戏和奖励。") },
    { q:tr(lang,"Do I need any hardware or tech skills?","需要任何硬件或技术吗？"),                a:tr(lang,"None. You redeem by scanning the winner's QR with your own phone. No POS changes, no dev work, no agency.","都不用。你用自己的手机扫赢家的二维码即可兑奖。不改 POS、不用开发、不用找代理。") },
    { q:tr(lang,"What does it actually cost?","到底怎么收费？"), a:(<>
        {tr(lang,"Free for your first 3 months. After that you pay one simple monthly price, based on how many people play your game that month, and the more they play, the cheaper each one gets:","前 3 个月免费。之后按一个简单的月费计费，看这个月有多少人玩你的游戏；玩的人越多，每位越便宜：")}
        <div className="faq-tiers">
          <div><span>{tr(lang,"Up to 500 players","最多 500 位玩家")}</span><b>S$29{tr(lang,"/mo","/月")}</b></div>
          <div><span>{tr(lang,"Up to 2,500 players","最多 2,500 位玩家")}</span><b>S$79{tr(lang,"/mo","/月")}</b></div>
          <div><span>{tr(lang,"Up to 10,000 players","最多 10,000 位玩家")}</span><b>S$199{tr(lang,"/mo","/月")}</b></div>
        </div>
        {tr(lang,"The software is always free, extra players beyond your plan are just a few cents each, and you can cancel anytime. Bigger, or a chain? Just talk to us.","软件永久免费，超出套餐的玩家每位只要几分钱，随时可取消。规模更大、或是连锁？直接联系我们。")}
      </>) },
    { q:tr(lang,"I already run a loyalty program. Does this replace it?","我已经有会员体系了，这会取代它吗？"), a:tr(lang,"No, it feeds it. KiX brings new faces through the door; your loyalty program keeps them. They work together.","不会，反而是给它添柴。KiX 负责把新客带进门，你的会员体系负责把人留住，两边配合。") },
    { q:tr(lang,"What if a competitor copies my game?","竞争对手抄我的游戏怎么办？"),               a:tr(lang,"Good, that's the point. They'll need their own game, branded to them, they can't copy your customers away. And every shop that joins brings more players onto KiX, which means more of them discovering you.","好啊，我们巴不得。他们得做自己的游戏、打自己的品牌，抄不走你的客人。而且每多一家店加入，KiX 上玩的人就越多，来发现你的店的人也越多。") },
    { q:tr(lang,"Is my customer data safe?","我的客户数据安全吗？"),                             a:tr(lang,"Yes. Your customers and their data stay with your business. KiX is the invisible engine; we never take your customers away.","安全。你的客户和数据都留在你自己店里。KiX 只是背后那台隐形引擎，从不把客户带走。") },
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
          <div className="viz"><div className="vrow"><span className="vp" style={{ background:"#EEF1FF", color:"#4F46E5" }}><Ic.bell/></span>{tr(lang,"Miss you! Here's a free coffee","想你了，送你一杯免费咖啡")}</div><div className="vbignum"><b>29%</b> <span className="vmini">{tr(lang,"win-back rate","召回复购率")}</span></div></div></div>
        <div className="tcard"><div className="tnum">{tr(lang,"03 · ZERO WASTE","03 · 零浪费")}</div><h3>{tr(lang,"Not like burning cash on ads","不像投广告那样烧钱")}</h3><p>{tr(lang,"No impressions, no clicks, no wasted budget. You pay by how many people actually play your game, nothing else.","不为曝光付费，不为点击付费，只按真正玩过你游戏的人数计费，别的都不算。")}</p>
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
      <h2 className="sec-h">{tr(lang,"One gameplay engine, AI picks the mechanic that fits your shop","一套玩法引擎，AI 帮你挑一个最搭你店的玩法")}</h2>
      <p className="sec-sub">{tr(lang,"Spin, scratch, stack, catch: 1,000+ play mechanics, each wrapped in your brand.","转盘、刮刮乐、叠叠乐、接一接，上千种玩法，每一种都能套上你的品牌。")}</p>
      <div className="gallery">{GAMES.map((g, i) => (
        <div key={i} className="gtile" onClick={go}><div className="art"><GamePreview kind={g.kind} colors={g.g} /></div><div className="cap">{P(lang,g.n)}<div className="sm">{P(lang,g.t)}</div></div></div>))}</div>
      <div className="gallery-foot">{tr(lang,"Plus ","还有 ")}<b style={{ color:"var(--ink)" }}>1,000+</b>{tr(lang," templates, make any of them your own","个模板，每个都能换成你的品牌")}</div>
    </section>
  );
}
function Steps() {
  const lang = useLang();
  const S = [{ i:Ic.gamepad, h:tr(lang,"Pick a game","挑一个游戏"), p:tr(lang,"Choose a format that fits your shop from 1,000+ templates.","从上千个模板里选一个适合你店的玩法。") },{ i:Ic.palette, h:tr(lang,"Add your brand","套上你的品牌"), p:tr(lang,"Drop in your logo and photos; AI auto-colors and builds it.","传上 logo 和商品图，AI 自动配色、生成游戏。") },{ i:Ic.store, h:tr(lang,"Redeem in store","客人到店兑奖"), p:tr(lang,"Winners walk in; you scan their QR or swipe to redeem.","赢家凭二维码到店，你一扫或滑动兑奖即可。") }];
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"HOW IT WORKS","三步上线")}</div><h2 className="sec-h">{tr(lang,"Three steps to open for business","三步做好，开门收客")}</h2>
      <div className="steps">{S.map((s, i) => (<div key={i} className="stp"><div className="sn">0{i+1}</div><div className="si">{s.i()}</div><h3>{s.h}</h3><p>{s.p}</p></div>))}</div>
    </section>
  );
}
const STORIES = [
  { init:"M", tone:["#16A34A","#22C55E"], name:{en:"Marcus · Bubble tea",zh:"Marcus · 茶饮店"}, type:{en:"2 outlets, Singapore",zh:"新加坡 · 2 家门店"},
    quote:{en:"People in the mall who'd never have found us just tapped in and played. Half of them walked over the same day.",zh:"商场里那些本来根本找不到我们的人，点进来玩了一局。当天就有一半人走过来了。"} },
  { init:"L", tone:["#0EA5E9","#38BDF8"], name:{en:"Auntie Lim · Kopitiam",zh:"Lim 姨 · 小食店"}, type:{en:"Standalone, Singapore",zh:"新加坡 · 独立店"},
    quote:{en:"I don't do apps or ads. I typed my shop name, got a game, printed the QR. Regulars love it and bring friends.",zh:"我不搞什么 App、广告。输个店名就有游戏，打印二维码贴上。老客很爱玩，还带朋友来。"} },
  { init:"P", tone:["#B45309","#D97706"], name:{en:"Priya · Café",zh:"Priya · 咖啡馆"}, type:{en:"Boutique, Singapore",zh:"新加坡 · 精品店"},
    quote:{en:"Discount platforms just subsidised my regulars. This brings faces I've never seen, and I'm not giving away cash.",zh:"打折平台只是白补贴我的老客。这个带来的是我从没见过的新面孔，而且我没在送现金。"} },
];
function Stories() {
  const lang = useLang();
  return (
    <section className="sec">
      <div className="sec-eye">{tr(lang,"FROM SHOP OWNERS","来自店主")}</div>
      <h2 className="sec-h">{tr(lang,"Shops already on the map","已经在地图上的店")}</h2>
      <div className="stories">
        {STORIES.map((s,i)=>(
          <div key={i} className="story">
            <p className="story-q">“{P(lang,s.quote)}”</p>
            <div className="story-hd"><span className="story-av" style={{ background:`linear-gradient(145deg,${s.tone[0]},${s.tone[1]})` }}>{s.init}</span><div><div className="story-nm">{P(lang,s.name)}</div><div className="story-ty">{P(lang,s.type)}</div></div></div>
          </div>
        ))}
      </div>
    </section>
  );
}
// ?pricing=legacy → 旧 §4.0 用量计费 2 卡方案（可切换回退）；默认 = 新混合制 3 档 + Custom（2026-07-20 定价改版）
function pricingLegacy() { return new URLSearchParams(location.search).get("pricing")==="legacy"; }
function Pricing({ go }) {
  const lang = useLang();
  const [lead, setLead] = useState(()=> new URLSearchParams(location.search).get("lead")==="1");   // ?lead=1 调试
  const legacy = pricingLegacy();
  return (
    <section className="sec">
      <div className="sec-eye" id="pricing">{tr(lang,"PRICING","价格")}</div>
      <h2 className="sec-h">{legacy
        ? tr(lang,"Free for 3 months. Then pay only as you grow.","前 3 个月免费，之后只按增长付费。")
        : tr(lang,"Priced to grow with you.","价格，随你成长。")}</h2>
      {legacy ? <TiersLegacy lang={lang} go={go} setLead={setLead}/> : <TiersNew lang={lang} go={go} setLead={setLead}/>}
      {lead && <CustomLeadModal onClose={()=>setLead(false)}/>}
    </section>
  );
}
// 新方案（默认，2026-07-20 定）：单一 Start free + 上升阶梯（到某玩家量收多少 + 额外每位多少）。
// 档间唯一区别 = 玩家量；门店/功能全档一样，收进 EVERY PLAN INCLUDES。Custom 折进阶梯最高一级（深色）。
const LADDER_STEPS = [
  { cls:"s1",   players:{en:"Up to 500 players",zh:"最多 500 位玩家"},    price:"S$29",  over:{en:"+ S$0.08 / extra player",zh:"超出每位 S$0.08"} },
  { cls:"pop",  pop:true, players:{en:"Up to 2,500 players",zh:"最多 2,500 位玩家"}, price:"S$79",  over:{en:"+ S$0.05 / extra player",zh:"超出每位 S$0.05"} },
  { cls:"mint", players:{en:"Up to 10,000 players",zh:"最多 10,000 位玩家"}, price:"S$199", over:{en:"+ S$0.03 / extra player",zh:"超出每位 S$0.03"} },
];
const PLAN_INCLUDES = [
  {en:"Unlimited games & dashboard",zh:"不限游戏与数据看板"},
  {en:"Unlimited outlets",zh:"不限门店"},
  {en:"Scan-to-redeem",zh:"到店扫码兑奖"},
  {en:"Shared team data",zh:"团队数据共享"},
  {en:"Auto win-back",zh:"老客自动召回"},
];
function TiersNew({ lang, go, setLead }) {
  return (<>
    <div className="ladder">
      {LADDER_STEPS.map((s,i)=>(
        <div key={i} className={"step "+s.cls} onClick={go} style={{ cursor:"pointer" }}>
          <div className="step-players">{P(lang,s.players)}</div>
          <div className="step-price">{s.price}<small>{tr(lang," /mo"," /月")}</small></div>
          <div className="step-over">{P(lang,s.over)}</div>
        </div>
      ))}
      <div className="step custom" onClick={()=>setLead(true)}>
        <div className="step-players">{tr(lang,"10,000+ players","10,000+ 位玩家")}</div>
        <div className="step-price">{tr(lang,"Talk to us","联系我们")}</div>
        <div className="step-over">{tr(lang,"Custom plan","定制套餐")}</div>
      </div>
    </div>
    <div className="ladder-cta">
      <button className="btn primary big" onClick={go}>{tr(lang,"Start free","免费开始")} <Ic.arrow style={{ width:18, height:18 }}/></button>
      <div className="ladder-micro">{tr(lang,"Free for 3 months · no card charged today · cancel anytime","前 3 个月免费 · 今天不扣卡 · 随时取消")}</div>
    </div>
    <div className="includes">
      <div className="includes-lab">{tr(lang,"EVERY PLAN INCLUDES","每个套餐都包含")}</div>
      <div className="includes-chips">
        {PLAN_INCLUDES.map((c,i)=>(<div key={i} className="inc-chip"><span className="ck"><Check/></span>{P(lang,c)}</div>))}
      </div>
    </div>
  </>);
}
// 旧方案（?pricing=legacy）：§4.0 用量计费 2 卡，原样保留以便回退/对比
function TiersLegacy({ lang, go, setLead }) {
  return (
    <div className="tiers tiers-2">
      <div className="tier pop">
        <div className="tier-tags"><span className="tag-pill">{tr(lang,"GROW WITH KIX","成长计划")}</span></div>
        <div className="tier-big">{tr(lang,"Free for 3 months","免费 3 个月")}</div>
        <div className="tier-sub">{tr(lang,"or your first 1,000 players","或首 1,000 名玩家（先到为准）")}</div>
        <hr className="tier-hr"/>
        <p className="tier-then">{tr(lang,"Then just S$0.49 per active player, cheaper the more you grow.","之后每位活跃玩家只要 S$0.49，玩的人越多越便宜。")}</p>
        <ul>
          <li><span className="ck"><Check/></span>{tr(lang,"Unlimited custom games & dashboard","不限定制游戏与数据看板")}</li>
          <li><span className="ck"><Check/></span>{tr(lang,"S$29/mo minimum · never for your regulars","每月最低 S$29 · 老客永远免费")}</li>
          <li><span className="ck"><Check/></span>{tr(lang,"Software always free, only pay for growth","软件永远免费，只为增长付费")}</li>
          <li><span className="ck"><Check/></span>{tr(lang,"No lock-in · cancel anytime","无绑定 · 随时取消")}</li>
        </ul>
        <button className="btn primary" onClick={go}>{tr(lang,"Start free","免费开始")} <Ic.arrow style={{ width:16, height:16 }}/></button></div>
      <div className="tier">
        <div className="tier-tags"><span className="tag-pill">{tr(lang,"CUSTOM","定制")}</span></div>
        <div className="tier-big">{tr(lang,"Need something custom?","需要定制？")}</div>
        <div className="tier-sub">{tr(lang,"Any size. If the standard plan doesn't fit, we'll build one with you.","不论规模。标准计划不合适，我们就陪你一起定制。")}</div>
        <hr className="tier-hr"/>
        <ul>
          <li><span className="ck"><Check/></span>{tr(lang,"A bespoke game & brand build","定制游戏与品牌搭建")}</li>
          <li><span className="ck"><Check/></span>{tr(lang,"API / POS integration","对接 API / POS")}</li>
          <li><span className="ck"><Check/></span>{tr(lang,"Multiple outlets, rolled out together","多门店统一上线")}</li>
          <li><span className="ck"><Check/></span>{tr(lang,"Exclusive & volume pricing","排他与量价")}</li>
        </ul>
        <button className="btn ghost" onClick={()=>setLead(true)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg> {tr(lang,"Talk to us","联系我们")}</button></div>
    </div>
  );
}
/* CHAINS/Custom lead-capture modal (三体 2026-07-10): modal · 5 required + optional msg ·
   key qualifier = "what do you need" (any size, not gated on outlets) · post-submit WhatsApp instant出口. */
const WA_LINK = "https://wa.me/6580000000?text=Hi%20KiX%2C%20I%27m%20interested%20in%20a%20custom%20plan"; // TODO: 换 KiX 真实 WhatsApp 号
const MAIL_LINK = "mailto:hello@letskix.com?subject=KiX%20custom%20plan%20enquiry"; // WhatsApp 未就绪前，快捷联系先走邮箱
function CustomLeadModal({ onClose }) {
  const lang = useLang();
  const [done, setDone] = useState(false), [err, setErr] = useState(false);
  const [f, setF] = useState({ name:"", biz:"", phone:"", email:"", need:"", msg:"", consent:false });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type==="checkbox" ? e.target.checked : e.target.value });
  const submit = () => {
    if(!f.name||!f.biz||!f.phone||!f.email||!f.need||!f.consent){ setErr(true); return; }
    setErr(false); setDone(true); /* TODO: POST lead → backend / notify BD */
  };
  const NEEDS = [
    tr(lang,"A bespoke game / brand build","定制游戏 / 品牌搭建"),
    tr(lang,"Multiple outlets rolled out together","多门店统一上线"),
    tr(lang,"API / POS integration","对接 API / POS"),
    tr(lang,"Exclusive / volume pricing","排他 / 量价"),
    tr(lang,"Something else","其他"),
  ];
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal lead-modal" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        {done ? (
          <div className="lead-done">
            <div className="pub-done-badge"><Ic.check style={{ width:26, height:26 }}/></div>
            <h3 style={{ textAlign:"center" }}>{tr(lang,"Thanks","收到")}{f.name?", "+f.name.trim().split(" ")[0]:""}!</h3>
            <p className="pub-sub" style={{ textAlign:"center" }}>{tr(lang,"Our team will reach out within 1 business day. Want to talk sooner?","我们会在 1 个工作日内联系你。想更快聊聊？")}</p>
            <a className="btn primary lg" style={{ textDecoration:"none", display:"flex", justifyContent:"center", marginTop:14 }} href={MAIL_LINK}>{tr(lang,"Email us now","立即发邮件给我们")} →</a>
            <button className="lead-back" onClick={onClose}>{tr(lang,"Back to pricing","返回价格")}</button>
          </div>
        ) : (
          <>
            <h3>{tr(lang,"Tell us what you need","告诉我们你的需求")}</h3>
            <p className="pub-sub">{tr(lang,"Whatever your size, a KiX specialist will reach out within one business day.","不论规模，KiX 专员都会在 1 个工作日内联系你。")}</p>
            <div className="lead-f"><label>{tr(lang,"Your name","你的姓名")} <i>*</i></label><input value={f.name} onChange={set("name")} placeholder={tr(lang,"e.g. Jia Yuan","例：家源")}/></div>
            <div className="lead-f"><label>{tr(lang,"Business / brand name","品牌 / 公司名")} <i>*</i></label><input value={f.biz} onChange={set("biz")} placeholder={tr(lang,"e.g. Heng Heng Kopi","例：兴兴咖啡")}/></div>
            <div className="lead-f"><label>{tr(lang,"Phone / WhatsApp","电话 / WhatsApp")} <i>*</i></label><input value={f.phone} onChange={set("phone")} placeholder="+65 …"/></div>
            <div className="lead-f"><label>{tr(lang,"Work email","邮箱")} <i>*</i></label><input value={f.email} onChange={set("email")} placeholder="you@yourbrand.com"/></div>
            <div className="lead-f"><label>{tr(lang,"What do you need?","你需要什么？")} <i>*</i></label>
              <select value={f.need} onChange={set("need")}><option value="">{tr(lang,"Select…","请选择…")}</option>{NEEDS.map((n,i)=><option key={i}>{n}</option>)}</select></div>
            <div className="lead-f"><label>{tr(lang,"Anything we should know?","还有什么想告诉我们？")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><textarea value={f.msg} onChange={set("msg")} placeholder={tr(lang,"Goals, timeline, current tools…","目标、时间、在用的工具…")}/></div>
            <label className="lead-consent"><input type="checkbox" checked={f.consent} onChange={set("consent")}/>{tr(lang,"I agree KiX may contact me by WhatsApp, phone or email about my enquiry.","我同意 KiX 就此咨询通过 WhatsApp、电话或邮件与我联系。")}</label>
            {err && <div className="lead-err">{tr(lang,"Please fill in all required fields and tick the consent box.","请填写所有必填项并勾选同意。")}</div>}
            <button className="btn primary lg" style={{ width:"100%", justifyContent:"center", marginTop:16 }} onClick={submit}>{tr(lang,"Request a call","预约联系")}</button>
            <a className="lead-wa" href={MAIL_LINK}>{tr(lang,"Prefer now? Email us","想现在就说？发邮件给我们")} →</a>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
function Landing({ go, onSignIn, lang, setLang }) {
  return (
    <div className="wrap">
      <nav>
        <div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/></div>
        <div className="navlinks"><a onClick={(e)=>{e.preventDefault();document.getElementById("the-game")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"How it works","怎么运作")}</a><a onClick={(e)=>{e.preventDefault();document.getElementById("why")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"Why it works","为什么有效")}</a><a onClick={(e)=>{e.preventDefault();document.getElementById("pricing")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"Pricing","价格")}</a><a onClick={(e)=>{e.preventDefault();document.getElementById("questions")?.scrollIntoView({behavior:"smooth"});}} href="#">{tr(lang,"Questions","常见问题")}</a></div>
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
        <p className="final-sub">{tr(lang,"Go live today and give every visit a reason to come back.","今天就上线，让每一次到店都成为下次回头的理由。")}</p>
        <button className="btn primary final-cta" onClick={go}>{tr(lang,"Build my game for free →","免费搭建我的游戏 →")}</button>
        <div className="final-fine">{tr(lang,"First 3 months free · no card charged today · cancel anytime","前 3 个月免费 · 今天不扣卡 · 随时取消")}</div>
      </section>
      <footer><div>{tr(lang,"KiX · built for neighbourhood shops","KiX · 为街边小店而做")}</div><LegalLinks lang={lang}/><div>Mozat Pte Ltd · Singapore</div></footer>
    </div>
  );
}

/* ===================== auth v3 · 统一认证（按 IP 分区 + 验证即建号 + 恭喜补资料 + 账号选择） =====================
   海外 IP → 邮箱 + Google/Apple SSO；国内 IP → 手机号。原型用 ?region=cn 或卡片底部 demo 链接模拟 IP。
   分裂靠后端身份归并防（email/kix_user_id 归一账号）——原型只演示前端形态。 */
function AuthEntry({ onVerified, footer, title }) {
  const lang = useLang();
  const _p = new URLSearchParams(location.search);
  const [region, setRegion] = useState(_p.get("region")==="cn" ? "cn" : "intl");
  const [step, setStep] = useState("id");
  const [val, setVal] = useState("");                                   // intl=邮箱 / cn=手机号
  const [otp, setOtp] = useState(""), [left, setLeft] = useState(0);
  React.useEffect(()=>{ if(left<=0) return; const t=setTimeout(()=>setLeft(left-1),1000); return ()=>clearTimeout(t); },[left]);
  const emailOk = /^\S+@\S+\.\S+$/.test(val.trim());
  const phoneOk = val.replace(/\D/g,"").length >= 6;
  const idOk = region==="cn" ? phoneOk : emailOk;
  const sendCode = () => { if(!idOk) return; setStep("otp"); setOtp(""); setLeft(54); };
  const verify = () => { if(otp.replace(/\D/g,"").length>=4) onVerified(); };
  const sentTo = region==="cn" ? `+86 ${val}` : val;
  return (<>
    {step === "id" ? <>
      <h1>{title || tr(lang,"Sign in or sign up","登录或注册 KiX")}</h1>
      {region === "cn" ? <>
        <p className="login-sub">{tr(lang,"Enter your phone. New here? We'll create your account.","输入手机号，第一次来会自动建账号。")}</p>
        <div className="region-note">{tr(lang,"In Mainland China? Sign in with your phone.","你在中国大陆，用手机号登录")}</div>
        <div className="field"><label>{tr(lang,"Mobile","手机号")}</label><div className="phonewrap"><input className="cc" value="+86" readOnly/><input autoFocus value={val} onChange={e=>setVal(e.target.value)} placeholder="138 0000 0000" onKeyDown={e=>{ if(e.key==="Enter") sendCode(); }}/></div></div>
        <button className="btn primary" disabled={!phoneOk} onClick={sendCode}>{tr(lang,"Send code","发送验证码")}</button>
      </> : <>
        <p className="login-sub">{tr(lang,"Enter your email. New here? We'll create your account.","输入邮箱，第一次来会自动建账号。")}</p>
        <div className="field"><label>{tr(lang,"Email","邮箱")}</label><input autoFocus type="email" value={val} onChange={e=>setVal(e.target.value)} placeholder="you@shop.com" onKeyDown={e=>{ if(e.key==="Enter") sendCode(); }}/></div>
        <button className="btn primary" disabled={!emailOk} onClick={sendCode}>{tr(lang,"Continue","继续")}</button>
        <div className="auth-divider">{tr(lang,"or","或")}</div>
        <button className="sso-btn" onClick={onVerified}><span className="glogo"></span> {tr(lang,"Continue with Google","用 Google 继续")}</button>
        <button className="sso-btn" onClick={onVerified}> {tr(lang,"Continue with Apple","用 Apple 继续")}</button>
      </>}
      {footer}
      <div className="demo-flip"><a onClick={()=>{ setRegion(region==="cn"?"intl":"cn"); setVal(""); }}>{region==="cn" ? tr(lang,"Switch to overseas view","切换到海外视图") : tr(lang,"Switch to China view","切换到国内视图")}</a></div>
    </> : <>
      <h1>{tr(lang,"Enter the code","输入验证码")}</h1>
      <p className="login-sub">{tr(lang,`We sent a 6-digit code to ${sentTo}`,`6 位验证码已发送至 ${sentTo}`)}</p>
      <div className="field"><input className="otp-input" autoFocus value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="––––––" maxLength="6" onKeyDown={e=>{ if(e.key==="Enter") verify(); }}/></div>
      <button className="btn primary" disabled={otp.replace(/\D/g,"").length<4} onClick={verify}>{tr(lang,"Verify & continue","验证并进入")}</button>
      <div className="reg-fine">{left>0 ? tr(lang,`Resend in ${left}s`,`${left} 秒后可重新发送`) : <a onClick={()=>setLeft(54)} style={{ cursor:"pointer" }}>{tr(lang,"Resend code","重新发送")}</a>} · <a onClick={()=>{ setStep("id"); setOtp(""); }} style={{ cursor:"pointer" }}>{tr(lang,"Change","换一个")}</a></div>
    </>}
  </>);
}

/* 新用户首次进入：恭喜 + 可跳过补资料 —— 浮在主页上的遮罩弹窗（用户已进主页，非独立整页；守 canon「注册后置 / 加法伤留存」） */
function Welcome({ need, onDone }) {
  const lang = useLang();
  const [name, setName] = useState((need||"").trim());
  const [phone, setPhone] = useState("");
  return (
    <div className="welcome-overlay" onClick={(e)=>{ if(e.target===e.currentTarget) onDone(); }}><div className="reg-card welcome-modal">
      <div className="welcome-hero">
        <svg className="welcome-badge" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          <circle cx="36" cy="36" r="24" fill="#16A34A"/>
          <path d="M27 36.5l6 6 12-13" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="11" cy="18" r="3" fill="#22C55E"/>
          <circle cx="61" cy="21" r="2.5" fill="#F5BE4F"/>
          <circle cx="14" cy="55" r="2.5" fill="#6B8BD4"/>
          <circle cx="60" cy="52" r="3" fill="#E39A4B"/>
          <path d="M7 36l2.5-1.6L12 36" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M64 38l-2.5-1.6L59 38" stroke="#F5BE4F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 style={{ marginBottom:8 }}>{tr(lang,"Welcome to KiX!","欢迎加入 KiX！")}</h1>
        <p className="login-sub" style={{ margin:"0 0 22px" }}>{tr(lang,"Your account is ready. Add a few details to finish.","账号建好了！花几秒完善商家信息。")}</p></div>
      <div className="field"><label>{tr(lang,"Shop name","店名")} <span className="pre">{tr(lang,"pre-filled","已预填")}</span></label><input value={name} onChange={e=>setName(e.target.value)} placeholder={tr(lang,"e.g. Kopi Corner","例如 Kopi Corner")}/></div>
      <div className="field"><label>{tr(lang,"WhatsApp mobile","WhatsApp 手机号")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><div className="phonewrap"><input className="cc" value="+65" readOnly/><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder={tr(lang,"So our team can reach you","方便我们工作人员联系你")}/></div></div>
      <div className="field"><label>{tr(lang,"Country / region","国家 / 地区")} <span className="pre">{tr(lang,"pre-filled","已预填")}</span></label><select defaultValue={0}>{COUNTRIES.map((c,i)=><option key={i} value={i}>{c.flag} {P(lang,c)}</option>)}</select></div>
      <button className="btn primary" onClick={onDone}>{tr(lang,"Save & continue","保存并进入")}</button>
      <button className="btn ghost" style={{ width:"100%", justifyContent:"center", marginTop:10 }} onClick={onDone}>{tr(lang,"Skip for now","稍后再说，先逛逛")}</button>
    </div></div>
  );
}

/* 账号选择页：membership ≥2（名下多商家 / 受邀团队席位）才出 */
function AccountPicker({ onPick }) {
  const lang = useLang();
  const accts = [
    { nm:"May's Cafe · Bugis",  ad:"Bugis St 12, Singapore",       role:"owner", c:"#16A34A", last:true },
    { nm:"May's Cafe · Jurong", ad:"Jurong East Ave 3, Singapore", role:"owner", c:"#E39A4B" },
    { nm:"Lim BBQ House",       ad:"Tampines Central 5",           role:"staff", c:"#6B8BD4" },
  ];
  return (
    <div className="reg-wrap"><div className="reg-card">
      <h1 style={{ marginBottom:8 }}>{tr(lang,"Choose a business","选择要进入的商家")}</h1>
      <p className="login-sub" style={{ margin:"0 0 10px" }}>{tr(lang,"Pick one to continue.","你有多个商家，选一个进入。")}</p>
      {accts.map((a,i)=>(
        <button key={i} className={"acct-row"+(a.last?" on":"")} onClick={onPick}>
          <div className="acct-av" style={{ background:a.c }}>{a.nm[0]}</div>
          <div style={{ flex:1 }}><div className="acct-nm">{a.nm}</div><div className="acct-ad">{a.ad}</div><span className={"acct-role "+a.role}>{a.role==="owner"?tr(lang,"Owner","店主"):tr(lang,"Staff","员工")}</span></div>
          {a.last && <span className="acct-last">{tr(lang,"Last used","上次进入")}</span>}
        </button>
      ))}
      <div className="acct-new" onClick={onPick}>＋ {tr(lang,"Create a new business","创建新商家")}</div>
    </div></div>
  );
}

/* ===================== register (账号门) · 只验证即建号进后台，不收卡 =====================
   账号门=给自己用(建/预览/逛后台)免费，不收卡。卡在真正"上线给客人玩"时才收（见 CardGate + 发布弹窗卡步）。
   建游戏第三步=存草稿+进后台（canon：不自动上线），故此处不是 go-live、不收卡。 */
function Register({ onDone, onSignIn, onSaveCard, onBack, need }) {
  const lang = useLang();
  const footer = <div className="reg-fine">{tr(lang,"By continuing you agree to our ","继续即表示同意 ")}<a onClick={()=>openLegal("tos")}>{tr(lang,"Terms","服务条款")}</a>{tr(lang," & ","与 ")}<a onClick={()=>openLegal("privacy")}>{tr(lang,"Privacy","隐私政策")}</a>{tr(lang,". Free to enter, leave anytime.","。免费进入，随时可退出。")}</div>;
  return (
    <div className="reg-wrap">
      <button className="canvas-back reg-back" onClick={onBack}><Ic.back style={{ width:15, height:15 }}/> {tr(lang,"Back","上一步")}</button>
      <div className="reg-card">
        <AuthEntry title={tr(lang,"Log in or sign up","登录或注册")} onVerified={onDone} footer={footer} />
      </div>
    </div>
  );
}

/* ===================== card gate · 任何"给客人玩"的上线(游戏/活动)首次共用的收卡闸门 =====================
   卡=计费功能：给自己用(建/预览/逛后台)免费；一旦上线给客人玩＝产生 MAU→绑卡。纯游戏玩家也算 MAU(2026-07-21 定)。 */
function CardForm({ lang, onSave }) {
  const [num, setNum] = useState(""), [exp, setExp] = useState(""), [cvc, setCvc] = useState("");
  const cardOk = num.replace(/\s/g,"").length >= 12 && exp.trim().length >= 4 && cvc.trim().length >= 3;
  const chargeDate = (() => { const d = new Date(); d.setMonth(d.getMonth()+3); return d.toLocaleDateString(lang==="zh"?"zh-CN":"en-GB",{ year:"numeric", month:"short", day:"numeric" }); })();
  const save = () => onSave && onSave({ last4: num.replace(/\s/g,"").slice(-4) || "4242" });
  return (<>
    <h1>{tr(lang,"Add a card to go live","绑张卡就能上线")}</h1>
    <p className="login-sub">{tr(lang,"Free for 3 months, then pay only as you grow.","前 3 个月免费，之后只按增长付费")}</p>
    <div className="trust-list">
      <div className="trust-row"><Ic.bell/><span>{tr(lang,`We'll remind you 7 days before it ends, around ${chargeDate}.`,`快到期时提前 7 天提醒你，大约在 ${chargeDate}。`)}</span></div>
      <div className="trust-row"><Ic.check/><span>{tr(lang,"Pause or cancel anytime.","随时下线或取消。")}</span></div>
      <div className="trust-row"><Ic.shield/><span>{tr(lang,"Stripe-encrypted, we never see your card number.","卡号交给 Stripe 加密，我们看不到。")}</span></div>
    </div>
    <div className="reg-fine card-consent">{tr(lang,"By adding your card you agree to our ","绑卡即表示同意 ")}<a onClick={()=>openLegal("tos")}>{tr(lang,"Terms","服务条款")}</a>{tr(lang," and "," 与 ")}<a onClick={()=>openLegal("privacy")}>{tr(lang,"Privacy","隐私政策")}</a>{tr(lang,", and authorize KiX to charge this card monthly after your free period (from S$29/mo, based on active players). Cancel anytime.","，并授权 KiX 在免费期结束后按月从此卡扣费（S$29/月起，按活跃玩家计）；可随时取消。")}</div>
    <div className="cardf">
      <div className="cardf-input">
        <input placeholder={tr(lang,"Card number","卡号")} value={num} onChange={e=>setNum(fmtCard(e.target.value))} inputMode="numeric"/>
        <div className="cardf-row">
          <input placeholder={tr(lang,"MM / YY","有效期 MM/YY")} value={exp} onChange={e=>setExp(e.target.value.replace(/[^\d/]/g,"").slice(0,5))} inputMode="numeric"/>
          <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric"/>
        </div>
      </div>
    </div>
    <button className="btn primary" disabled={!cardOk} onClick={save}>{tr(lang,"Add card & go live","绑卡并上线")}</button>
    <div className="charge-note">{tr(lang,"You won't be charged today.","今天不会扣款")}</div>
  </>);
}
// 独立卡门弹窗：给"绕过发布弹窗的直接上线"用（如活动管理页卡片「上线」按钮）
function CardGate({ lang, onSave, onClose }) {
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal card-gate-modal" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <CardForm lang={lang} onSave={onSave} />
      </div>
    </div>,
    document.body
  );
}

/* ===================== login (统一认证入口 · 按 IP 分区) ===================== */
function Login({ onDone }) {
  const lang = useLang();
  const footer = <div className="reg-fine">{tr(lang,"By continuing you agree to our ","继续即表示同意 ")}<a onClick={()=>openLegal("tos")}>{tr(lang,"Terms","服务条款")}</a>{tr(lang," & ","与 ")}<a onClick={()=>openLegal("privacy")}>{tr(lang,"Privacy","隐私政策")}</a>。</div>;
  return (<div className="reg-wrap"><div className="reg-card"><AuthEntry onVerified={onDone} footer={footer} /></div></div>);
}

/* ===================== flow screens ===================== */
const sic = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const CATE = [
  {en:"Coffee",zh:"咖啡", ic:sic(<><path d="M4 8h11v4a4 4 0 01-4 4H8a4 4 0 01-4-4V8z"/><path d="M15 9h2a2 2 0 010 4h-2"/><path d="M7 3.5v1.5M10 3.5v1.5"/></>)},
  {en:"Bubble tea",zh:"奶茶", ic:sic(<><path d="M6.5 8h9l-1 11a2 2 0 01-2 1.8H9.5a2 2 0 01-2-1.8z"/><path d="M8 8l1.5-4 5 1.8"/><circle cx="10" cy="16.5" r=".6"/><circle cx="12.5" cy="18" r=".6"/></>)},
  {en:"Restaurant",zh:"餐厅", ic:sic(<><path d="M7 3v18M5 3v4a2 2 0 004 0V3"/><path d="M15 3c-1.2 0-2 1.8-2 4.5S13.8 12 15 12v9"/></>)},
  {en:"Dessert",zh:"甜品", ic:sic(<><path d="M5 10h14l-1.5 9H6.5z"/><path d="M6 10a6 6 0 0112 0"/><path d="M12 4v2.5"/></>)},
  {en:"Bar",zh:"酒吧", ic:sic(<><path d="M5 5h14l-7 7z"/><path d="M12 12v6M8.5 21h7"/></>)},
  {en:"Bakery",zh:"烘焙", ic:sic(<><path d="M4 13c1.5-5 14.5-5 16 0-1.5 3-14.5 3-16 0z"/><path d="M9 12.5v3M12 11.5v4M15 12.5v3"/></>)},
  {en:"Convenience",zh:"便利店", ic:sic(<><path d="M4 9l1.2-4h13.6L20 9"/><path d="M5 9v10h14V9"/><path d="M4 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0"/></>)},
  {en:"Pets",zh:"宠物", ic:sic(<><circle cx="6.5" cy="12" r="1.3"/><circle cx="10" cy="8.5" r="1.3"/><circle cx="14" cy="8.5" r="1.3"/><circle cx="17.5" cy="12" r="1.3"/><path d="M8.5 17c0-2.5 7-2.5 7 0 0 1.8-1.8 2.8-3.5 2.8s-3.5-1-3.5-2.8z"/></>)},
  {en:"Beauty",zh:"美妆", ic:sic(<><path d="M9.5 21h5v-9h-5z"/><path d="M10.5 12V7.5l3.5-2.5v7"/></>)},
  {en:"Fashion",zh:"时装", ic:sic(<><path d="M8.5 4l-4.5 3 2 3 2-1v8h8v-8l2 1 2-3-4.5-3-1.5 2h-4z"/></>)},
  {en:"Florist",zh:"花店", ic:sic(<><circle cx="12" cy="8" r="2.4"/><path d="M12 10.4V21M12 8V4.5M12 13l-4 2M12 13l4 2"/></>)},
  {en:"Sports",zh:"运动", ic:sic(<><path d="M4 9.5v5M7 7.5v9M17 7.5v9M20 9.5v5M7 12h10"/></>)},
];
function Describe({ need, setNeed, onNext }) {
  const lang = useLang();
  const cur = (need||"").trim();
  return (
    <div className="canvas narrow describe-wrap">
      <div className="center" style={{ marginBottom:26 }}>
        <h1 className="big" style={{ fontSize:"clamp(28px,3.6vw,40px)" }}>{tr(lang,"What game do you want to make today?","今天想做什么游戏？")}</h1>
        <p className="sub">{tr(lang,"Pick a shop type, or type a brand, and AI matches the best game.","选一个店型，或输入一个品牌，AI 帮你搭最适合的玩法。")}</p>
      </div>
      <div className="desc-search">
        <svg className="ds-ic" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
        <input autoFocus value={need} placeholder={tr(lang,"e.g. Starbucks","例如：星巴克")} onChange={e=>setNeed(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&cur)onNext(); }}/>
      </div>
      <div className="cate-grid">{CATE.map((c,i) => { const lbl=P(lang,c); return (
        <button key={i} className={"cate-chip"+(lbl===cur?" on":"")} onClick={()=>setNeed(lbl)}><span className="cico">{c.ic}</span>{lbl}</button>
      ); })}</div>
      <div className="btn-row" style={{ justifyContent:"center", marginTop:26 }}><button className="btn primary lg" disabled={!cur} onClick={onNext}>{tr(lang,"Match games","匹配游戏")} <Ic.arrow/></button></div>
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
  const PCT = [96,91,88,85,82,80,78,75];
  const pct = (r) => PCT[Math.min(r, PCT.length-1)];
  const others = [(i+1)%n, (i+2)%n];
  const commitName = () => { onRename && onRename(buf.trim()); setEditing(false); };
  const cover = (t) => <span className="gcov" style={{ background:`linear-gradient(135deg,${t.g[0]}26,${t.g[1]}26)`, color:t.g[0] }}><Ic.gamepad style={{ width:22, height:22 }}/></span>;
  return (
    <div className="canvas gp2">
      {onBack && <button className="canvas-back" onClick={onBack}><Ic.back style={{ width:15, height:15 }}/> {tr(lang,"Back","上一步")}</button>}
      <div className="center" style={{ marginBottom:20 }}>
        <h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{tr(lang,"Here's your game","这是你的游戏")}</h1>
        <p className="sub">{tr(lang,`Tailored to ${name} · use it as is, or let AI pick another`,`根据 ${name} 定制 · 你可以直接用，也可以让 AI 再挑一个`)}</p>
      </div>
      <div className="gp2-grid">
        <div className="gp2-r">
          <div className="gp2-phone"><div className="gp2-screen">
            <div className="gp2-brandbar"><span className="gp2-av" style={{ background:`linear-gradient(135deg,${color[0]},${color[1]})` }}>{initial}</span><b>{name}</b></div>
            <GamePreview kind={cur.kind} colors={color} />
          </div></div>
        </div>
        <div className="gp2-l">
          <div className="rs-store">
            <span className="rs-store-ic"><Ic.store style={{ width:18, height:18 }}/></span>
            {editing
              ? <input autoFocus className="gp2-name-in" value={buf} onChange={e=>setBuf(e.target.value)} onBlur={commitName} onKeyDown={e=>{ if(e.key==="Enter") commitName(); }} placeholder={tr(lang,"Your business name","你的店名")}/>
              : <><div className="rs-store-t"><div className="rs-store-lbl">{tr(lang,"YOUR SHOP","你输入的店铺")}</div><b>{name}</b></div>
                  <button className="gp2-edit" onClick={()=>{ setBuf(need||""); setEditing(true); }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> {tr(lang,"edit","改")}</button></>}
          </div>
          <div className="rs-main">
            <div className="rs-main-hd">{cover(cur)}<div className="rs-main-nm">{P(lang,cur.name)}</div><span className="rs-pct">{pct(0)}% {tr(lang,"match","匹配")}</span></div>
            <div className="gp2-why-lbl">{tr(lang,"WHY THIS ONE","为什么是这个")}</div>
            <p className="gp2-game-why">{P(lang,cur.lede)}</p>
          </div>
          <button className="btn primary lg rs-use" onClick={()=>onPick(cur, color)}>{tr(lang,"Use this game","用这个游戏")} <Ic.arrow/></button>
          <button className="btn ghost lg rs-another" onClick={()=>setI(x=>(x+1)%n)}><Ic.refresh style={{ width:16, height:16 }}/> {tr(lang,"Show me another","换一个看看")}</button>
          <div className="rs-more-lbl">{tr(lang,"2 more options","其他 2 个候选")}</div>
          <div className="rs-cands">
            {others.map((x,k)=>{ const t=TEMPLATES[x]; return (
              <button key={x} className="rs-cand" onClick={()=>setI(x)}>{cover(t)}<div className="rs-cand-t"><div className="rs-cand-nm">{P(lang,t.name)}</div><div className="rs-cand-pct">{pct(k+1)}% {tr(lang,"match","匹配")}</div></div></button>
            ); })}
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
      <div className="k">{tr(lang,"Brand: logo, colors & product photos","品牌资料：Logo、配色和商品图")}</div>
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
      <div className="bc-site"><Ic.spark style={{ width:14, height:14, flex:"none", color:"var(--green-d)" }}/><input value={brand.site||""} onChange={e=>setBrand(b=>({...b,site:e.target.value}))} placeholder={tr(lang,"Website or social (optional), we'll pull your logo & colors","网站或社媒（选填），我们自动抓取你的 logo 和配色")}/></div>
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
        : tr(lang,"Given out until the quantity runs out; no win-rate to set. One voucher per activity for now.","按张数自然发，发完即停，不用设中奖率。目前一个活动只发一种券。")}</p>
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
function Preview({ game, brand, setBrand, onLaunch, onBack, need }) {
  const lang = useLang();
  const name = (need||"").trim() || tr(lang,"your shop","你的店");
  const _w = name.split(/\s+/).filter(Boolean);
  const initial = (_w.length>1 ? _w.slice(0,2).map(w=>w[0]).join("") : name.slice(0,2)).toUpperCase();
  // 品牌面板 = AI 输入（draft）；点「用我的品牌生成」跑 AI(loading) 才应用到左侧(applied)。上线始终不被阻塞。
  const [draft, setDraft] = useState(brand);
  const [applied, setApplied] = useState(brand);
  const [gen, setGen] = useState(false);
  const changed = draft.logo !== applied.logo || (draft.color && applied.color && draft.color[0] !== applied.color[0]) || (draft.products||[]).length !== (applied.products||[]).length;
  const c = applied.color || COLOR_SETS[0];
  const genTasks = [tr(lang,"Reading your brand","读取你的品牌"), tr(lang,"Extracting colors & logo","提取配色与 logo"), tr(lang,"Repainting your playable game","重绘可试玩的游戏")];
  const generate = () => { if (gen) return; setGen(true); setTimeout(() => { setApplied(draft); setBrand(draft); setGen(false); }, 1800); };
  const logoRef = useRef(null), prodRef = useRef(null); const [busy, setBusy] = useState(false);
  const onLogo = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setBusy(true); const rd = new FileReader(); rd.onload = async () => { const url = rd.result; const rgb = await extractColor(url); setDraft(b => ({ ...b, logo:url, logoMark:null, color: rgb ? paletteFromRgb(rgb) : b.color })); setBusy(false); }; rd.readAsDataURL(f); };
  const onProds = (e) => { const fs = Array.from(e.target.files||[]).slice(0,6); Promise.all(fs.map(f => new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.readAsDataURL(f); }))).then(urls => setDraft(b => ({ ...b, products:[...(b.products||[]), ...urls].slice(0,6) }))); };
  const reroll = () => setDraft(b => ({ ...b, color: COLOR_SETS[Math.floor(Math.random()*COLOR_SETS.length)] }));
  const swatches = [draft.color, ...COLOR_SETS.filter(c => c[0] !== (draft.color||[])[0])].slice(0,5);
  return (
    <div className="canvas gp2">
      {onBack && <button className="canvas-back" onClick={onBack}><Ic.back style={{ width:15, height:15 }}/> {tr(lang,"Back","上一步")}</button>}
      <div className="center" style={{ marginBottom:20 }}>
        <h1 className="big" style={{ fontSize:"clamp(26px,3.4vw,38px)" }}>{tr(lang,"Make it yours","换成你的品牌")}</h1>
        <p className="sub">{tr(lang,"Colors, logo, product photos — publish when you're happy.","改颜色 / 换 Logo / 传商品图 — 满意了就点上线")}</p>
      </div>
      <div className="gp2-grid">
        <div className="gp2-r">
          <div className="gp2-phone"><div className="gp2-screen" style={{ position:"relative" }}>
            <div className="gp2-brandbar">{applied.logo ? <img className="gp2-av" src={applied.logo} alt=""/> : <span className="gp2-av" style={{ background:`linear-gradient(135deg,${c[0]},${c[1]})` }}>{initial}</span>}<b>{name}</b></div>
            <Demo game={game} brand={applied}/>
            {gen && <div className="gen-overlay"><div className="gen-spin"></div><div className="gen-title">{tr(lang,"Building your custom game","正在生成你的定制游戏")}</div><div className="gen-tasks">{genTasks.map((t,i)=><div key={i} className="gt" style={{ animationDelay:(i*0.5)+"s" }}>{t}</div>)}</div></div>}
          </div></div>
          <div className="gp2-hint-line">{gen ? "" : changed ? tr(lang,"↑ Preview shows the last generated look","↑ 左侧是上次生成的样子") : tr(lang,"↑ Playable, try it","↑ 可点着试玩")}</div>
        </div>
        <div className="gp2-l">
          <div className="pv-brand">
            <div className="pv-sec-lbl">{tr(lang,"Colors","配色")}</div>
            <div className="pv-swatches">
              {swatches.map((c,i)=>(<button key={i} className={"pv-sw"+((draft.color||[])[0]===c[0]?" on":"")} style={{ background:`linear-gradient(135deg,${c[0]},${c[1]})` }} onClick={()=>setDraft(b=>({...b,color:c}))}/>))}
              <button className="pv-sw pv-add" onClick={reroll} title={tr(lang,"Shuffle","换一组")}>+</button>
            </div>
            <div className="pv-uploads">
              <div className="pv-up">
                <div className="pv-up-hd"><span className="pv-up-ic"><Ic.image style={{ width:18, height:18 }}/></span><div className="pv-up-t"><b>Logo</b><span>PNG · 200×200</span></div></div>
                <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogo}/>
                <button className="pv-up-btn" onClick={()=>logoRef.current.click()}><Ic.upload style={{ width:14, height:14 }}/> {busy?tr(lang,"Reading…","读取中…"):tr(lang,"Upload","上传")}</button>
              </div>
              <div className="pv-up">
                <div className="pv-up-hd"><span className="pv-up-ic"><Ic.store style={{ width:18, height:18 }}/></span><div className="pv-up-t"><b>{tr(lang,"Photos","商品图")}</b><span>{tr(lang,"up to 6","最多 6 张")}</span></div></div>
                <input ref={prodRef} type="file" accept="image/*" multiple hidden onChange={onProds}/>
                <button className="pv-up-btn" onClick={()=>prodRef.current.click()}><Ic.upload style={{ width:14, height:14 }}/> {tr(lang,"Upload","上传")}</button>
              </div>
            </div>
            <div className="pv-ai">
              <div className="pv-ai-lbl"><Ic.spark style={{ width:14, height:14, color:"#7C3AED" }}/> {tr(lang,"Or let AI grab a set","或让 AI 帮你抓一套")}</div>
              <div className="pv-ai-in"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/></svg><input value={draft.site||""} onChange={e=>setDraft(b=>({...b,site:e.target.value}))} placeholder={tr(lang,"Website or social (optional)","网站或社媒（选填）")}/></div>
              <button className="pv-gen" onClick={generate} disabled={gen}><Ic.spark style={{ width:16, height:16 }}/> {gen?tr(lang,"Generating…","生成中…"):tr(lang,"Generate with my brand","用我的品牌生成")}</button>
            </div>
          </div>
          <div className="pv-note">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
            <div className="pv-note-t"><b>{tr(lang,"Live preview","改哪个即时预览")}</b><span>{tr(lang,"Adjust anytime after publishing; customers always see the latest.","上线后仍可回来调整，客人扫码永远看最新版")}</span></div>
          </div>
          <button className="btn primary lg pv-launch" onClick={onLaunch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15c-1 1-1.5 4-1.5 4s3-.5 4-1.5c.6-.6.6-1.9 0-2.5s-1.9-.6-2.5 0z"/><path d="M9 13c2-6 6-9 11-9 0 5-3 9-9 11l-2-2z"/><path d="M9 13l-3-1c-.5-.2-.5-.7 0-1l3-2M13 15l1 3c.2.5.7.5 1 0l2-3"/></svg> {tr(lang,"Publish","上线")}
          </button>
        </div>
      </div>
    </div>
  );
}
function Workspace({ game, brand, setBrand, setName }) {
  const lang = useLang();
  const [msgs, setMsgs] = useState([{ who:"ai", text: tr(lang,"Hi! Tell me what to change: colors, style, difficulty. Or tap a suggestion below.","嗨！想改什么直接说，配色、风格、难度都行，也可以点下面的建议。") }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(()=>{ endRef.current && endRef.current.scrollIntoView({behavior:"smooth"}); }, [msgs]);
  const CHIPS = [{en:"Make it more festive",zh:"更有节日感"},{en:"Change the wheel to blue",zh:"转盘改成蓝色"},{en:"Make it brighter",zh:"更明亮一点"},{en:"Match my brand colors",zh:"套用我的品牌色"}];
  const push = (who, text) => setMsgs(m => [...m, { who, text }]);
  const reply = (txt) => {
    const t = (txt||"").toLowerCase();
    push("user", txt);
    setTimeout(() => {
      if (/festive|festival|节日|圣诞|新年/.test(t)) { setBrand(b=>({...b,color:["#B91C1C","#F59E0B"]})); push("ai", tr(lang,"Done! Switched to a red & gold festive theme. Tap Undo up top to revert.","好了，换成红金节日配色。想还原就点上方的撤销。")); }
      else if (/blue|蓝/.test(t)) { setBrand(b=>({...b,color:["#0EA5E9","#38BDF8"]})); push("ai", tr(lang,"Changed the game to blue.","已把游戏改成蓝色。")); }
      else if (/brand|品牌|green|绿/.test(t)) { setBrand(b=>({...b,color:["#16A34A","#22C55E"]})); push("ai", tr(lang,"Applied your brand colors.","已套用你的品牌色。")); }
      else if (/voucher|coupon|券|买一送一|1-for-1|prize|奖/.test(t)) { push("ai", tr(lang,"Vouchers are managed in your Activity; head to Activities in the sidebar to add or change prizes.","奖品券在「活动」里管理，去左侧栏的「活动」加或改奖品就行。")); }
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

/* 首页"开业跑道"进度条（纯状态、不可点）：做好游戏→上线活动→贴门店码→到店兑奖 */
function HomeRunway({ cur, lang }) {
  const steps = [tr(lang,"Game ready","做好游戏"), tr(lang,"Publish activity","上线活动"), tr(lang,"Post QR","贴门店码"), tr(lang,"In-store redeem","到店兑奖")];
  return (
    <div className="runway">
      {steps.map((s,i)=>(
        <React.Fragment key={i}>
          <div className={"rnode "+(i<cur?"done":i===cur?"cur":"")}>
            <div className="dot">{i<cur ? <Ic.check style={{ width:15, height:15 }}/> : (i+1)}</div>
            <div className="lbl">{s}</div>
          </div>
          {i<steps.length-1 && <div className={"rline "+(i<cur?"done":"")}/>}
        </React.Fragment>
      ))}
    </div>
  );
}
function HomeView({ game, brand, onShare, onRecall, activities, liveGames, onNewAct, onRedeem, onGoActivity, onGoActivities, onGoActivitiesLive, onGoGames, onGoReports, outlets = OUTLETS }) {
  const lang = useLang();
  const [recalled, setRecalled] = useState(false);
  const [scanOk, setScanOk] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [qrDownloaded, setQrDownloaded] = useState(new URLSearchParams(location.search).get("qr")==="1"); // A1↔A2 分水岭：门店码是否已下载（一次性）
  const doScan = () => { setScanning(true); setTimeout(() => { setScanning(false); setScanOk(true); setTimeout(() => setScanOk(false), 2800); }, 1700); };
  const _p = new URLSearchParams(location.search);
  const _noGame = _p.get("nogame") === "1";   // 调试：C 全空态（无 live 游戏）
  const M = DEMO_METRICS;
  // ⭐ 多活动/多游戏聚合：不再只取第一个 live
  const _allLive = (activities||[]).filter(a => a.status === "live");
  const liveActs = _p.get("oneact")==="1" ? _allLive.slice(0,1) : _allLive;   // 调试：截断到 1 个 live 活动，看 A1/A2 单活动态
  const liveGamesArr = _noGame ? [] : (liveGames || []);
  const nAct = liveActs.length, nGame = liveGamesArr.length;
  const hasActs = activities && activities.length > 0;
  const _nw = _p.get("nowalkins") === "1";
  const walkins = _nw ? 0 : M.walkins;
  const hasWalkins = nAct >= 1 && walkins > 0;
  const trialLeft = +_p.get("trialleft") || 47;
  const trialEnding = trialLeft <= 14;
  // ⭐ 两阶段：开业跑道(上线第一个活动，单活动+进度条) → 运营台(在跑，业务级聚合，任意数量活动/游戏，无进度条)
  //   运营台触发：门店码已下载 / 有到店兑奖 / ≥2 个 live 活动（都已过"上线第一个活动"的开业跑道）
  const operating = nAct >= 1 && (qrDownloaded || hasWalkins || nAct >= 2);
  const oneAct = nAct === 1 ? liveActs[0] : null;
  // 券提醒：跨所有 live 活动，显最紧张的一个
  const lowStock = liveActs.map(a=>{ const v=a.vouchers&&a.vouchers[0]; const qty=(v&&+v.qty)||0, rem=Math.max(0,qty-((v&&+v.awarded)||0)); return { a, qty, rem, pct: qty?rem/qty:1 }; }).filter(x=>x.qty>0 && x.pct<=0.15).sort((p,q)=>p.rem-q.rem);
  const _lv = oneAct && oneAct.vouchers && oneAct.vouchers[0];   // 仅单活动在 hero 显券剩余（多活动歧义，交给券提醒条）
  const vQty = (_lv&&+_lv.qty)||0, vRem = _lv ? Math.max(0, vQty-((+_lv.awarded)||0)) : 0, vLow = vQty>0 && vRem/vQty<=0.15;
  const actTitle = oneAct ? P(lang, oneAct.name) : tr(lang, `${nAct} activities running`, `${nAct} 个活动进行中`);
  const gameTitle = nGame === 1 ? P(lang, liveGamesArr[0].name) : tr(lang, `${nGame} games running`, `${nGame} 个游戏在跑`);
  const playsFeed = [
    { ic:"gamepad", bg:"#EEF2FF", c:"#4F46E5", t:tr(lang,"Someone played your game","有人玩了你的游戏"), z:tr(lang,"just now","刚刚") },
    { ic:"star", bg:"#FFF7E8", c:"#F59E0B", t:tr(lang,"A new player scanned in","新玩家扫码进来"), z:tr(lang,"2 min ago","2 分钟前") },
    { ic:"gamepad", bg:"#EEF2FF", c:"#4F46E5", t:tr(lang,"Someone played 3 rounds","有人连玩了 3 局"), z:tr(lang,"6 min ago","6 分钟前") },
    { ic:"gamepad", bg:"#EEF2FF", c:"#4F46E5", t:tr(lang,"Someone played your game","有人玩了你的游戏"), z:tr(lang,"12 min ago","12 分钟前") },
  ];
  return (
    <div className="app-body">
      {operating ? (
        /* ===== 运营台（业务级聚合，任意数量活动/游戏，无跑道；hasWalkins 切换 兑奖流水+召回 / 游玩动态）===== */
        <>
          <div className="home-hero">
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <span className="hl-live"><span className="b"></span>{tr(lang,"Live","进行中")}</span>
                <h3 style={{ margin:0, cursor:"pointer" }} onClick={oneAct?onGoActivity:onGoActivitiesLive}>{actTitle}{oneAct ? " · "+tr(lang,"up and running","进行中") : ""} <Ic.arrow style={{ width:13, height:13, opacity:.45 }}/></h3>
              </div>
              <div className="live3">
                <div className="lc"><div className="n">{M.today.plays}</div><div className="l">{tr(lang,"played today","今天玩了")}</div></div>
                <div className="lc"><div className="n">{hasWalkins ? M.today.redeemed : 0}</div><div className="l">{tr(lang,"redeemed in store","到店兑奖")}</div></div>
                {oneAct && vQty>0 && <div className="lc"><div className={"n"+(vLow?" low":"")}>{vRem}</div><div className="l">{tr(lang,"vouchers left","券剩余")}</div></div>}
              </div>
            </div>
            <button className="btn primary" style={{ alignSelf:"center", marginLeft:20, flexShrink:0, display:"flex", alignItems:"center", gap:8, whiteSpace:"nowrap" }} onClick={onRedeem}>
              <Ic.target style={{ width:16, height:16 }}/>{tr(lang,"Scan to redeem","扫码兑奖")}
            </button>
          </div>
          {hasWalkins ? (
            <button className={"home-cost"+(trialEnding?" ending":"")} onClick={onGoReports}>
              <span className="hc-cell"><b>{M.newCust}</b> {tr(lang,"new customers this month","本月新客")}</span>
              <span className="hc-trial">{trialEnding
                ? <>{<Ic.bell style={{ width:13, height:13 }}/>} {tr(lang,`Free trial ends in ${trialLeft} days · then billed as you grow`,`试用还剩 ${trialLeft} 天 · 到期后按增长计费`)}</>
                : <>{<Ic.spark style={{ width:13, height:13 }}/>} {tr(lang,`First 3 months free · ${trialLeft} days left · now S$0`,`首 3 个月免费 · 还剩 ${trialLeft} 天 · 现在 S$0`)}</>}</span>
              <Ic.arrow style={{ width:14, height:14, marginLeft:"auto", opacity:.5 }}/>
            </button>
          ) : (
            <button className="home-cost" onClick={onGoReports}>
              <span className="hc-cell"><b>{M.plays}</b> {tr(lang,"plays since launch","上线以来玩过")}</span>
              <span className="hc-trial"><Ic.chart style={{ width:13, height:13 }}/> {tr(lang,"See full data & trends","看完整数据和趋势")}</span>
              <Ic.arrow style={{ width:14, height:14, marginLeft:"auto", opacity:.5 }}/>
            </button>
          )}
          {lowStock.length>0 && <button className={"lowstock"+(lowStock[0].rem===0?" out":"")} onClick={onGoActivities}>
            <span className="ls-ic"><Ic.bell style={{ width:17, height:17 }}/></span>
            <span className="ls-t">{lowStock[0].rem===0
              ? tr(lang,`"${P(lang,lowStock[0].a.name)}" is all out of vouchers, players can't win`,`「${P(lang,lowStock[0].a.name)}」的券已经发完了，客人现在赢不到奖`)
              : tr(lang,`"${P(lang,lowStock[0].a.name)}" has only ${lowStock[0].rem} vouchers left, runs out then stops`,`「${P(lang,lowStock[0].a.name)}」只剩 ${lowStock[0].rem} 张券，发完就停`)}</span>
            <span className="ls-cta">{tr(lang,"Top up","去加券")} <Ic.arrow style={{ width:13, height:13 }}/></span>
          </button>}
          <div className="panel" style={{ marginTop:16 }}>
            <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent","最近")}</h4>
            {hasWalkins
              ? FEED.slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))
              : playsFeed.map((f,i)=>(<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft">{f.t}</span><span className="fz">{f.z}</span></div>))}
          </div>
          {hasWalkins && <div className={"recall" + (recalled ? " ok" : "")}>
            <span className="ri">{recalled ? <Ic.check/> : <Ic.bell/>}</span>
            {recalled
              ? <div className="rt"><b>{tr(lang,"Win-back reminder sent to 18 regulars","召回通知已发送给 18 位老顾客")}</b><p>{tr(lang,"They've been nudged to come back; you'll see them walk in soon.","已经提醒他们回店了，等他们回来玩、来兑奖就行。")}</p></div>
              : <><div className="rt"><b>{tr(lang,"18 regulars haven't visited in 30+ days","有 18 位老顾客，超过 30 天没来了")}</b><p>{tr(lang,"Send a one-tap win-back reminder; it's your easiest repeat business.","一键发个召回通知把他们请回来，这是最容易赢回的复购。")}</p></div>
                <button className="btn primary lg" onClick={()=>setRecalled(true)}>{tr(lang,"Send reminder to 18","通知召回 18 人")}</button></>}
          </div>}
        </>
      ) : nAct === 1 ? (
        /* ===== A1 活动刚上线（恰 1 个 live 活动、门店码未下载、无到店）：先下载门店码（一次性 bootstrap）===== */
        <>
          <div className="home-hero">
            <div style={{ flex:1 }}>
              <span className="hl-live"><span className="b"></span>{tr(lang,"Live","进行中")}</span>
              <h3 style={{ marginTop:12 }}>{P(lang, oneAct.name)}</h3>
            </div>
            <div className="hh-action">
              <button className="btn primary lg" onClick={()=>setQrDownloaded(true)}>{tr(lang,"Download outlet QR","下载门店二维码")}</button>
              <span className="hmicro">{tr(lang,"One per outlet · post where customers can scan","每家店一张，贴在客人扫得到处")}</span>
            </div>
          </div>
          <HomeRunway cur={2} lang={lang}/>
        </>
      ) : nGame >= 1 ? (
        /* ===== B 游戏已上线、还没活动（支持多游戏聚合）：庆祝在跑 + 引导加活动 ===== */
        <>
          <div className="home-hero">
            <div style={{ flex:1 }}>
              <span className="hl-live"><span className="b"></span>{tr(lang,"Live","进行中")}</span>
              <h3 style={{ marginTop:12, cursor: nGame>1?"pointer":"default" }} onClick={nGame>1?onGoGames:undefined}>{gameTitle}</h3>
              <div className="live3" style={{ marginTop:16 }}>
                <div className="lc"><div className="n">{M.today.plays}</div><div className="l">{tr(lang,"played today","今天玩了")}</div></div>
              </div>
            </div>
            <div className="hh-action">
              <button className="btn primary lg" onClick={onNewAct}>+ {tr(lang,"New activity","上线活动")}</button>
              <span className="hmicro">{tr(lang,"Publish an activity, bring customers in","上线活动，把客人请到店")}</span>
            </div>
          </div>
          <HomeRunway cur={1} lang={lang}/>
        </>
      ) : (
        /* ===== C 全空态：游戏做好了、还没上线任何东西 → 两条路(上线活动 / 只上线游戏) ===== */
        <>
          <div className="home-hero">
            <div style={{ flex:1 }}>
              <span className="hl-ready">{tr(lang,"Game ready","游戏做好了")} · {P(lang, game.name)}</span>
              <h3 style={{ marginTop:12 }}>{tr(lang,"Publish an activity, bring customers in","上线活动，把客人请到店")}</h3>
            </div>
            <div className="hh-action">
              <button className="btn primary lg" onClick={hasActs?onGoActivity:onNewAct}>{tr(lang,"Publish activity","上线活动")}</button>
              <span className="hmicro">{tr(lang,"Send vouchers, bring them in to redeem","送券引客，到店兑奖")}</span>
            </div>
          </div>
          <div className="subrow">
            <span className="sr-ic"><Ic.gamepad style={{ width:22, height:22 }}/></span>
            <div>
              <div className="sr-t">{tr(lang,"Not sure yet? Let customers play first","还没想好？先让客人玩玩看")}</div>
              <div className="sr-s">{tr(lang,"Just the game, no vouchers. Add an activity anytime.","只上线游戏、不送券，随时能再加活动。")}</div>
            </div>
            <button className="btn ghost lg" onClick={onGoGames}>{tr(lang,"Publish game only","只上线游戏")}</button>
          </div>
          <div className="home-cmicro"><Ic.shield style={{ width:14, height:14 }}/> {tr(lang,"First 3 months free · cancel anytime","首 3 个月免费 · 随时取消")}</div>
          <HomeRunway cur={1} lang={lang}/>
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
        <p className="qrdl-p">{tr(lang,"Your published games & activities live in the KiX app; see them just like your customers do.","你上线的游戏和活动都在 KiX App 里，像客人那样看看真实效果。")}</p>
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
function PublishGameModal({ game, cardOnFile, onSaveCard, onClose, onConfirm }) {
  const lang = useLang();
  const [name, setName] = useState(P(lang, game.name));
  const [sq, setSq] = useState(null), [rc, setRc] = useState(null);
  const [step, setStep] = useState(new URLSearchParams(location.search).get("done")==="1" ? "done" : "confirm");
  const pick = (setter) => { const i=document.createElement("input"); i.type="file"; i.accept="image/*"; i.onchange=e=>{ const f=e.target.files[0]; if(f) setter(URL.createObjectURL(f)); }; i.click(); };
  const buildPatch = () => ({ name:{en:name,zh:name}, coverSquare:sq, coverRect:rc });
  // 上线游戏也计 MAU → 首次上线(无卡)先过卡门；有卡直接上线
  const doConfirm = () => { if (!cardOnFile) { setStep("card"); } else { onConfirm(buildPatch()); setStep("done"); } };
  const onCardSaved = (c) => { onSaveCard && onSaveCard(c); onConfirm(buildPatch()); setStep("done"); };
  if (step === "card") return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal card-gate-modal" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <CardForm lang={lang} onSave={onCardSaved} />
      </div>
    </div>,
    document.body
  );
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
        <p className="pub-sub">{tr(lang,"Check the cover & name, then confirm. Covers are AI-generated and you can replace them anytime.","确认封面和名字即可上线。封面 AI 已自动生成，可随时替换。")}</p>
        <div className="pub-covers">
          <Cover url={sq} onPick={()=>pick(setSq)} ratio="1/1" label={tr(lang,"Square","方形")} colors={game.g} name={name} lang={lang}/>
          <Cover url={rc} onPick={()=>pick(setRc)} ratio="16/9" label={tr(lang,"Landscape","长方形")} colors={game.g} name={name} lang={lang}/>
        </div>
        <label className="pub-namef"><span>{tr(lang,"Game name","游戏名称")}</span><input value={name} onChange={e=>setName(e.target.value)}/></label>
        <div className="pub-actions">
          <button className="btn ghost lg" onClick={onClose}>{tr(lang,"Cancel","取消")}</button>
          <button className="btn primary lg" onClick={doConfirm}><Ic.check style={{ width:18, height:18 }}/> {cardOnFile ? tr(lang,"Confirm & publish","确认上线") : tr(lang,"Next: add card & go live","下一步：绑卡并上线")}</button>
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
function MyGamesView({ myGames, cardOnFile, onSaveCard, onNew, onOpen, onPublish, onOffline, onDelete }) {
  const lang = useLang();
  const [filt, setFilt] = useState("all");
  const [selMode, setSelMode] = useState(false);
  const [sel, setSel] = useState(()=>new Set());
  const toggleSel = (id)=>setSel(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const exitSel = ()=>{ setSelMode(false); setSel(new Set()); };
  const doDelete = ()=>{ if(!sel.size) return; if(window.confirm(tr(lang,`Delete ${sel.size} game(s)? This can't be undone.`,`确定删除选中的 ${sel.size} 个游戏？删除后无法恢复。`))){ onDelete && onDelete([...sel]); exitSel(); } };
  const [pubGame, setPubGame] = useState(()=> new URLSearchParams(location.search).get("pub")==="1" ? (myGames[0]||null) : null);
  const [appQr, setAppQr] = useState(false);
  // 游戏只有 草稿/已上线 两态（无"已下线"——游戏无时限无奖品，下线即回草稿，与草稿同义）
  const FILTS = [["all","All","全部"],["live","Live","已上线"],["draft","Draft","草稿"]];
  const cnt = (k) => k==="all" ? myGames.length : myGames.filter(g=>(g.status||"draft")===k).length;
  const tabs = FILTS.filter(([k]) => k==="all" || cnt(k) > 0);
  const shown = myGames.filter(g => filt==="all" ? true : (g.status||"draft")===filt);
  return (
    <div className="app-body">
      <p className="ph-sub" style={{ margin:"0 0 16px" }}>{tr(lang,"Games are your branded mini-games that customers scan and play. To hand out prizes and bring them in, add an ","游戏 = 你的品牌小游戏，客人扫码就能玩。想送奖品、把人带到店 → 去")}<b>{tr(lang,"Activity","「活动」")}</b>{tr(lang,".","加奖品和时限。")}</p>
      {myGames.length > 0 && (selMode ? <div className="selbar">
          <button className="btn ghost sm" onClick={exitSel}>{tr(lang,"Cancel","取消")}</button>
          <span className="selbar-n">{tr(lang,`${sel.size} selected`,`已选 ${sel.size}`)}</span>
          <button className="linkbtn" onClick={()=> setSel(sel.size===shown.length ? new Set() : new Set(shown.map(g=>g.id)))}>{sel.size===shown.length ? tr(lang,"Clear","取消全选") : tr(lang,"Select all","全选")}</button>
          <button className="btn sm selbar-del" disabled={!sel.size} onClick={doDelete}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg> {tr(lang,"Delete","删除")}{sel.size?` (${sel.size})`:""}</button>
        </div> : <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          {tabs.length > 1 && <div className="act-filters" style={{ margin:0 }}>
            {tabs.map(([k,en,zh]) => (<button key={k} className={"afilt"+(filt===k?" on":"")} onClick={()=>setFilt(k)}>{tr(lang,en,zh)} <em>{cnt(k)}</em></button>))}
          </div>}
          <button className="btn ghost sm" style={{ marginLeft:"auto" }} onClick={()=>setSelMode(true)}>{tr(lang,"Select","选择")}</button>
        </div>)}
      <div className="mygames">
        {shown.map(g => {
          const status = g.status || "draft"; const stt = GAME_STA[status];
          return (
            <div key={g.id} className="mgcard clickable" style={sel.has(g.id)?{ outline:"2.5px solid var(--green)", outlineOffset:2 }:undefined} onClick={()=> selMode ? toggleSel(g.id) : onOpen(g)}>
              <div className="mgart"><GamePreview kind={g.kind} colors={g.g} /><span className={"mgstatus act-badge " + stt.cls}>{status==="live" && <span className="b"></span>}{tr(lang, stt.en, stt.zh)}</span>{selMode && <span style={{ position:"absolute", top:10, right:10, zIndex:5, width:26, height:26, borderRadius:"50%", background: sel.has(g.id)?"var(--green)":"rgba(255,255,255,.92)", border: sel.has(g.id)?"none":"2px solid #fff", display:"grid", placeItems:"center", color:"#fff", fontWeight:800, fontSize:15, boxShadow:"0 2px 6px rgba(0,0,0,.25)" }}>{sel.has(g.id)?"✓":""}</span>}{!selMode && <div className="play"><span>{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></span></div>}</div>
              <div className="mgmeta">
                <div className="nm">{P(lang,g.name)}</div>
                <div className="st">{status==="live" ? tr(lang,"Live · scan to play (no prizes)","已上线 · 可扫码玩（纯玩、无奖品）") : tr(lang,"Not live yet","未上线")}</div>
                {!selMode && (status==="live"
                  ? <><button className="btn ghost sm inapp" style={{ width:"100%", marginTop:10 }} onClick={(e)=>{ e.stopPropagation(); setAppQr(true); }}><Ic.phone style={{ width:14, height:14 }}/> {tr(lang,"View in app","在 App 查看")}</button>
                      <button className="btn ghost sm" style={{ width:"100%", marginTop:8 }} onClick={(e)=>{ e.stopPropagation(); onOffline(g); }}>{tr(lang,"Take offline","下线")}</button></>
                  : <button className="btn primary sm" style={{ width:"100%", marginTop:10 }} onClick={(e)=>{ e.stopPropagation(); setPubGame(g); }}><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Publish","上线")}</button>)}
              </div>
            </div>
          );
        })}
      </div>
      {pubGame && <PublishGameModal game={pubGame} cardOnFile={cardOnFile} onSaveCard={onSaveCard} onClose={()=>setPubGame(null)} onConfirm={(patch)=>{ onPublish(pubGame, patch); }}/>}
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
    </div>
  );
}

function RedeemView({ vouchers = DEFAULT_VOUCHERS, onReport, hasLive, hasActs, onNewAct, onGoActivities, liveName, outlets = OUTLETS }) {
  const lang = useLang();
  const [code, setCode] = useState(""), [ok, setOk] = useState(false), [scanning, setScanning] = useState(false);
  // 当前门店：兑奖用自家设备时没有设备级门店绑定，这里手动选一次，记住即可。
  // 单店 → 自动是那家、不打扰；多店 → 顶部 sticky 选择器（软默认，不卡扫码），保证兑奖能归到店。
  const multiOutlet = outlets.length >= 2;
  const [curStore, setCurStore] = useState(() => (outlets.find(o=>o.primary) || outlets[0] || {}).id);
  const curName = P(lang, (outlets.find(o=>o.id===curStore) || outlets[0] || {name:{}}).name);
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
        ? tr(lang,"It's still being edited. Once it's live, customers play and win vouchers, then you scan to redeem here.","活动还在修改中。上线后客人才能玩、赢券，你才能在这里扫码兑奖。")
        : tr(lang,"Create an activity and publish it. Customers play, win a voucher and redeem; you scan it here, and that counts as an in-store redemption.","先建一个活动并上线。客人玩、赢券、到店，你在这里一扫，就算一次到店兑奖。")}
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
    <div className="app-body">
      <div className="redeem-storebar">
        <div className="rsb-l">
          <span className="rsb-ic"><Ic.store style={{ width:16, height:16 }}/></span>
          <div className="rsb-tx">
            <span className="rsb-lb">{tr(lang,"Redeeming at","当前兑奖门店")}</span>
            {multiOutlet
              ? <select className="rsb-sel" value={curStore} onChange={e=>setCurStore(e.target.value)}>{outlets.map(o=>(<option key={o.id} value={o.id}>{P(lang,o.name)}</option>))}</select>
              : <span className="rsb-one">{curName}</span>}
          </div>
        </div>
        <span className="rsb-note">{multiOutlet ? tr(lang,"Redemptions count toward this outlet. Switch it if you move counters.","兑奖会记到这家店；换到别的店请先切换。") : tr(lang,"Redemptions count toward this outlet.","兑奖会记到这家店。")}</span>
      </div>
      <div className="redeem-wrap">
      <div className="rd-left">
        <div className="redeem-card">
          <div className="ic-big"><Ic.target/></div>
          <h3>{tr(lang,"Redeem at the counter","到店兑奖")}</h3>
          <p>{tr(lang,"Scan the customer's prize QR, or type their code.","扫客人的奖品二维码，或手动输入奖品码。")}</p>
          {scanning
            ? <div className="scanbox"><div className="scanline"></div><Ic.qr style={{ width:56, height:56, color:"#fff", opacity:.55 }}/><div className="scan-t">{tr(lang,"Point at the customer's QR…","对准客人的二维码…")}</div></div>
            : <button className="btn primary lg scanbtn" onClick={scan}><Ic.qr style={{ width:20, height:20 }}/> {tr(lang,"Scan QR to redeem","扫码兑奖")}</button>}
          <div className="redeem-or"><span>{tr(lang,"or enter the code","或 输入奖品码")}</span></div>
          <div className="redeem-input"><input value={code} onChange={e=>setCode(e.target.value)} placeholder={tr(lang,"prize code","奖品码")} onKeyDown={e=>{ if(e.key==="Enter") submit(); }}/><button className="btn primary" onClick={submit}>{tr(lang,"Redeem","兑奖")}</button></div>
          {ok && <div className="redeem-ok"><Ic.check/> {tr(lang,"Redeemed, counted in store","兑奖成功，已计入到店兑奖")}</div>}
        </div>
      </div>

      <div className="rd-right">
        {/* 右栏=次要参考：今日/累计两个数 + 最近兑奖确认流 + 深入数据入口。待兑奖、券进度、各门店等分析都在「数据」页（操作页/分析页分离） */}
        <div className="rd-summary" style={{ marginTop:0 }}>
          <div className="rd-sum"><div className="n">{DEMO_METRICS.today.redeemed}</div><div className="l">{tr(lang,"redeemed today","今日兑奖")}</div></div>
          <div className="rd-sum"><div className="n">{totRedeemed}</div><div className="l">{tr(lang,"redeemed total","累计兑奖")}</div></div>
        </div>
        {reds.length > 0 && <div className="panel">
          <h4 style={{ fontSize:16, fontWeight:800, margin:"0 0 12px" }}>{tr(lang,"Recent redemptions","最近兑奖")}</h4>
          {reds.slice(0,4).map((f, i) => (<div key={i} className="feed-row"><span className="fi" style={{ background:f.bg, color:f.c }}>{Ic[f.ic] && Ic[f.ic]()}</span><span className="ft"><b>{P(lang,f.who)}</b> {P(lang,f.act)}</span><span className="fz">{P(lang,f.z)}</span></div>))}
        </div>}
        <button className="rd-datalink" onClick={onReport}>
          <span>{tr(lang,"By outlet & trends","各门店与趋势")}</span>
          <span className="rd-dl-cta">{tr(lang,"Full report","查看完整数据")} <Ic.arrow style={{ width:14, height:14 }}/></span>
        </button>
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
        <p className="pub-sub">{tr(lang,"One QR per outlet, so redemptions are attributed to the right shop. Fixed since first publish, safe to print.","每家门店各一个，兑奖才能算到对应门店头上。首次上线即固定，可放心打印。")}</p>
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
function ActivitiesView({ activities, outlets = [], onNew, onOpen, onDuplicate, onSetStatus, onDelete, initFilt }) {
  const lang = useLang();
  const [filt, setFilt] = useState(initFilt || "all");
  const [selMode, setSelMode] = useState(false);
  const [sel, setSel] = useState(()=>new Set());
  const toggleSel = (id)=>setSel(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const exitSel = ()=>{ setSelMode(false); setSel(new Set()); };
  const doDelete = ()=>{ if(!sel.size) return; if(window.confirm(tr(lang,`Delete ${sel.size} activity(ies)? This can't be undone.`,`确定删除选中的 ${sel.size} 个活动？删除后无法恢复。`))){ onDelete && onDelete([...sel]); exitSel(); } };
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
      {activities.length > 0 && (selMode ? <div className="selbar">
          <button className="btn ghost sm" onClick={exitSel}>{tr(lang,"Cancel","取消")}</button>
          <span className="selbar-n">{tr(lang,`${sel.size} selected`,`已选 ${sel.size}`)}</span>
          <button className="linkbtn" onClick={()=> setSel(sel.size===shown.length ? new Set() : new Set(shown.map(a=>a.id)))}>{sel.size===shown.length ? tr(lang,"Clear","取消全选") : tr(lang,"Select all","全选")}</button>
          <button className="btn sm selbar-del" disabled={!sel.size} onClick={doDelete}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg> {tr(lang,"Delete","删除")}{sel.size?` (${sel.size})`:""}</button>
        </div> : <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          {tabs.length > 1 && <div className="act-filters" style={{ margin:0 }}>
            {tabs.map(f => (
              <button key={f.k} className={"afilt"+(filt===f.k?" on":"")} onClick={()=>setFilt(f.k)}>
                {tr(lang,f.en,f.zh)} <em>{cnt(f)}</em>
              </button>
            ))}
          </div>}
          <button className="btn ghost sm" style={{ marginLeft:"auto" }} onClick={()=>setSelMode(true)}>{tr(lang,"Select","选择")}</button>
        </div>)}
      {activities.length === 0
        ? <EmptyState
            icon={<Ic.clipboard/>}
            title={tr(lang,"No activities yet","还没有活动")}
            sub={tr(lang,"An activity is a promotion that gets customers scanning, playing and coming in. Pick outlets, add a prize, link your game, then go live.","活动就是一场让客人扫码玩、赢奖进店的促销。选门店、放个奖、绑上游戏，就能上线。")}
            actLabel={"+ " + tr(lang,"New activity","新建活动")}
            onAct={onNew}
          />
        : <div className="mygames">
            {shown.map(act => {
              const tpl = TEMPLATES.find(t => t.id === act.gameId) || TEMPLATES[0];
              const isChal = (act.form||"longrun") === "challenge";
              const isDT = (act.form||"longrun") === "dt";
              const ls = isChal ? ladderStats(act.prizeLadder) : null;
              const dtDays = (act.duration&&act.duration.days)||7;
              const dtPrizes = isDT ? (medalStats(act.dailyLadder, dtDays).slotsTot + medalStats(act.grandLadder,1).slots) : 0;
              const ran = act.status==="live" || act.status==="offline";
              return (
                <div key={act.id} className="mgcard clickable" style={sel.has(act.id)?{ outline:"2.5px solid var(--green)", outlineOffset:2 }:undefined} onClick={()=> selMode ? toggleSel(act.id) : onOpen(act)}>
                  <div className="mgart"><GamePreview kind={tpl.kind} colors={tpl.g} /><span className={"mgstatus act-badge " + ACT_STA[act.status||"draft"].cls}>{(act.status||"draft")==="live" && <span className="b"></span>}{P(lang, ACT_STA[act.status||"draft"])}</span>{selMode && <span style={{ position:"absolute", top:10, right:10, zIndex:5, width:26, height:26, borderRadius:"50%", background: sel.has(act.id)?"var(--green)":"rgba(255,255,255,.92)", border: sel.has(act.id)?"none":"2px solid #fff", display:"grid", placeItems:"center", color:"#fff", fontWeight:800, fontSize:15, boxShadow:"0 2px 6px rgba(0,0,0,.25)" }}>{sel.has(act.id)?"✓":""}</span>}{!selMode && <div className="play"><span>{tr(lang,"Open & edit","打开编辑")} <Ic.arrow style={{ width:14, height:14 }}/></span></div>}</div>
                  <div className="mgmeta">
                    <div className="nm">{isChal && <span className="chal-badge"><Ic.trophy style={{ width:11, height:11 }}/>{tr(lang,"Challenge","限时赛")}</span>}{isDT && <span className="chal-badge"><Ic.trophy style={{ width:11, height:11 }}/>{tr(lang,"Tournament","锦标赛")}</span>}{P(lang, act.name)}</div>
                    {isDT
                      ? (()=>{ const isLive=act.status==="live", isOff=act.status==="offline"; return <>
                          {isLive && <div className="chal-when next"><span className="cw-dot"></span>{tr(lang,`Running · ${dtDays}-day tournament`,`进行中 · ${dtDays} 天锦标赛`)}</div>}
                          {isOff && (act.stat ? <div className="act-stat"><b>{act.stat.players}</b> {tr(lang,"played","人参赛")} · <b>{act.stat.walkins}</b> {tr(lang,"redeemed","到店兑奖")}</div> : <div className="chal-when">{tr(lang,"Ended","已结束")}</div>)}
                          {!ran && <div className="st">{tr(lang,`${dtDays} days`,`${dtDays} 天`)} · {dtPrizes} {tr(lang,"prizes","个奖")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>}
                        </>; })()
                      : isChal
                      ? (()=>{ const isLive=act.status==="live", isOff=act.status==="offline"; const ns=isLive?nextSession(act.schedule):null; return <>
                          <div className={"chal-when"+(isLive&&ns?" next":"")}>{isLive&&ns && <span className="cw-dot"></span>}{isOff ? tr(lang,"Ended","已结束") : isLive ? (ns ? tr(lang,"Next","下一场")+" · "+nextLabel(act.schedule,lang) : tr(lang,"Finished","已跑完")) : schedSummary(act.schedule,lang)}</div>
                          {isOff && act.stat && <div className="act-stat"><b>{act.stat.players}</b> {tr(lang,"played","人参赛")} · <b>{act.stat.walkins}</b> {tr(lang,"redeemed","到店兑奖")}</div>}
                          {!ran && <div className="st">{ls.slots} {tr(lang,"prizes","个奖")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>}
                        </>; })()
                      : <>
                          {act.stat && ran
                            ? <div className="act-stat"><b>{act.stat.walkins}</b> {tr(lang,"redeemed","到店兑奖")}<span style={{ color:"var(--muted)", fontWeight:400 }}>{tr(lang,` (incl. ${act.stat.newCust} new)`,`（含 ${act.stat.newCust} 新客）`)}</span></div>
                            : <div className="st">{(act.vouchers[0]&&act.vouchers[0].qty)||0} {tr(lang,"vouchers","张券")} · {act.outletIds.length} {tr(lang,"outlets","家门店")}</div>}
                          {act.status==="live" && (()=>{ const v=act.vouchers&&act.vouchers[0]; const qty=(v&&+v.qty)||0, issued=(v&&+v.awarded)||0, rem=Math.max(0,qty-issued), pct=qty?rem/qty:1; if(!qty) return null; return (
                            <div className={"stockrow"+(rem===0?" out":pct<=0.15?" low":"")}>
                              <div className="stock-bar"><i style={{ width:(pct*100)+"%" }}></i></div>
                              <span className="stock-t">{rem===0 ? tr(lang,"All vouchers given out, open to top up","券已发完，点开可补券") : tr(lang,`${issued} given · ${rem} left`,`送 ${issued} · 剩 ${rem}`)}</span>
                            </div>); })()}
                        </>}
                    <div className="mgfoot" style={selMode?{ pointerEvents:"none", opacity:.4 }:undefined}>
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
  // 上线活动计 MAU → 首次上线(无卡)先过卡门；有卡直接上线（不重复要卡）
  const confirm = () => { if (!cardOnFile) { setStep("card"); } else { onConfirm(); setStep("done"); } };
  const onCardSaved = (c) => { onSaveCard && onSaveCard(c); onConfirm(); setStep("done"); };
  if (step === "card") return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal card-gate-modal" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <CardForm lang={lang} onSave={onCardSaved} />
      </div>
    </div>,
    document.body
  );
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
        <p className="pub-sub">{(activity.form||"longrun")==="dt" ? tr(lang,"Once live, customers play daily to climb the leaderboard and win by rank.","上线后客人即可每天扫码冲榜、按名次赢奖。") : (activity.form||"longrun")==="challenge" ? tr(lang,"Once live, customers can join the race and win by rank.","上线后客人即可扫码参赛、按名次赢奖。") : tr(lang,"Once live, customers can play and win vouchers right away.","上线后客人即可扫码玩、赢券进店。")}</p>
        <div className="pub-confirm-name">{P(lang, activity.name)}</div>
        <div className="pub-actions">
          <button className="btn ghost lg" onClick={onClose}>{tr(lang,"Cancel","取消")}</button>
          <button className="btn primary lg" onClick={confirm}><Ic.check style={{ width:18, height:18 }}/> {cardOnFile ? tr(lang,"Confirm & publish","确认上线") : tr(lang,"Next: add card & go live","下一步：绑卡并上线")}</button>
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
  { from:1,  to:1,   prize:{ type:"cash",     denom:5, count:12 } },
  { from:2,  to:2,   prize:{ type:"cash",     denom:5, count:8  } },
  { from:3,  to:3,   prize:{ type:"cash",     denom:5, count:4  } },
  { from:4,  to:6,   prize:{ type:"item",     label:"芒果西米露 (M)" } },
  { from:7,  to:10,  prize:{ type:"item",     label:"龙井拿铁 (M)" } },
  { from:11, to:20,  prize:{ type:"discount", pct:20 } },
  { from:21, to:30,  prize:{ type:"discount", pct:10 } },
  { from:31, to:100, prize:{ type:"discount", pct:5  } },
];
// 只加总"可精确的现金奖" + 名额总数；折扣/商品/自定义不折现(见 P1 三体：不臆测总价)
// 现金奖 = 商家自定「面额 × 张数」（Kash 非固定面额，商家送什么、拆几张都自己定）→ 总额 = 面额×张数
const cashTotal = (p) => (p && p.type === "cash") ? (+p.denom||0) * (+p.count||0) : 0;
function ladderStats(ladder) {
  let slots = 0, cash = 0, cashVouchers = 0;
  (ladder||[]).forEach(r => { const n = Math.max(0, (+r.to||0) - (+r.from||0) + 1); slots += n; if (r.prize && r.prize.type === "cash") { cash += n * cashTotal(r.prize); cashVouchers += n * (+r.prize.count||0); } });
  return { slots, cash, cashVouchers };
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
  if (p.label) return p.label;
  if (p.type === "cash") return `S$${cashTotal(p)}`;
  if (p.type === "discount") return tr(lang, `${p.pct||0}% off`, `${p.pct||0}% 券`);
  return "";
}
const PRIZE_TYPES = [
  { k:"cash",     en:"Cash voucher", zh:"现金券" },
  { k:"item",     en:"Free item",    zh:"免费商品" },
  { k:"discount", en:"% discount",   zh:"折扣券" },
  { k:"custom",   en:"Custom",       zh:"自定义" },
];
function prizeLabel(p, lang) {
  if (!p) return "";
  if (p.label) return p.label;
  if (p.type === "cash")     return tr(lang, `S$${cashTotal(p)} cash`, `现金券 S$${cashTotal(p)}`);
  if (p.type === "discount") return tr(lang, `${p.pct||0}% off`, `${p.pct||0}% 折扣券`);
  return tr(lang,"Prize","奖品");
}

// 建活动第一步：选形态(带介绍帮用户选)
function NewActivityPicker({ onPick, onClose }) {
  const lang = useLang();
  const forms = [
    { k:"longrun", ic:<Ic.clipboard/>, tag:{en:"Slow & steady",zh:"细水长流"}, nm:{en:"Long-run activity",zh:"长期活动"},
      line:{en:"Customers play anytime and win a voucher when they hit the target.",zh:"这段时间客人随时扫码玩，达标就赢券。"},
      fit:{en:"Daily traffic · clear stock · new-item trials",zh:"日常引流 · 清库存 · 新品试吃"},
      eg:{en:"Play within 2 weeks, win a voucher, redeem in store",zh:"两周内玩游戏得券，到店兑"} },
    { k:"dt", ic:<Ic.trophy/>, tag:{en:"Keep them coming",zh:"天天来"}, nm:{en:"Daily tournament",zh:"每日锦标赛"},
      line:{en:"Players come back every day to climb the leaderboard, winning a small prize daily and a big prize at the end.",zh:"连续几天，客人每天回来冲榜赢小奖，最后一天按总分赢大奖。"},
      fit:{en:"Repeat visits · build regulars · multi-day buzz",zh:"促复购 · 养回头客 · 多日热度"},
      eg:{en:"7 days · daily top-3 win · grand prize by total score",zh:"7 天 · 每天前 3 名赢 · 累积总分赢大奖"} },
  ];
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="na-pick" onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"New activity","新建活动")}</h3>
        <p className="pub-sub">{tr(lang,"Two ways to bring customers in, pick one.","两种把客人带进店的方式，选一种。")}</p>
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
  const { slots, cash, cashVouchers } = ladderStats(rows);
  const updPrize = (i,patch) => setLadder(rows.map((r,j)=> j===i ? {...r, prize:{...r.prize, ...patch}} : r));
  const updRank  = (i,patch) => setLadder(rows.map((r,j)=> j===i ? {...r, ...patch} : r));
  const addRow = () => { const last = rows[rows.length-1]; const from = last ? (+last.to||0)+1 : 1; setLadder([...rows, { from, to:from, prize:{ type:"discount", pct:10 } }]); };
  const dupRow = (i) => { const r = rows[i]; const span = (+r.to||0)-(+r.from||0); const from = (+r.to||0)+1; setLadder([...rows.slice(0,i+1), { from, to:from+span, prize:{...r.prize} }, ...rows.slice(i+1)]); };
  const delRow = (i) => setLadder(rows.filter((_,j)=>j!==i));
  const useSample = () => setLadder(SAMPLE_LADDER.map(r=>({...r, prize:{...r.prize}})));
  const onImg = (i,e) => { const f=e.target.files&&e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>updPrize(i,{img:rd.result}); rd.readAsDataURL(f); };
  const pickCodes = (i) => { const inp=document.createElement("input"); inp.type="file"; inp.accept="image/*,.csv,.zip,.xlsx,.pdf"; inp.onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(f) updPrize(i,{codeSource:"custom", codeFile:f.name}); }; inp.click(); };
  return (
    <div className="panel" style={{ marginTop:16 }}>
      <div className="ladder-head"><h3 style={{ margin:0 }}>{tr(lang,"Prize ladder","阶梯奖池")}</h3><button className="linkbtn" onClick={useSample}>{tr(lang,"Use sample ladder","套用示例奖池")}</button></div>
      <p className="ph-sub">{tr(lang,"Higher rank, better prize. Name each prize, add a photo, and let us auto-generate codes or upload your own.","名次越高奖越好。给每个奖品起名、配图，券码可系统自动生成或上传自有码。")}</p>
      <div className="cost-bar">
        <span className="cost-slots"><b>{slots}</b> {tr(lang,"prizes","个奖")}</span>
        {cash>0 && <span className="cost-cash">· {tr(lang,"cash total","现金奖合计")} <b>S${cash}</b>{cashVouchers>0 && tr(lang,` (${cashVouchers} vouchers)`,`（${cashVouchers} 张）`)}</span>}
        <div className="cost-note">{tr(lang,"Awarded by actual rank; empty ranks pay nothing. Split cash into several vouchers to drive repeat visits.","按实际排名发奖，没人拿到的名次不发、也不花钱。现金奖可以拆成好几张小券（每次到店用一张，多来几次）。")}</div>
      </div>
      <div className="ladder-rows">
        {rows.map((r,i) => { const total = cashTotal(r.prize); return (
          <div className="lcard" key={i}>
            <div className="lrow-top">
              <div className="lrank">{tr(lang,"Rank","第")}<input type="number" min="1" value={r.from} onChange={e=>updRank(i,{from:+e.target.value})}/><span>–</span><input type="number" min="1" value={r.to} onChange={e=>updRank(i,{to:+e.target.value})}/>{tr(lang,"","名")}</div>
              <div className="lprize">
                <select value={r.prize.type} onChange={e=>updPrize(i,{ type:e.target.value })}>{PRIZE_TYPES.map(pt=>(<option key={pt.k} value={pt.k}>{tr(lang,pt.en,pt.zh)}</option>))}</select>
                {r.prize.type==="cash"     && <div className="pfield pcash">{tr(lang,"S$","S$")}<input type="number" min="0" value={r.prize.denom||""} onChange={e=>updPrize(i,{denom:+e.target.value})}/><span className="pcash-x">×</span><input type="number" min="1" value={r.prize.count||""} onChange={e=>updPrize(i,{count:+e.target.value})}/>{tr(lang,"vouchers","张")}{total>0 && <span className="cash-split">= S${total}</span>}</div>}
                {r.prize.type==="discount" && <div className="pfield"><input type="number" min="0" max="100" value={r.prize.pct||""} onChange={e=>updPrize(i,{pct:+e.target.value})}/>%</div>}
              </div>
              <div className="lact">
                <button type="button" title={tr(lang,"Duplicate","复制上一档")} onClick={()=>dupRow(i)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                <button type="button" title={tr(lang,"Remove","删除")} onClick={()=>delRow(i)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
            </div>
            <div className="lrow-detail">
              <input className="pname" placeholder={r.prize.type==="item"?tr(lang,"Item name","商品名称") : r.prize.type==="custom"?tr(lang,"Prize name","奖品名称") : tr(lang,"Prize name (optional)","奖品名称（选填）")} value={r.prize.label||""} onChange={e=>updPrize(i,{label:e.target.value})}/>
              <label className="pimg" title={tr(lang,"Prize photo","奖品配图")}>{r.prize.img ? <img src={r.prize.img} alt=""/> : <Ic.image style={{ width:16, height:16 }}/>}<input type="file" accept="image/*" hidden onChange={e=>onImg(i,e)}/></label>
              <div className="pcode-mini">
                {(r.prize.codeSource||"auto")!=="custom"
                  ? <><span className="pc-status">{tr(lang,"Codes: system-generated","券码 系统自动生成")}</span><button type="button" className="pc-upload" onClick={()=>pickCodes(i)}>{tr(lang,"Upload own","上传自有码")}</button></>
                  : <><span className="pc-status ok">✓ {r.prize.codeFile||tr(lang,"custom codes","自有码")}</span><button type="button" className="pc-upload" onClick={()=>updPrize(i,{ codeSource:"auto", codeFile:null })}>{tr(lang,"Use auto","改回自动")}</button></>}
              </div>
            </div>
          </div>
        ); })}
      </div>
      <button className="btn ghost sm" style={{ marginTop:12 }} onClick={addRow}><span style={{ fontSize:16, lineHeight:1 }}>+</span> {tr(lang,"Add a tier","加一档")}</button>
    </div>
  );
}

/* ===== DT 每日锦标赛(Daily Tournament)：第三种活动形态（替代旧 challenge，旧版存支线 kc-challenge） =====
   机制：品牌设时长(天) → 客人连玩几天 → 每天按当日名次发「每日奖」→ 最后一天按累积总分发「末日大奖」。
   奖分金/银/铜/铁四档奖牌，商家填「前 N 名」+ 奖励；铁档可选「前N名」或「所有有分的人」保底。每日/末日两梯独立配置。 */
const DT_MEDALS = [
  { k:"gold",   en:"Gold",   zh:"金牌", ic:"🥇", pill:"#FBF0CE", txt:"#7A5800" },
  { k:"silver", en:"Silver", zh:"银牌", ic:"🥈", pill:"#EAEEF1", txt:"#566571" },
  { k:"bronze", en:"Bronze", zh:"铜牌", ic:"🥉", pill:"#F2E1D2", txt:"#8A4A1E" },
  { k:"iron",   en:"Iron",   zh:"铁牌", ic:"🛡️", pill:"#E6E9EC", txt:"#4A555F" },
];
const DT_MEDAL = (k) => DT_MEDALS.find(m=>m.k===k) || DT_MEDALS[0];
// 每日奖示例：金3/银10/铜30（不含铁——每天给全员=券洪水）
const DT_DAILY_SAMPLE = [
  { medal:"gold",   count:3,  prize:{ type:"item",     label:"买一送一券" } },
  { medal:"silver", count:10, prize:{ type:"discount", pct:20 } },
  { medal:"bronze", count:30, prize:{ type:"item",     label:"免费小食" } },
];
// 末日大奖示例：金1/银5/铜20 + 铁档人人有份保底
const DT_GRAND_SAMPLE = [
  { medal:"gold",   count:1,  prize:{ type:"custom",   label:"全月免单券" } },
  { medal:"silver", count:5,  prize:{ type:"cash",     denom:20, count:1 } },
  { medal:"bronze", count:20, prize:{ type:"item",     label:"买一送一券" } },
  { medal:"iron",   mode:"all", prize:{ type:"item",   label:"纪念小食券" } },
];
// 成本统计：只加总可精确的现金奖 + 名额（铁档"人人有份"不计数）；每日梯 ×天数=全程
function medalStats(ladder, dayMult) {
  let slots=0, cash=0, hasAll=false;
  (ladder||[]).forEach(r => {
    if (r.medal==="iron" && r.mode==="all") { hasAll=true; return; }
    const n = Math.max(0, +r.count||0); slots += n;
    if (r.prize && r.prize.type==="cash") cash += n * cashTotal(r.prize);
  });
  const mult = dayMult || 1;
  return { slots, cash, hasAll, slotsTot:slots*mult, cashTot:cash*mult };
}

function DurationEditor({ duration, setDuration }) {
  const lang = useLang();
  const d = duration || { days:7, startDate:"" };
  const presets = [3,7,14];
  const isCustom = !presets.includes(d.days);
  const set = (patch) => setDuration({ ...d, ...patch });
  // 预计结束日期 = 开始日期 + (天数-1)
  const endTxt = (() => {
    if (!d.startDate) return tr(lang,"end date shows once you pick a start","填开始日期后算出结束日");
    const e = new Date(d.startDate); e.setDate(e.getDate() + (d.days - 1));
    return lang==="zh" ? `预计 ${e.getMonth()+1} 月 ${e.getDate()} 日结束` : `Ends ~${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][e.getMonth()]} ${e.getDate()}`;
  })();
  return (
    <div className="panel dt-anchor" style={{ marginTop:16 }}>
      <div className="ladder-head"><h3 style={{ margin:0 }}>{tr(lang,"Tournament length","锦标赛时长")}</h3></div>
      <p className="ph-sub" style={{ marginTop:2, marginBottom:2 }}>{tr(lang,"Players compete over several days. Each day's rank wins a daily prize; total score wins the grand finale on the last day.","客人连玩几天冲分：每天按当日名次发「每日奖」，最后一天按累积总分发「总冠军大奖」。")}</p>
      <div className="dt-days">
        {presets.map(n => (<button key={n} type="button" className={"dt-day"+(d.days===n?" on":"")} onClick={()=>set({ days:n })}>{tr(lang,`${n} days`,`${n} 天`)}</button>))}
        <button type="button" className={"dt-day"+(isCustom?" on":"")} onClick={()=>set({ days:isCustom?d.days:21 })}>{tr(lang,"Custom","自定天数")}</button>
        {isCustom && <input type="number" min="2" className="dt-daynum" value={d.days} onChange={e=>set({ days:Math.max(2, +e.target.value||2) })}/>}
      </div>
      <div className="dt-daterow">
        <div className="field" style={{ margin:0 }}><label>{tr(lang,"Start date","开始日期")}</label><input type="date" value={d.startDate||""} onChange={e=>set({ startDate:e.target.value })}/></div>
        <span className={"dt-endtxt"+(d.startDate?"":" ph")}>{endTxt}</span>
      </div>
    </div>
  );
}

function MedalLadderEditor({ kind, ladder, setLadder, days }) {
  const lang = useLang();
  const rows = ladder || [];
  const grand = kind === "grand";
  const updPrize = (i,patch) => setLadder(rows.map((r,j)=> j===i ? {...r, prize:{...r.prize, ...patch}} : r));
  const updRow   = (i,patch) => setLadder(rows.map((r,j)=> j===i ? {...r, ...patch} : r));
  const usedMedals = rows.map(r=>r.medal);
  const nextMedal = DT_MEDALS.find(m => !usedMedals.includes(m.k));
  const addRow = () => { if(!nextMedal) return; const isIron = nextMedal.k==="iron"; setLadder([...rows, isIron ? { medal:"iron", mode:"all", prize:{ type:"item", label:"" } } : { medal:nextMedal.k, count:5, prize:{ type:"discount", pct:10 } }]); };
  const delRow = (i) => setLadder(rows.filter((_,j)=>j!==i));
  const useSample = () => setLadder((grand?DT_GRAND_SAMPLE:DT_DAILY_SAMPLE).map(r=>({...r, prize:{...r.prize}})));
  const onImg = (i,e) => { const f=e.target.files&&e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>updPrize(i,{img:rd.result}); rd.readAsDataURL(f); };
  const pickCodes = (i) => { const inp=document.createElement("input"); inp.type="file"; inp.accept="image/*,.csv,.zip,.xlsx,.pdf"; inp.onchange=e=>{ const f=e.target.files&&e.target.files[0]; if(f) updPrize(i,{codeSource:"custom", codeFile:f.name}); }; inp.click(); };
  return (
    <div className={"panel "+(grand?"ml-grand":"ml-daily")} style={{ marginTop:16 }}>
      <div className="ladder-head">
        <h3 style={{ margin:0, display:"flex", alignItems:"center", gap:8 }}>{grand?tr(lang,"Grand finale prizes","总冠军大奖"):tr(lang,"Daily prizes","每日奖")}<span className={"dt-when "+(grand?"grand":"daily")}>{grand?tr(lang,"awarded once","最后一天发一次"):tr(lang,"awarded daily","每天发")}</span></h3>
        <button className="linkbtn" onClick={useSample}>{tr(lang,"Use sample","套用示例")}</button>
      </div>
      {rows.length > 0 && <p className="ph-sub">{grand
        ? tr(lang,"Awarded once on the last day by total score.","最后一天按累积总分发一次。")
        : tr(lang,"Awarded daily by that day's rank.","每天按当日名次发。")}</p>}
      {rows.length === 0
        ? <div className="ml-empty">
            <div className="ml-empty-ic"><Ic.gift style={{ width:20, height:20 }}/></div>
            <div className="ml-empty-t">{grand ? tr(lang,"No grand prize yet","还没设总冠军大奖") : tr(lang,"Daily prizes (optional)","每日奖（可选）")}</div>
            <p>{grand
              ? tr(lang,"Set at least one tier, awarded on the last day by total score.","至少设一档，最后一天按累积总分发。")
              : tr(lang,"With daily prizes, each day settles by that day's rank; the final day settles again by cumulative rank.","设了每日奖，每天按当天名次结算一次；最后一天再按累计名次结算总冠军大奖。")}</p>
            <button className="btn ghost sm" onClick={addRow}><span style={{ fontSize:16, lineHeight:1 }}>+</span> {grand ? tr(lang,"Add a grand prize","加一个总冠军奖") : tr(lang,"Add a daily prize","加一个每日奖")}</button>
          </div>
        : <div className="ladder-rows">
        {rows.map((r,i) => { const m=DT_MEDAL(r.medal); const iron=r.medal==="iron"; const total=cashTotal(r.prize); const req=(iron&&r.mode==="all")?null:(r.count||0)*(grand?1:days); return (
          <div className="lcard" key={i}>
            <div className="lrow-top">
              <span className="medal-pill" style={{ background:m.pill, color:m.txt }}>{m.ic} {tr(lang,m.en,m.zh)}</span>
              {iron && <div className="iron-seg">
                <button type="button" className={r.mode!=="all"?"on":""} onClick={()=>updRow(i,{ mode:"count", count:r.count||10 })}>{tr(lang,"Top N","前 N 名")}</button>
                <button type="button" className={r.mode==="all"?"on":""} onClick={()=>updRow(i,{ mode:"all" })}>{tr(lang,"Everyone scored","所有有分的人")}</button>
              </div>}
              {(!iron || r.mode!=="all") && <div className="lrank mlrank">{tr(lang,"Top","前")}<input type="number" min="1" value={r.count||""} onChange={e=>updRow(i,{count:+e.target.value})}/>{tr(lang,"","名")}</div>}
              <div className="lprize">
                <select value={r.prize.type} onChange={e=>updPrize(i,{ type:e.target.value })}>{PRIZE_TYPES.map(pt=>(<option key={pt.k} value={pt.k}>{tr(lang,pt.en,pt.zh)}</option>))}</select>
                {r.prize.type==="cash"     && <div className="pfield pcash">{tr(lang,"S$","S$")}<input type="number" min="0" value={r.prize.denom||""} onChange={e=>updPrize(i,{denom:+e.target.value})}/><span className="pcash-x">×</span><input type="number" min="1" value={r.prize.count||""} onChange={e=>updPrize(i,{count:+e.target.value})}/>{tr(lang,"vouchers","张")}{total>0 && <span className="cash-split">= S${total}</span>}</div>}
                {r.prize.type==="discount" && <div className="pfield"><input type="number" min="0" max="100" value={r.prize.pct||""} onChange={e=>updPrize(i,{pct:+e.target.value})}/>%</div>}
                {(r.prize.type==="item"||r.prize.type==="custom") && <div className="pfield pf-unit">{tr(lang,"Unit S$","单价 S$")}<input type="number" min="0" placeholder={tr(lang,"opt.","选填")} value={r.prize.unitPrice==null?"":r.prize.unitPrice} onChange={e=>updPrize(i,{unitPrice:e.target.value===""?null:+e.target.value})}/></div>}
              </div>
              <div className="lact">
                <button type="button" title={tr(lang,"Remove","删除")} onClick={()=>delRow(i)}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
            </div>
            {iron && r.mode==="all" && <div className="ml-note"><Ic.shield style={{ width:13, height:13 }}/>{tr(lang,"Given to everyone who played and scored. Headcount depends on turnout, could be many.","发给所有玩过、拿到分数的人；人数由到场决定，可能很多、成本不固定。")}</div>}
            <div className="lrow-detail">
              <input className="pname" placeholder={r.prize.type==="item"?tr(lang,"Item name","商品名称") : r.prize.type==="custom"?tr(lang,"Prize name","奖品名称") : tr(lang,"Prize name (optional)","奖品名称（选填）")} value={r.prize.label||""} onChange={e=>updPrize(i,{label:e.target.value})}/>
              <label className="pimg" title={tr(lang,"Prize photo","奖品配图")}>{r.prize.img ? <img src={r.prize.img} alt=""/> : <Ic.image style={{ width:16, height:16 }}/>}<input type="file" accept="image/*" hidden onChange={e=>onImg(i,e)}/></label>
              <div className="pcode-mini">
                {(r.prize.codeSource||"auto")!=="custom"
                  ? <><span className="pc-status">{tr(lang,"Codes: system-generated","券码 系统自动生成")}</span><button type="button" className="pc-upload" onClick={()=>pickCodes(i)}>{tr(lang,"Upload own","上传自有码")}</button></>
                  : <><span className="pc-status ok">✓ {r.prize.codeFile||tr(lang,"custom codes","自有码")}</span><button type="button" className="pc-upload" onClick={()=>updPrize(i,{ codeSource:"auto", codeFile:null })}>{tr(lang,"Use auto","改回自动")}</button></>}
              </div>
            </div>
            {r.prize.codeSource==="custom" && <div className="ml-note pc-req">{req==null
              ? tr(lang,"One image per voucher. Iron 'everyone' has no fixed number, upload enough for the turnout you expect; a ZIP works too.","一张券配一个二维码/图；铁档「人人有份」人数不定，按预计到场量多传些，多张可打包成 ZIP 一次传。")
              : tr(lang,`One image per voucher, at least ${req}${grand?"":` (${r.count}/day × ${days} days)`}. Zip multiple into one upload.`,`一张券配一个二维码/图，需上传 ≥ ${req} 个${grand?"":`（每天 ${r.count} 名 × ${days} 天）`}；多张可打包成 ZIP 一次传。`)}</div>}
          </div>
        ); })}
      </div>}
      {rows.length > 0 && nextMedal && <button className="btn ghost sm" style={{ marginTop:12 }} onClick={addRow}><span style={{ fontSize:16, lineHeight:1 }}>+</span> {tr(lang,`Add ${nextMedal.en} tier`,`加一个奖牌`)}</button>}
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
  const isDT = (activity.form||"longrun") === "dt";
  const onLogo = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => upd("logo", rd.result); rd.readAsDataURL(f); };
  const curTier = (WIN_TIERS.find(t=>t.score===(activity.winScore||1000)) || WIN_TIERS[1]).k;
  // 活动直接上线（无审批）：draft/offline —上线→ live；live —下线→ offline
  const actOutlets = outlets.filter(o => (activity.outletIds||[]).includes(o.id));
  const dlQR = (label) => { const c=document.createElement("canvas"); c.width=200; c.height=200; const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,200,200); ctx.fillStyle="#0B1220"; ctx.font="bold 22px sans-serif"; ctx.textAlign="center"; ctx.fillText("QR CODE",100,88); ctx.font="12px sans-serif"; ctx.fillText(label,100,116); const a=document.createElement("a"); a.download="qr-"+label+".png"; a.href=c.toDataURL(); a.click(); };
  return (
    <div className="app-body" style={{ maxWidth:820 }}>
      {live && <div className="act-statusbar"><span className="act-note" style={{ color:"var(--green-d)" }}><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Now live. Customers can play.","已上线，客人现在就能扫码玩。")}</span><button className="btn ghost sm" style={{ marginLeft:"auto" }} onClick={()=>setAppQr(true)}><Ic.phone style={{ width:13, height:13 }}/> {tr(lang,"View in app","在 App 查看")}</button></div>}
      <div className="panel">
        <h3>{tr(lang,"Activity name","活动名称")}</h3>
        <div className="act-idrow">
          <div className="field" style={{ flex:1, margin:0 }}><input value={P(lang, activity.name)} onChange={e => upd("name",{en:e.target.value,zh:e.target.value})} placeholder={isDT ? tr(lang,"e.g. 7-Day Score Showdown","例如：七天冲分赛") : isChal ? tr(lang,"e.g. Friday Night Challenge","例如：周五夜赛") : tr(lang,"e.g. Weekend Coffee Promo","例如：周末咖啡促销")} /></div>
          <label className="act-logo-up" title={tr(lang,"Brand logo","品牌 Logo")}>
            {activity.logo ? <img src={activity.logo} alt=""/> : <><Ic.image style={{ width:17, height:17 }}/><span>Logo</span></>}
            <input type="file" accept="image/*" hidden onChange={onLogo}/>
          </label>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{(isChal||isDT) ? tr(lang,"Brand logo shows on the poster, app card, and leaderboard. Leave empty to use the game's brand.","品牌 Logo 会显示在活动海报、App 卡片和排行榜上。留空则沿用所选游戏的品牌。") : tr(lang,"Brand logo shows on the poster and app card. Leave empty to use the game's brand.","品牌 Logo 会显示在活动海报和 App 卡片上。留空则沿用所选游戏的品牌。")}</p>
        {!isChal && !isDT && <><div style={{ display:"flex", gap:12, marginTop:14 }}>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"Start date","开始日期")}</label><input type="date" value={activity.startDate||""} onChange={e=>upd("startDate",e.target.value)}/></div>
          <div className="field" style={{ flex:1, margin:0 }}><label>{tr(lang,"End date","结束日期")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><input type="date" value={activity.endDate||""} onChange={e=>upd("endDate",e.target.value)}/></div>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Leave the end date empty to run indefinitely; take it offline anytime.","结束日期留空 = 长期有效，随时可手动下线。")}</p></>}
      </div>
      {isDT
        ? (()=>{ const _days=(activity.duration&&activity.duration.days)||7; const dS=medalStats(activity.dailyLadder,_days), gS=medalStats(activity.grandLadder,1); const _prizes=dS.slotsTot+gS.slots; const _cash=dS.cashTot+gS.cashTot;
            const prizeVal=(arr,mult)=>(arr||[]).reduce((s,r)=>{ if(r.medal==="iron"&&r.mode==="all") return s; const n=(r.count||0)*(mult||1); const p=r.prize||{}; if(p.type==="cash") return s+n*((+p.denom||0)*(+p.count||0)); if((p.type==="item"||p.type==="custom")&&p.unitPrice!=null) return s+n*(+p.unitPrice||0); return s; },0);
            const _auto=prizeVal(activity.dailyLadder,_days)+prizeVal(activity.grandLadder,1); const _est=activity.estCost!=null?activity.estCost:_auto; return <>
            <DurationEditor duration={activity.duration} setDuration={d => upd("duration", d)} />
            <MedalLadderEditor kind="daily" ladder={activity.dailyLadder} setLadder={l => upd("dailyLadder", l)} days={_days} />
            <MedalLadderEditor kind="grand" ladder={activity.grandLadder} setLadder={l => upd("grandLadder", l)} days={_days} />
            <div className="dt-costsum">
              <div className="cs-txt"><div className="cs-count"><b>{_prizes}</b> {tr(lang,"prizes","份奖")}<span className="cs-days"> · {_days} {tr(lang,"days","天")}</span></div><div className="cs-sub">{_cash>0?`${tr(lang,"cash","现金")} S$${_cash} · `:""}{tr(lang,"unclaimed ranks cost nothing","空名次不发不花钱")}{gS.hasAll?tr(lang," · Iron for all"," · 铁牌人人有份"):""}</div></div>
              <div className="cs-est"><label>{tr(lang,"Est. total cost","预估总成本")}</label><div className="cs-inp"><span>S$</span><input type="number" min="0" value={_est} onChange={e=>upd("estCost", e.target.value===""?null:+e.target.value)}/></div></div>
            </div>
          </>; })()
        : isChal
        ? <><ScheduleEditor schedule={activity.schedule} setSchedule={s => upd("schedule", s)} />
            <PrizeLadderEditor ladder={activity.prizeLadder} setLadder={l => upd("prizeLadder", l)} /></>
        : <div className="panel" style={{ marginTop:16 }}>
            <VoucherEditor vouchers={activity.vouchers} setVouchers={vs => upd("vouchers", vs)} showStock />
          </div>}
      <div className="panel" style={{ marginTop:16 }}>
        <div className="ladder-head"><h3 style={{ margin:0 }}>{tr(lang,"Game","游戏")}</h3><button className="btn primary sm" onClick={onNewGame} style={{ padding:"8px 14px", fontSize:13 }}><span style={{ fontSize:15, lineHeight:1, marginRight:2 }}>+</span> {tr(lang,"New game","新建游戏")}</button></div>
        <p className="ph-sub">{myGames.length ? tr(lang,"Pick which game to use for this activity.","选一个游戏用在这个活动上。") : tr(lang,"You don't have a game yet, create one first.","你还没有游戏，先建一个。")}</p>
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
        </div>
        {!isChal && !isDT && <><div className="win-cond">
          <span className="wc-lbl">{tr(lang,"How hard to win","赢奖难度")}</span>
          <div className="wc-tiers">
            {WIN_TIERS.map(t => (
              <button key={t.k} type="button" className={"wc-tier"+(curTier===t.k?" on":"")} onClick={()=>upd("winScore",t.score)}>
                <b>{tr(lang,t.en,t.zh)}</b><span>{P(lang,t.win)}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Harder = fewer people win and vouchers last longer; easier = more people win and walk in faster. You decide.","越难，赢的人越少、券发得越慢；越易，越多人赢、越快把客人带到店。你自己定。")}</p></>}
        {isChal && <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Players race for a high score in this game, and ranking decides the prizes above.","玩家在这个游戏里冲高分，排名决定上面的奖池。")}</p>}
        {isDT && <p className="ph-sub" style={{ marginTop:8 }}>{tr(lang,"Players compete for a high score, and the rankings decide the prizes above.","玩家玩这个游戏冲分，排名决定上面的奖。")}</p>}
      </div>
      {isChal && <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Race rules","赛制")}</h3>
        <p className="ph-sub" style={{ marginTop:2 }}><Ic.check style={{ width:14, height:14, verticalAlign:"-2px", marginRight:5, color:"var(--green-d)" }}/>{tr(lang,"Tie-break: same score, earlier submission ranks higher.","同分裁决：分数相同，先提交者排名靠前。")}</p>
        <p className="ph-sub" style={{ marginTop:6 }}><Ic.shield style={{ width:14, height:14, verticalAlign:"-2px", marginRight:5 }}/>{tr(lang,"One play per person per round, enforced in the KiX app.","每人每场限玩一局，由 KiX App 保证。")}</p>
        <p className="ph-sub" style={{ marginTop:6 }}><Ic.trophy style={{ width:14, height:14, verticalAlign:"-2px", marginRight:5, color:"#C2410C" }}/>{tr(lang,"Prizes are awarded by actual final rank, with no minimum turnout needed.","按最终实际排名发奖，不设最低人数门槛，来多少人都照常开赛。")}</p>
      </div>}
      {isDT && <p className="ph-sub dt-rules-note">{tr(lang,"Ties broken by earliest submission · awards drop to the actual rank if fewer join.","赛制：同分先到者靠前 · 参赛不足则发到实际名次。")}</p>}
      <div className="panel" style={{ marginTop:16 }}>
        <OutletScope outlets={outlets} gameOutlets={activity.outletIds} setGameOutlets={ids => upd("outletIds", ids)} setOutlets={setOutlets} locked={live} />
        {live && <p className="ph-sub" style={{ marginTop:10 }}>{tr(lang,"To change outlets, take the activity offline first.","要改门店，请先把活动下线。")}</p>}
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Activity QR codes, one per outlet","活动二维码，每家门店一个")}</h3>
        <p className="ph-sub">{tr(lang,"Each outlet gets its own QR, so redemptions are attributed to the right shop.","每家门店各一个二维码，兑奖才能归因到对应门店。")}</p>
        {st === "draft"
          ? <p className="ph-sub" style={{ marginTop:8, color:"var(--muted-2)" }}><Ic.qr style={{ width:14, height:14, verticalAlign:"-2px", marginRight:4 }}/>{tr(lang,"Published once you go live: each outlet gets a fixed QR you can print, and it never changes on later edits.","上线后每家门店各生成一个固定二维码，可放心打印，后续编辑也不会变。")}</p>
          : actOutlets.length === 0
          ? <div className="ph-sub">{tr(lang,"Select at least one outlet above.","请先在上面选择至少一家门店。")}</div>
          : <><p className="ph-sub" style={{ marginTop:2, color:"var(--muted-2)" }}>{tr(lang,"Fixed since first publish, safe to print. Later edits won't change it.","首次上线时就固定了，可放心打印，后续编辑也不会变。")}</p>
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
  const _sparse = new URLSearchParams(location.search).get("sparse")==="1";   // 冷启动/稀疏演示
  const M = _sparse ? SPARSE_METRICS : DEMO_METRICS;
  const GM = GAME_METRICS;
  // 计费口径：MAU（当月玩过的人）=计费单位、首 3 月免费、到期自动转 Starter。免费期不展示"试用后总价"（避免提前吓退，见弹卡三体）
  const freeDaysLeft = 47;
  // 活动看板惯例=以"活动上线"为锚点累计(Mailchimp/Klaviyo/HubSpot/Voucherify)，默认"上线以来"、不设 All-time（三体 2026-07-13）
  const ranges = [{en:"Since launch",zh:"上线以来"},{en:"Today",zh:"今天"},{en:"Last 7 days",zh:"近 7 天"},{en:"Last 30 days",zh:"近 30 天"}];
  const [ri, setRi] = useState(0);
  const [tab, setTab] = useState(new URLSearchParams(location.search).get("tab") || (hasLive ? "activity" : (hasLiveGame ? "game" : "activity")));
  const [gsel, setGsel] = useState(new URLSearchParams(location.search).get("g") || null); // 选中的单游戏（下钻详情）
  const [gmetric, setGmetric] = useState("plays"); // 横向对比维度：plays/players/time
  const note = tr(lang,"vs last week","比上周");
  const totRed = vouchers.reduce((s,v)=>s+(v.redeemed||0),0);
  // 漏斗转化率 + 新客占比
  const wonRate = Math.round(M.awarded / M.plays * 100);   // 扫码玩→赢券
  const redRate = Math.round(M.walkins / M.awarded * 100);  // 赢券→到店
  const newPct = Math.round(M.newCust / M.walkins * 100), retPct = 100 - newPct;
  const tmax = Math.max(...M.trend.map(t => t.v));
  // 稀疏/小样本规则（三体 2026-07-13）：非零天 <7 不画逐日空柱；小样本(<10)/上线以来 不显百分比比较
  const nonZeroDays = M.trend.filter(t => t.v > 0).length;
  const showTrendBars = nonZeroDays >= 7;
  const smallSample = M.walkins < 10;
  // 各门店到店（来自统一 demo 口径，自洽求和=walkins）
  const outRed = outlets.map(o => ({ o, v: M.byOutlet[o.id] || 0 }));
  const unknownRed = M.byOutlet.unknown || 0;   // 用自家设备核销、未选当前门店 → 记不到具体门店，仍计入总数
  const omax = Math.max(1, ...outRed.map(x=>x.v), unknownRed);
  const gmax = Math.max(...GAME_PERF.map(g => g.v));
  const dlQR = () => { const c=document.createElement("canvas"); c.width=200; c.height=200; const x=c.getContext("2d"); x.fillStyle="#fff"; x.fillRect(0,0,200,200); x.fillStyle="#0B1220"; x.font="bold 24px sans-serif"; x.textAlign="center"; x.fillText("QR CODE",100,90); x.font="13px sans-serif"; x.fillText(liveName||"activity",100,120); const a=document.createElement("a"); a.download="activity-qr.png"; a.href=c.toDataURL(); a.click(); };
  // 活动数据（真实到店）— 空状态分级
  const activityBody = !hasLive ? (
    <EmptyState
      icon={<Ic.chart/>}
      title={hasActs ? tr(lang,"No data until you go live","上线后才有数据") : tr(lang,"No data yet","还没有数据")}
      sub={hasActs
        ? tr(lang,"Once your activity is live and customers redeem in store, redemptions, new vs returning, and per-outlet stats appear here.","活动上线、客人到店兑奖后，这里会显示到店兑奖、新客/回头客、各门店表现。")
        : tr(lang,"This page only counts people who actually redeemed in store. Create an activity, go live, and your redemption data will build up here.","这页只统计真正到店兑奖的人。建活动、上线后，到店兑奖数据会在这里累积。")}
      actLabel={hasActs ? tr(lang,"Go to activities","去活动") : "+ "+tr(lang,"New activity","新建活动")}
      onAct={hasActs ? onGoActivities : onNewAct}
    />
  ) : totRed === 0 ? (
    <EmptyState
      icon={<Ic.chart/>}
      title={tr(lang,"Live, waiting for the first redemption","已上线，等第一笔到店兑奖")}
      sub={tr(lang,"As soon as a customer plays, wins, and redeems in store, your redemption numbers and trends will appear here.","只要有客人扫码玩、赢券、到店兑奖，兑奖数据和趋势就会出现在这里。")}
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
          <span className="rh-eye"><span className="b"></span>{tr(lang,`In-store redemptions · ${P(lang,ranges[ri])}`,`到店兑奖 · ${P(lang,ranges[ri])}`)}</span>
          <div className="rh-num">{M.walkins}{ri!==0 && <span className="rh-delta up"><Ic.arrow style={{ width:15, height:15, transform:"rotate(-90deg)" }}/>{M.delta.walkins}{smallSample ? "" : " "+note}</span>}</div>
        </div>
        <div className="rh-r">{M.trend.map((t,i)=>(<span key={i} className="rh-spark" style={{ height:(t.v/tmax*100)+"%" }}></span>))}</div>
      </div>
      {/* 计费仪表：MAU=计费单位；试用期就摊开"结束后要付多少"，反 bill-shock（Stripe/AWS 范式）*/}
      <div className="billmeter">
        <div className="bm-cost">
          <div className="bm-trial"><Ic.spark style={{ width:14, height:14 }}/> {tr(lang,`First 3 months free · ${freeDaysLeft} days left · now `,`首 3 个月免费 · 还剩 ${freeDaysLeft} 天 · 现在 `)}<b>S$0</b></div>
          <div className="bm-proj">{tr(lang,"You're billed by how many people play each month; the more they play, the cheaper each one gets.","按每月玩的人数计费；玩的人越多，每位越便宜。")}</div>
        </div>
        <button className="panel-link bm-link" onClick={onBilling}>{tr(lang,"Billing","账单管理")} <Ic.arrow style={{ width:14, height:14 }}/></button>
      </div>
      <div className="panels">
        {/* 转化漏斗：吸收"玩了游戏"作为分母，证明全链路通 */}
        <div className="panel">
          <h3>{tr(lang,"From scan to redemption","从扫码到兑奖")}</h3>
          <div className="funnel">
            <div className="fstep"><div className="fn">{M.plays}</div><div className="fl">{tr(lang,"Played","扫码玩")}</div></div>
            <div className="farrow"><b>{wonRate}%</b><span>{tr(lang,"won","赢券")}</span></div>
            <div className="fstep"><div className="fn">{M.awarded}</div><div className="fl">{tr(lang,"Won a voucher","赢到券")}</div></div>
            <div className="farrow"><b>{redRate}%</b><span>{tr(lang,"redeemed","兑奖")}</span></div>
            <div className="fstep on"><div className="fn">{M.walkins}</div><div className="fl">{tr(lang,"Redeemed","到店兑奖")}</div></div>
          </div>
        </div>
        {/* 新客 vs 回头：证明"把路过变回头客" */}
        <div className="panel">
          <h3>{tr(lang,"New vs returning","新客 vs 回头客")}</h3>
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
        <h3>{tr(lang,"Redemptions per day","每天有多少人到店兑奖")}</h3>
        {showTrendBars
          ? <div className="bars7">{M.trend.map((t, i) => (<div key={i} className="col"><div className="bv">{t.v}</div><div className="bar" style={{ height: (t.v/tmax*100) + "%" }}></div><div className="bd">{P(lang,t.d)}</div></div>))}</div>
          : <div style={{ display:"flex", alignItems:"center", gap:18, padding:"6px 2px 2px" }}>
              <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:46, flex:"none" }}>{M.trend.map((t,i)=>(<span key={i} style={{ width:9, borderRadius:3, height:Math.max(7,(t.v/Math.max(1,tmax))*46)+"px", background:t.v>0?"var(--green)":"var(--line-2)" }}></span>))}</div>
              <p className="ph-sub" style={{ margin:0 }}>{tr(lang,"Too few redemptions to chart yet. The daily trend appears once more customers come in.","到店兑奖还太少，暂时画不出每日趋势。等客人多起来，这里会显示每日走势。")}</p>
            </div>}
      </div>
      {/* 条件区：多活动才有"排名"意义；多门店才有"分店"意义 */}
      {(multiAct && outlets.length>=2) ? <div className="panels">
        <div className="panel">
          <div className="panel-head"><h3>{tr(lang,"Which activity brings customers","哪个活动在帮你带客")}</h3><button className="panel-link" onClick={onTune}>{tr(lang,"Manage","管理活动")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Ranked by in-store redemptions, back the one that works","按到店兑奖排序，把预算押在最能带客的那个")}</p>
          {GAME_PERF.map((g, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,g.n)}</span><span className="hv">{g.v} {tr(lang,"redemptions","到店兑奖")}</span></div><div className="ht"><i style={{ width:(g.v/gmax*100)+"%", background:g.c }}></i></div></div>))}
        </div>
        <div className="panel"><OutletPanel lang={lang} outRed={outRed} omax={omax} smallSample={smallSample} unknown={unknownRed}/></div>
      </div>
      : multiAct ? <div className="panel">
          <div className="panel-head"><h3>{tr(lang,"Which activity brings customers","哪个活动在帮你带客")}</h3><button className="panel-link" onClick={onTune}>{tr(lang,"Manage","管理活动")} <Ic.arrow style={{ width:14, height:14 }}/></button></div>
          <p className="ph-sub">{tr(lang,"Ranked by in-store redemptions, back the one that works","按到店兑奖排序，把预算押在最能带客的那个")}</p>
          {GAME_PERF.map((g, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,g.n)}</span><span className="hv">{g.v} {tr(lang,"redemptions","到店兑奖")}</span></div><div className="ht"><i style={{ width:(g.v/gmax*100)+"%", background:g.c }}></i></div></div>))}
        </div>
      : outlets.length>=2 ? <div className="panel"><OutletPanel lang={lang} outRed={outRed} omax={omax} smallSample={smallSample} unknown={unknownRed}/></div>
      : null}
    </>
  );

  // 游戏参与度：概览(横向对比+可点) → 单游戏历史详情；含「曾上线现已下线」游戏(历史不删)
  const games = GM.games || [];
  const hasEver = games.length > 0;              // 曾上线过任何游戏（判空态，取代 hasLiveGame）
  const oneGame = games.length === 1;            // 只有 1 个 → 跳过列表直接进详情
  const selGame = gsel ? games.find(g=>g.id===gsel) : (oneGame ? games[0] : null);
  const GMETRICS = [
    { k:"plays",   en:"Plays",   zh:"玩次", val:g=>g.plays,      unit:{en:"plays",zh:"次"} },
    { k:"players", en:"Players", zh:"玩家", val:g=>g.players,    unit:{en:"players",zh:"人"} },
    { k:"time",    en:"Time",    zh:"时长", val:g=>g.avgPlaySec, unit:{en:"s",zh:"s"} },
  ];
  const curMetric = GMETRICS.find(m=>m.k===gmetric) || GMETRICS[0];
  const gsorted = [...games].sort((a,b)=>curMetric.val(b)-curMetric.val(a));
  const gcmax = Math.max(1, ...games.map(m=>curMetric.val(m)));
  const gBadge = (off) => <span className={"act-badge sm "+(off?"st-offline":"st-live")}>{!off && <span className="b"></span>}{off ? tr(lang,"Offline","已下线") : tr(lang,"Live","已上线")}</span>;

  // 单游戏历史详情（在跑=绿；已下线=灰存档；小样本=sparkline 降级）
  const gameDetail = (g) => {
    const off = g.status==="offline";
    const dmax = Math.max(1, ...g.trend.map(t=>t.v));
    return (<>
      {!oneGame && <div className="rep-back" onClick={()=>setGsel(null)}><Ic.arrow style={{ width:15, height:15, transform:"rotate(180deg)" }}/> {tr(lang,"All games","所有游戏")}</div>}
      <div className="gd-head">
        <div className="gd-art" style={{ background:g.c }}></div>
        <div className="gd-tt"><div className="gd-nm">{P(lang,g.name)} {gBadge(off)}</div><div className="gd-meta">{P(lang,g.liveMeta)}</div></div>
      </div>
      {off && <div className="gnote"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}><rect x="9" y="8" width="2.2" height="8" rx="1" fill="currentColor" stroke="none"/><rect x="13" y="8" width="2.2" height="8" rx="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="9"/></svg><span><b>{tr(lang,"This game is offline.","游戏已下线。")}</b> {tr(lang,"Below is the data it gathered while live. To collect more, relaunch it from My games.","下面是它上线期间攒下的数据。想继续收集，去「我的游戏」重新上线。")}</span></div>}
      <div className={"rep-hero"+(off?" archived":"")}>
        <div className="rh-l">
          <span className="rh-eye"><span className="b" style={off?{ background:"#94A3B0", boxShadow:"none" }:undefined}></span>{off ? tr(lang,"Plays · while live","游玩次数 · 在线期间") : tr(lang,`Plays · ${P(lang,ranges[ri])}`,`游玩次数 · ${P(lang,ranges[ri])}`)}</span>
          <div className="rh-num">{g.plays}{!off && g.dailyAvg && <span className="rh-sub2">{tr(lang,`About ${g.dailyAvg} a day`,`日均约 ${g.dailyAvg} 次`)}</span>}</div>
          <p className="rh-sub">{tr(lang,"Total times customers played this game, including plays inside activities.","客人玩这个游戏的总次数，包含在活动里玩的。")}</p>
        </div>
        {!g.small && <div className="rh-r">{g.trend.map((t,i)=>(<span key={i} className="rh-spark" style={{ height:(t.v/dmax*100)+"%" }}></span>))}</div>}
      </div>
      <div className="panels">
        <div className="panel gstat">
          <div className="gstat-l"><h3>{tr(lang,"Players","玩家数")}</h3><p className="ph-sub">{off ? tr(lang,"How many played while live","在线期间多少人玩过") : tr(lang,"How many people played","多少人玩过")}</p></div>
          <div className="rh-num" style={{ color:"var(--ink)" }}>{g.players}</div>
        </div>
        <div className="panel gstat">
          <div className="gstat-l"><h3>{tr(lang,"Avg play time","平均时长")}</h3><p className="ph-sub">{tr(lang,"Average time per play","平均每局玩多久")}</p></div>
          <div className="rh-num" style={{ color:"var(--ink)" }}>{g.avgPlaySec}<span className="rh-unit">s</span></div>
        </div>
      </div>
      <div className="panel">
        <h3>{tr(lang,"Plays per day","每天游玩次数")}</h3>
        <p className="ph-sub">{g.small ? tr(lang,"Too little data to chart yet. The daily bars fill in as it runs.","数据太少，还画不出每日走势。多跑几天就有了。") : off ? tr(lang,"Its live days only. The line marks when it went offline.","只显示它在线那段时间。虚线之后已下线，不再收数据。") : tr(lang,"Daily plays over the last 7 days","这个游戏近 7 天每天被玩多少次")}</p>
        {g.small
          ? <div style={{ display:"flex", alignItems:"center", gap:16, padding:"8px 2px" }}>
              <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:40 }}>{g.trend.map((t,i)=>(<span key={i} style={{ width:9, borderRadius:3, height:Math.max(7,(t.v/dmax*40))+"px", background:t.v>0?"var(--green)":"var(--line-2)" }}></span>))}</div>
              <span style={{ fontSize:13, color:"var(--muted)" }}>{tr(lang,"A few more days and this becomes a full chart.","多跑几天，这里会变成完整柱状图。")}</span>
            </div>
          : <div className="bars7">
              {g.trend.map((t,i)=>(<div key={i} className="col"><div className="bv">{t.v}</div><div className="bar" style={{ height:(t.v/dmax*100)+"%" }}></div><div className="bd">{P(lang,t.d)}</div></div>))}
              {off && <div className="endline"><span>{tr(lang,"Offline","下线")}</span></div>}
            </div>}
      </div>
    </>);
  };

  const gameBody = !hasEver ? (
    <EmptyState
      icon={<Ic.gamepad/>}
      title={tr(lang,"No game data yet","还没有游戏数据")}
      sub={tr(lang,"Launch a game (no prizes needed) and its plays, players and play time show up here. Take it offline later and the history stays.","上线一个游戏（不用奖品），玩次、玩家、时长就显示在这里。以后下线了，数据也一直留着。")}
      actLabel={tr(lang,"Go to My games","去我的游戏")}
      onAct={onGoGames}
    />
  ) : selGame ? gameDetail(selGame) : (
    <>
      <div className="rep-hero">
        <div className="rh-l">
          <span className="rh-eye"><span className="b"></span>{tr(lang,`Plays · ${P(lang,ranges[ri])}`,`游玩次数 · ${P(lang,ranges[ri])}`)}</span>
          <div className="rh-num">{GM.plays}{GM.dailyAvg && <span className="rh-sub2">{tr(lang,`About ${GM.dailyAvg} a day`,`日均约 ${GM.dailyAvg} 次`)}</span>}</div>
          <p className="rh-sub">{tr(lang,"Total plays across your games, including plays inside activities.","你所有游戏被玩的总次数，包含在活动里玩的。")}</p>
        </div>
        <div className="rh-r">{(GM.spark||[]).map((h,i)=>(<span key={i} className="rh-spark" style={{ height:h+"%" }}></span>))}</div>
      </div>
      <div className="panels">
        <div className="panel gstat">
          <div className="gstat-l"><h3>{tr(lang,"Players","玩家数")}</h3><p className="ph-sub">{tr(lang,"How many people played","多少人玩过")}</p></div>
          <div className="rh-num" style={{ color:"var(--ink)" }}>{GM.players}</div>
        </div>
        <div className="panel gstat">
          <div className="gstat-l"><h3>{tr(lang,"Avg play time","平均时长")}</h3><p className="ph-sub">{tr(lang,"Average time per play","平均每局玩多久")}</p></div>
          <div className="rh-num" style={{ color:"var(--ink)" }}>{GM.avgPlaySec}<span className="rh-unit">s</span></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head" style={{ alignItems:"flex-start" }}>
          <div><h3>{tr(lang,"Plays by game","各游戏游玩次数")}</h3><p className="ph-sub" style={{ margin:0 }}>{tr(lang,"Which game gets played most. Tap a bar for details.","哪个游戏最多人玩。点一条看详情。")}</p></div>
          <div className="metricseg">{GMETRICS.map(m=>(<button key={m.k} className={gmetric===m.k?"on":""} onClick={()=>setGmetric(m.k)}>{tr(lang,m.en,m.zh)}</button>))}</div>
        </div>
        <div style={{ marginTop:16 }}>
          {gsorted.map(g=>{
            const v = curMetric.val(g), off = g.status==="offline";
            const disp = gmetric==="time" ? v+"s" : v+" "+P(lang,curMetric.unit);
            return (<div key={g.id} className="cbar" onClick={()=>setGsel(g.id)}>
              <div className="cbar-l"><span className="cn">{P(lang,g.name)} {gBadge(off)}</span><span className="cv">{disp} <span className="ch">›</span></span></div>
              <div className="cbar-t"><i style={{ width:(v/gcmax*100)+"%", background:g.c }}></i></div>
            </div>);
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="app-body">
      <div className="rep-top">
        <div className="rep-seg">
          <button className={tab==="activity"?"on":""} onClick={()=>{ setTab("activity"); }}>{tr(lang,"Activities","活动")}</button>
          <button className={tab==="game"?"on":""} onClick={()=>{ setTab("game"); }}>{tr(lang,"Games","游戏")}</button>
        </div>
        {/* 已下线单游戏详情用"在线期间"口径，隐藏区间选择器（避免今天/近7天全空穿帮）*/}
        {!(tab==="game" && selGame && selGame.status==="offline") &&
          <div className="datepills">{ranges.map((r,i) => <button key={i} className={ri===i?"on":""} onClick={()=>setRi(i)}>{P(lang,r)}</button>)}</div>}
      </div>
      {tab==="activity" ? activityBody : gameBody}
    </div>
  );
}
function OutletPanel({ lang, outRed, omax, smallSample, unknown = 0 }) {
  return (<>
    <h3>{tr(lang,"Redemptions by outlet","各门店到店兑奖")}</h3>
    <p className="ph-sub">{tr(lang,"Which shop pulls the most; voucher stock is shared across outlets","哪家店带客最多。券的库存整个活动全门店共用。")}</p>
    {outRed.map(({o,v}, i) => (<div key={i} className="hbar"><div className="hl"><span>{P(lang,o.name)}</span><span className="hv">{v} {tr(lang,"redemptions","到店兑奖")}</span></div>{!smallSample && <div className="ht"><i style={{ width:(v/omax*100)+"%", background:"linear-gradient(90deg,#16A34A,#22C55E)" }}></i></div>}</div>))}
    {unknown > 0 && <>
      <div className="hbar"><div className="hl"><span className="ho-unk">{tr(lang,"Outlet not set","未指定门店")}</span><span className="hv">{unknown} {tr(lang,"redemptions","到店兑奖")}</span></div>{!smallSample && <div className="ht"><i style={{ width:(unknown/omax*100)+"%", background:"linear-gradient(90deg,#94A3B0,#B6C1CC)" }}></i></div>}</div>
      <p className="ph-sub ho-unk-note">{tr(lang,"Redeemed on the shop's own device without picking a current outlet — still counted in your total.","用自家设备核销、没先选当前门店的，仍计入总数。")}</p>
    </>}
  </>);
}

/* ===== billing: plans + payment method ===== */
// bible §4.0：软件永久免费、无 freemium 分层。只有一套自助计费(免费窗口→MAU 基础费)+ 连锁定制。没有"永久免费套餐"(免费只是窗口，过了都要付)。
// 只读展示：档位按当月活跃玩家自动决定（不手选）。演示当前档 = starter。Custom=连锁/定制、talk to us。
const PLANS = [
  { id:"starter", name:{en:"Starter",zh:"入门"}, price:{en:"S$29/mo",zh:"S$29/月"},   note:{en:"Up to 500 active players / month · then S$0.08 / extra player",zh:"每月最多 500 位活跃玩家 · 超出每位 S$0.08"} },
  { id:"growth",  name:{en:"Growth",zh:"成长"}, price:{en:"S$79/mo",zh:"S$79/月"},   note:{en:"Up to 2,500 active players / month · then S$0.05 / extra player",zh:"每月最多 2,500 位活跃玩家 · 超出每位 S$0.05"} },
  { id:"pro",     name:{en:"Pro",zh:"专业"}, price:{en:"S$199/mo",zh:"S$199/月"}, note:{en:"Up to 10,000 active players / month · then S$0.03 / extra player",zh:"每月最多 10,000 位活跃玩家 · 超出每位 S$0.03"} },
  { id:"custom",  name:{en:"Custom",zh:"定制"}, price:{en:"Talk to us",zh:"联系我们"}, note:{en:"10,000+ players · chains & bespoke",zh:"10,000+ 玩家 · 连锁与定制"} },
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
        <p className="pub-sub">{tr(lang,"Authorization only, we don't charge your card now.","只是预授权绑定，现在不会扣你钱。")}</p>
        <div className="cardf" style={{ marginBottom:16 }}>
          <div className="cardf-input">
            <input placeholder={tr(lang,"Card number","卡号")} value={num} onChange={e=>setNum(fmtCard(e.target.value))} inputMode="numeric"/>
            <div className="cardf-row">
              <input placeholder={tr(lang,"MM / YY","有效期 MM/YY")} value={exp} onChange={e=>setExp(e.target.value.replace(/[^\d/]/g,"").slice(0,5))} inputMode="numeric"/>
              <input placeholder="CVC" value={cvc} onChange={e=>setCvc(e.target.value.replace(/\D/g,"").slice(0,4))} inputMode="numeric"/>
            </div>
          </div>
          <p className="cardf-note"><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"First 3 months free. After that you're billed by how many people play each month, the more they play, the cheaper each one gets.","前 3 个月免费。之后按每月玩的人数计费，玩的人越多，每位越便宜。")}</span></p>
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
function PlanModal({ plan, onClose }) {
  const lang = useLang();
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:440 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"Your plan","我的套餐")}</h3>
        <p className="pub-sub">{tr(lang,"Your plan is set automatically by how many people play each month, moving up on its own as you grow, with each player getting cheaper. No need to pick.","档位按当月玩的人数自动决定——玩的人变多会自动升档、每位越来越便宜，不用你手动选。")}</p>
        <div className="plans">
          {PLANS.map(pl => (
            <div key={pl.id} className={"plan-opt ro"+(plan===pl.id?" on":"")}>
              <div className="plan-l"><div className="plan-nm">{P(lang,pl.name)}{plan===pl.id && <span className="plan-cur">{tr(lang,"You're here","当前")}</span>}</div><div className="plan-note">{P(lang,pl.note)}</div></div>
              <div className="plan-price">{P(lang,pl.price)}</div>
            </div>
          ))}
        </div>
        <p className="cardf-note" style={{ margin:"14px 2px 0" }}><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"Free for your first 3 months. You only pay for players above your plan; cancel anytime.","前 3 个月免费。只有超出档位的玩家才额外收费；随时可取消。")}</span></p>
      </div>
    </div>,
    document.body
  );
}
// 邀请成员弹窗：二维码 + 可复制链接。对方用自己的手机号(国内)/邮箱(海外)收验证码登录后，以「成员」身份加入。
function InviteModal({ shopName, onClose }) {
  const lang = useLang();
  const [token, setToken] = useState("k7f2a9");
  const link = `https://app.letskix.com/join/${token}`;
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(link).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false), 1800); };
  const regen = () => { setToken(Math.random().toString(36).slice(2,8)); setCopied(false); };
  return ReactDOM.createPortal(
    <div className="pub-scrim" onClick={onClose}>
      <div className="pub-modal" style={{ width:460 }} onClick={e=>e.stopPropagation()}>
        <button className="pub-x" onClick={onClose}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        <h3>{tr(lang,"Invite a teammate","邀请成员")}</h3>
        <p className="pub-sub">{tr(lang,`They'll see all your data and can run the day-to-day. Only you can manage billing and the team.`,"对方能看到你全部的数据、也能打理日常经营。只有你能管理账单和成员。")}</p>
        <div className="invite-qr"><QRGlyph size={128}/></div>
        <div className="invite-linkrow">
          <input readOnly value={link} onFocus={e=>e.target.select()}/>
          <button className="btn primary sm" onClick={copy}>{copied ? tr(lang,"Copied","已复制") : tr(lang,"Copy link","复制链接")}</button>
        </div>
        <p className="invite-note"><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"They scan or open the link, then sign in with a code sent to their own phone (local) or email (overseas). Link valid 7 days.","对方扫码或打开链接，用发到自己手机号（国内）或邮箱（海外）的验证码登录即可加入。链接 7 天有效。")}</span></p>
        <button className="invite-regen" onClick={regen}>{tr(lang,"Generate a new link (invalidates the old one)","重新生成链接（旧链接立即失效）")}</button>
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
  const [plan] = useState("starter");
  const _bill = new URLSearchParams(location.search).get("bill");
  const [cardModal, setCardModal] = useState(_bill==="card"), [planModal, setPlanModal] = useState(_bill==="plan");
  const curPlan = PLANS.find(p=>p.id===plan) || PLANS[0];
  const [saved, setSaved] = useState(""), [appQr, setAppQr] = useState(false);
  const [invite, setInvite] = useState(new URLSearchParams(location.search).get("invite")==="1"); // ?invite=1 调试直开
  // 邀请是匿名可分享链接，老板不知道对方凭证 → 不存在“待加入”状态；成员登录后才出现在列表
  const [members, setMembers] = useState([
    { id:"m1", name:"Joyce", cred:"9123 4567", role:"owner",  status:"active" },
    { id:"m2", name:"Wei Ling", cred:"9876 5432", role:"member", status:"active" },
  ]);
  const removeM = (id) => setMembers(ms => ms.filter(m => m.id!==id));
  const save = (k) => { setSaved(k); setTimeout(()=>setSaved(s=>s===k?"":s), 2000); };
  const updO = (i, k, v) => setOutlets(os => os.map((o,j)=> j===i ? {...o,[k]:v} : o));
  const addO = () => setOutlets(os => [...os, { id:"o"+(os.length+1)+Date.now(), name:{en:"New outlet",zh:"新店铺"}, line1:"", city:"Singapore", region:"", postal:"", country:0, primary:false }]);
  const delO = (i) => setOutlets(os => os.filter((_,j)=>j!==i));
  return (
    <div className="app-body" style={{ maxWidth:820 }}>
      <div className="panel">
        <h3>{tr(lang,"Account","账户")}</h3>
        <p className="ph-sub">{tr(lang,"Your business name and contact, used across games and receipts.","商家名称和联系方式，会用在游戏和凭证上。")}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div className="field"><label>{tr(lang,"Business name","商家名称")} <span className="req">*</span></label><input value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="field"><label>{tr(lang,"Mobile (WhatsApp)","手机号（WhatsApp）")} <span className="opt">{tr(lang,"(optional)","（选填）")}</span></label><input value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        </div>
        <div className="me-save">{saved==="acct" && <span className="me-saved"><Ic.check style={{ width:14, height:14 }}/> {tr(lang,"Saved","已保存")}</span>}<button className="btn primary sm" onClick={()=>save("acct")}>{tr(lang,"Save changes","保存修改")}</button></div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <div className="team-head">
          <div>
            <h3 style={{ margin:0 }}>{tr(lang,"Team","团队")}</h3>
            <p className="ph-sub" style={{ margin:"4px 0 0" }}>{tr(lang,"Add the people who run this business with you. Everyone sees all data and can operate; only you handle billing and the team.","把和你一起管这门生意的人加进来。所有人都能看全部数据、能操作；只有你管账单和成员。")}</p>
          </div>
          <button className="btn primary sm" style={{ flex:"none" }} onClick={()=>setInvite(true)}>+ {tr(lang,"Invite member","邀请成员")}</button>
        </div>
        <div className="team-list">
          {members.map(m => (
            <div className="team-row" key={m.id}>
              <div className={"team-av" + (m.role==="owner" ? " owner" : "")}>{m.name.slice(0,1) || "?"}</div>
              <div className="team-info">
                <div className="team-name">{m.name}</div>
                <div className="team-cred">{m.cred}</div>
              </div>
              <span className={"team-tag " + (m.role==="owner" ? "owner" : "member")}>{m.role==="owner" ? tr(lang,"Owner","老板") : tr(lang,"Member","成员")}</span>
              {m.role==="owner"
                ? <span className="team-you">{tr(lang,"You","你")}</span>
                : <button className="team-rm" onClick={()=>removeM(m.id)}>{tr(lang,"Remove","移除")}</button>}
            </div>
          ))}
        </div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Billing & plan","账单与套餐")}</h3>
        <p className="ph-sub">{tr(lang,"Manage your plan and card here.","在这里管理你的套餐和银行卡。")}</p>
        <div className="billrow">
          <div className="bill-l"><span className="bill-ic"><Ic.spark style={{ width:16, height:16 }}/></span><div><div className="bill-t">{tr(lang,"Plan","套餐")}</div><div className="bill-v">{P(lang,curPlan.name)}{P(lang,curPlan.price) ? " · "+P(lang,curPlan.price) : ""}</div></div></div>
          <button className="btn ghost sm" onClick={()=>setPlanModal(true)}>{tr(lang,"View plan","查看套餐")}</button>
        </div>
        <div className="billrow">
          <div className="bill-l"><span className="bill-ic"><Ic.card style={{ width:16, height:16 }}/></span><div><div className="bill-t">{tr(lang,"Payment method","付款方式")}</div><div className="bill-v">{cardOnFile ? <>Visa •••• {cardOnFile.last4}</> : <span style={{ color:"var(--muted)" }}>{tr(lang,"No card yet","尚未绑定银行卡")}</span>}</div></div></div>
          <button className="btn ghost sm" onClick={()=>setCardModal(true)}>{cardOnFile ? tr(lang,"Change","更换") : tr(lang,"Add card","添加银行卡")}</button>
        </div>
        <p className="cardf-note" style={{ margin:"12px 2px 0" }}><Ic.shield style={{ width:14, height:14, flexShrink:0 }}/> <span>{tr(lang,"You won't be charged for the first 3 months. After that you're billed by monthly active players; take activities offline anytime.","前 3 个月不扣款。之后按当月活跃玩家计费，活动随时可下线。")}</span></p>
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
        <h3>{tr(lang,"Contact us","联系我们")}</h3>
        <p className="ph-sub">{tr(lang,"Got a question, or need a custom / multi-outlet plan? We're here to help.","有任何问题，或想要连锁 / 定制方案，随时找我们。")}</p>
        <div className="contact-row">
          <a className="btn ghost sm" href="mailto:hello@letskix.com"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg> {tr(lang,"Email us","发邮件")}</a>
          <a className="btn ghost sm" href="mailto:sales@letskix.com?subject=Custom%20plan"><Ic.store style={{ width:15, height:15 }}/> {tr(lang,"Chains / custom, talk to sales","连锁 / 定制 · 联系销售")}</a>
        </div>
      </div>
      <div className="panel" style={{ marginTop:16 }}>
        <h3>{tr(lang,"Outlets","店铺")}</h3>
        <p className="ph-sub">{tr(lang,"Your physical shops. Name & address required, phone optional. A game can run at one, some, or all of them.","你的实体门店。店名和地址必填，电话选填。一个游戏可以在一家、几家或全部门店生效。")}</p>
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
        <p className="ph-sub">{tr(lang,"Your logo, colors and product photos, auto-applied when you build a game.","你的 logo、品牌色和商品图，建游戏时会自动套上。")}</p>
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
            {(!brand.products || !brand.products.length) && <div className="vmini">{tr(lang,"No photos yet; add a few so games look like your shop.","还没有商品图，加几张，游戏更像你的店。")}</div>}
          </div>
        </div>
      </div>
      {invite && <InviteModal shopName={name} onClose={()=>setInvite(false)}/>}
      {cardModal && <CardModal cardOnFile={cardOnFile} onSave={setCardOnFile} onClose={()=>setCardModal(false)}/>}
      {planModal && <PlanModal plan={plan} onClose={()=>setPlanModal(false)}/>}
      {appQr && <AppQRModal onClose={()=>setAppQr(false)}/>}
    </div>
  );
}

// 下线撤销 toast（可逆动作：立即执行 + 撤销，不弹前置确认）
function UndoToast({ onUndo, onClose, lang }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, []);
  return ReactDOM.createPortal(
    <div className="undo-toast">
      <span className="ut-txt"><Ic.check style={{ width:15, height:15 }}/> {tr(lang,"Taken offline · scanning paused","已下线 · 客人扫码已暂停")}</span>
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
  // 集中收卡闸门：任何"给客人玩"的上线都过这里。有卡直接执行；无卡先弹 CardGate、绑卡后再执行原动作。
  // 覆盖绕过发布弹窗的直接上线（如活动管理页卡片「上线」按钮 onSetStatus live）。发布弹窗内已自带卡步、不重复。
  const [cardGate, setCardGate] = useState(null); // 待执行的 proceed 函数 or null
  const requireCard = (proceed) => { if (cardOnFile) proceed(); else setCardGate(() => proceed); };
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
  const openAct = (act) => { setEditingAct({...act, vouchers:(act.vouchers||[]).map(v=>({...v})), prizeLadder:(act.prizeLadder||[]).map(p=>({...p, prize:{...p.prize}})), schedule:act.schedule?{...act.schedule, days:[...(act.schedule.days||[])]}:undefined, duration:act.duration?{...act.duration}:undefined, dailyLadder:act.dailyLadder?act.dailyLadder.map(r=>({...r, prize:{...r.prize}})):undefined, grandLadder:act.grandLadder?act.grandLadder.map(r=>({...r, prize:{...r.prize}})):undefined }); };
  // 建活动第一步先选形态（长期/挑战赛），再进对应编辑器
  const [actFilt, setActFilt] = useState("all");   // 进活动页时的初始筛选（主页聚合标题→已上线）
  const goActs = (f="all") => { setActFilt(f); setSec("activities"); };
  const openNewActPicker = () => { setEditing(null); setEditingAct(null); setPickForm(true); };
  const blankLongrun = () => ({ id:"a"+Date.now(), form:"longrun", name:{en:"New activity",zh:"新活动"}, outletIds:outlets.map(o=>o.id), vouchers:STARTER_VOUCHERS.map(v=>({...v})), gameId:(myGames[0]||TEMPLATES[0]).id, status:"draft" });
  const blankChallenge = () => ({ id:"a"+Date.now(), form:"challenge", name:{en:"New challenge",zh:"新挑战赛"}, outletIds:outlets.map(o=>o.id), gameId:(myGames[0]||TEMPLATES[0]).id, status:"draft", schedule:{ mode:"oneoff", date:"", days:[5,6,0], time:"21:00", roundMins:3, endDate:"" }, tiebreak:"earliest", prizeLadder:[ { from:1,to:1,prize:{type:"cash",denom:5,count:4} }, { from:2,to:5,prize:{type:"discount",pct:20} }, { from:6,to:20,prize:{type:"discount",pct:10} } ] });
  const blankDT = () => ({ id:"a"+Date.now(), form:"dt", name:{en:"New tournament",zh:"新锦标赛"}, outletIds:outlets.map(o=>o.id), gameId:(myGames[0]||TEMPLATES[0]).id, status:"draft", duration:{ days:7, startDate:"" }, tiebreak:"earliest", dailyLadder:[], grandLadder:DT_GRAND_SAMPLE.map(r=>({...r, prize:{...r.prize}})) });
  const createAct = (form) => { setPickForm(false); openAct(form==="dt" ? blankDT() : form==="challenge" ? blankChallenge() : blankLongrun()); };
  // 复制现有活动：同游戏/券/门店/赢奖条件，名字加副本，回到 draft、清空运行数据，打开编辑器微调
  const dupAct = (act) => { openAct({ ...act, id:"a"+Date.now(), name:{ en:(act.name.en||"Activity")+" (copy)", zh:(act.name.zh||"活动")+"（副本）" }, vouchers:(act.vouchers||[]).map(v=>({...v, awarded:0, redeemed:0})), stat:undefined, status:"draft" }); };
  const saveAct = () => { setActivities(as => { const idx = as.findIndex(a=>a.id===editingAct.id); return idx>=0 ? as.map((a,i)=>i===idx?editingAct:a) : [...as, editingAct]; }); setEditingAct(null); };
  // 调试：?act=<id> 直接打开该活动编辑器；?pickact=1 打开形态选择弹窗
  useEffect(() => { const p=new URLSearchParams(location.search); const id=p.get("act"); if(id){ const a=activities.find(x=>x.id===id); if(a) openAct(a); } if(p.get("pickact")==="1") setPickForm(true); if(p.get("newdt")==="1") openAct(blankDT()); }, []);
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
          <LegalLinks lang={lang} className="sb-legal" />
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
                  <button className="am-item" onClick={goMe}><Ic.users style={{ width:17, height:17 }}/>{tr(lang,"Team","团队管理")}</button>
                  <button className="am-item" onClick={goMe}><Ic.card style={{ width:17, height:17 }}/>{tr(lang,"Billing & plan","账单与套餐")}</button>
                  <button className="am-item danger" onClick={onExit}><Ic.logout style={{ width:17, height:17 }}/>{tr(lang,"Log out","退出登录")}</button>
                </div></>}
            </div>
          </div>
        </div>
        {inBuild ? <div className="stage" style={{ padding:"22px 28px 60px" }}>{builder}</div>
          : inEdit ? <Workspace game={editing} brand={brand} setBrand={setBrand} setName={(nm)=>{ const id=editing.id; setEditing(g=>({...g, name:{en:nm, zh:nm}})); setMyGames(gs=>gs.map(x=>x.id===id?{...x, name:{en:nm, zh:nm}}:x)); }} />
          : inActEdit ? <ActivityEditor activity={editingAct} setActivity={setEditingAct} outlets={outlets} setOutlets={setOutlets} myGames={myGames} cardOnFile={cardOnFile} setCardOnFile={setCardOnFile} onNewGame={()=>{ setEditingAct(null); onNewGame(); }} onViewGame={(g)=>{ setEditing(g); }} onBack={saveAct} />
          : sec === "home" ? <HomeView game={game} brand={brand} onShare={()=>setSec("redeem")} onRecall={()=>setSec("reports")} activities={activities} liveGames={myGames.filter(g=>g.status==="live")} onNewAct={openNewActPicker} onRedeem={()=>setSec("redeem")} onGoActivity={()=>{ const first = activities[0]; if (first) openAct(first); else { goActs("all"); } }} onGoActivities={()=>goActs("all")} onGoActivitiesLive={()=>goActs("live")} onGoGames={()=>setSec("games")} onGoReports={()=>setSec("reports")} outlets={outlets} />
          : sec === "activities" ? <ActivitiesView activities={activities} outlets={outlets} initFilt={actFilt} onNew={openNewActPicker} onOpen={openAct} onDuplicate={dupAct} onSetStatus={(act,st)=> st==="offline" ? takeOffline(act) : requireCard(()=>setActivities(list=>list.map(a=>a.id===act.id?{...a,status:st}:a)))} onDelete={(ids)=>setActivities(list=>list.filter(a=>!ids.includes(a.id)))} />
          : sec === "games" ? <MyGamesView myGames={myGames} cardOnFile={cardOnFile} onSaveCard={setCardOnFile} onNew={onNewGame} onOpen={(g)=>setEditing(g)} onPublish={(g,patch)=>setMyGames(gs=>gs.map(x=>x.id===g.id?{...x, ...patch, status:"live"}:x))} onOffline={takeGameOffline} onDelete={(ids)=>setMyGames(gs=>gs.filter(g=>!ids.includes(g.id)))} />
          : sec === "redeem" ? <RedeemView vouchers={actVouchers} onReport={()=>setSec("reports")} hasLive={!!liveAct} hasActs={activities.length>0} onNewAct={openNewActPicker} onGoActivities={()=>setSec("activities")} liveName={liveAct ? P(lang, liveAct.name) : ""} outlets={outlets} />
          : sec === "me" ? <MeView brand={brand} setBrand={setBrand} outlets={outlets} setOutlets={setOutlets} cardOnFile={cardOnFile} setCardOnFile={setCardOnFile} />
          : <ReportsView onTune={()=>setSec("activities")} outlets={outlets} vouchers={actVouchers} hasLive={!!liveAct} hasActs={activities.length>0} hasLiveGame={myGames.some(g=>g.status==="live")} multiAct={activities.filter(a=>a.status==="live").length>=2} onNewAct={openNewActPicker} onGoActivities={()=>setSec("activities")} onGoGames={()=>setSec("games")} onBilling={()=>setSec("me")} liveName={liveAct ? P(lang, liveAct.name) : ""} />}
      </main>
      {toast && <UndoToast onUndo={undoOffline} onClose={()=>setToast(null)} lang={lang}/>}
      {pickForm && <NewActivityPicker onPick={createAct} onClose={()=>setPickForm(false)}/>}
      {cardGate && <CardGate lang={lang} onSave={(c)=>{ setCardOnFile(c); const p=cardGate; setCardGate(null); p&&p(); }} onClose={()=>setCardGate(null)} />}
    </div>
  );
}

/* ===================== app ===================== */
/* one narrated loader = matching + generating fused (Buell & Norton labor-illusion: visible work feels valuable) */
const BUILD_TASKS = [{en:"Reading your shop type",zh:"读懂你的店型"},{en:"Scanning 1,012 game templates",zh:"扫描 1,012 个玩法模板"},{en:"Ranking by redemption conversion",zh:"按到店兑奖转化率排序"},{en:"Picking the best fits",zh:"挑出最合适的几款"}];
const STEP_IDX = { describe:0, building:1, results:1, preview:2, done:2 };       // 店名(0)在首页完成→loader/选游戏=1, 上线=2
const STEP_IDX_RET = { describe:0, building:0, results:0, preview:1, done:1 };   // 登录后 2 步

function App() {
  const _p = new URLSearchParams(location.search);
  const initScreen = _p.get("screen") || (_p.get("welcome")==="1" ? "app" : "landing");
  const [lang, setLang] = useState((_p.get("lang") === "zh") ? "zh" : "en");
  const [screen, setScreen] = useState(initScreen);
  const [authed, setAuthed] = useState(_p.get("authed") === "1" || ["app","dashboard"].includes(initScreen) || _p.get("welcome")==="1");
  const [welcomeOpen, setWelcomeOpen] = useState(_p.get("welcome")==="1");   // 首次商家主页上的「恭喜+补资料」遮罩弹窗
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
  // 有店名(落地页 hero 输入)→ 直接进 Step2(building→results,描述自动打勾)；无店名 → 先进 Step1 描述
  const startBuild = (name) => { const nm = typeof name==="string" ? name.trim() : ""; setNeed(nm); setGame(TEMPLATES[0]); setBrand({ color:["#16A34A","#22C55E"], logo:null, logoMark:null, products:[] }); setScreen(authed ? "results" : (nm ? "results" : "describe")); top(); };
  const toPublishGate = () => { setScreen("register"); top(); };
  const backToPreview = () => { setScreen("preview"); top(); };
  // 第三步「确认」= 保存游戏(视觉)，不自动建活动；直接进主页（此时有游戏、无活动 → 主页空态引导建活动）
  const publishDone = () => {
    const firstTime = !authed;          // 经注册首次发布 = 全新商家
    setAuthed(true);
    if (!myGames.find(g => g.id === game.id)) setMyGames(gs => [...gs, game]);
    if (firstTime) { setActivities([]); setWelcomeOpen(true); }   // 新商家：主页空态 + 叠加「恭喜+补资料」遮罩弹窗
    setAppSec("home"); setScreen("app"); top();
  };
  const signIn = () => { setScreen("login"); top(); };
  // 验证后账号解析：?accounts=multi 模拟 membership≥2 → 账号选择页；否则直接进（单商家/0）
  const loginDone = () => { if (_p.get("accounts")==="multi") { setScreen("choose"); top(); return; } setAuthed(true); setAppSec("home"); setScreen("app"); top(); };
  const chooseDone = () => { setAuthed(true); setAppSec("home"); setScreen("app"); top(); };
  const exitBuild = () => { authed ? enterApp(appSec) : toLanding(); };

  const buildTasks = BUILD_TASKS.map(t => P(lang,t));

  let flowStep = null;
  if (screen === "describe") flowStep = <Describe need={need} setNeed={setNeed} onNext={()=>setScreen("results")} />;
  else if (screen === "results") flowStep = <Results need={need} onRename={setNeed} onPick={(t,c)=>{ setGame(t); if(c) setBrand(b=>({...b,color:c})); setScreen("preview"); top(); }} onBack={()=> authed ? enterApp(appSec) : toLanding()} />;
  else if (screen === "preview" && authed) flowStep = <div><Workspace game={game} brand={brand} setBrand={setBrand} /><div style={{ display:"flex", gap:12, justifyContent:"flex-end", padding:"16px 28px" }}><button className="btn ghost lg" onClick={()=>{ setScreen("results"); top(); }}><Ic.back style={{ width:16, height:16 }}/> {tr(lang,"Back","上一步")}</button><button className="btn primary lg" onClick={publishDone}><Ic.check style={{ width:18, height:18 }}/> {tr(lang,"Save game","保存游戏")}</button></div></div>;
  else if (screen === "preview") flowStep = <Preview game={game} brand={brand} setBrand={setBrand} need={need} onLaunch={toPublishGate} onBack={()=>{ setScreen("results"); top(); }} />;

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
      <Register onDone={publishDone} onSignIn={signIn} onSaveCard={setCardOnFile} onBack={backToPreview} need={need} />
    </div>
  );
  else if (screen === "choose") body = (
    <div className="shell">
      <div className="topbar"><div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div><div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}><LangToggle lang={lang} setLang={setLang} /><button className="ghost-x" onClick={toLanding}>{tr(lang,"Exit","退出")}</button></div></div>
      <AccountPicker onPick={chooseDone} />
    </div>
  );
  else if (screen === "login") body = (
    <div className="shell">
      <div className="topbar"><div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/> <span className="tg">{tr(lang,"Merchant","商家版")}</span></div><div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center" }}><LangToggle lang={lang} setLang={setLang} /><button className="ghost-x" onClick={toLanding}>{tr(lang,"Exit","退出")}</button></div></div>
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
        <div className="logo"><img className="logo-img" src="logo.png" alt="KiX"/></div>
        <Stepper idx={STEP_IDX[screen]} />
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          <span className="step-of">{tr(lang,`Step ${(STEP_IDX[screen]||0)+1} of 3`,`第 ${(STEP_IDX[screen]||0)+1} 步 / 共 3 步`)}</span>
          <LangToggle lang={lang} setLang={setLang} />
          <button className="ghost-x" onClick={toLanding}>{tr(lang,"Exit","退出")}</button>
        </div>
      </div>
      <div className="stage">{flowStep}</div>
    </div>
  );

  return <LangCtx.Provider value={lang}>{body}{welcomeOpen && <Welcome need={need} onDone={()=>setWelcomeOpen(false)} />}<LegalHost/></LangCtx.Provider>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
