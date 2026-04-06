export function formatDateISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function minutesFromNow(target, now = new Date()) {
  const t = target instanceof Date ? target : new Date(target);
  const n = now instanceof Date ? now : new Date(now);
  return Math.round((t.getTime() - n.getTime()) / 60000);
}

