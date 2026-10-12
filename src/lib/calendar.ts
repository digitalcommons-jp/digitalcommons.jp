const jst = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

/** Year / month / day of a date as seen in Japan. */
export const jstParts = (date: Date) => {
  const p = Object.fromEntries(jst.formatToParts(date).map((x) => [x.type, Number(x.value)]));
  return { year: p.year, month: p.month, day: p.day };
};

/** Weeks (Sunday first) of a month; days outside the month are null. */
export const monthGrid = (year: number, month: number): (number | null)[][] => {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
};
