"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/Toaster";
import { createBoard, updateBoard } from "@/lib/actions/boards";
import { TOPICS } from "@/lib/constants";

type Values = { title: string; description: string; topic: string; isPublic: boolean };

/** Create-board form, also reused for editing a board's general settings. */
export default function BoardForm({
  mode,
  boardId,
  initial,
  cancelHref,
}: {
  mode: "create" | "edit";
  boardId?: string;
  initial?: Partial<Values>;
  cancelHref: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    topic: initial?.topic ?? "",
    isPublic: initial?.isPublic ?? false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (mode === "create") {
      const res = await createBoard(values);
      if (res.ok && res.data) {
        router.push(`/boards/${res.data.id}?created=1`);
        return;
      }
      setError(res.ok ? "Couldn't create the board." : res.error);
    } else if (boardId) {
      const res = await updateBoard(boardId, values);
      if (res.ok) {
        toast("Board settings saved.");
        router.refresh();
      } else {
        setError(res.error);
      }
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="board-title" className="field-label">
          Board name
        </label>
        <input
          id="board-title"
          required
          maxLength={120}
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          disabled={isLoading}
          className="field-input"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="board-description" className="field-label">
          Description <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="board-description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          disabled={isLoading}
          aria-describedby="board-description-hint"
          className="field-input resize-y"
        />
        <p id="board-description-hint" className="field-hint">
          What question are you investigating?
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="board-topic" className="field-label">
          Topic
        </label>
        <select
          id="board-topic"
          value={values.topic}
          onChange={(e) => set("topic", e.target.value)}
          disabled={isLoading}
          className="field-input"
        >
          <option value="">No topic</option>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="field-label mb-2">Visibility</legend>
        {[
          { value: false, label: "Private", hint: "Only you and people you invite" },
          { value: true, label: "Public", hint: "Anyone can find and view this board" },
        ].map((opt) => (
          <label
            key={opt.label}
            className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors ${
              values.isPublic === opt.value ? "border-foreground bg-card" : "border-input hover:border-foreground/40"
            }`}
          >
            <input
              type="radio"
              name="visibility"
              checked={values.isPublic === opt.value}
              onChange={() => set("isPublic", opt.value)}
              disabled={isLoading}
              className="mt-1 size-4 accent-[hsl(var(--primary))]"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">{opt.label}</span>
              <span className="block text-sm text-muted-foreground">{opt.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
        <Button type="submit" disabled={isLoading}>
          {mode === "create" ? (isLoading ? "Creating…" : "Create board") : isLoading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
