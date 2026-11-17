import { prisma } from "@/lib/db";
import { Icon } from "@/components/Icon";
import { ConfirmForm } from "@/components/admin/ActionForm";
import { AdminHeader, EditLink, EmptyRow, Flash, Pill } from "@/components/admin/ui";
import { deleteService } from "../../actions";

export const metadata = { title: "E-Services" };

export default async function ServicesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const items = await prisma.service.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] });

  return (
    <>
      <AdminHeader title="E-Services" description="Service cards on the E-Services page and the quick-action pills on the home page." newHref="/admin/services/new" newLabel="Add service" />
      <Flash {...sp} />
      {items.length === 0 ? (
        <EmptyRow text="No services yet." />
      ) : (
        <ul className="grid gap-2">
          {items.map((s) => (
            <li key={s.id} className="card flex items-center gap-4 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal text-white">
                <Icon name={s.icon} className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <Pill tone={s.active ? "teal" : "muted"}>{s.active ? "Active" : "Hidden"}</Pill>
                  {s.featured && <Pill tone="aqua">Home page pill</Pill>}
                  <Pill>order {s.order}</Pill>
                </div>
                <p className="truncate font-semibold text-navy" dir="auto">
                  {s.titleEn || s.titleDv}
                </p>
                <p className="truncate text-xs text-navy/55">{s.linkUrl || "Opens the online request form"}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <EditLink href={`/admin/services/${s.id}`} />
                <ConfirmForm action={deleteService} id={s.id} iconOnly />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
