"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Download, QrCode, Printer } from "lucide-react";

const tables = [
  { id: "1", name: "Mesa 1" },
  { id: "2", name: "Mesa 2" },
  { id: "3", name: "Mesa 3" },
  { id: "4", name: "Mesa 4" },
  { id: "5", name: "Mesa 5" },
  { id: "6", name: "Mesa 6" },
  { id: "7", name: "Mesa 7" },
  { id: "8", name: "Mesa 8" },
  { id: "9", name: "Mesa 9" },
  { id: "10", name: "Mesa 10" },
  { id: "11", name: "Mesa 11" },
  { id: "12", name: "Mesa 12" },
];

export default function QRPage() {
  return (
    <>
      <DashboardHeader title="Códigos QR" subtitle="Descarga e imprime los QR de cada mesa" />

      {/* Actions */}
      <div className="flex items-center gap-3 mb-8">
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)]">
          <Download className="w-4 h-4" />
          Descargar todos
        </button>
        <button className="flex items-center gap-2 bg-white border border-border-light text-text-secondary px-4 py-2 rounded-full text-[13px] font-medium hover:border-primary/30 transition-all duration-300">
          <Printer className="w-4 h-4" />
          Imprimir todos
        </button>
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-white rounded-[16px] border border-border-light p-6 flex flex-col items-center hover:border-primary/20 transition-all duration-300"
          >
            {/* QR placeholder */}
            <div className="w-36 h-36 rounded-[12px] bg-bg-warm border border-border-light flex items-center justify-center mb-4">
              <QrCode className="w-16 h-16 text-text-muted/40" strokeWidth={1} />
            </div>
            <p className="text-[15px] font-semibold text-text-primary mb-1">
              {table.name}
            </p>
            <p className="text-[12px] text-text-muted mb-4">
              ID: {table.id}
            </p>
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary-dark transition-colors">
              <Download className="w-3.5 h-3.5" />
              Descargar PNG
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
