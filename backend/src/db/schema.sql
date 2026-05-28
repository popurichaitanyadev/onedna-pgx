-- ============================================================
-- OneDNA Semaglutide PGX — Database Schema (PostgreSQL / Supabase)
-- PRD v1.0 §8 Core Tables
-- ============================================================

-- Extensions ------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- Enum: user role -------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'user');
  end if;
end$$;

-- ============================================================
-- users
-- ============================================================
create table if not exists users (
  id              uuid primary key default gen_random_uuid(),
  user_id         varchar(50)  unique not null,         -- login username
  name            varchar(150) not null,
  password_hash   text         not null,                -- bcrypt
  role            user_role    not null default 'user',
  phone           varchar(20),
  address         text,
  is_active       boolean      not null default true,    -- soft-delete flag
  created_at      timestamptz  not null default now()
);

create index if not exists idx_users_user_id on users (user_id);
create index if not exists idx_users_role    on users (role);

-- ============================================================
-- form_drafts
-- ============================================================
create table if not exists form_drafts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  patient_name     varchar(150),                          -- denormalised for listing
  current_section  smallint not null default 1 check (current_section between 1 and 11),
  form_data        jsonb    not null default '{}'::jsonb,  -- all section data
  completion_pct   smallint not null default 0 check (completion_pct between 0 and 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_drafts_user on form_drafts (user_id);

-- ============================================================
-- form_submissions
-- ============================================================
create table if not exists form_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete restrict,
  reference_no  varchar(30) unique not null,    -- human-readable, e.g. SEM-20260528-0001
  patient_name  varchar(150),
  form_data     jsonb not null,
  submitted_at  timestamptz not null default now()
);

create index if not exists idx_subs_user on form_submissions (user_id);
create index if not exists idx_subs_date on form_submissions (submitted_at);

-- ============================================================
-- notifications
-- ============================================================
create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references form_submissions(id) on delete cascade,
  is_read        boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_notif_unread on notifications (is_read, created_at desc);

-- ============================================================
-- updated_at trigger for drafts
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_drafts_updated on form_drafts;
create trigger trg_drafts_updated
  before update on form_drafts
  for each row execute function set_updated_at();

-- ============================================================
-- Reference-number sequence helper
--  Generates SEM-YYYYMMDD-#### per day
-- ============================================================
create table if not exists submission_counters (
  day   date primary key,
  seq   integer not null default 0
);

create or replace function next_reference_no()
returns text as $$
declare
  today date := current_date;
  n     integer;
begin
  insert into submission_counters (day, seq) values (today, 1)
  on conflict (day) do update set seq = submission_counters.seq + 1
  returning seq into n;
  return 'SEM-' || to_char(today, 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
end;
$$ language plpgsql;

-- ============================================================
-- Row Level Security (secondary defence; API enforces RBAC primarily)
-- ============================================================
alter table users            enable row level security;
alter table form_drafts      enable row level security;
alter table form_submissions enable row level security;
alter table notifications    enable row level security;

-- NOTE: The Fastify backend connects via the service role and enforces
-- RBAC in middleware. These policies are a defence-in-depth layer for
-- any direct/anon access. Adjust to your Supabase auth model as needed.
-- Service-role connections bypass RLS by design.
