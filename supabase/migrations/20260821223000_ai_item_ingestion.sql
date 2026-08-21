alter table public.wardrobe_items
add column source_ingestion_id uuid;

create unique index wardrobe_items_user_source_ingestion_unique
on public.wardrobe_items (user_id, source_ingestion_id)
;

create table public.wardrobe_ingestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_request_id uuid not null,
  image_path text not null unique,
  mime_type text not null
    check (mime_type in ('image/jpeg', 'image/png')),
  byte_size bigint not null
    check (byte_size between 1 and 10485760),
  status text not null default 'uploading'
    check (status in ('uploading', 'uploaded', 'recognizing', 'recognized', 'failed', 'manual', 'confirmed')),
  ai_result jsonb,
  ai_model text,
  recognition_ms integer
    check (recognition_ms is null or recognition_ms >= 0),
  failure_code text
    check (
      failure_code is null
      or failure_code in (
        'not_configured',
        'timeout',
        'rate_limited',
        'provider_error',
        'invalid_result',
        'image_missing'
      )
    ),
  corrected_fields text[] not null default '{}'::text[],
  wardrobe_item_id uuid,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wardrobe_ingestions_user_request_unique
    unique (user_id, client_request_id),
  constraint wardrobe_ingestions_owner_path
    check (
      split_part(image_path, '/', 1) = user_id::text
      and split_part(image_path, '/', 2) = 'ingestions'
    ),
  constraint wardrobe_ingestions_result_state
    check (
      ai_result is null
      or status in ('recognized', 'confirmed')
    ),
  constraint wardrobe_ingestions_corrected_fields_valid
    check (
      corrected_fields <@ array[
        'name',
        'category',
        'primary_color',
        'material',
        'style',
        'seasons',
        'occasions'
      ]::text[]
      and array_position(corrected_fields, null) is null
    )
);

create index wardrobe_ingestions_user_status_expiry_idx
on public.wardrobe_ingestions (user_id, status, expires_at);

create trigger set_wardrobe_ingestions_updated_at
before update on public.wardrobe_ingestions
for each row execute function public.set_wardrobe_item_updated_at();

alter table public.wardrobe_ingestions enable row level security;

revoke all on table public.wardrobe_ingestions from anon;
revoke all on table public.wardrobe_ingestions from authenticated;
grant select, insert, update, delete on table public.wardrobe_ingestions to authenticated;

create policy "Users can read their own wardrobe ingestions"
on public.wardrobe_ingestions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own wardrobe ingestions"
on public.wardrobe_ingestions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own wardrobe ingestions"
on public.wardrobe_ingestions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own wardrobe ingestions"
on public.wardrobe_ingestions
for delete
to authenticated
using ((select auth.uid()) = user_id);
