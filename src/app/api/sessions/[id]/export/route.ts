import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await currentUser()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const rows = await serverSupabaseFetch<Array<Record<string, unknown>>>(`reset_sessions?id=eq.${id}&select=*`); if (!rows?.[0]) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(JSON.stringify(rows[0], null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="reset-room-${id}.json"` } });
}
