import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
type Context = { params: Promise<{ id: string }> };
export async function DELETE(_: Request, { params }: Context) {
  if (!await currentUser()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; await serverSupabaseFetch(`reset_sessions?id=eq.${id}`, { method: "DELETE" }); return new Response(null, { status: 204 });
}
export async function GET(_: Request, { params }: Context) {
  if (!await currentUser()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const rows = await serverSupabaseFetch<Array<Record<string, unknown>>>(`reset_sessions?id=eq.${id}&select=*`); return Response.json(rows?.[0] ?? {}, { status: rows?.length ? 200 : 404 });
}
