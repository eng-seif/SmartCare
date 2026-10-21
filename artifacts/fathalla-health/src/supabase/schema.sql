create table profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text, age int, gender text,
  conditions text[] default '{}',
  max_sugar_g numeric default 15, max_carbs_g numeric default 50, max_sodium_mg numeric default 1500
);
create table products(
  id uuid primary key default gen_random_uuid(),
  barcode text unique, name text not null, brand text, category text,
  price numeric not null, image_url text,
  gi int default 0, added_sugar_g numeric default 0, net_carbs_g numeric default 0,
  sodium_mg numeric default 0, sat_fat_g numeric default 0,
  lactose boolean default false, gluten boolean default false
);
create table cart_items(
  user_id uuid default auth.uid() references auth.users on delete cascade,
  product_id uuid references products on delete cascade,
  qty int not null default 1,
  primary key(user_id, product_id)
);
alter table profiles enable row level security;
alter table products enable row level security;
alter table cart_items enable row level security;
create policy "own profile" on profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "read products" on products for select using (true);
create policy "own cart" on cart_items for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id, full_name, age, gender, conditions)
  values(new.id, new.raw_user_meta_data->>'full_name', (new.raw_user_meta_data->>'age')::int,
    new.raw_user_meta_data->>'gender',
    coalesce(array(select jsonb_array_elements_text(new.raw_user_meta_data->'conditions')),'{}'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

insert into products(barcode,name,brand,category,price,gi,added_sugar_g,net_carbs_g,sodium_mg,lactose) values
('622114500982','Plain Greek Yogurt','Juhayna','Dairy',28.5,12,0,3,45,true),
('100000000002','Flaxseed & Oat Bread','Fathalla','Bakery',35,28,0,14,180,false),
('100000000003','Unsweetened Almond Milk','Fathalla','Beverages',16,10,0,1,60,false),
('100000000004','Strawberry Jam','Generic','Pantry',22,65,24,26,10,false),
('100000000005','Berry Yogurt','Vitality','Dairy',24.5,48,4.2,14.1,45,true);
