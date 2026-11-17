import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileText, Megaphone, Newspaper } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale } from "@/lib/site";
import { getDict, pick } from "@/lib/i18n";
import { formatBytes, formatDate } from "@/lib/format";
import { DOCUMENT_CATEGORIES, oneOf } from "@/lib/constants";
import { PageHeader } from "@/components/site/PageHeader";
import { SearchForm } from "@/components/site/SearchForm";
import { CategoryBadge, EmptyState, StatusBadge } from "@/components/site/cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.search.title, robots: { index: false } };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { locale, t } = await getContext();
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const run = q.length >= 2;

  const [announcements, news, documents] = run
    ? await Promise.all([
        prisma.announcement.findMany({
          where: {
            published: true,
            OR: [
              { titleEn: { contains: q } },
              { titleDv: { contains: q } },
              { refNumber: { contains: q } },
              { contentEn: { contains: q } },
              { contentDv: { contains: q } },
            ],
          },
          orderBy: { publishDate: "desc" },
          take: 15,
        }),
        prisma.news.findMany({
          where: {
            published: true,
            OR: [
              { titleEn: { contains: q } },
              { titleDv: { contains: q } },
              { excerptEn: { contains: q } },
              { excerptDv: { contains: q } },
              { contentEn: { contains: q } },
              { contentDv: { contains: q } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: 15,
        }),
        prisma.document.findMany({
          where: {
            published: true,
            OR: [
              { titleEn: { contains: q } },
              { titleDv: { contains: q } },
              { descriptionEn: { contains: q } },
              { descriptionDv: { contains: q } },
            ],
          },
          orderBy: { publishedAt: "desc" },
          take: 15,
        }),
      ])
    : [[], [], []];

  const total = announcements.length + news.length + documents.length;

  return (
    <>
      <PageHeader title={t.search.title} subtitle={t.search.hint} homeLabel={t.nav.home} crumbs={[{ label: t.search.title }]} />
      <div className="container-page mt-8 grid gap-8">
        <SearchForm placeholder={t.common.searchPlaceholder} buttonLabel={t.common.search} defaultValue={q} variant="plain" />

        {run && (
          <p className="text-sm text-navy/65" aria-live="polite">
            {t.search.resultsFor} <strong className="text-navy" dir="auto">“{q}”</strong> — <bdi dir="ltr">{total}</bdi> {t.common.results}
          </p>
        )}

        {run && total === 0 && <EmptyState text={t.search.empty} />}

        {announcements.length > 0 && (
          <section aria-labelledby="s-ann">
            <h2 id="s-ann" className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
              <Megaphone className="size-5 text-teal" aria-hidden="true" />
              {t.search.announcements}
              <bdi dir="ltr" className="badge-muted">{announcements.length}</bdi>
            </h2>
            <ul className="card divide-y divide-navy/5">
              {announcements.map((a) => (
                <li key={a.id}>
                  <Link href={`/announcements/${a.id}`} className="group flex flex-col gap-1.5 p-4 hover:bg-aqua-soft/50 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block font-semibold text-navy group-hover:text-teal" dir="auto">
                        {pick(locale, a.titleEn, a.titleDv)}
                      </span>
                      <span className="text-xs text-navy/55">
                        <bdi dir="ltr">{a.refNumber}</bdi> · {formatDate(a.publishDate, locale)}
                      </span>
                    </span>
                    <span className="flex shrink-0 gap-1.5">
                      <CategoryBadge category={a.category} t={t} />
                      <StatusBadge deadline={a.deadline} t={t} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {news.length > 0 && (
          <section aria-labelledby="s-news">
            <h2 id="s-news" className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
              <Newspaper className="size-5 text-teal" aria-hidden="true" />
              {t.search.news}
              <bdi dir="ltr" className="badge-muted">{news.length}</bdi>
            </h2>
            <ul className="card divide-y divide-navy/5">
              {news.map((n) => (
                <li key={n.id}>
                  <Link href={`/news/${n.slug}`} className="group flex items-center gap-4 p-4 hover:bg-aqua-soft/50">
                    <img src={n.imageUrl || "/images/placeholder.svg"} alt="" loading="lazy" className="hidden h-14 w-20 shrink-0 rounded-lg object-cover sm:block" />
                    <span className="min-w-0">
                      <span className="block font-semibold text-navy group-hover:text-teal" dir="auto">
                        {pick(locale, n.titleEn, n.titleDv)}
                      </span>
                      <span className="line-clamp-1 text-sm text-navy/60" dir="auto">
                        {pick(locale, n.excerptEn, n.excerptDv)}
                      </span>
                      <span className="text-xs text-navy/50">{formatDate(n.publishedAt, locale)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {documents.length > 0 && (
          <section aria-labelledby="s-docs">
            <h2 id="s-docs" className="mb-3 flex items-center gap-2 text-lg font-bold text-navy">
              <FileText className="size-5 text-teal" aria-hidden="true" />
              {t.search.downloads}
              <bdi dir="ltr" className="badge-muted">{documents.length}</bdi>
            </h2>
            <ul className="card divide-y divide-navy/5">
              {documents.map((d) => (
                <li key={d.id}>
                  <a href={d.fileUrl} download className="group flex items-center justify-between gap-4 p-4 hover:bg-aqua-soft/50">
                    <span className="min-w-0">
                      <span className="block font-semibold text-navy group-hover:text-teal" dir="auto">
                        {pick(locale, d.titleEn, d.titleDv)}
                      </span>
                      <span className="text-xs text-navy/55">
                        {t.docCat[oneOf(DOCUMENT_CATEGORIES, d.category, "OTHER")]} ·{" "}
                        <bdi dir="ltr">
                          {d.fileType.toUpperCase()} {formatBytes(d.fileSize)}
                        </bdi>
                      </span>
                    </span>
                    <Download className="size-5 shrink-0 text-navy/30 group-hover:text-teal" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
