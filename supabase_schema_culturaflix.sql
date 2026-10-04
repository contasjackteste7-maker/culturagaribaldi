-- ====================================================================
-- ESTRUTURA COMPLETA DO BANCO DE DADOS - CULTURAFLIX VOTACAO CINEESCOLA
-- Copie e cole este código no SQL Editor do seu Supabase Dashboard
-- ====================================================================

-- 1. TABELA DE PROFILES (Alunos e Usuários Autenticados)
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

create index if not exists idx_profiles_email on public.profiles (email);

-- Trigger Automático para criar/atualizar o profile quando o usuário faz login com o Google
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

drop trigger if exists on_auth_user_profile_created on auth.users;
create trigger on_auth_user_profile_created
after insert or update on auth.users
for each row
execute function public.handle_new_user_profile();


-- 2. TABELA DE ADMINISTRADORES (Controle de Acesso ao Painel Admin)
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

create index if not exists idx_administradores_user_id on public.administradores (user_id);
create index if not exists idx_administradores_email on public.administradores (email);


-- 3. TABELA DE FILMES (Catálogo do CulturaFlix)
create table if not exists public.filmes (
  id uuid not null default gen_random_uuid(),
  title text not null,
  year integer not null default 2026,
  genre text not null default 'Terror',
  duration text not null default '1h 45m',
  rating text not null default '16+',
  synopsis text null,
  banner_url text null,  -- Imagem Horizontal do Slide Hero
  poster_url text null,  -- Imagem Vertical do Card no Catálogo
  trailer_url text null, -- Link do Vídeo / Trailer
  active boolean not null default true,
  created_at timestamp with time zone not null default now(),

  constraint filmes_pkey primary key (id)
);

create index if not exists idx_filmes_active on public.filmes (active);


-- 4. TABELA DE VOTOS (Registro Único de Voto por E-mail / Usuário)
create table if not exists public.votos (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  filme_id uuid not null,
  created_at timestamp with time zone not null default now(),

  constraint votos_pkey primary key (id),
  -- REGRA FUNDAMENTAL: Garante apenas 1 voto por Usuário (user_id)
  constraint votos_user_id_key unique (user_id),
  -- REGRA FUNDAMENTAL: Garante apenas 1 voto por E-mail (email)
  constraint votos_email_key unique (email),
  constraint votos_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint votos_filme_id_fkey foreign key (filme_id) references public.filmes (id) on delete cascade
);

create index if not exists idx_votos_filme_id on public.votos (filme_id);
create index if not exists idx_votos_email on public.votos (email);


-- 5. REGRAS E POLÍTICAS DE SEGURANÇA (RLS)
alter table public.profiles enable row level security;
alter table public.administradores enable row level security;
alter table public.filmes enable row level security;
alter table public.votos enable row level security;

-- Profiles: Autenticados podem ler perfis
drop policy if exists "Permitir leitura de perfis para autenticados" on public.profiles;
create policy "Permitir leitura de perfis para autenticados"
  on public.profiles for select to authenticated using (true);

-- Administradores: Leitura aberta para autenticados
drop policy if exists "Permitir leitura de administradores para autenticados" on public.administradores;
create policy "Permitir leitura de administradores para autenticados"
  on public.administradores for select to authenticated using (true);

-- Filmes: Leitura para todos os autenticados
drop policy if exists "Permitir leitura de filmes para autenticados" on public.filmes;
create policy "Permitir leitura de filmes para autenticados"
  on public.filmes for select to authenticated using (true);

-- Votos: Leitura do próprio voto para o usuário
drop policy if exists "Permitir leitura do próprio voto" on public.votos;
create policy "Permitir leitura do próprio voto"
  on public.votos for select to authenticated using (auth.uid() = user_id);

-- Votos: Inserção de voto único pelo próprio usuário
drop policy if exists "Permitir inserir voto próprio único" on public.votos;
create policy "Permitir inserir voto próprio único"
  on public.votos for insert to authenticated with check (auth.uid() = user_id);
