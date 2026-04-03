"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FloorPlanCanvas } from "@/components/tables/floor-plan-canvas";
import { TablePanel } from "@/components/tables/table-panel";
import { statusColors } from "@/components/tables/table-node";
import { Plus, Maximize2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import type { Table, TableStatus } from "@/types";

export default function TablesPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTables = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at");
    setTables((data as Table[]) ?? []);
  }, [restaurant, supabase]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Realtime subscription
  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("tables-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadTables()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant, supabase, loadTables]);

  // Add new table
  async function addTable() {
    if (!restaurant) return;
    const num = tables.length + 1;
    const qrCode = `${restaurant.id}-mesa-${num}-${crypto.randomUUID().slice(0, 8)}`;
    // Offset position so tables don't stack
    const posX = 100 + ((num - 1) % 5) * 140;
    const posY = 100 + Math.floor((num - 1) / 5) * 140;
    await supabase.from("tables").insert({
      name: `Mesa ${num}`,
      restaurant_id: restaurant.id,
      qr_code: qrCode,
      position_x: posX,
      position_y: posY,
      width: 100,
      height: 100,
      shape: "square",
      capacity: 4,
      status: "empty",
    });
    loadTables();
  }

  // Move table (debounced save)
  function handleMove(id: string, x: number, y: number) {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t))
    );
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      supabase.from("tables").update({ position_x: x, position_y: y }).eq("id", id).then();
    }, 300);
  }

  // Update table properties
  function handleUpdate(id: string, updates: Partial<Table>) {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      supabase.from("tables").update(updates).eq("id", id).then();
    }, 300);
  }

  // Delete table
  async function handleDelete(id: string) {
    await supabase.from("tables").delete().eq("id", id);
    setSelectedId(null);
    loadTables();
  }

  const selectedTable = tables.find((t) => t.id === selectedId) ?? null;

  // Status counts
  const statusCounts = tables.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <DashboardHeader title="Mesas" subtitle="Mapa interactivo del restaurante" />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        {/* Status legend */}
        <div className="flex items-center gap-4">
          {(Object.entries(statusColors) as [TableStatus, { stroke: string; label: string }][]).map(
            ([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.stroke }} />
                {val.label}
                <span className="font-semibold text-text-primary ml-0.5">
                  {statusCounts[key] || 0}
                </span>
              </div>
            )
          )}
        </div>

        <button
          onClick={addTable}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]"
        >
          <Plus className="w-4 h-4" />
          Agregar mesa
        </button>
      </div>

      {/* Canvas + Panel */}
      <div className="relative" style={{ height: "calc(100vh - 220px)" }}>
        <div className={`h-full ${selectedTable ? "mr-[300px]" : ""} transition-all duration-300`}>
          <FloorPlanCanvas
            tables={tables}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
          />
        </div>

        {selectedTable && (
          <TablePanel
            table={selectedTable}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </>
  );
}
