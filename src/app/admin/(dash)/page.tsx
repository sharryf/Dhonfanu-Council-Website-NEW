import Link from "next/link";
import { FileText, Inbox, Megaphone, Newspaper, Plus, Users, Zap } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { SUBMISSION_TYPE_LABELS, SUBMISSION_TYPES, oneOf } from "@/lib/constants";
import { AdminHeader, Pill } from "@/components/admin/ui";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const now = new Date();
  const [newSubmissions, announcements, openDeadlines, news, drafts, documents, members, services, recent] = await Promise.all([
    prisma.submission.count({ where: { status: "NEW" } }),
    prisma.announcement.count(),
    prisma.announcement.count({ where: { published: true, deadline: { gte: now } } }),
    prisma.news.count({ where: { published: true } }),
    prisma.news.count({ where: { published: false } }),
    prisma.document.count(),
    prisma.member.count(),
    prisma.service.count({ where: { active: true } }),
    prisma.submission.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  const cards = [
    { href: "/admin/submissions", icon: Inbox, label: "Unresolved messages", value: newSubmissions, note: "from citizens", highlight: newSubmissions > 0 },
    { href: "/admin/announcements", icon: Megaphone, label: "Announcements", value: announcements, note: `${openDeadlines} open for submission` },
    { href: "/admin/news", icon: Newspaper, label: "Published news", value: news, note: `${drafts} draft${drafts === 1 ? "" : "s"}` },
    { href: "/admin/documents", icon: FileText, label: "Downloads", value: documents, note: "forms & publications" },
    { href: "/admin/members", icon: Users, label: "People listed", value: members, note: "council, WDC & staff" },
    { href: "/admin/services", icon: Zap, label: "Active e-services", value: services, note: "shown on the site" },
  ];

  const quick = [
    { href: "/admin/announcements/new", label: "New announcement" },
    { href: "/admin/news/new", label: "New news article" },
    { href: "/admin/documents/new", label: "Upload document" },
    { href: "/admin/settings", label: "Edit notice ticker" },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" description="Everything on the public portal can be changed from here. Changes go live immediately." />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className={`card flex items-center gap-4 p-5 transition-shadow hover:shadow-lift ${c.highlight ? "ring-2 ring-teal" : ""}`}>
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${c.highlight ? "bg-teal text-white" : "bg-aqua-soft text-teal"}`}>
                <c.icon className="size-6" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold text-navy">{c.value}</span>
                <span className="block text-sm font-semibold text-navy">{c.label}</span>
                <span className="block text-xs text-navy/55">{c.note}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-navy/5 px-5 py-4">
            <h2 className="font-bold text-navy">Latest citizen messages</h2>
            <Link href="/admin/submissions" className="text-sm font-semibold text-teal hover:underline">
              Open inbox
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-navy/55">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-navy/5">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link href={`/admin/submissions?status=ALL#m-${s.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-aqua-soft/50">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-navy" dir="auto">
                        {s.subject || s.message}
                      </span>
                      <span className="block text-xs text-navy/55">
                        {s.reference} · <span dir="auto">{s.name}</span> · {formatDateTime(s.createdAt, "en")}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <Pill>{SUBMISSION_TYPE_LABELS[oneOf(SUBMISSION_TYPES, s.type, "INQUIRY")]}</Pill>
                      <Pill tone={s.status === "NEW" ? "teal" : "muted"}>{s.status === "NEW" ? "New" : "Resolved"}</Pill>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold text-navy">Quick actions</h2>
          <ul className="grid gap-2">
            {quick.map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="btn-outline w-full justify-start">
                  <Plus className="size-4 text-teal" aria-hidden="true" />
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
