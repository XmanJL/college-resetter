import { currentUser, serverSupabaseFetch } from "@/lib/supabase";
export async function GET() {
  const user = await currentUser();
  const posts = (await serverSupabaseFetch<Array<Record<string, unknown>>>("reset_sessions?select=id,owner_id,thought,tags,state,activity,next_step,duration,created_at&visibility=eq.anonymous_community&community_hidden=eq.false&order=created_at.desc").catch(() => [])) || [];
  const reactions = (await serverSupabaseFetch<Array<Record<string, unknown>>>("community_feedback?select=session_id,user_id&kind=eq.reaction").catch(() => [])) || [];
  const reactionCounts = new Map<string, number>();
  const reactedSessionIds = new Set<string>();
  for (const reaction of reactions) {
    const sessionId = String(reaction.session_id || "");
    if (!sessionId) continue;
    reactionCounts.set(sessionId, (reactionCounts.get(sessionId) || 0) + 1);
    if (user && String(reaction.user_id) === String(user.id)) reactedSessionIds.add(sessionId);
  }
  return Response.json(posts.map(({ owner_id, ...post }) => ({
    ...post,
    is_owner: Boolean(user && String(owner_id) === String(user.id)),
    reaction_count: reactionCounts.get(String(post.id)) || 0,
    reacted_by_user: reactedSessionIds.has(String(post.id)),
  })));
}
export async function POST(request: Request) {
  const user = await currentUser(); if (!user) return Response.json({ error: "Sign in to share anonymously." }, { status: 401 });
  const { sessionId } = await request.json();
  if (!sessionId) return Response.json({ error: "Choose a session and write something first." }, { status: 400 });
  const session = await serverSupabaseFetch<Array<Record<string, unknown>>>(`reset_sessions?id=eq.${sessionId}&owner_id=eq.${user.id}&select=id,visibility,thought,tags,state,activity,next_step,duration`);
  if (!session?.[0] || (session[0] as { visibility?: string }).visibility !== "anonymous_community") return Response.json({ error: "Set this session to anonymous community first." }, { status: 403 });
  const source = session[0];
  if (!String(source.thought || "").trim()) return Response.json({ error: "Write a thought before sharing." }, { status: 400 });
  return Response.json(source);
}
