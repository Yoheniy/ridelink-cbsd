export function toTitleCase(input) {
  return String(input)
    .trim()
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ');
}

export function truncate(input, maxLen) {
  const s = String(input);
  const m = Number(maxLen);
  if (!Number.isFinite(m) || m < 0) return '';
  if (s.length <= m) return s;
  if (m <= 1) return '…'.slice(0, m);
  return s.slice(0, m - 1) + '…';
}

