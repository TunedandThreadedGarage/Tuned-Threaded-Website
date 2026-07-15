import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FormFieldProps = {
  label: string;
  name: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

const fieldClass =
  "mt-1.5 w-full border border-border bg-bg px-3 py-2.5 text-sm text-text outline-none transition-colors placeholder:text-text-muted/60 focus:border-metal/50";

export function FormField({ label, name, hint, id, ...props }: FormFieldProps) {
  const fieldId = id ?? name;
  return (
    <label className="block text-sm text-text" htmlFor={fieldId}>
      <span className="font-medium">{label}</span>
      <input id={fieldId} name={name} className={fieldClass} {...props} />
      {hint ? <span className="mt-1 block text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}

type TextAreaFieldProps = {
  label: string;
  name: string;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({
  label,
  name,
  hint,
  id,
  ...props
}: TextAreaFieldProps) {
  const fieldId = id ?? name;
  return (
    <label className="block text-sm text-text" htmlFor={fieldId}>
      <span className="font-medium">{label}</span>
      <textarea
        id={fieldId}
        name={name}
        className={`${fieldClass} min-h-28 resize-y`}
        {...props}
      />
      {hint ? <span className="mt-1 block text-xs text-text-muted">{hint}</span> : null}
    </label>
  );
}
