function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function Badge({ label, tone = 'default' } = {}) {
  const text = escapeHtml(label ?? '');
  const cls =
    tone === 'success'
      ? 'badge badge-success'
      : tone === 'warning'
        ? 'badge badge-warning'
        : tone === 'danger'
          ? 'badge badge-danger'
          : 'badge';
  return `<span class="${cls}">${text}</span>`;
}

