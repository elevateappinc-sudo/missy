-- ============================================
-- Asigna imágenes de platos de pescado a menu_items
-- sin imagen, para el restaurante de brayan2.quitian20@gmail.com
-- ============================================
-- Ejecutar en Supabase → SQL Editor

WITH target_user AS (
  SELECT id
  FROM auth.users
  WHERE email = 'brayan2.quitian20@gmail.com'
  LIMIT 1
),
target_restaurants AS (
  SELECT r.id
  FROM restaurants r
  JOIN target_user u ON r.owner_id = u.id
),
-- Platos sin imagen, numerados para repartirles una URL distinta
items_to_update AS (
  SELECT
    mi.id,
    ROW_NUMBER() OVER (ORDER BY mi.created_at) AS rn
  FROM menu_items mi
  WHERE mi.restaurant_id IN (SELECT id FROM target_restaurants)
    AND (mi.image_url IS NULL OR mi.image_url = '')
),
-- Pool de imágenes de pescado (Unsplash, uso comercial libre)
fish_pool AS (
  SELECT * FROM (VALUES
    (1,  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop'),
    (2,  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=600&fit=crop'),
    (3,  'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=800&h=600&fit=crop'),
    (4,  'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&h=600&fit=crop'),
    (5,  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop'),
    (6,  'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&h=600&fit=crop'),
    (7,  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop'),
    (8,  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=600&fit=crop'),
    (9,  'https://images.unsplash.com/photo-1559847844-d03d0d6d6c1d?w=800&h=600&fit=crop'),
    (10, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&h=600&fit=crop'),
    (11, 'https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=800&h=600&fit=crop'),
    (12, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=600&fit=crop')
  ) AS t(idx, url)
),
pool_size AS (SELECT COUNT(*) AS n FROM fish_pool)
UPDATE menu_items mi
SET image_url = fp.url,
    updated_at = now()
FROM items_to_update itu, fish_pool fp, pool_size ps
WHERE mi.id = itu.id
  AND fp.idx = ((itu.rn - 1) % ps.n) + 1
RETURNING mi.name, mi.image_url;
