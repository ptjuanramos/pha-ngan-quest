import { useEffect, useRef } from "react";
import { missions } from "@/data/missions";
import MapMarker, { type MarkerStatus } from "./MapMarker";

interface TreasureMapProps {
  completedCount: number;
  photos: Record<number, string>;
  onMarkerClick: (missionId: number) => void;
}

// Zig-zag positions across the width (percentage from left).
// Mobile-first: keep within 15%-85%.
const POSITIONS = [22, 70, 28, 75, 30, 72, 25, 68];
// Vertical spacing between markers (px)
const VERTICAL_GAP = 140;
const TOP_OFFSET = 220;

const TreasureMap = ({ completedCount, photos, onMarkerClick }: TreasureMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeId = completedCount + 1;
  const totalHeight = TOP_OFFSET + missions.length * VERTICAL_GAP + 160;

  // Build SVG path zig-zagging through markers
  const pathD = missions
    .map((m, i) => {
      const x = POSITIONS[i];
      const y = TOP_OFFSET + i * VERTICAL_GAP + 32; // +32 to hit marker center
      if (i === 0) return `M ${x} ${y}`;
      const prevX = POSITIONS[i - 1];
      const prevY = TOP_OFFSET + (i - 1) * VERTICAL_GAP + 32;
      const midY = (prevY + y) / 2;
      // Curved S-shape between points
      return `C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
    })
    .join(" ");

  // Smooth-scroll to active marker on mount / when it changes
  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-marker-id="${activeId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeId]);

  return (
    <div
      ref={containerRef}
      className="parchment-bg relative w-full overflow-hidden"
      style={{ minHeight: totalHeight }}
    >
      {/* Header */}
      <div className="relative z-10 px-6 pt-10 pb-6 text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          {/* Compass rose */}
          <svg width="32" height="32" viewBox="0 0 32 32" className="text-foreground/70">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="0.8" />
            <path d="M16 4 L18 16 L16 28 L14 16 Z" fill="currentColor" opacity="0.85" />
            <path d="M4 16 L16 14 L28 16 L16 18 Z" fill="currentColor" opacity="0.5" />
            <text x="16" y="3" textAnchor="middle" fontSize="4" fill="currentColor" fontFamily="serif">N</text>
          </svg>
          <p className="font-body text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Mapa do Tesouro
          </p>
        </div>
        <h1 className="font-heading text-4xl font-bold italic text-foreground">
          Ko Pha Ngan
        </h1>
        <div className="mx-auto mt-3 h-px w-16 bg-foreground/30" />
      </div>

      {/* SVG dashed path */}
      <svg
        className="absolute inset-x-0 top-0 z-0"
        width="100%"
        height={totalHeight}
        viewBox={`0 0 100 ${totalHeight}`}
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeWidth="0.4"
          strokeDasharray="1.2 1.2"
          strokeLinecap="round"
          opacity="0.55"
          className="treasure-path"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Decorative palm trees */}
      <svg
        className="absolute left-2 top-32 z-0 opacity-30"
        width="40"
        height="50"
        viewBox="0 0 40 50"
      >
        <path d="M20 50 L20 25" stroke="hsl(var(--foreground))" strokeWidth="1.2" fill="none" />
        <path d="M20 25 Q5 20 2 10 M20 25 Q35 20 38 10 M20 25 Q10 15 8 5 M20 25 Q30 15 32 5" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" />
      </svg>
      <svg
        className="absolute right-3 top-1/2 z-0 opacity-25"
        width="36"
        height="46"
        viewBox="0 0 40 50"
      >
        <path d="M20 50 L20 25" stroke="hsl(var(--foreground))" strokeWidth="1.2" fill="none" />
        <path d="M20 25 Q5 20 2 10 M20 25 Q35 20 38 10 M20 25 Q10 15 8 5 M20 25 Q30 15 32 5" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" />
      </svg>
      {/* Wave decoration */}
      <svg
        className="absolute left-4 top-2/3 z-0 opacity-25"
        width="60"
        height="20"
        viewBox="0 0 60 20"
      >
        <path d="M0 10 Q15 0 30 10 T60 10" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" />
        <path d="M0 16 Q15 6 30 16 T60 16" stroke="hsl(var(--foreground))" strokeWidth="0.8" fill="none" />
      </svg>

      {/* Markers */}
      <div className="relative z-10">
        {missions.map((mission, i) => {
          const isCompleted = !!photos[mission.id];
          const isActive = mission.id === activeId;
          const status: MarkerStatus = isCompleted
            ? "completed"
            : isActive
              ? "active"
              : "locked";

          return (
            <div
              key={mission.id}
              data-marker-id={mission.id}
              className="absolute"
              style={{
                top: TOP_OFFSET + i * VERTICAL_GAP,
                left: `${POSITIONS[i]}%`,
                transform: "translateX(-50%)",
              }}
            >
              <MapMarker
                number={mission.id}
                status={status}
                isSpicy={mission.isSpicy}
                onClick={() => onMarkerClick(mission.id)}
              />
            </div>
          );
        })}
      </div>

      {/* Treasure chest at the end */}
      <div
        className="absolute z-10 left-1/2 -translate-x-1/2"
        style={{ top: TOP_OFFSET + missions.length * VERTICAL_GAP + 20 }}
      >
        <div className="flex flex-col items-center gap-2">
          <svg width="56" height="48" viewBox="0 0 56 48">
            <path
              d="M6 18 Q6 6 28 6 Q50 6 50 18 L50 20 L6 20 Z"
              fill="hsl(var(--accent) / 0.85)"
              stroke="hsl(var(--foreground))"
              strokeWidth="1.2"
            />
            <rect
              x="6"
              y="20"
              width="44"
              height="22"
              fill="hsl(var(--accent) / 0.6)"
              stroke="hsl(var(--foreground))"
              strokeWidth="1.2"
            />
            <rect x="25" y="24" width="6" height="10" fill="hsl(var(--foreground))" />
            <circle cx="28" cy="29" r="1.5" fill="hsl(var(--accent))" />
          </svg>
          <span className="font-heading text-xs italic text-muted-foreground">
            O tesouro espera-te
          </span>
        </div>
      </div>
    </div>
  );
};

export default TreasureMap;
