import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBoardStats } from "@/lib/data";
import Board from "@/models/Boards";
import SiteShell from "@/components/SiteShell";
import BoardPreview from "@/components/BoardPreview";
import { BoardCard, toBoardSummary, type BoardSummary } from "@/components/BoardCard";
import { HandArrow, HandNote, Highlight, IndexCard, Squiggle } from "@/components/paper";
import { ToolSwatch } from "@/components/workspace/chrome";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: { absolute: "Warrant: think with evidence" },
  description:
    "Warrant is a research notebook for claims and evidence. Pin a claim to the page, add what you're reading, and draw the lines between them.",
};

const GLOSSARY = [
  { kind: "claim", term: "Claim", text: "The statement you want to test, written as one idea per card." },
  { kind: "source", term: "Source", text: "A paper, article, dataset or video, kept with its link and what it found." },
  { kind: "evidence", term: "Evidence", text: "The line from a source to a claim. It either supports it, challenges it, or adds context." },
  { kind: "note", term: "Note", text: "Loose thoughts and questions, stuck wherever they're useful." },
] as const;

const STEPS = [
  { n: "1", title: "Write the claim", text: "Put the thing you're unsure about on a card. Keep it short enough to be wrong." },
  { n: "2", title: "Pin what you read", text: "Add each source as you find it, with the one line that matters." },
  { n: "3", title: "Draw the lines", text: "Connect sources to claims. Green for support, red for challenges. The picture tells you where you stand." },
];

async function getPublicBoards(): Promise<BoardSummary[]> {
  try {
    await connectToDatabase();
    const boards = await Board.find({ isPublic: true })
      .populate("owner", "name username")
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();
    const stats = await getBoardStats(boards.map((b) => b._id as string));
    return boards.map((b) => toBoardSummary(b, stats.get(String(b._id))));
  } catch (error) {
    console.error("Failed to load public boards:", error);
    return [];
  }
}

export default async function Home() {
  const [user, publicBoards] = await Promise.all([getCurrentUser(), getPublicBoards()]);
  const primaryHref = user ? "/boards/new" : "/register";

  return (
    <SiteShell>
      {/* HERO */}
      <section className="page-container grid items-center gap-12 pb-16 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-24 lg:pt-20">
        <div>
          <h1 className="font-heading text-[2.9rem] leading-[1.02] tracking-[-0.02em] text-foreground sm:text-6xl lg:text-[4.4rem]">
            Think with <Highlight>evidence.</Highlight>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-foreground/85">
            Warrant is a research notebook. Pin a claim to the page, add what you&apos;re reading, and draw the lines: what backs it up, what
            cuts against it.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href={primaryHref} className={buttonVariants({ size: "lg" })}>
              Start a research board
            </Link>
            <Link href="/explore" className="link-pencil self-start text-[15px] font-medium text-primary sm:self-center">
              See other people&apos;s boards
            </Link>
          </div>
          <HandNote arrow="up" className="mt-4 hidden sm:inline-flex">
            free, and your first board takes a minute
          </HandNote>
        </div>
        <BoardPreview />
      </section>

      {/* WHAT GOES ON THE PAGE */}
      <section className="border-t border-foreground/15 bg-secondary/60 py-16 md:py-20">
        <div className="page-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="font-tag text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Page 2</p>
            <h2 className="mt-3 max-w-sm font-heading text-3xl leading-tight text-foreground sm:text-4xl">
              Everything on one page, and the lines between.
            </h2>
            <Squiggle width={140} className="mt-4 text-destructive" seed="glossary" />
            <p className="mt-4 max-w-sm text-muted-foreground">
              Most research tools are good at collecting. Warrant is for the part after that: working out what the pile actually says.
            </p>
          </div>
          <dl className="divide-y divide-rule border-y border-rule">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="grid grid-cols-[2.25rem_1fr] gap-x-4 py-4 sm:grid-cols-[2.25rem_8rem_1fr]">
                <span className="row-span-2 pt-1 sm:row-span-1">
                  <ToolSwatch kind={g.kind} />
                </span>
                <dt className="font-heading text-xl text-foreground">{g.term}</dt>
                <dd className="text-muted-foreground sm:pt-0.5">{g.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-foreground/15 py-16 md:py-24">
        <div className="page-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-heading text-3xl text-foreground sm:text-4xl">How Warrant works</h2>
            <HandNote className="hidden md:inline-flex" arrow="down-right" arrowPlacement="after">
              three steps, no setup
            </HandNote>
          </div>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <IndexCard seed={`step-${s.n}`} tilt={[-1.2, 0.8, -0.6][i]} className="h-full px-5 pb-6 pt-4">
                  <div className="flex items-baseline justify-between border-b border-destructive/45 pb-2">
                    <span className="font-hand text-4xl leading-none text-destructive">{s.n}</span>
                    <span className="font-tag text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Step {s.n} of 3</span>
                  </div>
                  <h3 className="mt-4 font-heading text-2xl text-foreground">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
                </IndexCard>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PUBLIC BOARDS */}
      <section className="border-t border-foreground/15 py-16 md:py-20">
        <div className="page-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-3xl text-foreground sm:text-4xl">On other people&apos;s desks</h2>
              <p className="mt-2 text-muted-foreground">Public boards, recently updated.</p>
            </div>
            <Link href="/explore" className="link-pencil text-[15px] font-medium text-primary">
              Explore all public boards
            </Link>
          </div>

          {publicBoards.length === 0 ? (
            <IndexCard seed="no-boards" className="mt-10 px-6 py-10 text-center">
              <p className="font-heading text-xl text-foreground">No public boards yet.</p>
              <p className="mt-1 text-muted-foreground">Publish yours and it will show up here.</p>
              <Link href={primaryHref} className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}>
                Start a board
              </Link>
            </IndexCard>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicBoards.map((b) => (
                <BoardCard key={b.id} board={b} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CLOSING */}
      <section className="paper-ruled border-t border-foreground/15 py-16 md:py-20">
        <div className="page-container flex flex-col items-start gap-6 pl-8 sm:pl-12 md:flex-row md:items-center md:justify-between">
          <h2 className="max-w-lg font-heading text-3xl leading-tight text-foreground sm:text-4xl">
            Next time someone asks <span className="whitespace-nowrap">&ldquo;says who?&rdquo;</span>, show them the page.
          </h2>
          <div className="flex items-center gap-3">
            <HandArrow dir="right" className="hidden text-destructive md:block" seed="closing" />
            <Link href={primaryHref} className={buttonVariants({ size: "lg" })}>
              Start a research board
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
