import { WritableSignal } from '@angular/core';

/**
 * Shared column-sort helpers for data tables app-wide.
 * Click a sortable header to sort ascending; click again to reverse.
 */

export function toggleSort(fieldSig: WritableSignal<string | null>,
                            ascSig: WritableSignal<boolean>, field: string): void {
  if (fieldSig() === field) {
    ascSig.set(!ascSig());
  } else {
    fieldSig.set(field);
    ascSig.set(true);
  }
}

/** Header arrow: neutral when the column isn't the one being sorted on. */
export function sortIcon(isActive: boolean, asc: boolean): string {
  if (!isActive) return 'unfold_more';
  return asc ? 'arrow_upward' : 'arrow_downward';
}

/** Sorts by a field, comparing dates chronologically and numbers numerically. Blanks sink to the bottom. */
export function applySort<T extends Record<string, any>>(list: T[], field: string | null, asc: boolean): T[] {
  if (!field) return list;
  const direction = asc ? 1 : -1;
  return [...list].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (field.toLowerCase().includes('date')) {
      return (new Date(va).getTime() - new Date(vb).getTime()) * direction;
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return (va - vb) * direction;
    }
    return String(va).localeCompare(String(vb)) * direction;
  });
}
