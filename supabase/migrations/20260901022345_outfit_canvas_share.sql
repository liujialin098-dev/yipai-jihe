alter table public.wardrobe_items
add column cutout_path text;

alter table public.wardrobe_items
add constraint wardrobe_items_cutout_path_owned
check (
  cutout_path is null
  or cutout_path like user_id::text || '/cutouts/%'
);

create table public.outfit_canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 30),
  background_theme text not null default 'lime'
    check (background_theme in ('lime', 'lilac', 'sky', 'coral', 'paper')),
  source_recommendation_id uuid references public.daily_recommendations (id) on delete set null,
  source_slot smallint check (source_slot between 1 and 3),
  items jsonb not null
    check (
      jsonb_typeof(items) = 'array'
      and jsonb_array_length(items) between 2 and 8
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outfit_canvases_user_updated_idx
on public.outfit_canvases (user_id, updated_at desc);

create index outfit_canvases_source_recommendation_idx
on public.outfit_canvases (source_recommendation_id);

alter table public.outfit_canvases enable row level security;

revoke all on table public.outfit_canvases from anon, authenticated;
grant select, insert, update, delete on table public.outfit_canvases to authenticated;

create policy "Users can read their own outfit canvases"
on public.outfit_canvases
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own outfit canvases"
on public.outfit_canvases
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own outfit canvases"
on public.outfit_canvases
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own outfit canvases"
on public.outfit_canvases
for delete
to authenticated
using ((select auth.uid()) = user_id);
