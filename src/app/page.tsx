import Link from "next/link";
import {
  Bot,
  Sparkles,
  MessageSquare,
  ChefHat,
  QrCode,
  BarChart3,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Avatar IA personalizado",
    description:
      "Tu mesero virtual adopta el nombre, la voz y el estilo visual de tu restaurante.",
  },
  {
    icon: MessageSquare,
    title: "Conversación natural",
    description:
      "Los clientes hablan o escriben. Missy entiende, sugiere y confirma el pedido.",
  },
  {
    icon: Sparkles,
    title: "Pedidos instantáneos",
    description:
      "Del cliente a la cocina en segundos. Sin esperas, sin errores humanos.",
  },
  {
    icon: QrCode,
    title: "Un QR por mesa",
    description:
      "Escanea y empieza a pedir. Sin apps, sin descargas, sin fricción.",
  },
  {
    icon: ChefHat,
    title: "Sistema de cocina",
    description:
      "Pantalla en tiempo real con pedidos activos, estados y prioridades.",
  },
  {
    icon: BarChart3,
    title: "Datos inteligentes",
    description:
      "Analiza qué piden tus clientes, en qué horarios y optimiza tu operación.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <header className="fixed top-0 w-full z-50">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between px-6 md:px-10 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <Bot className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-white">
              missy
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[13px] text-white/60 font-medium">
            <a href="#features" className="hover:text-white transition-colors duration-300">
              Funcionalidades
            </a>
            <a href="#how" className="hover:text-white transition-colors duration-300">
              Cómo funciona
            </a>
            <a href="#pricing" className="hover:text-white transition-colors duration-300">
              Planes
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-[13px] text-white/60 hover:text-white font-medium transition-colors duration-300"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/auth/register"
              className="text-[13px] bg-white text-bg-dark font-semibold px-5 py-2 rounded-full hover:bg-white/90 transition-colors duration-300"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero — Fullscreen ── */}
      <section className="relative min-h-screen flex items-center justify-center bg-bg-dark overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-pink/6 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-accent-violet/5 blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative z-10 max-w-[900px] mx-auto text-center px-6">
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-primary-light text-[13px] font-medium mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Meseros virtuales con inteligencia artificial
          </div>

          <h1 className="animate-fade-up-delay-1 text-5xl sm:text-6xl md:text-[80px] font-extralight tracking-tight leading-[1.05] text-white mb-8">
            Tu restaurante,
            <br />
            <span className="font-normal bg-gradient-to-r from-primary via-accent-violet to-accent-pink bg-clip-text text-transparent">
              atendido por IA
            </span>
          </h1>

          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-white/45 max-w-xl mx-auto mb-12 leading-relaxed font-light">
            Missy atiende todas tus mesas al mismo tiempo. Toma pedidos por voz,
            recomienda platos y envía todo directo a cocina.
          </p>

          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="group flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-full text-[15px] hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_0_32px_rgba(168,85,247,0.35)]"
            >
              Probar gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <a
              href="#how"
              className="flex items-center gap-2 text-white/45 hover:text-white font-medium text-[15px] transition-colors duration-300"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#features"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20 hover:text-white/40 transition-colors duration-300"
        >
          <span className="text-[11px] font-medium uppercase tracking-widest">
            Scroll
          </span>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </a>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 md:py-36 px-6 bg-bg-warm">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-20">
            <p className="text-primary text-[13px] font-semibold uppercase tracking-widest mb-4">
              Funcionalidades
            </p>
            <h2 className="text-3xl md:text-[44px] font-extralight tracking-tight text-text-primary leading-tight">
              Todo lo que necesitas para
              <br className="hidden md:block" />
              <span className="font-normal">transformar tu atención</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white p-8 rounded-[16px] border border-border-light hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(168,85,247,0.06)] transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-[12px] bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors duration-500">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-[17px] font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary text-[15px] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-28 md:py-36 px-6 bg-white">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-20">
            <p className="text-primary text-[13px] font-semibold uppercase tracking-widest mb-4">
              Cómo funciona
            </p>
            <h2 className="text-3xl md:text-[44px] font-extralight tracking-tight text-text-primary leading-tight">
              Listo en <span className="font-normal">3 pasos</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Configura tu Missy",
                description:
                  "Sube tu menú, personaliza el avatar con tu marca y genera los QR para cada mesa.",
              },
              {
                step: "02",
                title: "El cliente escanea",
                description:
                  "El comensal escanea el QR en su mesa y Missy lo saluda, lista para atenderlo.",
              },
              {
                step: "03",
                title: "Pedido a cocina",
                description:
                  "Missy toma el pedido por voz o texto, confirma y lo envía directo a cocina.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-[16px] border border-border-light bg-bg-warm"
              >
                <span className="text-[64px] font-extralight bg-gradient-to-b from-primary/25 to-transparent bg-clip-text text-transparent leading-none">
                  {item.step}
                </span>
                <h3 className="text-[17px] font-semibold text-text-primary mt-4 mb-3">
                  {item.title}
                </h3>
                <p className="text-text-secondary text-[15px] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 md:py-36 px-6 bg-bg-dark overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-accent-pink/5 blur-[100px]" />

        <div className="relative z-10 max-w-[700px] mx-auto text-center">
          <h2 className="text-3xl md:text-[48px] font-extralight tracking-tight text-white leading-tight mb-6">
            ¿Listo para
            <br />
            <span className="font-normal bg-gradient-to-r from-primary to-accent-pink bg-clip-text text-transparent">
              transformar
            </span>{" "}
            tu restaurante?
          </h2>
          <p className="text-white/35 text-lg mb-12 max-w-md mx-auto leading-relaxed font-light">
            Empieza gratis. Sin tarjeta de crédito. Configura tu primer mesero
            virtual en minutos.
          </p>
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-full text-[15px] hover:bg-primary-dark transition-all duration-300 hover:shadow-[0_0_32px_rgba(168,85,247,0.35)]"
          >
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 bg-bg-dark border-t border-white/5">
        <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-white/30">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="font-medium text-white/50">missy</span>
          </div>
          <p>© 2026 Missy. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white/60 transition-colors duration-300">
              Privacidad
            </a>
            <a href="#" className="hover:text-white/60 transition-colors duration-300">
              Términos
            </a>
            <a href="#" className="hover:text-white/60 transition-colors duration-300">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
