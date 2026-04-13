-- Auto-create profile when a new Supabase Auth user is created.
-- Version-controlled source of truth — apply with:
--   npx prisma db execute --file prisma/sql/handle_new_user.sql --schema prisma/schema.prisma
-- Never run only in Supabase SQL editor without committing the same SQL here first.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(
      (new.raw_user_meta_data->>'role')::"UserRole",
      'counselor'::"UserRole"
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
