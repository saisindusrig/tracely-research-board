"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { HandNote } from "@/components/paper";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="paper-ruled flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-10 font-heading text-4xl text-foreground">The ink smudged.</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Something went wrong loading this page. Try again in a moment.
      </p>
      <HandNote className="mt-3">not your fault</HandNote>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Go home
        </Link>
      </div>
    </main>
  );
}
