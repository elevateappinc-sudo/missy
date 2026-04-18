"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Bot, Store, Volume2, Save, Check, Users, Mail, UserPlus, Copy, X, Trash2, ShieldCheck, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { MemberPermissions } from "@/types";

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

const PERMISSION_LIST: { key: keyof MemberPermissions; label: string; description: string }[] = [
  { key: "menu", label: "Menú", description: "Ver y editar productos del menú" },
  { key: "tables", label: "Mesas", description: "Gestionar pisos y mesas" },
  { key: "orders", label: "Pedidos", description: "Ver y actualizar pedidos" },
  { key: "qr", label: "Códigos QR", description: "Descargar códigos QR de mesas" },
  { key: "settings", label: "Configuración", description: "Modificar datos del restaurante" },
];

type TabKey = "restaurant" | "avatar" | "team";

export default function SettingsPage() {
  const { user } = useSession();
  const { restaurant, role } = useRestaurant(user?.id);
  const [tab, setTab] = useState<TabKey>("restaurant");
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

  const loadAvatar = useCallback(async () => {
    if (!restaurant) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("avatar_configs")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();
    if (data) {
      setAvatarForm({
        name: data.name ?? "Missy",
        style: data.style ?? "robot",
        personality: data.personality ?? "friendly",
        greeting_message: data.greeting_message ?? "",
        voice_id: data.voice_id ?? "female-co",
      });
    }
  }, [restaurant]);

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
    const supabase = createClient();
    const { data, error } = await supabase.from("restaurants").update({
      name: restForm.name,
      description: restForm.description || null,
      country: restForm.country,
      phone: restForm.phone || null,
      primary_color: restForm.primary_color,
    }).eq("id", restaurant.id).select();
    setSaving(false);
    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert("No se pudo guardar. Tu sesión puede haber expirado. Intenta cerrar sesión y volver a entrar.");
    } else {
      showSaved();
    }
  }

  async function saveAvatar() {
    if (!restaurant) return;
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("avatar_configs").upsert({
      restaurant_id: restaurant.id,
      name: avatarForm.name,
      style: avatarForm.style,
      personality: avatarForm.personality,
      greeting_message: avatarForm.greeting_message,
      voice_id: avatarForm.voice_id,
    }, { onConflict: "restaurant_id" }).select();
    setSaving(false);
    if (error) {
      alert(`Error al guardar: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert("No se pudo guardar. Tu sesión puede haber expirado. Intenta cerrar sesión y volver a entrar.");
    } else {
      showSaved();
    }
  }

  const tabs: { key: TabKey; label: string; icon: typeof Store }[] = [
    { key: "restaurant", label: "Restaurante", icon: Store },
    { key: "avatar", label: "Avatar Missy", icon: Bot },
    { key: "team", label: "Equipo", icon: Users },
  ];

  return (
    <>
      <DashboardHeader title="Configuración" subtitle="Personaliza tu restaurante, tu Missy y tu equipo" />

      {saved && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-success/15 text-success px-4 py-2 rounded-full text-[13px] font-medium animate-fade-up">
          <Check className="w-4 h-4" />
          Guardado
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
              tab === t.key
                ? "bg-primary text-white"
                : "bg-white border border-border-light text-text-secondary hover:border-primary/30"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "restaurant" && (
        <div className="bg-white rounded-[16px] border border-border-light p-5 sm:p-8 max-w-2xl">
          <h2 className="text-[17px] font-semibold text-text-primary mb-6">Datos del restaurante</h2>
          <div className="space-y-5">
            <Field label="Nombre del restaurante">
              <input
                type="text"
                value={restForm.name}
                onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
                className="input-base"
              />
            </Field>
            <Field label="Descripción">
              <textarea
                rows={3}
                value={restForm.description}
                onChange={(e) => setRestForm({ ...restForm, description: e.target.value })}
                className="input-base resize-none"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="País">
                <input
                  type="text"
                  value={restForm.country}
                  onChange={(e) => setRestForm({ ...restForm, country: e.target.value })}
                  className="input-base"
                />
              </Field>
              <Field label="Teléfono">
                <input
                  type="tel"
                  value={restForm.phone}
                  onChange={(e) => setRestForm({ ...restForm, phone: e.target.value })}
                  className="input-base"
                />
              </Field>
            </div>
            <Field label="Color primario">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={restForm.primary_color}
                  onChange={(e) => setRestForm({ ...restForm, primary_color: e.target.value })}
                  className="w-10 h-10 rounded-[8px] border border-border-light cursor-pointer"
                />
                <span className="text-[13px] text-text-muted">{restForm.primary_color}</span>
              </div>
            </Field>
            <button
              onClick={saveRestaurant}
              disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all mt-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}

      {tab === "avatar" && (
        <div className="bg-white rounded-[16px] border border-border-light p-5 sm:p-8 max-w-2xl">
          <h2 className="text-[17px] font-semibold text-text-primary mb-6">Configuración del avatar</h2>
          <div className="space-y-5">
            <Field label="Nombre del avatar">
              <input
                type="text"
                value={avatarForm.name}
                onChange={(e) => setAvatarForm({ ...avatarForm, name: e.target.value })}
                className="input-base"
              />
            </Field>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-3">Estilo visual</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setAvatarForm({ ...avatarForm, style: s.id })}
                    className={`py-3 rounded-[10px] border text-[13px] font-medium transition-all ${
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {personalities.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAvatarForm({ ...avatarForm, personality: p.id })}
                    className={`py-3 rounded-[10px] border text-[13px] font-medium transition-all ${
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
            <Field label="Mensaje de bienvenida">
              <textarea
                rows={2}
                value={avatarForm.greeting_message}
                onChange={(e) => setAvatarForm({ ...avatarForm, greeting_message: e.target.value })}
                className="input-base resize-none"
              />
            </Field>
            <div>
              <label className="flex items-center gap-2 text-[13px] font-medium text-text-primary mb-2">
                <Volume2 className="w-4 h-4" />
                Voz
              </label>
              <select
                value={avatarForm.voice_id}
                onChange={(e) => setAvatarForm({ ...avatarForm, voice_id: e.target.value })}
                className="input-base"
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
              className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all mt-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>
        </div>
      )}

      {tab === "team" && restaurant && (
        <TeamTab restaurantId={restaurant.id} isOwner={role === "owner"} />
      )}

      <style jsx global>{`
        .input-base {
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          border: 1px solid var(--color-border-light);
          background: color-mix(in srgb, var(--color-bg-warm) 50%, transparent);
          font-size: 14px;
          color: var(--color-text-primary);
          transition: all 0.3s;
        }
        .input-base:focus {
          outline: none;
          border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 30%, transparent);
        }
      `}</style>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-text-primary mb-2">{label}</label>
      {children}
    </div>
  );
}

// ============================================
// TEAM TAB
// ============================================

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  permissions: MemberPermissions;
  created_at: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string | null;
  token: string;
  expires_at: string;
  used_at: string | null;
}

function TeamTab({ restaurantId, isOwner }: { restaurantId: string; isOwner: boolean }) {
  const supabase = createClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] = useState<PendingInvitation | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase
        .from("restaurant_members")
        .select("id, email, name, role, permissions, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at"),
      supabase
        .from("invitations")
        .select("id, email, name, token, expires_at, used_at")
        .eq("restaurant_id", restaurantId)
        .is("used_at", null)
        .order("created_at", { ascending: false }),
    ]);
    setMembers((m as TeamMember[]) ?? []);
    setInvitations((i as PendingInvitation[]) ?? []);
    setLoading(false);
  }, [restaurantId, supabase]);

  useEffect(() => { load(); }, [load]);

  async function confirmRevokeInvitation() {
    if (!invitationToRevoke) return;
    setActionLoading(true);
    await supabase.from("invitations").delete().eq("id", invitationToRevoke.id);
    setActionLoading(false);
    setInvitationToRevoke(null);
    load();
  }

  async function confirmRemoveMember() {
    if (!memberToRemove) return;
    setActionLoading(true);
    await supabase.from("restaurant_members").delete().eq("id", memberToRemove.id);
    setActionLoading(false);
    setMemberToRemove(null);
    load();
  }

  if (!isOwner) {
    return (
      <div className="bg-white rounded-[16px] border border-border-light p-8 max-w-2xl text-center">
        <ShieldCheck className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary text-[14px]">
          Solo el dueño del restaurante puede gestionar el equipo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold text-text-primary">Miembros del equipo</h2>
          <p className="text-[13px] text-text-secondary mt-0.5">
            Invita a usuarios y asigna los permisos que tendrán.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full text-[13px] font-semibold hover:bg-primary-dark transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invitar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Active members */}
          <div className="bg-white rounded-[14px] border border-border-light overflow-hidden">
            <div className="px-5 py-3 border-b border-border-light flex items-center gap-2 text-[13px] font-semibold text-text-primary">
              <Users className="w-4 h-4" />
              Activos ({members.length})
            </div>
            {members.length === 0 ? (
              <p className="px-5 py-6 text-[13px] text-text-muted">Aún no hay otros miembros.</p>
            ) : (
              <ul className="divide-y divide-border-light">
                {members.map((m) => (
                  <li key={m.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-text-primary truncate">
                        {m.name || m.email}
                      </p>
                      <p className="text-[12px] text-text-muted truncate">{m.email}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(m.permissions)
                          .filter(([, v]) => v)
                          .map(([k]) => (
                            <span key={k} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {permissionLabel(k)}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-text-muted px-2 py-1 rounded-full bg-bg-warm">
                        {m.role === "owner" ? "Dueño" : "Miembro"}
                      </span>
                      {m.role !== "owner" && (
                        <button
                          onClick={() => setMemberToRemove(m)}
                          className="w-8 h-8 rounded-[6px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all"
                          aria-label="Quitar miembro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-[14px] border border-border-light overflow-hidden">
              <div className="px-5 py-3 border-b border-border-light flex items-center gap-2 text-[13px] font-semibold text-text-primary">
                <Clock className="w-4 h-4" />
                Pendientes ({invitations.length})
              </div>
              <ul className="divide-y divide-border-light">
                {invitations.map((inv) => (
                  <InvitationRow key={inv.id} invitation={inv} onRevoke={() => setInvitationToRevoke(inv)} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!invitationToRevoke}
        variant="danger"
        title="Revocar invitación"
        description={
          invitationToRevoke
            ? `El enlace enviado a ${invitationToRevoke.email} dejará de funcionar.`
            : ""
        }
        confirmLabel="Revocar"
        loading={actionLoading}
        onConfirm={confirmRevokeInvitation}
        onCancel={() => setInvitationToRevoke(null)}
      />

      <ConfirmDialog
        open={!!memberToRemove}
        variant="danger"
        title="Quitar miembro del equipo"
        description={
          memberToRemove
            ? `${memberToRemove.name || memberToRemove.email} perderá acceso al restaurante inmediatamente.`
            : ""
        }
        confirmLabel="Quitar miembro"
        loading={actionLoading}
        onConfirm={confirmRemoveMember}
        onCancel={() => setMemberToRemove(null)}
      />
    </div>
  );
}

function permissionLabel(key: string) {
  const map: Record<string, string> = {
    menu: "Menú",
    tables: "Mesas",
    orders: "Pedidos",
    qr: "QR",
    settings: "Config",
  };
  return map[key] ?? key;
}

function InvitationRow({ invitation, onRevoke }: { invitation: PendingInvitation; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/auth/invite/${invitation.token}`
    : `/auth/invite/${invitation.token}`;
  const expired = new Date(invitation.expires_at) < new Date();

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <li className="px-5 py-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-text-muted" />
          <p className="text-[14px] text-text-primary truncate">
            {invitation.name ? `${invitation.name} · ` : ""}{invitation.email}
          </p>
        </div>
        <p className={`text-[11px] mt-0.5 ${expired ? "text-error" : "text-text-muted"}`}>
          {expired ? "Expirada" : `Expira ${new Date(invitation.expires_at).toLocaleDateString("es-CO")}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-text-secondary bg-bg-warm hover:bg-bg-warm/80 transition-all"
          title="Copiar enlace"
        >
          <Copy className="w-3 h-3" />
          {copied ? "Copiado" : "Enlace"}
        </button>
        <button
          onClick={onRevoke}
          className="w-8 h-8 rounded-[6px] flex items-center justify-center text-text-muted hover:text-error hover:bg-error/8 transition-all"
          aria-label="Revocar invitación"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", email: "" });
  const [permissions, setPermissions] = useState<MemberPermissions>({
    menu: true,
    tables: true,
    orders: true,
    qr: true,
    settings: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; delivered: boolean; error: string | null } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/invitations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim() || null,
        email: form.email.trim(),
        permissions,
      }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error ?? "No se pudo enviar la invitación");
      return;
    }
    setResult({ url: json.accept_url, delivered: !!json.email_delivered, error: json.email_error ?? null });
  }

  function toggle(key: keyof MemberPermissions) {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  }

  async function copyLink() {
    if (result) await navigator.clipboard.writeText(result.url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[16px] border border-border-light w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[17px] font-semibold text-text-primary">Invitar miembro</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div>
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-success" />
            </div>
            <h4 className="text-[15px] font-semibold text-text-primary mb-1">Invitación creada</h4>
            <p className="text-[13px] text-text-secondary mb-4">
              {result.delivered
                ? "Enviamos el enlace por correo. También puedes compartirlo manualmente:"
                : "No pudimos enviar el correo (falta configurar RESEND_API_KEY). Comparte este enlace manualmente:"}
            </p>
            <div className="bg-bg-warm border border-border-light rounded-[10px] p-3 mb-4 text-[12px] text-text-primary break-all font-mono">
              {result.url}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary text-white text-[13px] font-semibold hover:bg-primary-dark transition-all"
              >
                <Copy className="w-4 h-4" />
                Copiar enlace
              </button>
              <button
                onClick={onCreated}
                className="flex-1 py-2.5 rounded-full border border-border-light text-text-secondary text-[13px] font-semibold hover:border-primary/30 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {error && (
              <div className="px-3 py-2 rounded-[8px] bg-error/10 border border-error/20 text-error text-[12px]">
                {error}
              </div>
            )}
            <Field label="Nombre (opcional)">
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="María Pérez"
                className="input-base"
              />
            </Field>
            <Field label="Correo electrónico">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="maria@restaurante.com"
                required
                className="input-base"
              />
            </Field>
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                Secciones a las que tendrá acceso
              </label>
              <div className="space-y-1">
                {PERMISSION_LIST.map((p) => (
                  <label
                    key={p.key}
                    className="flex items-start gap-3 px-3 py-2 rounded-[8px] hover:bg-bg-warm/50 cursor-pointer transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={permissions[p.key]}
                      onChange={() => toggle(p.key)}
                      className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-text-primary">{p.label}</p>
                      <p className="text-[11px] text-text-muted">{p.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Enviar invitación
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
