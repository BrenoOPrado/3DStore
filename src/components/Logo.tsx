export function Logo({ className = "logo" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#818cf8" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M16 3 28 10v12L16 29 4 22V10L16 3Z"
        stroke="url(#logo-g)"
        strokeWidth="1.8"
        fill="rgba(139,92,246,0.12)"
      />
      <path d="M16 3v26M4 10l12 7 12-7" stroke="url(#logo-g)" strokeWidth="1.6" />
    </svg>
  );
}
