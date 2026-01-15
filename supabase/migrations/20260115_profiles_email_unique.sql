-- Add unique constraint to profiles email
-- This enforces "one profile per email" at the database level
alter table public.profiles
add constraint profiles_email_unique unique (email);
