/** Small formatting helpers. Nothing here is clever; it is here so that the
 *  same date does not appear in three different formats on three pages. */

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const DATE_SHORT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** `2026-08-26` becomes `26 August 2026`. Invalid input is returned unchanged
 *  rather than rendered as "Invalid Date" in the middle of the page. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE.format(date);
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_SHORT.format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-GB').format(value);
}
