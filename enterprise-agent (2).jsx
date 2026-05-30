import { useState, useEffect, useRef } from "react";

const SOURCE_DEFS = [
  { id:"github",   name:"GitHub",     icon:"ti-brand-github",    color:"#a78bfa", bg:"rgba(167,139,250,0.12)", desc:"Repos · PRs · CI/CD" },
  { id:"postgres", name:"PostgreSQL", icon:"ti-database",        color:"#38bdf8", bg:"rgba(56,189,248,0.12)",  desc:"Tables · Queries" },
  { id:"slack",    name:"Slack",      icon:"ti-brand-slack",     color:"#f472b6", bg:"rgba(244,114,182,0.12)", desc:"Channels · Alerts" },
  { id:"datadog",  name:"Datadog",    icon:"ti-activity",        color:"#fb923c", bg:"rgba(251,146,60,0.12)",  desc:"APM · Metrics" },
  { id:"jira",     name:"Jira",       icon:"ti-clipboard-list",  color:"#60a5fa", bg:"rgba(96,165,250,0.12)",  desc:"Sprints · Tickets" },
  { id:"sentry",   name:"Sentry",     icon:"ti-bug",             color:"#f87171", bg:"rgba(248,113,113,0.12)", desc:"Errors · Traces" },
];

const ISSUE_POOL = [
  { source:"github",   level:"error",   title:"CI Pipeline Failed",        body:"Build #487 failed on main — 3 test suites broken in auth/middleware",      fixable:true,  fixFile:"src/auth/middleware.ts",         fixDiff:"- const user = req.headers['authorization'];\n- if (!user) return res.status(401).send('Unauthorized');\n+ const token = req.headers['authorization']?.split(' ')[1];\n+ if (!token) return res.status(401).json({ error: 'Missing token' });\n+ const user = await verifyToken(token);\n  req.user = user;" },
  { source:"sentry",   level:"error",   title:"Unhandled Exception Spike", body:"TypeError: Cannot read 'userId' of undefined — 340 occurrences / 10 min", fixable:true,  fixFile:"src/api/users.ts",               fixDiff:"- const data = await db.query('SELECT * FROM users WHERE id=$1', [req.user.userId]);\n+ if (!req?.user?.userId) {\n+   return res.status(400).json({ error: 'Invalid session' });\n+ }\n+ const data = await db.query('SELECT * FROM users WHERE id=$1', [req.user.userId]);\n  res.json(data.rows[0] ?? null);" },
  { source:"postgres", level:"warning", title:"Slow Query Detected",       body:"JOIN on users+orders averaging 4.2 s — missing index on orders.user_id",  fixable:true,  fixFile:"migrations/0042_add_index.sql",  fixDiff:"+ CREATE INDEX CONCURRENTLY IF NOT EXISTS\n+   idx_orders_user_id ON orders(user_id);\n+\n+ ANALYZE orders;" },
  { source:"datadog",  level:"error",   title:"Error Rate > 5%",           body:"/api/checkout error rate hit 8.3% — upstream payment service timing out", fixable:false },
  { source:"jira",     level:"warning", title:"Sprint Blockers Found",     body:"4 P1 tickets unassigned · 2 PRs awaiting review > 72 hours",              fixable:false },
  { source:"slack",    level:"info",    title:"Deployment Notification",   body:"#deployments: v2.4.1 pushed to staging by @devbot — 12 files changed",    fixable:false },
  { source:"github",   level:"warning", title:"Security Vulnerability",    body:"lodash 4.17.20 has CVE-2021-23337 (high severity) in package.json",       fixable:true,  fixFile:"package.json",                   fixDiff:'-    "lodash": "^4.17.20",\n+    "lodash": "^4.17.21",' },
  { source:"postgres", level:"error",   title:"Connection Pool Exhausted", body:"Max 100 connections reached — 23 queries queued, response degraded",      fixable:true,  fixFile:"src/db/pool.ts",                 fixDiff:"- max: 100,\n+ max: 20,\n+ idleTimeoutMillis: 30000,\n+ connectionTimeoutMillis: 2000," },
  { source:"sentry",   level:"warning", title:"Memory Leak Detected",      body:"Heap growing 12 MB/hr on worker-3 — GC not reclaiming Promise chains",    fixable:true,  fixFile:"src/workers/processor.ts",       fixDiff:"-  tasks.forEach(t => this.handle(t));\n+  for (const t of tasks) {\n+    await this.handle(t);\n+    await new Promise(r => setImmediate(r));\n+  }\n+  tasks.length = 0;" },
  { source:"datadog",  level:"info",    title:"Latency Spike Resolved",    body:"p99 latency back to baseline (120 ms) after auto-scaling triggered",      fixable:false },
];

let _id = 1;
const mkIssue = (tpl) => ({ ...tpl, id: _id++, time: new Date(), status:"open", fixed:false, fixing:false });

// ── tiny helpers ──────────────────────────────────────────────────────────────
function Dot({ status, size=8 }) {
  const c = { online:"#22c55e", warning:"#f59e0b", error:"#ef4444", offline:"#334155", connecting:"#60a5fa" };
  const col = c[status]||c.offline;
  return <span style={{ width:size, height:size, borderRadius:"50%", display:"inline-block", flexShrink:0, background:col, boxShadow:(status==="online"||status==="error")?`0 0 6px ${col}`:"none" }} />;
}
function Spin() { return <i className="ti ti-loader-2" style={{ display:"inline-block", animation:"nexSpin 1s linear infinite" }} />; }
function Dots() {
  return <span style={{ display:"inline-flex", gap:4, alignItems:"center" }}>
    {[0,1,2].map(i=><span key={i} style={{ width:5,height:5,borderRadius:"50%",background:"rgba(167,139,250,0.9)",animation:`nexPulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
  </span>;
}
function Badge({ level }) {
  const m = { error:["#fca5a5","rgba(239,68,68,0.15)"], warning:["#fde68a","rgba(245,158,11,0.13)"], info:["#93c5fd","rgba(96,165,250,0.12)"] };
  const [col,bg] = m[level]||m.info;
  return <span style={{ padding:"2px 8px", borderRadius:6, fontSize:10, fontFamily:"monospace", background:bg, color:col, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>{level}</span>;
}
function ToolBadge({ id, status }) {
  const s = SOURCE_DEFS.find(x=>x.id===id)||{ name:id, icon:"ti-plug", color:"#a78bfa", bg:"rgba(167,139,250,0.12)" };
  return <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px", borderRadius:20, background:s.bg, border:`1px solid ${s.color}40`, fontSize:11, color:s.color, fontFamily:"monospace" }}>
    <i className={`ti ${s.icon}`} style={{ fontSize:11 }}/>{s.name}
    {status==="loading"?<Dots/>:<i className="ti ti-check" style={{ fontSize:10,color:"#22c55e" }}/>}
  </span>;
}
function LatBar({ v, max=200 }) {
  const pct = Math.min(100,(v/max)*100);
  const col = v<60?"#22c55e":v<120?"#f59e0b":"#ef4444";
  return <div style={{ height:5,borderRadius:3,background:"rgba(255,255,255,0.07)",flex:1 }}>
    <div style={{ height:"100%",width:pct+"%",borderRadius:3,background:col,transition:"width 0.6s" }}/>
  </div>;
}

// ── diff viewer ───────────────────────────────────────────────────────────────
function DiffView({ diff, file }) {
  return <div style={{ borderRadius:10, overflow:"hidden", border:"1px solid rgba(167,139,250,0.25)", marginTop:10 }}>
    <div style={{ padding:"7px 14px", background:"rgba(167,139,250,0.08)", borderBottom:"1px solid rgba(167,139,250,0.15)", display:"flex", alignItems:"center", gap:8 }}>
      <i className="ti ti-file-code" style={{ color:"#a78bfa", fontSize:13 }}/>
      <span style={{ fontSize:11, fontFamily:"monospace", color:"#a78bfa" }}>{file}</span>
    </div>
    <pre style={{ margin:0, padding:"12px 14px", fontSize:12, fontFamily:"monospace", background:"rgba(0,0,0,0.28)", overflowX:"auto", maxHeight:200, overflowY:"auto", lineHeight:1.65 }}>
      {diff.split("\n").map((ln,i)=>(
        <div key={i} style={{ color:ln.startsWith("+")?"#86efac":ln.startsWith("-")?"#fca5a5":ln.startsWith("@")?"#93c5fd":"#64748b", background:ln.startsWith("+")?"rgba(134,239,172,0.07)":ln.startsWith("-")?"rgba(252,165,165,0.07)":"transparent", paddingLeft:4 }}>{ln||" "}</div>
      ))}
    </pre>
  </div>;
}

// ── alert popup ───────────────────────────────────────────────────────────────
function Popup({ alerts, onDismiss, onFix, onInvestigate }) {
  if (!alerts.length) return null;
  return <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:10, maxWidth:370, pointerEvents:"all" }}>
    {alerts.slice(0,3).map(a => {
      const src = SOURCE_DEFS.find(s=>s.id===a.source);
      const bc = a.level==="error"?"rgba(239,68,68,0.5)":a.level==="warning"?"rgba(245,158,11,0.4)":"rgba(96,165,250,0.3)";
      const ic = a.level==="error"?"#f87171":a.level==="warning"?"#fbbf24":"#60a5fa";
      const ibg= a.level==="error"?"rgba(239,68,68,0.14)":a.level==="warning"?"rgba(245,158,11,0.12)":"rgba(96,165,250,0.12)";
      return <div key={a.id} style={{ background:"rgba(8,10,28,0.95)", backdropFilter:"blur(20px)", border:`1px solid ${bc}`, borderRadius:14, padding:"14px 16px", animation:"nexSlide 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:ibg,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <i className={`ti ${src?.icon||"ti-alert"}`} style={{ fontSize:15,color:ic }}/>
            </div>
            <div>
              <div style={{ fontSize:12,fontWeight:700,color:"#e2e8f0",fontFamily:"monospace" }}>{a.title}</div>
              <div style={{ fontSize:10,color:"rgba(148,163,184,0.55)" }}>{src?.name} · just now</div>
            </div>
          </div>
          <button onClick={()=>onDismiss(a.id)} style={{ background:"none",border:"none",color:"rgba(148,163,184,0.45)",cursor:"pointer",fontSize:16,padding:2,lineHeight:1 }}>
            <i className="ti ti-x"/>
          </button>
        </div>
        <p style={{ fontSize:12,color:"rgba(148,163,184,0.8)",margin:"0 0 10px",lineHeight:1.5 }}>{a.body}</p>
        <div style={{ display:"flex",gap:8 }}>
          {a.fixable && <button onClick={()=>onFix(a)} style={{ flex:1,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(167,139,250,0.4)",background:"rgba(167,139,250,0.12)",color:"#a78bfa",fontSize:11,cursor:"pointer",fontFamily:"monospace",fontWeight:700 }}>
            <i className="ti ti-wand" style={{ marginRight:5 }}/>AUTO-FIX
          </button>}
          <button onClick={()=>onInvestigate(a)} style={{ flex:1,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",color:"#94a3b8",fontSize:11,cursor:"pointer",fontFamily:"monospace" }}>
            <i className="ti ti-search" style={{ marginRight:5 }}/>INVESTIGATE
          </button>
        </div>
      </div>;
    })}
  </div>;
}

// ── chat message ──────────────────────────────────────────────────────────────
function ChatMsg({ msg }) {
  const isU = msg.role==="user";
  const [fs, setFs] = useState("idle");
  return <div style={{ display:"flex",flexDirection:"column",alignItems:isU?"flex-end":"flex-start",marginBottom:18,animation:"nexFade 0.3s ease" }}>
    {!isU && msg.tools?.length>0 && (
      <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:7,maxWidth:"87%" }}>
        {msg.tools.map((t,i)=><ToolBadge key={i} id={t.id} status={t.status}/>)}
      </div>
    )}
    <div style={{ maxWidth:"87%",padding:"12px 16px",borderRadius:isU?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isU?"linear-gradient(135deg,rgba(124,58,237,0.75),rgba(99,102,241,0.72))":"rgba(255,255,255,0.05)",border:isU?"none":"1px solid rgba(255,255,255,0.09)",fontSize:14,lineHeight:1.65,color:"#e2e8f0",fontFamily:"'DM Sans',sans-serif",whiteSpace:"pre-wrap" }}>
      {msg.content||<Dots/>}
    </div>
    {!isU && msg.fixDiff && msg.fixFile && (
      <div style={{ maxWidth:"87%",marginTop:4 }}>
        <DiffView diff={msg.fixDiff} file={msg.fixFile}/>
        <div style={{ display:"flex",gap:8,marginTop:8 }}>
          {fs==="idle"&&<>
            <button onClick={()=>setFs("applied")} style={{ padding:"7px 16px",borderRadius:8,border:"1px solid rgba(34,197,94,0.35)",background:"rgba(34,197,94,0.1)",color:"#86efac",fontSize:12,cursor:"pointer",fontFamily:"monospace",fontWeight:700 }}><i className="ti ti-check" style={{ marginRight:5 }}/>APPLY FIX</button>
            <button onClick={()=>setFs("rejected")} style={{ padding:"7px 16px",borderRadius:8,border:"1px solid rgba(239,68,68,0.3)",background:"rgba(239,68,68,0.07)",color:"#fca5a5",fontSize:12,cursor:"pointer",fontFamily:"monospace" }}><i className="ti ti-x" style={{ marginRight:5 }}/>REJECT</button>
          </>}
          {fs==="applied"&&<span style={{ fontSize:12,color:"#86efac",fontFamily:"monospace" }}><i className="ti ti-check" style={{ marginRight:5 }}/>Committed to fix/nexus-{Date.now().toString(36)}</span>}
          {fs==="rejected"&&<span style={{ fontSize:12,color:"#fca5a5",fontFamily:"monospace" }}><i className="ti ti-x" style={{ marginRight:5 }}/>Fix rejected — issue kept open</span>}
        </div>
      </div>
    )}
    <span style={{ fontSize:10,color:"rgba(148,163,184,0.35)",marginTop:4,fontFamily:"monospace" }}>{msg.ts}</span>
  </div>;
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]           = useState("connect");
  const [repoUrl,setRepoUrl]   = useState("");
  const [connected,setConnected] = useState(false);
  const [connecting,setConnecting] = useState(false);
  const [repoInfo,setRepoInfo] = useState(null);
  const [sources,setSources]   = useState(SOURCE_DEFS.map(s=>({...s,status:"offline",latency:0,events:0,lastSync:"—"})));
  const [issues,setIssues]     = useState([]);
  const [popups,setPopups]     = useState([]);
  const [messages,setMessages] = useState([]);
  const [input,setInput]       = useState("");
  const [chatBusy,setChatBusy] = useState(false);
  const [monitoring,setMonitoring] = useState(false);
  const monRef   = useRef(null);
  const idxRef   = useRef(0);
  const endRef   = useRef(null);
  const taRef    = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  // live jitter
  useEffect(()=>{
    if(!connected) return;
    const t=setInterval(()=>{
      setSources(p=>p.map(s=>s.status==="online"?{...s,latency:Math.max(4,s.latency+Math.floor(Math.random()*14-7)),events:s.events+Math.floor(Math.random()*3),lastSync:Math.random()>0.65?"1s ago":s.lastSync}:s));
    },2000);
    return ()=>clearInterval(t);
  },[connected]);

  // monitoring ticker
  useEffect(()=>{
    if(!monitoring){clearInterval(monRef.current);return;}
    monRef.current=setInterval(()=>{
      const tpl=ISSUE_POOL[idxRef.current%ISSUE_POOL.length];
      idxRef.current++;
      const iss=mkIssue(tpl);
      setIssues(p=>[iss,...p]);
      setPopups(p=>[iss,...p].slice(0,3));
      setSources(p=>p.map(s=>s.id===tpl.source?{...s,events:s.events+1,lastSync:"just now"}:s));
    },6000);
    return ()=>clearInterval(monRef.current);
  },[monitoring]);

  // ── connect ──
  const connect = async ()=>{
    if(!repoUrl.trim()||connecting) return;
    setConnecting(true);
    for(let i=0;i<SOURCE_DEFS.length;i++){
      await new Promise(r=>setTimeout(r,380));
      setSources(p=>p.map((s,j)=>j===i?{...s,status:"connecting"}:s));
      await new Promise(r=>setTimeout(r,320));
      const err=SOURCE_DEFS[i].id==="sentry";
      const wrn=SOURCE_DEFS[i].id==="datadog";
      setSources(p=>p.map((s,j)=>j===i?{...s,status:err?"error":wrn?"warning":"online",latency:err?0:Math.floor(Math.random()*80+10),events:Math.floor(Math.random()*200+20),lastSync:"just now"}:s));
    }
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:500,messages:[{role:"user",content:`You connected to GitHub repo: ${repoUrl}. Reply ONLY with valid JSON, no markdown: {"repoName":"...","description":"one sentence","language":"..."}`}]})});
      const d=await r.json();
      const txt=d.content?.map(c=>c.text||"").join("").replace(/```json|```/g,"").trim();
      try{setRepoInfo(JSON.parse(txt));}catch{setRepoInfo({repoName:repoUrl.split("/").pop()||"repository",description:"Repository connected",language:"TypeScript"});}
    }catch{setRepoInfo({repoName:repoUrl.split("/").pop()||"repository",description:"Repository connected",language:"TypeScript"});}
    setConnected(true);setConnecting(false);setMonitoring(true);setTab("dashboard");
    setMessages([{role:"assistant",content:`Connected to ${repoUrl}.\n\nAll 6 enterprise sources are now linked. Continuous monitoring is active — I'll surface bugs, security issues, and anomalies in real time as pop-up alerts.\n\nAsk me anything or click AUTO-FIX on any detected issue.`,tools:SOURCE_DEFS.filter(s=>s.id!=="sentry").map(s=>({id:s.id,status:"done"})),ts:new Date().toLocaleTimeString()}]);
  };

  // ── auto-fix ──
  const handleFix = async (iss)=>{
    setPopups(p=>p.filter(x=>x.id!==iss.id));
    setIssues(p=>p.map(i=>i.id===iss.id?{...i,fixing:true}:i));
    setTab("agent");
    const tools=[SOURCE_DEFS.find(s=>s.id===iss.source),...SOURCE_DEFS.filter(s=>s.id!==iss.source).slice(0,2)].map(s=>({id:s.id,status:"loading"}));
    setMessages(p=>[...p,
      {role:"user",content:`Fix this issue: ${iss.title} — ${iss.body}`,ts:new Date().toLocaleTimeString()},
      {role:"assistant",content:"",tools,ts:new Date().toLocaleTimeString()}
    ]);
    setChatBusy(true);
    for(let i=0;i<tools.length;i++){
      await new Promise(r=>setTimeout(r,480));
      setMessages(p=>p.map((m,j)=>j===p.length-1?{...m,tools:m.tools.map((t,k)=>k===i?{...t,status:"done"}:t)}:m));
    }
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`Enterprise AI agent. Issue: "${iss.title}" — ${iss.body}. Repo: ${repoUrl}. Explain root cause in 2-3 sentences, which sources you queried, and what the fix addresses. Be technical. No code in your text — a diff will be shown separately.`}]})});
      const d=await r.json();
      const txt=d.content?.map(c=>c.text||"").join("")||"Analyzed and prepared fix.";
      setMessages(p=>p.map((m,j)=>j===p.length-1?{...m,content:txt,fixDiff:iss.fixDiff||null,fixFile:iss.fixFile||null,ts:new Date().toLocaleTimeString()}:m));
    }catch{
      setMessages(p=>p.map((m,j)=>j===p.length-1?{...m,content:`Diagnosed: ${iss.title}. Fix ready for review.`,fixDiff:iss.fixDiff||null,fixFile:iss.fixFile||null,ts:new Date().toLocaleTimeString()}:m));
    }
    setIssues(p=>p.map(i=>i.id===iss.id?{...i,fixing:false,fixed:true,status:"fixed"}:i));
    setChatBusy(false);
  };

  // ── chat send ──
  const sendChat = async ()=>{
    if(!input.trim()||chatBusy) return;
    const q=input.trim(); setInput(""); setChatBusy(true);
    const ql=q.toLowerCase();
    const picked=SOURCE_DEFS.filter(s=>(
      ((ql.includes("github")||ql.includes("pr")||ql.includes("ci")||ql.includes("pipeline")||ql.includes("branch"))&&s.id==="github")||
      ((ql.includes("database")||ql.includes("sql")||ql.includes("query")||ql.includes("postgres"))&&s.id==="postgres")||
      ((ql.includes("slack")||ql.includes("team")||ql.includes("message"))&&s.id==="slack")||
      ((ql.includes("error")||ql.includes("crash")||ql.includes("exception")||ql.includes("sentry"))&&s.id==="sentry")||
      ((ql.includes("metric")||ql.includes("latency")||ql.includes("monitor")||ql.includes("spike"))&&s.id==="datadog")||
      ((ql.includes("ticket")||ql.includes("sprint")||ql.includes("jira")||ql.includes("issue")||ql.includes("bug"))&&s.id==="jira")
    ));
    const tools=(picked.length?picked:SOURCE_DEFS.slice(0,3)).map(s=>({id:s.id,status:"loading"}));
    setMessages(p=>[...p,
      {role:"user",content:q,ts:new Date().toLocaleTimeString()},
      {role:"assistant",content:"",tools,ts:new Date().toLocaleTimeString()}
    ]);
    for(let i=0;i<tools.length;i++){
      await new Promise(r=>setTimeout(r,450));
      setMessages(p=>p.map((m,j)=>j===p.length-1?{...m,tools:m.tools.map((t,k)=>k===i?{...t,status:"done"}:t)}:m));
    }
    // check if user wants a fix
    const matchIss = (ql.includes("fix")||ql.includes("resolve")||ql.includes("patch")) && issues.find(i=>!i.fixed&&i.fixable&&ql.includes(i.title.toLowerCase().split(" ")[0]));
    const sys=`You are Nexus Agent, an enterprise AI system monitoring ${SOURCE_DEFS.map(s=>s.name).join(", ")} for ${repoUrl||"the workspace"}. Open issues: ${issues.filter(i=>!i.fixed).map(i=>i.title).join(", ")||"none"}. Be specific, technical, actionable. Reference file paths, PR numbers, ticket IDs.`;
    try{
      const hist=messages.filter(m=>m.content).slice(-6).map(m=>({role:m.role,content:m.content}));
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:800,system:sys,messages:[...hist,{role:"user",content:q}]})});
      const d=await r.json();
      const txt=d.content?.map(c=>c.text||"").join("")||"No response.";
      setMessages(p=>p.map((m,j)=>j===p.length-1?{...m,content:txt,fixDiff:matchIss?matchIss.fixDiff:null,fixFile:matchIss?matchIss.fixFile:null,ts:new Date().toLocaleTimeString()}:m));
    }catch{
      setMessages(p=>p.map((m,j)=>j===p.length-1?{...m,content:"Error contacting Claude API.",ts:new Date().toLocaleTimeString()}:m));
    }
    setChatBusy(false);
  };

  const G = { background:"rgba(255,255,255,0.035)", backdropFilter:"blur(18px)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:16 };
  const onln = sources.filter(s=>s.status==="online").length;
  const openN = issues.filter(i=>!i.fixed).length;
  const fixedN = issues.filter(i=>i.fixed).length;

  return <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
      @keyframes nexSpin{to{transform:rotate(360deg)}}
      @keyframes nexPulse{0%,100%{opacity:.25;transform:scale(.75)}50%{opacity:1;transform:scale(1)}}
      @keyframes nexFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes nexSlide{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
      @keyframes nexScan{0%{top:-10%}100%{top:110%}}
      *{box-sizing:border-box;margin:0;padding:0;scrollbar-width:thin;scrollbar-color:rgba(167,139,250,0.22) transparent}
      ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.22);border-radius:2px}
      body{background:#040816;font-family:'DM Sans',sans-serif}
      .nx-tab{background:none;border:none;cursor:pointer;font-family:monospace;font-size:11px;font-weight:700;padding:7px 14px;border-radius:8px;transition:all .2s;letter-spacing:.06em;display:flex;align-items:center;gap:6px}
      .nx-tab.on{background:rgba(167,139,250,.18);color:#a78bfa;border:1px solid rgba(167,139,250,.35)}
      .nx-tab.off{color:rgba(148,163,184,.5);border:1px solid transparent}
      .nx-tab.off:hover:not(:disabled){color:#94a3b8;background:rgba(255,255,255,.04)}
      .nx-tab:disabled{opacity:.3;cursor:default}
      .nx-btn{background:linear-gradient(135deg,#7c3aed,#6366f1);border:none;border-radius:10px;padding:10px 18px;cursor:pointer;color:#fff;font-family:monospace;font-size:12px;font-weight:700;letter-spacing:.05em;transition:all .2s;white-space:nowrap}
      .nx-btn:hover:not(:disabled){filter:brightness(1.15);transform:scale(1.02)}
      .nx-btn:disabled{opacity:.4;cursor:not-allowed}
      .nx-ghost{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:7px 14px;cursor:pointer;color:#94a3b8;font-family:monospace;font-size:11px;transition:all .2s}
      .nx-ghost:hover{background:rgba(255,255,255,.08);color:#e2e8f0}
      .nx-input{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:11px 14px;color:#e2e8f0;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border .2s;width:100%}
      .nx-input:focus{border-color:rgba(167,139,250,.4)}
      textarea.nx-input{resize:none;line-height:1.5}
      .chip{display:inline-block;padding:5px 11px;border-radius:20px;background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);color:#a78bfa;font-size:11px;cursor:pointer;transition:all .2s;font-family:'DM Sans',sans-serif}
      .chip:hover{background:rgba(167,139,250,.18);transform:translateY(-1px)}
    `}</style>

    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#040816 0%,#080d28 55%,#060310 100%)", color:"#e2e8f0", position:"relative" }}>
      {/* orbs */}
      <div style={{ position:"fixed",top:-300,left:-200,width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.07) 0%,transparent 70%)",pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"fixed",bottom:-300,right:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 70%)",pointerEvents:"none",zIndex:0 }}/>

      {/* ── header ── */}
      <div style={{ ...G, borderRadius:0,borderLeft:"none",borderRight:"none",borderTop:"none",padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden" }}>
            <i className="ti ti-cpu" style={{ fontSize:20,color:"white" }}/>
            <div style={{ position:"absolute",left:0,right:0,height:3,background:"rgba(255,255,255,.28)",animation:"nexScan 2s linear infinite" }}/>
          </div>
          <div>
            <div style={{ fontSize:15,fontWeight:700,fontFamily:"monospace",letterSpacing:".08em",color:"#e2e8f0" }}>NEXUS<span style={{ color:"#a78bfa" }}>.</span>AGENT</div>
            <div style={{ fontSize:10,color:"rgba(148,163,184,.45)",letterSpacing:".05em" }}>Enterprise AI Operations Platform</div>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          {[{id:"connect",icon:"ti-plug-connected",label:"CONNECT"},{id:"dashboard",icon:"ti-layout-dashboard",label:"DASHBOARD"},{id:"agent",icon:"ti-message-chatbot",label:"AGENT"},{id:"issues",icon:"ti-alert-circle",label:"ISSUES",badge:openN}].map(t=>(
            <button key={t.id} className={`nx-tab ${tab===t.id?"on":"off"}`} onClick={()=>setTab(t.id)} disabled={!connected&&t.id!=="connect"}>
              <i className={`ti ${t.icon}`} style={{ fontSize:13 }}/>{t.label}
              {t.badge>0&&<span style={{ background:"#ef4444",color:"#fff",fontSize:9,borderRadius:10,padding:"1px 6px",fontWeight:700 }}>{t.badge}</span>}
            </button>
          ))}
          <div style={{ width:1,height:22,background:"rgba(255,255,255,.08)",margin:"0 6px" }}/>
          {connected&&<>
            <div style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#22c55e",fontFamily:"monospace" }}><Dot status="online"/>{onln}/{SOURCE_DEFS.length}</div>
            <button onClick={()=>setMonitoring(m=>!m)} className="nx-ghost" style={{ fontSize:10,padding:"5px 10px",color:monitoring?"#a78bfa":"#64748b",borderColor:monitoring?"rgba(167,139,250,.35)":"rgba(255,255,255,.08)" }}>
              <i className={`ti ${monitoring?"ti-player-pause":"ti-player-play"}`} style={{ marginRight:4 }}/>{monitoring?"MONITORING":"PAUSED"}
            </button>
          </>}
        </div>
      </div>

      <div style={{ maxWidth:1280,margin:"0 auto",padding:"24px 20px",position:"relative",zIndex:1 }}>

        {/* ══ CONNECT ══ */}
        {tab==="connect"&&(
          <div style={{ maxWidth:680,margin:"40px auto" }}>
            <div style={{ textAlign:"center",marginBottom:48 }}>
              <div style={{ fontSize:40,fontWeight:700,fontFamily:"monospace",background:"linear-gradient(135deg,#e2e8f0,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-.02em",marginBottom:12 }}>Connect Your Workspace</div>
              <div style={{ fontSize:16,color:"rgba(148,163,184,.65)",lineHeight:1.65 }}>Paste a GitHub repository URL. Nexus Agent connects to all enterprise sources, begins continuous monitoring, and surfaces issues in real time.</div>
            </div>
            <div style={{ ...G,padding:32,marginBottom:20,background:"rgba(255,255,255,.05)" }}>
              <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.45)",marginBottom:10,letterSpacing:".1em" }}>GITHUB REPOSITORY URL</div>
              <div style={{ display:"flex",gap:10,marginBottom:24 }}>
                <input className="nx-input" value={repoUrl} onChange={e=>setRepoUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&connect()} placeholder="https://github.com/org/repository" style={{ flex:1,fontSize:15 }}/>
                <button className="nx-btn" onClick={connect} disabled={connecting||!repoUrl.trim()} style={{ padding:"11px 22px" }}>
                  {connecting?<><Spin/>&nbsp; Connecting...</>:<><i className="ti ti-plug-connected" style={{ marginRight:6 }}/>Connect</>}
                </button>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
                {sources.map(s=>(
                  <div key={s.id} style={{ padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,.02)",border:`1px solid ${s.status==="offline"?"rgba(255,255,255,.06)":s.status==="online"?s.color+"40":s.status==="error"?"rgba(239,68,68,.3)":s.color+"30"}`,transition:"all .4s" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <i className={`ti ${s.icon}`} style={{ fontSize:16,color:s.status==="offline"?"rgba(148,163,184,.28)":s.color }}/>
                        <span style={{ fontSize:12,fontFamily:"monospace",color:s.status==="offline"?"rgba(148,163,184,.35)":"#e2e8f0" }}>{s.name}</span>
                      </div>
                      {s.status==="connecting"?<Spin/>:<Dot status={s.status}/>}
                    </div>
                    <div style={{ fontSize:10,color:"rgba(148,163,184,.38)" }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
              {[{icon:"ti-eye",col:"#a78bfa",t:"Continuous Monitoring",d:"Agent watches all sources 24/7 and pops up issues the moment they happen"},{icon:"ti-wand",col:"#38bdf8",t:"Auto-Fix Engine",d:"Diagnoses root cause and shows a diff you can apply in one click"},{icon:"ti-layout-dashboard",col:"#f472b6",t:"Unified Dashboard",d:"Live metrics, latency, anomalies, and fix history in one view"}].map((f,i)=>(
                <div key={i} style={{ ...G,padding:"18px 20px" }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize:24,color:f.col,marginBottom:10,display:"block" }}/>
                  <div style={{ fontSize:13,fontWeight:600,color:"#e2e8f0",marginBottom:6 }}>{f.t}</div>
                  <div style={{ fontSize:12,color:"rgba(148,163,184,.55)",lineHeight:1.5 }}>{f.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard"&&connected&&(
          <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
            {repoInfo&&(
              <div style={{ ...G,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,.05)",borderColor:"rgba(167,139,250,.22)" }}>
                <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                  <div style={{ width:44,height:44,borderRadius:12,background:"rgba(167,139,250,.14)",display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <i className="ti ti-brand-github" style={{ fontSize:22,color:"#a78bfa" }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:16,fontWeight:700,fontFamily:"monospace",color:"#e2e8f0" }}>{repoInfo.repoName}</div>
                    <div style={{ fontSize:12,color:"rgba(148,163,184,.55)" }}>{repoInfo.description} · {repoInfo.language}</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  {[{v:openN,l:"OPEN ISSUES",c:"#a78bfa",bg:"rgba(167,139,250,.09)"},{v:fixedN,l:"AUTO-FIXED",c:"#22c55e",bg:"rgba(34,197,94,.08)"}].map((k,i)=>(
                    <div key={i} style={{ textAlign:"center",padding:"8px 18px",background:k.bg,borderRadius:10,border:`1px solid ${k.c}30` }}>
                      <div style={{ fontSize:22,fontWeight:700,fontFamily:"monospace",color:k.c }}>{k.v}</div>
                      <div style={{ fontSize:10,color:"rgba(148,163,184,.45)",fontFamily:"monospace" }}>{k.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14 }}>
              {[{l:"Sources Online",v:`${onln}/${SOURCE_DEFS.length}`,icon:"ti-server",c:"#22c55e"},{l:"Total Events",v:sources.reduce((a,s)=>a+s.events,0).toLocaleString(),icon:"ti-bolt",c:"#a78bfa"},{l:"Avg Latency",v:Math.round(sources.filter(s=>s.status==="online").reduce((a,s)=>a+s.latency,0)/Math.max(1,onln))+"ms",icon:"ti-gauge",c:"#38bdf8"},{l:"Active Issues",v:openN,icon:"ti-alert-triangle",c:"#f87171"}].map((k,i)=>(
                <div key={i} style={{ ...G,padding:"16px 20px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                    <i className={`ti ${k.icon}`} style={{ fontSize:16,color:k.c }}/>
                    <span style={{ fontSize:10,color:"rgba(148,163,184,.45)",fontFamily:"monospace",letterSpacing:".08em" }}>{k.l.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize:30,fontWeight:700,color:k.c,fontFamily:"monospace" }}>{k.v}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.38)",marginBottom:12,letterSpacing:".12em" }}>SOURCE HEALTH</div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                {sources.map(s=>(
                  <div key={s.id} style={{ ...G,padding:"16px 18px",borderColor:s.status==="online"?`${s.color}35`:s.status==="error"?"rgba(239,68,68,.28)":s.status==="warning"?"rgba(245,158,11,.28)":"rgba(255,255,255,.07)",transition:"all .4s" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                        <i className={`ti ${s.icon}`} style={{ fontSize:18,color:s.color }}/>
                        <span style={{ fontSize:13,fontWeight:600,fontFamily:"monospace",color:"#e2e8f0" }}>{s.name}</span>
                      </div>
                      <Dot status={s.status}/>
                    </div>
                    <div style={{ fontSize:11,color:"rgba(148,163,184,.45)",marginBottom:10 }}>{s.desc}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}><LatBar v={s.status==="error"?0:s.latency}/><span style={{ fontSize:11,fontFamily:"monospace",color:"#94a3b8",width:50,textAlign:"right" }}>{s.status==="error"?"—":s.latency+"ms"}</span></div>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"rgba(148,163,184,.38)",fontFamily:"monospace" }}>
                      <span>{s.events.toLocaleString()} events</span><span>synced {s.lastSync}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...G,padding:20 }}>
              <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.38)",marginBottom:16,letterSpacing:".12em" }}>LATENCY OVERVIEW</div>
              <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                {sources.filter(s=>s.status!=="error"&&s.status!=="offline").map(s=>(
                  <div key={s.id} style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <span style={{ width:90,fontSize:11,fontFamily:"monospace",color:"#94a3b8" }}>{s.name}</span>
                    <LatBar v={s.latency}/>
                    <span style={{ width:48,fontSize:11,fontFamily:"monospace",color:"#94a3b8",textAlign:"right" }}>{s.latency}ms</span>
                  </div>
                ))}
              </div>
            </div>
            {issues.length>0&&(
              <div style={{ ...G,padding:20 }}>
                <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.38)",marginBottom:14,letterSpacing:".12em" }}>RECENT DETECTIONS</div>
                {issues.slice(0,5).map(iss=>{
                  const src=SOURCE_DEFS.find(s=>s.id===iss.source);
                  return <div key={iss.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.05)",marginBottom:6 }}>
                    <i className={`ti ${src?.icon}`} style={{ color:src?.color,fontSize:15,flexShrink:0 }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,color:"#e2e8f0",fontWeight:500,marginBottom:2 }}>{iss.title}</div>
                      <div style={{ fontSize:11,color:"rgba(148,163,184,.45)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{iss.body}</div>
                    </div>
                    <Badge level={iss.level}/>
                    {iss.fixed?<span style={{ fontSize:10,color:"#22c55e",fontFamily:"monospace",flexShrink:0 }}><i className="ti ti-check"/> FIXED</span>:iss.fixable?<button onClick={()=>handleFix(iss)} className="nx-ghost" style={{ fontSize:10,padding:"4px 10px",flexShrink:0 }}><i className="ti ti-wand" style={{ marginRight:4 }}/>Fix</button>:null}
                  </div>;
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ AGENT ══ */}
        {tab==="agent"&&connected&&(
          <div style={{ display:"grid",gridTemplateColumns:"1fr 296px",gap:20,height:"calc(100vh - 140px)" }}>
            <div style={{ display:"flex",flexDirection:"column",minHeight:0 }}>
              <div style={{ ...G,flex:1,padding:"20px 24px",overflowY:"auto",minHeight:0,display:"flex",flexDirection:"column" }}>
                {messages.map((m,i)=><ChatMsg key={i} msg={m}/>)}
                <div ref={endRef}/>
              </div>
              <div style={{ ...G,borderRadius:"0 0 16px 16px",borderTop:"1px solid rgba(255,255,255,.05)",padding:"14px 16px" }}>
                <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
                  <textarea ref={taRef} className="nx-input" value={input} onChange={e=>{ setInput(e.target.value); e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,130)+"px"; }} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat();} }} placeholder="Ask anything or say 'fix [issue]'… (Shift+Enter for newline)" rows={1} style={{ flex:1,minHeight:42 }}/>
                  <button className="nx-btn" onClick={sendChat} disabled={chatBusy||!input.trim()} style={{ padding:"10px 14px",flexShrink:0 }}>{chatBusy?<Spin/>:<i className="ti ti-send"/>}</button>
                </div>
                <div style={{ display:"flex",gap:6,marginTop:10,flexWrap:"wrap" }}>
                  {["Why did CI fail?","Fix the slow query","Show open PRs","Fix the memory leak","What's the error spike?"].map((q,i)=>(
                    <span key={i} className="chip" onClick={()=>setInput(q)}>{q}</span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:14,overflowY:"auto" }}>
              <div style={{ ...G,padding:16 }}>
                <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.38)",marginBottom:12,letterSpacing:".12em" }}>LIVE SOURCES</div>
                {sources.map(s=>(
                  <div key={s.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:8,marginBottom:4,background:"rgba(255,255,255,.02)" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize:13,color:s.color }}/>
                      <span style={{ fontSize:11,fontFamily:"monospace",color:"#94a3b8" }}>{s.name}</span>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      {s.status==="online"&&<span style={{ fontSize:10,color:"rgba(148,163,184,.35)",fontFamily:"monospace" }}>{s.latency}ms</span>}
                      <Dot status={s.status}/>
                    </div>
                  </div>
                ))}
              </div>
              {issues.filter(i=>!i.fixed).length>0&&(
                <div style={{ ...G,padding:16,borderColor:"rgba(239,68,68,.2)" }}>
                  <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(239,68,68,.65)",marginBottom:12,letterSpacing:".12em" }}>
                    <i className="ti ti-alert-triangle" style={{ marginRight:5 }}/>OPEN ISSUES
                  </div>
                  {issues.filter(i=>!i.fixed).slice(0,4).map(iss=>(
                    <div key={iss.id} style={{ padding:"9px 10px",borderRadius:8,marginBottom:6,background:iss.level==="error"?"rgba(239,68,68,.06)":"rgba(245,158,11,.06)",border:`1px solid ${iss.level==="error"?"rgba(239,68,68,.18)":"rgba(245,158,11,.18)"}` }}>
                      <div style={{ fontSize:11,color:iss.level==="error"?"#fca5a5":"#fde68a",marginBottom:iss.fixable?5:0,fontWeight:600 }}>{iss.title}</div>
                      {iss.fixable&&<button onClick={()=>handleFix(iss)} style={{ width:"100%",padding:"5px",borderRadius:6,border:"1px solid rgba(167,139,250,.3)",background:"rgba(167,139,250,.08)",color:"#a78bfa",fontSize:10,cursor:"pointer",fontFamily:"monospace",fontWeight:700 }}>
                        <i className="ti ti-wand" style={{ marginRight:4 }}/>AUTO-FIX
                      </button>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ ...G,padding:16 }}>
                <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.38)",marginBottom:10,letterSpacing:".12em" }}>SESSION</div>
                {[["Context turns",messages.length],["Issues detected",issues.length],["Auto-fixed",fixedN],["Sources queried",new Set(messages.flatMap(m=>(m.tools||[]).map(t=>t.id))).size]].map(([l,v],i)=>(
                  <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.04)",fontSize:12,color:"rgba(148,163,184,.55)" }}>
                    <span>{l}</span><span style={{ color:"#a78bfa",fontFamily:"monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ ISSUES ══ */}
        {tab==="issues"&&connected&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <div style={{ fontSize:10,fontWeight:700,fontFamily:"monospace",color:"rgba(148,163,184,.38)",letterSpacing:".12em" }}>ALL DETECTED ISSUES ({issues.length})</div>
            </div>
            {issues.length===0&&(
              <div style={{ ...G,padding:48,textAlign:"center" }}>
                <i className="ti ti-shield-check" style={{ fontSize:40,color:"rgba(34,197,94,.45)",display:"block",marginBottom:12 }}/>
                <div style={{ fontSize:14,color:"rgba(148,163,184,.45)" }}>No issues yet. Monitoring is active — alerts will appear here.</div>
              </div>
            )}
            {issues.map(iss=>{
              const src=SOURCE_DEFS.find(s=>s.id===iss.source);
              return <div key={iss.id} style={{ ...G,padding:"18px 22px",borderRadius:14,borderColor:iss.fixed?"rgba(34,197,94,.2)":iss.level==="error"?"rgba(239,68,68,.2)":iss.level==="warning"?"rgba(245,158,11,.15)":"rgba(255,255,255,.07)",transition:"all .3s" }}>
                <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16 }}>
                  <div style={{ display:"flex",alignItems:"flex-start",gap:14,flex:1 }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:src?.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <i className={`ti ${src?.icon}`} style={{ fontSize:18,color:src?.color }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:5,flexWrap:"wrap" }}>
                        <span style={{ fontSize:14,fontWeight:600,color:"#e2e8f0" }}>{iss.title}</span>
                        <Badge level={iss.level}/>
                        {iss.fixed&&<span style={{ fontSize:10,color:"#22c55e",fontFamily:"monospace",background:"rgba(34,197,94,.1)",padding:"2px 8px",borderRadius:6 }}>✓ FIXED</span>}
                        {iss.fixing&&<span style={{ fontSize:10,color:"#a78bfa",fontFamily:"monospace" }}><Spin/> Fixing...</span>}
                      </div>
                      <div style={{ fontSize:13,color:"rgba(148,163,184,.65)",lineHeight:1.5,marginBottom:8 }}>{iss.body}</div>
                      <div style={{ display:"flex",gap:12,fontSize:11,color:"rgba(148,163,184,.35)",fontFamily:"monospace" }}>
                        <span><i className="ti ti-source-code" style={{ marginRight:4 }}/>{src?.name}</span>
                        <span><i className="ti ti-clock" style={{ marginRight:4 }}/>{iss.time.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex",gap:8,flexShrink:0 }}>
                    {!iss.fixed&&iss.fixable&&<button onClick={()=>handleFix(iss)} className="nx-btn" style={{ padding:"8px 16px",fontSize:11 }} disabled={iss.fixing}><i className="ti ti-wand" style={{ marginRight:5 }}/>AUTO-FIX</button>}
                    <button onClick={()=>{ setTab("agent"); setInput(`Investigate: ${iss.title} — ${iss.body}`); }} className="nx-ghost" style={{ padding:"8px 14px",fontSize:11 }}><i className="ti ti-search" style={{ marginRight:5 }}/>Investigate</button>
                  </div>
                </div>
              </div>;
            })}
          </div>
        )}
      </div>

      <Popup alerts={popups} onDismiss={id=>setPopups(p=>p.filter(x=>x.id!==id))} onFix={iss=>{setPopups(p=>p.filter(x=>x.id!==iss.id));handleFix(iss);}} onInvestigate={iss=>{setPopups(p=>p.filter(x=>x.id!==iss.id));setTab("agent");setInput(`Investigate: ${iss.title} — ${iss.body}`);}}/>
    </div>
  </>;
}
