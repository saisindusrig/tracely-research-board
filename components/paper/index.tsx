// The "field notebook" building blocks: index cards, tape, handwritten notes,
// highlighter and pencil circles. All shapes are seeded (see lib/rough.ts), so
// they look hand-made but render identically on server and client.
import { cn } from "cn";
import { handArrowhead, handEllipse, handHighlight, handSquiggle, seeded, tiltFor } from "@/lib/rough";

/** A paper index card with a hard shadow and a slight, stable tilt. */
export function IndexCard({
  seed,
  tilt = true,
  lift = false,
  className,
  children,
  as: Tag = "div",
}: {
  seed: string;
  tilt?: boolean | number;
  lift?: boolean;
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "section" | "li";
}) {
  const deg = tilt === false ? 0 : typeof tilt === "number" ? tilt : tiltFor(seed);
  return (
    <Tag className={cn("index-card relative", lift && "index-card-lift", className)} style={deg ? { transform: `rotate(${deg}deg)` } : undefined}>
      {children}
    </Tag>
  );
}

/** A strip of masking tape, positioned by the parent (defaults to top center). */
export function Tape({ className, seed = "tape" }: { className?: string; seed?: string }) {
  const rand = seeded(seed);
  const deg = Math.round((rand() * 8 - 4) * 10) / 10;
  return (
    <span
      aria-hidden
      className={cn("pointer-events-none absolute -top-2.5 left-1/2 h-5 w-16 bg-tape/85", className)}
      style={{
        transform: `translateX(-50%) rotate(${deg}deg)`,
        clipPath: "polygon(2% 10%, 8% 0, 16% 8%, 26% 0, 38% 6%, 50% 0, 62% 7%, 74% 0, 86% 6%, 94% 0, 100% 12%, 98% 90%, 92% 100%, 82% 92%, 70% 100%, 58% 93%, 46% 100%, 34% 92%, 22% 100%, 10% 93%, 0 100%)",
      }}
    />
  );
}

type ArrowDir = "left" | "right" | "down" | "up" | "down-left" | "down-right";

// Each arrow has its own drawing box so it never gets squashed.
const ARROWS: Record<ArrowDir, { d: string; head: [number, number, number]; view: string; box: string }> = {
  left: { d: "M54 22 C 40 12, 22 12, 6 20", head: [6, 20, Math.PI * 0.95], view: "0 0 60 36", box: "w-14 h-8" },
  right: { d: "M4 20 C 20 10, 38 10, 54 20", head: [54, 20, 0.05], view: "0 0 60 36", box: "w-14 h-8" },
  down: { d: "M16 4 C 6 18, 8 30, 18 40", head: [18, 40, Math.PI * 0.38], view: "0 0 32 46", box: "w-7 h-10" },
  up: { d: "M18 42 C 8 30, 6 18, 16 5", head: [16, 5, -Math.PI * 0.42], view: "0 0 32 46", box: "w-7 h-10" },
  "down-left": { d: "M52 4 C 44 22, 26 32, 8 34", head: [8, 34, Math.PI * 0.97], view: "0 0 60 40", box: "w-14 h-10" },
  "down-right": { d: "M6 4 C 14 22, 32 32, 50 34", head: [50, 34, 0.05], view: "0 0 60 40", box: "w-14 h-10" },
};

/** A hand-drawn arrow, for pointing a margin note at something. */
export function HandArrow({ dir = "left", className, seed = "arrow" }: { dir?: ArrowDir; className?: string; seed?: string }) {
  const a = ARROWS[dir];
  const rand = seeded(seed);
  return (
    <svg viewBox={a.view} aria-hidden className={cn("shrink-0 overflow-visible", a.box, className)} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={a.d} />
      <path d={handArrowhead(a.head[0], a.head[1], a.head[2], rand, 8)} />
    </svg>
  );
}

/** A red-pencil note in the margin, optionally with an arrow. */
export function HandNote({
  children,
  arrow,
  arrowPlacement = "before",
  tone = "red",
  className,
}: {
  children: React.ReactNode;
  arrow?: ArrowDir;
  arrowPlacement?: "before" | "after";
  tone?: "red" | "ink" | "green";
  className?: string;
}) {
  const color = { red: "text-destructive", ink: "text-primary", green: "text-supports" }[tone];
  const arrowEl = arrow ? <HandArrow dir={arrow} seed={String(children)} /> : null;
  return (
    <span className={cn("inline-flex items-center gap-1 font-hand text-[17px] leading-tight", color, className)}>
      {arrowPlacement === "before" && arrowEl}
      <span>{children}</span>
      {arrowPlacement === "after" && arrowEl}
    </span>
  );
}

/** A highlighter swipe behind inline text. */
export function Highlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const d = handHighlight(100, 20, seeded(`hl:${String(children)}`));
  return (
    <span className={cn("relative isolate inline-block whitespace-nowrap px-0.5", className)}>
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden className="absolute inset-x-[-4px] inset-y-0 -z-10 h-full w-[calc(100%+8px)]">
        <path d={d} className="fill-highlighter" />
      </svg>
      {children}
    </span>
  );
}

/** A loose pencil loop drawn around inline content, like circling a word. */
export function HandCircle({
  children,
  tone = "ink",
  className,
}: {
  children: React.ReactNode;
  tone?: "ink" | "green" | "red" | "pencil";
  className?: string;
}) {
  const stroke = { ink: "stroke-primary", green: "stroke-supports", red: "stroke-challenges", pencil: "stroke-muted-foreground" }[tone];
  const d = handEllipse(50, 20, 47, 17, seeded(`circle:${String(children)}`));
  return (
    <span className={cn("relative inline-block px-2 py-0.5", className)}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute -inset-x-1 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+8px)] overflow-visible">
        <path d={d} fill="none" className={stroke} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      {children}
    </span>
  );
}

/** A pencil squiggle line, e.g. under a heading. */
export function Squiggle({ width = 120, className, seed = "squiggle" }: { width?: number; className?: string; seed?: string }) {
  return (
    <svg viewBox={`0 0 ${width} 6`} width={width} height={6} aria-hidden className={cn("overflow-visible", className)}>
      <path d={handSquiggle(width, seeded(seed))} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
