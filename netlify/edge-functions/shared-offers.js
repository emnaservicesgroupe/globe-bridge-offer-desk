const desk = "https://globe-bridge-offer-desk.mohamedaloui01984.chatgpt.site";
export default function openDesk(request) {
  const url = new URL(request.url);
  return new Response(null, { status: 307, headers: {
    Location: desk + url.pathname + url.search,
    "Cache-Control": "private, no-store",
  } });
}
export const config = { path: "/*" };
