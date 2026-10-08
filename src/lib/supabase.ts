import { createClient as createServerClient } from "@/utils/supabase/server";

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function serverSupabaseFetch<T>(path: string, init: RequestInit = {}) {
  if (!supabaseConfigured) throw new Error("Supabase is not configured");
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = new Headers(init.headers);
  headers.set("apikey", supabaseKey!);
  headers.set("Authorization", `Bearer ${token ?? supabaseKey}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    ...init, headers, cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.status === 204 ? null : (await response.json()) as T;
}

export async function currentUser() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token || !supabaseConfigured) return null;
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: supabaseKey!, Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  return response.ok ? response.json() : null;
}
