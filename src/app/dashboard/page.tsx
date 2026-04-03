"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
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

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  return `Hace ${Math.floor(diff / 60)}h`;
}

interface Stats {
  ordersToday: number;
  activeTables: number;
  totalTables: number;
  menuItems: number;
  revenueToday: number;
}

interface RecentOrder {
  id: string;
  table_name: string;
  item_count: number;
  total: number;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [stats, setStats] = useState<Stats>({ ordersToday: 0, activeTables: 0, totalTables: 0, menuItems: 0, revenueToday: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  const loadData = useCallback(async () => {
    if (!restaurant) return;
    const rid = restaurant.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayISO = todayStart.toISOString();

    const [ordersRes, tablesRes, activeTablesRes, menuRes, recentRes] = await Promise.all([
      supabase.from("orders").select("total").eq("restaurant_id", rid).gte("created_at", todayISO),
      supabase.from("tables").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
      supabase.from("tables").select("id", { count: "exact", head: true }).eq("restaurant_id", rid).neq("status", "empty"),
      supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("restaurant_id", rid),
      supabase
        .from("orders")
        .select("id, status, total, created_at, tables(name), order_items(id)")
        .eq("restaurant_id", rid)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const orders = ordersRes.data ?? [];
    const revenue = orders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

    setStats({
      ordersToday: orders.length,
      activeTables: activeTablesRes.count ?? 0,
      totalTables: tablesRes.count ?? 0,
      menuItems: menuRes.count ?? 0,
      revenueToday: revenue,
    });

    setRecentOrders(
      (recentRes.data ?? []).map((o: any) => ({
        id: o.id,
        table_name: o.tables?.name ?? "Sin mesa",
        item_count: o.order_items?.length ?? 0,
        total: Number(o.total) || 0,
        status: o.status,
        created_at: o.created_at,
      }))
    );
  }, [restaurant, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime
  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant, supabase, loadData]);

  const statCards = [
    { label: "Pedidos hoy", value: String(stats.ordersToday), icon: ClipboardList },
    { label: "Mesas activas", value: `${stats.activeTables} / ${stats.totalTables}`, icon: Grid3X3 },
    { label: "Platos en menú", value: String(stats.menuItems), icon: UtensilsCrossed },
    { label: "Ingreso del día", value: formatPrice(stats.revenueToday), icon: TrendingUp },
  ];

  return (
    <>
      <DashboardHeader title="Dashboard" subtitle="Resumen de tu restaurante hoy" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-[16px] border border-border-light">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[10px] bg-primary/8 flex items-center justify-center">
                <stat.icon className="w-[18px] h-[18px] text-primary" />
              </div>
            </div>
            <p className="text-[22px] font-semibold text-text-primary tracking-tight">{stat.value}</p>
            <p className="text-[13px] text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-[16px] border border-border-light">
        <div className="px-6 py-5 border-b border-border-light flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">Pedidos recientes</h2>
          <a href="/dashboard/orders" className="text-[13px] text-primary font-medium hover:text-primary-dark transition-colors">
            Ver todos
          </a>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-12 text-center text-text-muted text-[14px]">
            Aún no hay pedidos hoy
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {recentOrders.map((order) => {
              const status = statusMap[order.status] ?? statusMap.pending;
              return (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-bg-warm/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-mono text-text-muted">#{order.id.slice(0, 6)}</span>
                    <span className="text-[14px] font-medium text-text-primary">{order.table_name}</span>
                    <span className="text-[13px] text-text-muted">{order.item_count} items</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] text-text-muted">{timeAgo(order.created_at)}</span>
                    <span className="text-[14px] font-medium text-text-primary">{formatPrice(order.total)}</span>
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
