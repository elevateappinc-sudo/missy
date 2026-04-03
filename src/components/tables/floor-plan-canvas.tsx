"use client";

import { useRef, useState, useCallback } from "react";
import { TableNode } from "./table-node";
import type { Table } from "@/types";

interface FloorPlanCanvasProps {
  tables: Table[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, y: number) => void;
}

const CANVAS_W = 1200;
const CANVAS_H = 800;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2;

export function FloorPlanCanvas({ tables, selectedId, onSelect, onMove }: FloorPlanCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  // Convert screen coords to SVG coords
  const screenToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / scale,
        y: (clientY - rect.top - pan.y) / scale,
      };
    },
    [scale, pan]
  );

  // Zoom with wheel
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * delta)));
    },
    []
  );

  // Start dragging a table
  const handleDragStart = useCallback(
    (id: string, e: React.PointerEvent) => {
      const table = tables.find((t) => t.id === id);
      if (!table) return;
      const pos = screenToSvg(e.clientX, e.clientY);
      setDragging({
        id,
        offsetX: pos.x - table.position_x,
        offsetY: pos.y - table.position_y,
      });
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [tables, screenToSvg]
  );

  // Pointer move — drag table or pan canvas
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging) {
        const pos = screenToSvg(e.clientX, e.clientY);
        const newX = Math.max(0, Math.min(CANVAS_W - 50, pos.x - dragging.offsetX));
        const newY = Math.max(0, Math.min(CANVAS_H - 50, pos.y - dragging.offsetY));
        onMove(dragging.id, Math.round(newX), Math.round(newY));
      } else if (panning) {
        setPan({
          x: panning.panX + (e.clientX - panning.startX),
          y: panning.panY + (e.clientY - panning.startY),
        });
      }
    },
    [dragging, panning, screenToSvg, onMove]
  );

  // End drag or pan
  const handlePointerUp = useCallback(() => {
    setDragging(null);
    setPanning(null);
  }, []);

  // Start panning (click on background)
  const handleBgPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only pan if clicking on the SVG background directly
      if (e.target === svgRef.current || (e.target as Element).classList.contains("canvas-bg")) {
        onSelect(null);
        setPanning({
          startX: e.clientX,
          startY: e.clientY,
          panX: pan.x,
          panY: pan.y,
        });
      }
    },
    [pan, onSelect]
  );

  return (
    <svg
      ref={svgRef}
      className="w-full h-full rounded-[16px] border border-border-light bg-bg-warm/30"
      onWheel={handleWheel}
      onPointerDown={handleBgPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: "none" }}
    >
      {/* Grid pattern */}
      <defs>
        <pattern id="grid" width={40 * scale} height={40 * scale} patternUnits="userSpaceOnUse">
          <path
            d={`M ${40 * scale} 0 L 0 0 0 ${40 * scale}`}
            fill="none"
            stroke="#e8e0f0"
            strokeWidth={0.5}
          />
        </pattern>
      </defs>

      {/* Background with grid */}
      <rect
        className="canvas-bg"
        width="100%"
        height="100%"
        fill="url(#grid)"
        style={{ cursor: panning ? "grabbing" : "default" }}
      />

      {/* Transformed group for pan & zoom */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
        {/* Canvas boundary hint */}
        <rect
          x={0}
          y={0}
          width={CANVAS_W}
          height={CANVAS_H}
          fill="none"
          stroke="#e8e0f0"
          strokeWidth={1}
          strokeDasharray="8 4"
          rx={16}
        />

        {/* Tables */}
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            isSelected={selectedId === table.id}
            onSelect={onSelect}
            onDragStart={handleDragStart}
          />
        ))}
      </g>

      {/* Zoom indicator */}
      <text x={12} y={24} fill="#9a8fad" fontSize={12} fontFamily="monospace">
        {Math.round(scale * 100)}%
      </text>
    </svg>
  );
}
