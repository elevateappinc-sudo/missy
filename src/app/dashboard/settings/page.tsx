"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Bot, Store, Palette, Volume2, Save } from "lucide-react";

export default function SettingsPage() {
  const [tab, setTab] = useState<"restaurant" | "avatar">("restaurant");

  return (
    <>
      <DashboardHeader title="Configuración" subtitle="Personaliza tu restaurante y tu Missy" />

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setTab("restaurant")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
            tab === "restaurant"
              ? "bg-primary text-white"
              : "bg-white border border-border-light text-text-secondary hover:border-primary/30"
          }`}
        >
          <Store className="w-4 h-4" />
          Restaurante
        </button>
        <button
          onClick={() => setTab("avatar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
            tab === "avatar"
              ? "bg-primary text-white"
              : "bg-white border border-border-light text-text-secondary hover:border-primary/30"
          }`}
        >
          <Bot className="w-4 h-4" />
          Avatar Missy
        </button>
      </div>

      {tab === "restaurant" ? (
        <div className="bg-white rounded-[16px] border border-border-light p-8 max-w-2xl">
          <h2 className="text-[17px] font-semibold text-text-primary mb-6">
            Datos del restaurante
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Nombre del restaurante
              </label>
              <input
                type="text"
                defaultValue="Mi Restaurante"
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Descripción
              </label>
              <textarea
                rows={3}
                defaultValue="Restaurante de comida colombiana tradicional"
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-2">
                  País
                </label>
                <input
                  type="text"
                  defaultValue="Colombia"
                  className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  defaultValue="+57 300 123 4567"
                  className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-2">
                  Color primario
                </label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue="#a855f7" className="w-10 h-10 rounded-[8px] border border-border-light cursor-pointer" />
                  <span className="text-[13px] text-text-muted">#a855f7</span>
                </div>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 mt-2">
              <Save className="w-4 h-4" />
              Guardar cambios
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[16px] border border-border-light p-8 max-w-2xl">
          <h2 className="text-[17px] font-semibold text-text-primary mb-6">
            Configuración del avatar
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Nombre del avatar
              </label>
              <input
                type="text"
                defaultValue="Missy"
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-3">
                Estilo visual
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: "robot", label: "Robot" },
                  { id: "human", label: "Humano" },
                  { id: "mascot", label: "Mascota" },
                  { id: "custom", label: "Custom" },
                ].map((style) => (
                  <button
                    key={style.id}
                    className="py-3 rounded-[10px] border border-border-light text-[13px] font-medium text-text-secondary hover:border-primary/30 hover:text-primary transition-all duration-200 first:border-primary first:bg-primary/8 first:text-primary"
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-3">
                Personalidad
              </label>
              <div className="grid grid-cols-4 gap-3">
                {["Formal", "Amigable", "Divertida", "Sofisticada"].map((p) => (
                  <button
                    key={p}
                    className="py-3 rounded-[10px] border border-border-light text-[13px] font-medium text-text-secondary hover:border-primary/30 hover:text-primary transition-all duration-200"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Mensaje de bienvenida
              </label>
              <textarea
                rows={2}
                defaultValue="¡Hola! Soy Missy, tu mesero virtual. ¿En qué te puedo ayudar hoy?"
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300 resize-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary mb-2">
                <Volume2 className="w-4 h-4" />
                Voz
              </label>
              <select className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300">
                <option>Femenina - Español (Colombia)</option>
                <option>Masculina - Español (Colombia)</option>
                <option>Femenina - Español (México)</option>
                <option>Masculina - Español (México)</option>
              </select>
            </div>
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 mt-2">
              <Save className="w-4 h-4" />
              Guardar configuración
            </button>
          </div>
        </div>
      )}
    </>
  );
}
