import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { githubEnabled } from "@/lib/env";

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

/** Builds a free username from a name or email, e.g. "sai_sindu" or "sai_sindu2". */
export async function generateUsername(seed: string) {
  const base =
    seed
      .toLowerCase()
      .split("@")[0]
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || "researcher";
  const padded = base.length < 3 ? `${base}_rb` : base;

  let candidate = padded;
  for (let i = 2; await User.exists({ username: candidate }); i++) {
    candidate = `${padded}${i}`;
  }
  return candidate;
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...(githubEnabled
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }
        await connectToDatabase();
        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).select("+password");
        // Same message for unknown email and wrong password, so the form
        // doesn't reveal which accounts exist.
        if (!user?.password) throw new Error("Incorrect email or password.");

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) throw new Error("Incorrect email or password.");

        return { id: user._id.toString(), email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        if (!user.email) return false;
        await connectToDatabase();
        const existingUser = await User.findOne({ email: user.email.toLowerCase() });

        if (!existingUser) {
          const newUser = await User.create({
            name: user.name || user.email.split("@")[0],
            email: user.email,
            image: user.image,
            username: await generateUsername(user.name || user.email),
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
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

/** The signed-in user from the session, or null. */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user?.id ? session.user : null;
}
