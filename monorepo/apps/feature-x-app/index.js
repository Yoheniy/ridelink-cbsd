import { TripRecommendationCard, TripSearchSummary } from '@ridelink/feature-x';

const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>RideLink Feature-X App (CBSD)</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin: 12px 0; }
      .card-title { font-weight: 700; margin-bottom: 6px; }
      .card-footer { margin-top: 10px; display: flex; gap: 8px; align-items: center; }
      .btn { display: inline-block; padding: 8px 12px; border-radius: 10px; text-decoration: none; border: 1px solid #e5e7eb; }
      .btn-primary { background: #188aec; color: white; border-color: #188aec; }
      .btn-secondary { background: #f3f4f6; color: #111827; }
      .btn-ghost { background: transparent; color: #111827; }
      .badge { padding: 2px 8px; border-radius: 999px; border: 1px solid #e5e7eb; font-size: 12px; }
      .badge-success { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
      pre { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h2>Feature-X System App (assembly only)</h2>
    <p>This app only composes components imported from packages.</p>
    <div>${TripSearchSummary({ origin: 'bole', destination: 'megenagna', totalResults: 7 })}</div>
    <div><pre>${TripRecommendationCard({ trip: { origin: 'bole', destination: 'cmc', pricePerSeat: 45, departureTime: new Date(Date.now() + 40 * 60000) } })}</pre></div>
  </body>
</html>
`;

console.log(html);

