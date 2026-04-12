"use client";

import { X, Trash2 } from "lucide-react";
import type { Table, TableShape, TableStatus } from "@/types";
import { statusColors } from "./table-node";

interface TablePanelProps {
  table: Table;
  floors: string[];
  onUpdate: (id: string, updates: Partial<Table>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const shapes: { value: TableShape; label: string }[] = [
  { value: "square", label: "Cuadrada" },
  { value: "round", label: "Redonda" },
  { value: "rectangle", label: "Rectangular" },
];

export function TablePanel({ table, floors, onUpdate, onDelete, onClose }: TablePanelProps) {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-white border-l border-border-light p-6 overflow-y-auto z-10 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[16px] font-semibold text-text-primary">Propiedades</h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-warm transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Nombre</label>
          <input
            type="text"
            value={table.name}
            onChange={(e) => onUpdate(table.id, { name: e.target.value })}
            className="w-full px-3 py-2 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Floor */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Piso / Zona</label>
          <select
            value={table.floor}
            onChange={(e) => onUpdate(table.id, { floor: e.target.value })}
            className="w-full px-3 py-2 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          >
            {floors.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Capacidad</label>
          <input
            type="number"
            min={1}
            max={20}
            value={table.capacity}
            onChange={(e) => onUpdate(table.id, { capacity: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Shape */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-2">Forma</label>
          <div className="grid grid-cols-3 gap-2">
            {shapes.map((s) => (
              <button
                key={s.value}
                onClick={() => onUpdate(table.id, { shape: s.value })}
                className={`py-2 rounded-[8px] text-[12px] font-medium transition-all ${
                  table.shape === s.value
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-bg-warm text-text-secondary border border-border-light hover:border-primary/20"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-1.5">Tamaño</label>
          <input
            type="range"
            min={60}
            max={180}
            value={table.width}
            onChange={(e) => {
              const size = parseInt(e.target.value);
              onUpdate(table.id, { width: size, height: size });
            }}
            className="w-full accent-primary"
          />
          <p className="text-[12px] text-text-muted mt-1">{table.width}px</p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-[13px] font-medium text-text-primary mb-2">Estado</label>
          <div className="space-y-1.5">
            {(Object.entries(statusColors) as [TableStatus, { stroke: string; label: string }][]).map(
              ([key, val]) => (
                <button
                  key={key}
                  onClick={() => onUpdate(table.id, { status: key })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] transition-all ${
                    table.status === key
                      ? "bg-bg-warm border border-primary/20 font-medium text-text-primary"
                      : "text-text-secondary hover:bg-bg-warm/50"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: val.stroke }}
                  />
                  {val.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => {
            if (confirm("¿Eliminar esta mesa?")) onDelete(table.id);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[13px] font-medium text-error border border-error/20 hover:bg-error/5 transition-all mt-4"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar mesa
        </button>
      </div>
    </div>
  );
}
