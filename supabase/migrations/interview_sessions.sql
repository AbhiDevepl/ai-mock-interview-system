-- ============================================================
-- interview_sessions table (FINAL FIXED VERSION)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- Table
-- ============================================================

create table if not exists public.interview_sessions (
  id            uuid        primary key default gen_random_uuid(),

  user_id       uuid        not null
                references auth.users(id) on delete cascade,

  room_id       text        not null,

  role          text        not null,
  level         text        not null,

  tech_stack    text[]      not null default '{}',

  questions     jsonb       not null default '[]',

  status        text        not null default 'pending'
                check (status in ('pending', 'running', 'completed', 'failed')),

  agent_status  text        default 'idle'
                check (agent_status in ('idle', 'starting', 'active', 'error', 'finished')),

  report        jsonb,

  started_at    timestamptz,
  completed_at  timestamptz,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index if not exists idx_sessions_user_id
  on public.interview_sessions (user_id);

create index if not exists idx_sessions_status
  on public.interview_sessions (status);

create index if not exists idx_sessions_created_at
  on public.interview_sessions (created_at desc);

-- ============================================================
-- Auto update updated_at
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at on public.interview_sessions;

create trigger trg_set_updated_at
before update on public.interview_sessions
for each row execute function public.set_updated_at();

-- ============================================================
-- RLS
-- ============================================================

alter table public.interview_sessions enable row level security;

-- DROP existing policies (required)
drop policy if exists "select_own_sessions" on public.interview_sessions;
drop policy if exists "insert_own_sessions" on public.interview_sessions;
drop policy if exists "update_own_sessions" on public.interview_sessions;

-- CREATE policies

create policy "select_own_sessions"
on public.interview_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "insert_own_sessions"
on public.interview_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "update_own_sessions"
on public.interview_sessions
for update
to authenticated
using (auth.uid() = user_id);

-- ============================================================
-- Realtime (SAFE)
-- ============================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
    and tablename = 'interview_sessions'
  ) then
    alter publication supabase_realtime
    add table public.interview_sessions;
  end if;
end
$$;
