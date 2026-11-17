import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import { AnnouncementForm } from "../form";

export const metadata = { title: "Edit announcement" };

export default async function EditAnnouncement({ params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const item = Number.isInteger(id) ? await prisma.announcement.findUnique({ where: { id } }) : null;
  if (!item) notFound();
  return (
    <>
      <AdminHeader title="Edit announcement" backHref="/admin/announcements" />
      <AnnouncementForm item={item} />
    </>
  );
}
