import { Badge, Button, Card } from '@ridelink/ui-components';
import { formatDateISO, toTitleCase } from '@ridelink/utils';

export function BookingStatusCard({ booking } = {}) {
  const b = booking ?? {};
  const origin = toTitleCase(b.origin ?? 'Unknown');
  const destination = toTitleCase(b.destination ?? 'Unknown');
  const status = String(b.status ?? 'PENDING').toUpperCase();
  const total = Number(b.totalPrice ?? 0);
  const date = formatDateISO(b.createdAt ? new Date(b.createdAt) : new Date());

  const tone =
    status === 'ACCEPTED'
      ? 'success'
      : status === 'CANCELLED'
        ? 'danger'
        : status === 'PENDING'
          ? 'warning'
          : 'default';

  return Card({
    title: 'Booking',
    body: `${origin} → ${destination}\nTotal: ETB ${total.toFixed(0)}\nDate: ${date}`,
    footer: `${Badge({ label: status, tone })} ${Button({ label: 'Details', href: '#booking', variant: 'ghost' })}`,
  });
}

