import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Route files may only export HTTP handlers, so the options live in lib/auth.
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
