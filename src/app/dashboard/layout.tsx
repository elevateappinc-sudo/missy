"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Bot } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-warm flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-warm">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-xl border-b border-border-light">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-text-primary hover:bg-bg-warm transition-all"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">missy</span>
        </div>
        <div className="w-10" />
      </div>

      <main className="lg:ml-[254px] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
