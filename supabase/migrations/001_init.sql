-- Draftly schema: profiles, documents, document_shares + RLS

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  shared_with uuid not null references public.profiles (id) on delete cascade,
  permission text not null check (permission in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  unique (document_id, shared_with)
);

create index if not exists documents_owner_id_idx on public.documents (owner_id);
create index if not exists documents_updated_at_idx on public.documents (updated_at desc);
create index if not exists document_shares_shared_with_idx on public.document_shares (shared_with);
create index if not exists document_shares_document_id_idx on public.document_shares (document_id);

-- Keep profiles in sync when auth users are created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers for RLS
create or replace function public.is_document_owner(doc_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.documents d
    where d.id = doc_id and d.owner_id = auth.uid()
  );
$$;

create or replace function public.document_share_permission(doc_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.permission
  from public.document_shares s
  where s.document_id = doc_id and s.shared_with = auth.uid()
  limit 1;
$$;

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

-- Profiles: users can read profiles (needed for sharing by email) and update own
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Documents
drop policy if exists "documents_select_access" on public.documents;
create policy "documents_select_access"
  on public.documents for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.document_share_permission(id) is not null
  );

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "documents_update_owner_or_editor" on public.documents;
create policy "documents_update_owner_or_editor"
  on public.documents for update
  to authenticated
  using (
    owner_id = auth.uid()
    or public.document_share_permission(id) = 'editor'
  )
  with check (
    owner_id = auth.uid()
    or public.document_share_permission(id) = 'editor'
  );

drop policy if exists "documents_delete_owner" on public.documents;
create policy "documents_delete_owner"
  on public.documents for delete
  to authenticated
  using (owner_id = auth.uid());

-- Shares: only owners manage; collaborators can see shares on docs they can access
drop policy if exists "shares_select_access" on public.document_shares;
create policy "shares_select_access"
  on public.document_shares for select
  to authenticated
  using (
    shared_with = auth.uid()
    or public.is_document_owner(document_id)
  );

drop policy if exists "shares_insert_owner" on public.document_shares;
create policy "shares_insert_owner"
  on public.document_shares for insert
  to authenticated
  with check (public.is_document_owner(document_id));

drop policy if exists "shares_update_owner" on public.document_shares;
create policy "shares_update_owner"
  on public.document_shares for update
  to authenticated
  using (public.is_document_owner(document_id))
  with check (public.is_document_owner(document_id));

drop policy if exists "shares_delete_owner" on public.document_shares;
create policy "shares_delete_owner"
  on public.document_shares for delete
  to authenticated
  using (public.is_document_owner(document_id));
