"use client";

import type { Table, TableStatus } from "@/types";

const statusColors: Record<TableStatus, { fill: string; stroke: string; tableFill: string; chairFill: string; label: string }> = {
  empty: { fill: "#34d39915", stroke: "#34d399", tableFill: "#e8f5e9", chairFill: "#c8e6c9", label: "Libre" },
  occupied: { fill: "#a855f715", stroke: "#a855f7", tableFill: "#f3e8ff", chairFill: "#e9d5ff", label: "Ocupada" },
  ordering: { fill: "#fbbf2415", stroke: "#fbbf24", tableFill: "#fef9c3", chairFill: "#fef08a", label: "Ordenando" },
  waiting: { fill: "#f43f5e15", stroke: "#f43f5e", tableFill: "#ffe4e6", chairFill: "#fecdd3", label: "Esperando" },
  served: { fill: "#9a8fad15", stroke: "#9a8fad", tableFill: "#f1eff6", chairFill: "#e2dfe8", label: "Servida" },
};

interface TableNodeProps {
  table: Table;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.PointerEvent) => void;
}

// Generate chair positions around a table
function getChairPositions(
  shape: string,
  capacity: number,
  cx: number,
  cy: number,
  w: number,
  h: number
): { x: number; y: number; angle: number }[] {
  const chairs: { x: number; y: number; angle: number }[] = [];
  const chairOffset = 18; // distance from table edge

  if (shape === "round") {
    const radius = w / 2 + chairOffset;
    for (let i = 0; i < capacity; i++) {
      const angle = (i / capacity) * Math.PI * 2 - Math.PI / 2;
      chairs.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        angle: (angle * 180) / Math.PI + 90,
      });
    }
  } else if (shape === "rectangle") {
    const actualH = h * 0.55;
    const sides = distributeChairs(capacity, true);
    // Top
    for (let i = 0; i < sides.top; i++) {
      const spacing = w / (sides.top + 1);
      chairs.push({ x: cx - w / 2 + spacing * (i + 1), y: cy - actualH / 2 - chairOffset, angle: 0 });
    }
    // Bottom
    for (let i = 0; i < sides.bottom; i++) {
      const spacing = w / (sides.bottom + 1);
      chairs.push({ x: cx - w / 2 + spacing * (i + 1), y: cy + actualH / 2 + chairOffset, angle: 180 });
    }
    // Left
    for (let i = 0; i < sides.left; i++) {
      const spacing = actualH / (sides.left + 1);
      chairs.push({ x: cx - w / 2 - chairOffset, y: cy - actualH / 2 + spacing * (i + 1), angle: 270 });
    }
    // Right
    for (let i = 0; i < sides.right; i++) {
      const spacing = actualH / (sides.right + 1);
      chairs.push({ x: cx + w / 2 + chairOffset, y: cy - actualH / 2 + spacing * (i + 1), angle: 90 });
    }
  } else {
    // Square
    const sides = distributeChairs(capacity, false);
    // Top
    for (let i = 0; i < sides.top; i++) {
      const spacing = w / (sides.top + 1);
      chairs.push({ x: cx - w / 2 + spacing * (i + 1), y: cy - h / 2 - chairOffset, angle: 0 });
    }
    // Bottom
    for (let i = 0; i < sides.bottom; i++) {
      const spacing = w / (sides.bottom + 1);
      chairs.push({ x: cx - w / 2 + spacing * (i + 1), y: cy + h / 2 + chairOffset, angle: 180 });
    }
    // Left
    for (let i = 0; i < sides.left; i++) {
      const spacing = h / (sides.left + 1);
      chairs.push({ x: cx - w / 2 - chairOffset, y: cy - h / 2 + spacing * (i + 1), angle: 270 });
    }
    // Right
    for (let i = 0; i < sides.right; i++) {
      const spacing = h / (sides.right + 1);
      chairs.push({ x: cx + w / 2 + chairOffset, y: cy - h / 2 + spacing * (i + 1), angle: 90 });
    }
  }

  return chairs;
}

function distributeChairs(total: number, isRect: boolean) {
  if (total <= 2) return { top: 1, bottom: 1, left: 0, right: 0 };
  if (total <= 4) return { top: 1, bottom: 1, left: 1, right: 1 };
  if (total <= 6) {
    if (isRect) return { top: 2, bottom: 2, left: 1, right: 1 };
    return { top: 2, bottom: 2, left: 1, right: 1 };
  }
  if (total <= 8) return { top: 2, bottom: 2, left: 2, right: 2 };
  if (total <= 10) {
    if (isRect) return { top: 3, bottom: 3, left: 2, right: 2 };
    return { top: 3, bottom: 3, left: 2, right: 2 };
  }
  // 10+
  const perSide = Math.ceil(total / 4);
  const remainder = total - perSide * 4;
  return {
    top: perSide + (remainder > 0 ? 1 : 0),
    bottom: perSide + (remainder > 1 ? 1 : 0),
    left: perSide,
    right: perSide,
  };
}

// Single chair SVG — a small rounded rectangle with a backrest
function Chair({ x, y, angle, fill, stroke }: { x: number; y: number; angle: number; fill: string; stroke: string }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angle})`}>
      {/* Seat */}
      <rect x={-6} y={-4} width={12} height={10} rx={3} ry={3} fill={fill} stroke={stroke} strokeWidth={1} />
      {/* Backrest */}
      <rect x={-7} y={-7} width={14} height={4} rx={2} ry={2} fill={fill} stroke={stroke} strokeWidth={1} />
    </g>
  );
}

export function TableNode({ table, isSelected, onSelect, onDragStart }: TableNodeProps) {
  const colors = statusColors[table.status] ?? statusColors.empty;
  const cx = table.position_x + table.width / 2;
  const cy = table.position_y + table.height / 2;
  const actualH = table.shape === "rectangle" ? table.height * 0.55 : table.height;

  const chairs = getChairPositions(table.shape, table.capacity, cx, cy, table.width, table.height);

  return (
    <g
      style={{ cursor: "grab" }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(table.id);
        onDragStart(table.id, e);
      }}
    >
      {/* Selection highlight area */}
      {isSelected && (
        table.shape === "round" ? (
          <circle cx={cx} cy={cy} r={table.width / 2 + 28} fill="#a855f708" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="6 3" />
        ) : (
          <rect
            x={table.position_x - 28}
            y={cy - actualH / 2 - 28}
            width={table.width + 56}
            height={actualH + 56}
            rx={14}
            fill="#a855f708"
            stroke="#a855f7"
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
        )
      )}

      {/* Chairs */}
      {chairs.map((chair, i) => (
        <Chair key={i} x={chair.x} y={chair.y} angle={chair.angle} fill={colors.chairFill} stroke={colors.stroke} />
      ))}

      {/* Table surface */}
      {table.shape === "round" ? (
        <>
          {/* Shadow */}
          <ellipse cx={cx + 2} cy={cy + 3} rx={table.width / 2} ry={table.width / 2} fill="#00000008" />
          {/* Table */}
          <circle cx={cx} cy={cy} r={table.width / 2} fill={colors.tableFill} stroke={colors.stroke} strokeWidth={2} />
          {/* Inner ring (table edge detail) */}
          <circle cx={cx} cy={cy} r={table.width / 2 - 5} fill="none" stroke={colors.stroke} strokeWidth={0.5} opacity={0.3} />
        </>
      ) : (
        <>
          {/* Shadow */}
          <rect
            x={table.position_x + 2}
            y={cy - actualH / 2 + 3}
            width={table.width}
            height={actualH}
            rx={table.shape === "rectangle" ? 6 : 10}
            fill="#00000008"
          />
          {/* Table */}
          <rect
            x={table.position_x}
            y={cy - actualH / 2}
            width={table.width}
            height={actualH}
            rx={table.shape === "rectangle" ? 6 : 10}
            fill={colors.tableFill}
            stroke={colors.stroke}
            strokeWidth={2}
          />
          {/* Inner border (table edge detail) */}
          <rect
            x={table.position_x + 4}
            y={cy - actualH / 2 + 4}
            width={table.width - 8}
            height={actualH - 8}
            rx={table.shape === "rectangle" ? 3 : 7}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={0.5}
            opacity={0.2}
          />
        </>
      )}

      {/* Table name */}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#1a1127"
        fontSize={12}
        fontWeight={600}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {table.name}
      </text>

      {/* Capacity indicator */}
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#5c5470"
        fontSize={10}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        {table.capacity} {table.capacity === 1 ? "puesto" : "puestos"}
      </text>

      {/* Status dot */}
      <circle
        cx={table.shape === "round" ? cx + table.width / 2 - 4 : table.position_x + table.width - 8}
        cy={table.shape === "round" ? cy - table.width / 2 + 4 : cy - actualH / 2 + 8}
        r={5}
        fill={colors.stroke}
        stroke="#fff"
        strokeWidth={1.5}
      />
    </g>
  );
}

export { statusColors };
