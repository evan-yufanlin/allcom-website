type IconProps = { className?: string };

const base = "stroke-accent fill-none [stroke-width:1.6] [stroke-linecap:round] [stroke-linejoin:round]";

export function BoltIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  );
}

export function HvacIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`}>
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

export function WaterIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`}>
      <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
      <path d="M9 20v2M15 20v2" />
    </svg>
  );
}

export function FireIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`${base} ${className}`}>
      <path d="M12 2c1 3-2 4-2 6a2 2 0 0 0 4 0c0-1-.5-1.5-.5-1.5s2 2 2 5a3.5 3.5 0 0 1-7 0C8.5 8 12 6 12 2z" />
    </svg>
  );
}

export function ChevronIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={`stroke-accent fill-none [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round] ${className}`}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
