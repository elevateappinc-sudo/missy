"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-warning/15 text-warning" },
  confirmed: { label: "Confirmado", color: "bg-primary/15 text-primary" },
  preparing: { label: "Preparando", color: "bg-primary/15 text-primary" },
  ready: { label: "Listo", color: "bg-success/15 text-success" },
  delivered: { label: "Entregado", color: "bg-text-muted/15 text-text-muted" },
};

const tabs = ["Todos", "Pendiente", "Preparando", "Listo", "Entregado"];
const tabStatusMap: Record<string, string> = {
  Pendiente: "pending", Preparando: "preparing", Listo: "ready", Entregado: "delivered",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  return `Hace ${Math.floor(diff / 60)}h`;
}

export default function OrdersPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Todos");

  const loadOrders = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, notes, created_at, tables(name), order_items(id)")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setOrders(
      (data ?? []).map((o: any) => ({
        ...o,
        table_name: o.tables?.name ?? "Sin mesa",
        item_count: o.order_items?.length ?? 0,
      }))
    );
  }, [restaurant, supabase]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Realtime
  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => {
        loadOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant, supabase, loadOrders]);

  const filtered = activeTab === "Todos"
    ? orders
    : orders.filter((o: any) => o.status === tabStatusMap[activeTab]);

  return (
    <>
      <DashboardHeader title="Pedidos" subtitle="Gestiona los pedidos en tiempo real" />

      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 ${
              activeTab === tab
                ? "bg-primary text-white"
                : "bg-white border border-border-light text-text-secondary hover:border-primary/30"
            }`}
          >
            {tab}
            {tab !== "Todos" && (
              <span className="ml-1.5 opacity-60">
                {orders.filter((o: any) => o.status === tabStatusMap[tab]).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-border-light py-16 text-center">
          <p className="text-text-muted text-[14px]">
            {orders.length === 0 ? "Aún no hay pedidos" : "Sin pedidos en este estado"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order: any) => {
            const status = statusMap[order.status] ?? statusMap.pending;
            return (
              <div
                key={order.id}
                className="bg-white rounded-[16px] border border-border-light p-5 flex items-center justify-between hover:border-primary/20 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold text-text-primary">{order.table_name}</span>
                    <span className="text-[12px] font-mono text-text-muted">#{order.id.slice(0, 6)}</span>
                  </div>
                  <p className="text-[13px] text-text-secondary">{order.item_count} items</p>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-[13px] text-text-muted">{timeAgo(order.created_at)}</span>
                  <span className="text-[15px] font-semibold text-text-primary min-w-[90px] text-right">
                    {formatPrice(order.total)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[12px] font-medium min-w-[100px] text-center ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
