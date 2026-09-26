import Logo from "@/components/Logo";
import { HandNote, IndexCard, Tape } from "@/components/paper";

/** Focused frame for log in and sign up: one card taped to a ruled page. */
export default function AuthLayout({
  title,
  subtitle,
  note,
  children,
}: {
  title: string;
  subtitle: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="paper-ruled flex min-h-dvh flex-col items-center px-4 pb-12 pt-8 sm:justify-center sm:pt-12">
      <Logo className="mb-8" />
      <IndexCard seed={title} tilt={-0.4} className="w-full max-w-sm px-6 pb-7 pt-8 sm:px-8">
        <Tape seed={`${title}-tape`} />
        <div className="mb-7 text-center">
          <h1 className="font-heading text-3xl text-foreground">{title}</h1>
          <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </IndexCard>
      {note && (
        <HandNote className="mt-6 rotate-[-2deg]" tone="ink">
          {note}
        </HandNote>
      )}
    </main>
  );
}
