"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Avatar from "@/components/Avatar";
import { toast } from "@/components/Toaster";
import { inviteMember, removeMember, updateMemberRole } from "@/lib/actions/boards";
import { MEMBER_ROLES, ROLE_DESCRIPTIONS, type BoardRole, type MemberRole } from "@/lib/constants";

export type MemberView = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  image?: string;
  role: BoardRole;
};

const label = (r: string) => r[0].toUpperCase() + r.slice(1);

export default function MembersManager({
  boardId,
  members,
  canManage,
  currentUserId,
}: {
  boardId: string;
  members: MemberView[];
  canManage: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState<MemberRole>("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy("invite");
    const res = await inviteMember(boardId, identifier, role);
    setBusy(null);
    if (res.ok) {
      toast(`${res.data?.name ?? "They"} can now ${role === "viewer" ? "view" : role === "commenter" ? "comment on" : "edit"} this board.`);
      setIdentifier("");
      router.refresh();
    } else {
      setError(res.error);
    }
  };

  const changeRole = async (userId: string, next: MemberRole) => {
    setBusy(userId);
    const res = await updateMemberRole(boardId, userId, next);
    setBusy(null);
    if (res.ok) {
      toast(`Role changed to ${next}.`);
      router.refresh();
    } else toast(res.error, "error");
  };

  const remove = async (m: MemberView) => {
    if (!window.confirm(`Remove ${m.name} from this board?`)) return;
    setBusy(m.id);
    const res = await removeMember(boardId, m.id);
    setBusy(null);
    if (res.ok) {
      toast(`${m.name} was removed.`);
      router.refresh();
    } else toast(res.error, "error");
  };

  return (
    <>
      {canManage && (
        <form onSubmit={invite} className="mt-8 rounded-lg border border-border bg-card p-4 sm:p-5">
          <label htmlFor="invite" className="field-label">
            Invite people
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="invite"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email or @username"
              autoCapitalize="none"
              className="field-input sm:flex-1"
            />
            <label htmlFor="invite-role" className="sr-only">
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="field-input sm:w-40"
            >
              {MEMBER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {label(r)}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={busy === "invite"}>
              {busy === "invite" ? "Inviting…" : "Invite"}
            </Button>
          </div>
          <p className="field-hint mt-2">{ROLE_DESCRIPTIONS[role]}. They need a Warrant account.</p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </form>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
        <div className="hidden grid-cols-[1fr_160px_90px] gap-4 border-b border-border px-5 py-2.5 text-xs text-muted-foreground sm:grid">
          <span>Member</span>
          <span>Role</span>
          <span className="text-right">Actions</span>
        </div>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[1fr_160px_90px] sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={m.name} image={m.image} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {m.username ? (
                      <Link href={`/profile/${m.username}`} className="hover:underline underline-offset-4">
                        {m.name}
                      </Link>
                    ) : (
                      m.name
                    )}
                    {m.id === currentUserId && <span className="font-normal text-muted-foreground"> (you)</span>}
                  </p>
                  {(m.email || m.username) && (
                    <p className="truncate text-xs text-muted-foreground">{m.email ?? `@${m.username}`}</p>
                  )}
                </div>
              </div>

              <div className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">
                {canManage && m.role !== "owner" ? (
                  <>
                    <label htmlFor={`role-${m.id}`} className="sr-only">
                      Role for {m.name}
                    </label>
                    <select
                      id={`role-${m.id}`}
                      value={m.role}
                      disabled={busy === m.id}
                      onChange={(e) => changeRole(m.id, e.target.value as MemberRole)}
                      className="field-input h-9 py-1"
                    >
                      {MEMBER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {label(r)}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <span className="text-sm text-foreground">{label(m.role)}</span>
                )}
              </div>

              <div className="col-span-2 sm:col-span-1 sm:text-right">
                {canManage && m.role !== "owner" ? (
                  <Button variant="ghost" size="xs" className="-ml-2.5 text-destructive sm:ml-0" disabled={busy === m.id} onClick={() => remove(m)}>
                    Remove
                  </Button>
                ) : (
                  <span className="hidden text-sm text-muted-foreground sm:inline">-</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        {(Object.keys(ROLE_DESCRIPTIONS) as BoardRole[]).map((r) => (
          <div key={r}>
            <dt className="font-medium text-foreground">{label(r)}</dt>
            <dd className="text-muted-foreground">{ROLE_DESCRIPTIONS[r]}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
