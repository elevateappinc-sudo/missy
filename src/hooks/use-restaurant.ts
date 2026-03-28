"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/types";

export function useRestaurant(userId: string | undefined) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", userId)
      .single()
      .then(({ data }) => {
        setRestaurant(data as Restaurant | null);
        setLoading(false);
      });
  }, [userId]);

  return { restaurant, loading };
}
