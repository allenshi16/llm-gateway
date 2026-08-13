import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createRateLimiter, securityHeaders } from "@gateway/core";

const port = Number(process.env["CONSOLE_PORT"] ?? 4200);
const controlPlaneUrl = process.env["CONTROL_PLANE_URL"] ?? "http://127.0.0.1:4100";

function send(response: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(data));
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function sessionCookie(request: IncomingMessage): string | undefined {
  const part = request.headers.cookie?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith("console_session="));
  return part?.slice("console_session=".length);
}

async function proxy(request: IncomingMessage, response: ServerResponse, path: string, upstreamUrl: string): Promise<void> {
  const sid = sessionCookie(request);
  const body = request.method !== "GET" && request.method !== "HEAD" ? await readBody(request) : undefined;
  const headers: Record<string, string> = { ...(sid ? { cookie: `console_session=${sid}` } : {}) };
  if (body) headers["content-type"] = "application/json";
  const init: RequestInit = { method: request.method ?? "GET", headers };
  if (body) init.body = body;
  const upstream = await fetch(`${upstreamUrl}${path}`, init);
  const setCookie = upstream.headers.get("set-cookie");
  const outHeaders: Record<string, string> = { "content-type": upstream.headers.get("content-type") ?? "application/json" };
  if (setCookie) outHeaders["set-cookie"] = setCookie;
  response.writeHead(upstream.status, outHeaders);
  response.end(await upstream.text());
}

const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LLM Gateway Console</title><style>:root{font:16px ui-sans-serif,system-ui;color:#e7ecf3;background:#0b1220}body{margin:0}main{max-width:1150px;margin:36px auto;padding:0 22px}.card{background:#111a2c;border:1px solid #26334d;border-radius:16px;padding:22px;margin:16px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px}input,button,select{font:inherit;padding:11px;border-radius:9px;border:1px solid #33415e;background:#0f1830;color:#e7ecf3;margin:5px 0}input,select{width:100%;box-sizing:border-box}button{background:#2563eb;border:0;cursor:pointer;font-weight:600}button.secondary{background:#33415e}.error{color:#f87171}.secret{font-family:monospace;background:#06281d;border:1px solid #14532d;padding:12px;word-break:break-all;border-radius:8px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:9px;border-bottom:1px solid #26334d}.muted{color:#8ea0bd}h1{letter-spacing:-0.02em}.top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.pill{background:#1f2b45;border-radius:999px;padding:4px 12px;font-size:13px}</style></head><body><main>
<div class="top"><div><h1>LLM Gateway</h1><p class="muted">Multi-tenant LLM API management, billing and key control.</p></div><div id="account" hidden><span id="accountEmail" class="pill"></span> <span id="verifyPill" class="pill" hidden>unverified</span> <button class="secondary" onclick="signOut()">Sign out</button></div></div>
<section id="auth" class="card"><h2>Sign in</h2><input id="email" type="email" placeholder="Email" autocomplete="email"><input id="password" type="password" placeholder="Password" autocomplete="current-password"><button onclick="signIn()">Sign in</button><p class="muted">New here? <a href="#" onclick="showRegister();return false;">Create an account</a> · <a href="#" onclick="showReset();return false;">Forgot password?</a></p><p id="authMsg"></p></section>
<section id="register" class="card" hidden><h2>Create account</h2><input id="regName" placeholder="Display name"><input id="regEmail" type="email" placeholder="Email"><input id="regPassword" type="password" placeholder="Password (min 8)"><button onclick="register()">Create account</button><p id="regMsg"></p></section>
<section id="reset" class="card" hidden><h2>Reset password</h2><input id="resetEmail" type="email" placeholder="Email"><button onclick="requestReset()">Send reset link</button><input id="resetToken" placeholder="Reset token" autocomplete="off"><input id="resetNewPassword" type="password" placeholder="New password (min 8)"><button onclick="doReset()">Set new password</button><p id="resetMsg"></p></section>
<section id="app" hidden>
<div class="grid"><div class="card"><h2>Create organization</h2><input id="orgName" placeholder="Organization name"><input id="orgSlug" placeholder="organization-slug"><input id="wsName" placeholder="Workspace name"><input id="wsSlug" placeholder="workspace-slug"><button onclick="createOrg()">Create</button></div><div class="card"><h2>Your access</h2><div id="orgSwitcher"></div></div></div>
<div class="grid"><div class="card"><h2>API keys</h2><input id="keyName" placeholder="Key name"><select id="keyEnv"><option value="test">test</option><option value="live">live</option></select><button onclick="createKey()">Create key</button><div id="secret"></div><div id="keys"></div></div></div>
<div class="grid"><div class="card"><h2>Models</h2><div id="models"></div></div><div class="card"><h2>Usage</h2><div id="usage"></div><div id="usageDetails"></div></div><div class="card"><h2>Billing</h2><div id="billing"></div><div id="billingPlans"></div><div id="subscription"></div><div id="billingActions"><input id="creditAmount" type="number" step="0.01" min="0" placeholder="USD amount" style="width:30%"><button class="secondary" onclick="devCredit()">Add credit (dev)</button></div><div id="ledger"></div></div></div>
<div class="card"><h2>Members</h2><div id="memberInvite"><input id="inviteEmail" type="email" placeholder="member@example.com" style="width:60%"><select id="inviteRole" style="width:20%"><option value="MEMBER">MEMBER</option><option value="ADMIN">ADMIN</option></select><button class="secondary" onclick="inviteMember()">Invite</button></div><div id="members"></div></div>
<div class="card"><h2>Audit log</h2><div id="audit"></div></div>
<p id="msg"></p></section></main><script>
let ctx=null;const $=id=>document.getElementById(id),api=async(path,opt)=>{const r=await fetch('/api'+path,opt);const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Request failed');return d};
async function signIn(){try{const r=await fetch('/api/v1/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('email').value,password:$('password').value})});const d=await r.json();if(!r.ok)throw Error(d.error||'Login failed');await bootstrap()}catch(e){$('authMsg').className='error';$('authMsg').textContent=e.message}}
async function register(){try{await api('/v1/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('regEmail').value,password:$('regPassword').value,displayName:$('regName').value||undefined})});$('email').value=$('regEmail').value;$('password').value=$('regPassword').value;$('register').hidden=true;$('auth').hidden=false;await signIn()}catch(e){$('regMsg').className='error';$('regMsg').textContent=e.message}}
function showRegister(){$('auth').hidden=true;$('register').hidden=false;$('reset').hidden=true}
function showReset(){$('auth').hidden=true;$('register').hidden=true;$('reset').hidden=false}
async function requestReset(){try{const d=await api('/v1/auth/request-password-reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('resetEmail').value})});$('resetMsg').textContent='Reset requested'+(d.devToken?' — dev token: '+d.devToken:'');}catch(e){$('resetMsg').className='error';$('resetMsg').textContent=e.message}}
async function doReset(){try{await api('/v1/auth/reset-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:$('resetToken').value,password:$('resetNewPassword').value})});$('resetMsg').textContent='Password reset. Sign in again.';$('reset').hidden=true;$('auth').hidden=false}catch(e){$('resetMsg').className='error';$('resetMsg').textContent=e.message}}
async function requestVerify(){try{const d=await api('/v1/auth/request-email-verification',{method:'POST'});prompt('Verification token (dev mode):',d.devToken||'');const t=prompt('Paste verification token:');if(t){await api('/v1/auth/verify-email',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token:t})});$('verifyPill').hidden=true;$('msg').textContent='Email verified'} }catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function signOut(){try{await api('/v1/auth/logout',{method:'POST'})}catch(_){}location.reload()}
async function bootstrap(){const me=await api('/v1/auth/me');$('accountEmail').textContent=me.email;$('account').hidden=false;$('auth').hidden=true;$('register').hidden=true;$('reset').hidden=true;$('app').hidden=false;if(!me.emailVerified){$('verifyPill').hidden=false;$('verifyPill').innerHTML='unverified · <a href="#" onclick="requestVerify();return false;">verify</a>'}else{$('verifyPill').hidden=true}const c=await api('/v1/account/context');renderOrgSwitcher(c.memberships);if(c.memberships.length){ctx=c.memberships[0];await refresh()}}
function renderOrgSwitcher(ms){const uniq=[...new Map(ms.map(m=>[m.organization_id,m])).values()];$('orgSwitcher').innerHTML=uniq.map(o=>'<button class="secondary" onclick="selectOrg(\\''+o.organization_id+'\\')">'+o.organization_name+'</button>').join('')||'<p class="muted">No organizations yet.</p>'}
async function selectOrg(oid){ctx=null;const c=await api('/v1/account/context');const m=c.memberships.filter(x=>x.organization_id===oid&&x.workspace_id);ctx=m[0]||null;await refresh()}
async function createOrg(){try{const d=await api('/v1/account/organizations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:$('orgName').value,slug:$('orgSlug').value,workspaceName:$('wsName').value,workspaceSlug:$('wsSlug').value})});ctx={organization_id:d.organizationId,workspace_id:d.workspaceId};$('msg').textContent='Organization created';await refresh();await bootstrap()}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function createKey(){try{if(!ctx||!ctx.workspace_id)throw Error('Select an organization first');const d=await api('/v1/account/organizations/'+ctx.organization_id+'/workspaces/'+ctx.workspace_id+'/api-keys',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:$('keyName').value,environment:$('keyEnv').value})});$('secret').innerHTML='<p>Copy this secret now; it will not be shown again:</p><div class="secret">'+d.secret+'</div>';await refresh()}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function refresh(){if(!ctx)return;const w=ctx.workspace_id,o=ctx.organization_id;try{const [k,m,u,b,mem,audit]=await Promise.all([api('/v1/control/v1/workspaces/'+w+'/api-keys'),api('/v1/control/v1/workspaces/'+w+'/models'),api('/v1/control/v1/organizations/'+o+'/usage'),api('/v1/control/v1/organizations/'+o+'/billing'),api('/v1/account/organizations/'+o+'/members'),api('/v1/account/organizations/'+o+'/audit')]);renderKeys(k.keys);$('models').innerHTML=m.models.length?'<ul>'+m.models.map(x=>'<li><b>'+x.public_name+'</b><br><span class="muted">'+x.provider+'/'+x.provider_model+' · '+x.route_region+'</span></li>').join('')+'</ul>':'<p class="muted">No approved models.</p>';$('usage').innerHTML='<p>Requests: '+u.usage.request_count+'</p><p>Settled: '+u.usage.settled_count+'</p><p>Charged: $'+u.usage.charged_usd+'</p>';$('billing').innerHTML=b.wallets.map(x=>'<p>'+x.currency+': available <b>'+x.available_balance+'</b>, reserved '+x.reserved_balance+'</p>').join('')||'<p>No wallet.</p>';$('members').innerHTML=mem.members.length?'<table><tr><th>Email</th><th>Role</th></tr>'+mem.members.map(x=>'<tr><td>'+x.email+'</td><td>'+x.role+'</td></tr>').join('')+'</table>':'<p class="muted">No members.</p>';renderAudit(audit.events);await renderBilling()}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function renderBilling(){if(!ctx)return;try{const [plans,payments,ledger,sub]=await Promise.all([api('/v1/account/organizations/'+ctx.organization_id+'/billing/plans'),api('/v1/account/organizations/'+ctx.organization_id+'/billing/payments'),api('/v1/account/organizations/'+ctx.organization_id+'/billing/ledger'),api('/v1/account/organizations/'+ctx.organization_id+'/billing/subscription')]);$('billingPlans').innerHTML='<h3>Plans</h3>'+plans.plans.map(p=>'<p><b>'+p.name+'</b> · $'+(p.unit_amount/100)+'/'+p.billing_interval+' <button class="secondary" onclick="subscribe(\\''+p.id+'\\')">Subscribe</button></p>').join('');$('subscription').innerHTML=sub.subscription?'<p>Subscription: <b>'+sub.subscription.status+'</b> · plan '+sub.subscription.plan_id+'</p>':'<p class="muted">No active subscription.</p>';$('ledger').innerHTML=ledger.entries.length?'<h3>Ledger</h3><table><tr><th>Type</th><th>Direction</th><th>Amount</th><th>Time</th></tr>'+ledger.entries.map(x=>'<tr><td>'+x.type+'</td><td>'+x.direction+'</td><td>'+x.amount+' '+x.currency+'</td><td>'+new Date(x.created_at).toLocaleString()+'</td></tr>').join('')+'</table>':'<h3>Ledger</h3><p class="muted">No ledger entries.</p>'}catch(_){}}
async function inviteMember(){try{if(!ctx)throw Error('Select an organization first');const d=await api('/v1/account/organizations/'+ctx.organization_id+'/invites',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:$('inviteEmail').value,role:$('inviteRole').value})});$('msg').textContent='Invite created. Token: '+d.token;await refresh()}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function loadUsageDetails(){if(!ctx)return;try{const d=await api('/v1/account/organizations/'+ctx.organization_id+'/usage/details');$('usageDetails').innerHTML=d.requests.length?'<table><tr><th>Status</th><th>Region</th><th>Amount</th><th>Created</th></tr>'+d.requests.map(x=>'<tr><td>'+x.status+'</td><td>'+x.region+'</td><td>$'+x.amount_usd+'</td><td>'+new Date(x.created_at).toLocaleString()+'</td></tr>').join('')+'</table>':'<p class="muted">No request detail.</p>'}catch(_){$('usageDetails').innerHTML=''}}
async function devCredit(){try{if(!ctx)throw Error('Select an organization first');await api('/v1/account/organizations/'+ctx.organization_id+'/billing/dev-credit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({amountUsd:$('creditAmount').value})});$('msg').textContent='Credit applied';await refresh()}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function subscribe(planId){try{if(!ctx)throw Error('Select an organization first');const d=await api('/v1/account/organizations/'+ctx.organization_id+'/billing/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({planId})});if(d.mode==='stripe'&&d.url){window.location.href=d.url}else{$('msg').textContent='Dev subscription activated (plan '+planId+')';await refresh()}}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
async function selectOrg(oid){ctx=null;const c=await api('/v1/account/context');const m=c.memberships.filter(x=>x.organization_id===oid&&x.workspace_id);ctx=m[0]||null;await refresh();await loadUsageDetails()}
function renderKeys(keys){$('keys').innerHTML=keys.length?'<table><tr><th>Name</th><th>Prefix</th><th>Status</th><th></th></tr>'+keys.map(x=>'<tr><td>'+x.name+'</td><td>'+x.key_prefix+'</td><td>'+x.status+'</td><td><button class="secondary" onclick="revoke(\\''+x.id+'\\')">Revoke</button></td></tr>').join('')+'</table>':'<p class="muted">No keys.</p>'}
function renderAudit(events){$('audit').innerHTML=events&&events.length?'<table><tr><th>Action</th><th>Resource</th><th>Time</th></tr>'+events.map(x=>'<tr><td>'+x.action+'</td><td>'+x.resource_type+'</td><td>'+new Date(x.created_at).toLocaleString()+'</td></tr>').join('')+'</table>':'<p class="muted">No audit events.</p>'}
async function revoke(id){if(!confirm('Revoke this key?'))return;try{await api('/v1/control/v1/workspaces/'+ctx.workspace_id+'/api-keys/'+id+'/revoke',{method:'POST'});await refresh()}catch(e){$('msg').className='error';$('msg').textContent=e.message}}
(async function(){try{await api('/v1/auth/me');await bootstrap()}catch(_){}})();
</script></body></html>`;

export function createConsoleServer(options: { controlPlaneUrl?: string } = {}): ReturnType<typeof createServer> {
  const upstreamUrl = options.controlPlaneUrl ?? controlPlaneUrl;
  const limiter = createRateLimiter(Number(process.env["CONSOLE_RATE_LIMIT"] ?? 300), 60_000);
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
      const peerIp = request.socket.remoteAddress ?? "unknown";
      if (url.pathname !== "/" && limiter.limited(peerIp)) return send(response, 429, { error: "too_many_requests" });
      for (const [name, value] of Object.entries(securityHeaders())) response.setHeader(name, value);
      if (request.method === "GET" && url.pathname === "/") { response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return response.end(page); }
      if (url.pathname.startsWith("/api/control/")) return proxy(request, response, url.pathname.slice("/api/control".length), upstreamUrl);
      if (url.pathname.startsWith("/api/v1/auth/") || url.pathname.startsWith("/api/v1/account/")) return proxy(request, response, url.pathname.slice("/api".length), upstreamUrl);
      return send(response, 404, { error: "not_found" });
    } catch { return send(response, 500, { error: "console_request_failed" }); }
  });
}

if (process.argv[1]?.endsWith("index.ts") || process.argv[1]?.endsWith("index.js")) createConsoleServer({ controlPlaneUrl }).listen(port, "0.0.0.0");