import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Board from "@/models/Boards";
import Claim from "@/models/Claim"; 
import CreateClaimForm from "@/components/CreateClaimForm"; 
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function BoardWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/api/auth/signin");
  }

  const { id } = await params;

  await connectToDatabase();
  
  let board = null;
  let claims = []; 
  
  try {
    board = await Board.findById(id);
    claims = await Claim.find({ boardId: id }).sort({ createdAt: -1 });
  } catch (error) {
    console.error("Database error:", error);
  }

  if (!board) {
    redirect("/dashboard");
  }

  if (board.owner.toString() !== session.user.id && !board.isPublic) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <h1 className="text-2xl font-bold font-heading text-red-600 mb-2">Access Denied 🛑</h1>
          <p className="text-slate-600 mb-4">You do not have permission to view this board.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col bg-slate-100 font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-xl font-bold font-heading text-slate-900">{board.title}</h1>
          {board.description && (
            <p className="text-xs text-slate-500 mt-1">{board.description}</p>
          )}
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </header>

      <div className="flex-1 p-8 overflow-x-auto flex gap-6 items-start">
        
        <CreateClaimForm boardId={id} />

        {claims.map((claim) => (
          <div key={claim._id.toString()} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm w-72 shrink-0">
            <div className="flex justify-between items-start mb-3">
              <span className="font-tag text-xs tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                #CLAIM
              </span>
              <span className="font-tag text-[10px] text-slate-400">
                {claim.status}
              </span>
            </div>
            
            <h3 className="font-heading font-bold text-slate-900 text-lg mb-2 leading-tight">
              {claim.title}
            </h3>
            
            {claim.description && (
              <p className="font-sans text-xs text-slate-600 leading-relaxed">
                {claim.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}