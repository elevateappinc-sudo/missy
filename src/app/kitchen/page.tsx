"use client";

import { useState } from "react";
import { ChefHat, Clock, CheckCircle2, ArrowRight, Bell } from "lucide-react";

interface KitchenOrder {
  id: string;
  table: string;
  items: { name: string; quantity: number; notes?: string }[];
  status: "pending" | "preparing" | "ready";
  time: string;
  elapsed: number; // minutes
}

const mockOrders: KitchenOrder[] = [
  {
    id: "007",
    table: "Mesa 9",
    items: [{ name: "Limonada de Coco", quantity: 1 }],
    status: "pending",
    time: "12:42",
    elapsed: 1,
  },
  {
    id: "004",
    table: "Mesa 9",
    items: [
      { name: "Bandeja Paisa", quantity: 1 },
      { name: "Limonada de Coco", quantity: 1 },
      { name: "Tres Leches", quantity: 1 },
    ],
    status: "pending",
    time: "12:40",
    elapsed: 3,
  },
  {
    id: "002",
    table: "Mesa 3",
    items: [
      { name: "Ajiaco Santafereño", quantity: 2 },
      { name: "Empanadas (x3)", quantity: 1 },
      { name: "Patacones con Hogao", quantity: 1 },
    ],
    status: "preparing",
    time: "12:37",
    elapsed: 6,
  },
  {
    id: "005",
    table: "Mesa 12",
    items: [
      { name: "Bandeja Paisa", quantity: 2 },
      { name: "Ajiaco Santafereño", quantity: 1 },
      { name: "Empanadas (x3)", quantity: 1 },
      { name: "Tres Leches", quantity: 1 },
    ],
    status: "preparing",
    time: "12:28",
    elapsed: 15,
  },
  {
    id: "003",
    table: "Mesa 5",
    items: [{ name: "Tres Leches", quantity: 1 }],
    status: "preparing",
    time: "12:35",
    elapsed: 8,
  },
  {
    id: "001",
    table: "Mesa 7",
    items: [
      { name: "Bandeja Paisa", quantity: 1 },
      { name: "Limonada de Coco", quantity: 1 },
    ],
    status: "ready",
    time: "12:30",
    elapsed: 13,
  },
];

const columns: { key: KitchenOrder["status"]; label: string; color: string; icon: typeof Clock }[] = [
  { key: "pending", label: "Pendientes", color: "bg-warning", icon: Bell },
  { key: "preparing", label: "En preparación", color: "bg-primary", icon: Clock },
  { key: "ready", label: "Listos", color: "bg-success", icon: CheckCircle2 },
];

export default function KitchenPage() {
  const [orders, setOrders] = useState(mockOrders);

  function moveOrder(id: string) {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        if (o.status === "pending") return { ...o, status: "preparing" as const };
        if (o.status === "preparing") return { ...o, status: "ready" as const };
        return o;
      })
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ChefHat className="w-7 h-7 text-primary" />
          <h1 className="text-[22px] font-semibold text-white tracking-tight">
            Cocina — Mi Restaurante
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
              {/* Column header */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h2 className="text-[15px] font-semibold text-white/80">
                  {col.label}
                </h2>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-white/[0.06] text-white/30 text-[12px] font-medium">
                  {colOrders.length}
                </span>
              </div>

              {/* Cards */}
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
                    {/* Order header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-white">
                          {order.table}
                        </span>
                        <span className="text-[11px] font-mono text-white/25">
                          #{order.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-white/25" />
                        <span
                          className={`text-[12px] font-medium ${
                            order.elapsed >= 15 ? "text-error" : "text-white/30"
                          }`}
                        >
                          {order.elapsed} min
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-[4px] bg-white/[0.06] flex items-center justify-center text-[11px] font-bold text-white/40">
                            {item.quantity}
                          </span>
                          <span className="text-[13px] text-white/60">
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Action */}
                    {order.status !== "ready" && (
                      <button
                        onClick={() => moveOrder(order.id)}
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
