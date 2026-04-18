"use client";

import { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FloorPlanCanvas } from "@/components/tables/floor-plan-canvas";
import { TablePanel } from "@/components/tables/table-panel";
import { statusColors } from "@/components/tables/table-node";
import { Plus, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import { getNextTableNumber } from "@/lib/tables";
import type { Table, TableStatus } from "@/types";

export default function FloorPage({ params }: { params: Promise<{ floor: string }> }) {
  const { floor: rawFloor } = use(params);
  const floorName = decodeURIComponent(rawFloor);
  const supabase = createClient();
  const router = useRouter();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [floors, setFloors] = useState<string[]>([floorName]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTables = useCallback(async () => {
    if (!restaurant) return;
    const [{ data: tablesData }, { data: floorsData }] = await Promise.all([
      supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("created_at"),
      supabase
        .from("restaurant_floors")
        .select("name")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order"),
    ]);
    const loaded = ((tablesData as Table[]) ?? []).map((t) => ({
      ...t,
      floor: t.floor || "Piso 1",
    }));
    setTables(loaded);
    const fromRows = (floorsData as { name: string }[] | null ?? []).map((r) => r.name);
    setFloors(fromRows.length ? fromRows : [floorName]);
  }, [restaurant, supabase, floorName]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel(`floor-${floorName}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadTables()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant, supabase, loadTables, floorName]);

  async function addTable() {
    if (!restaurant) return;
    const floorTables = tables.filter((t) => t.floor === floorName);
    const isBar = floorName.toLowerCase().includes("barra");
    const nextNumber = getNextTableNumber(tables, isBar ? "Barra" : "Mesa");
    const qrCode = `${restaurant.id}-mesa-${nextNumber}-${crypto.randomUUID().slice(0, 8)}`;
    const posX = 100 + ((floorTables.length) % 5) * 140;
    const posY = 100 + Math.floor((floorTables.length) / 5) * 140;
    const { error } = await supabase.from("tables").insert({
      name: `${isBar ? "Barra" : "Mesa"} ${nextNumber}`,
      restaurant_id: restaurant.id,
      qr_code: qrCode,
      position_x: posX,
      position_y: posY,
      width: isBar ? 140 : 100,
      height: isBar ? 80 : 100,
      shape: isBar ? "rectangle" : "square",
      capacity: isBar ? 2 : 4,
      status: "empty",
      floor: floorName,
    });
    if (error) {
      alert(`Error al crear mesa: ${error.message}`);
      return;
    }
    loadTables();
  }

  function handleMove(id: string, x: number, y: number) {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, position_x: x, position_y: y } : t))
    );
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      supabase.from("tables").update({ position_x: x, position_y: y }).eq("id", id).then();
    }, 300);
  }

  function handleUpdate(id: string, updates: Partial<Table>) {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      supabase.from("tables").update(updates).eq("id", id).then(() => {
        // If floor changed, the updated table will move to the other floor view on next load
        if (updates.floor && updates.floor !== floorName) {
          loadTables();
        }
      });
    }, 300);
  }

  async function handleDelete(id: string) {
    await supabase.from("tables").delete().eq("id", id);
    setSelectedId(null);
    const remaining = tables.filter((t) => t.floor === floorName && t.id !== id);
    if (remaining.length === 0) {
      // Floor has no more tables — navigate back to floors overview
      router.push("/dashboard/tables");
      return;
    }
    loadTables();
  }

  const floorTables = tables.filter((t) => t.floor === floorName);
  const selectedTable = floorTables.find((t) => t.id === selectedId) ?? null;

  const statusCounts = floorTables.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const isBar = floorName.toLowerCase().includes("barra");

  return (
    <>
      <DashboardHeader title={floorName} subtitle="Mapa interactivo del piso" />

      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/dashboard/tables"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-text-secondary bg-white border border-border-light hover:border-primary/30 hover:text-primary transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Pisos
        </Link>
        <span className="text-text-muted">/</span>
        <span className="text-[13px] font-semibold text-text-primary">{floorName}</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-start sm:items-center justify-between mb-4 gap-3 flex-col sm:flex-row">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          {(Object.entries(statusColors) as [TableStatus, { stroke: string; label: string }][]).map(
            ([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-text-secondary">
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
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Agregar {isBar ? "puesto" : "mesa"}
        </button>
      </div>

      <div className="relative" style={{ height: "calc(100vh - 320px)", minHeight: 420 }}>
        <div className={`h-full ${selectedTable ? "lg:mr-[300px]" : ""} transition-all duration-300`}>
          <FloorPlanCanvas
            tables={floorTables}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={handleMove}
          />
        </div>

        {selectedTable && (
          <TablePanel
            table={selectedTable}
            floors={floors}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </>
  );
}
