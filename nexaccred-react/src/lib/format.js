/**
 * The prototype pins "today" so the seeded dates stay meaningful. In production this
 * becomes `new Date()`.
 */
export const TODAY = new Date('2026-08-10');

export const daysUntil = (dateStr) =>
  Math.round((new Date(dateStr) - TODAY) / 86400000);

export const fmtDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

export const initials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Task status is derived, never stored. "Overdue" computed from the due date can't go
 * stale between nightly jobs the way a stored flag would.
 */
export function taskStatus(t) {
  if (t.status === 'Done') return { level: 'green', label: 'Done' };
  const d = daysUntil(t.due);
  if (d < 0) return { level: 'red', label: 'Overdue' };
  if (t.status === 'In Progress') return { level: 'yellow', label: 'In Progress' };
  return { level: 'gray', label: 'Not Started' };
}

export function taskDueLabel(t) {
  const d = daysUntil(t.due);
  if (t.status === 'Done') return fmtDate(t.due);
  if (d < 0) return `${fmtDate(t.due)} · ${Math.abs(d)}d overdue`;
  if (d === 0) return `${fmtDate(t.due)} · today`;
  return `${fmtDate(t.due)} · in ${d}d`;
}
