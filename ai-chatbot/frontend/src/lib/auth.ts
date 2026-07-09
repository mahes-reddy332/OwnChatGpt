import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn("[AUTH] Missing credentials");
          return null;
        }
        console.log("[AUTH] Attempting to authorize:", credentials.email);

        try {
          await connectDB();
          const user = await User.findOne({ email: credentials.email }).select("+password");
          if (!user) {
            console.warn("[AUTH] User not found:", credentials.email);
            return null;
          }

          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) {
            console.warn("[AUTH] Password mismatch for:", credentials.email);
            return null;
          }

          console.log("[AUTH] Authorization successful for:", credentials.email);
          return { id: user._id.toString(), name: user.name, email: user.email, image: user.avatar };
        } catch (err) {
          console.error("[AUTH] Authorization error:", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", newUser: "/signup" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
