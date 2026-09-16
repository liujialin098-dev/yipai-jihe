-- 扩展白名单，不修改既有用户选择、权限或RLS。版本与远程迁移历史对齐。
alter table public.user_preferences
  add constraint user_preferences_fashion_topics_eight_check check (
    cardinality(fashion_topics) between 1 and 8
    and fashion_topics <@ array[
      'trend', 'color', 'item', 'occasion', 'seasonal', 'weather', 'street', 'accessory'
    ]::text[]
  ) not valid;
alter table public.user_preferences validate constraint user_preferences_fashion_topics_eight_check;
alter table public.user_preferences drop constraint user_preferences_fashion_topics_check;
alter table public.user_preferences rename constraint user_preferences_fashion_topics_eight_check to user_preferences_fashion_topics_check;
alter table public.user_preferences alter column fashion_topics set default array[
  'trend', 'color', 'item', 'occasion', 'seasonal', 'weather', 'street', 'accessory'
]::text[];
