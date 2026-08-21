create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  demo_key text,
  name text not null
    check (char_length(btrim(name)) between 1 and 60),
  category text not null
    check (category in ('tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories')),
  primary_color text not null
    check (primary_color in ('black', 'white', 'gray', 'navy', 'blue', 'green', 'beige', 'brown', 'red', 'pink', 'purple', 'yellow')),
  material text not null
    check (material in ('cotton', 'linen', 'denim', 'knit', 'wool', 'silk', 'leather', 'synthetic')),
  style text not null
    check (style in ('minimal', 'casual', 'commute', 'elegant', 'sporty', 'vintage')),
  seasons text[] not null,
  occasions text[] not null,
  image_path text not null,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wardrobe_items_demo_key_format
    check (demo_key is null or demo_key ~ '^[a-z0-9-]{1,50}$'),
  constraint wardrobe_items_seasons_valid
    check (
      cardinality(seasons) between 1 and 4
      and seasons <@ array['spring', 'summer', 'autumn', 'winter']::text[]
      and array_position(seasons, null) is null
    ),
  constraint wardrobe_items_occasions_valid
    check (
      cardinality(occasions) between 1 and 5
      and occasions <@ array['commute', 'casual', 'date', 'formal', 'sport']::text[]
      and array_position(occasions, null) is null
    ),
  constraint wardrobe_items_image_owner_path
    check (split_part(image_path, '/', 1) = user_id::text),
  constraint wardrobe_items_user_demo_key_unique
    unique (user_id, demo_key),
  constraint wardrobe_items_user_image_path_unique
    unique (user_id, image_path)
);

create index wardrobe_items_user_status_category_idx
  on public.wardrobe_items (user_id, status, category);

create index wardrobe_items_seasons_idx
  on public.wardrobe_items using gin (seasons);

create index wardrobe_items_occasions_idx
  on public.wardrobe_items using gin (occasions);

create or replace function public.set_wardrobe_item_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_wardrobe_item_updated_at() from public, anon, authenticated;

create trigger set_wardrobe_items_updated_at
before update on public.wardrobe_items
for each row execute function public.set_wardrobe_item_updated_at();

alter table public.wardrobe_items enable row level security;

revoke all on table public.wardrobe_items from anon;
revoke all on table public.wardrobe_items from authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.wardrobe_items to authenticated;

create policy "Users can read their own wardrobe items"
on public.wardrobe_items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own wardrobe items"
on public.wardrobe_items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own wardrobe items"
on public.wardrobe_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own wardrobe items"
on public.wardrobe_items
for delete
to authenticated
using ((select auth.uid()) = user_id);
