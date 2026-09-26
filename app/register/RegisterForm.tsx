"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: name === "username" ? value.toLowerCase() : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push("/login?registered=1");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Registration failed.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  };

  const fields = [
    { name: "name", label: "Name", type: "text", autoComplete: "name" },
    {
      name: "username",
      label: "Username",
      type: "text",
      autoComplete: "username",
      hint: "Lowercase letters, numbers and underscores. Used for your public profile.",
      pattern: "[a-z0-9_]{3,24}",
    },
    { name: "email", label: "Email", type: "email", autoComplete: "email" },
    { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 8 characters.", minLength: 8 },
  ] as const;

  return (
    <>
      {error && (
        <div role="alert" className="mb-5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.name} className="flex flex-col gap-1.5">
            <label htmlFor={f.name} className="field-label">
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type={f.type}
              autoComplete={f.autoComplete}
              required
              value={formData[f.name]}
              onChange={handleChange}
              disabled={isLoading}
              pattern={"pattern" in f ? f.pattern : undefined}
              minLength={"minLength" in f ? f.minLength : undefined}
              autoCapitalize={f.name === "username" ? "none" : undefined}
              aria-describedby={"hint" in f ? `${f.name}-hint` : undefined}
              className="field-input"
            />
            {"hint" in f && (
              <p id={`${f.name}-hint`} className="field-hint">
                {f.hint}
              </p>
            )}
          </div>
        ))}
        <Button type="submit" disabled={isLoading} size="lg" className="mt-2 w-full">
          {isLoading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
