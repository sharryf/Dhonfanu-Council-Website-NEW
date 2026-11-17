import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getContext, getLocale } from "@/lib/site";
import { getDict, pick } from "@/lib/i18n";
import { formatBytes, formatDate } from "@/lib/format";
import { DOCUMENT_CATEGORIES, oneOf } from "@/lib/constants";
import { PageHeader } from "@/components/site/PageHeader";
import { DownloadsBrowser, type DownloadItem } from "@/components/site/DownloadsBrowser";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.downloads.title, description: t.downloads.subtitle };
}

export default async function DownloadsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { locale, t } = await getContext();
  const initialCategory = oneOf(["ALL", ...DOCUMENT_CATEGORIES] as const, (await searchParams).category, "ALL");

  const documents = await prisma.document.findMany({
    where: { published: true, fileUrl: { not: "" } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
  });

  const items: DownloadItem[] = documents.map((d) => {
    const category = oneOf(DOCUMENT_CATEGORIES, d.category, "OTHER");
    return {
      id: d.id,
      category,
      categoryLabel: t.docCat[category],
      title: pick(locale, d.titleEn, d.titleDv),
      description: pick(locale, d.descriptionEn, d.descriptionDv),
      haystack: [d.titleEn, d.titleDv, d.descriptionEn, d.descriptionDv, d.year ?? ""].join(" ").toLowerCase(),
      fileUrl: d.fileUrl,
      fileType: d.fileType || "file",
      fileSize: formatBytes(d.fileSize),
      year: d.year,
      date: formatDate(d.publishedAt, locale),
    };
  });

  const tabs = [{ key: "ALL", label: t.docCat.ALL }, ...DOCUMENT_CATEGORIES.map((c) => ({ key: c, label: t.docCat[c] }))];

  return (
    <>
      <PageHeader title={t.downloads.title} subtitle={t.downloads.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.downloads }]} />
      <div className="container-page mt-8">
        <DownloadsBrowser
          items={items}
          tabs={tabs}
          initialCategory={initialCategory}
          labels={{
            searchPlaceholder: t.downloads.searchPlaceholder,
            empty: t.downloads.empty,
            documents: t.downloads.documents,
            download: t.common.download,
            view: t.common.view,
            clear: t.close,
          }}
        />
      </div>
    </>
  );
}
