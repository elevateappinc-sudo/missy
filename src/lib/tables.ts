import type { Table } from "@/types";

/**
 * Returns the next available number for a table prefix (Mesa / Barra),
 * unique across all tables in the restaurant so names never duplicate.
 */
export function getNextTableNumber(allTables: Table[], prefix: "Mesa" | "Barra"): number {
  const regex = new RegExp(`^${prefix}\\s+(\\d+)$`, "i");
  const nums = allTables
    .map((t) => {
      const match = t.name.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  return nums.length > 0 ? Math.max(...nums) + 1 : 1;
}
