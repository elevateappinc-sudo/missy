"use client";

import { useState, useEffect, useCallback } from "react";
import { ChefHat, Clock, CheckCircle2, ArrowRight, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

interface KitchenOrder {
  id: string;
  table: string;
  items: { name: string; quantity: number; notes?: string }[];
  status: "pending" | "preparing" | "ready";
  created_at: string;
  elapsed: number;
}

const columns: { key: KitchenOrder["status"]; label: string; color: string; icon: typeof Clock }[] = [
  { key: "pending", label: "Pendientes", color: "bg-warning", icon: Bell },
  { key: "preparing", label: "En preparación", color: "bg-primary", icon: Clock },
  { key: "ready", label: "Listos", color: "bg-success", icon: CheckCircle2 },
];

export default function KitchenPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [now, setNow] = useState(Date.now());

  const loadOrders = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("orders")
      .select("id, status, created_at, tables(name), order_items(quantity, notes, menu_items(name))")
      .eq("restaurant_id", restaurant.id)
      .in("status", ["pending", "confirmed", "preparing", "ready"])
      .order("created_at");

    setOrders(
      (data ?? []).map((o: any) => ({
        id: o.id,
        table: o.tables?.name ?? "Sin mesa",
        items: (o.order_items ?? []).map((i: any) => ({
          name: i.menu_items?.name ?? "Item",
          quantity: i.quantity,
          notes: i.notes,
        })),
        status: o.status === "confirmed" ? "pending" : o.status,
        created_at: o.created_at,
        elapsed: Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000),
      }))
    );
  }, [restaurant, supabase]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Realtime
  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadOrders()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant, supabase, loadOrders]);

  // Update elapsed timer every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      setOrders((prev) =>
        prev.map((o) => ({
          ...o,
          elapsed: Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000),
        }))
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function moveOrder(id: string, currentStatus: string) {
    const nextStatus = currentStatus === "pending" ? "preparing" : "ready";
    await supabase.from("orders").update({ status: nextStatus }).eq("id", id);
    loadOrders();
  }

  return (
    <div className="min-h-screen bg-bg-dark p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-primary" />
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Cocina — {restaurant?.name ?? "Cargando..."}
          </h1>
        </div>
        <div className="flex items-center gap-2 text-white/30 text-[13px]">
          <Clock className="w-4 h-4" />
          <span>Actualizado en tiempo real</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-5 h-[calc(100vh-120px)]">
        {columns.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div key={col.key} className="flex flex-col">
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h2 className="text-[15px] font-semibold text-white/80">{col.label}</h2>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 text-[12px] font-medium">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-[14px] border p-4 transition-all duration-300 ${
                      order.elapsed >= 15
                        ? "bg-error/5 border-error/20"
                        : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-white">{order.table}</span>
                        <span className="text-[11px] font-mono text-white/25">#{order.id.slice(0, 6)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/25" />
                        <span className={`text-[12px] font-medium ${order.elapsed >= 15 ? "text-error" : "text-white/30"}`}>
                          {order.elapsed} min
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-[4px] bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40">
                            {item.quantity}
                          </span>
                          <span className="text-[13px] text-white/60">{item.name}</span>
                          {item.notes && (
                            <span className="text-[11px] text-warning/60 italic">({item.notes})</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.status !== "ready" && (
                      <button
                        onClick={() => moveOrder(order.id, order.status)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all duration-200 ${
                          order.status === "pending"
                            ? "bg-primary/15 text-primary hover:bg-primary/25"
                            : "bg-success/15 text-success hover:bg-success/25"
                        }`}
                      >
                        {order.status === "pending" ? "Empezar a preparar" : "Marcar como listo"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {order.status === "ready" && (
                      <div className="flex items-center justify-center gap-1.5 py-2 text-[12px] font-medium text-success/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Listo para entregar
                      </div>
                    )}
                  </div>
                ))}

                {colOrders.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-white/15 text-[13px]">
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
