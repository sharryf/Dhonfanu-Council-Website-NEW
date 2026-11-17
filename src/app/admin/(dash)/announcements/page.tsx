import { Paperclip } from "lucide-react";
import { prisma } from "@/lib/db";
import { deadlineStatus, formatDate, formatDateTime } from "@/lib/format";
import { ANNOUNCEMENT_CATEGORIES, ANNOUNCEMENT_CATEGORY_LABELS, oneOf } from "@/lib/constants";
import { ConfirmForm } from "@/components/admin/ActionForm";
import { AdminHeader, EditLink, EmptyRow, Flash, Pill } from "@/components/admin/ui";
import { deleteAnnouncement } from "../../actions";

export const metadata = { title: "Announcements & tenders" };

export default async function AnnouncementsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const items = await prisma.announcement.findMany({ orderBy: [{ publishDate: "desc" }, { id: "desc" }] });

  return (
    <>
      <AdminHeader
        title="Announcements & tenders"
        description="Official notices (އިޢުލާން), bids/tenders and job vacancies."
        newHref="/admin/announcements/new"
        newLabel="New announcement"
      />
      <Flash {...sp} />
      {items.length === 0 ? (
        <EmptyRow text="No announcements yet." />
      ) : (
        <ul className="grid gap-3">
          {items.map((a) => {
            const status = deadlineStatus(a.deadline);
            return (
              <li key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Pill tone={a.category === "NOTICE" ? "aqua" : "navy"}>{ANNOUNCEMENT_CATEGORY_LABELS[oneOf(ANNOUNCEMENT_CATEGORIES, a.category, "NOTICE")]}</Pill>
                    {status !== null && <Pill tone={status ? "teal" : "muted"}>{status ? "Open" : "Closed"}</Pill>}
                    {!a.published && <Pill>Hidden draft</Pill>}
                    {a.attachmentUrl && <Paperclip className="size-3.5 text-navy/45" aria-label="Has attachment" />}
                  </div>
                  <p className="truncate font-semibold text-navy" dir="auto">
                    {a.titleEn || a.titleDv}
                  </p>
                  <p className="text-xs text-navy/55">
                    {a.refNumber && `${a.refNumber} · `}
                    {formatDate(a.publishDate, "en")}
                    {a.deadline && ` · Deadline ${formatDateTime(a.deadline, "en")}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <EditLink href={`/admin/announcements/${a.id}`} />
                  <ConfirmForm action={deleteAnnouncement} id={a.id} iconOnly />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
