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
-- This is necessary for the initial profile creation during signup
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);
