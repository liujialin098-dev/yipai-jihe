create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '新朋友'
    check (char_length(display_name) between 1 and 40),
  onboarding_state text not null default 'empty_wardrobe'
    check (onboarding_state in ('empty_wardrobe', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preferred_styles text[] not null default array['简约', '休闲']::text[],
  preferred_occasions text[] not null default array['日常', '通勤']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.user_preferences from anon;
grant usage on schema public to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can read their own preferences"
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own preferences"
on public.user_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own preferences"
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('wardrobe-images', 'wardrobe-images', false)
on conflict (id) do update
set public = false;

create policy "Users can read files in their own wardrobe folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can upload files to their own wardrobe folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can update files in their own wardrobe folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users can delete files in their own wardrobe folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wardrobe-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
