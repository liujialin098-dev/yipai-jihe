alter table public.user_preferences
  add column preference_state text not null default 'pending'
    check (preference_state in ('pending', 'completed', 'skipped')),
  add column style_scores jsonb not null default '{}'::jsonb
    check (jsonb_typeof(style_scores) = 'object'),
  add column preference_focus text not null default 'versatile'
    check (preference_focus in ('comfort', 'versatile', 'refined'));

create table public.wardrobe_item_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wardrobe_item_id uuid not null references public.wardrobe_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, wardrobe_item_id)
);

create table public.outfit_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_key text not null,
  title text not null check (char_length(title) between 1 and 60),
  occasion text not null check (occasion in ('commute', 'casual', 'date', 'formal')),
  weather jsonb not null check (jsonb_typeof(weather) = 'object'),
  outfit jsonb not null check (jsonb_typeof(outfit) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, source_key)
);

create table public.preference_feedback_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_key text not null,
  event_type text not null check (
    event_type in (
      'questionnaire', 'view', 'replace', 'favorite_item',
      'unfavorite_item', 'favorite_outfit', 'unfavorite_outfit'
    )
  ),
  style text check (
    style is null or style in (
      'minimal', 'casual', 'commute', 'elegant', 'sporty', 'vintage'
    )
  ),
  weight numeric(6, 2) not null default 0 check (weight between -10 and 10),
  recommendation_id uuid,
  outfit_slot smallint check (outfit_slot is null or outfit_slot between 1 and 3),
  wardrobe_item_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique (user_id, event_key)
);

create index wardrobe_item_favorites_user_created_idx
  on public.wardrobe_item_favorites (user_id, created_at desc);
create index outfit_favorites_user_created_idx
  on public.outfit_favorites (user_id, created_at desc);
create index preference_feedback_events_user_created_idx
  on public.preference_feedback_events (user_id, created_at desc);

alter table public.wardrobe_item_favorites enable row level security;
alter table public.outfit_favorites enable row level security;
alter table public.preference_feedback_events enable row level security;

revoke all on table public.wardrobe_item_favorites from anon, authenticated;
revoke all on table public.outfit_favorites from anon, authenticated;
revoke all on table public.preference_feedback_events from anon, authenticated;
grant select, insert, delete on table public.wardrobe_item_favorites to authenticated;
grant select, insert, delete on table public.outfit_favorites to authenticated;
grant select, insert, update, delete on table public.preference_feedback_events to authenticated;

create policy "Users can read their own item favorites"
on public.wardrobe_item_favorites for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create favorites for their own items"
on public.wardrobe_item_favorites for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.wardrobe_items item
    where item.id = wardrobe_item_id and item.user_id = (select auth.uid())
  )
);
create policy "Users can delete their own item favorites"
on public.wardrobe_item_favorites for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own outfit favorites"
on public.outfit_favorites for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create their own outfit favorites"
on public.outfit_favorites for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can delete their own outfit favorites"
on public.outfit_favorites for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own feedback"
on public.preference_feedback_events for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Users can create their own feedback"
on public.preference_feedback_events for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Users can update their own feedback"
on public.preference_feedback_events for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Users can delete their own feedback"
on public.preference_feedback_events for delete to authenticated
using ((select auth.uid()) = user_id);
