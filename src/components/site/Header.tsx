import Link from "next/link";
import { Clock, Mail, Phone } from "lucide-react";
import { pick, type Dict, type Locale } from "@/lib/i18n";
import { telHref } from "@/lib/format";
import type { Site } from "@/lib/site";
import { LangSwitch } from "./LangSwitch";
import { DesktopNav, MobileNav, type NavItem } from "./Nav";

export function navItems(t: Dict): NavItem[] {
  return [
    { href: "/", label: t.nav.home },
    { href: "/announcements", label: t.nav.announcements },
    { href: "/news", label: t.nav.news },
    { href: "/council", label: t.nav.council },
    { href: "/about", label: t.nav.about },
    { href: "/downloads", label: t.nav.downloads },
    { href: "/services", label: t.nav.services },
    { href: "/contact", label: t.nav.contact },
  ];
}

export function Header({ locale, t, site }: { locale: Locale; t: Dict; site: Site }) {
  const items = navItems(t);
  const name = pick(locale, site.councilNameEn, site.councilNameDv);
  const hours = pick(locale, site.officeHoursEn, site.officeHoursDv);

  return (
    <header className="sticky top-0 z-50 bg-navy text-white">
      {/* Utility bar */}
      <div className="border-b border-white/10">
        <div className="container-page flex h-10 items-center justify-between gap-4 text-xs">
          <div className="flex min-w-0 items-center gap-5 text-white/75">
            {site.hotline && (
              <a href={telHref(site.hotline)} className="inline-flex items-center gap-1.5 font-semibold text-aqua hover:text-white">
                <Phone className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{t.common.hotline}:</span>
                <bdi dir="ltr">{site.hotline}</bdi>
              </a>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="hidden items-center gap-1.5 hover:text-white md:inline-flex">
                <Mail className="size-3.5" aria-hidden="true" />
                <bdi dir="ltr">{site.email}</bdi>
              </a>
            )}
            {hours && (
              <span className="hidden items-center gap-1.5 lg:inline-flex">
                <Clock className="size-3.5" aria-hidden="true" />
                {hours}
              </span>
            )}
          </div>
          <LangSwitch locale={locale} label={t.switchTo} />
        </div>
      </div>

      {/* Brand + navigation */}
      <div className="relative">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src={site.logoUrl || "/images/logo.svg"}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full bg-white object-contain p-0.5"
            />
            <span className="min-w-0">
              <span className="block truncate text-base font-bold leading-tight sm:text-lg">{name}</span>
              <span className="block truncate text-[11px] leading-tight text-aqua/90">{t.atoll}</span>
            </span>
          </Link>
          <DesktopNav items={items} />
          <MobileNav items={items} menuLabel={t.menu} closeLabel={t.close} />
        </div>
      </div>
    </header>
  );
}
