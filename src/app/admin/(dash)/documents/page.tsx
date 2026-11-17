import { FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS, oneOf } from "@/lib/constants";
import { ConfirmForm } from "@/components/admin/ActionForm";
import { AdminHeader, EditLink, EmptyRow, Flash, Pill } from "@/components/admin/ui";
import { deleteDocument } from "../../actions";

export const metadata = { title: "Downloads" };

export default async function DocumentsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const items = await prisma.document.findMany({ orderBy: [{ category: "asc" }, { publishedAt: "desc" }] });

  return (
    <>
      <AdminHeader
        title="Downloads & publications"
        description="Forms, regulations, budgets, development plans and annual reports."
        newHref="/admin/documents/new"
        newLabel="Upload document"
      />
      <Flash {...sp} />
      {items.length === 0 ? (
        <EmptyRow text="No documents uploaded yet." />
      ) : (
        <ul className="grid gap-2">
          {items.map((d) => (
            <li key={d.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-aqua-soft text-teal">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <Pill tone="aqua">{DOCUMENT_CATEGORY_LABELS[oneOf(DOCUMENT_CATEGORIES, d.category, "OTHER")]}</Pill>
                  <Pill tone="navy">{(d.fileType || "file").toUpperCase()}</Pill>
                  {d.fileSize > 0 && <Pill>{formatBytes(d.fileSize)}</Pill>}
                  {!d.published && <Pill>Hidden</Pill>}
                </div>
                <p className="truncate font-semibold text-navy" dir="auto">
                  {d.titleEn || d.titleDv}
                </p>
                <p className="text-xs text-navy/55">
                  {formatDate(d.publishedAt, "en")}
                  {d.year && ` · ${d.year}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <EditLink href={`/admin/documents/${d.id}`} />
                <ConfirmForm action={deleteDocument} id={d.id} iconOnly />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
