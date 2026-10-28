const DAY_MS = 24 * 60 * 60 * 1000;

export const ageDays = (fromIso, nowIso) => {
  const from = Date.parse(fromIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(from) || Number.isNaN(now)) return null;
  return Math.max(0, Math.floor((now - from) / DAY_MS));
};

const pad = (n) => String(n).padStart(2, '0');

// UTC offset label for an offset in minutes east of UTC: 120 → "UTC+2", 330 → "UTC+5:30", 0 → "UTC".
export const offsetLabel = (offsetMinutes) => {
  if (!offsetMinutes) return 'UTC';
  const sign = offsetMinutes > 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${pad(m)}` : ''}`;
};

// "2026-10-15 15:42 UTC+2" — shown in the viewer's local time zone (runtime default),
// or at an explicit offset when `offsetMinutes` is given. No time-zone ids are hardcoded.
export const formatLocal = (iso, { offsetMinutes } = {}) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 'unknown';
  const local = new Date(t);
  const off = Number.isFinite(offsetMinutes) ? offsetMinutes : -local.getTimezoneOffset();
  // Shift by the offset and read UTC fields so both branches format identically.
  const d = new Date(t + off * 60 * 1000);
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  return `${date} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${offsetLabel(off)}`;
};
