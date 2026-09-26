import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getNotifications, type NotificationItem } from "@/lib/notifications";
import User from "@/models/User";
import Logo from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import NavLinks from "@/components/nav/NavLinks";
import MobileMenu from "@/components/nav/MobileMenu";
import UserMenu from "@/components/nav/UserMenu";
import NotificationsMenu from "@/components/nav/NotificationsMenu";

type Profile = { name: string; email?: string; username?: string; image?: string; notificationsSeenAt?: Date };

export default async function Navbar() {
  const sessionUser = await getCurrentUser();

  let profile: Profile | null = null;
  let notifications: NotificationItem[] = [];

  if (sessionUser) {
    await connectToDatabase();
    profile = await User.findById(sessionUser.id)
      .select("name email username image notificationsSeenAt")
      .lean<Profile | null>();
    if (profile) notifications = await getNotifications(sessionUser.id, profile.notificationsSeenAt);
  }

  const signedIn = Boolean(sessionUser && profile);
  const links = signedIn
    ? [
        { href: "/explore", label: "Explore" },
        { href: "/boards", label: "My Boards" },
        { href: "/search", label: "Search" },
      ]
    : [
        { href: "/explore", label: "Explore" },
        { href: "/search", label: "Search" },
      ];
  const profileHref = profile?.username ? `/profile/${profile.username}` : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/15 bg-background">
      <div className="page-container grid h-16 grid-cols-[1fr_auto_1fr] items-center md:flex md:justify-between md:gap-6">
        {/* Left: menu on mobile, logo + links on desktop */}
        <div className="flex items-center gap-6">
          <MobileMenu links={links} signedIn={signedIn} profileHref={profileHref} />
          <Logo className="hidden md:inline-flex" />
          <NavLinks links={links} />
        </div>

        {/* Center logo on mobile */}
        <Logo className="md:hidden" />

        <div className="flex items-center justify-end gap-1 md:gap-2">
          {signedIn && profile ? (
            <>
              <NotificationsMenu items={notifications} />
              <UserMenu name={profile.name} email={profile.email} image={profile.image} profileHref={profileHref} />
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Log in
              </Link>
              <Link
                href="/register"
                className={buttonVariants({ variant: "default", size: "sm", className: "hidden md:inline-flex" })}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
