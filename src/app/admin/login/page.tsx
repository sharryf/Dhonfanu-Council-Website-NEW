import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSite } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [site, sp] = await Promise.all([getSite(), searchParams]);
  return (
    <main className="navy-pattern flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <img src={site.logoUrl || "/images/logo.svg"} alt="" className="mb-3 size-16 rounded-full bg-white object-contain p-1" />
          <h1 className="text-xl font-bold">{site.councilNameEn || "Dhonfanu Council"}</h1>
          <p className="text-sm text-aqua">Staff sign-in · Content management</p>
        </div>
        <div className="card p-6">
          <LoginForm next={sp.next ?? ""} />
        </div>
        <Link href="/" className="mt-5 flex items-center justify-center gap-1.5 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the public site
        </Link>
      </div>
    </main>
  );
}
