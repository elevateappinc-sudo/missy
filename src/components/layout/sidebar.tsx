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
  X,
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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const { restaurant } = useRestaurant(user?.id);

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-[260px] lg:w-[230px] bg-bg-dark lg:rounded-[20px] lg:border lg:border-white/[0.06] flex flex-col z-50 shadow-2xl shadow-black/20 transform transition-transform duration-300 lg:top-4 lg:left-4 lg:bottom-4 lg:h-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-[8px] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-primary/15 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-white">
            missy
          </span>
        </div>

        {/* Restaurant name */}
        <div className="px-4 mb-5">
          <div className="px-3 py-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.06]">
            <p className="text-[10px] text-white/25 font-medium uppercase tracking-wider">Restaurante</p>
            <p className="text-[13px] text-white/70 font-medium truncate mt-0.5">
              {restaurant?.name ?? "Cargando..."}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="px-5 mb-3">
          <div className="h-px bg-white/[0.06]" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/15 text-primary-light"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <item.icon className="w-[17px] h-[17px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4">
          <div className="h-px bg-white/[0.06] mb-3 mx-2" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all duration-200 w-full"
          >
            <LogOut className="w-[17px] h-[17px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
