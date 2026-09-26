"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/Toaster";
import { createClaim, createEvidence, createNote, createSource, updateItem } from "@/lib/actions/items";
import { RELATIONSHIPS, SOURCE_TYPES, type Relationship } from "@/lib/constants";
import type { ClaimData, EvidenceData, NoteData, SourceData } from "./types";

type Pos = { x: number; y: number };

type Common = {
  boardId: string;
  onDone: () => void;
  onCancel: () => void;
  /** Where a newly created card should appear (the middle of the current view). */
  getPosition: () => Pos;
};

function useSubmit(onDone: () => void) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) => {
    setError("");
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      toast(success);
      onDone();
    } else {
      setError(res.error);
    }
  };
  return { error, busy, run };
}

function Actions({ busy, label, onCancel }: { busy: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-1">
      <Button type="submit" disabled={busy} className="flex-1">
        {busy ? "Saving…" : label}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
        Cancel
      </Button>
    </div>
  );
}

function ErrorText({ error }: { error: string }) {
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {error}
    </p>
  );
}

// ------------------------------------------------------------------ claim

export function ClaimForm({ boardId, onDone, onCancel, getPosition, editing }: Common & { editing?: ClaimData }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [tags, setTags] = useState(editing?.tags.join(", ") ?? "");
  const { error, busy, run } = useSubmit(onDone);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagList = tags.split(/[,\s]+/).filter(Boolean);
    run(
      () =>
        editing
          ? updateItem(boardId, "claim", editing.id, { title, description, tags: tagList })
          : createClaim(boardId, { title, description, tags: tagList, position: getPosition() }),
      editing ? "Claim updated." : "Claim added to the board."
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="claim-title" className="field-label">
          Claim
        </label>
        <textarea
          id="claim-title"
          required
          autoFocus
          rows={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-describedby="claim-title-hint"
          className="field-input resize-none"
        />
        <p id="claim-title-hint" className="field-hint">
          One statement you can test, e.g. “Remote work lowers productivity”.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="claim-description" className="field-label">
          Context <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="claim-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field-input resize-y"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="claim-tags" className="field-label">
          Tags <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="claim-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          autoCapitalize="none"
          aria-describedby="claim-tags-hint"
          className="field-input"
        />
        <p id="claim-tags-hint" className="field-hint">
          Separate with commas.
        </p>
      </div>
      <ErrorText error={error} />
      <Actions busy={busy} label={editing ? "Save claim" : "Add claim"} onCancel={onCancel} />
    </form>
  );
}

// ------------------------------------------------------------------ source

export function SourceForm({ boardId, onDone, onCancel, getPosition, editing }: Common & { editing?: SourceData }) {
  const [title, setTitle] = useState(editing?.title ?? "");
  const [url, setUrl] = useState(editing?.url ?? "");
  const [sourceType, setSourceType] = useState(editing?.sourceType ?? "Paper");
  const [summary, setSummary] = useState(editing?.summary ?? "");
  const { error, busy, run } = useSubmit(onDone);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        editing
          ? updateItem(boardId, "source", editing.id, { title, url, sourceType, summary })
          : createSource(boardId, { title, url, sourceType, summary, position: getPosition() }),
      editing ? "Source updated." : "Source added to the board."
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="source-title" className="field-label">
          Title
        </label>
        <input id="source-title" required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="field-input" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="source-url" className="field-label">
          Link <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          id="source-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          placeholder="example.com/article"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="field-input"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="source-type" className="field-label">
          Type
        </label>
        <select id="source-type" value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="field-input">
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="source-summary" className="field-label">
          Key finding <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea id="source-summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className="field-input resize-y" />
      </div>
      <ErrorText error={error} />
      <Actions busy={busy} label={editing ? "Save source" : "Add source"} onCancel={onCancel} />
    </form>
  );
}

// ------------------------------------------------------------------ note

export function NoteForm({ boardId, onDone, onCancel, getPosition, editing }: Common & { editing?: NoteData }) {
  const [content, setContent] = useState(editing?.content ?? "");
  const { error, busy, run } = useSubmit(onDone);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        editing
          ? updateItem(boardId, "note", editing.id, { content })
          : createNote(boardId, { content, position: getPosition() }),
      editing ? "Note updated." : "Note added to the board."
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note-content" className="field-label">
          Note
        </label>
        <textarea
          id="note-content"
          required
          autoFocus
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="field-input resize-y"
        />
      </div>
      <ErrorText error={error} />
      <Actions busy={busy} label={editing ? "Save note" : "Add note"} onCancel={onCancel} />
    </form>
  );
}

// ------------------------------------------------------------------ evidence

const REL_LABEL: Record<Relationship, { label: string; hint: string; cls: string }> = {
  SUPPORTS: { label: "Supports", hint: "The source backs the claim", cls: "text-supports" },
  CHALLENGES: { label: "Challenges", hint: "The source cuts against it", cls: "text-challenges" },
  CONTEXT: { label: "Context", hint: "Relevant background, neither for nor against", cls: "text-context" },
};

export function EvidenceForm({
  boardId,
  onDone,
  onCancel,
  claims,
  sources,
  editing,
  preset,
}: Omit<Common, "getPosition"> & {
  claims: ClaimData[];
  sources: SourceData[];
  editing?: EvidenceData;
  preset?: { claimId?: string; sourceId?: string };
}) {
  const [claimId, setClaimId] = useState(editing?.claimId ?? preset?.claimId ?? claims[0]?.id ?? "");
  const [sourceId, setSourceId] = useState(editing?.sourceId ?? preset?.sourceId ?? sources[0]?.id ?? "");
  const [relationship, setRelationship] = useState<Relationship>(editing?.relationship ?? "SUPPORTS");
  const [explanation, setExplanation] = useState(editing?.explanation ?? "");
  const { error, busy, run } = useSubmit(onDone);

  if (!editing && (claims.length === 0 || sources.length === 0)) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          Evidence links a source to a claim. Add at least one of each first
          {claims.length === 0 && sources.length === 0 ? "." : claims.length === 0 ? ": this board has no claims yet." : ": this board has no sources yet."}
        </p>
        <Button variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        editing
          ? updateItem(boardId, "evidence", editing.id, { relationship, explanation })
          : createEvidence(boardId, { claimId, sourceId, relationship, explanation }),
      editing ? "Evidence updated." : "Evidence connected."
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ev-source" className="field-label">
          Source
        </label>
        <select id="ev-source" value={sourceId} disabled={!!editing} onChange={(e) => setSourceId(e.target.value)} className="field-input">
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="field-label mb-1.5">Relationship</legend>
        {RELATIONSHIPS.map((r) => (
          <label
            key={r}
            className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 ${
              relationship === r ? "border-foreground bg-card" : "border-input hover:border-foreground/40"
            }`}
          >
            <input
              type="radio"
              name="relationship"
              checked={relationship === r}
              onChange={() => setRelationship(r)}
              className="mt-0.5 size-4 accent-[hsl(var(--primary))]"
            />
            <span>
              <span className={`block text-sm font-medium ${REL_LABEL[r].cls}`}>{REL_LABEL[r].label}</span>
              <span className="block text-xs text-muted-foreground">{REL_LABEL[r].hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ev-claim" className="field-label">
          Claim
        </label>
        <select id="ev-claim" value={claimId} disabled={!!editing} onChange={(e) => setClaimId(e.target.value)} className="field-input">
          {claims.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="ev-explanation" className="field-label">
          Why? <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="ev-explanation"
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          className="field-input resize-y"
        />
      </div>
      <ErrorText error={error} />
      <Actions busy={busy} label={editing ? "Save evidence" : "Connect"} onCancel={onCancel} />
    </form>
  );
}

export { REL_LABEL };
