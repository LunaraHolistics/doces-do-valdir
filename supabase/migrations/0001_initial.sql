-- =====================================================
-- PRODUTOS DO VALDIR — schema inicial (Supabase)
-- Rodar no SQL Editor (como postgres) ou via integração de branch.
-- =====================================================

create extension if not exists pgcrypto;

-- ---------- ENUMS ----------
create type public.user_role as enum ('manager','operator');
create type public.order_status as enum (
  'NOVO','CONFIRMADO','AGUARDANDO PAGAMENTO','SEPARANDO',
  'PRONTO PARA ROTA','CONCLUÍDO','PENDENTE DE ENTREGA'
);
create type public.payment_method as enum ('PIX','CARTAO','DINHEIRO');
create type public.delivery_mode as enum ('ENTREGA','RETIRADA','ENCOMENDA');

-- ---------- HELPERS DE PERFIL (RLS) ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'operator',
  created_at timestamptz not null default now()
);

create or replace function public.my_role()
returns public.user_role language sql stable security definer
set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('operator','manager')
  );
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'manager'
  );
$$;

grant execute on function public.my_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;

-- ---------- CATÁLOGO ----------
create table public.categories (
  id serial primary key,
  name text not null unique,
  sort int not null default 0,
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id int not null references public.categories(id),
  name text not null,
  description text not null default '',
  price_cents int not null check (price_cents >= 0),
  cost_cents int not null default 0 check (cost_cents >= 0),
  stock int not null default 0,
  image_url text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_cat_idx on public.products(category_id, active);

-- ---------- CLIENTES / ENDEREÇOS ----------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_uid uuid references auth.users(id) on delete set null,
  name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  place_name text not null default '',
  street text not null default '',
  number text not null default '',
  district text not null default '',
  region text not null default '',
  city text not null default 'Ribeirão Preto',
  is_default boolean not null default false
);

-- ---------- PEDIDOS ----------
create sequence public.order_number_seq start 1049;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('DV-' || nextval('public.order_number_seq')),
  access_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null default '',
  customer_phone text not null default '',
  city text not null default 'Ribeirão Preto',
  delivery_mode public.delivery_mode not null default 'ENTREGA',
  address_id uuid references public.addresses(id) on delete set null,
  address_text text not null default '',
  region text not null default '',
  urgent boolean not null default false,
  notes text not null default '',
  status public.order_status not null default 'NOVO',
  payment_method public.payment_method not null default 'PIX',
  entry_pct numeric not null default 0.5,
  total_cents int not null default 0,
  entry_cents int not null default 0,
  balance_cents int not null default 0,
  payment_confirmed boolean not null default false,
  proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders(status);
create index orders_customer_idx on public.orders(customer_id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  qty int not null check (qty > 0),
  unit_price_cents int not null
);
create index items_order_idx on public.order_items(order_id);

-- ---------- PAGAMENTOS ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  kind text not null check (kind in ('ENTRADA','TOTAL')),
  amount_cents int not null,
  proof_url text,
  confirmed boolean not null default false,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index payments_order_idx on public.payments(order_id);

-- ---------- ROTAS ----------
create table public.routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  route_date date not null default current_date,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.route_orders (
  route_id uuid not null references public.routes(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  delivered boolean not null default false,
  pending_reason text,
  primary key (route_id, order_id)
);

-- ---------- HISTÓRICO DE STATUS ----------
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text not null default '',
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index history_order_idx on public.order_status_history(order_id);

-- ---------- CONFIGURAÇÕES (linha única) ----------
create table public.settings (
  id int primary key default 1 check (id = 1),
  pix_key text not null default '',
  pix_holder text not null default 'Valdir',
  whatsapp_number text not null default '',
  pickup_enabled boolean not null default true,
  pickup_address text not null default '',
  entry_pct_pix numeric not null default 0.5,
  entry_pct_card numeric not null default 0.5,
  cash_rule text not null default 'TOTAL_NA_ENTREGA',
  araraquara_next_date date,
  updated_at timestamptz not null default now()
);

-- ---------- TRIGGERS ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

create or replace function public.log_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end $$;

create trigger orders_status_log after update on public.orders
  for each row execute function public.log_status_change();

-- ---------- RPCs PÚBLICAS (cliente sem login) ----------
create or replace function public.get_order_by_access_code(code text)
returns setof public.orders language sql stable security definer
set search_path = public as $$
  select * from public.orders where access_code = code;
$$;

create or replace function public.attach_proof(code text, proof_url text)
returns setof public.orders language plpgsql security definer
set search_path = public as $$
begin
  return query
  update public.orders set proof_url = attach_proof.proof_url
  where access_code = code
  returning *;
end $$;

grant execute on function public.get_order_by_access_code(text) to anon, authenticated;
grant execute on function public.attach_proof(text, text) to anon, authenticated;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
create policy "profiles_self_or_staff" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

alter table public.categories enable row level security;
create policy "cat_public_read" on public.categories
  for select to anon, authenticated using (active or public.is_staff());
create policy "cat_staff_write" on public.categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

alter table public.products enable row level security;
create policy "prod_public_read" on public.products
  for select to anon, authenticated using (active or public.is_staff());
create policy "prod_staff_write" on public.products
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

alter table public.settings enable row level security;
create policy "set_public_read" on public.settings
  for select to anon, authenticated using (true);
create policy "set_manager_write" on public.settings
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

alter table public.customers enable row level security;
create policy "cust_insert" on public.customers
  for insert to anon, authenticated with check (auth_uid is null or auth_uid = auth.uid());
create policy "cust_select" on public.customers
  for select to authenticated using (auth_uid = auth.uid() or public.is_staff());
create policy "cust_update" on public.customers
  for update to authenticated using (auth_uid = auth.uid());

alter table public.addresses enable row level security;
create policy "addr_owner" on public.addresses
  for all to authenticated
  using (exists (select 1 from public.customers c
                 where c.id = customer_id and (c.auth_uid = auth.uid() or public.is_staff())))
  with check (exists (select 1 from public.customers c
                      where c.id = customer_id and (c.auth_uid = auth.uid() or public.is_staff())));

alter table public.orders enable row level security;
create policy "ord_insert_any" on public.orders
  for insert to anon, authenticated with check (true);
create policy "ord_select" on public.orders
  for select to anon, authenticated
  using (public.is_staff() or exists (select 1 from public.customers c
                                      where c.id = customer_id and c.auth_uid = auth.uid()));
create policy "ord_update_staff" on public.orders
  for update to authenticated using (public.is_staff());

alter table public.order_items enable row level security;
create policy "items_insert_any" on public.order_items
  for insert to anon, authenticated with check (true);
create policy "items_select" on public.order_items
  for select to anon, authenticated
  using (public.is_staff() or exists (
    select 1 from public.orders o join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.auth_uid = auth.uid()));

alter table public.payments enable row level security;
create policy "pay_insert_any" on public.payments
  for insert to anon, authenticated with check (true);
create policy "pay_select" on public.payments
  for select to anon, authenticated
  using (public.is_staff() or exists (
    select 1 from public.orders o join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.auth_uid = auth.uid()));
create policy "pay_update_staff" on public.payments
  for update to authenticated using (public.is_staff());

alter table public.routes enable row level security;
create policy "routes_staff" on public.routes
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

alter table public.route_orders enable row level security;
create policy "route_orders_staff" on public.route_orders
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

alter table public.order_status_history enable row level security;
create policy "history_select" on public.order_status_history
  for select to anon, authenticated
  using (public.is_staff() or exists (
    select 1 from public.orders o join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.auth_uid = auth.uid()));

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('proofs', 'proofs', false)
on conflict (id) do nothing;

create policy "photos_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-photos');
create policy "photos_staff_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-photos' and public.is_staff());

create policy "proofs_insert_any" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'proofs');
create policy "proofs_select_staff_or_owner" on storage.objects
  for select to authenticated
  using (bucket_id = 'proofs' and (public.is_staff() or owner = auth.uid()));

-- ---------- SEEDS ----------
insert into public.categories (id, name, sort) values
  (1, 'Doces', 1),
  (2, 'Balas', 2),
  (3, 'Lanches', 3),
  (4, 'Utilidades', 4)
on conflict (id) do nothing;

insert into public.products
  (category_id, name, description, price_cents, cost_cents, stock, image_url)
values
  (1,'Doce de leite cremoso','Pote 400g, textura cremosa e sabor de fazenda.',1290,700,18,'/doces.svg'),
  (1,'Paçoca rolha','Pacotinho com 6 unidades.',750,400,24,'/doces.svg'),
  (1,'Pé de moleque','Crocante, feito com amendoim selecionado.',890,480,14,'/doces.svg'),
  (1,'Doce de amendoim','Doce macio em embalagem individual.',690,350,21,'/doces.svg'),
  (2,'Bala sortida','Mix colorido para adoçar o dia.',500,250,42,'/balas.svg'),
  (2,'Bala de goma','Pacote 200g com sabores variados.',650,320,27,'/balas.svg'),
  (2,'Chiclete hortelã','Cartela com 10 unidades.',390,180,36,'/balas.svg'),
  (2,'Pirulito coração','Unidade, sabores sortidos.',150,60,56,'/balas.svg'),
  (3,'Salgadinho queijo','Pacote crocante 90g.',490,260,33,'/lanches.svg'),
  (3,'Biscoito caseiro','Pacote 250g.',790,420,16,'/lanches.svg'),
  (3,'Chocolate ao leite','Barra 90g.',690,380,19,'/lanches.svg'),
  (3,'Suco em pó uva','Rende 1 litro.',199,90,48,'/lanches.svg'),
  (4,'Pilha AA','Cartela com 2 unidades.',1200,700,11,'/utilidades.svg'),
  (4,'Pilha AAA','Cartela com 2 unidades.',1200,700,8,'/utilidades.svg'),
  (4,'Caixa de fósforos','Caixa com 40 palitos.',350,150,17,'/utilidades.svg'),
  (4,'Vela de aniversário','Kit com 10 unidades.',400,180,29,'/utilidades.svg');

insert into public.settings (id, pix_key, pix_holder, whatsapp_number, pickup_enabled,
  pickup_address, entry_pct_pix, entry_pct_card, cash_rule, araraquara_next_date)
values (1, 'doces.valdir@demo.com', 'Valdir', '', true,
  'Rua dos Doces, 123 — referência: praça central', 0.5, 0.5,
  'TOTAL_NA_ENTREGA', '2026-08-15')
on conflict (id) do nothing;

-- ---------- PERFIS (rodar DEPOIS de criar os usuários em Auth → Users) ----------
-- Substitua os UUIDs pelos IDs reais dos usuários criados no dashboard:
-- insert into public.profiles (id, full_name, role) values
--   ('<UUID_GESTOR>', 'Gestor', 'manager'),
--   ('<UUID_VALDIR>', 'Valdir', 'operator');