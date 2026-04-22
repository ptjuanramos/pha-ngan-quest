import { X } from "lucide-react";
import { useEffect } from "react";
import type { Mission } from "@/data/missions";
import ActiveMission from "./ActiveMission";

interface MissionSheetProps {
  mission: Mission;
  onClose: () => void;
  onPhotoUpload: (missionId: number, photo: string) => void;
}

const MissionSheet = ({ mission, onClose, onPhotoUpload }: MissionSheetProps) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background fade-in">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground shadow active:scale-90"
      >
        <X size={20} />
      </button>
      <ActiveMission mission={mission} onPhotoUpload={onPhotoUpload} />
    </div>
  );
};

export default MissionSheet;
