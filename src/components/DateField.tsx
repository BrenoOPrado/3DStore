import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays } from "lucide-react";
import { brToIsoDate, dateDigits, formatDateSlots, isoToBrDate } from "../data/dates";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
  wide?: boolean;
  required?: boolean;
};

function digitsBeforeCaret(text: string, caret: number) {
  return text.slice(0, Math.max(0, caret)).replace(/\D/g, "").length;
}

function caretFromDigitCount(formatted: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]!)) {
      seen++;
      if (seen >= digitCount) return i + 1;
    }
  }
  return formatted.length;
}

export function DateField({ label, value, onChange, testId, wide = false, required = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const [pendingCaret, setPendingCaret] = useState<number | null>(null);
  const pickerId = useId();
  const display = formatDateSlots(value);
  const iso = brToIsoDate(value) ?? "";

  useEffect(() => {
    if (pendingCaret == null || !inputRef.current) return;
    inputRef.current.setSelectionRange(pendingCaret, pendingCaret);
    setPendingCaret(null);
  }, [display, pendingCaret]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length === 1 && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <label className={wide ? "field field--wide" : "field"}>
      <span className="field__label">{label}</span>
      <div className="date-field">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={display}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            const caret = e.target.selectionStart ?? e.target.value.length;
            const digitCaret = digitsBeforeCaret(e.target.value, caret);
            const next = formatDateSlots(e.target.value);
            // Cap at 8 digits while keeping caret on the segment the user is editing.
            if (dateDigits(e.target.value).length > 8) {
              setPendingCaret(caretFromDigitCount(display, digitCaret));
              return;
            }
            onChange(next);
            setPendingCaret(caretFromDigitCount(next, digitCaret));
          }}
          onClick={() => {
            const el = inputRef.current;
            if (!el) return;
            // Keep caret where clicked so day/month/year can be edited independently.
            const caret = el.selectionStart ?? 0;
            requestAnimationFrame(() => el.setSelectionRange(caret, caret));
          }}
          required={required}
          className="field__control"
          data-testid={testId}
          autoComplete="bday"
        />
        <button
          type="button"
          className="date-field__calendar"
          aria-label="Abrir calendário"
          data-testid={testId ? `${testId}-calendar` : undefined}
          onClick={() => nativeRef.current?.showPicker?.() ?? nativeRef.current?.click()}
        >
          <CalendarDays size={16} />
        </button>
        <input
          ref={nativeRef}
          id={pickerId}
          type="date"
          className="date-field__native"
          value={iso}
          onChange={(e) => {
            const next = e.target.value ? isoToBrDate(e.target.value) : "";
            onChange(next);
            setPendingCaret(next.length);
            inputRef.current?.focus();
          }}
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </label>
  );
}
