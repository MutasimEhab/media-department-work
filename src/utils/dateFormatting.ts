export function formatArabicWorkDate(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-PS', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn' }).format(date);
}

export function formatArabicDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('ar-PS', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Gaza', numberingSystem: 'latn' }).format(date);
}
