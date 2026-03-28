"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  QrCode,
  Settings,
  LogOut,
} from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useRestaurant } from "@/hooks/use-restaurant";
import { signOut } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/menu", label: "Menú", icon: UtensilsCrossed },
  { href: "/dashboard/tables", label: "Mesas", icon: Grid3X3 },
  { href: "/dashboard/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/dashboard/qr", label: "Códigos QR", icon: QrCode },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-bg-dark flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-2.5">
        <Bot className="w-7 h-7 text-primary" />
        <span className="text-lg font-semibold tracking-tight text-white">
          missy
        </span>
      </div>

      {/* Restaurant name */}
      <div className="px-6 mb-6">
        <div className="px-3 py-2 rounded-[10px] bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[12px] text-white/30 font-medium">Restaurante</p>
          <p className="text-[14px] text-white/70 font-medium truncate">
            {restaurant?.name ?? "Cargando..."}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/15 text-primary-light"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[14px] font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200 w-full"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
