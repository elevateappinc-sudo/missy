"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";

interface MenuItemLocal {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  isAvailable: boolean;
}

const mockCategories = ["Entradas", "Platos fuertes", "Bebidas", "Postres"];

const mockItems: MenuItemLocal[] = [
  { id: "1", name: "Bandeja Paisa", category: "Platos fuertes", price: 32000, description: "Frijoles, arroz, carne molida, chicharrón, huevo, plátano, arepa y aguacate.", isAvailable: true },
  { id: "2", name: "Ajiaco Santafereño", category: "Platos fuertes", price: 28000, description: "Sopa de pollo con papa criolla, mazorca y guascas.", isAvailable: true },
  { id: "3", name: "Empanadas (x3)", category: "Entradas", price: 12000, description: "Empanadas de carne con ají.", isAvailable: true },
  { id: "4", name: "Limonada de Coco", category: "Bebidas", price: 8000, description: "Limonada natural con leche de coco.", isAvailable: false },
  { id: "5", name: "Tres Leches", category: "Postres", price: 15000, description: "Bizcocho bañado en tres leches con canela.", isAvailable: true },
  { id: "6", name: "Patacones con Hogao", category: "Entradas", price: 10000, description: "Patacones crocantes con salsa hogao.", isAvailable: true },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

export default function MenuPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [items] = useState(mockItems);

  const filtered = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "Todos" || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <DashboardHeader title="Menú" subtitle="Gestiona las categorías y platos de tu restaurante" />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {["Todos", ...mockCategories].map((cat) => (
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
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]">
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
                    {item.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-[14px] font-medium text-text-primary">
                  {formatPrice(item.price)}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${
                    item.isAvailable
                      ? "bg-success/15 text-success"
                      : "bg-error/15 text-error"
                  }`}>
                    {item.isAvailable ? "Disponible" : "Agotado"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all">
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
            No se encontraron platos.
          </div>
        )}
      </div>
    </>
  );
}
