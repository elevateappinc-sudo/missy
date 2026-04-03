"use client";

import type { Table, TableStatus } from "@/types";

const statusColors: Record<TableStatus, { fill: string; stroke: string; label: string }> = {
  empty: { fill: "#34d39920", stroke: "#34d399", label: "Libre" },
  occupied: { fill: "#a855f720", stroke: "#a855f7", label: "Ocupada" },
  ordering: { fill: "#fbbf2420", stroke: "#fbbf24", label: "Ordenando" },
  waiting: { fill: "#f43f5e20", stroke: "#f43f5e", label: "Esperando" },
  served: { fill: "#9a8fad20", stroke: "#9a8fad", label: "Servida" },
};

interface TableNodeProps {
  table: Table;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.PointerEvent) => void;
}

export function TableNode({ table, isSelected, onSelect, onDragStart }: TableNodeProps) {
  const colors = statusColors[table.status] ?? statusColors.empty;
  const cx = table.position_x + table.width / 2;
  const cy = table.position_y + table.height / 2;

  return (
    <g
      style={{ cursor: "grab" }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(table.id);
        onDragStart(table.id, e);
      }}
    >
      {table.shape === "round" ? (
        <circle
          cx={cx}
          cy={cy}
          r={table.width / 2}
          fill={colors.fill}
          stroke={isSelected ? "#a855f7" : colors.stroke}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={isSelected ? "6 3" : "none"}
        />
      ) : (
        <rect
          x={table.position_x}
          y={table.position_y}
          width={table.width}
          height={table.shape === "rectangle" ? table.height * 0.6 : table.height}
          rx={8}
          ry={8}
          fill={colors.fill}
          stroke={isSelected ? "#a855f7" : colors.stroke}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={isSelected ? "6 3" : "none"}
        />
      )}
      {/* Table name */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1a1127"
        fontSize={13}
        fontWeight={600}
      >
        {table.name}
      </text>
      {/* Capacity */}
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#5c5470"
        fontSize={11}
      >
        {table.capacity}p
      </text>
      {/* Status dot */}
      <circle
        cx={table.shape === "round" ? cx + table.width / 2 - 8 : table.position_x + table.width - 12}
        cy={table.shape === "round" ? cy - table.width / 2 + 8 : table.position_y + 12}
        r={5}
        fill={colors.stroke}
      />
    </g>
  );
}

export { statusColors };
