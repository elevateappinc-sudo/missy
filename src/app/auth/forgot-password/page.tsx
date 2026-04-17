"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Verify the email is registered before attempting to send
    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });
    const json = await res.json();

    if (!json.exists) {
      setError("Este correo no está registrado. Usa el correo con el que creaste tu cuenta.");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);

    if (resetError) {
      setError("No fue posible enviar el correo. Intenta de nuevo.");
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-full flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-[13px] text-text-secondary hover:text-primary mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </Link>

          <div className="inline-flex items-center gap-2 mb-10">
            <Bot className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-text-primary">missy</span>
          </div>

          {sent ? (
            <div className="animate-fade-up">
              <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center mb-5">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <h1 className="text-[26px] font-extralight tracking-tight text-text-primary mb-2">
                Correo enviado
              </h1>
              <p className="text-text-secondary text-[14px] mb-8 leading-relaxed">
                Enviamos un enlace a <strong className="text-text-primary font-medium">{email}</strong> para
                restablecer tu contraseña. Revisa tu bandeja de entrada (y carpeta de spam).
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300"
              >
                Ir al inicio de sesión
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-[28px] font-extralight tracking-tight text-text-primary mb-1">
                Olvidaste tu contraseña
              </h1>
              <p className="text-text-secondary text-[15px] mb-10">
                Ingresa el correo con el que creaste tu cuenta y te enviaremos un enlace para restablecerla.
              </p>

              {error && (
                <div className="mb-6 px-4 py-3 rounded-[10px] bg-error/10 border border-error/20 text-error text-[13px]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-[13px] font-medium text-text-primary mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@restaurante.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
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
                      Enviar enlace
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
