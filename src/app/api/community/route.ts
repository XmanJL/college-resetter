import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
export async function GET() {
  const posts = await serverSupabaseFetch<Array<Record<string, unknown>>>("community_posts?select=id,body,topic,created_at,community_reactions(count)&hidden=eq.false&order=created_at.desc").catch(() => []);
  return Response.json(posts);
}
export async function POST(request: Request) {
  const user = await currentUser(); if (!user) return Response.json({ error: "Sign in to share anonymously." }, { status: 401 });
  const { sessionId, body, topic } = await request.json();
  if (!sessionId || !body?.trim()) return Response.json({ error: "Choose a session and write something first." }, { status: 400 });
  const session = await serverSupabaseFetch<Array<{ id: string }>>(`reset_sessions?id=eq.${sessionId}&owner_id=eq.${user.id}&select=id,visibility`);
  if (!session?.[0] || (session[0] as { visibility?: string }).visibility !== "anonymous_community") return Response.json({ error: "Set this session to anonymous community first." }, { status: 403 });
  const rows = await serverSupabaseFetch("community_posts", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ session_id: sessionId, owner_id: user.id, body: body.trim(), topic: topic || "general" }) });
  return Response.json(Array.isArray(rows) ? rows[0] : rows, { status: 201 });
}
