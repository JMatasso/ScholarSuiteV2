import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  role?: string;
}

export async function DashboardShell({ children, role }: DashboardShellProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (role && (session.user as { role: string }).role !== role) {
    // Redirect mismatched roles to their own dashboard
    const userRole = (session.user as { role: string }).role;
    redirect(`/${userRole.toLowerCase()}/dashboard`);
  }

  return <>{children}</>;
}
