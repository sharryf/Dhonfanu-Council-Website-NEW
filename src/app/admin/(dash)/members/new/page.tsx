import { AdminHeader } from "@/components/admin/ui";
import { MemberForm } from "../form";

export const metadata = { title: "Add person" };

export default async function NewMember({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const { group } = await searchParams;
  return (
    <>
      <AdminHeader title="Add person" backHref="/admin/members" />
      <MemberForm defaultGroup={group} />
    </>
  );
}
