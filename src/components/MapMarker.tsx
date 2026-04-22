import { Lock, Check, Flame } from "lucide-react";

export type MarkerStatus = "locked" | "active" | "completed";

interface MapMarkerProps {
  number: number;
  status: MarkerStatus;
  isSpicy: boolean;
  onClick?: () => void;
}

const MapMarker = ({ number, status, isSpicy, onClick }: MapMarkerProps) => {
  const isClickable = status !== "locked";
  const baseColor = isSpicy ? "accent" : "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable && status !== "locked"}
      className={`group relative flex h-16 w-16 items-center justify-center rounded-full transition-all ${
        isClickable ? "active:scale-90 cursor-pointer" : "cursor-default"
      } ${status === "active" ? "marker-pulse" : ""}`}
      aria-label={`Missão ${number}`}
    >
      {/* Outer ring / shadow */}
      <span
        className={`absolute inset-0 rounded-full ${
          status === "completed"
            ? isSpicy
              ? "bg-accent shadow-md"
              : "bg-primary shadow-md"
            : status === "active"
              ? isSpicy
                ? "bg-accent/15 ring-2 ring-accent"
                : "bg-primary/15 ring-2 ring-primary"
              : "bg-secondary/60 ring-2 ring-dashed ring-border"
        }`}
        style={
          status === "locked"
            ? {
                borderStyle: "dashed",
              }
            : undefined
        }
      />

      {/* Inner content */}
      <span className="relative z-10 flex flex-col items-center justify-center">
        {status === "locked" && (
          <Lock size={18} className="text-muted-foreground opacity-60" />
        )}
        {status === "active" && (
          <span
            className={`font-heading text-2xl font-bold ${
              isSpicy ? "text-accent" : "text-primary"
            }`}
            style={{ transform: "rotate(-8deg)" }}
          >
            ✕
          </span>
        )}
        {status === "completed" && (
          <Check
            size={22}
            className={
              isSpicy ? "text-accent-foreground" : "text-primary-foreground"
            }
            strokeWidth={3}
          />
        )}
      </span>

      {/* Mission number label */}
      <span
        className={`absolute -bottom-6 left-1/2 -translate-x-1/2 font-heading text-xs font-bold tracking-wider ${
          status === "locked" ? "text-muted-foreground/70" : "text-foreground"
        }`}
      >
        {number}
      </span>

      {/* Spicy flame badge */}
      {isSpicy && (
        <span className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow">
          <Flame size={12} />
        </span>
      )}
    </button>
  );
};

export default MapMarker;
