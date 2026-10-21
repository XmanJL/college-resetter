import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
type Context = { params: Promise<{ id: string }> };
const sessionFields = ["thought", "tags", "state", "activity", "next_step", "duration", "visibility"] as const;

function getTagMap(tags: unknown, colors: unknown) {
  const colorMap = colors && typeof colors === "object" ? colors as Record<string, unknown> : {};
  if (tags && typeof tags === "object" && !Array.isArray(tags)) return tags;
  return Object.fromEntries((Array.isArray(tags) ? tags : []).map((tag) => [String(tag), String(colorMap[String(tag)] || "#dcebf3")]));
}

export async function DELETE(_: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; await serverSupabaseFetch(`reset_sessions?id=eq.${id}&owner_id=eq.${user.id}`, { method: "DELETE" }); return new Response(null, { status: 204 });
}
export async function PATCH(request: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const incoming = await request.json();
  const updates = Object.fromEntries(sessionFields.filter((field) => field in incoming).map((field) => [field, incoming[field]]));
  if ("tags" in incoming || "tag_colors" in incoming) updates.tags = getTagMap(incoming.tags, incoming.tag_colors);
  const rows = await serverSupabaseFetch<Array<Record<string, unknown>>>(`reset_sessions?id=eq.${id}&owner_id=eq.${user.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation", Accept: "application/json" },
    body: JSON.stringify(updates),
  });
  const session = rows?.[0];
  if (!session) return Response.json({ error: "Reset not found." }, { status: 404 });

  return Response.json(session);
}
export async function GET(_: Request, { params }: Context) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params; const rows = await serverSupabaseFetch<Array<Record<string, unknown>>>(`reset_sessions?id=eq.${id}&owner_id=eq.${user.id}&select=*`); return Response.json(rows?.[0] ?? {}, { status: rows?.length ? 200 : 404 });
}
