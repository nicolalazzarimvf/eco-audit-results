type IconProps = { size?: number; className?: string };

export function EcoLogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#E8F6FC" />
      <path
        d="M12 26c4-8 8-12 14-14 2 6-1 12-6 16-4 3-8 2-8-2z"
        fill="#0A8F49"
      />
      <path
        d="M18 14c3 2 5 6 5 10 0 4-2 7-5 9"
        stroke="#0075FF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconPound({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 8h8a4 4 0 0 1 0 8H6" strokeLinecap="round" />
      <path d="M8 4v16" strokeLinecap="round" />
    </svg>
  );
}

export function IconSun({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

export function IconCo2({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 18c0-3 2-5 6-5s6 2 6 5" strokeLinecap="round" />
      <ellipse cx="12" cy="10" rx="8" ry="5" />
      <path d="M9 10h.01M15 10h.01" strokeLinecap="round" />
    </svg>
  );
}

export function IconGauge({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 14l4-6" strokeLinecap="round" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}

export function IconWindow({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M12 4v16M4 12h16" />
    </svg>
  );
}

export function IconWall({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 8h18M3 12h18M3 16h18M3 20h12" strokeLinecap="round" />
    </svg>
  );
}

export function IconRoof({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 12l9-8 9 8" strokeLinejoin="round" />
      <path d="M6 12v8h12v-8" />
    </svg>
  );
}

export function IconDraft({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 14c2-4 6-6 10-4s6 6 4 10" strokeLinecap="round" />
    </svg>
  );
}

export function IconFlame({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path
        d="M12 22c4-3 6-6 6-10a6 6 0 0 0-12 0c0 4 2 7 6 10z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M12 22c2-2 3-4 3-6" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeatPump({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="M8 12h8M12 9v6" strokeLinecap="round" />
    </svg>
  );
}

export function IconEv({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 16h14l-1-5H6l-1 5z" strokeLinejoin="round" />
      <circle cx="7" cy="17" r="1.5" fill="currentColor" />
      <circle cx="17" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconCheck({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M5 12l5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRight({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
