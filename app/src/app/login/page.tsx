"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { SignInPage } from "@/components/ui/sign-in";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        const res = await fetch("/api/auth/session");
        const session = await res.json();

        // Force password change for temp password accounts
        if (session?.user?.mustChangePassword) {
          router.push("/change-password");
          return;
        }

        const role = session?.user?.role?.toLowerCase();
        if (role === "admin") router.push("/admin");
        else if (role === "parent") router.push("/parent");
        else router.push("/student");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignInPage
      onSignIn={handleSignIn}
      isLoading={isLoading}
    />
  );
}
