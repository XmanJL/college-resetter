import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params; const { action, reason } = await request.json();
  if (action === "report") await serverSupabaseFetch("community_feedback", { method: "POST", body: JSON.stringify({ session_id: id, user_id: user.id, kind: "report", reason: reason || "other" }) });
  else if (action === "react") {
    const existing = await serverSupabaseFetch<Array<Record<string, unknown>>>(`community_feedback?select=id&session_id=eq.${id}&user_id=eq.${user.id}&kind=eq.reaction`).catch(() => []);
    if (existing?.length) {
      await serverSupabaseFetch(`community_feedback?session_id=eq.${id}&user_id=eq.${user.id}&kind=eq.reaction`, { method: "DELETE" }).catch(() => null);
    } else {
      // The unique index is the final guard if two clicks arrive at once.
      await serverSupabaseFetch("community_feedback", { method: "POST", body: JSON.stringify({ session_id: id, user_id: user.id, kind: "reaction" }) }).catch(() => null);
    }
    const reactions = (await serverSupabaseFetch<Array<Record<string, unknown>>>(`community_feedback?select=id&session_id=eq.${id}&kind=eq.reaction`).catch(() => [])) || [];
    return Response.json({ ok: true, reaction_count: reactions.length, reacted_by_user: !existing?.length });
  }
  else if (action === "hide") await serverSupabaseFetch(`reset_sessions?id=eq.${id}&owner_id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ community_hidden: true }) });
  else return Response.json({ error: "Unknown action" }, { status: 400 });
  return Response.json({ ok: true });
}
