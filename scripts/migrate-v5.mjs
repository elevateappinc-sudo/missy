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
-- V5: Team members + Invitations
-- ============================================

CREATE TABLE IF NOT EXISTS restaurant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  permissions JSONB DEFAULT '{"menu":true,"tables":true,"orders":true,"qr":true,"settings":false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_members_user ON restaurant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_members_restaurant ON restaurant_members(restaurant_id);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  permissions JSONB DEFAULT '{"menu":true,"tables":true,"orders":true,"qr":true,"settings":false}'::jsonb,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_restaurant ON invitations(restaurant_id);

ALTER TABLE restaurant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Members: owners can manage, members can read self
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'members_owner_all') THEN
    CREATE POLICY members_owner_all ON restaurant_members FOR ALL USING (
      restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'members_read_self') THEN
    CREATE POLICY members_read_self ON restaurant_members FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Invitations: owners manage their own. Lookup/accept uses server API with
-- service role (bypasses RLS) so no public policies needed.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'invitations_owner_all') THEN
    CREATE POLICY invitations_owner_all ON invitations FOR ALL USING (
      restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid())
    );
  END IF;
END $$;

-- Drop any previously-created permissive policies from earlier V5 runs
DROP POLICY IF EXISTS invitations_public_read ON invitations;
DROP POLICY IF EXISTS invitations_public_update ON invitations;

-- Allow authenticated users to insert themselves as a member (used by accept-invite flow)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'members_self_insert') THEN
    CREATE POLICY members_self_insert ON restaurant_members FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Extend owner policies on core tables so members with permissions can access
-- (These add supplemental policies — existing owner_all_* policies still apply)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_read_restaurants') THEN
    CREATE POLICY member_read_restaurants ON restaurants FOR SELECT USING (
      id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_all_menu_categories') THEN
    CREATE POLICY member_all_menu_categories ON menu_categories FOR ALL USING (
      restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_all_menu_items') THEN
    CREATE POLICY member_all_menu_items ON menu_items FOR ALL USING (
      restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_all_tables') THEN
    CREATE POLICY member_all_tables ON tables FOR ALL USING (
      restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_all_orders') THEN
    CREATE POLICY member_all_orders ON orders FOR ALL USING (
      restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_all_order_items') THEN
    CREATE POLICY member_all_order_items ON order_items FOR ALL USING (
      order_id IN (SELECT id FROM orders WHERE restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'member_all_avatar') THEN
    CREATE POLICY member_all_avatar ON avatar_configs FOR ALL USING (
      restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;
`;

async function migrate() {
  console.log("🚀 Running Missy V5 migration (members + invitations)...\n");
  const client = new pg.Client(dbConfig);
  try {
    await client.connect();
    console.log("✓ Connected to database\n");
    await client.query(sql);
    console.log("✓ V5 migration applied successfully");
  } catch (err) {
    console.error("✗ Migration error:", err.message);
  } finally {
    await client.end();
    console.log("✓ Connection closed");
  }
}

migrate();
