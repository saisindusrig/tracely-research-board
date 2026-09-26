"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "@/components/icons";

type Tone = "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

const EVENT = "rb:toast";

/** Show a short confirmation or error message. Callable from any client code. */
export function toast(message: string, tone: Tone = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<Omit<ToastItem, "id">>(EVENT, { detail: { message, tone } }));
}

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    const onToast = (e: Event) => {
      const { message, tone } = (e as CustomEvent<Omit<ToastItem, "id">>).detail;
      const id = ++nextId.current;
      setItems((list) => [...list.slice(-2), { id, message, tone }]);
      window.setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), tone === "error" ? 6000 : 3500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-border bg-foreground px-4 py-3 text-sm text-background shadow-lg sm:w-auto sm:min-w-72"
        >
          <span
            className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
              t.tone === "error" ? "bg-[hsl(8_70%_62%)]" : "bg-[hsl(156_40%_55%)]"
            }`}
          >
            {t.tone === "error" ? <X className="size-3 text-foreground" /> : <Check className="size-3 text-foreground" />}
          </span>
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => setItems((list) => list.filter((x) => x.id !== t.id))}
            className="-mr-1 rounded px-1 text-background/70 hover:text-background"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
