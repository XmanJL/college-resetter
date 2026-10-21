import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
function getTagMap(tags: unknown, colors: unknown) {
  const colorMap = colors && typeof colors === "object" ? colors as Record<string, unknown> : {};
  if (tags && typeof tags === "object" && !Array.isArray(tags)) return tags;
  return Object.fromEntries((Array.isArray(tags) ? tags : []).map((tag) => [String(tag), String(colorMap[String(tag)] || "#dcebf3")]));
}
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to view your dashboard." }, { status: 401 });
  return Response.json(await serverSupabaseFetch(`reset_sessions?owner_id=eq.${user.id}&select=*&order=updated_at.desc`));
}
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in to save a reset." }, { status: 401 });
  const body = await request.json();
  const rows = await serverSupabaseFetch("reset_sessions", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({
    thought: body.thought,
    tags: getTagMap(body.tags, body.tag_colors),
    state: body.state,
    activity: body.activity,
    next_step: body.next_step,
    duration: body.duration,
    visibility: body.visibility,
    owner_id: user.id,
  }) });
  return Response.json(Array.isArray(rows) ? rows[0] : rows, { status: 201 });
}
