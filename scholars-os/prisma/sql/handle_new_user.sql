-- Auto-create profile when a new Supabase Auth user is created.
-- Apply with: npx prisma db execute --file prisma/sql/handle_new_user.sql --schema prisma/schema.prisma
--
-- Auto-owner allow-list: emails in `auto_owner_emails` are promoted to owner
-- and assigned to the first active tenant on creation. Keep this list in sync
-- with `lib/role-overrides.ts` (canonical source) — both are used together.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  resolved_role "UserRole";
  email_lower text := lower(new.email);
  auto_owner_emails text[] := array[
    'elijahchrim@gmail.com',
    'demarieyanelson12@gmail.com'
  ];
  is_auto_owner boolean := email_lower = any (auto_owner_emails);
begin
  tid := nullif(trim(coalesce(new.raw_user_meta_data->>'tenant_id', '')), '')::uuid;

  -- Auto-owner: ignore any client-supplied role + pick the first active tenant
  -- when no tenant_id was supplied in invite metadata.
  if is_auto_owner then
    resolved_role := 'owner'::"UserRole";
    if tid is null then
      select id into tid
      from public.tenants
      where active = true
      order by created_at asc
      limit 1;
    end if;
  else
    resolved_role := coalesce(
      (new.raw_user_meta_data->>'role')::"UserRole",
      'counselor'::"UserRole"
    );
  end if;

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
    resolved_role,
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
