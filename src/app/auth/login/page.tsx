"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const { error } = await signInWithEmail(email, password);
    if (error) {
      setError("Correo o contraseña incorrectos");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGoogleLogin() {
    const { error } = await signInWithGoogle();
    if (error) setError("Error al iniciar con Google");
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — Avatar panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-bg-dark items-center justify-center overflow-hidden">
        {/* Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-accent-pink/6 blur-[80px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-12">
          <div className="w-56 h-56 rounded-full bg-white/[0.04] backdrop-blur-sm flex items-center justify-center border border-white/[0.06] animate-float">
            <Bot className="w-24 h-24 text-primary-light/80" strokeWidth={1} />
          </div>
          <h2 className="text-[28px] font-extralight text-white tracking-tight mt-10">
            Hola, soy <span className="font-medium text-primary-light">Missy</span>
          </h2>
          <p className="text-white/35 mt-3 text-base font-light">
            Tu mesero virtual con inteligencia artificial
          </p>

          <div className="flex flex-wrap gap-2 mt-10 justify-center">
            {["Voz natural", "Pedidos al instante", "Menú inteligente"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/40 text-[12px] font-medium"
                >
                  {tag}
                </span>
              )
            )}
          </div>
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
            Bienvenido de nuevo
          </h1>
          <p className="text-text-secondary text-[15px] mb-10">
            Inicia sesión para administrar tu restaurante
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-[10px] bg-error/10 border border-error/20 text-error text-[13px]">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[10px] border border-border-light bg-white hover:bg-bg-warm transition-colors duration-300 text-[14px] font-medium text-text-primary"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-border-light" />
            <span className="text-[13px] text-text-muted">o</span>
            <div className="flex-1 h-px bg-border-light" />
          </div>

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

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-text-primary mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-[10px] border border-border-light bg-bg-warm/50 text-[14px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-300"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-3.5 h-3.5 rounded accent-primary" />
                <span className="text-[13px] text-text-secondary">Recordarme</span>
              </label>
              <Link href="/auth/forgot-password" className="text-[13px] text-text-secondary hover:text-primary font-medium transition-colors duration-300">
                ¿Olvidaste tu contraseña?
              </Link>
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
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[14px] text-text-secondary mt-10">
            ¿No tienes cuenta?{" "}
            <Link href="/auth/register" className="text-primary font-semibold hover:text-primary-dark transition-colors duration-300">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
