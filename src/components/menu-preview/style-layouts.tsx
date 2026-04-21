/**
 * Per-style item layouts for the menu preview.
 *
 * Each style has its own distinctive rendering (columns, image shape,
 * separators, typography, etc.) modeled after real-world reference
 * restaurants. These apply in VIEW mode only; EDIT mode keeps the
 * generic grid so drag/edit logic doesn't need to be duplicated.
 */

import Link from "next/link";
import { ItemImage, formatPrice, getFoodEmoji, type MenuItemLike } from "./common";

export type LayoutStyle =
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

interface LayoutCtx {
  showImages: boolean;
  categoryName: string;
}

interface Props {
  items: MenuItemLike[];
  ctx: LayoutCtx;
}

/* -------- 1. Elegante: poema minimalista, centrado, sin fotos -------- */
function EleganteLayout({ items }: Props) {
  return (
    <div className="max-w-md mx-auto space-y-12">
      {items.map((i) => (
        <div key={i.id} className="text-center">
          <h3 className="text-[22px] font-light text-[#f5f0eb] tracking-wide mb-2">
            {i.name}
          </h3>
          {i.description && (
            <p className="text-[11px] italic text-[#c4a87c]/80 max-w-xs mx-auto leading-relaxed mb-2">
              {i.description}
            </p>
          )}
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#807060]">
            ${formatPrice(i.price)}
          </p>
        </div>
      ))}
    </div>
  );
}

/* -------- 2. Clásico: 2 columnas con dotted leaders, serif -------- */
function ClasicoLayout({ items }: Props) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {items.map((i) => (
        <div key={i.id}>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-[#2c2420]">{i.name}</h3>
            <span className="flex-1 border-b border-dotted border-[#c4a060]/50" />
            <span className="text-[14px] font-semibold text-[#c4a060]">
              ${formatPrice(i.price)}
            </span>
          </div>
          {i.description && (
            <p className="text-[11px] italic text-[#7a6a5a] mt-1 leading-snug">
              {i.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------- 3. Moderno: grid 3-cols con fotos grandes, sans bold -------- */
function ModernoLayout({ items, ctx }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((i) => (
        <div key={i.id} className="group">
          {ctx.showImages && (
            <ItemImage
              item={i}
              categoryName={ctx.categoryName}
              className="w-full aspect-[4/3] rounded-[16px] mb-4 overflow-hidden"
              emojiSize="text-[56px]"
            />
          )}
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <h3 className="text-[17px] font-bold tracking-tight text-[#1a1a1a]">
              {i.name}
            </h3>
            <span className="text-[18px] font-bold text-primary whitespace-nowrap">
              ${formatPrice(i.price)}
            </span>
          </div>
          {i.description && (
            <p className="text-[12px] text-[#666] leading-relaxed line-clamp-2">
              {i.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------- 4. De Tierra: strips horizontales con foto cuadrada izquierda -------- */
function TierraLayout({ items, ctx }: Props) {
  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {items.map((i) => (
        <div
          key={i.id}
          className="flex gap-4 items-center border-b border-[#d4c09a]/50 pb-3"
        >
          {ctx.showImages && (
            <ItemImage
              item={i}
              categoryName={ctx.categoryName}
              className="w-20 h-20 rounded-[10px] shrink-0"
              emojiSize="text-[32px]"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-[#3d2b1f]">{i.name}</h3>
            {i.description && (
              <p className="text-[12px] text-[#7a6b55] mt-0.5 leading-snug">
                {i.description}
              </p>
            )}
          </div>
          <span className="bg-[#8b6914] text-white px-3 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap">
            ${formatPrice(i.price)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------- 5. Marítimo: cards partidas horizontales, foto izquierda 35% -------- */
function MaritimoLayout({ items, ctx }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      {items.map((i) => (
        <div
          key={i.id}
          className="flex bg-white/80 rounded-[14px] overflow-hidden border border-[#b0d0e0]/60 shadow-sm"
        >
          {ctx.showImages && (
            <ItemImage
              item={i}
              categoryName={ctx.categoryName}
              className="w-[40%] h-32 shrink-0"
              emojiSize="text-[44px]"
            />
          )}
          <div className="flex-1 p-4 flex flex-col">
            <h3 className="text-[15px] font-semibold text-[#1a3a4a] mb-1">
              {i.name}
            </h3>
            {i.description && (
              <p className="text-[11px] text-[#6a8fa0] leading-snug flex-1">
                {i.description}
              </p>
            )}
            <p className="text-[16px] font-bold text-[#2980b9] mt-2">
              ${formatPrice(i.price)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------- 6. Peruano: grid 4-tiles con overlay nombre+precio -------- */
function PeruanoLayout({ items, ctx }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((i) => (
        <div
          key={i.id}
          className="relative aspect-square rounded-[10px] overflow-hidden bg-[#faf0e0]"
        >
          {ctx.showImages && (
            <ItemImage
              item={i}
              categoryName={ctx.categoryName}
              className="absolute inset-0 w-full h-full"
              emojiSize="text-[40px]"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 pt-8 text-white">
            <p className="text-[12px] font-bold leading-tight line-clamp-2 mb-0.5">
              {i.name}
            </p>
            <p className="text-[12px] font-extrabold text-[#ff9b5c]">
              ${formatPrice(i.price)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------- 7. Carnes: lista gruesa serif, separadores pesados, sin fotos -------- */
function CarnesLayout({ items }: Props) {
  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {items.map((i, idx) => (
        <div
          key={i.id}
          className={`flex items-baseline gap-4 py-5 ${
            idx < items.length - 1 ? "border-b-2 border-[#3a2020]" : ""
          }`}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-[20px] font-semibold uppercase tracking-wider text-[#f5ebe0] leading-tight">
              {i.name}
            </h3>
            {i.description && (
              <p className="text-[12px] text-[#8a7060] mt-1 italic">
                {i.description}
              </p>
            )}
          </div>
          <span className="text-[22px] font-bold text-[#e74c3c] whitespace-nowrap">
            ${formatPrice(i.price)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------- 8. Colombiano: panel enmarcado con viñetas festivas -------- */
function ColombianoLayout({ items }: Props) {
  return (
    <div className="bg-[#faf5e5] border-2 border-[#e0c880]/60 rounded-[16px] p-6 max-w-2xl mx-auto shadow-sm">
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-3">
            <span className="text-[#c68a00] mt-1 text-[10px]">✦</span>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <h3 className="text-[15px] font-semibold text-[#2a1f10]">
                  {i.name}
                </h3>
                <span className="flex-1 border-b border-dotted border-[#c68a00]/50" />
                <span className="text-[14px] font-bold text-[#c68a00] whitespace-nowrap">
                  ${formatPrice(i.price)}
                </span>
              </div>
              {i.description && (
                <p
                  className="text-[12px] italic text-[#7a6a45] mt-0.5 leading-snug"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {i.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------- 9. Cafetería: 2 columnas con iconos lineales estilo Horangi -------- */
function CafeteriaLayout({ items, ctx }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
      {items.map((i) => (
        <div key={i.id} className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-[10px] border-2 border-[#163b9a] flex items-center justify-center shrink-0 bg-white/40">
            <span className="text-[22px] leading-none">
              {getFoodEmoji(i.name, ctx.categoryName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <h3 className="text-[14px] font-extrabold uppercase tracking-tight text-[#163b9a]">
                {i.name}
              </h3>
              <span className="flex-1" />
              <span className="text-[14px] font-extrabold text-[#163b9a] whitespace-nowrap">
                ${formatPrice(i.price)}
              </span>
            </div>
            {i.description && (
              <p className="text-[11px] text-[#2a4a8a] leading-snug mt-0.5">
                {i.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------- 10. Rústico: grid con fotos + badges ovalados -------- */
function RusticoLayout({ items, ctx }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((i) => (
        <div
          key={i.id}
          className="bg-[#ebdcb6] rounded-[14px] overflow-hidden border border-[#8b6a40]/40 shadow-sm relative"
        >
          {ctx.showImages && (
            <ItemImage
              item={i}
              categoryName={ctx.categoryName}
              className="w-full h-40"
              emojiSize="text-[52px]"
            />
          )}
          <span className="absolute top-2 right-2 inline-flex items-center justify-center min-w-[52px] h-[52px] rounded-full text-[14px] font-extrabold px-2 bg-[#1d3a4a] text-white shadow-md border-2 border-white/80">
            ${formatPrice(i.price)}
          </span>
          <div className="p-4">
            <h3
              className="text-[15px] font-bold uppercase tracking-wider text-[#3a2818] leading-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {i.name}
            </h3>
            {i.description && (
              <p
                className="text-[11px] text-[#705a40] mt-1 leading-snug italic"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {i.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------- 11. Bistró: 2 columnas densas con dotted leaders serif -------- */
function BistroLayout({ items }: Props) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 max-w-4xl mx-auto"
      style={{ fontFamily: "Georgia, serif" }}
    >
      {items.map((i) => (
        <div key={i.id}>
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] font-semibold text-[#0f1d33]">{i.name}</h3>
            <span className="flex-1 border-b border-dotted border-[#0f1d33]/40" />
            <span className="text-[15px] font-bold text-[#0f1d33] whitespace-nowrap">
              ${formatPrice(i.price)}
            </span>
          </div>
          {i.description && (
            <p className="text-[11px] italic text-[#4a5468] mt-0.5 leading-snug">
              {i.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const LAYOUTS: Record<LayoutStyle, React.FC<Props>> = {
  elegant: EleganteLayout,
  classic: ClasicoLayout,
  modern: ModernoLayout,
  tierra: TierraLayout,
  maritimo: MaritimoLayout,
  peruano: PeruanoLayout,
  carne: CarnesLayout,
  colombiano: ColombianoLayout,
  cafeteria: CafeteriaLayout,
  rustico: RusticoLayout,
  bistro: BistroLayout,
};

export function StyleLayout({
  style,
  items,
  ctx,
}: {
  style: LayoutStyle;
  items: MenuItemLike[];
  ctx: LayoutCtx;
}) {
  const Component = LAYOUTS[style];
  if (!Component) return null;
  return <Component items={items} ctx={ctx} />;
}

// Re-export so callers can use the same Link import and tree-shake
export { Link };
