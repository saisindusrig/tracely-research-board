import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-6 bg-slate-50">
      <h1 className="font-heading text-4xl font-bold text-slate-900">
        ResearchBoard 🚀
      </h1>

      {session ? (
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <p className="text-lg text-slate-700 font-sans">
            Welcome back, <strong className="text-blue-600">{session.user?.name}</strong>!
          </p>
          <p className="text-sm text-slate-500 font-sans">{session.user?.email}</p>
          
          <Link href="/api/auth/signout">
            <Button variant="destructive" className="mt-4">Log Out</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <p className="text-slate-600 font-sans">You are not logged in.</p>
          <div className="flex gap-4">
            <Link href="/api/auth/signin">
              <Button variant="default">Log In</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}