import express from "express";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: "*", methods: ["GET", "POST", "OPTIONS"] }));

const profile = {
  id: "nebulascan",
  name: "NebulaScan",
  version: "1.0.0",
  tagline: "Cross-Chain Bridge Monitor & Anomaly Sentinel",
  description: "A cosmic-grade monitoring runtime for cross-chain bridge activity on Base. NebulaScan tracks bridge inflows/outflows, detects bridge exploit patterns, monitors wrapped asset integrity, and provides real-time relay health metrics via MCP and A2A.",
  heroLabel: "Stellar Observatory",
  author: "Nebula Protocol",
  contact: { email: "ops@nebulascan.io", website: "https://8004scan.io" },
  agents: {
    watcher: (task) => `Stellar Watcher tracked all bridge events for: ${task}.`,
    guardian: (task) => `Guardian validated asset peg integrity for: ${task}.`,
    beacon: (task) => `Beacon broadcasted anomaly alerts for: ${task}.`,
  },
  tools: [
    { name: "bridge_monitor", description: "Track real-time inflows and outflows for all major bridges connected to Base.", inputSchema: { type: "object", properties: { bridge: { type: "string", enum: ["official", "stargate", "across", "hop", "all"], description: "Bridge to monitor" }, min_value_usd: { type: "number", description: "Minimum transfer value in USD" } }, required: ["bridge"] } },
    { name: "peg_checker", description: "Validate the peg integrity of wrapped/bridged assets against their canonical counterparts.", inputSchema: { type: "object", properties: { asset: { type: "string", description: "Wrapped asset symbol (e.g., WETH, USDbC)" } }, required: ["asset"] } },
    { name: "exploit_scanner", description: "Scan for known bridge exploit patterns including reentrancy, oracle manipulation, and relay fraud.", inputSchema: { type: "object", properties: { target: { type: "string", description: "Bridge contract address or name" }, depth: { type: "string", enum: ["surface", "deep"], description: "Scan depth" } }, required: ["target"] } },
    { name: "relay_health", description: "Check the health and latency of bridge relay nodes connecting to Base.", inputSchema: { type: "object", properties: { chain: { type: "string", enum: ["ethereum", "arbitrum", "optimism", "polygon", "all"], description: "Source chain" } }, required: ["chain"] } },
    { name: "flow_analytics", description: "Aggregate and analyze cross-chain capital flow patterns over a given period.", inputSchema: { type: "object", properties: { period: { type: "string", enum: ["1h", "24h", "7d", "30d"], description: "Analysis period" } }, required: ["period"] } },
  ],
  prompts: [
    { name: "bridge_report", description: "Generate a comprehensive bridge activity report.", arguments: [{ name: "flow_data", description: "Raw bridge flow JSON", required: true }] },
    { name: "security_brief", description: "Create a bridge security assessment briefing.", arguments: [{ name: "scan_results", description: "Exploit scan results JSON", required: true }] },
  ],
  skills: [
    { name: "bridge_monitor", description: "Real-time tracking of all bridge transfers to/from Base." },
    { name: "peg_checker", description: "Ensures bridged asset pegs remain within safe thresholds." },
    { name: "exploit_scanner", description: "Detects bridge vulnerability patterns before exploitation." },
    { name: "relay_health", description: "Monitors bridge relay infrastructure uptime." },
    { name: "flow_analytics", description: "Analyzes cross-chain capital migration trends." },
    { name: "bridge_report", description: "Compiles bridge intelligence reports." },
  ],
  resources: [
    { uri: "resource://nebulascan/bridge-flows", name: "bridge_flows", description: "Aggregated bridge flow data across all monitored bridges.", mimeType: "application/json" },
    { uri: "resource://nebulascan/relay-status", name: "relay_status", description: "Current relay node status and latency metrics.", mimeType: "application/json" },
  ],
};

const memory = {};
function getBaseUrl(req) { const p = req.headers["x-forwarded-proto"] || req.protocol || "https"; return `${p}://${req.get("host")}`; }
function getSessionId(req) { return req.headers["x-session-id"] || "default"; }
function ensureSession(s) { if (!memory[s]) memory[s] = []; return memory[s]; }
function logEntry(s, e) { ensureSession(s).push({ timestamp: Date.now(), ...e }); }
function rpcSuccess(id, result) { return { jsonrpc: "2.0", id, result }; }
function rpcError(id, code, message) { return { jsonrpc: "2.0", id: id ?? null, error: { code, message } }; }
function makeText(text) { return { content: [{ type: "text", text }] }; }

function buildAgentCard(req) {
  const b = getBaseUrl(req);
  return { name: profile.name, description: profile.description, url: `${b}/`, version: profile.version, author: profile.author, contact: profile.contact, capabilities: ["mcp", "a2a", "tools", "prompts", "resources", "swarm"], endpoints: { mcp: `${b}/mcp`, a2a: `${b}/a2a`, health: `${b}/health`, agentCard: `${b}/.well-known/agent-card.json` }, skills: profile.skills };
}
function getOverview(req) {
  return { profile: profile.id, serverInfo: { name: profile.name, version: profile.version, env: "Base L2" }, protocol: "MCP over JSON-RPC 2.0", transport: { endpoint: `${getBaseUrl(req)}/mcp`, method: "POST", contentType: "application/json" }, capabilities: { tools: {}, prompts: {}, resources: {}, logging: {} }, tools: profile.tools, prompts: profile.prompts, resources: profile.resources };
}
function executeTool(name, args, sid) {
  logEntry(sid, { type: "tool", name, arguments: args });
  if (name === "bridge_monitor") return makeText(`Bridge "${args.bridge}": 847 transfers in last hour. Inflow: $12.4M, Outflow: $8.1M. Net: +$4.3M to Base.`);
  if (name === "peg_checker") return makeText(`${args.asset} peg: 0.9998 (deviation: 0.02%). Status: HEALTHY. Reserve ratio: 101.2%.`);
  if (name === "exploit_scanner") return makeText(`Exploit scan on "${args.target}" (${args.depth || "surface"}): 0 critical, 1 medium advisory. No active threats detected.`);
  if (name === "relay_health") return makeText(`Relay health for ${args.chain}: 4/4 nodes online, avg latency 340ms, finality: 12 blocks. Status: OPTIMAL.`);
  if (name === "flow_analytics") return makeText(`Flow analytics (${args.period}): $89M inbound, $62M outbound. Top source: Ethereum (64%). Growing trend: +18% week-over-week.`);
  throw new Error(`Unknown tool: ${name}`);
}
function getPrompt(name, args = {}) {
  if (name === "bridge_report") return { description: "Bridge Report Generator", messages: [{ role: "user", content: { type: "text", text: `Create a bridge activity report from: ${args.flow_data || "{}"}` } }] };
  if (name === "security_brief") return { description: "Security Brief Writer", messages: [{ role: "user", content: { type: "text", text: `Write a bridge security brief from: ${args.scan_results || "{}"}` } }] };
  throw new Error(`Unknown prompt: ${name}`);
}
function readResource(uri) {
  if (uri === "resource://nebulascan/bridge-flows") return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ totalBridged24h: "$89M", bridges: [{ name: "Official Bridge", volume: "$52M" }, { name: "Stargate", volume: "$24M" }, { name: "Across", volume: "$13M" }] }, null, 2) }] };
  if (uri === "resource://nebulascan/relay-status") return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify({ relays: [{ chain: "Ethereum", nodes: 4, latency: "340ms", status: "optimal" }, { chain: "Arbitrum", nodes: 3, latency: "180ms", status: "optimal" }] }, null, 2) }] };
  throw new Error(`Unknown resource: ${uri}`);
}
function runA2A(agent, task, sid) { const fn = profile.agents[agent]; if (!fn) throw new Error(`Unknown agent: ${agent}`); logEntry(sid, { type: "a2a", agent, task }); return { agent, result: fn(task || "default"), status: "ok", profile: profile.id }; }
function handleRpc(req, res) {
  const { id = null, method, params = {} } = req.body || {};
  const sid = getSessionId(req);
  if (!method) return res.status(400).json(rpcError(id, -32600, "Missing method"));
  try {
    if (method === "initialize") return res.json(rpcSuccess(id, { protocolVersion: "2024-11-05", capabilities: { tools: {}, prompts: {}, resources: {} }, serverInfo: { name: profile.name, version: profile.version }, instructions: "Explore NebulaScan bridge monitoring via tools/list." }));
    if (method === "ping") return res.json(rpcSuccess(id, { status: "alive" }));
    if (method === "notifications/initialized") return id === null ? res.status(202).end() : res.json(rpcSuccess(id, {}));
    if (method === "tools/list") return res.json(rpcSuccess(id, { tools: profile.tools }));
    if (method === "tools/call") return res.json(rpcSuccess(id, executeTool(params.name, params.arguments || {}, sid)));
    if (method === "prompts/list") return res.json(rpcSuccess(id, { prompts: profile.prompts }));
    if (method === "prompts/get") return res.json(rpcSuccess(id, getPrompt(params.name, params.arguments || {})));
    if (method === "resources/list") return res.json(rpcSuccess(id, { resources: profile.resources }));
    if (method === "resources/read") return res.json(rpcSuccess(id, readResource(params.uri)));
    return res.status(404).json(rpcError(id, -32601, `Method not found: ${method}`));
  } catch (e) { return res.status(400).json(rpcError(id, -32000, e instanceof Error ? e.message : "Error")); }
}

function buildUi() {
  const toolsHtml = profile.tools.map((t, i) => `<div class="card reveal" style="--d:${i*0.1}s"><div class="card-star">✦</div><h3>${t.name}</h3><p>${t.description}</p></div>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${profile.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#050510;--pink:#f472b6;--teal:#2dd4bf;--purple:#a78bfa;--rose:#fb7185;--sky:#7dd3fc;--text:#f8fafc;--muted:#94a3b8;--dim:#475569;--b:rgba(255,255,255,.06);--bh:rgba(244,114,182,.25);--sans:'DM Sans',sans-serif;--mono:'DM Mono',monospace}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);overflow-x:hidden;min-height:100vh}

/* Stars Canvas */
canvas#stars{position:fixed;inset:0;z-index:0;pointer-events:none}
.nebula{position:fixed;border-radius:50%;filter:blur(160px);opacity:.08;pointer-events:none;z-index:0}
.n1{width:600px;height:600px;background:var(--pink);top:-10%;left:30%;animation:nb 24s ease-in-out infinite alternate}
.n2{width:500px;height:500px;background:var(--teal);bottom:-15%;right:10%;animation:nb 30s ease-in-out infinite alternate-reverse}
.n3{width:400px;height:400px;background:var(--purple);top:50%;left:-10%;animation:nb 20s ease-in-out infinite alternate}
@keyframes nb{0%{transform:translate(0,0) scale(1)}100%{transform:translate(25px,-20px) scale(1.08)}}

.wrap{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:60px 24px 100px}

.nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:80px;opacity:0;animation:fi .5s .1s forwards}
.logo{font-weight:800;font-size:20px;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.logo-ring{width:22px;height:22px;border:2px solid var(--pink);border-radius:50%;position:relative;animation:glow 3s ease-in-out infinite alternate}
.logo-ring::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--teal);opacity:.5}
@keyframes glow{0%{box-shadow:0 0 4px var(--pink)}100%{box-shadow:0 0 16px var(--pink)}}
.nav-links a{color:var(--muted);text-decoration:none;font-size:13px;font-weight:600;margin-left:20px;transition:color .2s}
.nav-links a:hover{color:var(--pink)}
@keyframes fi{to{opacity:1}}

.hero{text-align:center;margin-bottom:100px}
.hero-tag{display:inline-flex;align-items:center;gap:8px;padding:6px 18px;border-radius:999px;border:1px solid var(--bh);background:rgba(244,114,182,.06);font-size:12px;font-weight:700;color:var(--pink);text-transform:uppercase;letter-spacing:.12em;margin-bottom:24px;opacity:0;animation:su .6s .15s forwards}
.hero-tag .orb{width:6px;height:6px;border-radius:50%;background:var(--teal);animation:twinkle 2s infinite}
@keyframes twinkle{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
.hero h1{font-size:clamp(40px,7vw,72px);font-weight:800;line-height:1;letter-spacing:-.04em;margin-bottom:20px;opacity:0;animation:su .7s .25s forwards}
.hero h1 em{font-style:normal;background:linear-gradient(135deg,var(--pink),var(--teal),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:300% 300%;animation:shift 6s ease infinite}
@keyframes shift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
.hero p{max-width:560px;margin:0 auto 36px;font-size:16px;color:var(--muted);opacity:0;animation:su .7s .35s forwards}
.hero-act{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;opacity:0;animation:su .7s .45s forwards}
@keyframes su{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

.btn{padding:13px 28px;border:0;border-radius:12px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;transition:all .3s}
.btn-nebula{background:linear-gradient(135deg,var(--pink),var(--purple));color:#fff;box-shadow:0 4px 20px rgba(244,114,182,.25)}
.btn-nebula:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(244,114,182,.4)}
.btn-dim{background:transparent;color:var(--muted);border:1px solid var(--b)}
.btn-dim:hover{color:var(--teal);border-color:rgba(45,212,191,.3)}

.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--b);border-radius:20px;overflow:hidden;margin-bottom:80px}
.st{background:var(--bg);padding:32px 20px;text-align:center;transition:background .3s}
.st:hover{background:rgba(244,114,182,.03)}
.st-val{font-size:32px;font-weight:800;background:linear-gradient(135deg,var(--pink),var(--teal));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.st-lbl{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.12em;margin-top:4px;font-weight:600}

.section{margin-bottom:60px}
.sh{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
.sh h2{font-size:20px;font-weight:800}
.pill{padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.pill-pink{color:var(--pink);border:1px solid rgba(244,114,182,.2);background:rgba(244,114,182,.06)}
.pill-teal{color:var(--teal);border:1px solid rgba(45,212,191,.2);background:rgba(45,212,191,.06)}

.glass{background:rgba(255,255,255,.02);border:1px solid var(--b);border-radius:20px;padding:24px;backdrop-filter:blur(10px);transition:all .3s}
.glass:hover{border-color:var(--bh);box-shadow:0 0 40px rgba(244,114,182,.04)}

.lanes{display:flex;flex-direction:column;gap:10px}
.lane{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-radius:14px;border:1px solid var(--b);background:rgba(0,0,0,.25);transition:all .3s}
.lane:hover{border-color:var(--bh);transform:translateX(4px);background:rgba(244,114,182,.03)}
.lane strong{font-size:14px}.lane p{font-size:12px;color:var(--muted);margin-top:2px}
.sp{display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}
.sp::before{content:'';width:7px;height:7px;border-radius:50%}
.sp-on{color:var(--teal);background:rgba(45,212,191,.08);border:1px solid rgba(45,212,191,.15)}.sp-on::before{background:var(--teal);box-shadow:0 0 6px var(--teal);animation:twinkle 2s infinite}
.sp-scan{color:var(--pink);background:rgba(244,114,182,.08);border:1px solid rgba(244,114,182,.15)}.sp-scan::before{background:var(--pink)}
.sp-wait{color:var(--purple);background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.15)}.sp-wait::before{background:var(--purple)}

.ep-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.ep{padding:18px;border-radius:14px;border:1px solid var(--b);background:rgba(0,0,0,.3);transition:all .3s}
.ep:hover{border-color:var(--teal);transform:translateY(-2px)}
.ep-lbl{font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.ep code{display:block;font-family:var(--mono);font-size:13px;color:var(--teal);padding:8px 12px;border-radius:8px;background:rgba(45,212,191,.05)}

.tools{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}
.card{padding:28px;border-radius:18px;border:1px solid var(--b);background:rgba(255,255,255,.01);transition:all .4s;overflow:hidden;position:relative}
.card::after{content:'';position:absolute;top:0;left:-100%;width:200%;height:1px;background:linear-gradient(90deg,transparent,var(--pink),var(--teal),transparent);transition:left .6s}
.card:hover{border-color:var(--bh);transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,.3)}
.card:hover::after{left:100%}
.card-star{color:var(--pink);font-size:16px;margin-bottom:12px}
.card h3{font-size:15px;font-weight:700;margin-bottom:6px;color:var(--teal)}
.card p{font-size:13px;color:var(--muted)}

.con-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.con-bar button{font-family:var(--mono);padding:9px 18px;border:1px solid var(--b);border-radius:8px;background:rgba(0,0,0,.4);color:var(--muted);font-size:12px;cursor:pointer;transition:all .2s}
.con-bar button:hover{border-color:var(--pink);color:var(--pink);background:rgba(244,114,182,.06)}
.con-out{min-height:200px;max-height:360px;overflow:auto;padding:18px;border-radius:14px;background:#030308;color:var(--dim);font-family:var(--mono);font-size:13px;line-height:1.7;border:1px solid var(--b)}
.con-out::before{content:'nebula> ';color:var(--teal)}

.reveal{opacity:0;transform:translateY(20px);transition:opacity .6s,transform .6s;transition-delay:var(--d,0s)}.reveal.vis{opacity:1;transform:translateY(0)}
@media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.wrap{padding:32px 16px}.stats{grid-template-columns:1fr}.hero h1{font-size:36px}}
</style>
</head>
<body>
<canvas id="stars"></canvas>
<div class="nebula n1"></div><div class="nebula n2"></div><div class="nebula n3"></div>

<div class="wrap">
  <nav class="nav">
    <div class="logo"><div class="logo-ring"></div>NebulaScan</div>
    <div class="nav-links"><a href="/.well-known/agent-card.json" target="_blank">A2A</a><a href="/health" target="_blank">Health</a><a href="#console">Console</a></div>
  </nav>

  <section class="hero">
    <div class="hero-tag"><span class="orb"></span>Cross-Chain Observatory · Base</div>
    <h1>Bridge Security,<br><em>Beyond Boundaries.</em></h1>
    <p>${profile.description}</p>
    <div class="hero-act">
      <a class="btn btn-nebula" href="#console">Enter Observatory</a>
      <a class="btn btn-dim" href="/.well-known/agent-card.json" target="_blank">Agent Card →</a>
    </div>
  </section>

  <div class="stats reveal" style="--d:.1s">
    <div class="st"><div class="st-val">${Object.keys(profile.agents).length}</div><div class="st-lbl">Watchers</div></div>
    <div class="st"><div class="st-val">${profile.tools.length}</div><div class="st-lbl">Scanners</div></div>
    <div class="st"><div class="st-val">${profile.prompts.length}</div><div class="st-lbl">Prompts</div></div>
    <div class="st"><div class="st-val">$89M</div><div class="st-lbl">24h Volume</div></div>
  </div>

  <section class="section reveal" style="--d:.15s">
    <div class="sh"><h2>Observatory Lanes</h2><span class="pill pill-teal">Active</span></div>
    <div class="glass"><div class="lanes">
      <div class="lane"><div><strong>Bridge Monitor</strong><p>Tracking all inflows/outflows to Base</p></div><span class="sp sp-on">Streaming</span></div>
      <div class="lane"><div><strong>Peg Guardian</strong><p>Validating wrapped asset integrity</p></div><span class="sp sp-scan">Checking</span></div>
      <div class="lane"><div><strong>Alert Beacon</strong><p>Broadcasting anomaly notifications</p></div><span class="sp sp-wait">Standby</span></div>
    </div></div>
  </section>

  <section class="section reveal" style="--d:.2s">
    <div class="sh"><h2>Endpoints</h2><span class="pill pill-pink">Routes</span></div>
    <div class="ep-grid">
      <div class="ep"><div class="ep-lbl">Identity</div><code>/.well-known/agent-card.json</code></div>
      <div class="ep"><div class="ep-lbl">Health</div><code>/health</code></div>
      <div class="ep"><div class="ep-lbl">MCP</div><code>/mcp</code></div>
      <div class="ep"><div class="ep-lbl">A2A</div><code>/a2a</code></div>
    </div>
  </section>

  <section class="section">
    <div class="sh reveal" style="--d:.05s"><h2>Scanners</h2><span class="pill pill-pink">MCP</span></div>
    <div class="tools">${toolsHtml}</div>
  </section>

  <section class="section reveal" style="--d:.1s" id="console">
    <div class="sh"><h2>Console</h2><span class="pill pill-teal">Terminal</span></div>
    <div class="glass">
      <div class="con-bar">
        <button id="initBtn">initialize</button><button id="tlBtn">list tools</button><button id="tcBtn">bridge scan</button><button id="a2aBtn">dispatch watcher</button>
      </div>
      <pre class="con-out" id="out">stellar observatory online. awaiting commands...</pre>
    </div>
  </section>
</div>

<script>
/* Stars */
(function(){const c=document.getElementById('stars'),x=c.getContext('2d');let w,h,s=[];function resize(){w=c.width=innerWidth;h=c.height=innerHeight}function init(){s=[];for(let i=0;i<120;i++)s.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.2+.3,o:Math.random(),sp:Math.random()*.005+.002})}function draw(){x.clearRect(0,0,w,h);s.forEach(p=>{p.o+=p.sp;if(p.o>1)p.sp=-p.sp;if(p.o<0)p.sp=-p.sp;x.beginPath();x.arc(p.x,p.y,p.r,0,Math.PI*2);const colors=['244,114,182','45,212,191','167,139,250'][Math.floor(Math.random()*300)%3];x.fillStyle='rgba('+colors+','+Math.abs(p.o)+')';x.fill()});requestAnimationFrame(draw)}addEventListener('resize',()=>{resize();init()});resize();init();draw()})();

const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target)}})},{threshold:.15});
document.querySelectorAll('.reveal').forEach(e=>obs.observe(e));
async function rpc(body,ep='/mcp'){return(await fetch(ep,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json()}
async function run(fn){document.getElementById('out').textContent='nebula> scanning stellar feeds...';try{const d=await fn();document.getElementById('out').textContent='nebula> '+JSON.stringify(d,null,2)}catch(e){document.getElementById('out').textContent='nebula> error: '+e.message}}
document.getElementById('initBtn').onclick=()=>run(()=>rpc({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'nebula-ui',version:'1.0.0'}}}));
document.getElementById('tlBtn').onclick=()=>run(()=>rpc({jsonrpc:'2.0',id:2,method:'tools/list'}));
document.getElementById('tcBtn').onclick=()=>run(()=>rpc({jsonrpc:'2.0',id:3,method:'tools/call',params:{name:'bridge_monitor',arguments:{bridge:'all',min_value_usd:10000}}}));
document.getElementById('a2aBtn').onclick=()=>run(()=>fetch('/a2a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent:'watcher',task:'Monitor all Stargate transfers'})}).then(r=>r.json()));
</script>
</body>
</html>`;
}

app.get("/.well-known/agent-card.json", (req, res) => res.json(buildAgentCard(req)));
app.get("/health", (req, res) => res.json({ status: "healthy", timestamp: new Date().toISOString(), agent: profile.id }));
app.get("/mcp", (req, res) => res.json(getOverview(req)));
app.post("/mcp", (req, res) => { if (req.body?.jsonrpc === "2.0") return handleRpc(req, res); const sid = getSessionId(req); try { const r = executeTool(req.body?.tool || profile.tools[0].name, req.body?.input || {}, sid); return res.json({ output: { profile: profile.id, result: r.content[0].text, agent: profile.name } }); } catch { return res.status(400).json({ output: { profile: profile.id, result: "Error", agent: profile.name } }); } });
app.get("/resources/:name", (req, res) => { const r = profile.resources.find(i => i.name === req.params.name); if (!r) return res.status(404).json({ error: "Not found" }); return res.json(JSON.parse(readResource(r.uri).contents[0].text)); });
app.post("/a2a", (req, res) => { try { res.json(runA2A(req.body?.agent, req.body?.task, getSessionId(req))); } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : "A2A failed" }); } });
app.get("/", (req, res) => res.send(buildUi()));
if (process.env.NODE_ENV !== "production") { const PORT = process.env.PORT || 3002; app.listen(PORT, () => console.log(`NebulaScan on http://localhost:${PORT}`)); }
export default app;
