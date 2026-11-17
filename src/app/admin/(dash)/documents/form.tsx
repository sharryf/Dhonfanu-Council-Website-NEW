import type { Document } from "@prisma/client";
import { DOCUMENT_CATEGORIES, DOCUMENT_CATEGORY_LABELS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import { ActionForm } from "@/components/admin/ActionForm";
import { Bilingual, Checkbox, FileInput, Grid, Section, Select, TextInput } from "@/components/admin/fields";
import { saveDocument } from "../../actions";

export function DocumentForm({ item }: { item?: Document }) {
  return (
    <ActionForm action={saveDocument} submitLabel={item ? "Save changes" : "Upload document"}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <Section title="Document">
        <Grid cols={3}>
          <Select
            label="Category"
            name="category"
            defaultValue={item?.category ?? "FORM"}
            options={DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: DOCUMENT_CATEGORY_LABELS[c] }))}
          />
          <TextInput label="Year (optional)" name="year" type="number" defaultValue={item?.year} placeholder={String(new Date().getFullYear())} />
          <TextInput label="Date published" name="publishedAt" type="date" defaultValue={toDateInput(item?.publishedAt ?? new Date())} />
        </Grid>
        <Bilingual label="Title" name="title" en={item?.titleEn} dv={item?.titleDv} />
        <Bilingual label="Short description" name="description" en={item?.descriptionEn} dv={item?.descriptionDv} multiline rows={2} />
        <FileInput
          label={item ? "Replace file" : "File"}
          name="file"
          kind="document"
          currentUrl={item?.fileUrl}
          currentName={item?.fileName}
          currentSize={item?.fileSize}
          hint="PDF, Word or Excel, up to 20 MB. Choosing a new file replaces the current one."
        />
        <Checkbox label="Visible on the public site" name="published" defaultChecked={item?.published ?? true} />
      </Section>
    </ActionForm>
  );
}
