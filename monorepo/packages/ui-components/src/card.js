function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function Card({ title, body, footer } = {}) {
  const t = title ? `<div class="card-title">${escapeHtml(title)}</div>` : '';
  const b = body ? `<div class="card-body">${escapeHtml(body)}</div>` : '';
  const f = footer ? `<div class="card-footer">${footer}</div>` : '';
  return `<section class="card">${t}${b}${f}</section>`;
}
