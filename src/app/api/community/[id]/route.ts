import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(); if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await params; const { action, reason } = await request.json();
  if (action === "report") await serverSupabaseFetch("community_reports", { method: "POST", body: JSON.stringify({ post_id: id, reporter_id: user.id, reason: reason || "other" }) });
  else if (action === "react") await serverSupabaseFetch("community_reactions", { method: "POST", body: JSON.stringify({ post_id: id, user_id: user.id }) });
  else if (action === "hide") await serverSupabaseFetch(`community_posts?id=eq.${id}&owner_id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ hidden: true }) });
  else return Response.json({ error: "Unknown action" }, { status: 400 });
  return Response.json({ ok: true });
}
