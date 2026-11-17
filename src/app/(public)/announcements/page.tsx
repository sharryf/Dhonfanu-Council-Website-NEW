import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getContext } from "@/lib/site";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/site";
import { ANNOUNCEMENT_CATEGORIES, oneOf } from "@/lib/constants";
import { PageHeader } from "@/components/site/PageHeader";
import { AnnouncementItem, EmptyState } from "@/components/site/cards";
import { AnnouncementFilters } from "@/components/site/AnnouncementFilters";

const PAGE_SIZE = 10;

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.announcements.title, description: t.announcements.subtitle };
}

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { locale, t } = await getContext();
  const sp = await searchParams;
  const category = oneOf(["ALL", ...ANNOUNCEMENT_CATEGORIES] as const, sp.category, "ALL");
  const q = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const search: Prisma.AnnouncementWhereInput = q
    ? {
        OR: [
          { titleEn: { contains: q } },
          { titleDv: { contains: q } },
          { refNumber: { contains: q } },
          { contentEn: { contains: q } },
          { contentDv: { contains: q } },
        ],
      }
    : {};
  const base: Prisma.AnnouncementWhereInput = { published: true, ...search };
  const where: Prisma.AnnouncementWhereInput = category === "ALL" ? base : { ...base, category };

  const [items, total, grouped] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy: [{ publishDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.announcement.count({ where }),
    prisma.announcement.groupBy({ by: ["category"], where: base, _count: { _all: true } }),
  ]);

  const counts = Object.fromEntries(grouped.map((g) => [g.category, g._count._all])) as Record<string, number>;
  const allCount = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const tabs = [
    { key: "ALL", label: t.annCat.ALL, count: allCount },
    ...ANNOUNCEMENT_CATEGORIES.map((c) => ({ key: c, label: t.annCat[c], count: counts[c] ?? 0 })),
  ];

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (category !== "ALL") params.set("category", category);
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/announcements?${qs}` : "/announcements";
  };

  return (
    <>
      <PageHeader title={t.announcements.title} subtitle={t.announcements.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.announcements }]} />
      <div className="container-page mt-8 grid gap-5">
        <AnnouncementFilters
          key={category}
          tabs={tabs}
          active={category}
          query={q}
          placeholder={t.announcements.searchPlaceholder}
          clearLabel={t.close}
        />

        {items.length === 0 ? (
          <EmptyState text={t.announcements.empty} />
        ) : (
          <div className="grid gap-3">
            {items.map((a) => (
              <AnnouncementItem key={a.id} item={a} locale={locale} t={t} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="btn-outline">
                {t.common.previous}
              </Link>
            ) : (
              <span />
            )}
            <p className="text-sm text-navy/60">
              {t.common.page}{" "}
              <bdi dir="ltr">
                {page} {t.common.of} {pages}
              </bdi>
            </p>
            {page < pages ? (
              <Link href={pageHref(page + 1)} className="btn-outline">
                {t.common.next}
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </>
  );
}
