-- Auto-create profile when a new Supabase Auth user is created (Day 1 Step 8).
-- Supabase / Postgres: cast `role` to "UserRole" enum (plain text from the brief fails).
-- Uses EXECUTE FUNCTION (Postgres 14+); older `EXECUTE PROCEDURE` also works on Supabase.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r "UserRole";
begin
  r := case trim(coalesce(new.raw_user_meta_data->>'role', ''))
    when 'owner' then 'owner'::"UserRole"
    when 'assistant' then 'assistant'::"UserRole"
    when 'counselor' then 'counselor'::"UserRole"
    else 'counselor'::"UserRole"
  end;

  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    r
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
