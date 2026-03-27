"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Filter } from "lucide-react";

const allOrders = [
  { id: "001", table: "Mesa 9", items: 3, total: "$65.000", status: "pending", time: "Hace 2 min", detail: "Bandeja Paisa, Limonada, Tres Leches" },
  { id: "002", table: "Mesa 3", items: 4, total: "$86.000", status: "preparing", time: "Hace 5 min", detail: "Ajiaco x2, Empanadas, Patacones" },
  { id: "003", table: "Mesa 5", items: 1, total: "$18.000", status: "preparing", time: "Hace 8 min", detail: "Tres Leches" },
  { id: "004", table: "Mesa 7", items: 2, total: "$42.000", status: "ready", time: "Hace 12 min", detail: "Bandeja Paisa, Limonada de Coco" },
  { id: "005", table: "Mesa 12", items: 5, total: "$145.000", status: "preparing", time: "Hace 15 min", detail: "Bandeja Paisa x2, Ajiaco, Empanadas, Tres Leches" },
  { id: "006", table: "Mesa 1", items: 6, total: "$128.000", status: "delivered", time: "Hace 20 min", detail: "Menú completo para 6" },
  { id: "007", table: "Mesa 9", items: 1, total: "$8.000", status: "pending", time: "Hace 1 min", detail: "Limonada de Coco (adicional)" },
];

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendiente", color: "text-warning", bg: "bg-warning/15" },
  preparing: { label: "Preparando", color: "text-primary", bg: "bg-primary/15" },
  ready: { label: "Listo", color: "text-success", bg: "bg-success/15" },
  delivered: { label: "Entregado", color: "text-text-muted", bg: "bg-text-muted/15" },
};

const tabs = ["Todos", "Pendiente", "Preparando", "Listo", "Entregado"];
const tabStatusMap: Record<string, string> = {
  Pendiente: "pending",
  Preparando: "preparing",
  Listo: "ready",
  Entregado: "delivered",
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("Todos");

  const filtered =
    activeTab === "Todos"
      ? allOrders
      : allOrders.filter((o) => o.status === tabStatusMap[activeTab]);

  return (
    <>
      <DashboardHeader title="Pedidos" subtitle="Gestiona los pedidos de hoy en tiempo real" />

      {/* Tabs */}
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
                {allOrders.filter((o) => o.status === tabStatusMap[tab]).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((order) => {
          const status = statusMap[order.status];
          return (
            <div
              key={`${order.id}-${order.time}`}
              className="bg-white rounded-[16px] border border-border-light p-5 flex items-center justify-between hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[14px] font-semibold text-text-primary">
                      {order.table}
                    </span>
                    <span className="text-[12px] font-mono text-text-muted">
                      #{order.id}
                    </span>
                  </div>
                  <p className="text-[13px] text-text-secondary max-w-md truncate">
                    {order.detail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[13px] text-text-muted">{order.time}</span>
                <span className="text-[15px] font-semibold text-text-primary min-w-[90px] text-right">
                  {order.total}
                </span>
                <span className={`px-3 py-1 rounded-full text-[12px] font-medium min-w-[100px] text-center ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
