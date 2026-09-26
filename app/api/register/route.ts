import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { USERNAME_PATTERN } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!name || !email || !password || !username) {
      return NextResponse.json(
        { message: "Name, username, email and password are required." },
        { status: 400 }
      );
    }
    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json(
        { message: "Usernames use 3 to 24 lowercase letters, numbers or underscores." },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (await User.exists({ email })) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }
    if (await User.exists({ username })) {
      return NextResponse.json(
        { message: "That username is taken. Try another." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, username, password: hashedPassword });

    return NextResponse.json({ message: "Account created." }, { status: 201 });
  } catch (error) {
    console.error("Registration error: ", error);
    return NextResponse.json(
      { message: "Something went wrong while creating your account." },
      { status: 500 }
    );
  }
}
