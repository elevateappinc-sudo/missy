"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Plus, QrCode, Users, Trash2 } from "lucide-react";

interface TableLocal {
  id: string;
  name: string;
  isActive: boolean;
  currentSession: boolean;
  guests: number;
}

const mockTables: TableLocal[] = [
  { id: "1", name: "Mesa 1", isActive: true, currentSession: true, guests: 4 },
  { id: "2", name: "Mesa 2", isActive: true, currentSession: false, guests: 0 },
  { id: "3", name: "Mesa 3", isActive: true, currentSession: true, guests: 2 },
  { id: "4", name: "Mesa 4", isActive: true, currentSession: false, guests: 0 },
  { id: "5", name: "Mesa 5", isActive: true, currentSession: true, guests: 6 },
  { id: "6", name: "Mesa 6", isActive: false, currentSession: false, guests: 0 },
  { id: "7", name: "Mesa 7", isActive: true, currentSession: true, guests: 3 },
  { id: "8", name: "Mesa 8", isActive: true, currentSession: false, guests: 0 },
  { id: "9", name: "Mesa 9", isActive: true, currentSession: true, guests: 2 },
  { id: "10", name: "Mesa 10", isActive: false, currentSession: false, guests: 0 },
  { id: "11", name: "Mesa 11", isActive: true, currentSession: false, guests: 0 },
  { id: "12", name: "Mesa 12", isActive: true, currentSession: true, guests: 5 },
];

export default function TablesPage() {
  const [tables] = useState(mockTables);

  const active = tables.filter((t) => t.currentSession).length;
  const total = tables.filter((t) => t.isActive).length;

  return (
    <>
      <DashboardHeader title="Mesas" subtitle="Administra las mesas y sus códigos QR" />

      {/* Summary */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2 text-[14px]">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{active}</span> mesas ocupadas
          </span>
        </div>
        <div className="flex items-center gap-2 text-[14px]">
          <span className="w-2.5 h-2.5 rounded-full bg-border-light" />
          <span className="text-text-secondary">
            <span className="font-semibold text-text-primary">{total - active}</span> mesas libres
          </span>
        </div>
        <div className="ml-auto">
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]">
            <Plus className="w-4 h-4" />
            Agregar mesa
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`relative bg-white rounded-[16px] border p-5 transition-all duration-300 ${
              !table.isActive
                ? "border-border-light opacity-50"
                : table.currentSession
                ? "border-primary/30 shadow-[0_2px_12px_rgba(168,85,247,0.08)]"
                : "border-border-light hover:border-primary/20"
            }`}
          >
            {/* Status dot */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-semibold text-text-primary">
                {table.name}
              </h3>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  table.currentSession
                    ? "bg-success"
                    : table.isActive
                    ? "bg-border-light"
                    : "bg-error/50"
                }`}
              />
            </div>

            {/* Info */}
            {table.currentSession ? (
              <div className="flex items-center gap-1.5 text-[13px] text-text-secondary mb-4">
                <Users className="w-3.5 h-3.5" />
                {table.guests} comensales
              </div>
            ) : (
              <p className="text-[13px] text-text-muted mb-4">
                {table.isActive ? "Disponible" : "Inactiva"}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] bg-primary/8 text-primary text-[12px] font-medium hover:bg-primary/15 transition-colors">
                <QrCode className="w-3.5 h-3.5" />
                QR
              </button>
              <button className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
