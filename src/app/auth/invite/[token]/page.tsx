"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, CheckCircle2, AlertCircle, ArrowRight, Mail, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface InvitationSummary {
  id: string;
  email: string;
  name: string | null;
  restaurant_name: string;
  restaurant_id: string;
  expired: boolean;
  used: boolean;
  permissions: Record<string, boolean>;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [invitation, setInvitation] = useState<InvitationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Save token to localStorage so login/register flow can redirect back
      if (typeof window !== "undefined") {
        window.localStorage.setItem("pending_invitation_token", token);
      }

      const { data } = await supabase
        .from("invitations")
        .select("id, email, name, permissions, expires_at, used_at, restaurant_id, restaurants(name)")
        .eq("token", token)
        .maybeSingle();

      if (!data) {
        setLoadError("Invitación no encontrada o inválida.");
        setLoading(false);
        return;
      }

      setInvitation({
        id: data.id,
        email: data.email,
        name: data.name,
        restaurant_name: (data as any).restaurants?.name ?? "Restaurante",
        restaurant_id: data.restaurant_id,
        expired: new Date(data.expires_at) < new Date(),
        used: !!data.used_at,
        permissions: data.permissions ?? {},
      });

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) setUser({ email: authUser.email });
      setLoading(false);
    }
    load();
  }, [supabase, token]);

  async function acceptInvitation() {
    setAccepting(true);
    setAcceptError(null);
    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await res.json();
    setAccepting(false);
    if (!res.ok) {
      setAcceptError(json.error ?? "No se pudo aceptar la invitación");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("pending_invitation_token");
    }
    setSuccess(json.restaurant_name ?? "el restaurante");
    setTimeout(() => router.push("/dashboard"), 1800);
  }

  const permissionLabels: Record<string, string> = {
    menu: "Menú",
    tables: "Mesas",
    orders: "Pedidos",
    qr: "Códigos QR",
    settings: "Configuración",
  };

  const enabledPerms = invitation
    ? Object.entries(invitation.permissions).filter(([, v]) => v).map(([k]) => k)
    : [];

  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-6 py-12">
      <div className="w-full max-w-[460px]">
        <div className="inline-flex items-center gap-2 mb-10">
          <Bot className="w-7 h-7 text-primary" />
          <span className="text-lg font-semibold tracking-tight text-text-primary">missy</span>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 text-text-secondary text-[14px]">
            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            Cargando invitación…
          </div>
        ) : loadError || !invitation ? (
          <div>
            <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mb-5">
              <AlertCircle className="w-7 h-7 text-error" />
            </div>
            <h1 className="text-[24px] font-extralight tracking-tight text-text-primary mb-2">
              Invitación inválida
            </h1>
            <p className="text-text-secondary text-[14px] mb-6">
              {loadError ?? "Esta invitación no es válida."}
            </p>
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-primary font-medium text-[14px]">
              Volver al inicio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : success ? (
          <div className="animate-fade-up">
            <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-7 h-7 text-success" />
            </div>
            <h1 className="text-[24px] font-extralight tracking-tight text-text-primary mb-2">
              ¡Bienvenido a {success}!
            </h1>
            <p className="text-text-secondary text-[14px]">Redirigiendo al dashboard…</p>
          </div>
        ) : invitation.used ? (
          <InfoState
            title="Invitación ya utilizada"
            description="Esta invitación ya fue aceptada. Inicia sesión para acceder."
          />
        ) : invitation.expired ? (
          <InfoState
            title="Invitación expirada"
            description="El enlace expiró. Pide una nueva invitación al dueño del restaurante."
          />
        ) : (
          <>
            <h1 className="text-[26px] font-extralight tracking-tight text-text-primary mb-2">
              Te invitaron a <span className="font-medium text-primary">{invitation.restaurant_name}</span>
            </h1>
            <p className="text-text-secondary text-[14px] mb-6 leading-relaxed">
              Al aceptar, te unirás al equipo del restaurante con los permisos que te asignaron.
            </p>

            <div className="bg-bg-warm/60 rounded-[14px] border border-border-light p-4 mb-6">
              <div className="flex items-center gap-2 text-[13px] text-text-secondary mb-2">
                <Mail className="w-4 h-4" />
                Invitación para <strong className="text-text-primary font-medium ml-1">{invitation.email}</strong>
              </div>
              <div className="text-[12px] text-text-muted mb-2">Permisos asignados:</div>
              <div className="flex flex-wrap gap-1.5">
                {enabledPerms.length === 0 ? (
                  <span className="text-[12px] text-text-muted italic">Sin permisos</span>
                ) : (
                  enabledPerms.map((p) => (
                    <span key={p} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                      {permissionLabels[p] ?? p}
                    </span>
                  ))
                )}
              </div>
            </div>

            {acceptError && (
              <div className="mb-4 px-4 py-3 rounded-[10px] bg-error/10 border border-error/20 text-error text-[13px]">
                {acceptError}
              </div>
            )}

            {user ? (
              user.email.toLowerCase() !== invitation.email.toLowerCase() ? (
                <div className="px-4 py-3 rounded-[10px] bg-warning/10 border border-warning/20 text-warning text-[13px] mb-4">
                  Estás con la sesión de <strong>{user.email}</strong>, pero esta invitación es para{" "}
                  <strong>{invitation.email}</strong>. Cierra sesión e ingresa con esa cuenta.
                </div>
              ) : (
                <button
                  onClick={acceptInvitation}
                  disabled={accepting}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_20px_rgba(168,85,247,0.3)] disabled:opacity-50"
                >
                  {accepting ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Aceptar invitación
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )
            ) : (
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar sesión para aceptar
                </Link>
                <Link
                  href="/auth/register"
                  className="w-full flex items-center justify-center gap-2 border border-border-light text-text-primary py-3 rounded-full text-[14px] font-semibold hover:border-primary/30 transition-all"
                >
                  Crear cuenta nueva
                </Link>
                <p className="text-[12px] text-text-muted text-center">
                  Usa el correo <strong className="text-text-secondary">{invitation.email}</strong> para que la invitación funcione.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoState({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="w-14 h-14 rounded-full bg-warning/15 flex items-center justify-center mb-5">
        <AlertCircle className="w-7 h-7 text-warning" />
      </div>
      <h1 className="text-[24px] font-extralight tracking-tight text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary text-[14px] mb-6">{description}</p>
      <Link href="/auth/login" className="inline-flex items-center gap-2 text-primary font-medium text-[14px]">
        Ir al inicio de sesión <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
