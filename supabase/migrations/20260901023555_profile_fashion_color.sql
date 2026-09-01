alter table public.profiles
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_path_check;

alter table public.profiles
  add constraint profiles_avatar_path_check
  check (
    avatar_path is null
    or avatar_path ~ (
      '^' || user_id::text || '/profile/avatar-[0-9a-f-]{36}\.(jpg|png|webp)$'
    )
  );
