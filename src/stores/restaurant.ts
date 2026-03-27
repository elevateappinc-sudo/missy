import { create } from "zustand";
import type { Restaurant } from "@/types";

interface RestaurantState {
  restaurant: Restaurant | null;
  isLoading: boolean;
  setRestaurant: (restaurant: Restaurant | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  restaurant: null,
  isLoading: true,
  setRestaurant: (restaurant) => set({ restaurant }),
  setLoading: (isLoading) => set({ isLoading }),
}));
