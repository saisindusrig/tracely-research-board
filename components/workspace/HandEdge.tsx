"use client";

import { BaseEdge, EdgeLabelRenderer, type Edge, type EdgeProps } from "@xyflow/react";
import { Check, Minus, X } from "@/components/icons";
import { handArrowhead, handConnector, seeded } from "@/lib/rough";
import type { Relationship } from "@/lib/constants";

export type HandEdgeData = { relationship: Relationship; onSelect: (id: string) => void };
export type HandEdgeType = Edge<HandEdgeData, "hand">;

const STYLE: Record<Relationship, { stroke: string; dash?: string; text: string; label: string; Icon: typeof Check }> = {
  SUPPORTS: { stroke: "hsl(var(--supports))", text: "text-supports", label: "supports", Icon: Check },
  CHALLENGES: { stroke: "hsl(var(--challenges))", dash: "7 5", text: "text-challenges", label: "challenges", Icon: X },
  CONTEXT: { stroke: "hsl(var(--context))", dash: "1.5 5", text: "text-context", label: "context", Icon: Minus },
};

/**
 * Evidence drawn like an ink line between two index cards: a slightly
 * irregular curve, a pencil overstroke, a hand-drawn arrowhead and a
 * handwritten label. Green for support, red dashes for challenges.
 */
export default function HandEdge({ id, sourceX, sourceY, targetX, targetY, data, selected }: EdgeProps<HandEdgeType>) {
  const rel = data?.relationship ?? "CONTEXT";
  const s = STYLE[rel];
  const rand = seeded(id);
  const { d, mid, endAngle } = handConnector(sourceX, sourceY, targetX, targetY, rand);
  // A second, fainter pass slightly offset, like going over a pencil line twice.
  const over = handConnector(sourceX + 0.8, sourceY, targetX - 0.6, targetY, seeded(`${id}:over`)).d;
  const head = handArrowhead(targetX, targetY - 2, endAngle, rand, 9);
  const width = selected ? 2.6 : 1.8;

  return (
    <>
      <path d={over} fill="none" stroke={s.stroke} strokeOpacity={0.35} strokeWidth={1} strokeDasharray={s.dash} />
      <BaseEdge
        id={id}
        path={d}
        interactionWidth={26}
        className="hand-edge-path"
        style={{ stroke: s.stroke, strokeWidth: width, strokeDasharray: s.dash, strokeLinecap: "round" }}
      />
      <path d={head} fill="none" stroke={s.stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={() => data?.onSelect(id)}
          className={`nodrag nopan absolute inline-flex items-center gap-1 rounded-sm bg-background px-1.5 font-hand text-[15px] leading-6 ${s.text} ${
            selected ? "ring-2 ring-highlighter" : "hover:bg-card"
          }`}
          style={{ transform: `translate(-50%, -50%) translate(${mid.x}px, ${mid.y}px) rotate(-2deg)`, pointerEvents: "all" }}
          aria-label={`Evidence: ${s.label}`}
        >
          {s.label}
          <s.Icon className="size-3.5" />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
