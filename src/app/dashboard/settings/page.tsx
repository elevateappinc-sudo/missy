"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Bot, Store, Volume2, Save, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";

const styles = [
  { id: "robot", label: "Robot" },
  { id: "human", label: "Humano" },
  { id: "mascot", label: "Mascota" },
  { id: "custom", label: "Custom" },
] as const;

const personalities = [
  { id: "formal", label: "Formal" },
  { id: "friendly", label: "Amigable" },
  { id: "funny", label: "Divertida" },
  { id: "sophisticated", label: "Sofisticada" },
] as const;

export default function SettingsPage() {
  const supabase = createClient();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);
  const [tab, setTab] = useState<"restaurant" | "avatar">("restaurant");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Restaurant form
  const [restForm, setRestForm] = useState({
    name: "",
    description: "",
    country: "",
    phone: "",
    primary_color: "#a855f7",
  });

  // Avatar form
  const [avatarForm, setAvatarForm] = useState({
    name: "Missy",
    style: "robot" as string,
    personality: "friendly" as string,
    greeting_message: "",
    voice_id: "female-co",
  });

  // Load restaurant data
  useEffect(() => {
    if (!restaurant) return;
    setRestForm({
      name: restaurant.name,
      description: restaurant.description ?? "",
      country: restaurant.country,
      phone: restaurant.phone ?? "",
      primary_color: restaurant.primary_color,
    });
  }, [restaurant]);

  // Load avatar config
  const loadAvatar = useCallback(async () => {
    if (!restaurant) return;
    const { data } = await supabase
      .from("avatar_configs")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .single();
    if (data) {
      setAvatarForm({
        name: data.name ?? "Missy",
        style: data.style ?? "robot",
        personality: data.personality ?? "friendly",
        greeting_message: data.greeting_message ?? "",
        voice_id: data.voice_id ?? "female-co",
      });
    }
  }, [restaurant, supabase]);

  useEffect(() => {
    loadAvatar();
  }, [loadAvatar]);

  function showSaved() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveRestaurant() {
    if (!restaurant) return;
    setSaving(true);
    await supabase.from("restaurants").update({
      name: restForm.name,
      description: restForm.description || null,
      country: restForm.country,
      phone: restForm.phone || null,
      primary_color: restForm.primary_color,
    }).eq("id", restaurant.id);
    setSaving(false);
    showSaved();
  }

  async function saveAvatar() {
    if (!restaurant) return;
    setSaving(true);
    await supabase.from("avatar_configs").upsert({
      restaurant_id: restaurant.id,
      name: avatarForm.name,
      style: avatarForm.style,
      personality: avatarForm.personality,
      greeting_message: avatarForm.greeting_message,
      voice_id: avatarForm.voice_id,
    }, { onConflict: "restaurant_id" });
    setSaving(false);
    showSaved();
  }

  return (
    <>
      <DashboardHeader title="Configuración" subtitle="Personaliza tu restaurante y tu Missy" />

      {/* Saved indicator */}
      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-success/15 text-success px-4 py-2 rounded-full text-[13px] font-medium animate-fade-up">
          <Check className="w-4 h-4" />
          Guardado
        </div>
      )}

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
          <h2 className="text-[17px] font-semibold text-text-primary mb-6">Datos del restaurante</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">Nombre del restaurante</label>
              <input
                type="text"
                value={restForm.name}
                onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">Descripción</label>
              <textarea
                rows={3}
                value={restForm.description}
                onChange={(e) => setRestForm({ ...restForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-2">País</label>
                <input
                  type="text"
                  value={restForm.country}
                  onChange={(e) => setRestForm({ ...restForm, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={restForm.phone}
                  onChange={(e) => setRestForm({ ...restForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">Color primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={restForm.primary_color}
                  onChange={(e) => setRestForm({ ...restForm, primary_color: e.target.value })}
                  className="w-10 h-10 rounded-[8px] border border-border-light cursor-pointer"
                />
                <span className="text-[13px] text-text-muted">{restForm.primary_color}</span>
              </div>
            </div>
            <button
              onClick={saveRestaurant}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 mt-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[16px] border border-border-light p-8 max-w-2xl">
          <h2 className="text-[17px] font-semibold text-text-primary mb-6">Configuración del avatar</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">Nombre del avatar</label>
              <input
                type="text"
                value={avatarForm.name}
                onChange={(e) => setAvatarForm({ ...avatarForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-3">Estilo visual</label>
              <div className="grid grid-cols-4 gap-3">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setAvatarForm({ ...avatarForm, style: s.id })}
                    className={`py-3 rounded-[10px] border text-[13px] font-medium transition-all duration-200 ${
                      avatarForm.style === s.id
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border-light text-text-secondary hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-3">Personalidad</label>
              <div className="grid grid-cols-4 gap-3">
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAvatarForm({ ...avatarForm, personality: p.id })}
                    className={`py-3 rounded-[10px] border text-[13px] font-medium transition-all duration-200 ${
                      avatarForm.personality === p.id
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border-light text-text-secondary hover:border-primary/30 hover:text-primary"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">Mensaje de bienvenida</label>
              <textarea
                rows={2}
                value={avatarForm.greeting_message}
                onChange={(e) => setAvatarForm({ ...avatarForm, greeting_message: e.target.value })}
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300 resize-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary mb-2">
                <Volume2 className="w-4 h-4" />
                Voz
              </label>
              <select
                value={avatarForm.voice_id}
                onChange={(e) => setAvatarForm({ ...avatarForm, voice_id: e.target.value })}
                className="w-full px-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
              >
                <option value="female-co">Femenina - Español (Colombia)</option>
                <option value="male-co">Masculina - Español (Colombia)</option>
                <option value="female-mx">Femenina - Español (México)</option>
                <option value="male-mx">Masculina - Español (México)</option>
              </select>
            </div>
            <button
              onClick={saveAvatar}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 mt-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
