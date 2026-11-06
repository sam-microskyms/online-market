export function Icon({ name }: { name: "reel" | "browse" | "live" | "bag" | "desk" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (name === "reel") {
    return (
      <svg {...common}>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M10 8h4M10 12h4" />
      </svg>
    );
  }
  if (name === "browse") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "live") {
    return (
      <svg {...common}>
        <path d="M4 8h11v8H4z" />
        <path d="M15 11l5-2v6l-5-2z" />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg {...common}>
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.4-3 3.6-4.5 7-4.5S17.6 16 19 19" />
    </svg>
  );
}

export function Canopy() {
  return (
    <svg className="canopy" viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="14" fill="#114F4C" />
      <path d="M10 34V18a14 14 0 0 1 28 0v16" fill="none" stroke="#FFF7F2" strokeWidth="2.5" />
      <path d="M18 34V22a6 6 0 0 1 12 0v12" fill="none" stroke="#E6A317" strokeWidth="2.5" />
      <circle cx="24" cy="34" r="2" fill="#E6A317" />
    </svg>
  );
}
