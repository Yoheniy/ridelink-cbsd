import { Badge, Card } from '@ridelink/ui-components';

export function ReceiptLineItems({ items } = {}) {
  const list = Array.isArray(items) ? items : [];
  const lines = list
    .map((it) => {
      const label = String(it?.label ?? '');
      const value = Number(it?.value ?? 0);
      return `- ${label}: ETB ${value.toFixed(0)}`;
    })
    .join('\n');

  return Card({
    title: 'Receipt',
    body: lines || 'No items',
    footer: Badge({ label: 'CBSD-demo', tone: 'default' }),
  });
}

