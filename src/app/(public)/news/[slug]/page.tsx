import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale } from "@/lib/site";
import { pick } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { NEWS_CATEGORIES, oneOf } from "@/lib/constants";
import { NewsCard } from "@/components/site/cards";

type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  return prisma.news.findFirst({ where: { slug: decodeURIComponent(slug), published: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await load((await params).slug);
  if (!item) return {};
  const locale = await getLocale();
  return {
    title: pick(locale, item.titleEn, item.titleDv),
    description: pick(locale, item.excerptEn, item.excerptDv),
    openGraph: item.imageUrl ? { images: [item.imageUrl] } : undefined,
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const item = await load((await params).slug);
  if (!item) notFound();
  const { locale, t } = await getContext();

  const related = await prisma.news.findMany({
    where: { published: true, id: { not: item.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const title = pick(locale, item.titleEn, item.titleDv);
  const excerpt = pick(locale, item.excerptEn, item.excerptDv);
  const content = pick(locale, item.contentEn, item.contentDv);
  const cat = oneOf(NEWS_CATEGORIES, item.category, "COUNCIL");

  return (
    <div className="container-page mt-8">
      <article className="mx-auto max-w-3xl">
        <Link href="/news" className="btn-ghost -ms-3 mb-4 px-3 py-2">
          <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t.news.backToList}
        </Link>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="badge-aqua">{t.newsCat[cat]}</span>
          <span className="font-sub inline-flex items-center gap-1.5 text-sm text-navy/60">
            <CalendarDays className="size-4 text-teal" aria-hidden="true" />
            {formatDate(item.publishedAt, locale)}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-navy sm:text-4xl" dir="auto">
          {title}
        </h1>
        {excerpt && (
          <p className="font-sub mt-4 text-lg text-navy/70" dir="auto">
            {excerpt}
          </p>
        )}
        <div className="card mt-6 overflow-hidden">
          <img src={item.imageUrl || "/images/placeholder.svg"} alt="" className="aspect-[16/9] w-full bg-aqua-soft object-cover" />
          {/* Content is sanitised on save (see src/lib/sanitize.ts). */}
          <div className="prose-civic p-6 sm:p-10" dir="auto" dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="section-title mb-6">{t.news.related}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((n) => (
              <NewsCard key={n.id} item={n} locale={locale} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
