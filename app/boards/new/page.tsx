import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import SiteShell from "@/components/SiteShell";
import BoardForm from "@/components/BoardForm";

export const metadata: Metadata = {
  title: "Create a research board",
  description: "Start a new investigation and organize the evidence.",
};

export default async function NewBoardPage() {
  if (!(await getCurrentUser())) redirect("/login?callbackUrl=/boards/new");

  return (
    <SiteShell footer={false}>
      <div className="page-container max-w-xl py-8 sm:py-12">
        <Link href="/boards" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden />
          Back to boards
        </Link>
        <h1 className="mt-6 font-heading text-4xl text-foreground">Start a new board</h1>
        <p className="mt-2 text-muted-foreground">Start an investigation and organize the evidence.</p>
        <div className="mt-8">
          <BoardForm mode="create" cancelHref="/boards" />
        </div>
      </div>
    </SiteShell>
  );
}
