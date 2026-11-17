import { AdminHeader } from "@/components/admin/ui";
import { AnnouncementForm } from "../form";

export const metadata = { title: "New announcement" };

export default function NewAnnouncement() {
  return (
    <>
      <AdminHeader title="New announcement" backHref="/admin/announcements" />
      <AnnouncementForm />
    </>
  );
}
