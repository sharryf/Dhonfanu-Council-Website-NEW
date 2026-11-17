import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import { ServiceForm } from "../form";

export const metadata = { title: "Edit service" };

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const item = Number.isInteger(id) ? await prisma.service.findUnique({ where: { id } }) : null;
  if (!item) notFound();
  return (
    <>
      <AdminHeader title="Edit service" backHref="/admin/services" />
      <ServiceForm item={item} />
    </>
  );
}
