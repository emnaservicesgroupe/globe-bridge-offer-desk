import {eq} from "drizzle-orm";
import {getUser} from "../../server/session";
import {downloadUrl} from "../../server/storage";
import {getDb} from "../../../db";
import {offers} from "../../../db/schema";

export async function GET(req: Request) {
  if (!await getUser()) return new Response(null, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const offer = await getDb().select().from(offers).where(eq(offers.id, id)).get();
  if (!offer?.photoKey) return new Response(null, { status: 404 });
  return new Response(null, { status: 307, headers: {
    Location: await downloadUrl(offer.photoKey, false), "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
  } });
}
