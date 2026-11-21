import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

export function getDb() {
  const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_D1_DATABASE_ID: database, CLOUDFLARE_D1_API_TOKEN: token } = process.env;
  if (!account || !database || !token) throw new Error("Configure the existing Cloudflare D1 connection.");
  return drizzle(async (sql, params, method) => {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/d1/database/${encodeURIComponent(database)}/raw`, {
      method: "POST", cache: "no-store",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    if (!response.ok) throw new Error("D1 request failed (" + response.status + ").");
    const data = await response.json() as { success: boolean; result?: { success: boolean; results?: { rows: unknown[][] } }[] };
    const statement = data.result?.[0];
    if (!data.success || !statement?.success) throw new Error("D1 could not execute the query.");
    const rows = statement.results?.rows ?? [];
    return { rows: method === "get" ? rows[0] : rows };
  }, { schema });
}
