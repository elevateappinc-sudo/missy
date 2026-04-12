"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Printer, Columns2, Columns3, LayoutList, Image as ImageIcon, ImageOff } from "lucide-react";
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
}

interface Category {
  name: string;
  items: MenuItem[];
}

type MenuStyle = "elegant" | "classic" | "modern" | "tierra" | "maritimo" | "peruano" | "carne" | "colombiano";
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
  headerDecoration?: "lines" | "diamond" | "wave" | "leaf" | "anchor" | "sun" | "flame" | "coffee";
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
    default:
      return null;
  }
}

export default function MenuPreviewPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [style, setStyle] = useState<MenuStyle>("elegant");
  const [layout, setLayout] = useState<LayoutMode>("single");
  const [showImages, setShowImages] = useState(true);

  const loadMenu = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("menu_categories")
      .select("name, menu_items(id, name, description, price, image_url, is_available, is_daily_special)")
      .eq("restaurant_id", restaurant.id)
      .eq("is_active", true)
      .order("sort_order");

    setCategories(
      (data ?? [])
        .map((c: any) => ({
          name: c.name,
          items: (c.menu_items ?? []).filter((i: any) => i.is_available),
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
            <h1 className={`text-[40px] font-light tracking-[0.06em] ${cfg.text}`}>
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
            <section key={category.name} className="mb-14 print:mb-8">
              {/* Category title */}
              <div className="text-center mb-8">
                <h2 className={`text-[14px] tracking-[0.2em] uppercase font-medium ${cfg.accent}`}>
                  {category.name}
                </h2>
                <div className={`mt-2 h-px w-16 mx-auto ${cfg.border} opacity-40`} style={{ borderTopWidth: 1, borderTopStyle: "solid" }} />
              </div>

              {/* Items */}
              {layout === "single" ? (
                <div className="space-y-5">
                  {category.items.map((item) => (
                    <div key={item.id} className="group">
                      {showImages && item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-48 object-cover rounded-[12px] mb-3"
                        />
                      )}
                      <div className="flex items-baseline gap-2">
                        <h3 className={`text-[15px] font-medium ${cfg.text}`}>{item.name}</h3>
                        <span className={`flex-1 border-b border-dotted ${cfg.border} opacity-30`} />
                        <span className={`text-[14px] font-medium whitespace-nowrap ${cfg.accentText}`}>
                          ${formatPrice(item.price)}
                        </span>
                      </div>
                      {item.description && (
                        <p className={`mt-1 text-[13px] max-w-lg ${cfg.muted}`}>{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={gridClass}>
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-[12px] overflow-hidden border ${cfg.border} opacity-90 hover:opacity-100 transition-opacity ${cfg.cardBg}`}
                    >
                      {showImages && item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className={`w-full object-cover ${layout === "three-col" ? "h-32" : "h-40"}`}
                        />
                      )}
                      <div className="p-4">
                        <h3 className={`text-[14px] font-medium ${cfg.text}`}>{item.name}</h3>
                        {item.description && (
                          <p className={`mt-1 text-[12px] line-clamp-2 ${cfg.muted}`}>{item.description}</p>
                        )}
                        <p className={`mt-2 text-[15px] font-semibold ${cfg.accentText}`}>
                          ${formatPrice(item.price)}
                        </p>
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
