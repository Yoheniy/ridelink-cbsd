import { Badge, Card } from '@ridelink/ui-components';
import { toTitleCase, truncate } from '@ridelink/utils';

export function TripSearchSummary({ origin, destination, totalResults } = {}) {
  const o = toTitleCase(origin ?? 'unknown');
  const d = toTitleCase(destination ?? 'unknown');
  const results = Number(totalResults ?? 0);

  return Card({
    title: 'Search summary',
    body: truncate(`${o} → ${d}`, 48),
    footer: `${Badge({ label: `${results} trips`, tone: 'success' })}`,
  });
}

