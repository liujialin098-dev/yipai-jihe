alter table public.user_preferences
  add column clothing_preference text not null default 'unrestricted'
    constraint user_preferences_clothing_preference_check
    check (clothing_preference in ('male', 'female', 'unrestricted')),
  add column weather_city text
    constraint user_preferences_weather_city_length
    check (weather_city is null or char_length(weather_city) between 1 and 80),
  add column weather_admin1 text
    constraint user_preferences_weather_admin1_length
    check (weather_admin1 is null or char_length(weather_admin1) between 1 and 80),
  add column weather_latitude double precision
    constraint user_preferences_weather_latitude_range
    check (weather_latitude is null or weather_latitude between -90 and 90),
  add column weather_longitude double precision
    constraint user_preferences_weather_longitude_range
    check (weather_longitude is null or weather_longitude between -180 and 180),
  add column weather_timezone text
    constraint user_preferences_weather_timezone_length
    check (weather_timezone is null or char_length(weather_timezone) between 1 and 80),
  add constraint user_preferences_weather_location_complete check (
    (
      weather_city is null
      and weather_admin1 is null
      and weather_latitude is null
      and weather_longitude is null
      and weather_timezone is null
    )
    or
    (
      weather_city is not null
      and weather_admin1 is not null
      and weather_latitude is not null
      and weather_longitude is not null
      and weather_timezone is not null
    )
  );

alter table public.wardrobe_items
  add column audience text not null default 'unisex'
    constraint wardrobe_items_audience_check
    check (audience in ('male', 'female', 'unisex'));

update public.wardrobe_items
set audience = 'female'
where demo_key in (
  'black-evening-dress',
  'lavender-knit-dress',
  'navy-shirt-dress',
  'blush-date-dress'
);

revoke all on table public.user_preferences from authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

revoke all on table public.wardrobe_items from authenticated;
grant select, insert, update, delete on table public.wardrobe_items to authenticated;
