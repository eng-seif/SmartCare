import type { Product } from './health'

type NutritionPatch = Partial<
  Pick<
    Product,
    | 'glycemic_index'
    | 'glycemic_load'
    | 'sugar_content'
    | 'net_carbs'
    | 'sodium_content'
    | 'health_score'
    | 'is_gluten_free'
    | 'is_lactose_free'
    | 'sat_fat_g'
    | 'serving_size'
  >
>

/**
 * Standard USDA FoodData Central / University of Sydney GI reference values
 * (per 100 g edible portion for raw produce; sat_fat_g for packaged catalog items
 * because the Supabase products table does not have a sat_fat_g column).
 * Only fills fields that are null/undefined in the database.
 */
const REFERENCE_NUTRITION: Record<string, NutritionPatch> = {
  // Fresh Vegetables (per 100 g raw reference)
  'Fresh Tomatoes (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 2.6, net_carbs: 2.7, sodium_content: 5, health_score: 94, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Cucumbers (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 1.7, net_carbs: 3.1, sodium_content: 2, health_score: 96, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Carrots (500 g)': { glycemic_index: 39, glycemic_load: 2, sugar_content: 4.7, net_carbs: 6.8, sodium_content: 69, health_score: 88, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Broccoli (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 1.7, net_carbs: 4.0, sodium_content: 33, health_score: 96, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Zucchini (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 2.5, net_carbs: 2.1, sodium_content: 8, health_score: 95, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Potatoes (500 g)': { glycemic_index: 78, glycemic_load: 12, sugar_content: 0.8, net_carbs: 15.3, sodium_content: 6, health_score: 62, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Sweet Potatoes (500 g)': { glycemic_index: 54, glycemic_load: 9, sugar_content: 4.2, net_carbs: 17.1, sodium_content: 55, health_score: 79, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Red Onions (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 4.2, net_carbs: 7.6, sodium_content: 4, health_score: 90, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Eggplants (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 3.5, net_carbs: 2.9, sodium_content: 2, health_score: 93, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Green Beans (500 g)': { glycemic_index: 15, glycemic_load: 1, sugar_content: 3.3, net_carbs: 4.3, sodium_content: 6, health_score: 94, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },

  // Fresh Fruits (per 100 g raw reference)
  'Fresh Bananas (500 g)': { glycemic_index: 51, glycemic_load: 10, sugar_content: 12.2, net_carbs: 20.2, sodium_content: 1, health_score: 72, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0.1, serving_size: '100 g raw (ref)' },
  'Fresh Red Apples (500 g)': { glycemic_index: 36, glycemic_load: 4, sugar_content: 10.4, net_carbs: 11.4, sodium_content: 1, health_score: 84, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Green Apples (500 g)': { glycemic_index: 32, glycemic_load: 3, sugar_content: 9.6, net_carbs: 10.8, sodium_content: 1, health_score: 86, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Oranges (500 g)': { glycemic_index: 43, glycemic_load: 4, sugar_content: 9.4, net_carbs: 9.4, sodium_content: 0, health_score: 85, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Red Grapes (500 g)': { glycemic_index: 59, glycemic_load: 10, sugar_content: 15.5, net_carbs: 17.2, sodium_content: 2, health_score: 68, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0.1, serving_size: '100 g raw (ref)' },
  'Fresh Figs (500 g)': { glycemic_index: 61, glycemic_load: 10, sugar_content: 16.3, net_carbs: 16.3, sodium_content: 1, health_score: 66, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0.1, serving_size: '100 g raw (ref)' },
  'Fresh Pomegranates (1 kg)': { glycemic_index: 35, glycemic_load: 5, sugar_content: 13.7, net_carbs: 14.7, sodium_content: 3, health_score: 80, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0.1, serving_size: '100 g arils (ref)' },
  'Fresh Guavas (500 g)': { glycemic_index: 12, glycemic_load: 1, sugar_content: 8.9, net_carbs: 8.9, sodium_content: 2, health_score: 90, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0.3, serving_size: '100 g raw (ref)' },
  'Fresh Lemons (500 g)': { glycemic_index: 20, glycemic_load: 1, sugar_content: 2.5, net_carbs: 6.5, sodium_content: 2, health_score: 92, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },
  'Fresh Kiwi (500 g)': { glycemic_index: 50, glycemic_load: 6, sugar_content: 9.0, net_carbs: 11.7, sodium_content: 3, health_score: 83, is_gluten_free: true, is_lactose_free: true, sat_fat_g: 0, serving_size: '100 g raw (ref)' },

  // Packaged items: fill sat_fat_g (missing column in DB) so cardio screening works cleanly
  'Natural Orange Juice (No Added Sugar)': { sat_fat_g: 0 },
  'Flaxseed & Oat Bread': { sat_fat_g: 0.5 },
  'Low-Fat Milk': { sat_fat_g: 1.5 },
  'Full-Fat Milk': { sat_fat_g: 4.5 },
  'Sweetened Orange Juice': { sat_fat_g: 0 },
  'Plain Greek Yogurt': { sat_fat_g: 2.5 },
  'Unsweetened Almond Milk': { sat_fat_g: 0.2 },
  'White Toast Bread': { sat_fat_g: 0.6 },
  'Brown Lentils 1kg': { sat_fat_g: 0.1 },
  'White Rice 1kg': { sat_fat_g: 0.1 },
  'Strawberry Jam': { sat_fat_g: 0 },
  'Raw Almonds': { sat_fat_g: 1.1 },
  'Cola Soft Drink 330ml': { sat_fat_g: 0 },
  'Unsweetened Green Tea': { sat_fat_g: 0 },
  'White Cheese (Gebna Beda)': { sat_fat_g: 6.0 },
  'Rolled Oats': { sat_fat_g: 0.6 },
  'Pasta (Macaroni) 400g': { sat_fat_g: 0.2 },
  'Dried Dates': { sat_fat_g: 0 },
  'Milk Chocolate Bar': { sat_fat_g: 9.0 },
  'Sweet Biscuits': { sat_fat_g: 4.0 },
  'Boiled Eggs (2)': { sat_fat_g: 3.2 },
  'Canned Tuna in Water': { sat_fat_g: 0.2 },
  'Chickpeas (Cooked)': { sat_fat_g: 0.3 },
}

export function enrichProduct(p: Product): Product {
  const ref = REFERENCE_NUTRITION[p.title]
  if (!ref) return p
  return {
    ...p,
    glycemic_index: p.glycemic_index ?? ref.glycemic_index ?? null,
    glycemic_load: p.glycemic_load ?? ref.glycemic_load ?? null,
    sugar_content: p.sugar_content ?? ref.sugar_content ?? null,
    net_carbs: p.net_carbs ?? ref.net_carbs ?? null,
    sodium_content: p.sodium_content ?? ref.sodium_content ?? null,
    health_score: p.health_score ?? ref.health_score ?? null,
    is_gluten_free: p.is_gluten_free ?? ref.is_gluten_free ?? null,
    is_lactose_free: p.is_lactose_free ?? ref.is_lactose_free ?? null,
    sat_fat_g: p.sat_fat_g ?? ref.sat_fat_g ?? null,
    serving_size: ref.serving_size && p.sugar_content == null ? ref.serving_size : p.serving_size,
  }
}

export function hasReferenceFallback(p: Product): boolean {
  return p.sugar_content == null && Boolean(REFERENCE_NUTRITION[p.title]?.sugar_content !== undefined)
}
