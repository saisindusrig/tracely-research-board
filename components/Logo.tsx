import Link from "next/link";
import { cn } from "cn";

/**
 * The Warrant mark: an index card with a hand-drawn tick. In argument theory
 * the "warrant" is what connects evidence to a claim; the tick is that link.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={cn("size-6 shrink-0 overflow-visible", className)}>
      <rect x="3.5" y="6" width="19" height="15" rx="1.2" transform="rotate(-5 13 13.5)" className="fill-card stroke-foreground" strokeWidth="1.6" />
      <path d="M6.6 11.2c3.4-.3 6.8-.3 10.2-.1" transform="rotate(-5 13 13.5)" className="stroke-destructive" strokeWidth="1.1" strokeLinecap="round" fill="none" />
      <path d="M9.4 16.4c1.5 1.1 2.8 2.4 3.9 4 3.2-6 7.3-11.2 12.3-15.6" className="stroke-primary" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** The wordmark. Always a link home. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Warrant home"
      className={cn("inline-flex items-center gap-2 rounded-sm font-heading text-[22px] font-medium leading-none tracking-[-0.01em] text-foreground", className)}
    >
      <LogoMark />
      Warrant
    </Link>
  );
}
