import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Logo from "@/components/Logo";
import { HandNote } from "@/components/paper";

export default async function Footer() {
  const user = await getCurrentUser();

  const columns = [
    {
      heading: "Research",
      links: [
        { href: "/explore", label: "Explore boards" },
        { href: "/search", label: "Search" },
        { href: user ? "/boards/new" : "/register", label: "Start a board" },
      ],
    },
    {
      heading: "Account",
      links: user
        ? [
            { href: "/dashboard", label: "Your desk" },
            { href: "/boards", label: "My boards" },
            { href: "/settings", label: "Settings" },
          ]
        : [
            { href: "/login", label: "Log in" },
            { href: "/register", label: "Create an account" },
          ],
    },
  ];

  return (
    <footer className="border-t border-foreground/15 bg-secondary">
      <div className="page-container grid gap-10 py-12 sm:grid-cols-[1.6fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            A research notebook for claims, sources and the evidence that connects them.
          </p>
          <HandNote className="mt-3 text-[16px]" tone="ink">
            show your working
          </HandNote>
        </div>
        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <p className="eyebrow">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="link-pencil text-sm text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-foreground/10">
        <p className="page-container py-5 font-tag text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Warrant. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
