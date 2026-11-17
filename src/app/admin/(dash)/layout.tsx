import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSite } from "@/lib/site";
import { Sidebar } from "@/components/admin/Sidebar";
import { logout } from "../actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const [site, inboxCount] = await Promise.all([getSite(), prisma.submission.count({ where: { status: "NEW" } })]);

  return (
    <div className="min-h-dvh">
      <Sidebar
        councilName={site.councilNameEn || "Dhonfanu Council"}
        logoUrl={site.logoUrl || "/images/logo.svg"}
        username={session.username}
        inboxCount={inboxCount}
        logoutAction={logout}
      />
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
