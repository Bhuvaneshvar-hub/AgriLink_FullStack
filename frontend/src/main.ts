import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

/*
 * Global convenience: clicking anywhere on a date/time field opens its native
 * calendar/clock picker (in addition to the calendar icon). Typing into the
 * field still works as normal. Applies across every module automatically.
 */
const PICKER_TYPES = ['date', 'datetime-local', 'month', 'week', 'time'];

function openNativePicker(target: EventTarget | null): void {
  const el = target as HTMLInputElement | null;
  if (!el || el.tagName !== 'INPUT' || el.disabled || el.readOnly) return;
  if (!PICKER_TYPES.includes(el.type)) return;
  // showPicker() is supported in modern browsers and must run within a user gesture.
  if (typeof (el as any).showPicker === 'function') {
    try {
      (el as any).showPicker();
    } catch {
      /* Some browsers throw if the picker can't be shown; ignore silently. */
    }
  }
}

document.addEventListener('click', (event) => openNativePicker(event.target));
