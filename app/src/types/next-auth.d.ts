import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isMasterAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    isMasterAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isMasterAdmin?: boolean;
  }
}
