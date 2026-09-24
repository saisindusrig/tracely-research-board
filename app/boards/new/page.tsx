"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NewBoardPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create board.");
      }
    } catch (err) {
      setError("Something went wrong.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Create New Board</h1>
        
        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Title</label>
          <input 
            required 
            type="text" 
            className="border border-slate-300 p-2 rounded focus:outline-blue-500" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">Description</label>
          <textarea 
            className="border border-slate-300 p-2 rounded focus:outline-blue-500" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input 
            type="checkbox" 
            checked={isPublic} 
            onChange={(e) => setIsPublic(e.target.checked)} 
            className="w-4 h-4"
          />
          <label className="text-sm text-slate-700">Make this board public</label>
        </div>

        <Button type="submit" className="mt-4">Create Workspace</Button>
      </form>
    </main>
  );
}