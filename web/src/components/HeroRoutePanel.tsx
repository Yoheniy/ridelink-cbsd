export function HeroRoutePanel() {
  return (
    <div className="hero__panel">
      <div className="panel__glow" aria-hidden="true" />
      <div className="panel__card">
        <span className="panel__label">Live route snapshot</span>
        <div className="panel__route">
          <div className="route__point">Bole</div>
          <div className="route__line" aria-hidden="true" />
          <div className="route__point">Piassa</div>
        </div>
        <div className="panel__details">
          <div>
            <p className="panel__title">Live seat map</p>
            <p className="panel__value">3 seats open</p>
          </div>
          <div>
            <p className="panel__title">Fare cap</p>
            <p className="panel__value">4 ETB/km max</p>
          </div>
        </div>
      </div>
    </div>
  );
}
