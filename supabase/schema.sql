-- Reset Room launch schema. Run this in the Supabase SQL editor.
create type public.visibility_state as enum ('private', 'personal_only', 'anonymous_community');

create table public.reset_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  thought text not null default '', tags text[] not null default '{}',
  state text not null default '', activity text not null default '',
  next_step text not null default '', duration text not null default '25 minutes',
  visibility public.visibility_state not null default 'private',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index reset_sessions_owner_updated on public.reset_sessions(owner_id, updated_at desc);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reset_sessions(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  topic text not null default 'general', hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.community_reactions (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null, created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.reset_sessions enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports enable row level security;
create policy "owners manage sessions" on public.reset_sessions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "community is opt in" on public.community_posts for select using (hidden = false);
create policy "owners create community posts" on public.community_posts for insert with check (owner_id = auth.uid());
create policy "owners hide community posts" on public.community_posts for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "signed in reactions" on public.community_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "signed in reports" on public.community_reports for insert with check (reporter_id = auth.uid());

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger reset_sessions_updated before update on public.reset_sessions for each row execute function public.set_updated_at();
