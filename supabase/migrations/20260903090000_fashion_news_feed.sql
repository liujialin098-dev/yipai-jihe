alter table public.user_preferences
  add column fashion_topics text[] not null default array[
    'trend', 'color', 'item', 'occasion', 'seasonal', 'weather'
  ]::text[],
  add column fashion_personalized boolean not null default true,
  add column fashion_unread_enabled boolean not null default true,
  add column fashion_last_prompted_at timestamptz,
  add constraint user_preferences_fashion_topics_check check (
    cardinality(fashion_topics) between 1 and 6
    and fashion_topics <@ array[
      'trend', 'color', 'item', 'occasion', 'seasonal', 'weather'
    ]::text[]
  );

create table public.fashion_content_reads (
  user_id uuid not null references auth.users (id) on delete cascade,
  content_id text not null check (char_length(content_id) between 8 and 96),
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.fashion_content_reads enable row level security;

revoke all on table public.fashion_content_reads from anon;
grant select, insert, update, delete on table public.fashion_content_reads to authenticated;

create policy "Users can read their own fashion content state"
on public.fashion_content_reads
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own fashion content state"
on public.fashion_content_reads
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own fashion content state"
on public.fashion_content_reads
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own fashion content state"
on public.fashion_content_reads
for delete
to authenticated
using ((select auth.uid()) = user_id);
