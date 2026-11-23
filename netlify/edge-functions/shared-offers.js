const desk = "https://globe-bridge-offer-desk.mohamedaloui01984.chatgpt.site";

export default async function sharedOffers(request, context) {
  const url = new URL(request.url);
  if (url.hostname !== "offerjob.netlify.app") return context.next();
  const writing = request.method === "POST";
  if (!writing && request.method !== "GET") return context.next();

  const headers = new Headers({ Accept: "application/json" });
  if (writing) {
    if (request.headers.get("Origin") !== url.origin) {
      return Response.json({ error: "Invalid origin." }, { status: 403 });
    }
    headers.set("Origin", desk);
    headers.set("Content-Type", request.headers.get("Content-Type") ?? "");
  }

  // Only the public listing and creation operations use the shared desk.
  // Start a fresh request so visitor cookies and identity headers stay local.
  const upstream = await fetch(desk + "/api/offers", {
    method: request.method, headers, body: writing ? request.body : null,
    redirect: "manual",
  });
  if (!upstream.headers.get("Content-Type")?.includes("application/json")) {
    return Response.json({ error: "The shared desk is unavailable." }, { status: 502 });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export const config = { path: "/api/offers" };
