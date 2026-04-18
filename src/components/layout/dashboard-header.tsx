"use client";

import { Bell, Search } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
      <div className="min-w-0">
        <h1 className="text-[20px] sm:text-[24px] font-semibold text-text-primary tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] sm:text-[14px] text-text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button className="hidden sm:flex w-10 h-10 rounded-[10px] border border-border-light items-center justify-center text-text-muted hover:text-text-secondary hover:bg-bg-warm transition-all duration-200">
          <Search className="w-[18px] h-[18px]" />
        </button>
        <button className="relative w-10 h-10 rounded-[10px] border border-border-light flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-bg-warm transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent-rose" />
        </button>
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-[14px]">
          JD
        </div>
      </div>
    </header>
  );
}
