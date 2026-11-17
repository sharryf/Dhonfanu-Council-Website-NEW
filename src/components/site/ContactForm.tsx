"use client";

import { useActionState, useState } from "react";
import { CircleCheck, Send, TriangleAlert } from "lucide-react";
import { submitContact, type ContactState } from "@/app/(public)/contact/actions";
import type { Dict } from "@/lib/i18n";

type Props = {
  t: Dict["contact"];
  services: { id: number; title: string }[];
  defaultType: string;
  defaultServiceId: string;
};

export function ContactForm({ t, services, defaultType, defaultServiceId }: Props) {
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, null);
  // Bumping the key gives a fresh, empty form after a successful submission.
  const [formKey, setFormKey] = useState(0);
  const [dismissed, setDismissed] = useState<ContactState>(null);

  const errors: Record<string, string> = {
    required: t.errorRequired,
    email: t.errorEmail,
    long: t.errorTooLong,
    rate: t.errorRate,
    generic: t.errorGeneric,
  };

  if (state?.ok && state !== dismissed) {
    return (
      <div className="card p-8 text-center" role="status">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-aqua text-teal">
          <CircleCheck className="size-8" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold text-navy">{t.successTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-navy/70">{t.successText}</p>
        <p className="mx-auto mt-4 inline-block rounded-xl bg-navy px-5 py-2.5 text-lg font-bold tracking-wider text-white">
          <bdi dir="ltr">{state.reference}</bdi>
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="btn-outline"
            onClick={() => {
              setDismissed(state);
              setFormKey((k) => k + 1);
            }}
          >
            {t.another}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form key={formKey} action={action} className="card grid gap-5 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-navy">{t.formTitle}</h2>

      {state && !state.ok && state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errors[state.error]}
        </p>
      )}

      <fieldset>
        <legend className="label">{t.type}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(t.types) as (keyof typeof t.types)[]).map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center justify-center rounded-xl border border-navy/10 bg-canvas px-3 py-2.5 text-center text-sm font-semibold text-navy/70 transition-colors has-[:checked]:border-teal has-[:checked]:bg-teal has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal/40"
            >
              <input type="radio" name="type" value={key} defaultChecked={key === defaultType} className="sr-only" />
              {t.types[key]}
            </label>
          ))}
        </div>
      </fieldset>

      {services.length > 0 && (
        <div>
          <label htmlFor="cf-service" className="label">
            {t.service} <span className="font-normal text-navy/45">({t.optional})</span>
          </label>
          <select id="cf-service" name="serviceId" defaultValue={defaultServiceId} className="input">
            <option value="">{t.serviceNone}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="cf-name" className="label">
            {t.name}
          </label>
          <input id="cf-name" name="name" required minLength={2} maxLength={100} autoComplete="name" dir="auto" className="input" />
        </div>
        <div>
          <label htmlFor="cf-phone" className="label">
            {t.phone}
          </label>
          <input id="cf-phone" name="phone" type="tel" inputMode="tel" maxLength={30} autoComplete="tel" dir="ltr" className="input" />
        </div>
        <div>
          <label htmlFor="cf-email" className="label">
            {t.email} <span className="font-normal text-navy/45">({t.optional})</span>
          </label>
          <input id="cf-email" name="email" type="email" maxLength={120} autoComplete="email" dir="ltr" className="input" />
        </div>
      </div>

      <div>
        <label htmlFor="cf-subject" className="label">
          {t.subject} <span className="font-normal text-navy/45">({t.optional})</span>
        </label>
        <input id="cf-subject" name="subject" maxLength={150} dir="auto" className="input" />
      </div>

      <div>
        <label htmlFor="cf-message" className="label">
          {t.message}
        </label>
        <textarea id="cf-message" name="message" required minLength={5} maxLength={4000} rows={6} dir="auto" className="input resize-y" />
      </div>

      {/* Honeypot — hidden from people, tempting for bots. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs text-navy/55">{t.privacy}</p>
        <button type="submit" disabled={pending} className="btn-primary shrink-0 px-6 py-3">
          <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
          {pending ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
