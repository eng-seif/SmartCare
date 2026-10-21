-- Safe to run on your existing DB: only adds what's missing.
-- 1) profiles (health profile of each user)
create table if not exists profiles(id uuid primary key references auth.users on delete cascade);
alter table profiles add column if not exists full_name text;
alter table profiles add column if not exists age int;
alter table profiles add column if not exists gender text;
alter table profiles add column if not exists conditions text[] default '{}';
alter table profiles add column if not exists max_sugar_g numeric default 15;
alter table profiles add column if not exists max_carbs_g numeric default 50;
alter table profiles add column if not exists max_sodium_mg numeric default 1500;

-- 2) cart
create table if not exists cart_items(
  user_id uuid default auth.uid() references auth.users on delete cascade,
  product_id uuid references products(id) on delete cascade,
  qty int not null default 1,
  primary key(user_id, product_id)
);

-- 3) RLS
alter table profiles enable row level security;
alter table cart_items enable row level security;
alter table alternative_products enable row level security;
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles for all using (auth.uid()=id) with check (auth.uid()=id);
drop policy if exists "own cart" on cart_items;
create policy "own cart" on cart_items for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "read alternatives" on alternative_products;
create policy "read alternatives" on alternative_products for select using (true);

-- 4) auto-create profile at signup
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id, full_name, age, gender, conditions)
  values(new.id, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'age')::int,
    new.raw_user_meta_data->>'gender',
    coalesce(array(select jsonb_array_elements_text(new.raw_user_meta_data->'conditions')),'{}'))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
