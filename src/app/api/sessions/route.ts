import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
export async function GET() {
  if (!await currentUser()) return Response.json({ error: "Sign in to view your dashboard." }, { status: 401 });
  return Response.json(await serverSupabaseFetch("reset_sessions?select=*&order=updated_at.desc"));
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to save a reset." }, { status: 401 });
  const body = await request.json();
  const rows = await serverSupabaseFetch("reset_sessions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...body, owner_id: user.id }) });
  return Response.json(Array.isArray(rows) ? rows[0] : rows, { status: 201 });
}
