"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function CreateClaimForm({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, boardId }),
      });

      if (res.ok) {
        setTitle(""); // Clear the form
        setDescription("");
        router.refresh(); // Automatically refresh the server data on the page
      }
    } catch (error) {
      console.error("Failed to create claim", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3 w-72 shrink-0">
      <h3 className="font-semibold text-slate-800 text-sm">Add New Claim</h3>
      <input
        required
        placeholder="e.g. AI improves coding speed"
        className="border border-slate-300 p-2 rounded text-sm focus:outline-blue-500"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Context or description..."
        className="border border-slate-300 p-2 rounded text-sm focus:outline-blue-500 resize-none h-20"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit" disabled={isSubmitting} size="sm">
        {isSubmitting ? "Adding..." : "Add Claim"}
      </Button>
    </form>
  );
}