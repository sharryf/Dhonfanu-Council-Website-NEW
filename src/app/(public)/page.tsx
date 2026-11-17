import Link from "next/link";
import { ArrowRight, Clock, Download, FileText, MapPin, MessageSquareWarning, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getPageContent } from "@/lib/site";
import { pick } from "@/lib/i18n";
import { formatBytes, telHref } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { SearchForm } from "@/components/site/SearchForm";
import { AnnouncementItem, EmptyState, NewsCard, SectionHeading } from "@/components/site/cards";

export default async function HomePage() {
  const { locale, t, site } = await getContext();

  const [services, stats, announcements, news, documents, intro, hanifaru] = await Promise.all([
    prisma.service.findMany({ where: { active: true, featured: true }, orderBy: [{ order: "asc" }, { id: "asc" }], take: 6 }),
    prisma.islandStat.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }], take: 4 }),
    prisma.announcement.findMany({ where: { published: true }, orderBy: [{ publishDate: "desc" }, { id: "desc" }], take: 5 }),
    prisma.news.findMany({ where: { published: true }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }], take: 4 }),
    prisma.document.findMany({ where: { published: true }, orderBy: [{ publishedAt: "desc" }, { id: "desc" }], take: 4 }),
    getPageContent("about.intro"),
    getPageContent("about.hanifaru"),
  ]);

  const heroTitle = pick(locale, site.heroTitleEn, site.heroTitleDv) || pick(locale, site.councilNameEn, site.councilNameDv);
  const heroSubtitle = pick(locale, site.heroSubtitleEn, site.heroSubtitleDv);
  const hours = pick(locale, site.officeHoursEn, site.officeHoursDv);
  const address = pick(locale, site.addressEn, site.addressDv);
  const [leadNews, ...otherNews] = news;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy text-white">
        <img
          src={site.heroImageUrl || "/images/hero.svg"}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy/85 via-navy/70 to-navy/90" />
        <div className="container-page pb-24 pt-14 sm:pb-28 sm:pt-20">
          <p className="badge-aqua mb-4">{t.atoll}</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl" dir="auto">
            {heroTitle}
          </h1>
          {heroSubtitle && (
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg" dir="auto">
              {heroSubtitle}
            </p>
          )}
          <div className="mt-8 max-w-2xl">
            <SearchForm placeholder={t.common.searchPlaceholder} buttonLabel={t.common.search} />
          </div>

          {services.length > 0 && (
            <div className="mt-7">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-aqua">{t.home.eServices}</p>
              <ul className="flex flex-wrap gap-2">
                {services.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/services#service-${s.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-teal hover:ring-teal"
                    >
                      <Icon name={s.icon} className="size-4 text-aqua" />
                      <span dir="auto">{pick(locale, s.titleEn, s.titleDv)}</span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-aqua hover:text-white"
                  >
                    {t.home.allServices}
                    <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Key facts strip */}
      {stats.length > 0 && (
        <section aria-label={t.about.facts} className="container-page relative z-10 -mt-12">
          <dl className="card grid grid-cols-2 divide-navy/5 overflow-hidden lg:grid-cols-4 lg:divide-x rtl:lg:divide-x-reverse">
            {stats.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4 sm:p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-aqua-soft text-teal">
                  <Icon name={s.icon} className="size-5" />
                </span>
                <div className="min-w-0">
                  <dd className="text-xl font-extrabold text-navy sm:text-2xl">
                    <bdi dir="ltr">{s.value}</bdi>{" "}
                    <span className="text-xs font-semibold text-navy/50">{pick(locale, s.unitEn, s.unitDv)}</span>
                  </dd>
                  <dt className="text-xs text-navy/60">{pick(locale, s.labelEn, s.labelDv)}</dt>
                </div>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Announcements board + office card */}
      <section className="container-page mt-14 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <SectionHeading
            title={t.home.latestAnnouncements}
            hint={t.home.announcementsHint}
            href="/announcements"
            linkLabel={t.common.viewAll}
          />
          {announcements.length === 0 ? (
            <EmptyState text={t.common.noResults} />
          ) : (
            <div className="grid gap-3">
              {announcements.map((a) => (
                <AnnouncementItem key={a.id} item={a} locale={locale} t={t} />
              ))}
            </div>
          )}
        </div>

        <aside className="grid content-start gap-5">
          <div className="navy-pattern rounded-2xl p-6 text-white shadow-card">
            <h2 className="text-lg font-bold">{t.home.visitOffice}</h2>
            <ul className="mt-4 space-y-3 text-sm text-white/85">
              {hours && (
                <li className="flex gap-3">
                  <Clock className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-aqua">{t.common.officeHours}</span>
                    {hours}
                  </span>
                </li>
              )}
              {site.phone && (
                <li className="flex gap-3">
                  <Phone className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                  <span>
                    <span className="block text-xs text-aqua">{t.common.phone}</span>
                    <a href={telHref(site.phone)} className="font-semibold hover:underline">
                      <bdi dir="ltr">{site.phone}</bdi>
                    </a>
                  </span>
                </li>
              )}
              {address && (
                <li className="flex gap-3">
                  <MapPin className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                  <span>{address}</span>
                </li>
              )}
            </ul>
            <Link href="/contact" className="btn-primary mt-5 w-full">
              {t.common.contactUs}
            </Link>
          </div>

          {documents.length > 0 && (
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-navy">{t.home.latestDownloads}</h2>
                <Link href="/downloads" className="text-xs font-semibold text-teal hover:underline">
                  {t.common.viewAll}
                </Link>
              </div>
              <ul className="divide-y divide-navy/5">
                {documents.map((d) => (
                  <li key={d.id}>
                    <a href={d.fileUrl} download className="group flex items-center gap-3 py-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-aqua-soft text-teal">
                        <FileText className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy group-hover:text-teal" dir="auto">
                          {pick(locale, d.titleEn, d.titleDv)}
                        </span>
                        <bdi dir="ltr" className="block text-[11px] text-navy/50">
                          {d.fileType.toUpperCase()} · {formatBytes(d.fileSize)}
                        </bdi>
                      </span>
                      <Download className="size-4 shrink-0 text-navy/30 group-hover:text-teal" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>

      {/* News */}
      {leadNews && (
        <section className="container-page mt-16">
          <SectionHeading title={t.home.latestNews} hint={t.home.newsHint} href="/news" linkLabel={t.common.viewAll} />
          <div className="grid gap-5 lg:grid-cols-2">
            <NewsCard item={leadNews} locale={locale} t={t} large />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {otherNews.map((n) => (
                <NewsCard key={n.id} item={n} locale={locale} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Island highlights */}
      {(intro || hanifaru) && (
        <section className="container-page mt-16">
          <div className="card grid overflow-hidden lg:grid-cols-2">
            <div className="relative min-h-64">
              <img
                src={intro?.imageUrl || "/images/aerial.svg"}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <div className="p-6 sm:p-10">
              <p className="eyebrow mb-2">{t.about.unesco}</p>
              <h2 className="section-title" dir="auto">
                {pick(locale, intro?.titleEn, intro?.titleDv) || t.home.islandTitle}
              </h2>
              <p className="mt-3 line-clamp-5 text-sm text-navy/70 sm:text-base" dir="auto">
                {pick(locale, intro?.bodyEn, intro?.bodyDv)}
              </p>
              {hanifaru && (
                <div className="mt-5 flex gap-3 rounded-xl bg-aqua-soft p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal text-white">
                    <Icon name="Fish" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy" dir="auto">
                      {pick(locale, hanifaru.titleEn, hanifaru.titleDv)}
                    </p>
                    <p className="line-clamp-2 text-sm text-navy/70" dir="auto">
                      {pick(locale, hanifaru.bodyEn, hanifaru.bodyDv)}
                    </p>
                  </div>
                </div>
              )}
              <Link href="/about" className="btn-primary mt-6">
                {t.home.discover}
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Citizen feedback call-to-action */}
      <section className="container-page mt-16">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-teal p-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="flex gap-4">
            <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-white/15 sm:flex">
              <MessageSquareWarning className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">{t.home.helpTitle}</h2>
              <p className="mt-1 max-w-xl text-sm text-white/85">{t.home.helpText}</p>
            </div>
          </div>
          <Link href="/contact" className="btn shrink-0 bg-white text-navy hover:bg-aqua">
            {t.home.helpCta}
            <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
