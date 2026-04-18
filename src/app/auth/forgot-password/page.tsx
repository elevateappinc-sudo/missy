"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { resetPasswordForEmail } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const { error } = await resetPasswordForEmail(email);
    if (error) {
      setError("No pudimos enviar el correo. Verifica la dirección.");
      setIsLoading(false);
    } else {
      setSent(true);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Avatar panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-bg-dark items-center justify-center overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-accent-pink/6 blur-[80px]" />

        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center px-12">
          <div className="w-56 h-56 rounded-full bg-white/[0.04] backdrop-blur-sm flex items-center justify-center border border-white/[0.06] animate-float">
            <Bot className="w-24 h-24 text-primary-light/80" strokeWidth={1} />
          </div>
          <h2 className="text-[28px] font-extralight text-white tracking-tight mt-10">
            Recupera tu <span className="font-medium text-primary-light">acceso</span>
          </h2>
          <p className="text-white/35 mt-3 text-base font-light">
            Te enviaremos un enlace seguro por correo
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="inline-flex items-center gap-2 mb-14">
            <Bot className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-text-primary">missy</span>
          </Link>

          <h1 className="text-[28px] font-extralight tracking-tight text-text-primary mb-1">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-text-secondary text-[15px] mb-10">
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-[10px] bg-error/10 border border-error/20 text-error text-[13px]">
              {error}
            </div>
          )}

          {sent ? (
            <div className="space-y-6">
              <div className="px-4 py-4 rounded-[10px] bg-primary/5 border border-primary/20 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-[13px] text-text-primary">
                  Listo. Si <span className="font-medium">{email}</span> está registrado,
                  recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                  Revisa también tu carpeta de spam.
                </div>
              </div>
              <Link
                href="/auth/login"
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_20px_rgba(168,85,247,0.3)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
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
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-full text-[14px] font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_4px_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar enlace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-[14px] text-text-secondary mt-10">
            ¿Ya la recordaste?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:text-primary-dark transition-colors duration-300">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
