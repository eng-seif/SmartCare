-- Realistic nutrition data. Values are per SERVING (see serving_size), approximated from product labels and
-- published glycemic-index tables (University of Sydney GIDB). Check each against the actual pack before launch.
-- Barcodes start with 2 (GS1 "in-store use" range) so they never clash with real products. Prices are placeholders in EGP.
alter table products add column if not exists serving_size text;

with v(title, barcode, category, price, serving_size, gi, sugar, carbs, sodium, lactose_free, gluten_free) as (values
  ('Plain Greek Yogurt','2000000000015','Dairy',24,'170 g cup',11,0,6,65,false,true),
  ('Low-Fat Milk','2000000000022','Dairy',52,'250 ml glass',32,0,12,105,false,true),
  ('Full-Fat Milk','2000000000039','Dairy',55,'250 ml glass',31,0,12,100,false,true),
  ('Unsweetened Almond Milk','2000000000046','Beverages',70,'250 ml glass',25,0,1,170,true,true),
  ('White Cheese (Gebna Beda)','2000000000053','Dairy',38,'40 g',0,0,1,440,false,true),
  ('Flaxseed & Oat Bread','2000000000060','Bakery',35,'2 slices (60 g)',45,0,22,280,true,false),
  ('White Toast Bread','2000000000077','Bakery',25,'2 slices (60 g)',75,2,28,320,true,false),
  ('Rolled Oats','2000000000084','Grains',45,'40 g dry',55,0,20,2,true,false),
  ('Brown Lentils 1kg','2000000000091','Grains',48,'40 g dry',29,0,20,2,true,true),
  ('White Rice 1kg','2000000000107','Grains',40,'150 g cooked',73,0,41,2,true,true),
  ('Pasta (Macaroni) 400g','2000000000114','Grains',18,'150 g cooked',49,0,34,5,true,false),
  ('Cola Soft Drink 330ml','2000000000121','Beverages',15,'330 ml can',63,35,35,15,true,true),
  ('Sweetened Orange Juice','2000000000138','Beverages',25,'250 ml glass',68,15,28,5,true,true),
  ('Natural Orange Juice (No Added Sugar)','2000000000145','Beverages',30,'250 ml glass',50,0,22,5,true,true),
  ('Unsweetened Green Tea','2000000000152','Beverages',9,'250 ml cup',0,0,0,0,true,true),
  ('Strawberry Jam','2000000000169','Pantry',32,'1 tbsp (20 g)',51,12,13,5,true,true),
  ('Raw Almonds','2000000000176','Snacks',64,'30 g',15,0,3,0,true,true),
  ('Dried Dates','2000000000183','Snacks',55,'3 dates (30 g)',55,0,22,1,true,true),
  ('Milk Chocolate Bar','2000000000190','Snacks',20,'40 g bar',40,20,22,40,false,true),
  ('Sweet Biscuits','2000000000206','Snacks',12,'4 biscuits (30 g)',70,8,22,100,false,false),
  ('Boiled Eggs (2)','2000000000213','Protein',8,'2 large eggs',0,0,1,140,true,true),
  ('Canned Tuna in Water','2000000000220','Protein',42,'80 g drained',0,0,0,280,true,true),
  ('Chickpeas (Cooked)','2000000000237','Grains',20,'100 g cooked',28,0,19,7,true,true)
),
upd as (
  update products p set category=v.category, serving_size=v.serving_size, glycemic_index=v.gi,
         sugar_content=v.sugar, net_carbs=v.carbs, sodium_content=v.sodium,
         is_lactose_free=v.lactose_free, is_gluten_free=v.gluten_free
  from v where p.title = v.title returning p.title
)
insert into products(title, barcode, category, price, serving_size, glycemic_index, sugar_content, net_carbs, sodium_content, is_lactose_free, is_gluten_free)
select title, barcode, category, price, serving_size, gi, sugar, carbs, sodium, lactose_free, gluten_free
from v where title not in (select title from upd);

-- Glycemic load = GI x net carbs / 100 (the standard formula).
-- Health score = transparent 0-100 score (NOT clinical): 100 - 0.4*GI - 1.5*added sugar - 0.5*net carbs - sodium/20.
update products set
  glycemic_load = round((coalesce(glycemic_index,0) * coalesce(net_carbs,0) / 100.0)::numeric, 1),
  health_score  = greatest(0, least(100, round(100 - 0.4*coalesce(glycemic_index,0) - 1.5*coalesce(sugar_content,0)
                                                  - 0.5*coalesce(net_carbs,0) - coalesce(sodium_content,0)/20.0)));

-- Suggested swaps (skipped if they already exist)
insert into alternative_products(original_product_id, healthy_alternative_id, reason)
select o.id, a.id, s.reason from (values
  ('Cola Soft Drink 330ml','Unsweetened Green Tea','Zero sugar and zero carbs'),
  ('Sweetened Orange Juice','Natural Orange Juice (No Added Sugar)','No added sugar'),
  ('White Toast Bread','Flaxseed & Oat Bread','Lower glycemic index and more fiber'),
  ('White Rice 1kg','Brown Lentils 1kg','Much lower glycemic index and more fiber'),
  ('Milk Chocolate Bar','Raw Almonds','No added sugar, minimal carbs'),
  ('Sweet Biscuits','Raw Almonds','No added sugar, minimal carbs')
) as s(orig, alt, reason)
join products o on o.title = s.orig join products a on a.title = s.alt
where not exists (select 1 from alternative_products x where x.original_product_id=o.id and x.healthy_alternative_id=a.id);

-- Image links (only for products that don't have one yet)
update products
set image_url = 'https://luukvzyqieutnpfwlzqr.supabase.co/storage/v1/object/public/product-images/'
  || trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '.jpg'
where image_url is null or image_url = '';

select title, serving_size, glycemic_index as gi, glycemic_load as gl, sugar_content as sugar, net_carbs, sodium_content as sodium, health_score from products order by title;
