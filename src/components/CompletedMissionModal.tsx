import { X, Check, Flame } from "lucide-react";
import { useEffect } from "react";
import type { Mission } from "@/data/missions";

interface CompletedMissionModalProps {
  mission: Mission;
  photo: string;
  onClose: () => void;
}

const CompletedMissionModal = ({
  mission,
  photo,
  onClose,
}: CompletedMissionModalProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/60 px-4 fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow active:scale-90"
        >
          <X size={18} />
        </button>

        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={photo}
            alt={`Prova da missão ${mission.id}`}
            className="h-full w-full object-cover"
          />
          <div
            className={`absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full ${
              mission.isSpicy ? "bg-accent" : "bg-primary"
            }`}
          >
            <Check
              size={18}
              className={
                mission.isSpicy ? "text-accent-foreground" : "text-primary-foreground"
              }
              strokeWidth={3}
            />
          </div>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-center gap-2">
            <p className="font-body text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Missão {mission.id}
            </p>
            {mission.isSpicy && (
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-accent">
                <Flame size={10} />
                <span className="font-body text-[10px] font-bold">+18</span>
              </span>
            )}
          </div>
          <h3
            className={`font-heading text-xl font-bold mb-3 ${
              mission.isSpicy ? "text-accent" : "text-foreground"
            }`}
          >
            {mission.title}
          </h3>
          <blockquote
            className={`font-heading text-sm italic leading-relaxed border-l-2 pl-3 ${
              mission.isSpicy
                ? "border-accent text-accent"
                : "border-foreground text-foreground"
            }`}
          >
            "{mission.clue}"
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default CompletedMissionModal;
