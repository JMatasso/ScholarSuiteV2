import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes — session expires after this idle time
  },
  pages: {
    signIn: "/login",
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password || !user.isActive) {
          logAudit({
            action: "LOGIN_FAILED",
            resource: "auth",
            details: `Failed login attempt for ${email} — ${!user ? "user not found" : !user.isActive ? "account inactive" : "no password set"}`,
          });
          return null;
        }

        const { compare } = await import("bcryptjs");
        const isValid = await compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          logAudit({
            userId: user.id,
            action: "LOGIN_FAILED",
            resource: "auth",
            details: "Invalid password",
          });
          return null;
        }

        logAudit({
          userId: user.id,
          action: "LOGIN_SUCCESS",
          resource: "auth",
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isMasterAdmin: user.isMasterAdmin,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
        token.picture = user.image;
        token.isMasterAdmin = (user as { isMasterAdmin?: boolean }).isMasterAdmin;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
      }
      // Allow client-side session updates to refresh token data
      if (trigger === "update" && updateData) {
        if (updateData.name !== undefined) token.name = updateData.name;
        if (updateData.email !== undefined) token.email = updateData.email;
        if (updateData.image !== undefined) token.picture = updateData.image;
        if (updateData.mustChangePassword !== undefined) token.mustChangePassword = updateData.mustChangePassword;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.image = (token.picture as string) || null;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { isMasterAdmin?: boolean }).isMasterAdmin = Boolean(token.isMasterAdmin);
        (session.user as { mustChangePassword?: boolean }).mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
});
