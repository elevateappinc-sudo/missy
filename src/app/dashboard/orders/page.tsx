"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  ArrowRight,
  Users,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  name: string;
}

interface OrderRow {
  id: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  created_at: string;
  table_id: string;
  table_name: string;
  table_floor: string;
  session_id: string | null;
  items: OrderItem[];
}

interface TableGroup {
  table_id: string;
  table_name: string;
  table_floor: string;
  orders: OrderRow[];
  total: number;
  comensales: number;
  earliest: string;
}

const COLUMNS: {
  key: OrderStatus | "pending_all";
  label: string;
  accent: string;
  bg: string;
  icon: typeof Clock;
  statuses: OrderStatus[];
  nextStatus?: OrderStatus;
  nextLabel?: string;
}[] = [
  {
    key: "pending_all",
    label: "Nuevos",
    accent: "text-warning",
    bg: "bg-warning/10 border-warning/20",
    icon: Clock,
    statuses: ["pending", "confirmed"],
    nextStatus: "preparing",
    nextLabel: "Empezar a preparar",
  },
  {
    key: "preparing",
    label: "Preparando",
    accent: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    icon: ChefHat,
    statuses: ["preparing"],
    nextStatus: "ready",
    nextLabel: "Marcar listo",
  },
  {
    key: "ready",
    label: "Listos para entregar",
    accent: "text-success",
    bg: "bg-success/10 border-success/20",
    icon: CheckCircle2,
    statuses: ["ready"],
    nextStatus: "delivered",
    nextLabel: "Entregado",
  },
  {
    key: "delivered",
    label: "Entregados (hoy)",
    accent: "text-text-muted",
    bg: "bg-bg-warm border-border-light",
    icon: PackageCheck,
    statuses: ["delivered"],
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(price);
}

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

export default function OrdersPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!restaurant) return;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        id, status, total, notes, created_at, table_id, session_id,
        tables(id, name, floor),
        order_items(id, quantity, unit_price, menu_items(name))
      `)
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      console.error("Load orders error:", error);
    }

    // Keep delivered orders only from last 24h so column stays focused
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = ((data ?? []) as any[]).filter((o) => {
      if (o.status !== "delivered") return true;
      return new Date(o.created_at).getTime() >= cutoff;
    });

    const rows: OrderRow[] = filtered.map((o) => ({
      id: o.id,
      status: o.status as OrderStatus,
      total: Number(o.total),
      notes: o.notes,
      created_at: o.created_at,
      table_id: o.table_id,
      table_name: o.tables?.name ?? "Sin mesa",
      table_floor: o.tables?.floor ?? "",
      session_id: o.session_id,
      items: (o.order_items ?? []).map((oi: any) => ({
        id: oi.id,
        quantity: oi.quantity,
        unit_price: Number(oi.unit_price),
        name: oi.menu_items?.name ?? "Item",
      })),
    }));

    setOrders(rows);
    setLoading(false);
  }, [restaurant, supabase]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Realtime subscription
  useEffect(() => {
    if (!restaurant) return;
    const channel = supabase
      .channel("orders-kanban")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        () => loadOrders()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items" },
        () => loadOrders()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant, supabase, loadOrders]);

  async function advanceOrder(orderId: string, nextStatus: OrderStatus) {
    // Optimistic update
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
    const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", orderId);
    if (error) {
      console.error("Advance order error:", error);
      loadOrders();
    }
  }

  async function advanceTableGroup(group: TableGroup, nextStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (group.orders.some((go) => go.id === o.id) ? { ...o, status: nextStatus } : o))
    );
    await Promise.all(
      group.orders.map((o) => supabase.from("orders").update({ status: nextStatus }).eq("id", o.id))
    );
  }

  function groupByTable(ordersForCol: OrderRow[]): TableGroup[] {
    const map = new Map<string, TableGroup>();
    for (const o of ordersForCol) {
      const existing = map.get(o.table_id);
      if (existing) {
        existing.orders.push(o);
        existing.total += o.total;
        if (o.created_at < existing.earliest) existing.earliest = o.created_at;
      } else {
        map.set(o.table_id, {
          table_id: o.table_id,
          table_name: o.table_name,
          table_floor: o.table_floor,
          orders: [o],
          total: o.total,
          comensales: 0,
          earliest: o.created_at,
        });
      }
    }
    const groups = Array.from(map.values());
    for (const g of groups) {
      const sessions = new Set(g.orders.map((o) => o.session_id ?? o.id));
      g.comensales = sessions.size;
      g.orders.sort((a, b) => a.created_at.localeCompare(b.created_at));
    }
    return groups.sort((a, b) => a.earliest.localeCompare(b.earliest));
  }

  const columns = useMemo(() => {
    return COLUMNS.map((col) => {
      const rows = orders.filter((o) => col.statuses.includes(o.status));
      return { ...col, groups: groupByTable(rows), total: rows.length };
    });
  }, [orders]);

  const totalActive = columns.slice(0, 3).reduce((sum, c) => sum + c.total, 0);

  return (
    <>
      <DashboardHeader title="Pedidos" subtitle="Gestiona los pedidos en tiempo real" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {columns.map((col) => (
          <div key={col.key} className={`rounded-[14px] border p-3 sm:p-4 ${col.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <col.icon className={`w-4 h-4 ${col.accent}`} />
              <p className="text-[11px] sm:text-[12px] font-medium text-text-secondary uppercase tracking-wider">
                {col.label}
              </p>
            </div>
            <p className="text-[22px] sm:text-[24px] font-semibold text-text-primary leading-tight">{col.total}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : totalActive === 0 && columns[3].total === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <col.icon className={`w-4 h-4 ${col.accent}`} />
                  <h3 className="text-[13px] font-semibold text-text-primary">{col.label}</h3>
                </div>
                <span className="text-[11px] font-semibold text-text-muted bg-white px-2 py-0.5 rounded-full border border-border-light">
                  {col.total}
                </span>
              </div>

              <div className="flex flex-col gap-3 min-h-[80px]">
                {col.groups.length === 0 ? (
                  <div className="py-8 text-center text-[12px] text-text-muted border-2 border-dashed border-border-light rounded-[14px]">
                    Sin pedidos
                  </div>
                ) : (
                  col.groups.map((group) => (
                    <TableCard
                      key={`${col.key}-${group.table_id}`}
                      group={group}
                      nextStatus={col.nextStatus}
                      nextLabel={col.nextLabel}
                      onAdvanceOrder={advanceOrder}
                      onAdvanceAll={() => col.nextStatus && advanceTableGroup(group, col.nextStatus)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-[16px] border border-border-light py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Receipt className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-[16px] font-semibold text-text-primary mb-1">Aún no hay pedidos</h3>
      <p className="text-[13px] text-text-secondary">
        Cuando un cliente escanee un QR y haga un pedido aparecerá aquí en tiempo real.
      </p>
    </div>
  );
}

function TableCard({
  group,
  nextStatus,
  nextLabel,
  onAdvanceOrder,
  onAdvanceAll,
}: {
  group: TableGroup;
  nextStatus?: OrderStatus;
  nextLabel?: string;
  onAdvanceOrder: (orderId: string, next: OrderStatus) => void;
  onAdvanceAll: () => void;
}) {
  // Flatten items for the quick view (count by name across all comensales)
  const aggregateMap = new Map<string, number>();
  for (const o of group.orders) {
    for (const item of o.items) {
      aggregateMap.set(item.name, (aggregateMap.get(item.name) || 0) + item.quantity);
    }
  }

  return (
    <div className="bg-white rounded-[14px] border border-border-light p-4 hover:border-primary/30 transition-all duration-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[15px] font-semibold text-text-primary truncate">{group.table_name}</h4>
            {group.table_floor && (
              <span className="text-[10px] text-text-muted bg-bg-warm px-1.5 py-0.5 rounded">
                {group.table_floor}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted">
            <Users className="w-3 h-3" />
            {group.comensales} {group.comensales === 1 ? "comensal" : "comensales"}
            <span>·</span>
            <span>{timeAgo(group.earliest)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[14px] font-semibold text-text-primary">{formatPrice(group.total)}</p>
          <p className="text-[10px] text-text-muted">
            {group.orders.length} {group.orders.length === 1 ? "orden" : "órdenes"}
          </p>
        </div>
      </div>

      {/* Per-comensal breakdown */}
      <div className="space-y-2 mb-3">
        {group.orders.map((order, idx) => (
          <div key={order.id} className="bg-bg-warm/50 rounded-[10px] p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                Comensal {idx + 1}
              </span>
              <span className="text-[10px] text-text-muted font-mono">#{order.id.slice(0, 4)}</span>
            </div>
            <ul className="space-y-0.5 mb-1">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-[12px]">
                  <span className="text-text-primary truncate pr-2">
                    <span className="font-semibold text-primary mr-1">{item.quantity}×</span>
                    {item.name}
                  </span>
                  <span className="text-text-muted shrink-0">
                    {formatPrice(item.unit_price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            {nextStatus && (
              <button
                onClick={() => onAdvanceOrder(order.id, nextStatus)}
                className="text-[10px] text-primary hover:text-primary-dark font-medium mt-1"
              >
                → Avanzar solo este
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Action */}
      {nextStatus && nextLabel ? (
        <button
          onClick={onAdvanceAll}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-full text-[12px] font-semibold hover:bg-primary-dark transition-all"
        >
          {nextLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted py-1">
          <RotateCcw className="w-3 h-3" />
          Mesa cerrada
        </div>
      )}
    </div>
  );
}
