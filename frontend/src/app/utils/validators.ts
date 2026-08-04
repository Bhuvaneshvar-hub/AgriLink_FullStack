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

/**
 * Cross-field validator applied to a FormGroup: sets a `passwordMismatch` error
 * on the `confirmPassword` control when it doesn't match `password`. Kept on the
 * child control (not the group) so the field-level error UI can display it.
 */
export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword');
  if (!confirm) return null;
  // Preserve any other errors already on the control (e.g. required).
  const existing = confirm.errors ?? {};
  if (confirm.value && password !== confirm.value) {
    confirm.setErrors({ ...existing, passwordMismatch: true });
  } else {
    const { passwordMismatch, ...rest } = existing;
    confirm.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}
