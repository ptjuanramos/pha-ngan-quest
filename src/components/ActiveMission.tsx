import { useRef, useState } from "react";
import { Camera, MapPin, Flame, Loader2, Check, RotateCcw, ShieldCheck, FastForward } from "lucide-react";
import type { Mission } from "@/data/missions";
import { validatePhoto } from "@/lib/validatePhoto";
import { useAuth } from "@/contexts/AuthContext";
import { missionsService } from "@/services";

interface ActiveMissionProps {
  mission: Mission;
  onMissionComplete: (missionId: number, photo: string) => void;
  onAdminSkip?: (missionId: number) => void;
}

type Stage = "idle" | "preview" | "uploading" | "validating" | "invalid";

const ActiveMission = ({ mission, onMissionComplete, onAdminSkip }: ActiveMissionProps) => {
  const { isAdmin, playerId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [pendingPhotoId, setPendingPhotoId] = useState<number | null>(null);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);

  const openCamera = () => fileInputRef.current?.click();

  const resetToIdle = () => {
    setStage("idle");
    setPendingPhoto(null);
    setPendingPhotoId(null);
    setInvalidReason(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
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
        setPendingPhoto(canvas.toDataURL("image/jpeg", 0.7));
        setPendingPhotoId(null);
        setStage("preview");
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleValidate = async () => {
    if (!pendingPhoto || !playerId) return;
    setStage("uploading");
    try {
      // 1. Upload photo (if not already uploaded after a previous attempt)
      let photoId = pendingPhotoId;
      if (photoId == null) {
        const upload = await missionsService.uploadPhoto(mission.id, {
          base64Content: pendingPhoto,
        });
        photoId = upload.photoId;
        setPendingPhotoId(photoId);
      }

      // 2. AI validation
      setStage("validating");
      const result = await validatePhoto({
        photo: pendingPhoto,
        missionId: mission.id,
        playerId,
      });

      if (result.valid) {
        // 3a. Complete the mission with the validated photo
        await missionsService.complete(mission.id, { photoId });
        onMissionComplete(mission.id, pendingPhoto);
        resetToIdle();
      } else {
        setInvalidReason(
          result.reason ?? "Não conseguimos validar. Por favor, envia a prova novamente."
        );
        setStage("invalid");
      }
    } catch {
      setInvalidReason("Não conseguimos validar agora. Por favor, envia a prova novamente.");
      setStage("invalid");
    }
  };

  const handleAdminApprove = async () => {
    if (!pendingPhoto || pendingPhotoId == null) return;
    try {
      await missionsService.approvePhoto(mission.id, pendingPhotoId, { approved: true });
      await missionsService.complete(mission.id, { photoId: pendingPhotoId });
      onMissionComplete(mission.id, pendingPhoto);
      resetToIdle();
    } catch {
      setInvalidReason("Não foi possível aprovar a foto. Tenta novamente.");
      setStage("invalid");
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16 fade-in">
      {/* Mission number */}
      <p className="font-body text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Missão {mission.id} de 8
      </p>

      {/* Title */}
      <div className="flex items-center gap-3 mb-6">
        <h2
          className={`font-heading text-3xl font-bold ${
            mission.isSpicy ? "text-accent" : "text-foreground"
          }`}
        >
          {mission.title}
        </h2>
        {mission.isSpicy && (
          <div className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-accent">
            <Flame size={16} />
            <span className="font-body text-xs font-bold">+18</span>
          </div>
        )}
      </div>

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

      {/* Stage UI */}
      {stage === "idle" && (
        <button
          onClick={openCamera}
          className={`flex items-center justify-center gap-3 rounded-lg px-6 py-4 font-body text-base font-semibold transition-all active:scale-95 ${
            mission.isSpicy
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground"
          }`}
        >
          <Camera size={20} />
          Enviar a Tua Prova
        </button>
      )}

      {(stage === "preview" || stage === "validating" || stage === "invalid") &&
        pendingPhoto && (
          <div className="flex flex-col gap-4 fade-in">
            <div className="mx-auto overflow-hidden rounded-lg border border-border">
              <img
                src={pendingPhoto}
                alt="Prova capturada"
                className="mx-auto max-h-[50vh] w-auto max-w-full object-contain"
              />
            </div>

            {stage === "invalid" && (
              <p className="font-body text-center text-sm leading-relaxed text-destructive">
                {invalidReason ?? "Não conseguimos validar. Por favor, envia a prova novamente."}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetToIdle}
                disabled={stage === "validating"}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-4 font-body text-sm font-semibold text-foreground transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <RotateCcw size={16} />
                Tirar Outra
              </button>
              <button
                onClick={handleValidate}
                disabled={stage === "validating"}
                className={`flex flex-[1.4] items-center justify-center gap-2 rounded-lg px-4 py-4 font-body text-base font-semibold transition-all active:scale-95 disabled:active:scale-100 ${
                  stage === "invalid"
                    ? "bg-destructive text-destructive-foreground"
                    : mission.isSpicy
                    ? "bg-accent text-accent-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {stage === "validating" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    A verificar...
                  </>
                ) : stage === "invalid" ? (
                  <>
                    <RotateCcw size={18} />
                    Validar de Novo
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Validar Prova
                  </>
                )}
              </button>
            </div>

            {stage === "invalid" && isAdmin && (
              <button
                onClick={handleAdminApprove}
                className="flex items-center justify-center gap-2 rounded-lg border-2 border-accent bg-accent/10 px-4 py-3 font-body text-sm font-semibold text-accent transition-all active:scale-95"
              >
                <ShieldCheck size={16} />
                Aprovar manualmente (admin)
              </button>
            )}
          </div>
        )}

      {/* Admin: skip mission entirely */}
      {isAdmin && stage === "idle" && onAdminSkip && (
        <button
          onClick={() => onAdminSkip(mission.id)}
          className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-accent/60 bg-transparent px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-accent transition-all active:scale-95"
        >
          <FastForward size={14} />
          Saltar missão (admin)
        </button>
      )}

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
