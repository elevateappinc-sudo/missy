"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Plus, QrCode, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

interface TableRow {
  id: string;
  name: string;
  is_active: boolean;
  qr_code: string | null;
}

export default function TablesPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [tables, setTables] = useState<TableRow[]>([]);

  const loadTables = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("tables")
      .select("id, name, is_active, qr_code")
      .eq("restaurant_id", restaurant.id)
      .order("created_at");
    setTables(data ?? []);
  }, [restaurant, supabase]);

  useEffect(() => { loadTables(); }, [loadTables]);

  async function addTable() {
    if (!restaurant) return;
    const num = tables.length + 1;
    const qrCode = `${restaurant.id}-mesa-${num}-${crypto.randomUUID().slice(0, 8)}`;
    await supabase.from("tables").insert({
      name: `Mesa ${num}`,
      restaurant_id: restaurant.id,
      qr_code: qrCode,
    });
    loadTables();
  }

  async function deleteTable(id: string) {
    if (!confirm("¿Eliminar esta mesa?")) return;
    await supabase.from("tables").delete().eq("id", id);
    loadTables();
  }

  const active = tables.filter((t) => t.is_active).length;

  return (
    <>
      <DashboardHeader title="Mesas" subtitle="Administra las mesas y sus códigos QR" />

      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-[14px]">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{active}</span> mesas activas
          </span>
        </div>
        <div className="ml-auto">
          <button
            onClick={addTable}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]"
          >
            <Plus className="w-4 h-4" />
            Agregar mesa
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-border-light py-16 text-center">
          <p className="text-text-muted text-[14px]">Agrega tu primera mesa para generar un QR</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="relative bg-white rounded-[16px] border border-border-light p-5 transition-all duration-300 hover:border-primary/20"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-semibold text-text-primary">{table.name}</h3>
                <span className={`w-2.5 h-2.5 rounded-full ${table.is_active ? "bg-success" : "bg-error/50"}`} />
              </div>
              <p className="text-[12px] text-text-muted mb-4 font-mono truncate">
                {table.qr_code?.slice(0, 20)}...
              </p>
              <div className="flex items-center gap-1.5">
                <a
                  href={`/mesa/${table.id}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-primary/8 text-primary text-[12px] font-medium hover:bg-primary/15 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Ver QR
                </a>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
