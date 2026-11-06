-- Online Market commerce schema.
-- Apply this yourself in a Supabase project. This repository does not run it.
-- Signup always creates a customer profile. Promote the first admin with the
-- service role, for example:
--   update public.profiles set role = 'admin' where id = '<user uuid>';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  display_name text,
  created_at timestamptz not null default now()
);

create table public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null,
  area text not null,
  categories text[] not null,
  summary text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  created_at timestamptz not null default now()
);

create unique index seller_applications_one_pending
  on public.seller_applications (user_id)
  where status = 'pending';

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  application_id uuid references public.seller_applications (id),
  name text not null,
  area text not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers (id) on delete cascade,
  title text not null,
  category text not null check (category in ('fashion', 'home', 'beauty', 'phone', 'electronics')),
  description text not null,
  price_bdt integer not null check (price_bdt > 0 and price_bdt <= 5000000),
  stock integer not null default 0 check (stock >= 0 and stock <= 9999),
  status text not null default 'pending' check (status in ('pending', 'live', 'hidden', 'rejected')),
  duration_sec numeric,
  poster_path text,
  video_path text,
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,
  price_bdt integer not null check (price_bdt > 0),
  stock integer not null check (stock >= 0 and stock <= 9999)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references auth.users (id) on delete restrict,
  division text not null,
  method text not null check (method in ('cod', 'prepaid')),
  status text not null check (status in ('pending_payment', 'accepted_cod', 'paid', 'cancelled')),
  total_bdt integer not null default 0 check (total_bdt >= 0),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  variant_id uuid references public.product_variants (id),
  seller_id uuid not null references public.sellers (id),
  title text not null,
  qty integer not null check (qty > 0 and qty <= 20),
  price_bdt integer not null check (price_bdt > 0)
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  order_id uuid not null references public.orders (id),
  amount_bdt integer not null,
  kind text not null check (kind in ('paid', 'failed')),
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table public.shop_settings (
  id integer primary key default 1 check (id = 1),
  checkout_enabled boolean not null default false,
  cod_enabled boolean not null default false,
  prepaid_enabled boolean not null default false
);

insert into public.shop_settings (id) values (1);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'role_change_forbidden';
  end if;
  return new;
end;
$$;

create trigger profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();

create or replace function public.guard_product_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    return new;
  end if;
  if new.status is distinct from old.status and new.status = 'live' then
    raise exception 'moderation_required';
  end if;
  return new;
end;
$$;

create trigger products_status_guard
  before insert or update on public.products
  for each row execute function public.guard_product_status();

create or replace function public.place_order(p_division text, p_method text, p_lines jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_settings public.shop_settings%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_total integer := 0;
  v_line jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_qty integer;
  v_price integer;
  v_stock integer;
  v_variant_id uuid;
  v_has_variants boolean;
begin
  if v_user is null then
    raise exception 'auth_required';
  end if;
  select * into v_settings from public.shop_settings where id = 1;
  if not found or not v_settings.checkout_enabled then
    raise exception 'checkout_closed';
  end if;
  if p_method = 'cod' and not v_settings.cod_enabled then
    raise exception 'cod_closed';
  end if;
  if p_method = 'prepaid' and not v_settings.prepaid_enabled then
    raise exception 'prepaid_closed';
  end if;
  if p_method not in ('cod', 'prepaid') then
    raise exception 'unknown_method';
  end if;
  if p_division not in ('Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet') then
    raise exception 'invalid_division';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'empty_order';
  end if;

  insert into public.orders (id, customer_id, division, method, status, total_bdt)
  values (
    v_order_id,
    v_user,
    p_division,
    p_method,
    case when p_method = 'cod' then 'accepted_cod' else 'pending_payment' end,
    0
  );

  for v_line in select value from jsonb_array_elements(p_lines)
  loop
    v_qty := (v_line->>'qty')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_qty';
    end if;
    select * into v_product from public.products where id = (v_line->>'product_id')::uuid for update;
    if not found or v_product.status <> 'live' then
      raise exception 'product_unavailable';
    end if;
    if not exists (select 1 from public.sellers where id = v_product.seller_id and status = 'active') then
      raise exception 'seller_unavailable';
    end if;
    select exists(select 1 from public.product_variants where product_id = v_product.id) into v_has_variants;
    v_variant_id := null;
    if v_has_variants then
      if v_line->>'variant_id' is null then
        raise exception 'variant_required';
      end if;
      select * into v_variant
      from public.product_variants
      where id = (v_line->>'variant_id')::uuid and product_id = v_product.id
      for update;
      if not found then
        raise exception 'invalid_variant';
      end if;
      v_price := v_variant.price_bdt;
      v_stock := v_variant.stock;
      v_variant_id := v_variant.id;
      if v_stock < v_qty then
        raise exception 'insufficient_stock';
      end if;
      update public.product_variants set stock = stock - v_qty where id = v_variant.id;
    else
      v_price := v_product.price_bdt;
      if v_product.stock < v_qty then
        raise exception 'insufficient_stock';
      end if;
      update public.products set stock = stock - v_qty where id = v_product.id;
    end if;
    insert into public.order_items (order_id, product_id, variant_id, seller_id, title, qty, price_bdt)
    values (v_order_id, v_product.id, v_variant_id, v_product.seller_id, v_product.title, v_qty, v_price);
    v_total := v_total + (v_price * v_qty);
  end loop;

  update public.orders set total_bdt = v_total where id = v_order_id;
  return jsonb_build_object(
    'id', v_order_id,
    'status', case when p_method = 'cod' then 'accepted_cod' else 'pending_payment' end,
    'total_bdt', v_total
  );
end;
$$;

create or replace function public.approve_seller_application(p_application uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app public.seller_applications%rowtype;
  v_seller uuid;
begin
  if not public.is_admin() then
    raise exception 'admin_required';
  end if;
  select * into v_app from public.seller_applications where id = p_application for update;
  if not found or v_app.status <> 'pending' then
    raise exception 'application_unavailable';
  end if;
  insert into public.sellers (owner_id, application_id, name, area)
  values (v_app.user_id, v_app.id, v_app.business_name, v_app.area)
  on conflict (owner_id) do update set status = 'active', name = excluded.name, area = excluded.area
  returning id into v_seller;
  update public.seller_applications
  set status = 'approved', review_note = 'Approved.'
  where id = v_app.id;
  return v_seller;
end;
$$;

revoke all on function public.place_order(text, text, jsonb) from public;
revoke all on function public.approve_seller_application(uuid) from public;
grant execute on function public.place_order(text, text, jsonb) to authenticated;
grant execute on function public.approve_seller_application(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.seller_applications enable row level security;
alter table public.sellers enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
alter table public.shop_settings enable row level security;

create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy applications_select on public.seller_applications
  for select using (user_id = auth.uid() or public.is_admin());
create policy applications_insert on public.seller_applications
  for insert with check (user_id = auth.uid() and status = 'pending');
create policy applications_admin_update on public.seller_applications
  for update using (public.is_admin()) with check (public.is_admin());

create policy sellers_select on public.sellers
  for select using (status = 'active' or owner_id = auth.uid() or public.is_admin());

create policy products_select on public.products
  for select using (
    status = 'live'
    or public.is_admin()
    or seller_id in (select id from public.sellers where owner_id = auth.uid())
  );
create policy products_insert on public.products
  for insert with check (
    seller_id in (select id from public.sellers where owner_id = auth.uid() and status = 'active')
  );
create policy products_update_own on public.products
  for update using (
    seller_id in (select id from public.sellers where owner_id = auth.uid())
    or public.is_admin()
  );

create policy variants_select on public.product_variants
  for select using (
    product_id in (select id from public.products)
  );

create policy orders_select on public.orders
  for select using (customer_id = auth.uid() or public.is_admin());
create policy order_items_select on public.order_items
  for select using (
    public.is_admin()
    or seller_id in (select id from public.sellers where owner_id = auth.uid())
    or order_id in (select id from public.orders where customer_id = auth.uid())
  );

create table public.cart_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  qty integer not null check (qty > 0 and qty <= 20),
  primary key (user_id, product_id)
);

alter table public.cart_items enable row level security;

create policy cart_items_own on public.cart_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy settings_read on public.shop_settings
  for select using (true);

-- No client policies on payment_events. The service role writes verified webhooks.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-media',
  'product-media',
  true,
  26214400,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

create policy product_media_read on storage.objects
  for select using (bucket_id = 'product-media');

create policy product_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-media'
    and (storage.foldername(name))[1] in (
      select id::text from public.sellers where owner_id = auth.uid() and status = 'active'
    )
  );
