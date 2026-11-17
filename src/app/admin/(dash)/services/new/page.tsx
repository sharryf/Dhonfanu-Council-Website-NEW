import { AdminHeader } from "@/components/admin/ui";
import { ServiceForm } from "../form";

export const metadata = { title: "Add service" };

export default function NewService() {
  return (
    <>
      <AdminHeader title="Add service" backHref="/admin/services" />
      <ServiceForm />
    </>
  );
}
