import { AdminHeader } from "@/components/admin/ui";
import { DocumentForm } from "../form";

export const metadata = { title: "Upload document" };

export default function NewDocument() {
  return (
    <>
      <AdminHeader title="Upload document" backHref="/admin/documents" />
      <DocumentForm />
    </>
  );
}
