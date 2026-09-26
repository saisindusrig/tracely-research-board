"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/Toaster";
import { deleteBoard } from "@/lib/actions/boards";

/** Delete with a typed confirmation, since it wipes the whole board. */
export default function DeleteBoard({ boardId, boardTitle }: { boardId: string; boardTitle: string }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)}>
        Delete this board
      </Button>
    );
  }

  const handleDelete = async () => {
    setIsLoading(true);
    // On success the action redirects to /boards, so we only handle failure here.
    const res = await deleteBoard(boardId);
    if (res && !res.ok) {
      toast(res.error, "error");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor="confirm-delete" className="text-sm text-foreground">
        Type <strong className="font-medium">{boardTitle}</strong> to confirm.
      </label>
      <input
        id="confirm-delete"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        className="field-input"
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="outline" onClick={() => setConfirming(false)} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={typed.trim() !== boardTitle.trim() || isLoading}>
          {isLoading ? "Deleting…" : "Permanently delete board"}
        </Button>
      </div>
    </div>
  );
}
