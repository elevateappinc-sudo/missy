"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Download, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import QRCode from "qrcode";

interface TableQR {
  id: string;
  name: string;
  dataUrl: string;
}

export default function QRPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [tables, setTables] = useState<TableQR[]>([]);

  const loadTables = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("tables")
      .select("id, name")
      .eq("restaurant_id", restaurant.id)
      .order("created_at");

    if (!data) return;

    const origin = window.location.origin;
    const tablesWithQR = await Promise.all(
      data.map(async (t: any) => {
        const url = `${origin}/mesa/${t.id}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: { dark: "#1a1127", light: "#ffffff" },
        });
        return { id: t.id, name: t.name, dataUrl };
      })
    );
    setTables(tablesWithQR);
  }, [restaurant, supabase]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  function downloadQR(table: TableQR) {
    const link = document.createElement("a");
    link.download = `QR-${table.name.replace(/\s+/g, "-")}.png`;
    link.href = table.dataUrl;
    link.click();
  }

  function downloadAll() {
    tables.forEach((t) => downloadQR(t));
  }

  function printAll() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head><title>QR Codes - ${restaurant?.name}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
          .card { text-align: center; page-break-inside: avoid; }
          img { width: 200px; height: 200px; }
          h3 { margin: 8px 0 4px; font-size: 16px; }
          p { color: #666; font-size: 12px; margin: 0; }
        </style></head>
        <body>
          <h1>${restaurant?.name} — Códigos QR</h1>
          <div class="grid">
            ${tables.map((t) => `
              <div class="card">
                <img src="${t.dataUrl}" />
                <h3>${t.name}</h3>
                <p>Escanea para ordenar</p>
              </div>
            `).join("")}
          </div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <>
      <DashboardHeader title="Códigos QR" subtitle="Descarga e imprime los QR de cada mesa" />

      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={downloadAll}
          disabled={tables.length === 0}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_16px_rgba(168,85,247,0.25)] disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Descargar todos
        </button>
        <button
          onClick={printAll}
          disabled={tables.length === 0}
          className="flex items-center gap-2 bg-white border border-border-light text-text-secondary px-4 py-2 rounded-full text-[13px] font-medium hover:border-primary/30 transition-all duration-300 disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          Imprimir todos
        </button>
      </div>

      {tables.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-border-light py-16 text-center">
          <p className="text-text-muted text-[14px]">Agrega mesas desde la sección Mesas para generar QR</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white rounded-[16px] border border-border-light p-6 flex flex-col items-center hover:border-primary/20 transition-all duration-300"
            >
              <img
                src={table.dataUrl}
                alt={`QR ${table.name}`}
                className="w-36 h-36 rounded-[12px] mb-4"
              />
              <p className="text-[15px] font-semibold text-text-primary mb-1">{table.name}</p>
              <p className="text-[12px] text-text-muted mb-4">Escanea para ordenar</p>
              <button
                onClick={() => downloadQR(table)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary-dark transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar PNG
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
