"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Switches between Dhivehi (RTL) and English (LTR) without leaving the page. */
export function LangSwitch({ locale, label, className = "" }: { locale: Locale; label: string; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const target: Locale = locale === "dv" ? "en" : "dv";

  function switchLanguage() {
    document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={pending}
      lang={target}
      aria-label={target === "dv" ? "ދިވެހި ބަހަށް ބަދަލުކުރޭ" : "Switch to English"}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-teal disabled:opacity-60 ${className}`}
    >
      <Languages className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
