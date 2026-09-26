import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBoardStats } from "@/lib/data";
import { plural } from "@/lib/format";
import Board from "@/models/Boards";
import User from "@/models/User";
import SiteShell from "@/components/SiteShell";
import Avatar from "@/components/Avatar";
import { BoardCard, toBoardSummary } from "@/components/BoardCard";
import { buttonVariants } from "@/components/ui/button";

type ProfileUser = { _id: object; name: string; username: string; bio?: string; image?: string };

const getProfile = cache(async (username: string) => {
  await connectToDatabase();
  return User.findOne({ username: username.toLowerCase() })
    .select("name username bio image")
    .lean<ProfileUser | null>();
});

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await getProfile(username);
  if (!user) return { title: "Researcher not found" };
  return {
    title: `${user.name} (@${user.username})`,
    description: user.bio || `Public research boards by ${user.name} on Warrant.`,
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await getProfile(username);
  if (!user) notFound();

  const viewer = await getCurrentUser();
  const isSelf = viewer?.id === String(user._id);

  // Private boards never appear on a profile, even to the owner.
  const docs = await Board.find({ owner: user._id, isPublic: true })
    .populate("owner", "name username")
    .sort({ updatedAt: -1 })
    .lean();
  const stats = await getBoardStats(docs.map((b) => b._id as string));
  const boards = docs.map((b) => toBoardSummary(b, stats.get(String(b._id))));
  const totals = boards.reduce(
    (acc, b) => ({ claims: acc.claims + b.stats.claims, sources: acc.sources + b.stats.sources }),
    { claims: 0, sources: 0 }
  );

  return (
    <SiteShell>
      <section className="border-b border-border">
        <div className="page-container flex flex-col items-center py-12 text-center sm:py-16">
          <Avatar name={user.name} image={user.image} size="lg" />
          <h1 className="mt-4 font-heading text-3xl text-foreground">{user.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>
          {user.bio && <p className="mt-3 max-w-md text-foreground/85">{user.bio}</p>}
          <p className="mt-4 text-sm text-muted-foreground">
            {plural(boards.length, "public board")} · {plural(totals.sources, "source")} · {plural(totals.claims, "claim")}
          </p>
          {isSelf && (
            <Link href="/settings" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-5" })}>
              Edit profile
            </Link>
          )}
        </div>
      </section>

      <section className="page-container py-10 sm:py-12">
        <h2 className="font-heading text-2xl text-foreground">Research</h2>
        {boards.length === 0 ? (
          <p className="mt-4 text-muted-foreground">
            {isSelf ? "You haven't published any boards yet. Make a board public from its settings." : `${user.name} hasn't published any boards yet.`}
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((b) => (
              <BoardCard key={b.id} board={b} showOwner={false} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}
