-- STAB-003 Marketplace blueprint. PREPARED ONLY.
-- products remains canonical; marketplace_products is a one-to-one extension.
begin;

create table public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.marketplace_categories(id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.marketplace_products (
  product_id uuid primary key references public.products(id) on delete cascade,
  category_id uuid references public.marketplace_categories(id) on delete set null,
  listing_type text not null default 'sale' check (listing_type in ('sale','rental','used')),
  description text not null default '',
  rental_price_per_day numeric(12,2) check (rental_price_per_day is null or rental_price_per_day >= 0),
  deposit_amount numeric(12,2) check (deposit_amount is null or deposit_amount >= 0),
  condition text not null default 'new' check (condition in ('new','excellent','good','used')),
  location text,
  status text not null default 'draft' check (status in ('draft','published','archived','inactive')),
  popularity integer not null default 0 check (popularity >= 0),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_products_rental_check check (
    listing_type <> 'rental' or rental_price_per_day is not null
  )
);
create index marketplace_products_catalog_idx on public.marketplace_products(status, category_id, created_at desc);
create index marketplace_products_listing_idx on public.marketplace_products(listing_type, status);

create table public.marketplace_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint marketplace_product_images_path_key unique(storage_path)
);
create unique index marketplace_product_images_one_primary_idx
  on public.marketplace_product_images(product_id) where is_primary;

create table public.marketplace_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(profile_id, product_id)
);

create table public.marketplace_carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  currency char(3) not null default 'MGA',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index marketplace_carts_one_active_idx on public.marketplace_carts(customer_id) where status = 'active';

create table public.marketplace_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.marketplace_carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  mode text not null check (mode in ('sale','rental')),
  rental_start date,
  rental_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_cart_items_key unique(cart_id, product_id, mode),
  constraint marketplace_cart_items_rental_dates_check check (
    (mode = 'sale' and rental_start is null and rental_end is null)
    or (mode = 'rental' and rental_start is not null and rental_end >= rental_start)
  )
);

create table public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  seller_organization_id uuid not null references public.organizations(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  fulfillment_method text not null check (fulfillment_method in ('delivery','pickup')),
  delivery_address text,
  currency char(3) not null default 'MGA',
  subtotal numeric(14,2) not null check (subtotal >= 0),
  fees numeric(14,2) not null default 0 check (fees >= 0),
  total numeric(14,2) not null check (total >= 0 and total = subtotal + fees),
  status text not null default 'draft' check (status in ('draft','pending','confirmed','prepared','shipped','ready_for_pickup','delivered','cancelled','refunded')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketplace_orders_address_check check (fulfillment_method = 'pickup' or delivery_address is not null)
);
create index marketplace_orders_customer_date_idx on public.marketplace_orders(customer_id, created_at desc);
create index marketplace_orders_seller_status_idx on public.marketplace_orders(seller_organization_id, status, created_at desc);

create table public.marketplace_order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_title text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  mode text not null check (mode in ('sale','rental')),
  rental_start date,
  rental_end date,
  line_total numeric(14,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint marketplace_order_lines_rental_dates_check check (
    mode = 'sale' or (rental_start is not null and rental_end >= rental_start)
  )
);
create index marketplace_order_lines_order_idx on public.marketplace_order_lines(order_id);

create table public.marketplace_order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index marketplace_order_status_history_order_date_idx on public.marketplace_order_status_history(order_id, created_at);

create table public.marketplace_rentals (
  id uuid primary key default gen_random_uuid(),
  order_line_id uuid not null unique references public.marketplace_order_lines(id) on delete cascade,
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  deposit_amount numeric(14,2) not null default 0 check (deposit_amount >= 0),
  status text not null default 'pending' check (status in ('pending','active','returned','late','cancelled')),
  returned_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.marketplace_inventory (
  product_id uuid primary key references public.products(id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create table public.marketplace_stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in','out','reserve','release','adjustment')),
  quantity integer not null check (quantity > 0),
  reason text not null,
  order_id uuid references public.marketplace_orders(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index marketplace_stock_movements_product_date_idx on public.marketplace_stock_movements(product_id, created_at desc);

create table public.marketplace_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.marketplace_orders(id) on delete cascade,
  method text not null check (method in ('delivery','pickup')),
  address text,
  carrier text,
  tracking_number text,
  status text not null default 'pending' check (status in ('pending','prepared','in_transit','ready','completed','failed')),
  updated_at timestamptz not null default now()
);

create table public.marketplace_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.marketplace_orders(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,
  seller_organization_id uuid not null references public.organizations(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('charge','refund','deposit','deposit_release')),
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'MGA',
  status text not null check (status in ('pending','completed','failed','cancelled')),
  external_reference text,
  created_at timestamptz not null default now()
);
create index marketplace_transactions_order_date_idx on public.marketplace_transactions(order_id, created_at desc);

create table public.marketplace_payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.marketplace_transactions(id) on delete restrict,
  method text not null check (method in ('cash','mobile_money','card','bank_transfer')),
  provider_reference text,
  status text not null check (status in ('pending','paid','failed','refunded')),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index marketplace_payments_transaction_idx on public.marketplace_payments(transaction_id, created_at desc);

alter table public.marketplace_categories enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_product_images enable row level security;
alter table public.marketplace_favorites enable row level security;
alter table public.marketplace_carts enable row level security;
alter table public.marketplace_cart_items enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_lines enable row level security;
alter table public.marketplace_order_status_history enable row level security;
alter table public.marketplace_rentals enable row level security;
alter table public.marketplace_inventory enable row level security;
alter table public.marketplace_stock_movements enable row level security;
alter table public.marketplace_deliveries enable row level security;
alter table public.marketplace_transactions enable row level security;
alter table public.marketplace_payments enable row level security;

commit;
