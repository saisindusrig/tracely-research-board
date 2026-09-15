import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
     
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

       
        await connectToDatabase();

        
        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user) {
          throw new Error("No user found with this email.");
        }

        
        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          throw new Error("Incorrect password.");
        }

        
        return { 
          id: user._id.toString(), 
          email: user.email, 
          name: user.name 
        };
      }
    })
  ],
  session: {
    strategy: "jwt", // We use JSON Web Tokens to manage the session securely
  },
  // We will build a beautiful custom login page in the future, 
  // but for now, we will use NextAuth's default page to test.
});

export { handler as GET, handler as POST };