import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * A person's name: must start with a letter and contain only letters, spaces,
 * and the common name punctuation . ' - (2–50 characters). Rejects digits and
 * other symbols.
 */
export const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]{1,49}$/;

/**
 * A valid Gmail address, e.g. someone@gmail.com. The local part allows the
 * characters Gmail permits; the domain must be exactly gmail.com.
 */
export const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

/** Rejects dates in the future (e.g. a date of birth cannot be later than today). */
export function notFutureDate(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const value = new Date(control.value);
  if (isNaN(value.getTime())) return null;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return value.getTime() > endOfToday.getTime() ? { futureDate: true } : null;
}
