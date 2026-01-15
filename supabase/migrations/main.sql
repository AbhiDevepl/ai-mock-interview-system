-- =====================================================
-- FILE: init_profiles.sql
-- PURPOSE: Create profiles table and RLS policies
-- =====================================================

-- Create a table for public profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policy: Users can read their own profile
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

-- Policy: Users can insert their own profile
-- Required for profile creation during signup
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);


-- =====================================================
-- FILE: hardening_triggers.sql
-- PURPOSE: Auto-create profile on auth.users insert
-- =====================================================

-- Function to handle new user creation
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
  );
  return new;
end;
$$;

-- Trigger to call the function on new auth user creation
create or replace trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


-- =====================================================
-- FILE: profiles_email_unique.sql
-- PURPOSE: Enforce one profile per email
-- =====================================================

-- Add unique constraint to profiles email
-- Enforces one user per email at DB level
alter table public.profiles
add constraint profiles_email_unique unique (email);
