import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { MEMBER_GROUPS, MEMBER_GROUP_LABELS } from "@/lib/constants";
import { ConfirmForm } from "@/components/admin/ActionForm";
import { AdminHeader, EditLink, Flash } from "@/components/admin/ui";
import { deleteMember } from "../../actions";

export const metadata = { title: "Council, WDC & staff" };

export default async function MembersAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const members = await prisma.member.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] });

  return (
    <>
      <AdminHeader title="Council, WDC & staff" description="People shown on The Council page, in display order within each group." newHref="/admin/members/new" newLabel="Add person" />
      <Flash {...sp} />
      <div className="grid gap-8">
        {MEMBER_GROUPS.map((group) => {
          const list = members.filter((m) => m.group === group);
          return (
            <section key={group}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-bold text-navy">
                  {MEMBER_GROUP_LABELS[group]} <span className="font-normal text-navy/45">({list.length})</span>
                </h2>
                <Link href={`/admin/members/new?group=${group}`} className="btn-ghost px-3 py-1.5">
                  <Plus className="size-4" aria-hidden="true" />
                  Add
                </Link>
              </div>
              {list.length === 0 ? (
                <p className="card px-5 py-6 text-sm text-navy/55">Nobody listed in this group yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {list.map((m) => (
                    <li key={m.id} className="card flex items-center gap-4 p-3">
                      <img src={m.photoUrl || "/images/avatar.svg"} alt="" className="size-12 shrink-0 rounded-full bg-aqua-soft object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-navy">
                          {m.nameEn}
                          {m.nameEn && m.nameDv && " · "}
                          <span lang="dv">{m.nameDv}</span>
                        </p>
                        <p className="truncate text-xs text-navy/55">
                          {m.roleEn || m.roleDv}
                          {m.term && ` · ${m.term}`} · order {m.order}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <EditLink href={`/admin/members/${m.id}`} />
                        <ConfirmForm action={deleteMember} id={m.id} iconOnly />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
