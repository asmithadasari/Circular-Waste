-- ReLoop AI - Supabase Postgres schema
-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste -> Run
-- (Alternatively, `python -m app.seed` will auto-create tables via SQLAlchemy
--  against DATABASE_URL, but running this file gives you clean, explicit control.)

create extension if not exists "uuid-ossp";

create table if not exists organisations (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    location text
);

create table if not exists users (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    email text unique not null,
    role text default 'collector',
    organisation_id text references organisations(id)
);

create table if not exists waste_batches (
    id text primary key default uuid_generate_v4()::text,
    batch_code text unique not null,
    organisation_id text references organisations(id),
    material_type text not null check (material_type in ('plastic','paper','cardboard','glass','metal','organic')),
    quantity numeric not null check (quantity > 0),
    source_location text not null,
    condition text not null,
    image_url text,
    confidence numeric not null,
    status text not null default 'BATCH_CREATED',
    created_at timestamptz not null default now()
);

create table if not exists recyclers (
    id text primary key default uuid_generate_v4()::text,
    name text not null,
    latitude numeric,
    longitude numeric,
    distance_km numeric not null default 5,
    rating numeric not null default 4.0,
    capacity numeric not null
);

create table if not exists recycler_materials (
    id text primary key default uuid_generate_v4()::text,
    recycler_id text not null references recyclers(id) on delete cascade,
    material_type text not null check (material_type in ('plastic','paper','cardboard','glass','metal','organic')),
    minimum_quantity numeric not null default 0
);

create table if not exists matches (
    id text primary key default uuid_generate_v4()::text,
    batch_id text not null references waste_batches(id) on delete cascade,
    recycler_id text not null references recyclers(id) on delete cascade,
    match_score numeric not null,
    score_breakdown jsonb,
    status text not null default 'PROPOSED',
    created_at timestamptz not null default now()
);

create table if not exists traceability_events (
    id text primary key default uuid_generate_v4()::text,
    batch_id text not null references waste_batches(id) on delete cascade,
    event_type text not null check (event_type in
        ('COLLECTED','CLASSIFIED','BATCH_CREATED','MATCHED','PICKUP_SCHEDULED','RECEIVED','RECYCLED')),
    actor text not null default 'system',
    metadata jsonb,
    timestamp timestamptz not null default now()
);

create index if not exists idx_batches_status on waste_batches(status);
create index if not exists idx_events_batch on traceability_events(batch_id);
create index if not exists idx_matches_batch on matches(batch_id);
create index if not exists idx_recycler_materials_type on recycler_materials(material_type);
