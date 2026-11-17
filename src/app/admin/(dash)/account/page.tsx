import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ActionForm } from "@/components/admin/ActionForm";
import { Section, TextInput } from "@/components/admin/fields";
import { AdminHeader } from "@/components/admin/ui";
import { changePassword } from "../../actions";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await requireAdmin();
  const user = await prisma.adminUser.findUnique({ where: { id: session.uid } });

  return (
    <>
      <AdminHeader title="My account" description={`Signed in as "${session.username}". Change the default password before going live.`} />
      <ActionForm action={changePassword} submitLabel="Save account">
        <Section title="Profile">
          <TextInput label="Display name" name="name" defaultValue={user?.name} />
        </Section>
        <Section title="Change password" description="Leave these empty to keep the current password. Use at least 10 characters.">
          <TextInput label="Current password" name="current" type="password" />
          <TextInput label="New password" name="next" type="password" />
          <TextInput label="Repeat new password" name="confirm" type="password" />
        </Section>
      </ActionForm>
    </>
  );
}
