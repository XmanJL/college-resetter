import { supabaseConfigured } from "@/lib/supabase";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fallbackName = user?.email?.split("@")[0] || "there";
  return Response.json({
    authenticated: Boolean(user),
    displayName: user?.user_metadata?.display_name || fallbackName,
  });
}
export async function POST(request: Request) {
  if (!supabaseConfigured)
    return Response.json(
      { error: "Add Supabase environment variables to enable accounts." },
      { status: 503 },
    );
  const { action, email, password, displayName } = await request.json();
  const supabase = await createClient();
  const result =
    action === "signup"
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
      : await supabase.auth.signInWithPassword({ email, password });
  if (result.error)
    return Response.json({ error: result.error.message }, { status: 400 });
  const fallbackName = result.data.user?.email?.split("@")[0] || "there";
  const name = result.data.user?.user_metadata?.display_name || fallbackName;
  return Response.json({
    ok: true,
    displayName: name,
    needsConfirmation: !result.data.session,
  });
}
export async function DELETE() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return Response.json({ ok: true });
}
