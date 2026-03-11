import { useRef } from "react";
import { Camera, MapPin } from "lucide-react";
import type { Mission } from "@/data/missions";

interface ActiveMissionProps {
  mission: Mission;
  onPhotoUpload: (missionId: number, photo: string) => void;
}

const ActiveMission = ({ mission, onPhotoUpload }: ActiveMissionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      // Compress before passing up to avoid localStorage quota issues
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onPhotoUpload(mission.id, canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16 fade-in">
      {/* Mission number */}
      <p className="font-body text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Missão {mission.id} de 8
      </p>

      {/* Title */}
      <h2
        className={`font-heading text-3xl font-bold mb-6 ${
          mission.isSpicy ? "text-accent" : "text-foreground"
        }`}
      >
        {mission.title}
      </h2>

      {/* Clue */}
      <blockquote
        className={`font-heading text-xl font-normal leading-relaxed mb-8 border-l-2 pl-4 italic ${
          mission.isSpicy ? "border-accent text-accent" : "border-foreground text-foreground"
        }`}
      >
        "{mission.clue}"
      </blockquote>

      {/* Location hint */}
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <MapPin size={16} />
        <span className="font-body text-sm">{mission.locationHint}</span>
      </div>

      {/* Challenge */}
      <div className="bg-secondary rounded-lg p-5 mb-8">
        <p className="font-body text-base leading-relaxed text-foreground">
          {mission.challenge}
        </p>
      </div>

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center justify-center gap-3 rounded-lg px-6 py-4 font-body text-base font-semibold transition-all active:scale-95 ${
          mission.isSpicy
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <Camera size={20} />
        Enviar a Tua Prova
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ActiveMission;
