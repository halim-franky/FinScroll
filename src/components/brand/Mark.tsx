import { useId } from "react";

/**
 * FinScroll brand mark — single source of truth for every surface that
 * shows the F glyph. The geometry mirrors public/icon.svg (favicon + PWA
 * icon) so the in-app chip, sign-in header, OG images, and app icon all
 * read as the same brand.
 *
 * Two render modes:
 *   <FinScrollMark size="md" />              full SVG with rounded zinc
 *                                            background + emerald glow ring
 *   <FinScrollMark size="md" glyphOnly />    just the F glyph on a
 *                                            transparent background — use
 *                                            when the parent already
 *                                            provides a chip wrapper
 *
 * The four arms (stem + 3 decreasing-length horizontals) are intentional:
 * the F reads as (a) a letter F, (b) a vertical scroll feed of cards, and
 * (c) a chart bar pattern. The "decreasing length" pattern carries the
 * growth concept that the old standalone arrow used to carry.
 */

type MarkSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<MarkSize, number> = {
  sm: 20,
  md: 28,
  lg: 40,
  xl: 64,
};

interface MarkProps {
  size?: MarkSize;
  /** When true, omits the rounded zinc background + glow ring. Use inside
   *  a parent chip container that provides its own visual treatment. */
  glyphOnly?: boolean;
  className?: string;
  /** Accessible name. Set to "" to mark decorative (aria-hidden). */
  title?: string;
}

export function FinScrollMark({
  size = "md",
  glyphOnly = false,
  className,
  title = "FinScroll",
}: MarkProps) {
  const px = SIZE_MAP[size];
  // useId() avoids gradient ID collisions when multiple marks render on the same page
  const uid = useId();
  const bgId = `fsl-bg-${uid}`;
  const accentId = `fsl-accent-${uid}`;
  const decorative = title === "";

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative ? true : undefined}
    >
      {!decorative && <title>{title}</title>}
      <defs>
        {!glyphOnly && (
          <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#09090b" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
        )}
        <linearGradient id={accentId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {!glyphOnly && (
        <>
          <rect width="512" height="512" rx="112" ry="112" fill={`url(#${bgId})`} />
          <rect
            x="20"
            y="20"
            width="472"
            height="472"
            rx="96"
            ry="96"
            fill="none"
            stroke="#10b981"
            strokeOpacity="0.15"
            strokeWidth="2"
          />
        </>
      )}

      <g transform="translate(128 96)">
        <rect x="0" y="0" width="56" height="320" rx="28" ry="28" fill={`url(#${accentId})`} />
        <rect x="0" y="0" width="240" height="56" rx="28" ry="28" fill={`url(#${accentId})`} />
        <rect x="0" y="112" width="184" height="56" rx="28" ry="28" fill={`url(#${accentId})`} />
        <rect x="0" y="224" width="128" height="56" rx="28" ry="28" fill={`url(#${accentId})`} />
      </g>
    </svg>
  );
}
