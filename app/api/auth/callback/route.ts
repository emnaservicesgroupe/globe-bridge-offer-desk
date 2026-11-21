import { cookies } from "next/headers";
import { allowed, cookieSettings, sessionCookie, signSession } from "../../../server/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const [state, verifier] = (jar.get("__Host-offer-login")?.value ?? "").split(".");
  jar.delete("__Host-offer-login");
  const code = url.searchParams.get("code");
  if (!code || !state || !verifier || state !== url.searchParams.get("state"))
    return new Response("Sign-in expired or was cancelled. Open the dashboard and sign in again.", { status: 400 });
  const token = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", cache: "no-store", body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: new URL("/api/auth/callback", url).href, grant_type: "authorization_code", code, code_verifier: verifier,
    }),
  });
  if (!token.ok) return new Response("Google could not complete sign-in.", { status: 401 });
  const { access_token } = await token.json() as { access_token?: string };
  if (!access_token) return new Response("Missing Google access token.", { status: 401 });
  const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: "Bearer " + access_token }, cache: "no-store",
  });
  if (!profile.ok) return new Response("Google could not verify the account.", { status: 401 });
  const user = await profile.json() as { email?: string; email_verified?: boolean };
  const email = typeof user.email === "string" ? user.email.toLowerCase() : "";
  if (user.email_verified !== true || !allowed(email)) return new Response("This account has no Offer Desk access.", { status: 403 });
  jar.set(sessionCookie, await signSession(email), { ...cookieSettings, maxAge: 8 * 3600 });
  return Response.redirect(new URL("/", url), 303);
}
