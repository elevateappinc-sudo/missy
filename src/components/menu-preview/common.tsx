/**
 * Shared helpers for menu preview rendering.
 * Extracted from preview/page.tsx so per-style layouts can reuse them.
 */

export interface MenuItemLike {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(price);
}

export function getFoodEmoji(itemName: string, categoryName: string): string {
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
  if (/pescado|fish|salmon|atún|atun|trucha|pargo|robalo|mojarra|bocachico|picuda/.test(text)) return "🐟";
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
  if (/bebida|limonad/.test(text)) return "🥤";
  return "🍽️";
}

export function ItemImage({
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
    return (
      <img
        src={item.image_url}
        alt={item.name}
        className={`${className ?? ""} object-cover`}
      />
    );
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
