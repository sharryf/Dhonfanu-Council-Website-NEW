import type { Service } from "@prisma/client";
import { ActionForm } from "@/components/admin/ActionForm";
import { Bilingual, Checkbox, Grid, IconSelect, Section, TextInput } from "@/components/admin/fields";
import { saveService } from "../../actions";

export function ServiceForm({ item }: { item?: Service }) {
  return (
    <ActionForm action={saveService} submitLabel={item ? "Save changes" : "Add service"}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Section title="Service card">
        <Bilingual label="Title" name="title" en={item?.titleEn} dv={item?.titleDv} />
        <Bilingual label="Description" name="description" en={item?.descriptionEn} dv={item?.descriptionDv} multiline rows={3} />
        <Grid cols={3}>
          <IconSelect defaultValue={item?.icon ?? "FileText"} />
          <TextInput label="Display order" name="order" type="number" defaultValue={item?.order ?? 10} hint="Lowest number is shown first." />
          <TextInput
            label="Link (optional)"
            name="linkUrl"
            defaultValue={item?.linkUrl}
            placeholder="/downloads?category=FORM"
            hint="Leave empty to open the online request form for this service."
          />
        </Grid>
        <Grid>
          <Checkbox label="Active" name="active" defaultChecked={item?.active ?? true} hint="Shown on the E-Services page." />
          <Checkbox label="Quick-action pill on the home page" name="featured" defaultChecked={item?.featured ?? true} hint="Up to six are shown in the hero." />
        </Grid>
      </Section>
    </ActionForm>
  );
}
