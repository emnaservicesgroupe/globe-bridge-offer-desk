import { getUser, ownerEmail } from "../../server/session";
import { limits, uploadTicket } from "../../server/storage";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user || user.email !== ownerEmail() || req.headers.get("origin") !== new URL(req.url).origin)
    return Response.json({ error: "Owner access required." }, { status: 403 });
  const { kind, size } = await req.json() as { kind: "file" | "video"; size: number };
  if ((kind !== "video" && kind !== "file") || !Number.isSafeInteger(size) || size < 1 || size > limits[kind as keyof typeof limits])
    return Response.json({ error: "Invalid attachment size." }, { status: 400 });
  return Response.json(await uploadTicket(kind, size), { headers: { "Cache-Control": "no-store" } });
}
