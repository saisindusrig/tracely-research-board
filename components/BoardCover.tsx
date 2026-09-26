import { handArrowhead, handConnector, seeded } from "@/lib/rough";

/**
 * A pencil sketch of a research graph on graph paper, generated from the
 * board id so every board gets a stable, distinct cover without an image.
 */
export default function BoardCover({ id, className = "" }: { id: string; className?: string }) {
  const rand = seeded(id);
  const claim = { x: 30 + rand() * 120, y: 14 + rand() * 12 };
  const count = 2 + Math.floor(rand() * 3);
  const sources = Array.from({ length: count }, (_, i) => ({
    x: 14 + (i * 232) / count + rand() * 18,
    y: 76 + rand() * 12,
    challenges: rand() > 0.7,
  }));
  const note = rand() > 0.4 ? { x: 214 + rand() * 30, y: 10 + rand() * 18, r: rand() * 8 - 4 } : null;

  return (
    <svg viewBox="0 0 280 120" className={`paper-graph block w-full ${className}`} aria-hidden preserveAspectRatio="xMidYMid slice">
      {sources.map((s, i) => {
        const c = handConnector(claim.x + 38, claim.y + 20, s.x + 26, s.y - 1, seeded(`${id}:${i}`));
        const tone = s.challenges ? "stroke-challenges" : "stroke-supports";
        return (
          <g key={`e${i}`} fill="none" strokeLinecap="round" className={tone}>
            <path d={c.d} strokeWidth="1.4" strokeDasharray={s.challenges ? "5 4" : undefined} />
            <path d={handArrowhead(s.x + 26, s.y - 1, c.endAngle, seeded(`${id}:h${i}`), 5)} strokeWidth="1.4" />
          </g>
        );
      })}
      <g transform={`rotate(${Math.round(rand() * 6 - 3)} ${claim.x + 38} ${claim.y + 10})`}>
        <rect x={claim.x} y={claim.y} width="76" height="21" rx="1" className="fill-card stroke-foreground" strokeWidth="1.2" />
        <path d={`M${claim.x + 5} ${claim.y + 6.5}h66`} className="stroke-destructive/70" strokeWidth="0.9" />
        <rect x={claim.x + 6} y={claim.y + 11} width="44" height="3.5" rx="1" className="fill-foreground/60" />
      </g>
      {sources.map((s, i) => (
        <g key={`s${i}`} transform={`rotate(${(i % 2 ? 1 : -1) * (1 + (i % 3))} ${s.x + 26} ${s.y + 8})`}>
          <rect x={s.x} y={s.y} width="52" height="17" rx="1" className="fill-card stroke-foreground/50" strokeWidth="1" />
          <rect x={s.x + 5} y={s.y + 6.5} width={16 + ((i * 7) % 18)} height="3" rx="1" className="fill-foreground/35" />
        </g>
      ))}
      {note && (
        <g transform={`rotate(${note.r} ${note.x + 20} ${note.y + 14})`}>
          <rect x={note.x} y={note.y} width="40" height="30" className="fill-accent stroke-[hsl(49_40%_62%)]" strokeWidth="1" />
          <rect x={note.x + 13} y={note.y - 3} width="14" height="6" className="fill-tape" />
        </g>
      )}
    </svg>
  );
}
