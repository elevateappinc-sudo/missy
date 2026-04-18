"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, MemberPermissions } from "@/types";

const OWNER_PERMISSIONS: MemberPermissions = {
  menu: true,
  tables: true,
  orders: true,
  qr: true,
  settings: true,
};

export function useRestaurant(userId: string | undefined) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [permissions, setPermissions] = useState<MemberPermissions | null>(null);
  const [role, setRole] = useState<"owner" | "member" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function load() {
      // First, try owner
      const { data: owned } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", userId)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (owned) {
        setRestaurant(owned as Restaurant);
        setPermissions(OWNER_PERMISSIONS);
        setRole("owner");
        setLoading(false);
        return;
      }

      // Else, look up membership
      const { data: membership } = await supabase
        .from("restaurant_members")
        .select("restaurant_id, role, permissions, restaurants(*)")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (membership && (membership as any).restaurants) {
        setRestaurant((membership as any).restaurants as Restaurant);
        setPermissions(((membership as any).permissions as MemberPermissions) ?? OWNER_PERMISSIONS);
        setRole(((membership as any).role as "owner" | "member") ?? "member");
      } else {
        setRestaurant(null);
        setPermissions(null);
        setRole(null);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  return { restaurant, permissions, role, loading };
}
