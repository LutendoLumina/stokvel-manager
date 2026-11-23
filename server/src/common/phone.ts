/**
 * Turns a South African mobile number into one standard format: +27821234567.
 * The same person must always match, however they typed their number
 * (docs/design/database.md, decision 8).
 *
 * Accepts the two formats in docs/design/api.md, with or without spaces or dashes:
 *   "082 123 4567"  -> "+27821234567"
 *   "+27821234567"  -> "+27821234567"
 * Returns null for anything else.
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s-]/g, '');

  let rest: string; // the 9 digits after the leading 0 or +27
  if (/^0\d{9}$/.test(cleaned)) rest = cleaned.slice(1);
  else if (/^\+27\d{9}$/.test(cleaned)) rest = cleaned.slice(3);
  else return null;

  // SA numbers never start with 0 after the country code (+270... is invalid).
  if (rest.startsWith('0')) return null;

  return `+27${rest}`;
}

export const PHONE_FORMAT_MESSAGE =
  'Phone number must look like 082 123 4567 or +27821234567.';
