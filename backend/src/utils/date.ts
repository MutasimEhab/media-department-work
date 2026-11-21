/** Normalize PostgreSQL DATE values whether pg returns a string or a JavaScript Date. */
export function dateOnly(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  }
  if (typeof value !== 'string' || !value.trim()) return '';
  const text = value.trim();
  const isoDate = text.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/)?.[1];
  if (isoDate) {
    const parsed = new Date(`${isoDate}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === isoDate) return isoDate;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}
