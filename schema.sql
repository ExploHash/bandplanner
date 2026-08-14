-- BandPlanner schema v2 (multi-tenant).
-- Run this in the Supabase SQL editor of the BandPlanner project.
-- NOTE: drops the v1 availability table (wipes existing answers).

drop table if exists availability;

create table bands (
  id text primary key,
  name text not null,
  -- Setting: whether members can mark blocks red (not available)
  allow_red boolean not null default true,
  created_at timestamptz not null default now()
);
-- Already ran v2 before allow_red existed? Run only this instead:
-- alter table bands add column allow_red boolean not null default true;

create table band_members (
  id uuid primary key default gen_random_uuid(),
  band_id text not null references bands(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (band_id, name)
);

create table availability (
  id uuid primary key default gen_random_uuid(),
  band_id text not null references bands(id) on delete cascade,
  name text not null,
  day date not null,
  block smallint not null check (block in (1, 2)),
  status text not null check (status in ('green', 'red')),
  updated_at timestamptz not null default now(),
  unique (band_id, name, day, block)
);

-- Access model: anyone with the band URL can read and write that band.
-- Small private tool, so the anon key gets full access.
alter table bands enable row level security;
alter table band_members enable row level security;
alter table availability enable row level security;

create policy "anon all" on bands for all to anon using (true) with check (true);
create policy "anon all" on band_members for all to anon using (true) with check (true);
create policy "anon all" on availability for all to anon using (true) with check (true);
