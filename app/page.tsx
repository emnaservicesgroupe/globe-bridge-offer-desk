import Desk from "./Desk";
import { getUser } from "./server/session";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (await getUser()) return <Desk />;
  return <main><h1>Globe Bridge Offer Desk</h1><p>Sign in with your approved work account to view company offers.</p><a href="/api/auth/login">Sign in with Google</a></main>;
}
