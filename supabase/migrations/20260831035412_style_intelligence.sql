alter table public.wardrobe_items
  add column brand text
    constraint wardrobe_items_brand_length
    check (brand is null or char_length(btrim(brand)) between 1 and 40);

alter table public.wardrobe_items
  drop constraint wardrobe_items_style_check,
  add constraint wardrobe_items_style_check check (
    style in (
      'minimal', 'casual', 'commute', 'elegant', 'sporty', 'vintage',
      'cleanfit', 'streetwear', 'cityboy', 'gorpcore', 'preppy', 'workwear',
      'oldmoney', 'y2k'
    )
  );

alter table public.preference_feedback_events
  drop constraint preference_feedback_events_style_check,
  add constraint preference_feedback_events_style_check check (
    style is null or style in (
      'minimal', 'casual', 'commute', 'elegant', 'sporty', 'vintage',
      'cleanfit', 'streetwear', 'cityboy', 'gorpcore', 'preppy', 'workwear',
      'oldmoney', 'y2k'
    )
  );
