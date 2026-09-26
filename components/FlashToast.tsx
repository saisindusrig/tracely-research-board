"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/Toaster";

/**
 * Shows a one-time success message passed through a redirect
 * (e.g. `/login?registered=1`), then strips the query flag so a
 * refresh doesn't repeat it.
 */
export default function FlashToast({ message, param }: { message: string; param: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    toast(message);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [message, param, pathname, router, searchParams]);

  return null;
}
