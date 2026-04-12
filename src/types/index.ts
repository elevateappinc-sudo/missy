// ============================================
// MISSY — Tipos del sistema
// ============================================

// --- Restaurante ---
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  description: string | null;
  country: string;
  phone: string | null;
  email: string;
  plan: "free" | "basic" | "premium";
  is_active: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

// --- Menú ---
export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_daily_special: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Mesas ---
export type TableShape = "round" | "square" | "rectangle";
export type TableStatus = "empty" | "occupied" | "ordering" | "waiting" | "served";

export interface Table {
  id: string;
  restaurant_id: string;
  name: string;
  qr_code: string;
  is_active: boolean;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  shape: TableShape;
  capacity: number;
  status: TableStatus;
  floor: string;
  created_at: string;
}

// --- Pedidos ---
export interface Order {
  id: string;
  restaurant_id: string;
  table_id: string;
  session_id: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered";
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  menu_item?: MenuItem;
}

// --- Avatar ---
export interface AvatarConfig {
  id: string;
  restaurant_id: string;
  name: string;
  style: "robot" | "human" | "mascot" | "custom";
  voice_id: string;
  personality: "formal" | "friendly" | "funny" | "sophisticated";
  greeting_message: string;
  primary_color: string;
  asset_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- Sesión de cliente ---
export interface ClientSession {
  id: string;
  restaurant_id: string;
  table_id: string;
  client_id: string | null;
  started_at: string;
  ended_at: string | null;
}

// --- Perfil de cliente ---
export interface ClientProfile {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  is_anonymous: boolean;
  created_at: string;
}

// --- Conversación ---
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}
