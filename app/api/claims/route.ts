import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Claim from "@/models/Claim";

export async function POST(request: Request) {
  try {
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized. You must be logged in to create a claim." },
        { status: 401 }
      );
    }

   
    const body = await request.json();
    const { title, description, boardId } = body;

    
    if (!title || !boardId) {
      return NextResponse.json(
        { message: "Title and Board ID are required." },
        { status: 400 }
      );
    }

    
    await connectToDatabase();

   
    const newClaim = await Claim.create({
      title,
      description,
      boardId,
      author: session.user.id, 
    });


    return NextResponse.json(newClaim, { status: 201 });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the claim." },
      { status: 500 }
    );
  }
}