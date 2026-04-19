"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Plus, Layers, Pencil, Trash2, ChevronRight, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Table, TableStatus } from "@/types";

interface FloorRow {
  id: string;
  name: string;
  sort_order: number;
}

interface FloorSummary {
  name: string;
  total: number;
  capacity: number;
  counts: Partial<Record<TableStatus, number>>;
}

const SUGGESTED = ["Piso 2", "Piso 3", "Terraza", "Barra", "VIP", "Exterior"];

export default function TablesFloorsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { user } = useSession();
  const { restaurant, loading: restaurantLoading } = useRestaurant(user?.id);
  const [tables, setTables] = useState<Table[]>([]);
  const [floorRows, setFloorRows] = useState<FloorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingFloor, setEditingFloor] = useState<string | null>(null);
  const [editFloorName, setEditFloorName] = useState("");
  const [floorToDelete, setFloorToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFloors = useCallback(async () => {
    if (!restaurant) {
      setFloorRows([]);
      return;
    }
    const { data } = await supabase
      .from("restaurant_floors")
      .select("id, name, sort_order")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order")
      .order("name");
    const rows = (data as FloorRow[] | null) ?? [];
    if (rows.length === 0) {
      const { data: inserted } = await supabase
        .from("restaurant_floors")
        .insert({ restaurant_id: restaurant.id, name: "Piso 1", sort_order: 0 })
        .select("id, name, sort_order")
        .single();
      if (inserted) setFloorRows([inserted as FloorRow]);
    } else {
      setFloorRows(rows);
    }
  }, [restaurant, supabase]);

  const loadTables = useCallback(async () => {
    if (!restaurant) {
      setTables([]);
      setLoading(false);
      return;
    }
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
    setLoading(false);
  }, [restaurant, supabase]);

  useEffect(() => {
    loadFloors();
    loadTables();
  }, [loadFloors, loadTables]);

  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("floors-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables", filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadTables()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant, supabase, loadTables]);

  // Build per-floor stats. floorRows is the source of truth for which floors
  // exist; tables provide counts/capacity. Floors without tables still show.
  const tableStats = tables.reduce<Record<string, Omit<FloorSummary, "name">>>((acc, t) => {
    const f = t.floor || "Piso 1";
    if (!acc[f]) acc[f] = { total: 0, capacity: 0, counts: {} };
    acc[f].total += 1;
    acc[f].capacity += t.capacity;
    acc[f].counts[t.status] = (acc[f].counts[t.status] || 0) + 1;
    return acc;
  }, {});

  const floors: FloorSummary[] = floorRows.map((r) => ({
    name: r.name,
    total: tableStats[r.name]?.total ?? 0,
    capacity: tableStats[r.name]?.capacity ?? 0,
    counts: tableStats[r.name]?.counts ?? {},
  }));

  const floorNames = new Set(floorRows.map((r) => r.name));

  async function createFloor(name: string) {
    if (!restaurant || !name.trim()) return;
    const clean = name.trim();
    if (floorNames.has(clean)) {
      alert("Ya existe un piso con ese nombre.");
      return;
    }
    setCreating(true);
    const nextOrder = Math.max(0, ...floorRows.map((r) => r.sort_order)) + 1;
    const { data: inserted, error } = await supabase
      .from("restaurant_floors")
      .insert({ restaurant_id: restaurant.id, name: clean, sort_order: nextOrder })
      .select("id, name, sort_order")
      .single();
    setCreating(false);
    if (error || !inserted) {
      alert(`Error al crear piso: ${error?.message ?? "desconocido"}`);
      return;
    }
    setFloorRows((prev) => [...prev, inserted as FloorRow]);
    setNewFloorName("");
    setShowModal(false);
    router.push(`/dashboard/tables/${encodeURIComponent(clean)}`);
  }

  async function renameFloor(oldName: string, newName: string) {
    if (editingFloor !== oldName) return; // Prevent double-invocation (Enter + onBlur)
    const clean = newName.trim();
    setEditingFloor(null);
    if (!clean || clean === oldName) return;
    if (floorNames.has(clean)) {
      alert("Ya existe un piso con ese nombre.");
      return;
    }
    if (!restaurant) return;
    const row = floorRows.find((r) => r.name === oldName);
    if (!row) return;
    const { error: renameErr } = await supabase
      .from("restaurant_floors")
      .update({ name: clean })
      .eq("id", row.id);
    if (renameErr) {
      alert(`Error al renombrar piso: ${renameErr.message}`);
      return;
    }
    await supabase
      .from("tables")
      .update({ floor: clean })
      .eq("restaurant_id", restaurant.id)
      .eq("floor", oldName);
    setFloorRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, name: clean } : r)));
    loadTables();
  }

  async function confirmDeleteFloor() {
    if (!floorToDelete || !restaurant) return;
    if (floorRows.length <= 1) {
      alert("Debe existir al menos un piso.");
      setFloorToDelete(null);
      return;
    }
    setDeleting(true);
    const row = floorRows.find((r) => r.name === floorToDelete);
    await supabase
      .from("tables")
      .delete()
      .eq("restaurant_id", restaurant.id)
      .eq("floor", floorToDelete);
    if (row) {
      await supabase.from("restaurant_floors").delete().eq("id", row.id);
      setFloorRows((prev) => prev.filter((r) => r.id !== row.id));
    }
    setDeleting(false);
    setFloorToDelete(null);
    loadTables();
  }

  const floorToDeleteCount = floorToDelete
    ? tables.filter((t) => t.floor === floorToDelete).length
    : 0;

  return (
    <>
      <DashboardHeader title="Mesas" subtitle="Organiza tus mesas por piso" />

      <div className="flex items-center justify-between mb-6 gap-2">
        <div className="flex items-center gap-2 text-text-secondary text-[13px]">
          <Layers className="w-4 h-4" />
          {floors.length} {floors.length === 1 ? "piso" : "pisos"}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]"
        >
          <Plus className="w-4 h-4" />
          Agregar piso
        </button>
      </div>

      {restaurantLoading || loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !restaurant ? (
        <div className="bg-white rounded-[16px] border border-border-light py-12 sm:py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-warning" />
          </div>
          <h3 className="text-[16px] font-semibold text-text-primary mb-1">
            No encontramos tu restaurante
          </h3>
          <p className="text-[13px] text-text-secondary max-w-sm mx-auto">
            Esta cuenta no está vinculada a ningún restaurante. Puede que hayas iniciado sesión con un correo distinto al que usaste para registrarte, o que tu invitación no se haya aceptado. Vuelve a iniciar sesión con el correo correcto.
          </p>
        </div>
      ) : floors.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-border-light py-12 sm:py-16 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-[16px] font-semibold text-text-primary mb-1">Aún no hay pisos</h3>
          <p className="text-[13px] text-text-secondary mb-5">
            Crea tu primer piso para empezar a organizar las mesas.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all"
          >
            <Plus className="w-4 h-4" />
            Crear primer piso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {floors.map((floor) => (
            <div
              key={floor.name}
              className="group bg-white rounded-[16px] border border-border-light hover:border-primary/30 hover:shadow-[0_4px_24px_rgba(168,85,247,0.08)] transition-all duration-300 overflow-hidden"
            >
              <Link
                href={`/dashboard/tables/${encodeURIComponent(floor.name)}`}
                className="block p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    {editingFloor === floor.name ? (
                      <input
                        autoFocus
                        value={editFloorName}
                        onClick={(e) => e.preventDefault()}
                        onChange={(e) => setEditFloorName(e.target.value)}
                        onBlur={() => renameFloor(floor.name, editFloorName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            renameFloor(floor.name, editFloorName);
                          }
                          if (e.key === "Escape") setEditingFloor(null);
                        }}
                        className="w-full px-2 py-1 rounded-[6px] border border-primary/30 bg-white text-[16px] font-semibold text-text-primary focus:outline-none"
                      />
                    ) : (
                      <>
                        <h3 className="text-[17px] font-semibold text-text-primary truncate">{floor.name}</h3>
                        <p className="text-[12px] text-text-muted mt-0.5">
                          {floor.total} {floor.total === 1 ? "mesa" : "mesas"}
                        </p>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <StatChip color="#34d399" label="Libre" count={floor.counts.empty || 0} />
                  <StatChip color="#a855f7" label="Ocupada" count={floor.counts.occupied || 0} />
                  <StatChip color="#fbbf24" label="Ordenando" count={floor.counts.ordering || 0} />
                  <StatChip color="#f43f5e" label="Esperando" count={floor.counts.waiting || 0} />
                </div>
              </Link>

              <div className="flex items-center justify-between px-5 py-3 border-t border-border-light bg-bg-warm/40">
                <div className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Users className="w-3.5 h-3.5" />
                  {floor.capacity} puestos
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingFloor(floor.name);
                      setEditFloorName(floor.name);
                    }}
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/8 transition-all"
                    aria-label="Renombrar piso"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFloorToDelete(floor.name);
                    }}
                    className="w-7 h-7 rounded-[6px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all"
                    aria-label="Eliminar piso"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] border border-border-light w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-text-primary">Crear piso nuevo</h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-text-secondary mb-5">
              El piso quedará creado y listo para agregar mesas en su canvas.
            </p>

            <div className="mb-4">
              <p className="text-[12px] font-medium text-text-primary mb-2">Sugerencias</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.filter((s) => !floorNames.has(s)).map((s) => (
                  <button
                    key={s}
                    disabled={creating}
                    onClick={() => createFloor(s)}
                    className="px-3 py-1.5 rounded-full text-[12px] font-medium bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-all disabled:opacity-50"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createFloor(newFloorName);
              }}
              className="flex gap-2"
            >
              <input
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                placeholder="Nombre personalizado"
                disabled={creating}
                className="flex-1 px-4 py-2 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={creating || !newFloorName.trim()}
                className="px-4 py-2 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                {creating ? "Creando…" : "Crear"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!floorToDelete}
        variant="danger"
        title={`Eliminar "${floorToDelete}"`}
        description={
          floorToDeleteCount > 0
            ? `Este piso tiene ${floorToDeleteCount} ${floorToDeleteCount === 1 ? "mesa" : "mesas"}. Al continuar se eliminarán todas. Esta acción no se puede deshacer.`
            : "Esta acción no se puede deshacer."
        }
        confirmLabel="Eliminar piso"
        loading={deleting}
        onConfirm={confirmDeleteFloor}
        onCancel={() => setFloorToDelete(null)}
      />
    </>
  );
}

function StatChip({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-bg-warm/60">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-text-secondary">{label}</span>
      <span className="ml-auto font-semibold text-text-primary">{count}</span>
    </div>
  );
}
