import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { cookieSettings } from "../../../server/session";

export async function GET(req: Request) {
  const client = process.env.GOOGLE_CLIENT_ID;
  if (!client || !process.env.GOOGLE_CLIENT_SECRET || (process.env.OFFER_DESK_SESSION_SECRET?.length ?? 0) < 32 || !process.env.OFFER_DESK_OWNER_EMAIL)
    return new Response("The administrator must finish the Google sign-in settings for Offer Desk.", { status: 503 });
  const verifier = randomBytes(48).toString("base64url");
  const state = randomBytes(32).toString("base64url");
  (await cookies()).set("__Host-offer-login", state + "." + verifier, { ...cookieSettings, maxAge: 600 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: client, redirect_uri: new URL("/api/auth/callback", req.url).href,
    response_type: "code", scope: "openid email", state, prompt: "select_account",
    code_challenge: createHash("sha256").update(verifier).digest("base64url"), code_challenge_method: "S256",
  }).toString();
  return Response.redirect(url);
}
