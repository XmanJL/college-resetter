-- Reset Room launch schema. Run this in the Supabase SQL editor.
create type public.visibility_state as enum ('private', 'anonymous_community');

create table public.reset_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  thought text not null default '',
  tags jsonb not null default '{}'::jsonb,
  state text not null default '', activity text not null default '',
  next_step text not null default '', duration text not null default '25 minutes',
  visibility public.visibility_state not null default 'private',
  community_hidden boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index reset_sessions_owner_updated on public.reset_sessions(owner_id, updated_at desc);

create table public.community_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reset_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('reaction', 'report')),
  reason text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);
create unique index community_feedback_one_reaction
  on public.community_feedback(session_id, user_id, kind)
  where kind = 'reaction';
create unique index community_feedback_one_report
  on public.community_feedback(session_id, user_id, kind)
  where kind = 'report';

alter table public.reset_sessions enable row level security;
alter table public.community_feedback enable row level security;
create policy "owners manage sessions" on public.reset_sessions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "community sessions are public" on public.reset_sessions for select using (visibility = 'anonymous_community' and community_hidden = false);
create policy "community feedback is readable" on public.community_feedback for select using (
  kind = 'reaction' and exists (
    select 1 from public.reset_sessions
    where reset_sessions.id = community_feedback.session_id
      and reset_sessions.visibility = 'anonymous_community'
      and reset_sessions.community_hidden = false
  )
);
create policy "signed in feedback" on public.community_feedback for insert with check (
  user_id = auth.uid() and exists (
    select 1 from public.reset_sessions
    where reset_sessions.id = community_feedback.session_id
      and reset_sessions.visibility = 'anonymous_community'
      and reset_sessions.community_hidden = false
  )
);
create policy "users manage their reactions" on public.community_feedback for delete using (
  user_id = auth.uid() and kind = 'reaction'
);

create or replace function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin new.updated_at = now(); return new; end; $$;
create trigger reset_sessions_updated before update on public.reset_sessions for each row execute function public.set_updated_at();
