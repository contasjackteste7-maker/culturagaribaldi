-- =======================================================
-- MIGRATION: PROFILES, TRIGGER AUTOMÁTICO & ADMINISTRADORES
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- =======================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS (PROFILES)
create table if not exists public.profiles (
  id uuid not null,
  email text null,
  nome text null,
  avatar_url text null,
  created_at timestamp with time zone not null default now(),

  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey
    foreign key (id)
    references auth.users (id)
    on delete cascade
);

create index if not exists idx_profiles_email
on public.profiles (email);


-- 2. FUNÇÃO PL/PGSQL E TRIGGER PARA SINCRONIZAR PROFILES NO LOGIN GOOGLE
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    nome,
    avatar_url
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id)
  do update set
    email = excluded.email,
    nome = excluded.nome,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

-- Remove o trigger antigo se existir para evitar duplicidade
drop trigger if exists on_auth_user_profile_created on auth.users;

create trigger on_auth_user_profile_created
after insert or update on auth.users
for each row
execute function public.handle_new_user_profile();


-- 3. TABELA DE ADMINISTRADORES (CONTROLE DE ACESSO AO PAINEL ADMIN)
create table if not exists public.administradores (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  email text not null,
  created_at timestamp with time zone not null default now(),

  constraint administradores_pkey primary key (id),
  constraint administradores_email_key unique (email),
  constraint administradores_user_id_fkey
    foreign key (user_id)
    references auth.users (id)
    on delete cascade
);

create index if not exists idx_administradores_user_id
on public.administradores (user_id);

create index if not exists idx_administradores_email
on public.administradores (email);


-- 4. POLÍTICAS DE SEGURANÇA RLS (Row Level Security)

-- Habilitar RLS em profiles e administradores
alter table public.profiles enable row level security;
alter table public.administradores enable row level security;

-- Permissões em Profiles:
drop policy if exists "Permitir leitura de perfis para autenticados" on public.profiles;
create policy "Permitir leitura de perfis para autenticados"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Permitir atualização do próprio perfil" on public.profiles;
create policy "Permitir atualização do próprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Permissões em Administradores:
drop policy if exists "Permitir leitura de administradores para autenticados" on public.administradores;
create policy "Permitir leitura de administradores para autenticados"
  on public.administradores for select
  to authenticated
  using (true);
