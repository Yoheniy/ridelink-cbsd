import { BookingStatusCard, ReceiptLineItems } from '@ridelink/feature-y';

const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>RideLink Feature-Y App (CBSD)</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin: 12px 0; }
      .card-title { font-weight: 700; margin-bottom: 6px; }
      .card-footer { margin-top: 10px; display: flex; gap: 8px; align-items: center; }
      .btn { display: inline-block; padding: 8px 12px; border-radius: 10px; text-decoration: none; border: 1px solid #e5e7eb; }
      .badge { padding: 2px 8px; border-radius: 999px; border: 1px solid #e5e7eb; font-size: 12px; }
      .badge-success { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
      .badge-warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
      .badge-danger { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
      pre { white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h2>Feature-Y System App (assembly only)</h2>
    <p>This app only composes components imported from packages.</p>
    <div><pre>${BookingStatusCard({ booking: { origin: 'bole', destination: 'megenagna', status: 'ACCEPTED', totalPrice: 90, createdAt: new Date() } })}</pre></div>
    <div><pre>${ReceiptLineItems({ items: [{ label: 'Base fare', value: 70 }, { label: 'Service fee', value: 20 }] })}</pre></div>
  </body>
</html>
`;

console.log(html);

