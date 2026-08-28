create table public.outfit_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  worn_on date not null,
  title text not null
    check (char_length(btrim(title)) between 1 and 40),
  occasion text not null
    check (occasion in ('commute', 'casual', 'date', 'formal', 'sport')),
  source text not null
    check (source in ('recommendation', 'manual')),
  source_recommendation_id uuid,
  source_outfit_slot smallint,
  item_ids uuid[] not null,
  outfit_snapshot jsonb not null
    check (jsonb_typeof(outfit_snapshot) = 'object'),
  note text not null default ''
    check (char_length(note) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outfit_diary_entries_user_date_unique
    unique (user_id, worn_on),
  constraint outfit_diary_entries_item_count
    check (
      cardinality(item_ids) between 1 and 8
      and array_position(item_ids, null) is null
    ),
  constraint outfit_diary_entries_source_reference
    check (
      (
        source = 'manual'
        and source_recommendation_id is null
        and source_outfit_slot is null
      )
      or (
        source = 'recommendation'
        and source_recommendation_id is not null
        and source_outfit_slot between 1 and 3
      )
    )
);

create index outfit_diary_entries_user_worn_idx
  on public.outfit_diary_entries (user_id, worn_on desc);

create or replace function public.validate_outfit_diary_items()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  unique_item_count integer;
  owned_active_item_count integer;
begin
  select count(*)
  into unique_item_count
  from (
    select distinct submitted.item_id
    from unnest(new.item_ids) as submitted(item_id)
  ) as unique_items;

  if unique_item_count <> cardinality(new.item_ids) then
    raise exception 'outfit diary item_ids must be unique'
      using errcode = '23514';
  end if;

  select count(*)
  into owned_active_item_count
  from public.wardrobe_items as item
  where item.user_id = new.user_id
    and item.status = 'active'
    and item.id = any(new.item_ids);

  if owned_active_item_count <> cardinality(new.item_ids) then
    raise exception 'outfit diary items must be active and owned by the user'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger validate_outfit_diary_items_before_write
before insert or update of user_id, item_ids
on public.outfit_diary_entries
for each row execute function public.validate_outfit_diary_items();

create trigger set_outfit_diary_entries_updated_at
before update on public.outfit_diary_entries
for each row execute function public.set_wardrobe_item_updated_at();

alter table public.outfit_diary_entries enable row level security;

revoke all on table public.outfit_diary_entries from anon, authenticated;
grant select, insert, update, delete
  on table public.outfit_diary_entries to authenticated;

revoke all on function public.validate_outfit_diary_items()
  from public, anon, authenticated;

create policy "Users can read their own outfit diary"
on public.outfit_diary_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own outfit diary"
on public.outfit_diary_entries
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own outfit diary"
on public.outfit_diary_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own outfit diary"
on public.outfit_diary_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);
