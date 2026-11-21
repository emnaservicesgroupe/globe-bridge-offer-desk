import { cookies } from "next/headers";
import { sessionCookie } from "../../../server/session";
export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return new Response(null, { status: 403 });
  (await cookies()).delete(sessionCookie);
  return Response.redirect(new URL("/", req.url), 303);
}
