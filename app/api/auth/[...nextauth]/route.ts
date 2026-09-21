import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";


declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) throw new Error("Email and password are required.");
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email }).select("+password");
        if (!user) throw new Error("No user found with this email.");
        
        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) throw new Error("Incorrect password.");
        
        return { id: user._id.toString(), email: user.email, name: user.name };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email });
        
        if (!existingUser) {
          const newUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
          });

          user.id = newUser._id.toString();
        } else {
          user.id = existingUser._id.toString();
        }
      }
      return true;
    },
  
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
   
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };