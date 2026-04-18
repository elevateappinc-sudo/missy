import pg from "pg";

const dbConfig = {
  host: "aws-1-us-east-2.pooler.supabase.com",
  port: 5432,
  user: "postgres.ytmflgongtrqyrljsmjh",
  password: "ePLvh3YudAlp76hP",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

const sql = `
-- ============================================
-- MISSY — Database Schema
-- ============================================

-- Restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#a855f7',
  secondary_color TEXT DEFAULT '#f472b6',
  description TEXT,
  country TEXT DEFAULT 'Colombia',
  phone TEXT,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  is_active BOOLEAN DEFAULT true,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Menu Categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_daily_special BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qr_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Avatar Config
CREATE TABLE IF NOT EXISTS avatar_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID UNIQUE NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Missy',
  style TEXT DEFAULT 'robot' CHECK (style IN ('robot', 'human', 'mascot', 'custom')),
  voice_id TEXT DEFAULT 'default',
  personality TEXT DEFAULT 'friendly' CHECK (personality IN ('formal', 'friendly', 'funny', 'sophisticated')),
  greeting_message TEXT DEFAULT '¡Hola! Soy Missy, tu mesero virtual. ¿En qué te puedo ayudar?',
  primary_color TEXT DEFAULT '#a855f7',
  asset_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Client Profiles
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client Sessions
CREATE TABLE IF NOT EXISTS client_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  client_id UUID REFERENCES client_profiles(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  session_id UUID REFERENCES client_sessions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered')),
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  notes TEXT
);

-- Knowledge Base (for RAG)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'text' CHECK (source_type IN ('text', 'pdf', 'url')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant ON menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_restaurant ON client_sessions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_client_sessions_table ON client_sessions(table_id);

-- RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Owner policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_restaurants') THEN
    CREATE POLICY owner_all_restaurants ON restaurants FOR ALL USING (owner_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_menu_categories') THEN
    CREATE POLICY owner_all_menu_categories ON menu_categories FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_menu_items') THEN
    CREATE POLICY owner_all_menu_items ON menu_items FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_tables') THEN
    CREATE POLICY owner_all_tables ON tables FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_avatar') THEN
    CREATE POLICY owner_all_avatar ON avatar_configs FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_orders') THEN
    CREATE POLICY owner_all_orders ON orders FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_order_items') THEN
    CREATE POLICY owner_all_order_items ON order_items FOR ALL USING (order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_knowledge') THEN
    CREATE POLICY owner_all_knowledge ON knowledge_base FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
END $$;

-- Public read policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_restaurants') THEN
    CREATE POLICY public_read_restaurants ON restaurants FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_menu_categories') THEN
    CREATE POLICY public_read_menu_categories ON menu_categories FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_menu_items') THEN
    CREATE POLICY public_read_menu_items ON menu_items FOR SELECT USING (is_available = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_tables') THEN
    CREATE POLICY public_read_tables ON tables FOR SELECT USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_avatar') THEN
    CREATE POLICY public_read_avatar ON avatar_configs FOR SELECT USING (true);
  END IF;
END $$;

-- Public insert policies (for clients placing orders)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_orders') THEN
    CREATE POLICY public_insert_orders ON orders FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_orders') THEN
    CREATE POLICY public_read_orders ON orders FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update_orders') THEN
    CREATE POLICY public_update_orders ON orders FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_order_items') THEN
    CREATE POLICY public_insert_order_items ON order_items FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_order_items') THEN
    CREATE POLICY public_read_order_items ON order_items FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_sessions') THEN
    CREATE POLICY public_insert_sessions ON client_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_profiles') THEN
    CREATE POLICY public_insert_profiles ON client_profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_profiles') THEN
    CREATE POLICY public_read_profiles ON client_profiles FOR SELECT USING (true);
  END IF;
END $$;

-- Enable Realtime for orders
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================
-- V2: Tables — position, shape, capacity, status
-- ============================================
ALTER TABLE tables ADD COLUMN IF NOT EXISTS position_x NUMERIC DEFAULT 100;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS position_y NUMERIC DEFAULT 100;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS width NUMERIC DEFAULT 100;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS height NUMERIC DEFAULT 100;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'square';
ALTER TABLE tables ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 4;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'empty';

-- Enable Realtime for tables
DO $$ BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Public update policy for tables status (clients can update status when ordering)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update_tables') THEN
    CREATE POLICY public_update_tables ON tables FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================
-- V3: Tables — floor support (pisos + barra)
-- ============================================
ALTER TABLE tables ADD COLUMN IF NOT EXISTS floor TEXT DEFAULT 'Piso 1';

-- V4: Orders — make session_id optional (nullable)
-- Already nullable in schema, but ensure orders work without session_id

-- Public read policy for client_sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_sessions') THEN
    CREATE POLICY public_read_sessions ON client_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_update_sessions') THEN
    CREATE POLICY public_update_sessions ON client_sessions FOR UPDATE USING (true);
  END IF;
END $$;

-- ============================================
-- V5: Menu — per-category font scale
-- ============================================
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS font_scale NUMERIC(3,2) DEFAULT 1.0;

-- ============================================
-- V6: Menu text blocks — headings/paragraphs/footers between categories
-- ============================================
CREATE TABLE IF NOT EXISTS menu_text_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  block_type TEXT NOT NULL DEFAULT 'paragraph' CHECK (block_type IN ('heading','paragraph','footer')),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_text_blocks_restaurant ON menu_text_blocks(restaurant_id);
ALTER TABLE menu_text_blocks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_menu_text_blocks') THEN
    CREATE POLICY owner_all_menu_text_blocks ON menu_text_blocks FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_menu_text_blocks') THEN
    CREATE POLICY public_read_menu_text_blocks ON menu_text_blocks FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- ============================================
-- V7: Restaurant floors — persist floor list independent of tables
-- ============================================
CREATE TABLE IF NOT EXISTS restaurant_floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_restaurant_floors_restaurant ON restaurant_floors(restaurant_id);
ALTER TABLE restaurant_floors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'owner_all_restaurant_floors') THEN
    CREATE POLICY owner_all_restaurant_floors ON restaurant_floors FOR ALL USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_read_restaurant_floors') THEN
    CREATE POLICY public_read_restaurant_floors ON restaurant_floors FOR SELECT USING (true);
  END IF;
END $$;

-- Seed existing distinct floor values from tables so data isn't lost
INSERT INTO restaurant_floors (restaurant_id, name, sort_order)
SELECT DISTINCT restaurant_id, floor, 0
FROM tables
WHERE floor IS NOT NULL AND floor <> ''
ON CONFLICT DO NOTHING;

-- Ensure every restaurant has at least Piso 1
INSERT INTO restaurant_floors (restaurant_id, name, sort_order)
SELECT r.id, 'Piso 1', 0
FROM restaurants r
WHERE NOT EXISTS (SELECT 1 FROM restaurant_floors f WHERE f.restaurant_id = r.id)
ON CONFLICT DO NOTHING;

-- ============================================
-- V8: Menu — free-layout coordinates on sections
-- ============================================
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS layout_x NUMERIC;
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS layout_y NUMERIC;
ALTER TABLE menu_categories ADD COLUMN IF NOT EXISTS layout_w NUMERIC;
ALTER TABLE menu_text_blocks ADD COLUMN IF NOT EXISTS layout_x NUMERIC;
ALTER TABLE menu_text_blocks ADD COLUMN IF NOT EXISTS layout_y NUMERIC;
ALTER TABLE menu_text_blocks ADD COLUMN IF NOT EXISTS layout_w NUMERIC;
`;

async function migrate() {
  console.log("🚀 Running Missy migration...\n");
  const client = new pg.Client(dbConfig);
  try {
    await client.connect();
    console.log("✓ Connected to database\n");
    await client.query(sql);
    console.log("✓ All tables, indexes, and policies created successfully");
  } catch (err) {
    console.error("✗ Migration error:", err.message);
  } finally {
    await client.end();
    console.log("✓ Connection closed");
  }
}

migrate();
