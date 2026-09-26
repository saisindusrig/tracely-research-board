"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Minus, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/Avatar";
import { toast } from "@/components/Toaster";
import { addComment, deleteItem, updateItem } from "@/lib/actions/items";
import { CLAIM_STATUSES, type ClaimStatus, type Relationship } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { REL_LABEL } from "./forms";
import type { BoardData, CardType, Compose, Permissions, Selection } from "./types";

const REL_ICON: Record<Relationship, React.ReactNode> = {
  SUPPORTS: <Check className="size-3.5 text-supports" aria-hidden />,
  CHALLENGES: <X className="size-3.5 text-challenges" aria-hidden />,
  CONTEXT: <Minus className="size-3.5 text-context" aria-hidden />,
};

const TYPE_NOUN: Record<CardType, string> = { claim: "claim", source: "source", note: "note", evidence: "evidence link" };

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-5 py-5">
      <h3 className="eyebrow">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function DetailPanel({
  boardId,
  selection,
  data,
  perms,
  onSelect,
  onCompose,
  onClose,
}: {
  boardId: string;
  selection: NonNullable<Selection>;
  data: BoardData;
  perms: Permissions;
  onSelect: (s: Selection) => void;
  onCompose: (c: Compose) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { type, id } = selection;

  const claim = type === "claim" ? data.claims.find((c) => c.id === id) : undefined;
  const source = type === "source" ? data.sources.find((s) => s.id === id) : undefined;
  const note = type === "note" ? data.notes.find((n) => n.id === id) : undefined;
  const evidence = type === "evidence" ? data.evidence.find((e) => e.id === id) : undefined;
  const item = claim ?? source ?? note ?? evidence;

  if (!item) {
    return (
      <div className="p-5">
        <p className="text-sm text-muted-foreground">This card was removed.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  const claimById = new Map(data.claims.map((c) => [c.id, c]));
  const sourceById = new Map(data.sources.map((s) => [s.id, s]));
  const comments = data.comments.filter((c) => c.targetId === id);

  const remove = async () => {
    if (!window.confirm(`Remove this ${TYPE_NOUN[type]}? ${type === "claim" || type === "source" ? "Its evidence links and comments go too." : ""}`)) return;
    setBusy(true);
    const res = await deleteItem(boardId, type, id);
    setBusy(false);
    if (res.ok) {
      toast(`${TYPE_NOUN[type][0].toUpperCase()}${TYPE_NOUN[type].slice(1)} removed.`);
      onClose();
    } else toast(res.error, "error");
  };

  const setStatus = async (status: ClaimStatus) => {
    const res = await updateItem(boardId, "claim", id, { status });
    if (res.ok) toast(`Marked as ${status.toLowerCase()}.`);
    else toast(res.error, "error");
  };

  // Evidence attached to this claim or source.
  const links = data.evidence.filter((e) => (claim ? e.claimId === id : source ? e.sourceId === id : false));

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="pb-5 pl-5 pr-14 pt-5">
        <div className="flex items-center justify-between gap-3 border-b border-destructive/40 pb-2">
          <span className="font-tag text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
            {source ? source.sourceType : type}
          </span>
          {claim &&
            (perms.canEdit ? (
              <>
                <label htmlFor="claim-status" className="sr-only">
                  Status
                </label>
                <select
                  id="claim-status"
                  value={claim.status}
                  onChange={(e) => setStatus(e.target.value as ClaimStatus)}
                  className="h-8 rounded-sm border border-input bg-card px-2 text-xs text-foreground"
                >
                  {CLAIM_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s[0] + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{claim.status.toLowerCase()}</span>
            ))}
        </div>

        {claim && <h2 className="mt-3 font-heading text-2xl leading-snug text-foreground">{claim.title}</h2>}
        {source && <h2 className="mt-3 text-lg font-medium leading-snug text-foreground">{source.title}</h2>}
        {note && <p className="mt-3 whitespace-pre-wrap font-hand text-[19px] leading-snug text-foreground">{note.content}</p>}
        {evidence && (
          <div className="mt-3 space-y-2 text-sm">
            <button type="button" onClick={() => onSelect({ type: "source", id: evidence.sourceId })} className="block text-left font-medium text-foreground link-pencil">
              {sourceById.get(evidence.sourceId)?.title ?? "Removed source"}
            </button>
            <p className={`flex items-center gap-1.5 font-tag text-xs font-medium uppercase tracking-[0.12em] ${REL_LABEL[evidence.relationship].cls}`}>
              {REL_ICON[evidence.relationship]}
              {REL_LABEL[evidence.relationship].label}
            </p>
            <button type="button" onClick={() => onSelect({ type: "claim", id: evidence.claimId })} className="block text-left font-heading text-base text-foreground link-pencil">
              {claimById.get(evidence.claimId)?.title ?? "Removed claim"}
            </button>
          </div>
        )}

        {claim?.tags.length ? (
          <p className="mt-3 flex flex-wrap gap-x-2 font-hand text-[16px] text-primary">
            {claim.tags.map((t) => (
              <span key={t}>#{t}</span>
            ))}
          </p>
        ) : null}

        {source?.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex max-w-full items-center gap-1 text-sm font-medium text-primary link-pencil"
          >
            <span className="truncate">{hostname(source.url)}</span>
            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden />
          </a>
        )}

        {"createdAt" in item && (
          <p className="mt-3 text-xs text-muted-foreground" suppressHydrationWarning>
            {item.authorName ? `Added by ${item.authorName} · ` : "Added "}
            {timeAgo(item.createdAt)}
          </p>
        )}

        {perms.canEdit && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onCompose({ kind: type, editId: id } as Compose)}>
              Edit
            </Button>
            {(claim || source) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCompose({ kind: "evidence", claimId: claim?.id, sourceId: source?.id })}
              >
                Connect evidence
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-destructive" onClick={remove} disabled={busy}>
              Remove
            </Button>
          </div>
        )}
      </div>

      {claim?.description && (
        <Section title="Description">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{claim.description}</p>
        </Section>
      )}
      {source?.summary && (
        <Section title="Key finding">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{source.summary}</p>
        </Section>
      )}
      {evidence?.explanation && (
        <Section title="Why">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{evidence.explanation}</p>
        </Section>
      )}

      {(claim || source) && (
        <Section title="Evidence">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {claim ? "No sources connected to this claim yet." : "Not connected to any claim yet."}
            </p>
          ) : (
            <ul className="space-y-1">
              {links.map((l) => {
                const other = claim ? sourceById.get(l.sourceId) : claimById.get(l.claimId);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => onSelect({ type: "evidence", id: l.id })}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-start gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-secondary"
                    >
                      <span className="mt-0.5">{REL_ICON[l.relationship]}</span>
                      <span className="min-w-0">
                        <span className="block text-sm text-foreground">{other?.title ?? "Removed"}</span>
                        <span className={`block text-xs ${REL_LABEL[l.relationship].cls}`}>{REL_LABEL[l.relationship].label}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      )}

      <Section title={`Comments${comments.length ? ` (${comments.length})` : ""}`}>
        <Comments boardId={boardId} targetType={type} targetId={id} comments={comments} perms={perms} />
      </Section>
    </div>
  );
}

function Comments({
  boardId,
  targetType,
  targetId,
  comments,
  perms,
}: {
  boardId: string;
  targetType: CardType;
  targetId: string;
  comments: BoardData["comments"];
  perms: Permissions;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await addComment(boardId, targetType, targetId, text);
    setBusy(false);
    if (res.ok) {
      setText("");
      toast("Comment posted.");
    } else toast(res.error, "error");
  };

  return (
    <div className="space-y-4">
      {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-2.5">
          <Avatar name={c.authorName} image={c.authorImage} size="xs" className="mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground" suppressHydrationWarning>
              <span className="font-medium text-foreground">{c.authorName}</span> · {timeAgo(c.createdAt)}
            </p>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">{c.content}</p>
          </div>
        </div>
      ))}

      {perms.canComment ? (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label htmlFor={`comment-${targetId}`} className="sr-only">
            Add a comment
          </label>
          <textarea
            id={`comment-${targetId}`}
            rows={2}
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment"
            className="field-input resize-y"
          />
          <div>
            <Button type="submit" size="sm" disabled={busy || !text.trim()}>
              {busy ? "Posting…" : "Comment"}
            </Button>
          </div>
        </form>
      ) : perms.role === "viewer" ? (
        <p className="text-sm text-muted-foreground">Viewers can&apos;t comment. Ask the board owner for commenter access.</p>
      ) : perms.signedIn ? (
        <p className="text-sm text-muted-foreground">Only board members can comment.</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href={`/login?callbackUrl=/boards/${boardId}`} className="font-medium text-foreground underline underline-offset-4">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </div>
  );
}
