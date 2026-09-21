import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";


export async function POST(request: Request){
    try{
        const {name,email,password} = await request.json();
        if(!name || !email || !password){
            return NextResponse.json({
                message: "Name, email and password are required"},
                {status: 400}
            );
        }
        await connectToDatabase();
        
        const exisitingUser = await User.findOne({email});
        if(exisitingUser){
            return NextResponse.json(
                {message: "User with this email already exists."},
                {status: 409}
            );
        }
        const hashedPassword = await bcrypt.hash(password,10);
        await User.create({
            name,
            email,
            password: hashedPassword,
        })
        return NextResponse.json(
            {message: "User registered successfully."},
            {status: 201}
        );
    }
    catch(error){
        console.error("Registration error: ", error);
        return NextResponse.json(
            {message: "An error occurred during registration."},
            {status: 500}
        );

    }
}