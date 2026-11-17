import type { Metadata } from "next";
import { Noto_Sans_Thaana, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const thaana = Noto_Sans_Thaana({ subsets: ["thaana"], variable: "--font-thaana-noto", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin · Dhonfanu Council", template: "%s · Dhonfanu Council Admin" },
  robots: { index: false, follow: false },
};

// The dashboard is always English/LTR; Dhivehi fields switch to RTL individually.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${jakarta.variable} ${thaana.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
