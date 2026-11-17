import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale, getPageContent } from "@/lib/site";
import { getDict, pick } from "@/lib/i18n";
import { telHref } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { PageHeader } from "@/components/site/PageHeader";
import { MapEmbed } from "@/components/site/MapEmbed";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.about.title, description: t.about.subtitle };
}

export default async function AboutPage() {
  const { locale, t, site } = await getContext();
  const [intro, history, hanifaru, stats, facilities] = await Promise.all([
    getPageContent("about.intro"),
    getPageContent("about.history"),
    getPageContent("about.hanifaru"),
    prisma.islandStat.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    prisma.facility.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
  ]);

  const blocks = [
    { content: intro, fallbackImage: "/images/aerial.svg" },
    { content: history, fallbackImage: "/images/harbor.svg" },
  ].filter((b) => b.content && pick(locale, b.content.bodyEn, b.content.bodyDv));

  return (
    <>
      <PageHeader title={t.about.title} subtitle={t.about.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.about }]} />

      <div className="container-page mt-8 grid gap-12">
        {blocks.map((b, i) => (
          <section key={b.content!.key} className="card grid overflow-hidden lg:grid-cols-2">
            <div className={`relative min-h-60 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
              <img src={b.content!.imageUrl || b.fallbackImage} alt="" className="absolute inset-0 size-full object-cover" loading={i ? "lazy" : undefined} />
            </div>
            <div className="p-6 sm:p-10">
              <h2 className="section-title" dir="auto">
                {pick(locale, b.content!.titleEn, b.content!.titleDv)}
              </h2>
              <div className="prose-civic mt-3 whitespace-pre-line" dir="auto">
                {pick(locale, b.content!.bodyEn, b.content!.bodyDv)}
              </div>
            </div>
          </section>
        ))}

        {stats.length > 0 && (
          <section aria-labelledby="facts-heading">
            <h2 id="facts-heading" className="section-title mb-6">
              {t.about.facts}
            </h2>
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.id} className="card p-5">
                  <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-aqua-soft text-teal">
                    <Icon name={s.icon} className="size-5" />
                  </span>
                  <dd className="text-2xl font-extrabold text-navy">
                    <bdi dir="ltr">{s.value}</bdi>{" "}
                    <span className="text-xs font-semibold text-navy/50">{pick(locale, s.unitEn, s.unitDv)}</span>
                  </dd>
                  <dt className="mt-0.5 text-sm text-navy/60">{pick(locale, s.labelEn, s.labelDv)}</dt>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {/* Hanifaru Bay band */}
      {hanifaru && pick(locale, hanifaru.bodyEn, hanifaru.bodyDv) && (
        <section className="navy-pattern mt-12 text-white">
          <div className="container-page grid items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
            <div>
              <p className="badge-aqua mb-3">{t.about.unesco}</p>
              <h2 className="text-2xl font-bold sm:text-3xl" dir="auto">
                {pick(locale, hanifaru.titleEn, hanifaru.titleDv)}
              </h2>
              <div className="mt-4 whitespace-pre-line text-sm text-white/80 sm:text-base" dir="auto">
                {pick(locale, hanifaru.bodyEn, hanifaru.bodyDv)}
              </div>
            </div>
            <img
              src={hanifaru.imageUrl || "/images/manta.svg"}
              alt=""
              loading="lazy"
              className="aspect-[16/10] w-full rounded-2xl object-cover shadow-lift ring-1 ring-white/10"
            />
          </div>
        </section>
      )}

      <div className="container-page mt-12 grid gap-12">
        {facilities.length > 0 && (
          <section aria-labelledby="facilities-heading">
            <h2 id="facilities-heading" className="section-title">
              {t.about.facilities}
            </h2>
            <p className="mb-6 mt-1 text-sm text-navy/60">{t.about.facilitiesHint}</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {facilities.map((f) => (
                <li key={f.id} className="card flex gap-4 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal text-white">
                    <Icon name={f.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-navy" dir="auto">
                      {pick(locale, f.nameEn, f.nameDv)}
                    </h3>
                    <p className="text-sm text-navy/65" dir="auto">
                      {pick(locale, f.descriptionEn, f.descriptionDv)}
                    </p>
                    {f.phone && (
                      <a href={telHref(f.phone)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
                        <Phone className="size-3.5" aria-hidden="true" />
                        <bdi dir="ltr">{f.phone}</bdi>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="location-heading">
          <h2 id="location-heading" className="section-title mb-6">
            {t.about.location}
          </h2>
          <MapEmbed lat={site.mapLat} lng={site.mapLng} zoom={Math.max(site.mapZoom - 2, 3)} title={t.about.location} openLabel={t.contact.openMap} />
        </section>
      </div>
    </>
  );
}
