import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/db";
import { getContext, getLocale } from "@/lib/site";
import { getDict, pick } from "@/lib/i18n";
import { telHref } from "@/lib/format";
import { SUBMISSION_TYPES, oneOf } from "@/lib/constants";
import { SocialIcon } from "@/components/Icon";
import { PageHeader } from "@/components/site/PageHeader";
import { MapEmbed } from "@/components/site/MapEmbed";
import { ContactForm } from "@/components/site/ContactForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await getLocale());
  return { title: t.contact.title, description: t.contact.subtitle };
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ type?: string; service?: string }> }) {
  const { locale, t, site } = await getContext();
  const sp = await searchParams;
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: [{ order: "asc" }, { id: "asc" }] });

  const serviceId = services.some((s) => String(s.id) === sp.service) ? String(sp.service) : "";
  const defaultType = oneOf(SUBMISSION_TYPES, sp.type, serviceId ? "SERVICE" : "INQUIRY");

  const address = pick(locale, site.addressEn, site.addressDv);
  const hours = pick(locale, site.officeHoursEn, site.officeHoursDv);

  const rows = [
    site.hotline && { icon: <Phone className="size-5" aria-hidden="true" />, label: t.common.hotline, value: site.hotline, href: telHref(site.hotline), ltr: true },
    site.phone && { icon: <Phone className="size-5" aria-hidden="true" />, label: t.common.phone, value: site.phone, href: telHref(site.phone), ltr: true },
    site.viber && { icon: <SocialIcon name="viber" className="size-5" />, label: t.common.viber, value: site.viber, href: undefined, ltr: true },
    site.email && { icon: <Mail className="size-5" aria-hidden="true" />, label: t.common.email, value: site.email, href: `mailto:${site.email}`, ltr: true },
    hours && { icon: <Clock className="size-5" aria-hidden="true" />, label: t.common.officeHours, value: hours, href: undefined, ltr: false },
    address && { icon: <MapPin className="size-5" aria-hidden="true" />, label: t.common.address, value: address, href: undefined, ltr: false },
  ].filter((r): r is Exclude<typeof r, "" | false> => Boolean(r));

  return (
    <>
      <PageHeader title={t.contact.title} subtitle={t.contact.subtitle} homeLabel={t.nav.home} crumbs={[{ label: t.nav.contact }]} />
      <div className="container-page mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ContactForm
          t={t.contact}
          services={services.map((s) => ({ id: s.id, title: pick(locale, s.titleEn, s.titleDv) }))}
          defaultType={defaultType}
          defaultServiceId={serviceId}
        />

        <aside className="grid content-start gap-6">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold text-navy">{t.contact.infoTitle}</h2>
            <dl className="grid gap-4">
              {rows.map((r) => (
                <div key={r.label} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-aqua-soft text-teal">{r.icon}</span>
                  <div className="min-w-0">
                    <dt className="text-xs text-navy/55">{r.label}</dt>
                    <dd className="break-words text-sm font-semibold text-navy">
                      {r.href ? (
                        <a href={r.href} className="hover:text-teal hover:underline">
                          <bdi dir="ltr">{r.value}</bdi>
                        </a>
                      ) : r.ltr ? (
                        <bdi dir="ltr">{r.value}</bdi>
                      ) : (
                        r.value
                      )}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="mb-3 text-lg font-bold text-navy">{t.contact.findUs}</h2>
            <MapEmbed lat={site.mapLat} lng={site.mapLng} zoom={site.mapZoom} title={t.contact.findUs} openLabel={t.contact.openMap} />
          </div>
        </aside>
      </div>
    </>
  );
}
