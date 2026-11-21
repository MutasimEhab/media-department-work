export function formatArabicWorkDate(value: string): string {
  if (typeof value !== 'string' || !value.trim()) return '—';
  const isoDate = value.trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!isoDate) return value;
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) return '—';
  return new Intl.DateTimeFormat('ar-PS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn' }).format(date);
}

export function formatArabicDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-PS', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Gaza', numberingSystem: 'latn' }).format(date);
}
