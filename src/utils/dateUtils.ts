/**
 * Formats a Date object as YYYY-MM-DD string using the local device timezone (e.g. IST +05:30).
 * Prevents UTC conversion shifts (e.g., .toISOString() returning yesterday after midnight IST).
 */
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getYesterdayLocalDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
};
