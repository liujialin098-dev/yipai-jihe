revoke all on table public.profiles from authenticated;
revoke all on table public.user_preferences from authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.user_preferences to authenticated;
