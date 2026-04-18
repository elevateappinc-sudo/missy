"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { FloorPlanCanvas } from "@/components/tables/floor-plan-canvas";
import { TablePanel } from "@/components/tables/table-panel";
import { statusColors } from "@/components/tables/table-node";
import { Plus, Layers, X, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import type { Table, TableStatus } from "@/types";

const DEFAULT_FLOORS = ["Piso 1"];

interface FloorRow {
  id: string;
  name: string;
  sort_order: number;
}

export default function TablesPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState("Piso 1");
  const [floors, setFloors] = useState<string[]>(DEFAULT_FLOORS);
  const [floorRows, setFloorRows] = useState<FloorRow[]>([]);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [editingFloor, setEditingFloor] = useState<string | null>(null);
  const [editFloorName, setEditFloorName] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFloors = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("restaurant_floors")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order")
      .order("name");
    const rows = (data as FloorRow[] | null) ?? [];
    if (rows.length === 0) {
      // Bootstrap default Piso 1 for this restaurant
      const { data: inserted } = await supabase
        .from("restaurant_floors")
        .insert({ restaurant_id: restaurant.id, name: "Piso 1", sort_order: 0 })
        .select("id, name, sort_order")
        .single();
      if (inserted) {
        setFloorRows([inserted as FloorRow]);
        setFloors([inserted.name]);
      }
      return;
    }
    setFloorRows(rows);
    setFloors(rows.map((r) => r.name));
  }, [restaurant, supabase]);

  const loadTables = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("tables")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("created_at");
    const loaded = ((data as Table[]) ?? []).map((t) => ({
      ...t,
      floor: t.floor || "Piso 1",
    }));
    setTables(loaded);
  }, [restaurant, supabase]);

  useEffect(() => {
    loadFloors();
    loadTables();
  }, [loadFloors, loadTables]);

  // Ensure activeFloor stays valid when floors change
  useEffect(() => {
    if (floors.length > 0 && !floors.includes(activeFloor)) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

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

  // Add new table to current floor
  async function addTable() {
    if (!restaurant) return;
    const floorTables = tables.filter((t) => t.floor === activeFloor);
    const num = tables.length + 1;
    const isBar = activeFloor.toLowerCase().includes("barra");
    const qrCode = `${restaurant.id}-mesa-${num}-${crypto.randomUUID().slice(0, 8)}`;
    const posX = 100 + ((floorTables.length) % 5) * 140;
    const posY = 100 + Math.floor((floorTables.length) / 5) * 140;
    const { error } = await supabase.from("tables").insert({
      name: isBar ? `Barra ${floorTables.length + 1}` : `Mesa ${num}`,
      restaurant_id: restaurant.id,
      qr_code: qrCode,
      position_x: posX,
      position_y: posY,
      width: isBar ? 140 : 100,
      height: isBar ? 80 : 100,
      shape: isBar ? "rectangle" : "square",
      capacity: isBar ? 2 : 4,
      status: "empty",
      floor: activeFloor,
    });
    if (error) {
      console.error("Error creating table:", error);
      alert(`Error al crear mesa: ${error.message}`);
      return;
    }
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

  // Floor management
  async function addFloor(name: string) {
    const trimmed = name.trim();
    if (!restaurant || !trimmed || floors.includes(trimmed)) return;
    const nextOrder = Math.max(0, ...floorRows.map((r) => r.sort_order)) + 1;
    const { data: inserted, error } = await supabase
      .from("restaurant_floors")
      .insert({ restaurant_id: restaurant.id, name: trimmed, sort_order: nextOrder })
      .select("id, name, sort_order")
      .single();
    if (error || !inserted) {
      console.error("Error creating floor:", error);
      alert(`Error al crear piso: ${error?.message ?? "desconocido"}`);
      return;
    }
    const row = inserted as FloorRow;
    setFloorRows((prev) => [...prev, row]);
    setFloors((prev) => [...prev, row.name]);
    setActiveFloor(row.name);
    setNewFloorName("");
    setShowFloorModal(false);
  }

  async function renameFloor(oldName: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingFloor(null);
      return;
    }
    if (floors.includes(trimmed)) {
      alert("Ya existe un piso con ese nombre.");
      setEditingFloor(null);
      return;
    }
    const row = floorRows.find((r) => r.name === oldName);
    if (row) {
      const { error } = await supabase
        .from("restaurant_floors")
        .update({ name: trimmed })
        .eq("id", row.id);
      if (error) {
        console.error("Error renaming floor:", error);
        alert(`Error al renombrar piso: ${error.message}`);
        return;
      }
      setFloorRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: trimmed } : r)));
    }
    // Update all tables on this floor
    const tablesToUpdate = tables.filter((t) => t.floor === oldName);
    for (const t of tablesToUpdate) {
      await supabase.from("tables").update({ floor: trimmed }).eq("id", t.id);
    }
    setFloors((prev) => prev.map((f) => (f === oldName ? trimmed : f)));
    if (activeFloor === oldName) setActiveFloor(trimmed);
    setEditingFloor(null);
    loadTables();
  }

  async function deleteFloor(name: string) {
    const floorTables = tables.filter((t) => t.floor === name);
    if (floorTables.length > 0) {
      alert("No puedes eliminar un piso que tiene mesas. Elimina o mueve las mesas primero.");
      return;
    }
    if (floors.length <= 1) {
      alert("Debe existir al menos un piso.");
      return;
    }
    const row = floorRows.find((r) => r.name === name);
    if (row) {
      const { error } = await supabase.from("restaurant_floors").delete().eq("id", row.id);
      if (error) {
        console.error("Error deleting floor:", error);
        alert(`Error al eliminar piso: ${error.message}`);
        return;
      }
      setFloorRows((prev) => prev.filter((r) => r.id !== row.id));
    }
    setFloors((prev) => prev.filter((f) => f !== name));
    if (activeFloor === name) {
      setActiveFloor(floors.find((f) => f !== name) ?? "Piso 1");
    }
  }

  const selectedTable = tables.find((t) => t.id === selectedId) ?? null;
  const floorTables = tables.filter((t) => t.floor === activeFloor);

  // Status counts for current floor
  const statusCounts = floorTables.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <DashboardHeader title="Mesas" subtitle="Mapa interactivo del restaurante" />

      {/* Floor tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-text-muted" />
        <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => { setActiveFloor(floor); setSelectedId(null); }}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition-all shrink-0 ${
                activeFloor === floor
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-border-light text-text-secondary hover:border-primary/30"
              }`}
            >
              {floor}
              <span className="ml-1 opacity-60">{tables.filter((t) => t.floor === floor).length}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowFloorModal(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[12px] font-medium bg-bg-warm text-text-secondary hover:bg-bg-warm/80 border border-border-light transition-all shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Piso
        </button>
      </div>

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
          Agregar {activeFloor.toLowerCase().includes("barra") ? "puesto" : "mesa"}
        </button>
      </div>

      {/* Canvas + Panel */}
      <div className="relative" style={{ height: "calc(100vh - 280px)" }}>
        <div className={`h-full ${selectedTable ? "mr-[300px]" : ""} transition-all duration-300`}>
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

      {/* Floor Management Modal */}
      {showFloorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[16px] border border-border-light w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-semibold text-text-primary">Gestionar pisos</h3>
              <button onClick={() => setShowFloorModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current floors */}
            <div className="mb-6">
              <p className="text-[13px] font-medium text-text-primary mb-2">Pisos actuales</p>
              <div className="space-y-2">
                {floors.map((floor) => (
                  <div key={floor} className="flex items-center justify-between px-3 py-2.5 rounded-[10px] bg-bg-warm">
                    {editingFloor === floor ? (
                      <input
                        autoFocus
                        value={editFloorName}
                        onChange={(e) => setEditFloorName(e.target.value)}
                        onBlur={() => renameFloor(floor, editFloorName)}
                        onKeyDown={(e) => { if (e.key === "Enter") renameFloor(floor, editFloorName); }}
                        className="flex-1 px-2 py-1 rounded-[6px] border border-primary/30 bg-white text-[14px] text-text-primary focus:outline-none"
                      />
                    ) : (
                      <span className="text-[14px] text-text-primary">{floor}</span>
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] text-text-muted mr-2">
                        {tables.filter((t) => t.floor === floor).length} mesas
                      </span>
                      <button
                        onClick={() => { setEditingFloor(floor); setEditFloorName(floor); }}
                        className="w-7 h-7 rounded-[6px] flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFloor(floor)}
                        className="w-7 h-7 rounded-[6px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick add suggestions */}
            <div className="mb-4">
              <p className="text-[13px] font-medium text-text-primary mb-2">Agregar rápido</p>
              <div className="flex flex-wrap gap-2">
                {["Piso 2", "Piso 3", "Piso 4", "Terraza", "Barra", "VIP", "Exterior"].filter(
                  (s) => !floors.includes(s)
                ).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => addFloor(suggestion)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-all"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom floor */}
            <form
              onSubmit={(e) => { e.preventDefault(); addFloor(newFloorName); }}
              className="flex gap-2"
            >
              <input
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="Nombre personalizado"
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
      )}
    </>
  );
}
