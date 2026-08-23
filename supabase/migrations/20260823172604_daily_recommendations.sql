create table public.daily_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_date date not null,
  occasion text not null
    check (occasion in ('commute', 'casual', 'date', 'formal')),
  weather jsonb not null,
  outfits jsonb not null,
  source text not null
    check (source in ('ai', 'rules')),
  ai_model text,
  generation_ms integer not null
    check (generation_ms between 0 and 15000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_recommendations_user_date_unique
    unique (user_id, recommendation_date),
  constraint daily_recommendations_weather_object
    check (jsonb_typeof(weather) = 'object'),
  constraint daily_recommendations_three_outfits
    check (
      jsonb_typeof(outfits) = 'array'
      and jsonb_array_length(outfits) = 3
    ),
  constraint daily_recommendations_source_model
    check (
      (source = 'ai' and ai_model is not null)
      or (source = 'rules' and ai_model is null)
    )
);

create trigger set_daily_recommendations_updated_at
before update on public.daily_recommendations
for each row execute function public.set_wardrobe_item_updated_at();

alter table public.daily_recommendations enable row level security;

revoke all on table public.daily_recommendations from anon;
revoke all on table public.daily_recommendations from authenticated;
grant select, insert, update, delete on table public.daily_recommendations to authenticated;

create policy "Users can read their own daily recommendations"
on public.daily_recommendations
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own daily recommendations"
on public.daily_recommendations
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own daily recommendations"
on public.daily_recommendations
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own daily recommendations"
on public.daily_recommendations
for delete
to authenticated
using ((select auth.uid()) = user_id);
