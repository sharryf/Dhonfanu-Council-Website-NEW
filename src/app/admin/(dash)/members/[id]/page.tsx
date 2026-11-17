import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminHeader } from "@/components/admin/ui";
import { MemberForm } from "../form";

export const metadata = { title: "Edit person" };

export default async function EditMember({ params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const item = Number.isInteger(id) ? await prisma.member.findUnique({ where: { id } }) : null;
  if (!item) notFound();
  return (
    <>
      <AdminHeader title="Edit person" backHref="/admin/members" />
      <MemberForm item={item} />
    </>
  );
}
