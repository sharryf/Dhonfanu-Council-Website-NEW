import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import { NewsForm } from "../form";

export const metadata = { title: "Edit article" };

export default async function EditNews({ params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const item = Number.isInteger(id) ? await prisma.news.findUnique({ where: { id } }) : null;
  if (!item) notFound();
  return (
    <>
      <AdminHeader title="Edit article" backHref="/admin/news" />
      <NewsForm item={item} />
    </>
  );
}
