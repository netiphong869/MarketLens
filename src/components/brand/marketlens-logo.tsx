interface MarketLensLogoProps {
  size?: number;
  title?: string;
}

export function MarketLensLogo({
  size = 42,
  title = "MarketLens",
}: MarketLensLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
    >
      <circle cx="21" cy="21" r="15" fill="#E7F1FB" stroke="#145DA0" strokeWidth="3" />
      <path d="M31.8 31.8 43 43" stroke="#145DA0" strokeWidth="4" strokeLinecap="round" />
      <path d="M14 26V18M20 30V14M26 25V17" stroke="#168F68" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M11 24h6M17 18h6M23 21h6" stroke="#145DA0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
