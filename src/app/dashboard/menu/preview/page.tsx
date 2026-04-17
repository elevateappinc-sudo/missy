"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Printer,
  Columns2,
  Columns3,
  LayoutList,
  Image as ImageIcon,
  ImageOff,
  Pencil,
  Check,
  GripVertical,
  X as XIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_daily_special: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
}

type MenuStyle =
  | "elegant"
  | "classic"
  | "modern"
  | "tierra"
  | "maritimo"
  | "peruano"
  | "carne"
  | "colombiano"
  | "cafeteria"
  | "rustico"
  | "bistro";
type LayoutMode = "single" | "two-col" | "three-col";

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(price);
}

const STYLE_CONFIG: Record<MenuStyle, {
  label: string;
  emoji: string;
  bg: string;
  text: string;
  accent: string;
  accentText: string;
  muted: string;
  border: string;
  specialBg: string;
  specialBorder: string;
  cardBg: string;
  font?: string;
  headerDecoration?:
    | "lines"
    | "diamond"
    | "wave"
    | "leaf"
    | "anchor"
    | "sun"
    | "flame"
    | "coffee"
    | "swirl"
    | "house"
    | "double-line";
  priceBadge?: boolean;
  titleFont?: string;
  titleClass?: string;
  categoryTitleClass?: string;
}> = {
  elegant: {
    label: "Elegante",
    emoji: "✨",
    bg: "bg-[#0a0a0a]",
    text: "text-[#f5f0eb]",
    accent: "text-[#c4a87c]",
    accentText: "text-[#c4a87c]",
    muted: "text-[#807060]",
    border: "border-[#333]",
    specialBg: "bg-[#c4a87c]/5",
    specialBorder: "border-[#c4a87c]/20",
    cardBg: "bg-white/[0.03]",
    headerDecoration: "lines",
  },
  classic: {
    label: "Clásico",
    emoji: "📜",
    bg: "bg-[#faf7f2]",
    text: "text-[#2c2420]",
    accent: "text-[#c4a060]",
    accentText: "text-[#c4a060]",
    muted: "text-[#7a6a5a]",
    border: "border-[#d4c4a0]/40",
    specialBg: "bg-[#f5f0e8]",
    specialBorder: "border-[#d4c4a0]/40",
    cardBg: "bg-white/60",
    font: "Georgia, 'Times New Roman', serif",
    headerDecoration: "diamond",
  },
  modern: {
    label: "Moderno",
    emoji: "🎨",
    bg: "bg-white",
    text: "text-[#1a1a1a]",
    accent: "text-primary",
    accentText: "text-primary",
    muted: "text-[#999]",
    border: "border-[#eee]",
    specialBg: "bg-primary/5",
    specialBorder: "border-primary/15",
    cardBg: "bg-[#f8f8f8]",
    headerDecoration: "wave",
  },
  tierra: {
    label: "De Tierra",
    emoji: "🌾",
    bg: "bg-[#f5f0e6]",
    text: "text-[#3d2b1f]",
    accent: "text-[#8b6914]",
    accentText: "text-[#8b6914]",
    muted: "text-[#7a6b55]",
    border: "border-[#d4c09a]/50",
    specialBg: "bg-[#e8dcc8]",
    specialBorder: "border-[#c4a060]/30",
    cardBg: "bg-[#ede5d5]",
    font: "'Georgia', serif",
    headerDecoration: "leaf",
  },
  maritimo: {
    label: "Marítimo",
    emoji: "🌊",
    bg: "bg-[#f0f6fa]",
    text: "text-[#1a3a4a]",
    accent: "text-[#2980b9]",
    accentText: "text-[#2980b9]",
    muted: "text-[#6a8fa0]",
    border: "border-[#b0d0e0]/50",
    specialBg: "bg-[#daeaf5]",
    specialBorder: "border-[#2980b9]/20",
    cardBg: "bg-white/70",
    headerDecoration: "anchor",
  },
  peruano: {
    label: "Peruano",
    emoji: "🇵🇪",
    bg: "bg-[#fdf8f0]",
    text: "text-[#2c1810]",
    accent: "text-[#d4380d]",
    accentText: "text-[#d4380d]",
    muted: "text-[#8a6a50]",
    border: "border-[#e8c8a0]/50",
    specialBg: "bg-[#fce8d5]",
    specialBorder: "border-[#d4380d]/20",
    cardBg: "bg-[#faf0e0]",
    headerDecoration: "sun",
  },
  carne: {
    label: "Carnes",
    emoji: "🥩",
    bg: "bg-[#1a1212]",
    text: "text-[#f5ebe0]",
    accent: "text-[#c0392b]",
    accentText: "text-[#e74c3c]",
    muted: "text-[#8a7060]",
    border: "border-[#3a2020]",
    specialBg: "bg-[#c0392b]/10",
    specialBorder: "border-[#c0392b]/20",
    cardBg: "bg-white/[0.04]",
    headerDecoration: "flame",
  },
  colombiano: {
    label: "Colombiano",
    emoji: "🇨🇴",
    bg: "bg-[#fffdf5]",
    text: "text-[#2a1f10]",
    accent: "text-[#c68a00]",
    accentText: "text-[#c68a00]",
    muted: "text-[#7a6a45]",
    border: "border-[#e0c880]/40",
    specialBg: "bg-[#fdf0c8]",
    specialBorder: "border-[#c68a00]/25",
    cardBg: "bg-[#faf5e5]",
    font: "'Georgia', serif",
    headerDecoration: "coffee",
  },
  cafeteria: {
    label: "Cafetería",
    emoji: "☕",
    bg: "bg-[#f0e8d4]",
    text: "text-[#1e4fb8]",
    accent: "text-[#1e4fb8]",
    accentText: "text-[#1e4fb8]",
    muted: "text-[#3a5a9a]",
    border: "border-[#1e4fb8]/30",
    specialBg: "bg-[#e4dcc0]",
    specialBorder: "border-[#1e4fb8]/25",
    cardBg: "bg-[#e8e0cc]",
    headerDecoration: "swirl",
    titleClass: "text-[72px] font-black tracking-tight leading-none",
    categoryTitleClass: "text-[28px] font-bold tracking-tight",
  },
  rustico: {
    label: "Rústico",
    emoji: "🏡",
    bg: "bg-[#f3ead2]",
    text: "text-[#3a2a1a]",
    accent: "text-[#1d3a4a]",
    accentText: "text-white",
    muted: "text-[#6a5440]",
    border: "border-[#8a6a40]/30",
    specialBg: "bg-[#ebdfc0]",
    specialBorder: "border-[#1d3a4a]/25",
    cardBg: "bg-[#efe4c4]",
    font: "'Georgia', 'Times New Roman', serif",
    headerDecoration: "house",
    priceBadge: true,
    titleClass: "text-[32px] font-semibold tracking-[0.15em] uppercase",
    categoryTitleClass: "text-[15px] font-bold tracking-[0.25em] uppercase",
  },
  bistro: {
    label: "Bistró",
    emoji: "🍽️",
    bg: "bg-[#f5f1e4]",
    text: "text-[#15243a]",
    accent: "text-[#15243a]",
    accentText: "text-[#15243a]",
    muted: "text-[#4a5468]",
    border: "border-[#15243a]/25",
    specialBg: "bg-[#15243a]",
    specialBorder: "border-[#15243a]",
    cardBg: "bg-[#ebe4d0]",
    font: "'Georgia', serif",
    headerDecoration: "double-line",
    titleClass: "text-[44px] font-bold tracking-[0.08em]",
    categoryTitleClass: "text-[18px] font-bold tracking-[0.2em] uppercase",
  },
};

function HeaderDecoration({ type, accent }: { type?: string; accent: string }) {
  switch (type) {
    case "lines":
      return (
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className={`h-px w-16 ${accent === "text-[#c4a87c]" ? "bg-[#c4a87c]" : "bg-current"} opacity-40`} />
          <span className={`text-[11px] tracking-[0.3em] uppercase font-light ${accent}`}>Menú</span>
          <span className={`h-px w-16 ${accent === "text-[#c4a87c]" ? "bg-[#c4a87c]" : "bg-current"} opacity-40`} />
        </div>
      );
    case "diamond":
      return (
        <div className="flex justify-center mb-4">
          <span className={`${accent} text-[18px]`}>✦</span>
        </div>
      );
    case "wave":
      return (
        <div className="flex justify-center mb-4">
          <span className="text-[16px] tracking-[0.5em] opacity-30">〰〰〰</span>
        </div>
      );
    case "leaf":
      return (
        <div className="flex justify-center mb-4 gap-2">
          <span className="text-[16px] opacity-50">🌿</span>
          <span className={`h-px w-12 self-center ${accent === "text-[#8b6914]" ? "bg-[#8b6914]" : "bg-current"} opacity-30`} />
          <span className="text-[16px] opacity-50">🌿</span>
        </div>
      );
    case "anchor":
      return (
        <div className="flex justify-center mb-4">
          <span className="text-[20px] opacity-40">⚓</span>
        </div>
      );
    case "sun":
      return (
        <div className="flex justify-center mb-4">
          <span className="text-[18px]">☀️</span>
        </div>
      );
    case "flame":
      return (
        <div className="flex justify-center mb-4 gap-1">
          <span className="text-[14px]">🔥</span>
          <span className={`h-px w-10 self-center bg-[#c0392b] opacity-30`} />
          <span className="text-[14px]">🔥</span>
        </div>
      );
    case "coffee":
      return (
        <div className="flex justify-center mb-4">
          <span className="text-[18px]">☕</span>
        </div>
      );
    case "swirl":
      return (
        <div className="flex justify-center mb-3">
          <svg width="90" height="40" viewBox="0 0 90 40" fill="none" className={accent}>
            <path
              d="M10 30 C 10 10, 30 10, 30 25 C 30 35, 20 35, 22 22 C 24 12, 45 10, 60 18 C 72 25, 80 20, 85 12"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      );
    case "house":
      return (
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className={`h-px w-14 ${accent === "text-[#1d3a4a]" ? "bg-[#1d3a4a]" : "bg-current"} opacity-40`} />
          <svg width="50" height="20" viewBox="0 0 50 20" fill="none" className={accent}>
            <path
              d="M4 18 L4 9 L10 4 L10 9 L18 4 L26 9 L26 4 L32 4 L32 7 L38 4 L46 9 L46 18 Z"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            <line x1="0" y1="18" x2="50" y2="18" stroke="currentColor" strokeWidth="1" />
          </svg>
          <span className={`h-px w-14 ${accent === "text-[#1d3a4a]" ? "bg-[#1d3a4a]" : "bg-current"} opacity-40`} />
        </div>
      );
    case "double-line":
      return (
        <div className="flex flex-col items-center gap-1 mb-4">
          <span className={`h-[2px] w-28 ${accent === "text-[#15243a]" ? "bg-[#15243a]" : "bg-current"}`} />
          <span className={`h-px w-28 ${accent === "text-[#15243a]" ? "bg-[#15243a]" : "bg-current"} opacity-50`} />
        </div>
      );
    default:
      return null;
  }
}

function Editable({
  value,
  onSave,
  editable,
  as: Tag = "span",
  className,
  placeholder,
  multiline,
}: {
  value: string;
  onSave: (next: string) => void;
  editable: boolean;
  as?: "span" | "p" | "h2" | "h3";
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  if (!editable) {
    return <Tag className={className}>{value || placeholder}</Tag>;
  }
  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      className={`${className ?? ""} outline-none focus:bg-yellow-100/60 focus:ring-2 focus:ring-yellow-300/60 rounded-[4px] px-0.5 -mx-0.5 cursor-text`}
      data-placeholder={placeholder}
      onBlur={(e) => {
        const next = (e.currentTarget.textContent ?? "").trim();
        if (next !== value) onSave(next);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.textContent = value;
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

export default function MenuPreviewPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [style, setStyle] = useState<MenuStyle>("elegant");
  const [layout, setLayout] = useState<LayoutMode>("single");
  const [showImages, setShowImages] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const dragItem = useRef<{ categoryId: string; itemId: string } | null>(null);
  const dragCategory = useRef<string | null>(null);

  const loadMenu = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("menu_categories")
      .select(
        "id, name, sort_order, menu_items(id, name, description, price, image_url, is_available, is_daily_special, sort_order)"
      )
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order");

    type RawItem = {
      id: string;
      name: string;
      description: string | null;
      price: number;
      image_url: string | null;
      is_available: boolean;
      is_daily_special: boolean;
      sort_order: number | null;
    };
    type RawCategory = {
      id: string;
      name: string;
      sort_order: number | null;
      menu_items: RawItem[] | null;
    };
    setCategories(
      ((data ?? []) as unknown as RawCategory[])
        .map<Category>((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sort_order ?? 0,
          items: (c.menu_items ?? [])
            .filter((i) => i.is_available)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map<MenuItem>((i) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              price: i.price,
              image_url: i.image_url,
              is_daily_special: i.is_daily_special,
              sort_order: i.sort_order ?? 0,
            })),
        }))
        .filter((c) => c.items.length > 0)
    );
  }, [restaurant, supabase]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  function handlePrint() {
    window.print();
  }

  async function saveItemField(
    itemId: string,
    field: "name" | "description" | "price",
    value: string
  ) {
    const payload: Record<string, unknown> = {};
    if (field === "price") {
      const num = Number(String(value).replace(/[^\d.]/g, ""));
      if (!Number.isFinite(num)) return;
      payload.price = num;
    } else if (field === "description") {
      payload.description = value.trim() === "" ? null : value.trim();
    } else {
      if (value.trim() === "") return;
      payload.name = value.trim();
    }
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, ...payload } : i)),
      }))
    );
    await supabase.from("menu_items").update(payload).eq("id", itemId);
  }

  async function saveCategoryName(categoryId: string, value: string) {
    const name = value.trim();
    if (!name) return;
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, name } : c)));
    await supabase.from("menu_categories").update({ name }).eq("id", categoryId);
  }

  async function removeItemImage(itemId: string) {
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, image_url: null } : i)),
      }))
    );
    await supabase.from("menu_items").update({ image_url: null }).eq("id", itemId);
  }

  async function reorderItems(categoryId: string, fromItemId: string, toItemId: string) {
    if (fromItemId === toItemId) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const fromIdx = cat.items.findIndex((i) => i.id === fromItemId);
    const toIdx = cat.items.findIndex((i) => i.id === toItemId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...cat.items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const withOrder = next.map((i, idx) => ({ ...i, sort_order: idx }));
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, items: withOrder } : c))
    );
    await Promise.all(
      withOrder.map((i) =>
        supabase.from("menu_items").update({ sort_order: i.sort_order }).eq("id", i.id)
      )
    );
  }

  async function reorderCategories(fromId: string, toId: string) {
    if (fromId === toId) return;
    const fromIdx = categories.findIndex((c) => c.id === fromId);
    const toIdx = categories.findIndex((c) => c.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...categories];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const withOrder = next.map((c, idx) => ({ ...c, sort_order: idx }));
    setCategories(withOrder);
    await Promise.all(
      withOrder.map((c) =>
        supabase.from("menu_categories").update({ sort_order: c.sort_order }).eq("id", c.id)
      )
    );
  }

  const cfg = STYLE_CONFIG[style];
  const specials = categories.flatMap((c) => c.items.filter((i) => i.is_daily_special));

  const gridClass =
    layout === "three-col"
      ? "grid grid-cols-3 gap-4"
      : layout === "two-col"
      ? "grid grid-cols-2 gap-4"
      : "space-y-5";

  return (
    <>
      {/* Controls bar */}
      <div className="print:hidden bg-white border-b border-border-light px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <a
            href="/dashboard/menu"
            className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al menú
          </a>
          <div className="flex items-center gap-2">
            {/* Layout selector */}
            <div className="flex items-center gap-1 bg-bg-warm rounded-[10px] p-1">
              <button
                onClick={() => setLayout("single")}
                className={`p-1.5 rounded-[8px] transition-all ${layout === "single" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
                title="Una columna"
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout("two-col")}
                className={`p-1.5 rounded-[8px] transition-all ${layout === "two-col" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
                title="Dos columnas"
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLayout("three-col")}
                className={`p-1.5 rounded-[8px] transition-all ${layout === "three-col" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
                title="Tres columnas"
              >
                <Columns3 className="w-4 h-4" />
              </button>
            </div>
            {/* Images toggle */}
            <button
              onClick={() => setShowImages(!showImages)}
              className={`p-1.5 rounded-[8px] transition-all ${showImages ? "bg-primary/10 text-primary" : "bg-bg-warm text-text-muted"}`}
              title={showImages ? "Ocultar imágenes" : "Mostrar imágenes"}
            >
              {showImages ? <ImageIcon className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
            </button>
            {/* Edit mode toggle */}
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all ${
                editMode
                  ? "bg-success/15 text-success"
                  : "bg-bg-warm text-text-secondary hover:bg-bg-warm/80"
              }`}
              title={editMode ? "Salir de edición" : "Editar y reordenar"}
            >
              {editMode ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              {editMode ? "Listo" : "Editar"}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Style selector - scrollable chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <span className="text-[12px] text-text-muted font-medium shrink-0">Estilo:</span>
          {(Object.entries(STYLE_CONFIG) as [MenuStyle, typeof STYLE_CONFIG[MenuStyle]][]).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setStyle(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0 ${
                style === key
                  ? "bg-primary text-white shadow-sm"
                  : "bg-bg-warm text-text-secondary hover:bg-bg-warm/80 border border-border-light"
              }`}
            >
              <span>{val.emoji}</span>
              {val.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu preview */}
      <div className={`min-h-screen ${cfg.bg} ${cfg.text}`} style={cfg.font ? { fontFamily: cfg.font } : {}}>
        <div className={`mx-auto px-8 py-16 print:py-8 ${layout === "three-col" ? "max-w-5xl" : layout === "two-col" ? "max-w-4xl" : "max-w-3xl"}`}>
          {/* Header */}
          <header className="text-center mb-16 print:mb-10">
            <HeaderDecoration type={cfg.headerDecoration} accent={cfg.accent} />
            <h1
              className={
                cfg.titleClass
                  ? `${cfg.titleClass} ${cfg.text}`
                  : `text-[40px] font-light tracking-[0.06em] ${cfg.text}`
              }
            >
              {restaurant?.name ?? "Restaurante"}
            </h1>
            {restaurant?.description && (
              <p className={`mt-3 max-w-md mx-auto text-[14px] ${cfg.muted}`}>
                {restaurant.description}
              </p>
            )}
          </header>

          {/* Daily specials */}
          {specials.length > 0 && (
            <section className="mb-14 print:mb-8">
              <div className="text-center mb-6">
                <p className={`text-[11px] tracking-[0.25em] uppercase mb-2 ${cfg.accent}`}>
                  Especiales del día
                </p>
              </div>
              <div className={`rounded-[12px] p-6 border ${cfg.specialBorder} ${cfg.specialBg}`}>
                {layout === "single" ? (
                  specials.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-3">
                      {showImages && item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-[10px] object-cover shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={`text-[15px] font-medium ${cfg.text}`}>{item.name}</span>
                        {item.description && (
                          <span className={`block text-[12px] mt-0.5 ${cfg.muted}`}>{item.description}</span>
                        )}
                      </div>
                      <span className={`text-[14px] font-medium ml-4 whitespace-nowrap ${cfg.accentText}`}>
                        ${formatPrice(item.price)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={layout === "three-col" ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4"}>
                    {specials.map((item) => (
                      <div key={item.id} className={`rounded-[10px] p-3 ${cfg.cardBg}`}>
                        {showImages && item.image_url && (
                          <img src={item.image_url} alt={item.name} className="w-full h-32 rounded-[8px] object-cover mb-2" />
                        )}
                        <p className={`text-[14px] font-medium ${cfg.text}`}>{item.name}</p>
                        {item.description && <p className={`text-[12px] mt-0.5 ${cfg.muted}`}>{item.description}</p>}
                        <p className={`text-[14px] font-semibold mt-1 ${cfg.accentText}`}>${formatPrice(item.price)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Categories */}
          {categories.map((category) => (
            <section
              key={category.id}
              className={`mb-14 print:mb-8 ${editMode ? "relative rounded-[12px]" : ""}`}
              draggable={editMode}
              onDragStart={(e) => {
                if (!editMode) return;
                if (dragItem.current) return;
                dragCategory.current = category.id;
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (editMode && dragCategory.current) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!editMode) return;
                if (dragCategory.current && dragCategory.current !== category.id) {
                  e.preventDefault();
                  reorderCategories(dragCategory.current, category.id);
                }
                dragCategory.current = null;
              }}
            >
              {/* Category title */}
              <div className="text-center mb-8 relative">
                {editMode && (
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 ${cfg.muted} opacity-60 cursor-grab active:cursor-grabbing`}
                    title="Arrastra para reordenar categoría"
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                )}
                <Editable
                  as="h2"
                  value={category.name}
                  editable={editMode}
                  onSave={(v) => saveCategoryName(category.id, v)}
                  className={
                    cfg.categoryTitleClass
                      ? `${cfg.categoryTitleClass} ${cfg.accent}`
                      : `text-[14px] tracking-[0.2em] uppercase font-medium ${cfg.accent}`
                  }
                />
                <div
                  className={`mt-2 h-px w-16 mx-auto ${cfg.border} opacity-40`}
                  style={{ borderTopWidth: 1, borderTopStyle: "solid" }}
                />
              </div>

              {/* Items */}
              {layout === "single" ? (
                <div className="space-y-5">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`group relative ${editMode ? "rounded-[10px] p-2 -m-2 hover:bg-black/[0.03]" : ""}`}
                      draggable={editMode}
                      onDragStart={(e) => {
                        if (!editMode) return;
                        dragItem.current = { categoryId: category.id, itemId: item.id };
                        e.dataTransfer.effectAllowed = "move";
                        e.stopPropagation();
                      }}
                      onDragOver={(e) => {
                        if (
                          editMode &&
                          dragItem.current &&
                          dragItem.current.categoryId === category.id
                        )
                          e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (!editMode) return;
                        const d = dragItem.current;
                        if (d && d.categoryId === category.id && d.itemId !== item.id) {
                          e.preventDefault();
                          e.stopPropagation();
                          reorderItems(category.id, d.itemId, item.id);
                        }
                        dragItem.current = null;
                      }}
                    >
                      {editMode && (
                        <span
                          className={`absolute -left-5 top-4 ${cfg.muted} opacity-60 cursor-grab active:cursor-grabbing`}
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      )}
                      {showImages && item.image_url && (
                        <div className="relative mb-3">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-48 object-cover rounded-[12px]"
                          />
                          {editMode && (
                            <button
                              onClick={() => removeItemImage(item.id)}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                              title="Quitar foto"
                            >
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <Editable
                          as="h3"
                          value={item.name}
                          editable={editMode}
                          onSave={(v) => saveItemField(item.id, "name", v)}
                          className={`text-[15px] font-medium ${cfg.text}`}
                        />
                        <span className={`flex-1 border-b border-dotted ${cfg.border} opacity-30`} />
                        {cfg.priceBadge ? (
                          <span
                            className={`inline-flex items-center justify-center min-w-[56px] h-[56px] rounded-full text-[16px] font-bold whitespace-nowrap px-3 bg-[#1d3a4a] ${cfg.accentText}`}
                          >
                            <Editable
                              as="span"
                              value={formatPrice(item.price)}
                              editable={editMode}
                              onSave={(v) => saveItemField(item.id, "price", v)}
                              className="text-white"
                            />
                          </span>
                        ) : (
                          <span className={`text-[14px] font-medium whitespace-nowrap ${cfg.accentText}`}>
                            $
                            <Editable
                              as="span"
                              value={formatPrice(item.price)}
                              editable={editMode}
                              onSave={(v) => saveItemField(item.id, "price", v)}
                            />
                          </span>
                        )}
                      </div>
                      {(item.description || editMode) && (
                        <Editable
                          as="p"
                          value={item.description ?? ""}
                          editable={editMode}
                          multiline
                          placeholder={editMode ? "Añadir descripción…" : ""}
                          onSave={(v) => saveItemField(item.id, "description", v)}
                          className={`mt-1 text-[13px] max-w-lg ${cfg.muted}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={gridClass}>
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-[12px] overflow-hidden border ${cfg.border} opacity-90 hover:opacity-100 transition-opacity ${cfg.cardBg} relative`}
                      draggable={editMode}
                      onDragStart={(e) => {
                        if (!editMode) return;
                        dragItem.current = { categoryId: category.id, itemId: item.id };
                        e.dataTransfer.effectAllowed = "move";
                        e.stopPropagation();
                      }}
                      onDragOver={(e) => {
                        if (
                          editMode &&
                          dragItem.current &&
                          dragItem.current.categoryId === category.id
                        )
                          e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (!editMode) return;
                        const d = dragItem.current;
                        if (d && d.categoryId === category.id && d.itemId !== item.id) {
                          e.preventDefault();
                          e.stopPropagation();
                          reorderItems(category.id, d.itemId, item.id);
                        }
                        dragItem.current = null;
                      }}
                    >
                      {editMode && (
                        <span
                          className={`absolute top-1.5 left-1.5 z-10 ${cfg.muted} bg-white/80 backdrop-blur rounded-full p-1 opacity-80 cursor-grab active:cursor-grabbing`}
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {showImages && item.image_url && (
                        <div className="relative">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className={`w-full object-cover ${layout === "three-col" ? "h-32" : "h-40"}`}
                          />
                          {editMode && (
                            <button
                              onClick={() => removeItemImage(item.id)}
                              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                              title="Quitar foto"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          )}
                          {cfg.priceBadge && (
                            <span
                              className={`absolute bottom-2 right-2 inline-flex items-center justify-center min-w-[50px] h-[50px] rounded-full text-[14px] font-bold px-2 bg-[#1d3a4a] text-white shadow-md`}
                            >
                              <Editable
                                as="span"
                                value={formatPrice(item.price)}
                                editable={editMode}
                                onSave={(v) => saveItemField(item.id, "price", v)}
                                className="text-white"
                              />
                            </span>
                          )}
                        </div>
                      )}
                      <div className="p-4">
                        <Editable
                          as="h3"
                          value={item.name}
                          editable={editMode}
                          onSave={(v) => saveItemField(item.id, "name", v)}
                          className={`text-[14px] font-medium ${cfg.text}`}
                        />
                        {(item.description || editMode) && (
                          <Editable
                            as="p"
                            value={item.description ?? ""}
                            editable={editMode}
                            multiline
                            placeholder={editMode ? "Añadir descripción…" : ""}
                            onSave={(v) => saveItemField(item.id, "description", v)}
                            className={`mt-1 text-[12px] ${editMode ? "" : "line-clamp-2"} ${cfg.muted}`}
                          />
                        )}
                        {!cfg.priceBadge && (
                          <p className={`mt-2 text-[15px] font-semibold ${cfg.accentText}`}>
                            $
                            <Editable
                              as="span"
                              value={formatPrice(item.price)}
                              editable={editMode}
                              onSave={(v) => saveItemField(item.id, "price", v)}
                            />
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Footer */}
          <footer className="mt-16 pt-8 text-center print:mt-8">
            <p className={`text-[11px] tracking-[0.15em] uppercase ${cfg.muted} opacity-60`}>
              Precios en pesos colombianos · IVA incluido
            </p>
            {restaurant?.phone && (
              <p className={`mt-2 text-[12px] ${cfg.muted} opacity-50`}>
                Reservas: {restaurant.phone}
              </p>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}
