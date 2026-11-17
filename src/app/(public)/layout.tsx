import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thaana, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Ticker } from "@/components/site/Ticker";
import { getContext } from "@/lib/site";
import { pick } from "@/lib/i18n";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const thaana = Noto_Sans_Thaana({
  subsets: ["thaana"],
  variable: "--font-thaana-noto",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, site } = await getContext();
  const name = pick(locale, site.councilNameEn, site.councilNameDv);
  const description = pick(locale, site.heroSubtitleEn, site.heroSubtitleDv) || pick(locale, site.taglineEn, site.taglineDv);
  return {
    title: { default: name, template: `%s · ${name}` },
    description,
    icons: { icon: site.logoUrl || "/images/logo.svg" },
  };
}

export const viewport: Viewport = {
  themeColor: "#071B2B",
  width: "device-width",
  initialScale: 1,
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { locale, t, site } = await getContext();
  const ticker = site.tickerEnabled ? pick(locale, site.tickerEn, site.tickerDv) : "";

  return (
    <html lang={locale} dir={t.dir} className={`${jakarta.variable} ${thaana.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy"
        >
          {t.skipToContent}
        </a>
        <Header locale={locale} t={t} site={site} />
        {ticker && <Ticker text={ticker} label={t.common.urgent} />}
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer locale={locale} t={t} site={site} />
      </body>
    </html>
  );
}
