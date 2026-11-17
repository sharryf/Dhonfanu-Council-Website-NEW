import { useId } from "react";
import { FileText } from "lucide-react";
import { ICON_NAMES } from "@/components/Icon";
import { formatBytes } from "@/lib/format";

type Common = { label: string; name: string; hint?: string; required?: boolean };

function Hint({ text }: { text?: string }) {
  return text ? <p className="mt-1 text-xs text-navy/55">{text}</p> : null;
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="text-base font-bold text-navy">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-navy/60">{description}</p>}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const cls = cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return <div className={`grid gap-5 ${cls}`}>{children}</div>;
}

export function TextInput({
  label,
  name,
  hint,
  required,
  defaultValue,
  type = "text",
  dv = false,
  placeholder,
  step,
}: Common & { defaultValue?: string | number | null; type?: string; dv?: boolean; placeholder?: string; step?: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        dir={dv ? "rtl" : undefined}
        lang={dv ? "dv" : undefined}
        className="input"
      />
      <Hint text={hint} />
    </div>
  );
}

export function TextArea({
  label,
  name,
  hint,
  required,
  defaultValue,
  rows = 4,
  dv = false,
}: Common & { defaultValue?: string | null; rows?: number; dv?: boolean }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ""}
        dir={dv ? "rtl" : undefined}
        lang={dv ? "dv" : undefined}
        className="input resize-y"
      />
      <Hint text={hint} />
    </div>
  );
}

/** English + Dhivehi inputs side by side. Field names are `${name}En` / `${name}Dv`. */
export function Bilingual({
  label,
  name,
  en,
  dv,
  hint,
  multiline = false,
  rows = 4,
}: {
  label: string;
  name: string;
  en?: string | null;
  dv?: string | null;
  hint?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const Field = multiline ? TextArea : TextInput;
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${label} (English)`} name={`${name}En`} defaultValue={en} rows={rows} />
        <Field label={`${label} (ދިވެހި)`} name={`${name}Dv`} defaultValue={dv} rows={rows} dv />
      </div>
      <Hint text={hint} />
    </div>
  );
}

export function Select({
  label,
  name,
  hint,
  defaultValue,
  options,
}: Common & { defaultValue?: string; options: { value: string; label: string }[] }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className="input">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Hint text={hint} />
    </div>
  );
}

export function IconSelect({ label = "Icon", name = "icon", defaultValue }: { label?: string; name?: string; defaultValue?: string }) {
  return <Select label={label} name={name} defaultValue={defaultValue} options={ICON_NAMES.map((n) => ({ value: n, label: n }))} />;
}

export function Checkbox({ label, name, hint, defaultChecked }: Common & { defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-canvas px-4 py-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-teal" />
      <span>
        <span className="block text-sm font-semibold text-navy">{label}</span>
        {hint && <span className="block text-xs text-navy/55">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * File picker with a preview of the current file. Posts the new file as `name`
 * and a `${name}Remove` checkbox to clear the current one.
 */
export function FileInput({
  label,
  name,
  hint,
  kind,
  currentUrl,
  currentName,
  currentSize,
  fallbackUrl,
}: Common & {
  kind: "image" | "document";
  currentUrl?: string | null;
  currentName?: string | null;
  currentSize?: number | null;
  /** Bundled placeholder shown on the public site when nothing is uploaded. */
  fallbackUrl?: string;
}) {
  const id = useId();
  const accept = kind === "image" ? "image/png,image/jpeg,image/webp,image/gif" : ".pdf,.doc,.docx,.xls,.xlsx,application/pdf";
  const limits = kind === "image" ? "JPG, PNG, WebP or GIF, up to 5 MB." : "PDF, Word or Excel, up to 20 MB.";
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-navy/20 bg-canvas p-3 sm:flex-row sm:items-center">
        {kind === "image" ? (
          <img
            src={currentUrl || fallbackUrl || "/images/placeholder.svg"}
            alt=""
            className={`h-20 w-28 shrink-0 rounded-lg bg-white object-cover ring-1 ring-navy/10 ${currentUrl ? "" : "opacity-60"}`}
          />
        ) : (
          <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-white text-teal ring-1 ring-navy/10">
            <FileText className="size-7" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {currentUrl ? (
            <p className="mb-2 truncate text-xs text-navy/70">
              Current:{" "}
              <a href={currentUrl} target="_blank" rel="noopener" className="font-semibold text-teal hover:underline">
                {currentName || currentUrl.split("/").pop()}
              </a>
              {currentSize ? ` · ${formatBytes(currentSize)}` : ""}
            </p>
          ) : (
            <p className="mb-2 text-xs text-navy/55">{kind === "image" ? "No image uploaded — the default placeholder is shown." : "No file uploaded yet."}</p>
          )}
          <input
            id={id}
            name={name}
            type="file"
            accept={accept}
            className="block w-full text-sm text-navy/70 file:me-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-teal file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-dark"
          />
          {currentUrl && (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-navy/65">
              <input type="checkbox" name={`${name}Remove`} data-reset-on-save className="size-3.5 accent-danger" />
              Remove the current file
            </label>
          )}
        </div>
      </div>
      <Hint text={hint ?? limits} />
    </div>
  );
}
