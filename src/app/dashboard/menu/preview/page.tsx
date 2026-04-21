"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from "react";
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
  Upload,
  Minus,
  Plus,
  AlignJustify,
  Palette,
  Move,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import { StyleLayout, type LayoutStyle } from "@/components/menu-preview/style-layouts";

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
  font_scale: number;
  layout_x: number | null;
  layout_y: number | null;
  layout_w: number | null;
  items: MenuItem[];
}

type TextBlockType = "heading" | "paragraph" | "footer";

interface TextBlock {
  id: string;
  content: string;
  block_type: TextBlockType;
  sort_order: number;
  layout_x: number | null;
  layout_y: number | null;
  layout_w: number | null;
}

type MenuSection =
  | { kind: "category"; data: Category; sort_order: number }
  | { kind: "block"; data: TextBlock; sort_order: number };

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
type LayoutMode = "single" | "two-col" | "three-col" | "lista";

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
  paperTexture?: boolean;
  categoryBoxed?: boolean;
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
    bg: "bg-[#ece0c2]",
    text: "text-[#163b9a]",
    accent: "text-[#163b9a]",
    accentText: "text-[#163b9a]",
    muted: "text-[#2a4a8a]",
    border: "border-[#163b9a]/30",
    specialBg: "bg-[#e0d3b0]",
    specialBorder: "border-[#163b9a]/30",
    cardBg: "bg-[#e4d8b8]",
    font: "'Impact', 'Arial Narrow', 'Arial Black', sans-serif",
    headerDecoration: "swirl",
    titleClass:
      "text-[96px] font-black tracking-[-0.02em] leading-[0.9] uppercase",
    categoryTitleClass: "text-[34px] font-black tracking-tight",
  },
  rustico: {
    label: "Rústico",
    emoji: "🏡",
    bg: "bg-[#efe2c0]",
    text: "text-[#3a2818]",
    accent: "text-[#1d3a4a]",
    accentText: "text-white",
    muted: "text-[#705a40]",
    border: "border-[#8b6a40]/40",
    specialBg: "bg-[#e6d7ae]",
    specialBorder: "border-[#1d3a4a]/30",
    cardBg: "bg-[#ebdcb6]",
    font: "'Georgia', 'Times New Roman', serif",
    headerDecoration: "house",
    priceBadge: true,
    paperTexture: true,
    titleClass: "text-[36px] font-bold tracking-[0.2em] uppercase",
    categoryTitleClass: "text-[14px] font-bold tracking-[0.3em] uppercase",
  },
  bistro: {
    label: "Bistró",
    emoji: "🍽️",
    bg: "bg-[#f5efdf]",
    text: "text-[#0f1d33]",
    accent: "text-[#0f1d33]",
    accentText: "text-[#0f1d33]",
    muted: "text-[#4a5468]",
    border: "border-[#0f1d33]/30",
    specialBg: "bg-[#0f1d33]",
    specialBorder: "border-[#0f1d33]",
    cardBg: "bg-[#ece5d0]",
    font: "'Georgia', serif",
    headerDecoration: "double-line",
    categoryBoxed: true,
    titleClass: "text-[52px] font-bold tracking-[0.1em] uppercase",
    categoryTitleClass:
      "inline-block px-6 py-2 bg-[#0f1d33] text-[#f5efdf] text-[14px] font-bold tracking-[0.3em] uppercase",
  },
};

function brandVars(primary: string, secondary: string): Record<string, string> {
  return {
    "--brand-primary": primary,
    "--brand-secondary": secondary,
  };
}

function withBrandColors<T extends { accent: string; accentText: string; border: string; specialBg: string; specialBorder: string; categoryTitleClass?: string; categoryBoxed?: boolean }>(cfg: T): T {
  return {
    ...cfg,
    accent: "text-[color:var(--brand-primary)]",
    accentText: "text-[color:var(--brand-primary)]",
    border: "border-[color:var(--brand-primary)]",
    specialBg: "bg-[color:var(--brand-secondary)]",
    specialBorder: "border-[color:var(--brand-primary)]",
    categoryTitleClass: cfg.categoryBoxed
      ? "inline-block px-6 py-2 bg-[color:var(--brand-primary)] text-white text-[14px] font-bold tracking-[0.3em] uppercase"
      : cfg.categoryTitleClass,
  };
}

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

function getFoodEmoji(itemName: string, categoryName: string): string {
  const text = `${itemName} ${categoryName}`.toLowerCase();
  if (/cafe|café|capuc|expres|americano|latte|moka/.test(text)) return "☕";
  if (/té|te |manzanilla|verde|jengibre/.test(text)) return "🍵";
  if (/frapp|smoothie|tizana|soda|jugo|fresa|mora|mango|piña/.test(text)) return "🥤";
  if (/pizza/.test(text)) return "🍕";
  if (/burger|hamburg/.test(text)) return "🍔";
  if (/ensalada|salad/.test(text)) return "🥗";
  if (/pasta|spaghet|fettuc|ravio|lasa/.test(text)) return "🍝";
  if (/dona|donut/.test(text)) return "🍩";
  if (/galleta|cookie/.test(text)) return "🍪";
  if (/pastel|torta|cake|rebanada/.test(text)) return "🍰";
  if (/waffle|hotcake|panqueque/.test(text)) return "🧇";
  if (/helado|nieve/.test(text)) return "🍨";
  if (/sopa|crema|caldo|broth/.test(text)) return "🍲";
  if (/pollo|chicken|pechuga/.test(text)) return "🍗";
  if (/pescado|fish|salmon|atún|atun/.test(text)) return "🐟";
  if (/camarón|camaron|shrimp|mariscos/.test(text)) return "🦐";
  if (/carne|steak|asado|ribeye|res/.test(text)) return "🥩";
  if (/panini|sandwich|sándwich|bagel|club/.test(text)) return "🥪";
  if (/taco|burrito|quesadilla/.test(text)) return "🌮";
  if (/papa|fries|frita/.test(text)) return "🍟";
  if (/arroz|rice/.test(text)) return "🍚";
  if (/huevo|egg|omelet/.test(text)) return "🍳";
  if (/queso|cheese/.test(text)) return "🧀";
  if (/aguacate|avocado/.test(text)) return "🥑";
  if (/vino|wine|copa/.test(text)) return "🍷";
  if (/cerveza|beer/.test(text)) return "🍺";
  if (/cocktail|cóctel|coctel|margarita|mojito/.test(text)) return "🍹";
  if (/postre|dessert/.test(text)) return "🍰";
  if (/bebida/.test(text)) return "🥤";
  return "🍽️";
}

function ItemImage({
  item,
  categoryName,
  className,
  emojiSize = "text-[64px]",
}: {
  item: { image_url: string | null; name: string };
  categoryName: string;
  className?: string;
  emojiSize?: string;
}) {
  if (item.image_url) {
    return <img src={item.image_url} alt={item.name} className={`${className ?? ""} object-cover`} />;
  }
  const emoji = getFoodEmoji(item.name, categoryName);
  return (
    <div
      className={`${className ?? ""} flex items-center justify-center bg-gradient-to-br from-black/[0.04] to-black/[0.08]`}
    >
      <span className={`${emojiSize} opacity-60`} aria-hidden>
        {emoji}
      </span>
    </div>
  );
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

type StyleCfg = (typeof STYLE_CONFIG)[keyof typeof STYLE_CONFIG];

function TextBlockView({
  block,
  cfg,
  editMode,
  onDragStart,
  onContent,
  onType,
  onDelete,
}: {
  block: TextBlock;
  cfg: StyleCfg;
  editMode: boolean;
  onDragStart?: () => void;
  onContent: (v: string) => void;
  onType: (t: TextBlockType) => void;
  onDelete: () => void;
}) {
  const baseClass =
    block.block_type === "heading"
      ? `text-center mb-10 print:mb-6 text-[26px] font-semibold tracking-[0.08em] uppercase ${cfg.accent}`
      : block.block_type === "footer"
      ? `text-center mb-10 print:mb-6 text-[11px] tracking-[0.2em] uppercase ${cfg.muted} opacity-70`
      : `mb-10 print:mb-6 text-[14px] leading-relaxed text-center max-w-2xl mx-auto ${cfg.muted}`;
  return (
    <div className={`relative group ${editMode ? "rounded-[10px] p-2 hover:bg-black/[0.03]" : ""}`}>
      {editMode && (
        <span
          draggable
          onDragStart={(e) => {
            onDragStart?.();
            e.dataTransfer.effectAllowed = "move";
          }}
          className={`absolute left-1 top-1/2 -translate-y-1/2 ${cfg.muted} bg-white/90 rounded-md p-1 shadow-sm cursor-grab active:cursor-grabbing print:hidden opacity-0 group-hover:opacity-100 transition-opacity`}
          title="Arrastra para reordenar"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
      )}
      <Editable
        as="p"
        value={block.content}
        editable={editMode}
        multiline={block.block_type !== "heading"}
        placeholder={editMode ? "Escribe el texto…" : ""}
        onSave={onContent}
        className={baseClass}
      />
      {editMode && (
        <div className="absolute top-1 right-1 flex gap-1 bg-white/90 rounded-md p-0.5 shadow-sm print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={block.block_type}
            onChange={(e) => onType(e.target.value as TextBlockType)}
            className="text-[10px] bg-transparent text-text-secondary rounded px-1 py-0.5 focus:outline-none"
            title="Tipo de bloque"
          >
            <option value="heading">Título</option>
            <option value="paragraph">Párrafo</option>
            <option value="footer">Pie</option>
          </select>
          <button
            onClick={onDelete}
            className="p-1 rounded text-error hover:bg-error/10"
            title="Eliminar bloque"
          >
            <XIcon className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function AddBlockSlot({ onAdd }: { onAdd: (type: TextBlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-center py-1 print:hidden">
      {open ? (
        <div className="flex gap-1 bg-white shadow-md rounded-full border border-border-light p-1 z-10">
          <button
            onClick={() => {
              onAdd("heading");
              setOpen(false);
            }}
            className="text-[11px] px-3 py-1 rounded-full hover:bg-bg-warm"
          >
            + Título
          </button>
          <button
            onClick={() => {
              onAdd("paragraph");
              setOpen(false);
            }}
            className="text-[11px] px-3 py-1 rounded-full hover:bg-bg-warm"
          >
            + Párrafo
          </button>
          <button
            onClick={() => {
              onAdd("footer");
              setOpen(false);
            }}
            className="text-[11px] px-3 py-1 rounded-full hover:bg-bg-warm"
          >
            + Pie
          </button>
          <button
            onClick={() => setOpen(false)}
            className="text-[11px] px-2 py-1 rounded-full hover:bg-bg-warm text-text-muted"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-[11px] text-text-muted hover:text-primary px-3 py-1 rounded-full border border-dashed border-border-light hover:border-primary/40 bg-white/60 transition-colors"
        >
          + Añadir texto
        </button>
      )}
    </div>
  );
}

export default function MenuPreviewPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
  const [style, setStyle] = useState<MenuStyle>("elegant");
  const [layout, setLayout] = useState<LayoutMode>("single");
  const [showImages, setShowImages] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [useBrandColors, setUseBrandColors] = useState(false);
  const [freeMode, setFreeMode] = useState(false);
  const freeDragRef = useRef<
    | {
        kind: "category" | "block";
        id: string;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
      }
    | null
  >(null);
  const [fontScale, setFontScale] = useState(1);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragItem = useRef<{ categoryId: string; itemId: string } | null>(null);
  const dragSection = useRef<{ kind: "category" | "block"; id: string } | null>(null);

  const loadMenu = useCallback(async () => {
    if (!restaurant) return;
    setLoadError(null);
    const [catsRes, blocksRes] = await Promise.all([
      supabase
        .from("menu_categories")
        .select(
          "id, name, sort_order, font_scale, layout_x, layout_y, layout_w, menu_items(id, name, description, price, image_url, is_available, is_daily_special, sort_order)"
        )
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("menu_text_blocks")
        .select("id, content, block_type, sort_order, layout_x, layout_y, layout_w")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order"),
    ]);

    const firstError = catsRes.error ?? blocksRes.error;
    if (firstError) {
      console.error("[menu preview] load error:", firstError);
      setLoadError(firstError.message);
      setCategories([]);
      setTextBlocks([]);
      return;
    }
    const data = catsRes.data;
    const blocksData = blocksRes.data;

    type RawBlock = {
      id: string;
      content: string | null;
      block_type: TextBlockType | null;
      sort_order: number | null;
      layout_x: number | string | null;
      layout_y: number | string | null;
      layout_w: number | string | null;
    };
    const toNum = (v: number | string | null | undefined) =>
      v == null ? null : typeof v === "number" ? v : Number.isFinite(Number(v)) ? Number(v) : null;
    setTextBlocks(
      ((blocksData ?? []) as unknown as RawBlock[]).map<TextBlock>((b) => ({
        id: b.id,
        content: b.content ?? "",
        block_type: (b.block_type ?? "paragraph") as TextBlockType,
        sort_order: b.sort_order ?? 0,
        layout_x: toNum(b.layout_x),
        layout_y: toNum(b.layout_y),
        layout_w: toNum(b.layout_w),
      }))
    );

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
      font_scale: number | string | null;
      layout_x: number | string | null;
      layout_y: number | string | null;
      layout_w: number | string | null;
      menu_items: RawItem[] | null;
    };
    setCategories(
      ((data ?? []) as unknown as RawCategory[])
        .map<Category>((c) => ({
          id: c.id,
          name: c.name,
          sort_order: c.sort_order ?? 0,
          font_scale:
            c.font_scale == null ? 1 : Number(c.font_scale) || 1,
          layout_x: toNum(c.layout_x),
          layout_y: toNum(c.layout_y),
          layout_w: toNum(c.layout_w),
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

  async function saveCategoryFontScale(categoryId: string, scale: number) {
    const next = Math.max(0.6, Math.min(2, +scale.toFixed(2)));
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, font_scale: next } : c))
    );
    await supabase.from("menu_categories").update({ font_scale: next }).eq("id", categoryId);
  }

  function triggerImageUpload(itemId: string) {
    setUploadTarget(itemId);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(file: File) {
    if (!restaurant || !uploadTarget) return;
    const itemId = uploadTarget;
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${restaurant.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("menu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      console.error("Upload error:", error);
      setUploadTarget(null);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("menu-images").getPublicUrl(path);
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, image_url: publicUrl } : i)),
      }))
    );
    await supabase.from("menu_items").update({ image_url: publicUrl }).eq("id", itemId);
    setUploadTarget(null);
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

  async function saveSectionLayout(
    kind: "category" | "block",
    id: string,
    x: number,
    y: number
  ) {
    const table = kind === "category" ? "menu_categories" : "menu_text_blocks";
    await supabase.from(table).update({ layout_x: x, layout_y: y }).eq("id", id);
  }

  function startFreeDrag(
    e: React.MouseEvent,
    kind: "category" | "block",
    id: string,
    origX: number,
    origY: number
  ) {
    e.preventDefault();
    e.stopPropagation();
    freeDragRef.current = {
      kind,
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
    };
    const handleMove = (ev: MouseEvent) => {
      const d = freeDragRef.current;
      if (!d) return;
      const nextX = Math.max(0, d.origX + ev.clientX - d.startX);
      const nextY = Math.max(0, d.origY + ev.clientY - d.startY);
      if (d.kind === "category") {
        setCategories((prev) =>
          prev.map((c) => (c.id === d.id ? { ...c, layout_x: nextX, layout_y: nextY } : c))
        );
      } else {
        setTextBlocks((prev) =>
          prev.map((b) => (b.id === d.id ? { ...b, layout_x: nextX, layout_y: nextY } : b))
        );
      }
    };
    const handleUp = (ev: MouseEvent) => {
      const d = freeDragRef.current;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      if (!d) return;
      const finalX = Math.max(0, d.origX + ev.clientX - d.startX);
      const finalY = Math.max(0, d.origY + ev.clientY - d.startY);
      freeDragRef.current = null;
      saveSectionLayout(d.kind, d.id, finalX, finalY);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  async function reorderSections(
    from: { kind: "category" | "block"; id: string },
    to: { kind: "category" | "block"; id: string }
  ) {
    if (from.kind === to.kind && from.id === to.id) return;
    const merged = [
      ...categories.map((c) => ({ kind: "category" as const, id: c.id, sort_order: c.sort_order })),
      ...textBlocks.map((b) => ({ kind: "block" as const, id: b.id, sort_order: b.sort_order })),
    ].sort((a, b) => a.sort_order - b.sort_order);
    const fromIdx = merged.findIndex((s) => s.kind === from.kind && s.id === from.id);
    const toIdx = merged.findIndex((s) => s.kind === to.kind && s.id === to.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...merged];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const orderMap = new Map<string, number>();
    reordered.forEach((s, idx) => orderMap.set(`${s.kind}:${s.id}`, idx));

    setCategories((prev) =>
      prev.map((c) => ({ ...c, sort_order: orderMap.get(`category:${c.id}`) ?? c.sort_order }))
    );
    setTextBlocks((prev) =>
      prev.map((b) => ({ ...b, sort_order: orderMap.get(`block:${b.id}`) ?? b.sort_order }))
    );

    await Promise.all(
      reordered.map((s) => {
        const next = orderMap.get(`${s.kind}:${s.id}`) ?? 0;
        return s.kind === "category"
          ? supabase.from("menu_categories").update({ sort_order: next }).eq("id", s.id)
          : supabase.from("menu_text_blocks").update({ sort_order: next }).eq("id", s.id);
      })
    );
  }

  async function createTextBlockAt(afterIndex: number, type: TextBlockType) {
    if (!restaurant) return;
    const allSorted = [
      ...categories.map((c) => ({ kind: "category" as const, id: c.id, sort_order: c.sort_order })),
      ...textBlocks.map((b) => ({ kind: "block" as const, id: b.id, sort_order: b.sort_order })),
    ].sort((a, b) => a.sort_order - b.sort_order);
    const before = allSorted[afterIndex];
    const beforeOrder = before ? before.sort_order : -1;
    const afterOrder = allSorted[afterIndex + 1]?.sort_order ?? beforeOrder + 2;
    const gap = afterOrder - beforeOrder;
    const newOrder = gap > 1 ? beforeOrder + Math.floor(gap / 2) : beforeOrder + 1;
    const needsResequence = gap <= 1;

    const defaultContent =
      type === "heading"
        ? "Nueva sección"
        : type === "footer"
        ? "Notas finales"
        : "Escribe un párrafo…";
    const { data: inserted } = await supabase
      .from("menu_text_blocks")
      .insert({
        restaurant_id: restaurant.id,
        content: defaultContent,
        block_type: type,
        sort_order: newOrder,
      })
      .select("id, content, block_type, sort_order")
      .single();
    if (!inserted) return;
    const newBlock: TextBlock = {
      id: inserted.id,
      content: inserted.content ?? defaultContent,
      block_type: (inserted.block_type ?? type) as TextBlockType,
      sort_order: inserted.sort_order ?? newOrder,
      layout_x: null,
      layout_y: null,
      layout_w: null,
    };
    if (!needsResequence) {
      setTextBlocks((prev) => [...prev, newBlock]);
      return;
    }

    // Resequence everything: build unified order with the new block at
    // insertionIndex, then flush to state + DB in one pass.
    const working = [
      ...categories.map((c) => ({ kind: "category" as const, id: c.id, sort_order: c.sort_order })),
      ...textBlocks.map((b) => ({ kind: "block" as const, id: b.id, sort_order: b.sort_order })),
    ].sort((a, b) => a.sort_order - b.sort_order);
    const insertionIndex = afterIndex + 1;
    const rebuilt = [
      ...working.slice(0, insertionIndex),
      { kind: "block" as const, id: newBlock.id, sort_order: 0 },
      ...working.slice(insertionIndex),
    ];
    const orderMap = new Map<string, number>();
    rebuilt.forEach((s, idx) => orderMap.set(`${s.kind}:${s.id}`, idx));

    setCategories((prev) =>
      prev.map((c) => ({ ...c, sort_order: orderMap.get(`category:${c.id}`) ?? c.sort_order }))
    );
    setTextBlocks((prev) => [
      ...prev.map((b) => ({ ...b, sort_order: orderMap.get(`block:${b.id}`) ?? b.sort_order })),
      { ...newBlock, sort_order: orderMap.get(`block:${newBlock.id}`) ?? newBlock.sort_order },
    ]);

    await Promise.all(
      rebuilt.map((s) => {
        const next = orderMap.get(`${s.kind}:${s.id}`) ?? 0;
        return s.kind === "category"
          ? supabase.from("menu_categories").update({ sort_order: next }).eq("id", s.id)
          : supabase.from("menu_text_blocks").update({ sort_order: next }).eq("id", s.id);
      })
    );
  }

  async function saveTextBlockContent(blockId: string, content: string) {
    const next = content.trim();
    setTextBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, content: next } : b)));
    await supabase.from("menu_text_blocks").update({ content: next }).eq("id", blockId);
  }

  async function saveTextBlockType(blockId: string, type: TextBlockType) {
    setTextBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, block_type: type } : b))
    );
    await supabase.from("menu_text_blocks").update({ block_type: type }).eq("id", blockId);
  }

  async function deleteTextBlock(blockId: string) {
    setTextBlocks((prev) => prev.filter((b) => b.id !== blockId));
    await supabase.from("menu_text_blocks").update({ is_active: false }).eq("id", blockId);
  }

  const baseCfg = STYLE_CONFIG[style];
  const cfg = useBrandColors ? withBrandColors(baseCfg) : baseCfg;
  const cssVars = useBrandColors
    ? brandVars(
        restaurant?.primary_color ?? "#a855f7",
        restaurant?.secondary_color ?? "#f472b6"
      )
    : null;
  const specials = categories.flatMap((c) => c.items.filter((i) => i.is_daily_special));

  const sections = useMemo<MenuSection[]>(
    () =>
      [
        ...categories.map<MenuSection>((c) => ({
          kind: "category",
          data: c,
          sort_order: c.sort_order,
        })),
        ...textBlocks.map<MenuSection>((b) => ({
          kind: "block",
          data: b,
          sort_order: b.sort_order,
        })),
      ].sort((a, b) => a.sort_order - b.sort_order),
    [categories, textBlocks]
  );

  // In free mode, fall back to auto-computed coords when layout_x/y are null.
  // Default layout: single column of 550px-wide cards stacked with 420px vertical spacing,
  // ordered by sort_order.
  const FREE_DEFAULT_W = 550;
  const FREE_DEFAULT_STRIDE = 420;
  const freeCoords = useMemo(() => {
    const map = new Map<string, { x: number; y: number; w: number }>();
    sections.forEach((s, idx) => {
      const x = s.data.layout_x ?? 40;
      const y = s.data.layout_y ?? idx * FREE_DEFAULT_STRIDE;
      const w = s.data.layout_w ?? FREE_DEFAULT_W;
      map.set(`${s.kind}:${s.data.id}`, { x, y, w });
    });
    return map;
  }, [sections]);

  const canvasHeight = useMemo(() => {
    let max = 600;
    freeCoords.forEach(({ y }) => {
      if (y + FREE_DEFAULT_STRIDE > max) max = y + FREE_DEFAULT_STRIDE;
    });
    return max;
  }, [freeCoords]);

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
              <button
                onClick={() => setLayout("lista")}
                className={`p-1.5 rounded-[8px] transition-all ${layout === "lista" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
                title="Lista (sin imágenes)"
              >
                <AlignJustify className="w-4 h-4" />
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
            {/* Free layout toggle */}
            <button
              onClick={() => setFreeMode((v) => !v)}
              className={`p-1.5 rounded-[8px] transition-all ${freeMode ? "bg-primary/10 text-primary" : "bg-bg-warm text-text-muted"}`}
              title={freeMode ? "Salir del modo libre" : "Posicionamiento libre (canvas)"}
            >
              <Move className="w-4 h-4" />
            </button>
            {/* Brand colors toggle */}
            <button
              onClick={() => setUseBrandColors((v) => !v)}
              className={`p-1.5 rounded-[8px] transition-all ${useBrandColors ? "bg-primary/10 text-primary" : "bg-bg-warm text-text-muted"}`}
              title={useBrandColors ? "Usando colores de marca" : "Aplicar colores de marca (settings)"}
            >
              <Palette className="w-4 h-4" />
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
            {/* Font size controls (edit mode only) */}
            {editMode && (
              <div className="flex items-center gap-0.5 bg-bg-warm rounded-[10px] p-1">
                <button
                  onClick={() => setFontScale((s) => Math.max(0.75, +(s - 0.1).toFixed(2)))}
                  className="p-1.5 rounded-[8px] text-text-secondary hover:bg-white"
                  title="Reducir tamaño"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-text-muted w-10 text-center tabular-nums">
                  {Math.round(fontScale * 100)}%
                </span>
                <button
                  onClick={() => setFontScale((s) => Math.min(1.5, +(s + 0.1).toFixed(2)))}
                  className="p-1.5 rounded-[8px] text-text-secondary hover:bg-white"
                  title="Aumentar tamaño"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
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

      {/* Hidden file input for image replace */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelected(file);
          e.target.value = "";
        }}
      />

      {loadError && (
        <div className="print:hidden bg-error/10 border-b border-error/30 px-6 py-3 text-[13px] text-error">
          <strong>No se pudo cargar el menú:</strong> {loadError}
        </div>
      )}

      {/* Menu preview */}
      <div
        className={`min-h-screen ${cfg.bg} ${cfg.text}`}
        style={{
          ...(cfg.font ? { fontFamily: cfg.font } : {}),
          ...(fontScale !== 1 ? { zoom: fontScale } : {}),
          ...(cfg.paperTexture
            ? {
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(139,106,64,0.06) 0px, transparent 40%), radial-gradient(circle at 80% 70%, rgba(139,106,64,0.05) 0px, transparent 45%), radial-gradient(circle at 50% 90%, rgba(29,58,74,0.04) 0px, transparent 35%)",
              }
            : {}),
          ...(cssVars ?? {}),
        } as CSSProperties}
      >
        <div className={`mx-auto px-8 py-16 print:py-8 ${layout === "three-col" ? "max-w-5xl" : layout === "two-col" || layout === "lista" ? "max-w-4xl" : "max-w-3xl"}`}>
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
                {layout === "single" || layout === "lista" ? (
                  specials.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-3">
                      {showImages && layout !== "lista" && (
                        <ItemImage
                          item={item}
                          categoryName=""
                          className="w-14 h-14 rounded-[10px] shrink-0"
                          emojiSize="text-[28px]"
                        />
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
                        {showImages && (
                          <ItemImage
                            item={item}
                            categoryName=""
                            className="w-full h-32 rounded-[8px] mb-2"
                            emojiSize="text-[48px]"
                          />
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

          {/* Sections (categories + text blocks) */}
          <div
            className={freeMode ? "relative mx-auto" : ""}
            style={
              freeMode
                ? {
                    minHeight: `${canvasHeight}px`,
                    width: `${Math.max(
                      FREE_DEFAULT_W + 80,
                      ...Array.from(freeCoords.values()).map((c) => c.x + c.w + 40)
                    )}px`,
                    maxWidth: "100%",
                    backgroundImage: editMode
                      ? "linear-gradient(0deg, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)"
                      : undefined,
                    backgroundSize: editMode ? "40px 40px" : undefined,
                  }
                : undefined
            }
          >
          {sections.map((section, sectionIndex) => {
            const sectionKey = `${section.kind}:${section.data.id}`;
            const addSlot =
              editMode && !freeMode ? (
                <AddBlockSlot
                  key={`add-${sectionKey}`}
                  onAdd={(t) => createTextBlockAt(sectionIndex - 1, t)}
                />
              ) : null;
            const freePos = freeCoords.get(sectionKey);
            const freeWrapStyle: CSSProperties | undefined = freeMode
              ? {
                  position: "absolute",
                  left: `${freePos?.x ?? 40}px`,
                  top: `${freePos?.y ?? 0}px`,
                  width: `${freePos?.w ?? FREE_DEFAULT_W}px`,
                }
              : undefined;
            if (section.kind === "block") {
              const block = section.data;
              return (
                <div key={sectionKey} style={freeWrapStyle}>
                  {addSlot}
                  {freeMode && editMode && (
                    <button
                      onMouseDown={(e) =>
                        startFreeDrag(e, "block", block.id, freePos?.x ?? 40, freePos?.y ?? 0)
                      }
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 ${cfg.muted} bg-white rounded-full px-2 py-1 shadow-sm border border-border-light cursor-grab active:cursor-grabbing print:hidden z-10 text-[10px] flex items-center gap-1`}
                      title="Mover (arrastrar)"
                    >
                      <Move className="w-3 h-3" /> Mover
                    </button>
                  )}
                  <div
                    onDragOver={(e) => {
                      if (editMode && !freeMode && dragSection.current) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      if (!editMode || freeMode) return;
                      const d = dragSection.current;
                      if (d && !(d.kind === "block" && d.id === block.id)) {
                        e.preventDefault();
                        reorderSections(d, { kind: "block", id: block.id });
                      }
                      dragSection.current = null;
                    }}
                  >
                    <TextBlockView
                      block={block}
                      cfg={cfg}
                      editMode={editMode && !freeMode}
                      onDragStart={() => {
                        dragSection.current = { kind: "block", id: block.id };
                      }}
                      onContent={(v) => saveTextBlockContent(block.id, v)}
                      onType={(t) => saveTextBlockType(block.id, t)}
                      onDelete={() => deleteTextBlock(block.id)}
                    />
                  </div>
                </div>
              );
            }
            const category = section.data;
            return (
              <div key={sectionKey} style={freeWrapStyle}>
                {addSlot}
                {freeMode && editMode && (
                  <button
                    onMouseDown={(e) =>
                      startFreeDrag(e, "category", category.id, freePos?.x ?? 40, freePos?.y ?? 0)
                    }
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 ${cfg.muted} bg-white rounded-full px-2 py-1 shadow-sm border border-border-light cursor-grab active:cursor-grabbing print:hidden z-10 text-[10px] flex items-center gap-1`}
                    title="Mover (arrastrar)"
                  >
                    <Move className="w-3 h-3" /> Mover
                  </button>
                )}
            <section
              className={`mb-14 print:mb-8 ${editMode ? "relative rounded-[12px]" : ""}`}
              onDragOver={(e) => {
                if (editMode && !freeMode && dragSection.current) e.preventDefault();
              }}
              onDrop={(e) => {
                if (!editMode || freeMode) return;
                const d = dragSection.current;
                if (d && !(d.kind === "category" && d.id === category.id)) {
                  e.preventDefault();
                  reorderSections(d, { kind: "category", id: category.id });
                }
                dragSection.current = null;
              }}
            >
              {/* Category title */}
              <div className="text-center mb-8 relative">
                {editMode && (
                  <>
                    <span
                      draggable
                      onDragStart={(e) => {
                        dragSection.current = { kind: "category", id: category.id };
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className={`absolute left-0 top-1/2 -translate-y-1/2 ${cfg.muted} bg-white/90 rounded-md p-1 shadow-sm opacity-90 cursor-grab active:cursor-grabbing print:hidden`}
                      title="Arrastra para reordenar categoría"
                    >
                      <GripVertical className="w-4 h-4" />
                    </span>
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white/90 rounded-md p-0.5 shadow-sm print:hidden"
                      title="Tamaño de letra de la sección"
                    >
                      <button
                        onClick={() =>
                          saveCategoryFontScale(category.id, category.font_scale - 0.1)
                        }
                        className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-text-secondary hover:bg-bg-warm"
                      >
                        A−
                      </button>
                      <span className="text-[10px] text-text-muted w-8 text-center tabular-nums">
                        {Math.round(category.font_scale * 100)}%
                      </span>
                      <button
                        onClick={() =>
                          saveCategoryFontScale(category.id, category.font_scale + 0.1)
                        }
                        className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-text-secondary hover:bg-bg-warm"
                      >
                        A+
                      </button>
                    </div>
                  </>
                )}
                <Editable
                  as="h2"
                  value={category.name}
                  editable={editMode}
                  onSave={(v) => saveCategoryName(category.id, v)}
                  className={
                    cfg.categoryTitleClass
                      ? cfg.categoryBoxed
                        ? cfg.categoryTitleClass
                        : `${cfg.categoryTitleClass} ${cfg.accent}`
                      : `text-[14px] tracking-[0.2em] uppercase font-medium ${cfg.accent}`
                  }
                />
                {!cfg.categoryBoxed && (
                  <div
                    className={`mt-2 h-px w-16 mx-auto ${cfg.border} opacity-40`}
                    style={{ borderTopWidth: 1, borderTopStyle: "solid" }}
                  />
                )}
              </div>

              {/* Items wrapper with per-category scale */}
              <div style={category.font_scale !== 1 ? { zoom: category.font_scale } : undefined}>

              {/* Items */}
              {!editMode ? (
                <StyleLayout
                  style={style as LayoutStyle}
                  items={category.items}
                  ctx={{ showImages, categoryName: category.name }}
                />
              ) : layout === "lista" ? (
                <div className="columns-2 gap-10 [column-rule:1px_solid] [column-rule-color:currentColor]/10">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`break-inside-avoid mb-3 relative ${editMode ? "rounded-[8px] p-1.5 -m-1.5 hover:bg-black/[0.03]" : ""}`}
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
                          draggable
                          onDragStart={(e) => {
                            dragItem.current = { categoryId: category.id, itemId: item.id };
                            e.dataTransfer.effectAllowed = "move";
                            e.stopPropagation();
                          }}
                          className={`absolute -left-5 top-1 ${cfg.muted} bg-white/90 rounded p-0.5 shadow-sm cursor-grab active:cursor-grabbing print:hidden`}
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-3 h-3" />
                        </span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <Editable
                          as="span"
                          value={item.name}
                          editable={editMode}
                          onSave={(v) => saveItemField(item.id, "name", v)}
                          className={`text-[14px] font-medium ${cfg.text}`}
                        />
                        <span className={`flex-1 border-b border-dotted ${cfg.border} opacity-40`} />
                        <span className={`text-[13px] font-medium whitespace-nowrap ${cfg.accentText}`}>
                          $
                          <Editable
                            as="span"
                            value={formatPrice(item.price)}
                            editable={editMode}
                            onSave={(v) => saveItemField(item.id, "price", v)}
                          />
                        </span>
                      </div>
                      {(item.description || editMode) && (
                        <Editable
                          as="p"
                          value={item.description ?? ""}
                          editable={editMode}
                          multiline
                          placeholder={editMode ? "Añadir descripción…" : ""}
                          onSave={(v) => saveItemField(item.id, "description", v)}
                          className={`mt-0.5 text-[11px] leading-snug ${cfg.muted}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : layout === "single" ? (
                <div className="space-y-5">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`group relative ${editMode ? "rounded-[10px] p-2 -m-2 hover:bg-black/[0.03]" : ""}`}
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
                          draggable
                          onDragStart={(e) => {
                            dragItem.current = { categoryId: category.id, itemId: item.id };
                            e.dataTransfer.effectAllowed = "move";
                            e.stopPropagation();
                          }}
                          className={`absolute -left-6 top-4 ${cfg.muted} bg-white/90 rounded-md p-1 shadow-sm cursor-grab active:cursor-grabbing`}
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>
                      )}
                      {showImages && (
                        <div className="relative mb-3">
                          <ItemImage
                            item={item}
                            categoryName={category.name}
                            className="w-full h-48 rounded-[12px]"
                            emojiSize="text-[72px]"
                          />
                          {editMode && (
                            <div className="absolute top-2 right-2 flex gap-1.5">
                              <button
                                onClick={() => triggerImageUpload(item.id)}
                                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                                title={item.image_url ? "Reemplazar foto" : "Subir foto"}
                              >
                                <Upload className="w-3.5 h-3.5" />
                              </button>
                              {item.image_url && (
                                <button
                                  onClick={() => removeItemImage(item.id)}
                                  className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                                  title="Quitar foto"
                                >
                                  <XIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
                            className={`inline-flex items-center justify-center min-w-[56px] h-[56px] rounded-full text-[16px] font-bold whitespace-nowrap px-3 ${useBrandColors ? "bg-[color:var(--brand-primary)]" : "bg-[#1d3a4a]"} text-white`}
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
                          draggable
                          onDragStart={(e) => {
                            dragItem.current = { categoryId: category.id, itemId: item.id };
                            e.dataTransfer.effectAllowed = "move";
                            e.stopPropagation();
                          }}
                          className={`absolute top-1.5 left-1.5 z-10 ${cfg.muted} bg-white/90 backdrop-blur rounded-full p-1 shadow-sm cursor-grab active:cursor-grabbing`}
                          title="Arrastra para reordenar"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {showImages && (
                        <div className="relative">
                          <ItemImage
                            item={item}
                            categoryName={category.name}
                            className={`w-full ${layout === "three-col" ? "h-32" : "h-40"}`}
                            emojiSize={layout === "three-col" ? "text-[48px]" : "text-[60px]"}
                          />
                          {editMode && (
                            <div className="absolute top-1.5 right-1.5 flex gap-1">
                              <button
                                onClick={() => triggerImageUpload(item.id)}
                                className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                                title={item.image_url ? "Reemplazar foto" : "Subir foto"}
                              >
                                <Upload className="w-3 h-3" />
                              </button>
                              {item.image_url && (
                                <button
                                  onClick={() => removeItemImage(item.id)}
                                  className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                                  title="Quitar foto"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                          {cfg.priceBadge && (
                            <span
                              className={`absolute bottom-2 right-2 inline-flex items-center justify-center min-w-[50px] h-[50px] rounded-full text-[14px] font-bold px-2 ${useBrandColors ? "bg-[color:var(--brand-primary)]" : "bg-[#1d3a4a]"} text-white shadow-md`}
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
              </div>
            </section>
              </div>
            );
          })}
          {editMode && !freeMode && (
            <AddBlockSlot onAdd={(t) => createTextBlockAt(sections.length - 1, t)} />
          )}
          </div>

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
