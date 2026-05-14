export function Button({ label, href, variant = 'primary' }) {
  const text = escapeHtml(label ?? 'Button');
  const classes =
    variant === 'secondary'
      ? 'btn btn-secondary'
      : variant === 'ghost'
        ? 'btn btn-ghost'
        : 'btn btn-primary';

  if (href) {
    return `<a class="${classes}" href="${escapeAttr(href)}">${text}</a>`;
  }
  return `<button class="${classes}" type="button">${text}</button>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll('`', '&#96;');
}

