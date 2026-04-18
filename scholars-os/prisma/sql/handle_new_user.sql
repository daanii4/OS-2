-- Auto-create profile when a new Supabase Auth user is created.
-- Apply with: npx prisma db execute --file prisma/sql/handle_new_user.sql --schema prisma/schema.prisma

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  tid := nullif(trim(coalesce(new.raw_user_meta_data->>'tenant_id', '')), '')::uuid;

  insert into public.profiles (
    id,
    email,
    name,
    role,
    tenant_id,
    must_reset_password,
    onboarding_complete,
    onboarding_step
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(
      (new.raw_user_meta_data->>'role')::"UserRole",
      'counselor'::"UserRole"
    ),
    tid,
    true,
    false,
    0
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
