import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

export const sessionCookie = "__Host-offer-desk";
export const cookieSettings = { secure: true, httpOnly: true, sameSite: "lax" as const, path: "/" };
export const ownerEmail = () => process.env.OFFER_DESK_OWNER_EMAIL?.trim().toLowerCase();

function signingKey() {
  const secret = process.env.OFFER_DESK_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Configure OFFER_DESK_SESSION_SECRET (32 or more characters).");
  return new TextEncoder().encode(secret);
}

export function allowed(email: string) {
  const staff = (process.env.OFFER_DESK_STAFF_EMAILS ?? "").split(",").map(entry => entry.trim().toLowerCase());
  return Boolean(email && (email === ownerEmail() || staff.includes(email)));
}

export async function signSession(email: string) {
  return new SignJWT({ email }).setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setIssuer("offer-desk").setAudience("staff").setExpirationTime("8h").sign(signingKey());
}

export async function getUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, signingKey(), { algorithms: ["HS256"], issuer: "offer-desk", audience: "staff" });
    return typeof payload.email === "string" && allowed(payload.email) ? { email: payload.email } : null;
  } catch { return null; }
}
