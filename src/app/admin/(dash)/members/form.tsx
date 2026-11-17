import type { Member } from "@prisma/client";
import { MEMBER_GROUPS, MEMBER_GROUP_LABELS } from "@/lib/constants";
import { ActionForm } from "@/components/admin/ActionForm";
import { Bilingual, FileInput, Grid, Section, Select, TextInput } from "@/components/admin/fields";
import { saveMember } from "../../actions";

export function MemberForm({ item, defaultGroup }: { item?: Member; defaultGroup?: string }) {
  return (
    <ActionForm action={saveMember} submitLabel={item ? "Save changes" : "Add person"}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Section title="Profile">
        <Grid cols={3}>
          <Select
            label="Group"
            name="group"
            defaultValue={item?.group ?? defaultGroup ?? "COUNCIL"}
            options={MEMBER_GROUPS.map((g) => ({ value: g, label: MEMBER_GROUP_LABELS[g] }))}
          />
          <TextInput label="Term" name="term" defaultValue={item?.term} placeholder="2026 – 2031" />
          <TextInput
            label="Display order"
            name="order"
            type="number"
            defaultValue={item?.order ?? 10}
            hint="Lowest number is shown first. In the Council group, the first person is featured as President."
          />
        </Grid>
        <Bilingual label="Name" name="name" en={item?.nameEn} dv={item?.nameDv} />
        <Bilingual label="Role / title" name="role" en={item?.roleEn} dv={item?.roleDv} />
        <Grid>
          <TextInput label="Phone (optional)" name="phone" defaultValue={item?.phone} />
          <TextInput label="Email (optional)" name="email" type="email" defaultValue={item?.email} />
        </Grid>
        <FileInput label="Photo" name="photo" kind="image" currentUrl={item?.photoUrl} fallbackUrl="/images/avatar.svg" hint="Square portrait works best. Up to 5 MB." />
      </Section>
    </ActionForm>
  );
}
