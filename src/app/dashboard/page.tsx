import { DashboardHeader } from "@/components/layout/dashboard-header";
import {
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    label: "Pedidos hoy",
    value: "48",
    change: "+12%",
    trend: "up" as const,
    icon: ClipboardList,
  },
  {
    label: "Mesas activas",
    value: "6 / 12",
    change: "50%",
    trend: "up" as const,
    icon: Grid3X3,
  },
  {
    label: "Platos en menú",
    value: "32",
    change: "+3",
    trend: "up" as const,
    icon: UtensilsCrossed,
  },
  {
    label: "Ingreso del día",
    value: "$1.240.000",
    change: "+8%",
    trend: "up" as const,
    icon: TrendingUp,
  },
];

const recentOrders = [
  { id: "001", table: "Mesa 3", items: 4, total: "$86.000", status: "preparing", time: "Hace 5 min" },
  { id: "002", table: "Mesa 7", items: 2, total: "$42.000", status: "ready", time: "Hace 12 min" },
  { id: "003", table: "Mesa 1", items: 6, total: "$128.000", status: "delivered", time: "Hace 20 min" },
  { id: "004", table: "Mesa 9", items: 3, total: "$65.000", status: "pending", time: "Hace 2 min" },
  { id: "005", table: "Mesa 5", items: 1, total: "$18.000", status: "preparing", time: "Hace 8 min" },
];

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-warning/15 text-warning" },
  preparing: { label: "Preparando", color: "bg-primary/15 text-primary" },
  ready: { label: "Listo", color: "bg-success/15 text-success" },
  delivered: { label: "Entregado", color: "bg-text-muted/15 text-text-muted" },
};

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Dashboard"
        subtitle="Resumen de tu restaurante hoy"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-5 rounded-[16px] border border-border-light"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-[10px] bg-primary/8 flex items-center justify-center">
                <stat.icon className="w-[18px] h-[18px] text-primary" />
              </div>
              <span
                className={`flex items-center gap-0.5 text-[12px] font-semibold ${
                  stat.trend === "up" ? "text-success" : "text-error"
                }`}
              >
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {stat.change}
              </span>
            </div>
            <p className="text-[22px] font-semibold text-text-primary tracking-tight">
              {stat.value}
            </p>
            <p className="text-[13px] text-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-[16px] border border-border-light">
        <div className="px-6 py-5 border-b border-border-light flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-text-primary">
            Pedidos recientes
          </h2>
          <a
            href="/dashboard/orders"
            className="text-[13px] text-primary font-medium hover:text-primary-dark transition-colors"
          >
            Ver todos
          </a>
        </div>
        <div className="divide-y divide-border-light">
          {recentOrders.map((order) => {
            const status = statusMap[order.status];
            return (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-bg-warm/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-mono text-text-muted">
                    #{order.id}
                  </span>
                  <span className="text-[14px] font-medium text-text-primary">
                    {order.table}
                  </span>
                  <span className="text-[13px] text-text-muted">
                    {order.items} items
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-text-muted">
                    {order.time}
                  </span>
                  <span className="text-[14px] font-medium text-text-primary">
                    {order.total}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[12px] font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
