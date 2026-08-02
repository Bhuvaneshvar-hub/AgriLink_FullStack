// Single source of truth for the agricultural growing seasons used across the
// crop catalog and crop plan forms. Labels must match the backend Season enum
// (Kharif / Rabi / Zaid / Perennial) exactly, since that is what is persisted.
export const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Perennial'] as const;

export type Season = typeof SEASONS[number];

// Approximate sowing windows for each season (India), expressed as inclusive
// month ranges (1 = Jan .. 12 = Dec). Used only for a soft, non-blocking UI
// warning — regional practice varies, so plans outside the window are still
// allowed. A range that wraps the year end (e.g. Rabi Oct–Mar) is supported.
export interface SeasonWindow {
  startMonth: number;
  endMonth: number;
  label: string; // human-readable window, e.g. "June and October"
}

export const SEASON_SOWING_WINDOWS: Record<string, SeasonWindow | null> = {
  Kharif: { startMonth: 6, endMonth: 10, label: 'June and October' },
  Rabi: { startMonth: 10, endMonth: 3, label: 'October and March' },
  Zaid: { startMonth: 3, endMonth: 6, label: 'March and June' },
  Perennial: null, // sown year-round — no window
};

// True when `month` (1-12) falls within the given inclusive window,
// correctly handling ranges that wrap past December (e.g. Oct–Mar).
export function isMonthInWindow(month: number, window: SeasonWindow): boolean {
  const { startMonth, endMonth } = window;
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  // Wrapping range: valid if in [start..Dec] or [Jan..end]
  return month >= startMonth || month <= endMonth;
}
