import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import { HandNote } from "@/components/paper";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you were looking for doesn't exist or has moved.",
};

// A zig-zag bottom edge, like a page ripped out of a notebook.
const TORN =
  "polygon(0 0, 100% 0, 100% 92%, 96% 97%, 91% 93%, 86% 99%, 80% 94%, 74% 98%, 68% 93%, 61% 99%, 55% 94%, 49% 98%, 43% 93%, 37% 99%, 31% 94%, 25% 98%, 19% 93%, 13% 99%, 7% 94%, 3% 98%, 0 94%)";

export default function NotFound() {
  return (
    <SiteShell>
      <div className="page-container flex flex-col items-center py-16 sm:py-24">
        <div
          className="paper-ruled w-full max-w-lg -rotate-1 border-x border-t border-border px-8 pb-14 pt-8 pl-14 [filter:drop-shadow(3px_4px_0_hsl(var(--border)))]"
          style={{ clipPath: TORN }}
        >
          <p className="font-tag text-sm font-medium tracking-[0.14em] text-destructive">404</p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-foreground">This page was torn out.</h1>
          <p className="mt-3 text-foreground/80">
            The link may be broken, or the board may have been deleted or made private.
          </p>
          <HandNote className="mt-4">it happens to the best notebooks</HandNote>
        </div>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/" className={buttonVariants()}>
            Go home
          </Link>
          <Link href="/explore" className={buttonVariants({ variant: "outline" })}>
            Explore research
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
