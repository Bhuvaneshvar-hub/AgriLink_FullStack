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

/**
 * Any valid email address, e.g. farmer@gmail.com or farmer@agrilink.co.in.
 * Used where the address is a login identifier rather than a Gmail-only signup.
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;

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
 * Form-group-level validator: flags 'confirmPassword' with a { mismatch: true }
 * error whenever it doesn't equal 'password'. Attach via the FormGroup's
 * validators (not an individual control), since it needs both fields.
 */
export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword');
  if (!confirmPassword) return null;

  if (confirmPassword.value && password !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, mismatch: true });
  } else if (confirmPassword.errors) {
    const { mismatch, ...rest } = confirmPassword.errors;
    confirmPassword.setErrors(Object.keys(rest).length ? rest : null);
  }
  return null;
}
