function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function isValidYmd(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

/** Digits only → up to 8 chars for dd mm aaaa. */
export function dateDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 8);
}

/** Display helper: keeps typed digits and inserts slashes without forcing rewrite of later segments. */
export function formatDateSlots(value: string) {
  const digits = dateDigits(value);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Extra slashes are ignored so typing `01/01/2026` works char-by-char. */
export function maskDate(value: string) {
  return formatDateSlots(value);
}

/**
 * Edit date digits at a digit-index (0..8), like a masked field that respects caret position.
 * `replaceCount` digits starting at `digitIndex` are removed, then `insert` digits are added.
 */
export function applyDateEdit(
  value: string,
  digitIndex: number,
  replaceCount: number,
  insert: string
): { value: string; caretDigits: number } {
  const digits = dateDigits(value).split("");
  const insertDigits = insert.replace(/\D/g, "");
  const start = Math.max(0, Math.min(digitIndex, digits.length));
  const remove = Math.max(0, replaceCount);
  digits.splice(start, remove, ...insertDigits.split(""));
  const next = digits.join("").slice(0, 8);
  return {
    value: formatDateSlots(next),
    caretDigits: Math.min(8, start + insertDigits.length),
  };
}

export function isoToBrDate(value: string) {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  return formatDateSlots(trimmed);
}

export function brToIsoDate(value: string) {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    return isValidYmd(y, m, d) ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
  }
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!br) return null;
  const d = Number(br[1]);
  const m = Number(br[2]);
  const y = Number(br[3]);
  if (!isValidYmd(y, m, d)) return null;
  return `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;
}

export function formatDateBr(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(trimmed);
  if (br) return `${br[1]}/${br[2]}/${br[3]}`;
  const dt = new Date(trimmed);
  if (Number.isNaN(dt.getTime())) return trimmed;
  return `${pad2(dt.getUTCDate())}/${pad2(dt.getUTCMonth() + 1)}/${dt.getUTCFullYear()}`;
}

export function formatDateTimeBr(value: string) {
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return `${formatDateBr(value)} ${pad2(dt.getUTCHours())}:${pad2(dt.getUTCMinutes())}`;
}
