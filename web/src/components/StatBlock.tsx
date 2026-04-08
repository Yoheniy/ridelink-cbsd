type StatBlockProps = {
  label: string;
  value: string;
};

export function StatBlock({ label, value }: StatBlockProps) {
  return (
    <div className="stat">
      <p className="stat__value">{value}</p>
      <p className="stat__label">{label}</p>
    </div>
  );
}
