import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import { DocumentForm } from "../form";

export const metadata = { title: "Edit document" };

export default async function EditDocument({ params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const item = Number.isInteger(id) ? await prisma.document.findUnique({ where: { id } }) : null;
  if (!item) notFound();
  return (
    <>
      <AdminHeader title="Edit document" backHref="/admin/documents" />
      <DocumentForm item={item} />
    </>
  );
}
