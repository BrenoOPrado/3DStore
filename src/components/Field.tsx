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
        className="field__control"
      />
    </label>
  );
}
