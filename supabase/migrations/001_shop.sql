-- Migration 001: Shop schema for Geodeels customer storefront
-- NOTE: DO NOT run against the live DB; never supabase db push. For review only.

-- Extension for UUID generation
create extension if not exists "pgcrypto";

-- Table: public.admins (Lookup for staff/admin authorization)
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Automatic timestamp updater function (defined here so self-contained)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Table: public.shop_products
-- Catalog items with size, unit pricing, stock level, photo URL, and visibility
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  size text not null,
  price_ngn integer not null check (price_ngn >= 0),
  stock integer not null default 0 check (stock >= 0),
  photo_url text,
  active boolean not null default true,
  sort integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for storefront queries and sorting
create index if not exists shop_products_category_idx on public.shop_products (category);
create index if not exists shop_products_active_stock_sort_idx on public.shop_products (active, stock, sort, created_at desc);

-- Trigger for shop_products updated_at
drop trigger if exists set_shop_products_updated_at on public.shop_products;
create trigger set_shop_products_updated_at
before update on public.shop_products
for each row
execute function public.set_updated_at();

-- Table: public.shop_orders
-- Orders placed by customers before dispatch/WhatsApp coordination
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  items jsonb not null default '[]'::jsonb,
  total_ngn integer not null default 0 check (total_ngn >= 0),
  status text not null default 'new' check (status in ('new', 'confirmed', 'processing', 'completed', 'cancelled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for order management
create index if not exists shop_orders_status_idx on public.shop_orders (status);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);

-- Trigger for shop_orders updated_at
drop trigger if exists set_shop_orders_updated_at on public.shop_orders;
create trigger set_shop_orders_updated_at
before update on public.shop_orders
for each row
execute function public.set_updated_at();

-- Enable Row Level Security (RLS)
alter table public.admins enable row level security;
alter table public.shop_products enable row level security;
alter table public.shop_orders enable row level security;

-- Admins Table Policies
create policy "Admins can view own admin record"
  on public.admins
  for select
  to authenticated
  using (user_id = auth.uid());

-- shop_products Policies:
-- 1. Anyone (public or auth) can SELECT shop_products where active and stock > 0
--    Staff (in public.admins) can view all products including inactive / zero-stock
create policy "Public can view active in-stock products"
  on public.shop_products
  for select
  using (
    (active = true and stock > 0)
    or (
      auth.role() = 'authenticated'
      and exists (select 1 from public.admins where user_id = auth.uid())
    )
  );

-- 2. Only staff in public.admins can INSERT products
create policy "Staff can insert products"
  on public.shop_products
  for insert
  to authenticated
  with check (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 3. Only staff in public.admins can UPDATE products
create policy "Staff can update products"
  on public.shop_products
  for update
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 4. Only staff in public.admins can DELETE products
create policy "Staff can delete products"
  on public.shop_products
  for delete
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- shop_orders Policies:
-- 1. Anyone can INSERT into shop_orders ONLY with status 'new'
create policy "Anyone can insert new orders"
  on public.shop_orders
  for insert
  with check (
    status = 'new'
  );

-- 2. Staff in public.admins can SELECT all orders (no anon SELECT)
create policy "Staff can view all orders"
  on public.shop_orders
  for select
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 3. Staff in public.admins can UPDATE orders (no anon UPDATE)
create policy "Staff can update orders"
  on public.shop_orders
  for update
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- 4. Staff in public.admins can DELETE orders (no anon DELETE)
create policy "Staff can delete orders"
  on public.shop_orders
  for delete
  to authenticated
  using (
    exists (select 1 from public.admins where user_id = auth.uid())
  );

-- Storage: public product-photos bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage Policies for product-photos
create policy "Public can view product photos"
  on storage.objects
  for select
  using (bucket_id = 'product-photos');

create policy "Staff can upload product photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-photos'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

create policy "Staff can update product photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-photos'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );

create policy "Staff can delete product photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-photos'
    and exists (select 1 from public.admins where user_id = auth.uid())
  );
