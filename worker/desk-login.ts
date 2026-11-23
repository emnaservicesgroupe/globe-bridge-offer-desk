type Settings = {
  DESK_PASSWORD_HASH?: string;
  DESK_PASSWORD_SALT?: string;
  DESK_SESSION_KEY?: string;
};
const email = "mohamedaloui01984@gmail.com";
const name = "__Host-desk-login";
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, "0")).join("");
function page(error = false) {
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in · Globe Bridge Offer Desk</title><style>*{box-sizing:border-box}body{margin:0;background:#eaf3fc;color:#0a2342;font:17px system-ui;display:grid;place-items:center;min-height:100vh}main{background:white;padding:32px;width:min(92vw,400px);border-radius:14px}label,input,button{display:block;width:100%;margin-top:12px}input,button{padding:12px;font:inherit;border:1px solid #8799aa;border-radius:6px}button{background:#0a2342;color:white;cursor:pointer}</style><main><p>Globe Bridge Offer Desk</p><h1>Sign in</h1>${error ? '<p role="alert">Check your email and password.</p>' : ''}<form action="/desk-login" method="post"><label>Email<input name="email" type="email" required autocomplete="username"></label><label>Password<input name="password" type="password" required autocomplete="current-password"></label><button>Sign in</button></form></main></html>`;
  return new Response(html,{status:error?401:200,headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
export async function deskLogin(request: Request, settings: Settings): Promise<Response | null> {
  const { DESK_PASSWORD_HASH: hash, DESK_PASSWORD_SALT: salt, DESK_SESSION_KEY: secret } = settings;
  const headers = {"Cache-Control":"private, no-store"};
  if (!hash || !salt || !secret) return new Response("Sign-in configuration unavailable.",{status:503,headers});
  const url = new URL(request.url);
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign","verify"]);
  if (url.pathname === "/desk-login") {
    if(request.method === "GET") return page();
    if(request.method !== "POST" || request.headers.get("origin") !== url.origin) return new Response(null,{status:403,headers});
    const fields = await request.formData();
    const password = fields.get("password");
    if(String(fields.get("email")).trim().toLowerCase() !== email || typeof password !== "string" || password.length > 512) return page(true);
    const material = await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:encoder.encode(salt),iterations:100000},material,256);
    if(hex(bits) !== hash) return page(true);
    const expires = String(Math.floor(Date.now()/1000)+28800);
    const sig = hex(await crypto.subtle.sign("HMAC",key,encoder.encode(expires)));
    return new Response(null,{status:303,headers:{...headers,Location:"/","Set-Cookie":name+"="+expires+"."+sig+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800"}});
  }
  const cookie = (request.headers.get("cookie")??"").split(/;\s*/).find(v=>v.startsWith(name+"="))?.slice(name.length+1);
  const parts = cookie?.match(/^(\d{10})\.([a-f0-9]{64})$/);
  if(parts && Number(parts[1]) > Date.now()/1000){
    const bytes=Uint8Array.from(parts[2].match(/../g)!,s=>parseInt(s,16));
    if(await crypto.subtle.verify("HMAC",key,bytes,encoder.encode(parts[1]))) return null;
  }
  if(url.pathname.startsWith("/api/") || request.method !== "GET") return new Response(null,{status:401,headers});
  return new Response(null,{status:302,headers:{...headers,Location:"/desk-login"}});
}
