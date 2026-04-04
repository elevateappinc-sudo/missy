"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Printer, Download } from "lucide-react";
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function MenuPreviewPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [style, setStyle] = useState<"classic" | "modern" | "elegant">("elegant");

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

  const specials = categories.flatMap((c) => c.items.filter((i) => i.is_daily_special));

  return (
    <>
      {/* Controls bar - hidden on print */}
      <div className="print:hidden bg-white border-b border-border-light px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard/menu"
            className="flex items-center gap-2 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al menú
          </a>
        </div>
        <div className="flex items-center gap-3">
          {/* Style selector */}
          <div className="flex items-center gap-1 bg-bg-warm rounded-full p-1">
            {(["elegant", "classic", "modern"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
                  style === s ? "bg-white text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {s === "elegant" ? "Elegante" : s === "classic" ? "Clásico" : "Moderno"}
              </button>
            ))}
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Menu preview */}
      <div
        className={`min-h-screen ${
          style === "elegant"
            ? "bg-[#0a0a0a] text-[#f5f0eb]"
            : style === "classic"
            ? "bg-[#faf7f2] text-[#2c2420]"
            : "bg-white text-[#1a1a1a]"
        }`}
      >
        <div className="max-w-3xl mx-auto px-8 py-16 print:py-8">
          {/* Header */}
          <header className="text-center mb-16 print:mb-10">
            {style === "elegant" && (
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="h-px w-16 bg-[#c4a87c]" />
                <span className="text-[#c4a87c] text-[11px] tracking-[0.3em] uppercase font-light">
                  Menú Degustación
                </span>
                <span className="h-px w-16 bg-[#c4a87c]" />
              </div>
            )}

            <h1
              className={`${
                style === "elegant"
                  ? "text-[42px] font-light tracking-[0.08em] text-[#f5f0eb]"
                  : style === "classic"
                  ? "text-[38px] font-serif font-bold text-[#2c2420]"
                  : "text-[36px] font-bold tracking-tight text-[#1a1a1a]"
              }`}
              style={style === "classic" ? { fontFamily: "Georgia, 'Times New Roman', serif" } : {}}
            >
              {restaurant?.name ?? "Restaurante"}
            </h1>

            {restaurant?.description && (
              <p
                className={`mt-3 max-w-md mx-auto ${
                  style === "elegant"
                    ? "text-[14px] text-[#a09080] font-light tracking-wide"
                    : style === "classic"
                    ? "text-[14px] text-[#7a6a5a] italic"
                    : "text-[14px] text-[#888]"
                }`}
                style={style === "classic" ? { fontFamily: "Georgia, 'Times New Roman', serif" } : {}}
              >
                {restaurant.description}
              </p>
            )}

            {style === "elegant" && (
              <div className="mt-8 flex justify-center">
                <span className="w-8 h-px bg-[#c4a87c]" />
              </div>
            )}
            {style === "classic" && (
              <div className="mt-6 flex justify-center">
                <span className="text-[#c4a060] text-[18px]">✦</span>
              </div>
            )}
          </header>

          {/* Daily specials */}
          {specials.length > 0 && (
            <section className="mb-14 print:mb-8">
              <div className="text-center mb-8">
                <p
                  className={`text-[11px] tracking-[0.25em] uppercase mb-2 ${
                    style === "elegant" ? "text-[#c4a87c]" : style === "classic" ? "text-[#c4a060]" : "text-primary"
                  }`}
                >
                  Especiales del día
                </p>
              </div>
              <div
                className={`rounded-[12px] p-6 ${
                  style === "elegant"
                    ? "border border-[#c4a87c]/20 bg-[#c4a87c]/5"
                    : style === "classic"
                    ? "border border-[#d4c4a0]/40 bg-[#f5f0e8]"
                    : "border border-primary/15 bg-primary/5"
                }`}
              >
                {specials.map((item) => (
                  <div key={item.id} className="flex items-baseline justify-between py-2">
                    <div>
                      <span
                        className={`text-[15px] font-medium ${
                          style === "elegant" ? "text-[#f5f0eb]" : style === "classic" ? "text-[#2c2420]" : "text-[#1a1a1a]"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.description && (
                        <span
                          className={`block text-[12px] mt-0.5 ${
                            style === "elegant" ? "text-[#a09080]" : style === "classic" ? "text-[#7a6a5a] italic" : "text-[#999]"
                          }`}
                          style={style === "classic" ? { fontFamily: "Georgia, serif" } : {}}
                        >
                          {item.description}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[14px] font-medium ml-4 whitespace-nowrap ${
                        style === "elegant" ? "text-[#c4a87c]" : style === "classic" ? "text-[#c4a060]" : "text-primary"
                      }`}
                    >
                      ${formatPrice(item.price)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Categories */}
          {categories.map((category) => (
            <section key={category.name} className="mb-14 print:mb-8">
              {/* Category title */}
              <div className="text-center mb-8">
                {style === "elegant" && (
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="h-px w-12 bg-[#333]" />
                    <span className="h-px w-12 bg-[#333]" />
                  </div>
                )}
                <h2
                  className={`${
                    style === "elegant"
                      ? "text-[13px] tracking-[0.25em] uppercase text-[#c4a87c] font-light"
                      : style === "classic"
                      ? "text-[22px] font-serif text-[#2c2420] border-b border-[#d4c4a0]/50 pb-3 inline-block"
                      : "text-[18px] font-bold text-[#1a1a1a] uppercase tracking-wider"
                  }`}
                  style={style === "classic" ? { fontFamily: "Georgia, 'Times New Roman', serif" } : {}}
                >
                  {category.name}
                </h2>
              </div>

              {/* Items */}
              <div className="space-y-6">
                {category.items.map((item) => (
                  <div key={item.id} className="group">
                    {item.image_url && style === "modern" && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-cover rounded-[12px] mb-3"
                      />
                    )}
                    <div className="flex items-baseline gap-2">
                      <h3
                        className={`text-[15px] font-medium ${
                          style === "elegant" ? "text-[#f5f0eb]" : style === "classic" ? "text-[#2c2420]" : "text-[#1a1a1a]"
                        }`}
                      >
                        {item.name}
                      </h3>
                      <span
                        className={`flex-1 border-b ${
                          style === "elegant"
                            ? "border-dotted border-[#333]"
                            : style === "classic"
                            ? "border-dotted border-[#d4c4a0]/40"
                            : "border-dotted border-[#ddd]"
                        }`}
                      />
                      <span
                        className={`text-[14px] font-medium whitespace-nowrap ${
                          style === "elegant" ? "text-[#c4a87c]" : style === "classic" ? "text-[#c4a060]" : "text-primary"
                        }`}
                      >
                        ${formatPrice(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p
                        className={`mt-1 text-[13px] max-w-lg ${
                          style === "elegant"
                            ? "text-[#807060] font-light"
                            : style === "classic"
                            ? "text-[#7a6a5a] italic"
                            : "text-[#999]"
                        }`}
                        style={style === "classic" ? { fontFamily: "Georgia, serif" } : {}}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Footer */}
          <footer className="mt-16 pt-8 text-center print:mt-8">
            {style === "elegant" && <span className="block w-8 h-px bg-[#c4a87c] mx-auto mb-6" />}
            <p
              className={`text-[11px] tracking-[0.15em] uppercase ${
                style === "elegant" ? "text-[#555]" : style === "classic" ? "text-[#b0a090]" : "text-[#ccc]"
              }`}
            >
              Precios en pesos colombianos · IVA incluido
            </p>
            {restaurant?.phone && (
              <p
                className={`mt-2 text-[12px] ${
                  style === "elegant" ? "text-[#444]" : style === "classic" ? "text-[#b0a090]" : "text-[#ccc]"
                }`}
              >
                Reservas: {restaurant.phone}
              </p>
            )}
          </footer>
        </div>
      </div>
    </>
  );
}
