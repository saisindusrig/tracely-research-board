"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/Toaster";
import { updateProfile } from "@/lib/actions/account";

export default function ProfileForm({ initial }: { initial: { name: string; username: string; bio: string } }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const res = await updateProfile(values);
    setIsLoading(false);
    if (res.ok) {
      toast("Profile saved.");
      router.refresh();
    } else {
      setError(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-lg flex-col gap-5">
      {error && (
        <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="field-label">
          Name
        </label>
        <input
          id="name"
          required
          autoComplete="name"
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className="field-input"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="field-label">
          Username
        </label>
        <div className="flex min-w-0 items-center rounded-md border border-input bg-card focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
          <span className="pl-3 text-muted-foreground">@</span>
          <input
            id="username"
            required
            autoCapitalize="none"
            pattern="[a-z0-9_]{3,24}"
            value={values.username}
            onChange={(e) => setValues((v) => ({ ...v, username: e.target.value.toLowerCase() }))}
            aria-describedby="username-hint"
            className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-base text-foreground focus:outline-none sm:text-sm"
          />
        </div>
        <p id="username-hint" className="field-hint">
          Your profile lives at /profile/{values.username || "username"}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="field-label">
          Bio <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="bio"
          rows={3}
          maxLength={280}
          value={values.bio}
          onChange={(e) => setValues((v) => ({ ...v, bio: e.target.value }))}
          className="field-input resize-y"
        />
        <p className="field-hint">{280 - values.bio.length} characters left</p>
      </div>
      <div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
