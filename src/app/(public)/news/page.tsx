import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getContext, getLocale } from "@/lib/site";
import { getDict } from "@/lib/i18n";
import { NEWS_CATEGORIES, oneOf } from "@/lib/constants";
import { PageHeader } from "@/components/site/PageHeader";
import { EmptyState, NewsCard } from "@/components/site/cards";

const PAGE_SIZE = 9;

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.news.title, description: t.news.subtitle };
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const { locale, t } = await getContext();
  const sp = await searchParams;
  const category = oneOf(["ALL", ...NEWS_CATEGORIES] as const, sp.category, "ALL");
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where = { published: true, ...(category === "ALL" ? {} : { category }) };

  const [items, total, used] = await Promise.all([
    prisma.news.findMany({ where, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.news.count({ where }),
    prisma.news.groupBy({ by: ["category"], where: { published: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const usedCats = NEWS_CATEGORIES.filter((c) => used.some((u) => u.category === c));

  const href = (cat: string, p = 1) => {
    const params = new URLSearchParams();
    if (cat !== "ALL") params.set("category", cat);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/news?${qs}` : "/news";
  };

  return (
    <>
      <PageHeader title={t.news.title} subtitle={t.news.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.news }]} />
      <div className="container-page mt-8">
        {usedCats.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
            {(["ALL", ...usedCats] as const).map((c) => (
              <Link
                key={c}
                href={href(c)}
                aria-current={c === category ? "true" : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  c === category ? "bg-teal text-white" : "bg-white text-navy/70 ring-1 ring-navy/10 hover:bg-aqua-soft"
                }`}
              >
                {c === "ALL" ? t.common.all : t.newsCat[c]}
              </Link>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState text={t.news.empty} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((n) => (
              <NewsCard key={n.id} item={n} locale={locale} t={t} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-3">
            {page > 1 ? (
              <Link href={href(category, page - 1)} className="btn-outline">
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
              <Link href={href(category, page + 1)} className="btn-outline">
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
