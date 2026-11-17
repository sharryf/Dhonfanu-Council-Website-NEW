import { prisma } from "@/lib/db";
import { PAGE_KEYS } from "@/lib/constants";
import { ActionForm, ConfirmForm } from "@/components/admin/ActionForm";
import { Bilingual, FileInput, Grid, IconSelect, TextInput } from "@/components/admin/fields";
import { AdminHeader } from "@/components/admin/ui";
import { deleteFacility, deleteStat, saveFacility, savePageContent, saveStat } from "../../actions";

export const metadata = { title: "Island profile" };

const FALLBACK_IMAGE: Record<string, string> = {
  "about.intro": "/images/aerial.svg",
  "about.history": "/images/harbor.svg",
  "about.hanifaru": "/images/manta.svg",
};

export default async function IslandAdmin() {
  const [contents, stats, facilities] = await Promise.all([
    prisma.pageContent.findMany(),
    prisma.islandStat.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
    prisma.facility.findMany({ orderBy: [{ order: "asc" }, { id: "asc" }] }),
  ]);
  const byKey = new Map(contents.map((c) => [c.key, c]));

  return (
    <>
      <AdminHeader
        title="Island profile"
        description="Text for About Dhonfanu and The Council pages, island statistics and the facilities directory."
      />

      <nav className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Sections">
        <a href="#texts" className="btn-outline px-3 py-1.5">Page texts</a>
        <a href="#stats" className="btn-outline px-3 py-1.5">Island statistics</a>
        <a href="#facilities" className="btn-outline px-3 py-1.5">Facilities</a>
      </nav>

      <section id="texts" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-bold text-navy">Page texts</h2>
        <div className="grid gap-4">
          {PAGE_KEYS.map((def) => {
            const c = byKey.get(def.key);
            return (
              <details key={def.key} className="card group" open={def.key === "about.intro"}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-semibold text-navy [&::-webkit-details-marker]:hidden">
                  {def.label}
                  <span className="text-xs font-normal text-teal group-open:hidden">Edit</span>
                </summary>
                <div className="border-t border-navy/5 p-5">
                  <ActionForm action={savePageContent} inline className="grid gap-5" submitLabel="Save text">
                    <input type="hidden" name="key" value={def.key} />
                    <Bilingual label="Heading" name="title" en={c?.titleEn} dv={c?.titleDv} />
                    <Bilingual label="Text" name="body" en={c?.bodyEn} dv={c?.bodyDv} multiline rows={7} />
                    {def.hasImage && <FileInput label="Image" name="image" kind="image" currentUrl={c?.imageUrl} fallbackUrl={FALLBACK_IMAGE[def.key]} />}
                  </ActionForm>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section id="stats" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-bold text-navy">Island statistics</h2>
        <p className="mb-3 text-sm text-navy/60">Shown on the home page (first four) and on About Dhonfanu. Example: population, land area, distance to Hanifaru Bay.</p>
        <div className="grid gap-3">
          {stats.map((s) => (
            <div key={s.id} className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
              <ActionForm action={saveStat} inline className="grid flex-1 gap-3" submitLabel="Save">
                <input type="hidden" name="id" value={s.id} />
                <StatFields s={s} />
              </ActionForm>
              <ConfirmForm action={deleteStat} id={s.id} confirmText="Delete this statistic?" iconOnly />
            </div>
          ))}
          <details className="card">
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-teal [&::-webkit-details-marker]:hidden">+ Add a statistic</summary>
            <div className="border-t border-navy/5 p-4">
              <ActionForm key={`new-stat-${stats.length}`} action={saveStat} inline className="grid gap-3" submitLabel="Add statistic">
                <StatFields />
              </ActionForm>
            </div>
          </details>
        </div>
      </section>

      <section id="facilities" className="mt-10 scroll-mt-20">
        <h2 className="text-lg font-bold text-navy">Facilities directory</h2>
        <p className="mb-3 text-sm text-navy/60">Public services and places on the island, listed on About Dhonfanu with their phone numbers.</p>
        <div className="grid gap-3">
          {facilities.map((f) => (
            <div key={f.id} className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
              <ActionForm action={saveFacility} inline className="grid flex-1 gap-3" submitLabel="Save">
                <input type="hidden" name="id" value={f.id} />
                <FacilityFields f={f} />
              </ActionForm>
              <ConfirmForm action={deleteFacility} id={f.id} confirmText="Delete this facility?" iconOnly />
            </div>
          ))}
          <details className="card">
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-teal [&::-webkit-details-marker]:hidden">+ Add a facility</summary>
            <div className="border-t border-navy/5 p-4">
              <ActionForm key={`new-facility-${facilities.length}`} action={saveFacility} inline className="grid gap-3" submitLabel="Add facility">
                <FacilityFields />
              </ActionForm>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}

type Stat = { labelEn: string; labelDv: string; value: string; unitEn: string; unitDv: string; icon: string; order: number };
type FacilityRow = { nameEn: string; nameDv: string; descriptionEn: string; descriptionDv: string; phone: string; icon: string; order: number };

function StatFields({ s }: { s?: Stat }) {
  return (
    <>
      <Bilingual label="Label" name="label" en={s?.labelEn} dv={s?.labelDv} />
      <Grid cols={4}>
        <TextInput label="Value" name="value" defaultValue={s?.value} required placeholder="512" />
        <TextInput label="Unit (English)" name="unitEn" defaultValue={s?.unitEn} placeholder="km" />
        <TextInput label="Unit (ދިވެހި)" name="unitDv" defaultValue={s?.unitDv} dv />
        <TextInput label="Order" name="order" type="number" defaultValue={s?.order ?? 10} />
      </Grid>
      <IconSelect defaultValue={s?.icon ?? "Users"} />
    </>
  );
}

function FacilityFields({ f }: { f?: FacilityRow }) {
  return (
    <>
      <Bilingual label="Name" name="name" en={f?.nameEn} dv={f?.nameDv} />
      <Bilingual label="Description" name="description" en={f?.descriptionEn} dv={f?.descriptionDv} />
      <Grid cols={3}>
        <TextInput label="Phone" name="phone" defaultValue={f?.phone} />
        <IconSelect defaultValue={f?.icon ?? "Building2"} />
        <TextInput label="Order" name="order" type="number" defaultValue={f?.order ?? 10} />
      </Grid>
    </>
  );
}
