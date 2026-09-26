"use client";

import { useSyncExternalStore } from "react";

function partOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** Uses the viewer's local clock, not the server's, so "Good morning" is right. */
export default function Greeting({ name }: { name: string }) {
  const part = useSyncExternalStore(
    () => () => {},
    partOfDay,
    () => null
  );
  return (
    <>
      {part ? `Good ${part}` : "Welcome back"}, {name}
    </>
  );
}
