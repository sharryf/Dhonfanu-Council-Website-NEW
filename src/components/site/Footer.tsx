import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SocialIcon } from "@/components/Icon";
import { pick, type Dict, type Locale } from "@/lib/i18n";
import { telHref } from "@/lib/format";
import type { Site } from "@/lib/site";
import { navItems } from "./Header";

export function Footer({ locale, t, site }: { locale: Locale; t: Dict; site: Site }) {
  const name = pick(locale, site.councilNameEn, site.councilNameDv);
  const tagline = pick(locale, site.taglineEn, site.taglineDv);
  const address = pick(locale, site.addressEn, site.addressDv);
  const hours = pick(locale, site.officeHoursEn, site.officeHoursDv);
  const note = pick(locale, site.footerNoteEn, site.footerNoteDv);

  const socials = [
    { name: "facebook" as const, url: site.facebookUrl, label: "Facebook" },
    { name: "x" as const, url: site.twitterUrl, label: "X" },
    { name: "instagram" as const, url: site.instagramUrl, label: "Instagram" },
    { name: "youtube" as const, url: site.youtubeUrl, label: "YouTube" },
  ].filter((s) => s.url);

  return (
    <footer className="navy-pattern mt-16 text-white/80">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={site.logoUrl || "/images/logo.svg"}
              alt=""
              width={48}
              height={48}
              className="size-12 rounded-full bg-white object-contain p-0.5"
            />
            <div>
              <p className="text-lg font-bold text-white">{name}</p>
              <p className="text-xs text-aqua/90">{t.atoll}</p>
            </div>
          </div>
          {tagline && <p className="mt-4 max-w-sm text-sm">{tagline}</p>}
          {socials.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-aqua">{t.common.followUs}</p>
              <ul className="flex gap-2">
                {socials.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="inline-flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-teal"
                    >
                      <SocialIcon name={s.name} className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <nav aria-label={t.common.quickLinks}>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-aqua">{t.common.quickLinks}</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-1 lg:grid-cols-2">
            {navItems(t)
              .slice(1)
              .map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-aqua">{t.common.contactUs}</p>
          <ul className="space-y-2.5 text-sm">
            {address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <span>{address}</span>
              </li>
            )}
            {site.phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <a href={telHref(site.phone)} className="hover:text-white">
                  <bdi dir="ltr">{site.phone}</bdi>
                </a>
              </li>
            )}
            {site.viber && (
              <li className="flex gap-2.5">
                <SocialIcon name="viber" className="mt-1 size-4 shrink-0 text-aqua" />
                <span>
                  {t.common.viber}: <bdi dir="ltr">{site.viber}</bdi>
                </span>
              </li>
            )}
            {site.email && (
              <li className="flex gap-2.5">
                <Mail className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <a href={`mailto:${site.email}`} className="hover:text-white">
                  <bdi dir="ltr">{site.email}</bdi>
                </a>
              </li>
            )}
            {hours && (
              <li className="flex gap-2.5">
                <Clock className="mt-1 size-4 shrink-0 text-aqua" aria-hidden="true" />
                <span>{hours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-white/60 sm:flex-row">
          <p>
            © <bdi dir="ltr">{new Date().getFullYear()}</bdi> {name}. {t.common.rights}
            {note && <span className="ms-1">{note}</span>}
          </p>
          <Link href="/admin" prefetch={false} className="hover:text-white">
            {t.common.staffLogin}
          </Link>
        </div>
      </div>
    </footer>
  );
}
