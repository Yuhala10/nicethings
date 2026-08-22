create extension if not exists "pgcrypto";

-- ============================================================
-- VISITORS
-- Anonymous users. No mandatory account.
-- ============================================================

create table if not exists nt_visitors (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    language text not null default 'en'
        check (language in ('en', 'fr'))
);

-- ============================================================
-- ACCESS PASSES
-- 100 FCFA / 24 HOURS
-- ============================================================

create table if not exists nt_access_passes (
    id uuid primary key default gen_random_uuid(),
    visitor_id uuid not null references nt_visitors(id) on delete cascade,
    amount integer not null default 100,
    currency text not null default 'XAF',
    status text not null default 'PENDING'
        check (status in ('PENDING', 'ACTIVE', 'EXPIRED', 'REJECTED')),
    activated_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    admin_note text
);

create index if not exists nt_access_visitor_idx
on nt_access_passes(visitor_id);

create index if not exists nt_access_status_idx
on nt_access_passes(status);

-- ============================================================
-- PAYMENT REQUESTS
-- ============================================================

create table if not exists nt_payment_requests (
    id uuid primary key default gen_random_uuid(),
    visitor_id uuid not null references nt_visitors(id) on delete cascade,
    access_pass_id uuid references nt_access_passes(id) on delete set null,
    amount integer not null default 100,
    currency text not null default 'XAF',
    transaction_reference text,
    proof_url text,
    status text not null default 'PENDING'
        check (status in ('PENDING', 'APPROVED', 'REJECTED')),
    admin_note text,
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);

create index if not exists nt_payment_status_idx
on nt_payment_requests(status);

create index if not exists nt_payment_created_idx
on nt_payment_requests(created_at desc);

-- ============================================================
-- SPOTS
-- ============================================================

create table if not exists nt_spots (
    id uuid primary key default gen_random_uuid(),

    name text not null,
    slug text unique,

    description text,

    category text,
    cuisine text,

    address text,
    neighborhood text,
    city text default 'Yaoundé',

    latitude double precision,
    longitude double precision,

    phone text,
    whatsapp text,

    minimum_price integer,
    maximum_price integer,
    average_price integer,
    currency text default 'XAF',

    opening_time time,
    closing_time time,

    rating numeric(3,2) default 0,
    review_count integer default 0,

    verified boolean not null default false,

    price_verified_at timestamptz,
    location_verified_at timestamptz,

    featured boolean not null default false,

    status text not null default 'PENDING'
        check (
            status in (
                'PENDING',
                'APPROVED',
                'SUSPENDED',
                'REJECTED'
            )
        ),

    submitted_by uuid references nt_visitors(id) on delete set null,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists nt_spots_status_idx
on nt_spots(status);

create index if not exists nt_spots_city_idx
on nt_spots(city);

create index if not exists nt_spots_category_idx
on nt_spots(category);

-- ============================================================
-- SPOT MENU
-- ============================================================

create table if not exists nt_spot_menu (
    id uuid primary key default gen_random_uuid(),
    spot_id uuid not null references nt_spots(id) on delete cascade,
    name text not null,
    description text,
    price integer not null,
    created_at timestamptz not null default now()
);

create index if not exists nt_menu_spot_idx
on nt_spot_menu(spot_id);

-- ============================================================
-- SPOT PHOTOS
-- ============================================================

create table if not exists nt_spot_photos (
    id uuid primary key default gen_random_uuid(),
    spot_id uuid not null references nt_spots(id) on delete cascade,
    storage_path text not null,
    sort_order integer default 0,
    created_at timestamptz not null default now()
);

-- ============================================================
-- SEARCHES
-- ============================================================

create table if not exists nt_searches (
    id uuid primary key default gen_random_uuid(),

    visitor_id uuid not null references nt_visitors(id) on delete cascade,
    access_pass_id uuid references nt_access_passes(id) on delete set null,

    location_text text,

    latitude double precision,
    longitude double precision,

    budget integer,
    people integer default 1,

    category text,

    language text not null default 'en'
        check (language in ('en', 'fr')),

    created_at timestamptz not null default now()
);

create index if not exists nt_search_visitor_idx
on nt_searches(visitor_id);

create index if not exists nt_search_created_idx
on nt_searches(created_at desc);

-- ============================================================
-- ARRIVALS
-- ============================================================

create table if not exists nt_arrivals (
    id uuid primary key default gen_random_uuid(),

    search_id uuid not null references nt_searches(id) on delete cascade,
    visitor_id uuid not null references nt_visitors(id) on delete cascade,
    spot_id uuid not null references nt_spots(id) on delete cascade,

    selected_at timestamptz,
    arrived_at timestamptz,

    created_at timestamptz not null default now()
);

create index if not exists nt_arrival_spot_idx
on nt_arrivals(spot_id);

create index if not exists nt_arrival_visitor_idx
on nt_arrivals(visitor_id);

-- ============================================================
-- REVIEWS
-- ============================================================

create table if not exists nt_reviews (
    id uuid primary key default gen_random_uuid(),

    visitor_id uuid not null references nt_visitors(id) on delete cascade,
    spot_id uuid not null references nt_spots(id) on delete cascade,
    arrival_id uuid references nt_arrivals(id) on delete set null,

    rating integer not null
        check (rating between 1 and 5),

    comment text,

    price_accurate boolean,
    location_accurate boolean,

    created_at timestamptz not null default now()
);

create index if not exists nt_review_spot_idx
on nt_reviews(spot_id);

-- ============================================================
-- INTRODUCED SPOTS
-- ============================================================

create table if not exists nt_submissions (
    id uuid primary key default gen_random_uuid(),

    visitor_id uuid references nt_visitors(id) on delete set null,

    spot_name text not null,
    category text,
    description text,

    address text,
    neighborhood text,
    city text,

    latitude double precision,
    longitude double precision,

    phone text,
    whatsapp text,

    estimated_price integer,

    submitted_by_name text,
    submitted_by_phone text,

    status text not null default 'PENDING'
        check (
            status in (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    admin_note text,

    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);

create index if not exists nt_submission_status_idx
on nt_submissions(status);

-- ============================================================
-- BASIC UPDATED_AT FUNCTION
-- ============================================================

create or replace function nt_set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists nt_spots_updated_at
on nt_spots;

create trigger nt_spots_updated_at
before update on nt_spots
for each row
execute function nt_set_updated_at();