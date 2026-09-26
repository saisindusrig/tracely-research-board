/**
 * The home page "desk": a sheet of graph paper taped down, with a claim, two
 * sources, a sticky note and the evidence lines drawn between them. Desktop
 * shows the spatial layout; phones get a stacked version that stays legible.
 */
import { Check, X } from "@/components/icons";
import { HandArrow, HandCircle, IndexCard, Tape } from "@/components/paper";
import { handArrowhead, handConnector, seeded } from "@/lib/rough";

function Label({ kind, children }: { kind: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-destructive/45 pb-1">
      <span className="font-tag text-[10px] font-medium uppercase tracking-[0.14em] text-primary">{kind}</span>
      {children}
    </div>
  );
}

function Edge({ from, to, seed, tone }: { from: [number, number]; to: [number, number]; seed: string; tone: "supports" | "challenges" }) {
  const rand = seeded(seed);
  const c = handConnector(from[0], from[1], to[0], to[1], rand);
  const cls = tone === "supports" ? "stroke-supports" : "stroke-challenges";
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      <path d={c.d} strokeWidth={1.8} strokeDasharray={tone === "challenges" ? "7 5" : undefined} vectorEffect="non-scaling-stroke" />
      <path d={handArrowhead(to[0], to[1] - 2, c.endAngle, rand, 10)} strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
    </g>
  );
}

export default function BoardPreview() {
  return (
    <figure className="relative">
      {/* Desktop: the taped sheet */}
      <div className="paper-graph relative hidden aspect-[5/4] border border-border [box-shadow:4px_5px_0_hsl(var(--border))] md:block" style={{ transform: "rotate(0.8deg)" }}>
        <Tape seed="desk-a" className="left-[12%] -top-3" />
        <Tape seed="desk-b" className="left-[88%] -top-3" />

        <svg className="absolute inset-0 size-full" viewBox="0 0 500 400" preserveAspectRatio="none" aria-hidden>
          <Edge from={[215, 138]} to={[112, 250]} seed="hero-1" tone="supports" />
          <Edge from={[255, 138]} to={[372, 254]} seed="hero-2" tone="challenges" />
        </svg>

        <IndexCard seed="hero-claim" tilt={-1.2} className="absolute left-[24%] top-[9%] w-[46%] px-3.5 pb-3 pt-2">
          <Label kind="Claim · 01">
            <span className="font-hand text-[13px] text-muted-foreground">unverified</span>
          </Label>
          <p className="mt-2 font-heading text-[16px] leading-snug text-foreground">Losing sleep makes teenagers more anxious</p>
          <p className="mt-1.5 font-hand text-[14px] text-primary">#sleep #adolescents</p>
        </IndexCard>

        <span className="absolute left-[16%] top-[40%] inline-flex -rotate-3 items-center gap-1 bg-background px-1 font-hand text-[14px] text-supports">
          supports <Check className="size-3" />
        </span>
        <span className="absolute left-[64%] top-[40%] inline-flex rotate-2 items-center gap-1 bg-background px-1 font-hand text-[14px] text-challenges">
          challenges <X className="size-3" />
        </span>

        <IndexCard seed="hero-s1" tilt={0.9} className="absolute left-[5%] top-[63%] w-[36%] px-3 pb-2.5 pt-2">
          <Label kind="Paper · S01" />
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">Sleep diaries from students, followed for a year</p>
        </IndexCard>

        <IndexCard seed="hero-s2" tilt={-0.7} className="absolute right-[6%] top-[64%] w-[36%] px-3 pb-2.5 pt-2">
          <Label kind="Dataset · S02">
            <HandCircle tone="red" className="font-hand text-[12px] text-challenges">check n</HandCircle>
          </Label>
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">National survey: no link once screen time is controlled for</p>
        </IndexCard>

        <div className="absolute right-[3%] top-[6%] w-[20%] rotate-3 border border-[hsl(49_55%_70%)] bg-accent px-2.5 pb-2.5 pt-3 [box-shadow:2px_3px_0_hsl(49_40%_72%)]">
          <Tape seed="desk-note" className="w-10" />
          <p className="font-hand text-[13px] leading-snug text-accent-foreground">Is it sleep, or the phone keeping them up?</p>
        </div>
      </div>

      {/* Phones: a stacked version */}
      <div className="paper-graph relative border border-border p-4 pt-6 [box-shadow:3px_4px_0_hsl(var(--border))] md:hidden">
        <Tape seed="desk-m" />
        <IndexCard seed="hero-claim-m" tilt={-0.8} className="px-3.5 pb-3 pt-2">
          <Label kind="Claim · 01" />
          <p className="mt-2 font-heading text-[16px] leading-snug text-foreground">Losing sleep makes teenagers more anxious</p>
        </IndexCard>
        <div className="ml-7 flex h-11 items-center gap-2 border-l-2 border-supports pl-3">
          <span className="inline-flex items-center gap-1 font-hand text-[15px] text-supports">
            supports <Check className="size-3" />
          </span>
        </div>
        <IndexCard seed="hero-s1-m" tilt={0.6} className="px-3 pb-2.5 pt-2">
          <Label kind="Paper · S01" />
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">Sleep diaries from students, followed for a year</p>
        </IndexCard>
        <div className="ml-7 flex h-11 items-center gap-2 border-l-2 border-dashed border-challenges pl-3">
          <span className="inline-flex items-center gap-1 font-hand text-[15px] text-challenges">
            challenges <X className="size-3" />
          </span>
        </div>
        <IndexCard seed="hero-s2-m" tilt={-0.5} className="px-3 pb-2.5 pt-2">
          <Label kind="Dataset · S02" />
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">National survey: no link once screen time is controlled for</p>
        </IndexCard>
      </div>

      <figcaption className="mt-4 flex items-center gap-2 font-hand text-[16px] text-muted-foreground md:justify-end">
        <HandArrow dir="up" className="hidden h-8 w-6 md:block" seed="caption" />
        an example board: one claim, one source for, one against
      </figcaption>
    </figure>
  );
}
