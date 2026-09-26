import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBoardStats } from "@/lib/data";
import { describeActivity } from "@/lib/activity";
import { plural, timeAgo } from "@/lib/format";
import Board from "@/models/Boards";
import Activity from "@/models/Activity";
import SiteShell from "@/components/SiteShell";
import Greeting from "@/components/Greeting";
import { toBoardSummary } from "@/components/BoardCard";
import { buttonVariants } from "@/components/ui/button";
import { HandNote, IndexCard } from "@/components/paper";

export const metadata: Metadata = {
  title: "Your desk",
  description: "Pick up your research where you left off.",
};

type ActivityRow = {
  _id: object;
  actor?: { _id: object; name?: string };
  boardId?: { _id: object; title?: string };
  verb: string;
  targetType: string;
  targetTitle?: string;
  createdAt: Date;
};

function daysAgo(days: number) {
  return new Date(Date.now() - days * 864e5);
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/dashboard");

  await connectToDatabase();
  const docs = await Board.find({ $or: [{ owner: user.id }, { "members.user": user.id }] })
    .sort({ updatedAt: -1 })
    .lean();
  const boardIds = docs.map((b) => b._id as string);

  const [stats, activity, myActivityCount] = await Promise.all([
    getBoardStats(boardIds),
    Activity.find({ boardId: { $in: boardIds } })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("actor", "name")
      .populate("boardId", "title")
      .lean<ActivityRow[]>(),
    Activity.countDocuments({ actor: user.id, createdAt: { $gte: daysAgo(30) } }),
  ]);

  const boards = docs.map((b) => toBoardSummary(b, stats.get(String(b._id))));
  const totals = boards.reduce(
    (acc, b) => ({ claims: acc.claims + b.stats.claims, sources: acc.sources + b.stats.sources }),
    { claims: 0, sources: 0 }
  );
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <SiteShell>
      <div className="page-container py-10 sm:py-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Your desk</p>
            <h1 className="mt-2 font-heading text-4xl text-foreground sm:text-5xl">
              <Greeting name={firstName} />
            </h1>
            <HandNote className="mt-2">pick up where you left off</HandNote>
          </div>
          <Link href="/boards/new" className={buttonVariants()}>
            <Plus aria-hidden />
            New board
          </Link>
        </div>

        {boards.length === 0 ? (
          <IndexCard as="section" seed="first-board" tilt={-0.6} className="mt-12 p-6 sm:p-10">
            <h2 className="font-heading text-3xl text-foreground">Start your first investigation</h2>
            <ol className="mt-5 space-y-3 text-foreground/85">
              <li><span className="mr-3 font-hand text-xl text-destructive">1</span>Create a board for the question you&apos;re exploring.</li>
              <li><span className="mr-3 font-hand text-xl text-destructive">2</span>Add a claim, then the sources you&apos;re reading.</li>
              <li><span className="mr-3 font-hand text-xl text-destructive">3</span>Connect each source as support, challenge or context.</li>
            </ol>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/boards/new" className={buttonVariants()}>
                Create a board
              </Link>
              <Link href="/explore" className={buttonVariants({ variant: "outline" })}>
                See how others research
              </Link>
            </div>
          </IndexCard>
        ) : (
          <>
            {/* RECENT BOARDS */}
            <section className="mt-12 border-t border-foreground/15 pt-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-heading text-xl text-foreground">Recent boards</h2>
                <Link href="/boards" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  All boards →
                </Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {boards.slice(0, 6).map((b) => (
                  <IndexCard key={b.id} as="article" seed={b.id} lift className="group flex min-h-40 flex-col px-5 pb-4 pt-3">
                    <p className="border-b border-destructive/40 pb-1.5 font-tag text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {b.isPublic ? "Public" : "Private"} board
                    </p>
                    <h3 className="mt-3 font-heading text-xl leading-snug text-foreground">
                      <Link href={`/boards/${b.id}`} className="after:absolute after:inset-0">
                        <span className="link-pencil group-hover:[background-size:14px_6px]">{b.title}</span>
                      </Link>
                    </h3>
                    <p className="mt-auto pt-6 font-tag text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      {plural(b.stats.claims, "claim")} · {plural(b.stats.sources, "source")}
                    </p>
                    <p className="mt-0.5 font-hand text-[15px] text-muted-foreground">updated {timeAgo(b.updatedAt)}</p>
                  </IndexCard>
                ))}
              </div>
            </section>

            <div className="mt-14 grid gap-12 border-t border-foreground/15 pt-8 lg:grid-cols-[1.6fr_1fr]">
              {/* RECENT ACTIVITY */}
              <section>
                <h2 className="font-heading text-xl text-foreground">Recent activity</h2>
                {activity.length === 0 ? (
                  <p className="mt-4 text-muted-foreground">No activity yet.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-rule border-y border-rule">
                    {activity.map((a) => {
                      const isMe = String(a.actor?._id) === user.id;
                      return (
                        <li key={String(a._id)} className="py-3">
                          <p className="text-foreground">
                            <span className="font-medium">{isMe ? "You" : (a.actor?.name ?? "Someone")}</span>{" "}
                            {describeActivity(a)}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {a.boardId && (
                              <Link href={`/boards/${a.boardId._id}`} className="link-pencil">
                                {a.boardId.title}
                              </Link>
                            )}{" "}
                            · {timeAgo(a.createdAt)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* YOUR RESEARCH */}
              <section>
                <h2 className="font-heading text-xl text-foreground">Your research</h2>
                <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border [box-shadow:var(--shadow-paper)]">
                  {[
                    { label: "Boards", value: boards.length },
                    { label: "Claims", value: totals.claims },
                    { label: "Sources", value: totals.sources },
                    { label: "Your actions, 30 days", value: myActivityCount },
                  ].map((s) => (
                    <div key={s.label} className="bg-card p-4">
                      <dt className="text-xs text-muted-foreground">{s.label}</dt>
                      <dd className="mt-1 font-heading text-3xl text-foreground">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </>
        )}
      </div>
    </SiteShell>
  );
}
