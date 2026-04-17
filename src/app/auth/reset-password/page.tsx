"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase delivers the recovery session via URL hash; onAuthStateChange picks it up.
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });
    // Also check current user (link may already have been exchanged)
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      return;
    }

    setSuccess(true);
    // Sign out so user must log in with new password
    await supabase.auth.signOut();
    setTimeout(() => router.push("/auth/login"), 2200);
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="inline-flex items-center gap-2 mb-10">
            <Bot className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-text-primary">missy</span>
          </div>

          {success ? (
            <div className="animate-fade-up">
              <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="text-[26px] font-extralight tracking-tight text-text-primary mb-2">
                Contraseña actualizada
              </h1>
              <p className="text-text-secondary text-[14px] mb-8">
                Ya puedes iniciar sesión con tu nueva contraseña. Redirigiendo…
              </p>
            </div>
          ) : !sessionReady ? (
            <>
              <h1 className="text-[28px] font-extralight tracking-tight text-text-primary mb-2">
                Enlace inválido
              </h1>
              <p className="text-text-secondary text-[14px] mb-8">
                Este enlace no es válido o expiró. Solicita uno nuevo desde olvidé mi contraseña.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all"
              >
                Solicitar nuevo enlace
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-extralight tracking-tight text-text-primary mb-1">
                Nueva contraseña
              </h1>
              <p className="text-text-secondary text-[15px] mb-10">
                Escribe tu nueva contraseña y confírmala.
              </p>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-[10px] bg-error/10 border border-error/20 text-error text-[13px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-2">Nueva contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-2">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Actualizar contraseña
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
