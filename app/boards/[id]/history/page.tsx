import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getBoardAccess } from "@/lib/permissions";
import { describeActivity } from "@/lib/activity";
import { clockTime, dayHeading } from "@/lib/format";
import Activity from "@/models/Activity";
import SiteShell from "@/components/SiteShell";
import BoardSubnav from "@/components/BoardSubnav";

export const metadata: Metadata = {
  title: "Research history",
  description: "Every change made to this board, newest first.",
};

const FILTERS = [
  { key: "all", label: "All activity" },
  { key: "claim", label: "Claims" },
  { key: "source", label: "Sources" },
  { key: "evidence", label: "Evidence" },
  { key: "comments", label: "Comments" },
] as const;

type Row = {
  _id: object;
  actor?: { _id: object; name?: string };
  verb: string;
  targetType: string;
  targetTitle?: string;
  createdAt: Date;
};

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ id }, { filter: rawFilter }] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  const access = await getBoardAccess(id, user?.id);
  if (!access) notFound();
  if (!access.canView) {
    if (!user) redirect(`/login?callbackUrl=/boards/${id}/history`);
    notFound();
  }

  const filter = FILTERS.find((f) => f.key === rawFilter)?.key ?? "all";
  const query: Record<string, unknown> = { boardId: id };
  if (filter === "comments") query.verb = "commented";
  else if (filter !== "all") query.targetType = filter;

  const rows = await Activity.find(query).sort({ createdAt: -1 }).limit(200).populate("actor", "name").lean<Row[]>();

  const groups: { day: string; items: Row[] }[] = [];
  for (const row of rows) {
    const day = dayHeading(row.createdAt);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(row);
    else groups.push({ day, items: [row] });
  }

  return (
    <SiteShell>
      <BoardSubnav boardId={id} boardTitle={access.board.title} current="history" isOwner={access.isOwner} />
      <div className="page-container max-w-4xl py-10">
        <h1 className="font-heading text-2xl text-foreground">Research history</h1>

        <nav aria-label="Filter history" className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? `/boards/${id}/history` : `/boards/${id}/history?filter=${f.key}`}
                aria-current={filter === f.key ? "true" : undefined}
                className={`inline-flex h-9 items-center rounded-sm border px-3.5 text-sm whitespace-nowrap ${
                  filter === f.key
                    ? "border-foreground bg-card text-foreground [box-shadow:2px_2px_0_hsl(var(--foreground))]"
                    : "border-border bg-secondary/70 text-foreground hover:border-input hover:bg-card"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </nav>

        {groups.length === 0 ? (
          <p className="mt-10 text-muted-foreground">Nothing here yet.</p>
        ) : (
          <div className="mt-10 space-y-10">
            {groups.map((g) => (
              <section key={g.day}>
                <h2 className="eyebrow">{g.day}</h2>
                <ol className="mt-4 border-l border-border">
                  {g.items.map((a) => (
                    <li key={String(a._id)} className="relative pb-5 pl-6 last:pb-0">
                      <span aria-hidden className="absolute -left-[5px] top-1.5 size-[9px] rounded-full border-2 border-background bg-primary" />
                      <p className="text-foreground">
                        <span className="font-medium">
                          {String(a.actor?._id) === user?.id ? "You" : (a.actor?.name ?? "Someone")}
                        </span>{" "}
                        {describeActivity(a)}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{clockTime(a.createdAt)}</p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
