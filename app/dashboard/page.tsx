import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Board from "@/models/Boards"; // Using your corrected model name!
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/api/auth/signin");
  }

 
  await connectToDatabase();
  const userBoards = await Board.find({ owner: session.user.id }).sort({ createdAt: -1 });

  return (
    <main className="flex min-h-screen flex-col p-8 md:p-24 bg-slate-50">
      <div className="flex justify-between items-center mb-8 w-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900">Your Workspaces</h1>
        <Link href="/boards/new">
          <Button>+ New Board</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl mx-auto">
        {userBoards.length === 0 ? (
          <p className="text-slate-500 col-span-full">You haven't created any boards yet.</p>
        ) : (
          userBoards.map((board) => (
            <Link href={`/boards/${board._id}`} key={board._id.toString()}>
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer h-full">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">{board.title}</h2>
                <p className="text-slate-600 text-sm line-clamp-3">
                  {board.description || "No description provided."}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                  {board.isPublic ? "🌍 Public" : "🔒 Private"}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  );
}