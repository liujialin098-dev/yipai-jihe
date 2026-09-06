-- Account-owned delivery ledger: retain a theme's first appearance for 30 days.
create table public.fashion_topic_impressions (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_key text not null check (char_length(topic_key) between 1 and 180),
  content_id text not null check (char_length(content_id) between 8 and 96),
  first_seen_at timestamptz not null default now(),
  primary key (user_id, topic_key)
);
alter table public.fashion_topic_impressions enable row level security;
revoke all on public.fashion_topic_impressions from anon;
grant select, insert, update, delete on public.fashion_topic_impressions to authenticated;
create policy fashion_impressions_select on public.fashion_topic_impressions for select to authenticated using ((select auth.uid()) = user_id);
create policy fashion_impressions_insert on public.fashion_topic_impressions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy fashion_impressions_update on public.fashion_topic_impressions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy fashion_impressions_delete on public.fashion_topic_impressions for delete to authenticated using ((select auth.uid()) = user_id);

create function public.record_fashion_impression(p_topic_key text, p_content_id text)
returns void language plpgsql security invoker set search_path = '' as $$
declare changed integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  insert into public.fashion_topic_impressions (user_id, topic_key, content_id)
    values (auth.uid(), p_topic_key, p_content_id)
    on conflict (user_id, topic_key) do update
      set content_id = excluded.content_id, first_seen_at = now()
      where public.fashion_topic_impressions.first_seen_at <= now() - interval '30 days';
  get diagnostics changed = row_count;
  if changed > 0 then
    update public.user_preferences set fashion_last_prompted_at = now()
      where user_id = auth.uid() and fashion_unread_enabled;
  end if;
end;
$$;
revoke all on function public.record_fashion_impression(text, text) from public, anon;
grant execute on function public.record_fashion_impression(text, text) to authenticated;
