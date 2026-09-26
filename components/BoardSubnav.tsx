import Link from "next/link";
import { ArrowLeft } from "@/components/icons";

/** Header for a board's supporting pages (members, history, settings). */
export default function BoardSubnav({
  boardId,
  boardTitle,
  current,
  isOwner,
}: {
  boardId: string;
  boardTitle: string;
  current: "members" | "history" | "settings";
  isOwner: boolean;
}) {
  const tabs = [
    { key: "members", label: "Members", href: `/boards/${boardId}/members` },
    { key: "history", label: "History", href: `/boards/${boardId}/history` },
    ...(isOwner ? [{ key: "settings", label: "Settings", href: `/boards/${boardId}/settings` }] : []),
  ];
  return (
    <div className="border-b border-border">
      <div className="page-container max-w-4xl pt-8">
        <Link
          href={`/boards/${boardId}`}
          className="inline-flex max-w-full items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          <span className="truncate">Back to {boardTitle}</span>
        </Link>
        <nav aria-label="Board pages" className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex w-max gap-6">
            {tabs.map((t) => (
              <li key={t.key}>
                <Link
                  href={t.href}
                  aria-current={current === t.key ? "page" : undefined}
                  className={`block border-b-2 pb-3 text-sm ${
                    current === t.key
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
