import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { NEWS_CATEGORIES, NEWS_CATEGORY_LABELS, oneOf } from "@/lib/constants";
import { ConfirmForm } from "@/components/admin/ActionForm";
import { AdminHeader, EditLink, EmptyRow, Flash, Pill } from "@/components/admin/ui";
import { deleteNews } from "../../actions";

export const metadata = { title: "News & updates" };

export default async function NewsAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const items = await prisma.news.findMany({ orderBy: [{ publishedAt: "desc" }, { id: "desc" }] });

  return (
    <>
      <AdminHeader title="News & updates" description="Articles shown on the home page and the News section." newHref="/admin/news/new" newLabel="New article" />
      <Flash {...sp} />
      {items.length === 0 ? (
        <EmptyRow text="No news articles yet." />
      ) : (
        <ul className="grid gap-3">
          {items.map((n) => (
            <li key={n.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <img src={n.imageUrl || "/images/placeholder.svg"} alt="" className="h-16 w-24 shrink-0 rounded-lg bg-aqua-soft object-cover" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap gap-1.5">
                  <Pill tone="aqua">{NEWS_CATEGORY_LABELS[oneOf(NEWS_CATEGORIES, n.category, "COUNCIL")]}</Pill>
                  <Pill tone={n.published ? "teal" : "muted"}>{n.published ? "Published" : "Draft"}</Pill>
                  {n.featured && <Pill tone="navy">Featured</Pill>}
                </div>
                <p className="truncate font-semibold text-navy" dir="auto">
                  {n.titleEn || n.titleDv}
                </p>
                <p className="text-xs text-navy/55">
                  {formatDate(n.publishedAt, "en")} · /news/{n.slug}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <EditLink href={`/admin/news/${n.id}`} />
                <ConfirmForm action={deleteNews} id={n.id} iconOnly />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
