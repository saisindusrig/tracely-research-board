import {NextResponse} from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";
import Board from "@/models/Boards";
export async function POST(request: Request){
    try{
        const session = await getServerSession(authOptions);
        if(!session || !session.user?.id){
            return NextResponse.json(
                {message: "Unauthorized. You must be logged in to create a board."},
                {status: 401}
            );
        }
        const body = await request.json();
        const {title, description, isPublic} = body;
        if(!title){
            return NextResponse.json(
                {message: "Board title is required."},
                {status: 400}
            );
        }
        await connectToDatabase();
        const newBoard = await Board.create({
            title,
            description,
            isPublic: isPublic || false,
            owner: session.user.id,
        });
        return NextResponse.json(newBoard,{status:201});
    }catch(error){
        console.error("Error creating board:", error);
        return NextResponse.json(
            {message: "Au error occured while creating the board."},
            {status: 500}
        );
    }
}