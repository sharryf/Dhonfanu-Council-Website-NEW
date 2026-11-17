"use client";

import { useActionState, useEffect, useRef, startTransition } from "react";
import { CircleCheck, Save, Trash2, TriangleAlert } from "lucide-react";
import type { FormState } from "@/lib/form-state";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

/**
 * Form wrapper for admin server actions: shows the result, disables the button
 * while saving and keeps what was typed if the server rejects the input.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save changes",
  className = "grid gap-6",
  inline = false,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  /** Compact row layout: the button sits beside the fields instead of in a footer bar. */
  inline?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // After a successful save, clear chosen files so they are not uploaded twice.
    if (state?.ok) {
      ref.current?.querySelectorAll<HTMLInputElement>('input[type="file"], input[type="password"]').forEach((i) => (i.value = ""));
      ref.current?.querySelectorAll<HTMLInputElement>('input[data-reset-on-save]').forEach((i) => (i.checked = false));
    }
  }, [state]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  const status = state && (
    <p
      role={state.ok ? "status" : "alert"}
      className={`flex items-center gap-2 text-sm font-semibold ${state.ok ? "text-teal" : "text-danger"}`}
    >
      {state.ok ? <CircleCheck className="size-4 shrink-0" aria-hidden="true" /> : <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />}
      {state.message}
    </p>
  );

  if (inline) {
    return (
      <form ref={ref} onSubmit={onSubmit} className={className}>
        {children}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className="btn-primary px-3 py-2">
            <Save className="size-4" aria-hidden="true" />
            {pending ? "Saving…" : submitLabel}
          </button>
          {status}
        </div>
      </form>
    );
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      {children}
      <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/95 px-5 py-3 shadow-lift ring-1 ring-navy/10 backdrop-blur">
        <div className="min-h-5">{status}</div>
        <button type="submit" disabled={pending} className="btn-primary px-6">
          <Save className="size-4" aria-hidden="true" />
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** Small form with a confirmation prompt, used for delete buttons. */
export function ConfirmForm({
  action,
  id,
  confirmText = "Delete this item? This cannot be undone.",
  label = "Delete",
  iconOnly = false,
}: {
  action: (fd: FormData) => Promise<void>;
  id: number;
  confirmText?: string;
  label?: string;
  iconOnly?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={iconOnly ? "btn-danger px-2.5 py-2" : "btn-danger px-3 py-2"} aria-label={iconOnly ? label : undefined} title={label}>
        <Trash2 className="size-4" aria-hidden="true" />
        {!iconOnly && label}
      </button>
    </form>
  );
}
