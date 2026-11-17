"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  Settings,
  TreePalm,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/submissions", label: "Citizen inbox", icon: Inbox },
  { href: "/admin/announcements", label: "Announcements & tenders", icon: Megaphone },
  { href: "/admin/news", label: "News & updates", icon: Newspaper },
  { href: "/admin/members", label: "Council, WDC & staff", icon: Users },
  { href: "/admin/documents", label: "Downloads", icon: FileText },
  { href: "/admin/services", label: "E-Services", icon: Zap },
  { href: "/admin/island", label: "Island profile", icon: TreePalm },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
  { href: "/admin/account", label: "My account", icon: UserRound },
];

export function Sidebar({
  councilName,
  logoUrl,
  username,
  inboxCount,
  logoutAction,
}: {
  councilName: string;
  logoUrl: string;
  username: string;
  inboxCount: number;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-navy px-4 text-white lg:hidden">
        <span className="flex items-center gap-2 text-sm font-bold">
          <img src={logoUrl} alt="" className="size-8 rounded-full bg-white p-0.5" />
          Admin
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center rounded-xl bg-white/10"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>

      <aside
        className={`navy-pattern fixed inset-y-0 left-0 z-30 w-64 flex-col text-white/80 lg:flex ${open ? "flex pt-14 lg:pt-0" : "hidden"}`}
      >
        <div className="hidden items-center gap-3 border-b border-white/10 px-5 py-4 lg:flex">
          <img src={logoUrl} alt="" className="size-10 rounded-full bg-white object-contain p-0.5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{councilName}</p>
            <p className="text-xs text-aqua">Content management</p>
          </div>
        </div>

        <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
          <ul className="grid gap-0.5">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      active ? "bg-teal text-white" : "hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <link.icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{link.label}</span>
                    {link.href === "/admin/submissions" && inboxCount > 0 && (
                      <span className="rounded-full bg-aqua px-2 text-xs font-bold text-navy">{inboxCount}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="grid gap-1 border-t border-white/10 p-3">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-white/10 hover:text-white">
            <ExternalLink className="size-4" aria-hidden="true" />
            View public site
          </a>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-white/10 hover:text-white">
              <LogOut className="size-4" aria-hidden="true" />
              <span className="flex-1 text-left">Sign out</span>
              <span className="truncate text-xs font-normal text-white/50">{username}</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
