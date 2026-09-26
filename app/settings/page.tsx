import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import SiteShell from "@/components/SiteShell";
import ProfileForm from "./ProfileForm";
import SignOutButton from "./SignOutButton";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Warrant profile and account.",
};

export default async function SettingsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login?callbackUrl=/settings");

  await connectToDatabase();
  const user = await User.findById(session.id)
    .select("name email username bio +password")
    .lean<{ name: string; email: string; username?: string; bio?: string; password?: string } | null>();
  if (!user) redirect("/login");

  return (
    <SiteShell>
      <div className="page-container max-w-4xl py-10 sm:py-14">
        <h1 className="font-heading text-4xl text-foreground sm:text-5xl">Settings</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[180px_1fr] md:gap-12">
          <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex w-max gap-1 md:w-auto md:flex-col">
              <li>
                <a href="#profile" className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                  Profile
                </a>
              </li>
              <li>
                <a href="#account" className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted">
                  Account
                </a>
              </li>
            </ul>
          </nav>

          <div className="min-w-0 space-y-12">
            <section id="profile" className="scroll-mt-24">
              <h2 className="font-heading text-xl text-foreground">Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Shown on your public profile and on boards you share.</p>
              <div className="mt-6">
                <ProfileForm initial={{ name: user.name, username: user.username ?? "", bio: user.bio ?? "" }} />
              </div>
            </section>

            <section id="account" className="scroll-mt-24 border-t border-border pt-10">
              <h2 className="font-heading text-xl text-foreground">Account</h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 text-foreground">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sign-in method</dt>
                  <dd className="mt-0.5 text-foreground">{user.password ? "Email and password" : "GitHub"}</dd>
                </div>
              </dl>
              <div className="mt-6">
                <SignOutButton />
              </div>
            </section>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
