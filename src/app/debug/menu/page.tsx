import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function DebugMenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sections: Array<{ title: string; value: unknown }> = [];

  if (!user) {
    return (
      <main className="p-6 font-mono text-sm">
        No user session. Log in first.
      </main>
    );
  }

  // Resolve restaurant id using admin (ground truth)
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return (
      <main className="p-6 font-mono text-sm">
        Admin client not configured: {e instanceof Error ? e.message : String(e)}
      </main>
    );
  }

  const { data: restaurantAdmin } = await admin
    .from("restaurants")
    .select("id, name")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  sections.push({
    title: "User + restaurant",
    value: { user_id: user.id, email: user.email, restaurant: restaurantAdmin ?? null },
  });

  if (!restaurantAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 font-mono text-sm">
        <pre>{JSON.stringify(sections, null, 2)}</pre>
      </main>
    );
  }

  const rid = restaurantAdmin.id;

  // --- RLS-scoped (browser-equivalent) ---
  const { data: rlsCats, error: rlsCatsErr } = await supabase
    .from("menu_categories")
    .select(
      "id, name, sort_order, is_active, menu_items(id, name, is_available)"
    )
    .eq("restaurant_id", rid)
    .eq("is_active", true)
    .order("sort_order");
  sections.push({
    title: "RLS — menu_categories (is_active=true) with nested menu_items",
    value: {
      error: rlsCatsErr?.message ?? null,
      count: rlsCats?.length ?? 0,
      rows:
        rlsCats?.map((c: { id: string; name: string; is_active: boolean; menu_items?: unknown[] }) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
          menu_items_count: c.menu_items?.length ?? 0,
        })) ?? [],
    },
  });

  const { data: rlsItems, error: rlsItemsErr } = await supabase
    .from("menu_items")
    .select("id, name, is_available, category_id")
    .eq("restaurant_id", rid)
    .limit(200);
  sections.push({
    title: "RLS — menu_items direct query (no join)",
    value: {
      error: rlsItemsErr?.message ?? null,
      count: rlsItems?.length ?? 0,
      first_5: rlsItems?.slice(0, 5) ?? [],
    },
  });

  // EXACT preview query — includes layout_x/y/w and font_scale
  const { data: previewCats, error: previewErr } = await supabase
    .from("menu_categories")
    .select(
      "id, name, sort_order, font_scale, layout_x, layout_y, layout_w, menu_items(id, name, description, price, image_url, is_available, is_daily_special, sort_order)"
    )
    .eq("restaurant_id", rid)
    .eq("is_active", true)
    .order("sort_order");
  sections.push({
    title: "RLS — EXACT preview query (font_scale, layout_*)",
    value: {
      error: previewErr?.message ?? null,
      code: (previewErr as unknown as { code?: string } | null)?.code ?? null,
      details: (previewErr as unknown as { details?: string } | null)?.details ?? null,
      hint: (previewErr as unknown as { hint?: string } | null)?.hint ?? null,
      count: previewCats?.length ?? 0,
    },
  });

  const { data: previewBlocks, error: previewBlocksErr } = await supabase
    .from("menu_text_blocks")
    .select("id, content, block_type, sort_order, layout_x, layout_y, layout_w")
    .eq("restaurant_id", rid)
    .eq("is_active", true);
  sections.push({
    title: "RLS — EXACT preview query for text_blocks",
    value: {
      error: previewBlocksErr?.message ?? null,
      code: (previewBlocksErr as unknown as { code?: string } | null)?.code ?? null,
      count: previewBlocks?.length ?? 0,
    },
  });

  // --- Admin (ground truth) ---
  const { data: adminCats } = await admin
    .from("menu_categories")
    .select("id, name, is_active, sort_order")
    .eq("restaurant_id", rid)
    .order("sort_order");
  sections.push({
    title: "Admin — all menu_categories (no RLS)",
    value: {
      count: adminCats?.length ?? 0,
      active_count: adminCats?.filter((c: { is_active: boolean }) => c.is_active).length ?? 0,
      rows: adminCats ?? [],
    },
  });

  const { data: adminItems } = await admin
    .from("menu_items")
    .select("id, name, is_available, category_id")
    .eq("restaurant_id", rid);
  sections.push({
    title: "Admin — all menu_items (no RLS)",
    value: {
      count: adminItems?.length ?? 0,
      available_count:
        adminItems?.filter((i: { is_available: boolean }) => i.is_available).length ?? 0,
      first_5: adminItems?.slice(0, 5) ?? [],
    },
  });

  // --- Policies on menu_items ---
  const { data: itemPolicies } = await admin
    .rpc("pg_catalog_policies" as never, {} as never)
    .select()
    .limit(0);
  if (!itemPolicies) {
    const { data: rawPolicies } = await admin
      .from("pg_policies" as never)
      .select("policyname, cmd, qual")
      .eq("tablename", "menu_items");
    sections.push({
      title: "Policies on menu_items",
      value: rawPolicies ?? "could not read pg_policies",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 font-mono text-sm">
      <h1 className="text-xl font-semibold mb-4">Menu debug</h1>
      <div className="space-y-4">
        {sections.map((s, i) => (
          <section key={i} className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">{s.title}</h2>
            <pre className="text-[12px] text-slate-800 whitespace-pre-wrap break-all">
              {JSON.stringify(s.value, null, 2)}
            </pre>
          </section>
        ))}
      </div>
    </main>
  );
}
