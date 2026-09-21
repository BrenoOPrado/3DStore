import { type KeyboardEvent } from "react";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  wide = false,
  required = true,
  placeholder,
  onKeyDown,
  inputMode,
  testId,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  wide?: boolean;
  required?: boolean;
  placeholder?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "search";
  testId?: string;
  maxLength?: number;
}) {
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span className="field__label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        required={required}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="field__control"
        data-testid={testId}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  testId,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  testId?: string;
  wide?: boolean;
}) {
  const list = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span className="field__label">{label}</span>
      <select
        className="field__control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      >
        {list.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
