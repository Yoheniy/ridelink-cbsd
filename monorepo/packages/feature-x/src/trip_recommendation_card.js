import { Button, Card } from '@ridelink/ui-components';
import { minutesFromNow, toTitleCase } from '@ridelink/utils';

export function TripRecommendationCard({ trip } = {}) {
  const t = trip ?? {};
  const origin = toTitleCase(t.origin ?? 'Unknown');
  const destination = toTitleCase(t.destination ?? 'Unknown');
  const price = Number(t.pricePerSeat ?? 0);
  const dep = t.departureTime ? new Date(t.departureTime) : new Date();
  const mins = minutesFromNow(dep);

  return Card({
    title: 'Recommended trip',
    body: `${origin} → ${destination}\nETB ${price.toFixed(0)} / seat\nDeparts in ~${mins} min`,
    footer: Button({ label: 'View', href: '#trip', variant: 'secondary' }),
  });
}

