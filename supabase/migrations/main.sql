-- =====================================================
-- FILE: init_all_safe.sql
-- PURPOSE: Create everything ONLY if not exists
-- =====================================================


-- =====================================================
-- PROFILES TABLE
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;


-- =====================================================
-- PROFILES POLICIES (SAFE CREATE)
-- =====================================================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read their own profile'
  ) then
    create policy "Users can read their own profile"
    on public.profiles
    for select
    using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile"
    on public.profiles
    for insert
    with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);
  end if;
end
$$;


-- =====================================================
-- UNIQUE EMAIL CONSTRAINT (SAFE)
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_unique'
  ) then
    alter table public.profiles
    add constraint profiles_email_unique unique (email);
  end if;
end
$$;


-- =====================================================
-- AUTO CREATE PROFILE FUNCTION (SAFE)
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.email
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


-- =====================================================
-- AUTO CREATE PROFILE TRIGGER (SAFE)
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute procedure public.handle_new_user();
  end if;
end
$$;


-- =====================================================
-- INTERVIEWS TABLE
-- =====================================================

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  role text not null,
  level text not null,
  questions jsonb not null,
  techstack text[] not null,
  type text not null,

  finalized boolean not null default false,
  cover_image text,
  user_name text,
  user_email text,

  created_at timestamptz not null default now()
);

-- =====================================================
-- ENSURE INTERVIEWS COLUMNS EXIST (SAFE)
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'interviews'
      and column_name = 'user_name'
  ) then
    alter table public.interviews add column user_name text;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'interviews'
      and column_name = 'user_email'
  ) then
    alter table public.interviews add column user_email text;
  end if;
end
$$;

alter table public.interviews enable row level security;


-- =====================================================
-- INTERVIEWS POLICIES (SAFE CREATE)
-- =====================================================

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'interviews'
      and policyname = 'Users can read their own interviews'
  ) then
    create policy "Users can read their own interviews"
    on public.interviews
    for select
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'interviews'
      and policyname = 'Users can insert their own interviews'
  ) then
    create policy "Users can insert their own interviews"
    on public.interviews
    for insert
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'interviews'
      and policyname = 'Users can update their own interviews'
  ) then
    create policy "Users can update their own interviews"
    on public.interviews
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'interviews'
      and policyname = 'Users can delete their own interviews'
  ) then
    create policy "Users can delete their own interviews"
    on public.interviews
    for delete
    using (auth.uid() = user_id);
  end if;
end
$$;
