export async function stageAttachments(data: FormData) {
  for (const kind of ["file", "video"]) {
    const file = data.get(kind);
    if (!(file instanceof File) || !file.size) continue;
    const ticket = await fetch("/api/uploads", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, size: file.size }),
    });
    if (!ticket.ok) throw new Error("Could not prepare the attachment upload.");
    const { key, url } = await ticket.json() as { key: string; url: string };
    const upload = await fetch(url, { method: "PUT", body: file, credentials: "omit" });
    if (!upload.ok) throw new Error("Could not upload " + file.name + ".");
    data.delete(kind);
    data.set(kind + "Upload", key);
    data.set(kind + "Name", file.name);
  }
}
