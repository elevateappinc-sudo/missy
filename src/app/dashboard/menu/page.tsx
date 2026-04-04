"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Plus, Pencil, Trash2, Search, X, Save, ImagePlus, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_daily_special: boolean;
  category_id: string;
  category_name?: string;
}

interface CategoryRow {
  id: string;
  name: string;
}

const SUGGESTED_CATEGORIES = [
  "Entradas",
  "Sopas y Cremas",
  "Platos Fuertes",
  "Carnes",
  "Mariscos",
  "Pastas",
  "Ensaladas",
  "Bebidas",
  "Cócteles",
  "Postres",
  "Para Compartir",
  "Menú Infantil",
];

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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    is_available: true,
    is_daily_special: false,
    image_url: null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!restaurant) return;
    const [{ data: cats }, { data: menuItems }] = await Promise.all([
      supabase.from("menu_categories").select("id, name").eq("restaurant_id", restaurant.id).order("sort_order"),
      supabase
        .from("menu_items")
        .select("id, name, description, price, image_url, is_available, is_daily_special, category_id, menu_categories(name)")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order"),
    ]);
    setCategories(cats ?? []);
    setItems(
      (menuItems ?? []).map((i: any) => ({
        ...i,
        category_name: i.menu_categories?.name ?? "Sin categoría",
      }))
    );
  }, [restaurant, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Todos" || item.category_name === activeCategory;
    return matchSearch && matchCategory;
  });

  function openCreate() {
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
      price: "",
      category_id: categories[0]?.id ?? "",
      is_available: true,
      is_daily_special: false,
      image_url: null,
    });
    setImagePreview(null);
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
      is_daily_special: item.is_daily_special,
      image_url: item.image_url,
    });
    setImagePreview(item.image_url);
    setShowModal(true);
  }

  async function uploadImage(file: File) {
    if (!restaurant) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${restaurant.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("menu-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Upload error:", error);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(path);
    setForm((prev) => ({ ...prev, image_url: publicUrl }));
    setImagePreview(publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    if (!restaurant || !form.name || !form.price) return;
    setSaving(true);

    let categoryId = form.category_id;
    if (!categoryId) {
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

    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      category_id: categoryId,
      is_available: form.is_available,
      is_daily_special: form.is_daily_special,
      image_url: form.image_url,
    };

    if (editingItem) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
      if (error) console.error("Update error:", error);
    } else {
      const { error } = await supabase.from("menu_items").insert({
        ...payload,
        restaurant_id: restaurant.id,
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

  async function addCategory(name: string) {
    if (!restaurant || !name.trim()) return;
    await supabase.from("menu_categories").insert({
      name: name.trim(),
      restaurant_id: restaurant.id,
      sort_order: categories.length,
    });
    loadData();
  }

  async function deleteCategory(id: string) {
    const itemsInCategory = items.filter((i) => i.category_id === id);
    if (itemsInCategory.length > 0) {
      alert("No puedes eliminar una categoría que tiene platos. Mueve o elimina los platos primero.");
      return;
    }
    await supabase.from("menu_categories").delete().eq("id", id);
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
            onClick={() => setShowCategoryModal(true)}
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
          <a
            href="/dashboard/menu/preview"
            className="flex items-center gap-2 bg-white border border-border-light text-text-secondary px-4 py-2 rounded-full text-[13px] font-medium hover:border-primary/30 transition-all duration-300"
          >
            <Eye className="w-4 h-4" />
            Ver menú
          </a>
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
                  <div className="flex items-center gap-3">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-[8px] object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[8px] bg-bg-warm flex items-center justify-center text-text-muted/40">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-medium text-text-primary">{item.name}</p>
                        {item.is_daily_special && (
                          <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[10px] font-semibold">
                            Especial
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-text-muted mt-0.5 max-w-xs truncate">{item.description}</p>
                    </div>
                  </div>
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
                  <span
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${
                      item.is_available ? "bg-success/15 text-success" : "bg-error/15 text-error"
                    }`}
                  >
                    {item.is_available ? "Disponible" : "Agotado"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(item)}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all"
                    >
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] border border-border-light w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-semibold text-text-primary">
                {editingItem ? "Editar plato" : "Nuevo plato"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-2">Imagen</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full h-40 rounded-[12px] border-2 border-dashed border-border-light bg-bg-warm/50 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-all overflow-hidden"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[13px] font-medium">Cambiar imagen</span>
                      </div>
                    </>
                  ) : uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-[13px] text-text-muted">Subiendo...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImagePlus className="w-8 h-8 text-text-muted/40" />
                      <span className="text-[13px] text-text-muted">Haz clic para subir una imagen</span>
                      <span className="text-[11px] text-text-muted/60">JPG, PNG o WebP</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage(file);
                  }}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">Nombre del plato</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Bandeja Paisa"
                  className="w-full px-4 py-2.5 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">Descripción</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ingredientes, preparación, alérgenos..."
                  className="w-full px-4 py-2.5 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                />
              </div>

              {/* Price + Category */}
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
                    {categories.length === 0 && <option value="">Sin categorías — se creará "General"</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-[13px] text-text-secondary">Disponible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_daily_special}
                    onChange={(e) => setForm({ ...form, is_daily_special: e.target.checked })}
                    className="w-4 h-4 rounded accent-warning"
                  />
                  <span className="text-[13px] text-text-secondary">Especial del día</span>
                </label>
              </div>

              {/* Save */}
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

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] border border-border-light w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-semibold text-text-primary">Gestionar categorías</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing categories */}
            {categories.length > 0 && (
              <div className="mb-6">
                <p className="text-[13px] font-medium text-text-primary mb-2">Tus categorías</p>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-bg-warm">
                      <span className="text-[14px] text-text-primary">{cat.name}</span>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-text-muted hover:text-error transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested categories */}
            <div>
              <p className="text-[13px] font-medium text-text-primary mb-2">Sugerencias</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_CATEGORIES.filter(
                  (s) => !categories.some((c) => c.name.toLowerCase() === s.toLowerCase())
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => addCategory(suggestion)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-all"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom category */}
            <div className="mt-6">
              <p className="text-[13px] font-medium text-text-primary mb-2">Categoría personalizada</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem("catName") as HTMLInputElement;
                  if (input.value.trim()) {
                    addCategory(input.value);
                    input.value = "";
                  }
                }}
                className="flex gap-2"
              >
                <input
                  name="catName"
                  type="text"
                  placeholder="Nombre de la categoría"
                  className="flex-1 px-4 py-2 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-all"
                >
                  Agregar
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
