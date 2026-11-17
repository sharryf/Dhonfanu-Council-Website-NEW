import { AdminHeader } from "@/components/admin/ui";
import { NewsForm } from "../form";

export const metadata = { title: "New article" };

export default function NewNews() {
  return (
    <>
      <AdminHeader title="New article" backHref="/admin/news" />
      <NewsForm />
    </>
  );
}
