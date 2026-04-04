"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Plus, Pencil, Trash2, Search, X, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  category_id: string;
  category_name?: string;
}

interface CategoryRow {
  id: string;
  name: string;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

export default function MenuPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);

  const [items, setItems] = useState<MenuItemRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category_id: "", is_available: true });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!restaurant) return;
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from("menu_categories").select("id, name").eq("restaurant_id", restaurant.id).order("sort_order"),
      supabase.from("menu_items").select("id, name, description, price, is_available, category_id, menu_categories(name)").eq("restaurant_id", restaurant.id).order("sort_order"),
    ]);
    setCategories(cats ?? []);
    setItems(
      (menuItems ?? []).map((i: any) => ({
        ...i,
        category_name: i.menu_categories?.name ?? "Sin categoría",
      }))
    );
  }, [restaurant, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Todos" || item.category_name === activeCategory;
    return matchSearch && matchCategory;
  });

  function openCreate() {
    setEditingItem(null);
    setForm({ name: "", description: "", price: "", category_id: categories[0]?.id ?? "", is_available: true });
    setShowModal(true);
  }

  function openEdit(item: MenuItemRow) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      category_id: item.category_id,
      is_available: item.is_available,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!restaurant || !form.name || !form.price) return;
    setSaving(true);

    // Ensure category exists
    let categoryId = form.category_id;
    if (!categoryId) {
      // Create default category if none exist
      const { data } = await supabase
        .from("menu_categories")
        .insert({ name: "General", restaurant_id: restaurant.id })
        .select("id")
        .single();
      if (data) {
        categoryId = data.id;
      } else {
        setSaving(false);
        return;
      }
    }

    if (editingItem) {
      const { error } = await supabase.from("menu_items").update({
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category_id: categoryId,
        is_available: form.is_available,
      }).eq("id", editingItem.id);
      if (error) console.error("Update error:", error);
    } else {
      const { error } = await supabase.from("menu_items").insert({
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        category_id: categoryId,
        restaurant_id: restaurant.id,
        is_available: form.is_available,
      });
      if (error) console.error("Insert error:", error);
    }

    setSaving(false);
    setShowModal(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este plato?")) return;
    await supabase.from("menu_items").delete().eq("id", id);
    loadData();
  }

  async function handleAddCategory() {
    const name = prompt("Nombre de la categoría:");
    if (!name || !restaurant) return;
    await supabase.from("menu_categories").insert({ name, restaurant_id: restaurant.id });
    loadData();
  }

  return (
    <>
      <DashboardHeader title="Menú" subtitle="Gestiona las categorías y platos de tu restaurante" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {["Todos", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-white"
                  : "bg-white border border-border-light text-text-secondary hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={handleAddCategory}
            className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-white border border-dashed border-border-light text-text-muted hover:border-primary/30 hover:text-primary transition-all"
          >
            + Categoría
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar plato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-[10px] border border-border-light bg-white text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 w-[200px] transition-all duration-300"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]"
          >
            <Plus className="w-4 h-4" />
            Agregar plato
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-border-light overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-light">
              <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-text-muted uppercase tracking-wider">Plato</th>
              <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-text-muted uppercase tracking-wider">Categoría</th>
              <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-text-muted uppercase tracking-wider">Precio</th>
              <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-text-muted uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-3.5 text-[12px] font-semibold text-text-muted uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {filtered.map((item) => (
              <tr key={item.id} className="hover:bg-bg-warm/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-[14px] font-medium text-text-primary">{item.name}</p>
                  <p className="text-[12px] text-text-muted mt-0.5 max-w-xs truncate">{item.description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full bg-bg-warm text-[12px] font-medium text-text-secondary">
                    {item.category_name}
                  </span>
                </td>
                <td className="px-6 py-4 text-[14px] font-medium text-text-primary">
                  {formatPrice(item.price)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${
                    item.is_available ? "bg-success/15 text-success" : "bg-error/15 text-error"
                  }`}>
                    {item.is_available ? "Disponible" : "Agotado"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(item)} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-muted text-[14px]">
            {items.length === 0 ? "Agrega tu primer plato al menú" : "No se encontraron platos."}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] border border-border-light w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-semibold text-text-primary">
                {editingItem ? "Editar plato" : "Nuevo plato"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bandeja Paisa"
                  className="w-full px-4 py-2.5 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del plato..."
                  className="w-full px-4 py-2.5 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Precio (COP)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="32000"
                    className="w-full px-4 py-2.5 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">Categoría</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-[13px] text-text-secondary">Disponible</span>
              </label>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.price}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingItem ? "Guardar cambios" : "Crear plato"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
